import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

const PROJECT_ID =
  process.env.PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "qwiklabs-gcp-04-ec3596addc43";

let bqClient: BigQuery | null = null;
function getBigQueryClient(): BigQuery {
  if (!bqClient) {
    bqClient = new BigQuery({ projectId: PROJECT_ID });
  }
  return bqClient;
}

// Planner-friendly labels for PR #2 BQML offset_model_v1 features
const FEATURE_LABELS: Record<string, string> = {
  housing_within_1500m: "Homes within 1.5 km",
  median_year_built: "Building age",
  water_share: "Nearby water / canopy",
  pop_density_km2: "Population density",
  housing_density_km2: "Block housing density",
  pop_within_1500m: "Surrounding population",
  mean_year_built_1500m: "Surrounding building age",
  km_from_center: "Urban core distance",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "heat_grid";
  const geoId = searchParams.get("geo_id");
  const limitParam = parseInt(searchParams.get("limit") || "30", 10);
  const limit = Math.min(Math.max(1, limitParam), 100);

  try {
    const client = getBigQueryClient();

    if (type === "heat_grid") {
      const query = `
        SELECT
          cell_id,
          ROUND(lat, 4) AS lat,
          ROUND(lon, 4) AS lon,
          ROUND(mean_temp_f, 2) AS mean_temp_f,
          ROUND(offset_f, 2) AS offset_f,
          nearest_geo_id
        FROM \`${PROJECT_ID}.a4i_semantic.fact_heat_cell\`
        WHERE offset_f IS NOT NULL
        ORDER BY offset_f DESC
        LIMIT @limit;
      `;
      const [rows] = await client.query({
        query,
        params: { limit },
      });
      return NextResponse.json({
        type: "heat_grid",
        count: rows.length,
        cells: rows,
      });
    }

    if (type === "baseline") {
      const query = `
        SELECT *
        FROM \`${PROJECT_ID}.a4i_semantic.audit_city_baseline\`
        LIMIT 1;
      `;
      const [rows] = await client.query({ query });
      return NextResponse.json({
        type: "baseline",
        baseline: rows[0] || null,
      });
    }

    if (type === "tract") {
      if (!geoId) {
        return NextResponse.json(
          { error: "Missing geo_id parameter" },
          { status: 400 }
        );
      }
      const query = `
        SELECT
          geo_id,
          ROUND(centroid_lat, 4) AS centroid_lat,
          ROUND(centroid_lon, 4) AS centroid_lon,
          population,
          pop_65_plus,
          share_65_plus,
          car_free_households,
          ROUND(no_vehicle_rate * 100, 1) AS no_vehicle_rate_pct,
          ROUND(poverty_rate * 100, 1) AS poverty_rate_pct,
          median_income,
          median_age,
          pop_density_km2
        FROM \`${PROJECT_ID}.a4i_semantic.dim_tract\`
        WHERE geo_id = @geoId
        LIMIT 1;
      `;
      const [rows] = await client.query({
        query,
        params: { geoId: geoId.trim() },
      });
      return NextResponse.json({
        type: "tract",
        tract: rows[0] || null,
      });
    }

    if (type === "frequency") {
      const query = `
        SELECT *
        FROM \`${PROJECT_ID}.a4i_semantic.metric_city_heat_days_by_year\`
        ORDER BY year DESC
        LIMIT 10;
      `;
      const [rows] = await client.query({ query });
      return NextResponse.json({
        type: "frequency",
        metrics: rows,
      });
    }

    if (type === "site_hot_days") {
      const offsetF = parseFloat(searchParams.get("offset_f") || "3.5");
      const query = `
        SELECT *
        FROM \`${PROJECT_ID}.a4i_semantic.site_hot_days\`(@offsetF);
      `;
      const [rows] = await client.query({
        query,
        params: { offsetF },
      });
      return NextResponse.json({
        type: "site_hot_days",
        result: rows[0] || null,
      });
    }

    if (type === "vulnerable_population") {
      const lat = parseFloat(searchParams.get("lat") || "33.7408");
      const lon = parseFloat(searchParams.get("lon") || "-84.4018");
      const radiusM = parseFloat(searchParams.get("radius_m") || "1200");
      const query = `
        SELECT *
        FROM \`${PROJECT_ID}.a4i_semantic.vulnerable_population\`(@lat, @lon, @radiusM);
      `;
      const [rows] = await client.query({
        query,
        params: { lat, lon, radiusM },
      });
      return NextResponse.json({
        type: "vulnerable_population",
        result: rows[0] || null,
      });
    }

    if (type === "audit") {
      const geoIdsParam =
        searchParams.get("geo_ids") ||
        "13121004400,13121004200,13121007603";
      const geoIds = geoIdsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const query = `
        WITH baseline AS (
          SELECT * FROM \`${PROJECT_ID}.a4i_semantic.audit_city_baseline\` LIMIT 1
        ),
        recommended AS (
          SELECT
            COUNT(*) AS tracts_count,
            SUM(population) AS total_population,
            SUM(pop_65_plus) AS total_pop_65_plus,
            SUM(car_free_households) AS total_car_free_households,
            ROUND(SAFE_DIVIDE(SUM(population * median_income), SUM(IF(median_income IS NULL, 0, population))), 0) AS sites_median_income_usd,
            ROUND(SAFE_DIVIDE(SUM(population * poverty_rate), SUM(IF(poverty_rate IS NULL, 0, population))), 4) AS sites_poverty_rate,
            ROUND(SAFE_DIVIDE(SUM(population * no_vehicle_rate), SUM(IF(no_vehicle_rate IS NULL, 0, population))), 4) AS sites_no_vehicle_rate,
            ROUND(SAFE_DIVIDE(SUM(pop_65_plus), NULLIF(SUM(population), 0)), 4) AS sites_share_65_plus,
            ROUND(SAFE_DIVIDE(SUM(population * median_age), SUM(IF(median_age IS NULL, 0, population))), 2) AS sites_median_age_years
          FROM \`${PROJECT_ID}.a4i_semantic.dim_tract\`
          WHERE geo_id IN UNNEST(@geoIds)
        )
        SELECT * FROM baseline CROSS JOIN recommended;
      `;
      const [rows] = await client.query({
        query,
        params: { geoIds },
      });
      return NextResponse.json({
        type: "audit",
        audit: rows[0] || null,
      });
    }

    if (type === "sites") {
      const candidateGeoIds = [
        "13121004400",
        "13121004200",
        "13121007603",
        "13121005800",
        "13121006500",
      ];
      const query = `
        WITH tract_heat AS (
          SELECT
            nearest_geo_id AS geo_id,
            ROUND(MAX(offset_f), 2) AS max_cell_offset_f,
            ROUND(AVG(offset_f), 2) AS avg_cell_offset_f
          FROM \`${PROJECT_ID}.a4i_semantic.fact_heat_cell\`
          GROUP BY nearest_geo_id
        ),
        tract_ml AS (
          SELECT
            geo_id,
            ROUND(predicted_offset_f, 2) AS max_pred_offset_f,
            drivers AS top_drivers
          FROM \`${PROJECT_ID}.a4i_ml.grid_predictions\`
          QUALIFY ROW_NUMBER() OVER (PARTITION BY geo_id ORDER BY predicted_offset_f DESC) = 1
        ),
        station_temps AS (
          SELECT
            ARRAY_AGG(city_max_temp_f) AS temps,
            COUNT(DISTINCT EXTRACT(YEAR FROM date)) AS n_years
          FROM \`${PROJECT_ID}.a4i_semantic.fact_city_heat_day\`
        ),
        walk_shed AS (
          SELECT
            t1.geo_id,
            CAST(ROUND(SUM(t2.population), 0) AS INT64) AS walk_pop,
            CAST(ROUND(SUM(t2.pop_65_plus), 0) AS INT64) AS walk_pop_65_plus,
            CAST(ROUND(SUM(t2.car_free_households), 0) AS INT64) AS walk_car_free_hh
          FROM \`${PROJECT_ID}.a4i_semantic.dim_tract\` t1
          JOIN \`${PROJECT_ID}.a4i_semantic.dim_tract\` t2
            ON ST_DWITHIN(
              ST_GEOGPOINT(t1.centroid_lon, t1.centroid_lat),
              ST_GEOGPOINT(t2.centroid_lon, t2.centroid_lat),
              1200
            )
          WHERE t1.geo_id IN UNNEST(@candidateGeoIds)
          GROUP BY t1.geo_id
        )
        SELECT
          t.geo_id,
          ROUND(t.centroid_lat, 4) AS lat,
          ROUND(t.centroid_lon, 4) AS lon,
          CAST(t.population AS INT64) AS population,
          CAST(t.pop_65_plus AS INT64) AS pop_65_plus,
          ROUND(t.share_65_plus * 100, 1) AS seniors_pct,
          CAST(t.car_free_households AS INT64) AS car_free_households,
          ROUND(t.no_vehicle_rate * 100, 1) AS no_car_pct,
          ROUND(t.poverty_rate * 100, 1) AS poverty_pct,
          ROUND(t.median_income, 0) AS median_income,
          h.max_cell_offset_f,
          h.avg_cell_offset_f,
          m.max_pred_offset_f,
          w.walk_pop,
          w.walk_pop_65_plus,
          w.walk_car_free_hh,
          CAST(ROUND(SAFE_DIVIDE(
            (SELECT COUNTIF(temp >= 95.0 - COALESCE(h.max_cell_offset_f, 3.0)) FROM UNNEST(st.temps) AS temp),
            st.n_years
          ), 0) AS INT64) AS hot_days_ge_95_per_yr,
          m.top_drivers
        FROM \`${PROJECT_ID}.a4i_semantic.dim_tract\` t
        LEFT JOIN tract_heat h ON t.geo_id = h.geo_id
        LEFT JOIN tract_ml m ON t.geo_id = m.geo_id
        LEFT JOIN walk_shed w ON t.geo_id = w.geo_id
        CROSS JOIN station_temps st
        WHERE t.geo_id IN UNNEST(@candidateGeoIds);
      `;
      const [rows] = await client.query({
        query,
        params: { candidateGeoIds },
      });

      const enriched = rows.map((r: any) => ({
        ...r,
        drivers: Array.isArray(r.top_drivers)
          ? r.top_drivers.slice(0, 4).map((d: any) => ({
              feature: d.feature,
              label:
                FEATURE_LABELS[d.feature] ||
                String(d.feature || "")
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
              attributionF: Number(Number(d.attribution || 0).toFixed(2)),
            }))
          : [],
      }));

      return NextResponse.json({
        type: "sites",
        count: enriched.length,
        sites: enriched,
      });
    }

    if (type === "tracts_scatter") {
      const query = `
        SELECT
          t.geo_id,
          ROUND(t.centroid_lat, 4) AS lat,
          ROUND(t.centroid_lon, 4) AS lon,
          t.population,
          ROUND(COALESCE(t.share_65_plus, 0) * 100, 1) AS age_65_pct,
          ROUND(COALESCE(t.no_vehicle_rate, 0) * 100, 1) AS no_car_pct,
          ROUND(COALESCE(t.poverty_rate, 0) * 100, 1) AS poverty_pct,
          ROUND(COALESCE(t.median_income, 55000), 0) AS median_income,
          ROUND(AVG(h.offset_f), 2) AS offset_f
        FROM \`${PROJECT_ID}.a4i_semantic.dim_tract\` t
        JOIN \`${PROJECT_ID}.a4i_semantic.fact_heat_cell\` h
          ON t.geo_id = h.nearest_geo_id
        WHERE t.population > 800
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8
        ORDER BY offset_f DESC
        LIMIT 60;
      `;
      const [rows] = await client.query({ query });
      return NextResponse.json({
        type: "tracts_scatter",
        count: rows.length,
        tracts: rows,
      });
    }

    return NextResponse.json(
      { error: `Unknown query type: ${type}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("BigQuery Semantic API error:", err);
    if (type === "baseline") {
      return NextResponse.json({
        type: "baseline",
        fallback: true,
        baseline: {
          city_median_income_usd: 75714,
          city_poverty_rate: 0.1395,
          city_no_vehicle_rate: 0.0823,
          city_share_65_plus: 0.1247,
          city_median_age_years: 37.02,
        },
      });
    }
    return NextResponse.json(
      {
        error: "Failed to query BigQuery semantic layer",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
