// Heat Planner UI. Talks to the ADK agent API (/apps, /run_sse) and the
// map data endpoints (/api/*) served by app/main.py.

const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined) n.append(kid);
  return n;
};

const state = {
  cfg: null,
  uid: localStorage.getItem("heatPlannerUser") || `planner-${Math.random().toString(36).slice(2, 10)}`,
  sid: null,
  city: null,
  layer: "offset_f",
  count: 3,
  tracts: null,
  sites: null,        // { selected_sites, passed_over, ... }
  selected: 0,
  audit: null,
  busy: false,
  wantProposal: false,
  map: null,
};
try { localStorage.setItem("heatPlannerUser", state.uid); } catch (_) { /* private mode */ }

// ------------------------------------------------------------------ helpers

async function getJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail || detail; } catch (_) { /* not json */ }
    throw new Error(detail);
  }
  return res.json();
}

const fmtSigned = (v, unit = "°F") =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}${unit}`;
const fmtNum = (v, suffix = "") => (v === null || v === undefined ? "—" : `${Number(v).toLocaleString()}${suffix}`);

const FEATURE_NAMES = {
  northing_km: "North–south position",
  easting_km: "East–west position",
  latitude: "Latitude",
  longitude: "Longitude",
};
const humanFeature = (f) => FEATURE_NAMES[f] || f.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function parseDriver(s) {
  // "impervious_surface (+1.45°F)" -> { name, value }
  const m = /^(.*?)\s*\(([+-]?\d+(?:\.\d+)?)°F\)\s*$/.exec(s || "");
  return m ? { name: humanFeature(m[1].trim()), value: parseFloat(m[2]) } : { name: s, value: null };
}

// Minimal, safe markdown: escape first, then add a small set of formatting.
function md(src) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = (src || "").replace(/\r/g, "").split("\n");
  const out = [];
  let list = null;
  let para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara(); flushList();
      const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
      let html = "<table><thead><tr>" + cells(line).map((c) => `<th>${c}</th>`).join("") + "</tr></thead><tbody>";
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        html += "<tr>" + cells(lines[i]).map((c) => `<td>${c}</td>`).join("") + "</tr>";
        i++;
      }
      i--;
      out.push(html + "</tbody></table>");
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (h) { flushPara(); flushList(); out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`); }
    else if (ul || ol) {
      flushPara();
      const kind = ul ? "ul" : "ol";
      if (list !== kind) { flushList(); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
    } else if (!line.trim()) { flushPara(); flushList(); }
    else { flushList(); para.push(line.trim()); }
  }
  flushPara(); flushList();
  return out.join("");
}

// ------------------------------------------------------------------ colors

const RAMPS = {
  heat: ["#1A2D3E", "#2B3242", "#5A3832", "#9A3412", "#EA580C", "#FDBA74"],
  cool: ["#1A2D3E", "#1B3A5C", "#1D4E89", "#2563EB", "#60A5FA", "#BFDBFE"],
};
const LAYERS = {
  offset_f: { title: "Predicted heat offset by tract", sub: "How much hotter each tract runs than the city average on the campaign day", ramp: "heat", unit: "°F", signed: true },
  no_vehicle_pct: { title: "Households without a car", sub: "Share of households in each tract with no vehicle", ramp: "cool", unit: "%" },
  share_65_plus_pct: { title: "Residents aged 65+", sub: "Share of each tract’s residents aged 65 and older (ACS 2020 5-year)", ramp: "cool", unit: "%" },
};

function makeScale(features, key) {
  const vals = features.map((f) => f.properties[key]).filter((v) => typeof v === "number").sort((a, b) => a - b);
  if (!vals.length) return { color: () => "#1A2530", min: null, max: null };
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const breaks = [q(1 / 6), q(2 / 6), q(3 / 6), q(4 / 6), q(5 / 6)];
  const ramp = RAMPS[LAYERS[key].ramp];
  return {
    color: (v) => (typeof v !== "number" ? "#1A2530" : ramp[breaks.filter((b) => v >= b).length]),
    min: vals[0], max: vals[vals.length - 1], ramp,
  };
}

// ------------------------------------------------------------------ map views

function featureCenter(f) {
  const ring = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
  let x = 0, y = 0;
  ring.forEach(([lon, lat]) => { x += lon; y += lat; });
  return { lon: x / ring.length, lat: y / ring.length };
}

class SvgMap {
  constructor(host) {
    this.host = host;
    this.ns = "http://www.w3.org/2000/svg";
    this.svg = document.createElementNS(this.ns, "svg");
    this.svg.setAttribute("aria-hidden", "false");
    this.svg.setAttribute("role", "group");
    this.svg.setAttribute("aria-label", "Tract map");
    this.gTracts = this.g(); this.gReach = this.g(); this.gPins = this.g();
    host.append(this.svg);
  }
  g() { const g = document.createElementNS(this.ns, "g"); this.svg.append(g); return g; }
  // Projected units are thousandths of a degree: very small viewBox units can fail to paint.
  project(lon, lat) { return [(lon - this.minLon) * this.kx * 1000, (this.maxLat - lat) * 1000]; }
  setTracts(fc, onClick) {
    const all = [];
    fc.features.forEach((f) => {
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      polys.forEach((p) => p.forEach((ring) => ring.forEach((pt) => all.push(pt))));
    });
    this.minLon = Math.min(...all.map((p) => p[0])); const maxLon = Math.max(...all.map((p) => p[0]));
    this.minLat = Math.min(...all.map((p) => p[1])); this.maxLat = Math.max(...all.map((p) => p[1]));
    this.kx = Math.cos(((this.minLat + this.maxLat) / 2) * Math.PI / 180);
    const w = (maxLon - this.minLon) * this.kx * 1000, h = (this.maxLat - this.minLat) * 1000;
    const pad = Math.max(w, h) * 0.03;
    this.svg.setAttribute("viewBox", `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`);
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    this.unit = h; // projected height, for sizing pins
    this.gTracts.replaceChildren();
    this.paths = fc.features.map((f) => {
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      const d = polys.map((p) => p.map((ring) => "M" + ring.map(([lon, lat]) => this.project(lon, lat).map((n) => n.toFixed(2)).join(",")).join("L") + "Z").join("")).join("");
      const path = document.createElementNS(this.ns, "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "tract");
      path.setAttribute("fill-rule", "evenodd");
      path.addEventListener("click", () => onClick(f));
      this.gTracts.append(path);
      return { f, path };
    });
  }
  style(colorFor) { (this.paths || []).forEach(({ f, path }) => path.setAttribute("fill", colorFor(f))); }
  setSites(sites, selected, reachKm, onPick) {
    this.gReach.replaceChildren(); this.gPins.replaceChildren();
    const r = this.unit / 55;
    sites.forEach((s, i) => {
      const [x, y] = this.project(s.coordinates.longitude, s.coordinates.latitude);
      const ring = document.createElementNS(this.ns, "circle");
      ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", (reachKm / 111) * 1000);
      ring.setAttribute("class", "reach");
      this.gReach.append(ring);
      const g = document.createElementNS(this.ns, "g");
      g.setAttribute("class", "pin"); g.setAttribute("tabindex", "0"); g.setAttribute("role", "button");
      g.setAttribute("aria-label", `Site ${i + 1}, tract ${s.census_tract}`);
      const face = document.createElementNS(this.ns, "circle");
      face.setAttribute("class", "face");
      face.setAttribute("cx", x); face.setAttribute("cy", y); face.setAttribute("r", i === selected ? r * 1.3 : r);
      face.setAttribute("fill", "#F8FAFC"); face.setAttribute("stroke", i === selected ? "#FB923C" : "#0B1620");
      const t = document.createElementNS(this.ns, "text");
      t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("fill", "#0B1620");
      t.setAttribute("font-size", r * 1.1); t.textContent = String(i + 1);
      g.append(face, t);
      g.addEventListener("click", () => onPick(i));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(i); } });
      this.gPins.append(g);
    });
  }
  setProbe(lat, lon) {
    this.probe?.remove();
    const [x, y] = this.project(lon, lat);
    const c = document.createElementNS(this.ns, "rect");
    const s = this.unit / 70;
    c.setAttribute("x", x - s); c.setAttribute("y", y - s); c.setAttribute("width", 2 * s); c.setAttribute("height", 2 * s);
    c.setAttribute("transform", `rotate(45 ${x} ${y})`); c.setAttribute("fill", "#60A5FA"); c.setAttribute("stroke", "#F8FAFC");
    this.gPins.append(c); this.probe = c;
  }
  panTo() { /* fixed extent */ }
}

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0E1A24" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#A8B6C4" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B1620" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#22364A" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3A5168" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0B2540" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

class GoogleMap {
  constructor(host, center) {
    this.map = new google.maps.Map(host, {
      center: { lat: center.lat, lng: center.lon }, zoom: 11, styles: DARK_STYLE,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true, clickableIcons: false,
    });
    this.overlays = [];
  }
  setTracts(fc, onClick) {
    this.map.data.forEach((f) => this.map.data.remove(f));
    this.map.data.addGeoJson(fc);
    this.map.data.addListener("click", (e) => {
      const props = {}; e.feature.forEachProperty((v, k) => { props[k] = v; });
      onClick({ properties: props, latLng: e.latLng });
    });
  }
  style(colorFor) {
    this.map.data.setStyle((feature) => {
      const props = {}; feature.forEachProperty((v, k) => { props[k] = v; });
      return { fillColor: colorFor({ properties: props }), fillOpacity: 0.72, strokeColor: "#070F16", strokeWeight: 0.6 };
    });
  }
  setSites(sites, selected, reachKm, onPick) {
    this.overlays.forEach((o) => o.setMap(null)); this.overlays = [];
    sites.forEach((s, i) => {
      const pos = { lat: s.coordinates.latitude, lng: s.coordinates.longitude };
      this.overlays.push(new google.maps.Circle({
        map: this.map, center: pos, radius: reachKm * 1000, clickable: false,
        strokeColor: "#FDBA74", strokeOpacity: 0.85, strokeWeight: 1.5, fillColor: "#FB923C", fillOpacity: 0.1,
      }));
      const m = new google.maps.Marker({
        map: this.map, position: pos, title: `Site ${i + 1}`,
        label: { text: String(i + 1), color: "#0B1620", fontWeight: "700" },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: i === selected ? 15 : 12, fillColor: "#F8FAFC", fillOpacity: 1,
          strokeColor: i === selected ? "#FB923C" : "#0B1620", strokeWeight: i === selected ? 4 : 2 },
      });
      m.addListener("click", () => onPick(i));
      this.overlays.push(m);
    });
  }
  setProbe(lat, lon) {
    this.probe?.setMap(null);
    this.probe = new google.maps.Marker({
      map: this.map, position: { lat, lng: lon }, title: "Location asked about",
      icon: { path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: "#60A5FA", fillOpacity: 1, strokeColor: "#F8FAFC", strokeWeight: 1.5 },
    });
  }
  panTo(lat, lon) { this.map.panTo({ lat, lng: lon }); }
}

function loadGoogleMaps(key) {
  return new Promise((resolve, reject) => {
    window.__mapsReady = resolve;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&callback=__mapsReady`;
    s.async = true; s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.append(s);
    setTimeout(() => reject(new Error("Google Maps timed out")), 10000);
  });
}

// ------------------------------------------------------------------ map wiring

function colorFor(f) { return state.scale.color(f.properties[state.layer]); }

function renderLayer() {
  const L = LAYERS[state.layer];
  $("#mapTitle").textContent = `${state.city}: ${L.title.charAt(0).toLowerCase()}${L.title.slice(1)}`;
  $("#mapSub").textContent = L.sub;
  document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.layer === state.layer)));
  if (!state.tracts) return;
  state.scale = makeScale(state.tracts.features, state.layer);
  state.map.style(colorFor);
  const fmt = (v) => (L.signed ? fmtSigned(v) : `${Number(v).toFixed(0)}${L.unit}`);
  $("#legend").replaceChildren(
    el("span", { text: fmt(state.scale.min) }),
    el("span", { class: "ramp", "aria-hidden": "true" }, state.scale.ramp.map((c) => el("span", { style: `background:${c}` }))),
    el("span", { text: fmt(state.scale.max) }),
    el("span", { class: "note", text: `Rings: ${(state.cfg.minSpacingKm / 2).toFixed(1)} km straight-line reach` }),
  );
}

function renderSitesOnMap() {
  const list = state.sites?.selected_sites || [];
  state.map.setSites(list, state.selected, state.cfg.minSpacingKm / 2, (i) => { state.selected = i; renderSitesOnMap(); renderSitePanel(); });
}

function showTract(f) {
  const p = f.properties;
  const card = $("#tractCard");
  const center = f.geometry ? featureCenter(f) : { lat: f.latLng.lat(), lon: f.latLng.lng() };
  card.replaceChildren(
    el("h2", { text: `Tract ${p.geo_id}` }),
    el("dl", {},
      el("dt", { text: "Heat offset" }), el("dd", { text: fmtSigned(p.offset_f) }),
      el("dt", { text: "No car" }), el("dd", { text: fmtNum(p.no_vehicle_pct, "%") }),
      el("dt", { text: "Poverty" }), el("dd", { text: fmtNum(p.poverty_pct, "%") }),
      el("dt", { text: "Age 65+" }), el("dd", { text: fmtNum(p.share_65_plus_pct, "%") }),
      el("dt", { text: "Population" }), el("dd", { text: fmtNum(p.population) })),
    el("div", { class: "row" },
      el("button", { type: "button", class: "primary", text: "Ask why", onclick: () => {
        card.hidden = true;
        send(`Why does tract ${p.geo_id} (around ${center.lat.toFixed(4)}, ${center.lon.toFixed(4)}) run ${p.offset_f >= 0 ? "hotter" : "cooler"} than the city average?`);
      } }),
      el("button", { type: "button", text: "Close", onclick: () => { card.hidden = true; } })),
  );
  card.hidden = false;
}

// ------------------------------------------------------------------ panels

function renderSitePanel() {
  const panel = $("#panel-site");
  const data = state.sites;
  if (!data) { panel.replaceChildren(el("p", { class: "empty", text: "Loading sites…" })); return; }
  const list = data.selected_sites || [];
  if (!list.length) { panel.replaceChildren(el("p", { class: "empty", text: "No sites yet. Ask the planner where cooling centers should go." })); return; }
  const s = list[Math.min(state.selected, list.length - 1)];
  const drivers = (s.key_heat_drivers || []).map(parseDriver);
  const maxAbs = Math.max(0.01, ...drivers.map((d) => Math.abs(d.value || 0)));
  const off = s.predicted_temp_offset_f;

  panel.replaceChildren(...[
    el("div", { class: "site-picker", role: "group", "aria-label": "Choose a site" },
      list.map((x, i) => el("button", {
        type: "button", "aria-pressed": String(i === state.selected),
        onclick: () => { state.selected = i; renderSitesOnMap(); renderSitePanel(); },
      }, el("span", { class: "num", text: String(i + 1) }), `Tract ${x.census_tract}`))),
    el("div", { class: "site-grid" },
      el("div", {},
        el("div", { class: `big${off < 0 ? " cool" : ""}`, text: fmtSigned(off) }),
        el("div", { class: "caption", text: "vs. city average on the campaign day (model prediction)" }),
        el("ul", { class: "drivers", "aria-label": "Top drivers from EXPLAIN_PREDICT" },
          drivers.map((d) => el("li", {},
            el("span", { text: d.name }),
            el("span", { class: "bar", "aria-hidden": "true" },
              el("span", { style: `width:${Math.round((Math.abs(d.value || 0) / maxAbs) * 100)}%;background:${(d.value || 0) < 0 ? "var(--cool)" : "var(--heat)"}` })),
            el("span", { class: "val", text: d.value === null ? "" : fmtSigned(d.value) })))),
        s.spacing_warning ? el("p", { class: "warn", text: "This site overlaps another site’s reach: not enough well-spaced candidates." }) : null),
      el("div", {},
        el("dl", { class: "stats" },
          el("div", {}, el("dt", { text: "Population" }), el("dd", { text: fmtNum(s.population) })),
          el("div", {}, el("dt", { text: "No car" }), el("dd", { text: fmtNum(s.no_vehicle_rate_pct, "%") })),
          el("div", {}, el("dt", { text: "Poverty" }), el("dd", { text: fmtNum(s.poverty_rate_pct, "%") })),
          el("div", {}, el("dt", { text: "Median age" }), el("dd", { text: fmtNum(s.median_age) }))),
        el("div", { class: "links" },
          s.google_maps_link ? el("a", { href: s.google_maps_link, target: "_blank", rel: "noopener", text: "Open in Google Maps" }) : null,
          s.walking_directions_link ? el("a", { href: s.walking_directions_link, target: "_blank", rel: "noopener", text: "Walking directions" }) : null))),
    (data.passed_over || []).length
      ? el("div", { class: "passed" },
          el("h2", { text: "Passed over" }),
          el("ul", {}, data.passed_over.map((p) => el("li", { text: `Tract ${p.census_tract}: ${p.why_passed_over}` }))))
      : null,
    data.note ? el("p", { class: "warn", text: data.note }) : null,
  ].filter(Boolean));
}

function num(v) { const m = /-?[\d,.]+/.exec(String(v)); return m ? parseFloat(m[0].replace(/,/g, "")) : null; }

function renderAudit() {
  const panel = $("#panel-audit");
  const a = state.audit;
  if (!a) { panel.replaceChildren(el("p", { class: "empty", text: "The audit runs once sites are chosen." })); return; }
  if (a.error) { panel.replaceChildren(el("p", { class: "empty", text: a.error })); return; }
  const t = a.comparison_table;
  const pass = /^PASS/.test(a.audit_verdict || "");
  panel.replaceChildren(
    el("div", { class: `verdict${pass ? "" : " note"}` },
      el("strong", { text: pass ? "Our sites skew toward need" : "Our sites don’t clearly skew toward need" }),
      el("span", { text: `${fmtNum(a.total_population_served)} residents in ${a.num_tracts_evaluated} tract(s)` }),
      a.equity_ratio ? el("span", { text: `Poverty ×${a.equity_ratio.poverty_exposure_multiplier} · no car ×${a.equity_ratio.transit_dependent_multiplier} vs. city` }) : null),
    el("div", { class: "audit" },
      el("div", { class: "key" }, el("span", { text: "Our sites’ tracts" }), el("span", { class: "city", text: `${state.city} average` })),
      t.metric.map((m, i) => {
        const ours = num(t.recommended_sites_avg[i]); const city = num(t.citywide_average[i]);
        const max = Math.max(ours || 0, city || 0, 1e-9);
        const line = (label, val, raw, color) => el("div", { class: "line" },
          el("span", { text: label }),
          el("span", { class: "bar", "aria-hidden": "true" }, el("span", { style: `width:${val === null ? 0 : Math.round((val / max) * 100)}%;background:${color}` })),
          el("span", { class: "val", text: raw }));
        return el("div", { class: "metric" },
          el("strong", { text: m }),
          el("div", { class: "pair" },
            line("Our sites", ours, t.recommended_sites_avg[i], "var(--heat)"),
            line("City", city, t.citywide_average[i], "#7C8DA0")));
      })),
    el("p", { class: "caption", text: "Race is never a model input. Checking the output against who lives there is the audit." }),
  );
}

async function refreshAudit() {
  const ids = (state.sites?.selected_sites || []).map((s) => s.census_tract).filter(Boolean);
  if (!ids.length) { state.audit = null; renderAudit(); return; }
  try { state.audit = await getJSON(`/api/audit?ids=${ids.join(",")}`); }
  catch (e) { state.audit = { error: `Couldn’t run the audit: ${e.message}` }; }
  renderAudit();
}

async function loadSites() {
  $("#count").textContent = state.count;
  $("#dec").disabled = state.count <= 1; $("#inc").disabled = state.count >= 5;
  try {
    state.sites = await getJSON(`/api/sites?count=${state.count}`);
    state.selected = Math.min(state.selected, state.count - 1);
  } catch (e) {
    state.sites = { selected_sites: [], passed_over: [], note: `Couldn’t load sites: ${e.message}` };
  }
  renderSitesOnMap(); renderSitePanel(); refreshAudit(); renderSuggestions();
}

function selectTab(name) {
  ["site", "audit", "proposal"].forEach((n) => {
    const on = n === name;
    const tab = $(`#tab-${n}`);
    tab.setAttribute("aria-selected", String(on)); tab.tabIndex = on ? 0 : -1;
    $(`#panel-${n}`).hidden = !on;
    if (on) tab.querySelector(".badge")?.remove();
  });
}
function badge(name) { const t = $(`#tab-${name}`); if (t.getAttribute("aria-selected") !== "true" && !t.querySelector(".badge")) t.append(el("span", { class: "badge", "aria-label": "updated" })); }

// ------------------------------------------------------------------ chat

const TOOL_LABELS = {
  geocode_address: "Finding the address (Google Geocoding)",
  reverse_geocode_location: "Naming the street (Google Geocoding)",
  predict_heat_offset: "Predicting the offset (BigQuery ML EXPLAIN_PREDICT)",
  select_cooling_center_sites: "Choosing non-overlapping sites (BQML + census)",
  rank_candidate_sites: "Ranking tracts (BQML + census)",
  analyze_heat_frequency: "Reading 7 years of station history",
  audit_equity: "Auditing who the sites reach",
  tract_profile: "Tract profile (MCP Toolbox)",
  vulnerable_population: "Who lives nearby (MCP Toolbox)",
  city_heat_days_by_year: "Hot days per year (MCP Toolbox)",
  site_hot_days: "Hot days at this offset (MCP Toolbox)",
  climate_modeler: "Handing off to the climate modeler",
  equity_auditor: "Handing off to the equity auditor",
  transfer_to_agent: "Handing off to a specialist",
};

function addMessage(kind, who, ...content) {
  const node = el("div", { class: `msg ${kind}` }, who ? el("div", { class: "who", text: who }) : null, ...content);
  $("#messages").append(node);
  node.scrollIntoView({ block: "end", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return node;
}

function unwrapResponse(r) {
  if (r && typeof r === "object" && Object.keys(r).length === 1 && "result" in r) return r.result;
  return r;
}

function onToolResult(name, res) {
  if (!res || res.error) return;
  if (name === "select_cooling_center_sites" && res.selected_sites) {
    state.sites = res; state.count = res.selected_sites.length; state.selected = 0;
    $("#count").textContent = state.count;
    renderSitesOnMap(); renderSitePanel(); refreshAudit(); renderSuggestions(); badge("site");
  } else if (name === "predict_heat_offset" && typeof res.latitude === "number") {
    state.map.setProbe(res.latitude, res.longitude); state.map.panTo(res.latitude, res.longitude);
  } else if (name === "geocode_address" && typeof res.latitude === "number") {
    state.map.panTo(res.latitude, res.longitude);
  } else if (name === "audit_equity" && res.comparison_table) {
    state.audit = res; renderAudit(); badge("audit");
  }
}

function setBusy(b) {
  state.busy = b;
  $("#askBtn").disabled = b; $("#askInput").disabled = b; $("#draftBtn").disabled = b;
  document.querySelectorAll("#suggest button").forEach((x) => { x.disabled = b; });
}

async function send(text) {
  text = text.trim();
  if (!text || state.busy) return;
  addMessage("user", "Planner", el("div", { class: "bubble", text }));
  $("#askInput").value = "";

  if (state.city !== state.cfg.city) {
    addMessage("agent refusal", "Heat Planner · declined to guess",
      el("div", { class: "body", text: `I don’t have ${state.city}’s heat data loaded, so I can’t predict offsets there. ${state.cfg.city}’s model doesn’t transfer: offsets are relative to each city’s own average.` }),
      el("button", { type: "button", class: "primary", text: `Switch back to ${state.cfg.city}`, onclick: () => pickCity(state.cfg.city) }));
    return;
  }
  if (!state.sid) { addMessage("agent error", "Heat Planner", el("div", { class: "body", text: "The agent isn’t connected. Reload the page; if it persists, check the server logs." })); return; }

  setBusy(true);
  const trace = el("ol", { class: "trace", "aria-label": "Tools the agent used" });
  const thinking = el("div", { class: "thinking" }, el("span", { class: "spin", "aria-hidden": "true" }), "Working on it");
  const body = el("div", { class: "body" });
  const msg = addMessage("agent", "Heat Planner", trace, thinking, body);
  trace.hidden = true;
  const steps = new Map();
  let answer = "";

  const handle = (ev) => {
    if (ev.error || ev.errorMessage || ev.error_message) {
      body.append(el("p", { class: "warn", text: `Agent error: ${ev.error || ev.errorMessage || ev.error_message}` }));
      return;
    }
    const parts = ev.content?.parts || [];
    for (const p of parts) {
      const call = p.functionCall || p.function_call;
      const resp = p.functionResponse || p.function_response;
      if (call) {
        trace.hidden = false;
        const li = el("li", {}, el("span", { class: "spin", "aria-hidden": "true" }),
          el("span", { class: "tool", text: call.name === "transfer_to_agent" ? `→ ${call.args?.agent_name || "specialist"}` : call.name }),
          el("span", { class: "what", text: TOOL_LABELS[call.name] || "" }),
          el("span", { class: "state", text: "running" }));
        trace.append(li); steps.set(call.id || call.name, li);
      } else if (resp) {
        const li = steps.get(resp.id || resp.name);
        if (li) {
          li.firstChild.replaceWith(el("span", { class: "tick", "aria-hidden": "true", text: "✓" }));
          li.querySelector(".state").textContent = "done";
        }
        onToolResult(resp.name, unwrapResponse(resp.response));
      } else if (typeof p.text === "string" && !ev.partial && !p.thought) {
        answer += (answer ? "\n\n" : "") + p.text;
        body.innerHTML = md(answer);
      }
    }
  };

  try {
    const res = await fetch("/run_sse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: state.cfg.appName, userId: state.uid, sessionId: state.sid,
        newMessage: { role: "user", parts: [{ text }] }, streaming: false,
      }),
    });
    if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = chunk.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
        if (data) { try { handle(JSON.parse(data)); } catch (_) { /* ignore keep-alives */ } }
      }
    }
    if (!answer) body.append(el("p", { class: "warn", text: "No answer came back. Try rephrasing the question." }));
  } catch (e) {
    body.append(el("p", { class: "warn", text: `Couldn’t reach the agent (${e.message}). Check that the service is running.` }));
    msg.classList.add("error");
  } finally {
    thinking.remove();
    setBusy(false);
    if (state.wantProposal && answer) {
      state.wantProposal = false;
      const doc = $("#proposalDoc"); doc.innerHTML = md(answer); doc.hidden = false;
      $("#printBtn").disabled = false;
      selectTab("proposal");
    }
  }
}

function renderSuggestions() {
  const picked = state.sites?.selected_sites || [];
  const first = picked[0];
  const qs = [
    `Where should ${state.count} cooling centers go?`,
    `How often does ${state.cfg.city} reach 95°F?`,
    first ? `Who lives within 1 km of site 1 (${first.coordinates.latitude}, ${first.coordinates.longitude})?` : null,
    picked.length ? `Run the equity audit on tracts ${picked.map((x) => x.census_tract).join(", ")}` : null,
  ].filter(Boolean);
  $("#suggest").replaceChildren(...qs.map((q) => el("button", { type: "button", text: q, onclick: () => send(q) })));
}

// ------------------------------------------------------------------ city

function buildCityMenu() {
  const menu = $("#cityMenu");
  const item = (name, note, loaded) => el("button", {
    type: "button", "aria-current": String(state.city === name), onclick: () => pickCity(name),
  }, el("span", { class: `pip${loaded ? " on" : ""}`, "aria-hidden": "true" }), el("span", {}, name, el("small", { text: note })));
  menu.replaceChildren(
    el("h2", { text: "Loaded" }),
    item(state.cfg.city, "Ready", true),
    el("h2", { text: "Available, not loaded" }),
    ...state.cfg.availableCities.map((c) => item(c.name, c.note, false)),
    el("p", { class: "menu-note", text: "Offsets are relative to each city’s own average, so every city needs its own data load and model check." }),
  );
}

function toggleCityMenu(open) {
  const btn = $("#cityBtn");
  const isOpen = open ?? btn.getAttribute("aria-expanded") !== "true";
  btn.setAttribute("aria-expanded", String(isOpen));
  $("#cityMenu").hidden = !isOpen;
  if (isOpen) $("#cityMenu button")?.focus();
}

function pickCity(name) {
  state.city = name;
  $("#cityName").textContent = name;
  toggleCityMenu(false);
  buildCityMenu();
  const loaded = name === state.cfg.city;
  const overlay = $("#mapOverlay");
  overlay.hidden = loaded;
  if (!loaded) {
    overlay.replaceChildren(el("div", {},
      el("strong", { text: `No data loaded for ${name}` }),
      el("span", { text: "The agent won’t predict here until this city’s readings are loaded and the model is checked." })));
  }
  renderLayer();
  $("#cityBtn").focus();
}

// ------------------------------------------------------------------ boot

async function init() {
  try {
    state.cfg = await getJSON("/api/config");
  } catch (e) {
    $("#statusText").textContent = "Server unreachable"; $("#statusDot").className = "dot down";
    return;
  }
  state.city = state.cfg.city;
  $("#cityName").textContent = state.city;
  $("#mockBanner").hidden = !state.cfg.mock;
  document.title = `Heat Planner: ${state.city}`;
  buildCityMenu(); renderSuggestions(); renderSitePanel(); renderAudit();

  // Agent session
  try {
    const s = await getJSON(`/apps/${encodeURIComponent(state.cfg.appName)}/users/${encodeURIComponent(state.uid)}/sessions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    state.sid = s.id;
    $("#statusText").textContent = "Agent connected"; $("#statusDot").className = "dot live";
  } catch (e) {
    $("#statusText").textContent = "Agent unavailable"; $("#statusDot").className = "dot down";
  }

  addMessage("agent", "Heat Planner", el("div", { class: "body" },
    el("p", { text: `Ask where ${state.city}’s cooling centers should go, ask about a street, or click a tract on the map.` })));

  // Map
  const host = $("#map");
  try {
    state.tracts = await getJSON("/api/tracts");
  } catch (e) {
    host.replaceChildren(el("p", { class: "empty", style: "padding:24px", text: `The tract map didn’t load: ${e.message}` }));
  }
  const center = state.tracts?.center || { lat: 33.749, lon: -84.388 };
  if (state.cfg.mapsKey) {
    try { await loadGoogleMaps(state.cfg.mapsKey); state.map = new GoogleMap(host, center); }
    catch (_) { state.map = new SvgMap(host); }
  } else {
    state.map = new SvgMap(host);
  }
  if (state.tracts) state.map.setTracts(state.tracts, showTract);
  renderLayer();
  await loadSites();

  getJSON("/api/frequency?threshold=95").then((f) => {
    if (typeof f.average_annual_days_above_threshold === "number") {
      const chip = $("#freqChip");
      chip.textContent = `${f.average_annual_days_above_threshold} station-days ≥95°F per summer`;
      chip.hidden = false;
    }
  }).catch(() => {});
}

// Events
$("#askForm").addEventListener("submit", (e) => { e.preventDefault(); send($("#askInput").value); });
document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { state.layer = b.dataset.layer; renderLayer(); }));
$("#dec").addEventListener("click", () => { state.count = Math.max(1, state.count - 1); renderSuggestions(); loadSites(); });
$("#inc").addEventListener("click", () => { state.count = Math.min(5, state.count + 1); renderSuggestions(); loadSites(); });
$("#cityBtn").addEventListener("click", () => toggleCityMenu());
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#cityMenu").hidden) { toggleCityMenu(false); $("#cityBtn").focus(); } });
document.addEventListener("click", (e) => { if (!e.target.closest(".city")) toggleCityMenu(false); });
document.querySelectorAll('[role="tab"]').forEach((t) => {
  t.addEventListener("click", () => selectTab(t.id.replace("tab-", "")));
  t.addEventListener("keydown", (e) => {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const i = tabs.indexOf(t);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next.id.replace("tab-", "")); next.focus();
    }
  });
});
$("#draftBtn").addEventListener("click", () => {
  const ids = (state.sites?.selected_sites || []).map((s) => s.census_tract);
  state.wantProposal = true;
  send(`Draft the council proposal for these ${ids.length} cooling-center sites: tracts ${ids.join(", ")}. Run the equity audit on them and include the result.`);
});
$("#printBtn").addEventListener("click", () => window.print());

init();
