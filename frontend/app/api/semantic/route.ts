import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

const PROJECT_ID = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "qwiklabs-gcp-04-ec3596addc43";

let bqClient: BigQuery | null = null;
function getBigQueryClient(): BigQuery {
  if (!bqClient) {
    bqClient = new BigQuery({ projectId: PROJECT_ID });
  }
  return bqClient;
}

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
        return NextResponse.json({ error: "Missing geo_id parameter" }, { status: 400 });
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

    return NextResponse.json({ error: `Unknown query type: ${type}` }, { status: 400 });
  } catch (err: any) {
    console.error("BigQuery Semantic API error:", err);
    // Provide structured fallback response if BigQuery is temporarily inaccessible
    if (type === "baseline") {
      return NextResponse.json({
        type: "baseline",
        fallback: true,
        baseline: {
          city_median_income: 75714,
          city_poverty_rate: 0.1395,
          city_no_vehicle_rate: 0.0823,
          city_share_65_plus: 0.1247,
          city_median_age: 37.02,
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
