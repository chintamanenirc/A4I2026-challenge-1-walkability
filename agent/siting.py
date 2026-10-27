"""Pure site-selection logic (no BigQuery), shared by the agent tools and the UI server."""

import math
from typing import Any, Dict, List


def _distance_km(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    """Straight-line (haversine) distance between two ranked sites, in km."""
    la1, lo1 = math.radians(a["coordinates"]["latitude"]), math.radians(a["coordinates"]["longitude"])
    la2, lo2 = math.radians(b["coordinates"]["latitude"]), math.radians(b["coordinates"]["longitude"])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(h))


def spread_sites(candidates: List[Dict[str, Any]], count: int, min_spacing_km: float) -> Dict[str, Any]:
    """Greedy pick: walk the ranked list, skip any site within min_spacing_km of one already picked."""
    picked: List[Dict[str, Any]] = []
    passed: List[Dict[str, Any]] = []
    for cand in candidates:
        if len(picked) >= count:
            break
        near = [(p, _distance_km(cand, p)) for p in picked]
        clash = [(p, d) for p, d in near if d < min_spacing_km]
        if clash:
            p, d = min(clash, key=lambda x: x[1])
            passed.append({**cand, "why_passed_over": (
                f"Within {d:.1f} km (straight-line) of site {p['site_number']}, "
                "so most of its residents are already within reach."
            )})
            continue
        picked.append({**cand, "site_number": len(picked) + 1})
    # Not enough well-spaced candidates: fill from the remaining ranked list, and say so.
    note = None
    if len(picked) < count:
        chosen = {p.get("census_tract") for p in picked}
        for cand in [c for c in candidates if c.get("census_tract") not in chosen]:
            if len(picked) >= count:
                break
            picked.append({**cand, "site_number": len(picked) + 1, "spacing_warning": True})
            passed = [p for p in passed if p.get("census_tract") != cand.get("census_tract")]
        note = "Not enough candidates met the spacing rule; some sites overlap in reach."
    leftover = [c for c in candidates if c.get("census_tract") not in
                {p.get("census_tract") for p in picked + passed}]
    for c in leftover[:2]:
        passed.append({**c, "why_passed_over": "Ranked lower on combined heat and vulnerability score."})
    return {
        "selected_sites": picked,
        "passed_over": passed[:3],
        "min_spacing_km": min_spacing_km,
        "distance_note": "Distances are straight-line, not walking routes.",
        "note": note,
    }
