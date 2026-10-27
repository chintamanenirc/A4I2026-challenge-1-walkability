import json

from ui_service import mock
from ui_service.contracts import FinalResponse, VizSpec
from ui_service.viz_builder import build_viz_spec


def spec_for(message: str) -> VizSpec:
    return build_viz_spec(mock.plan(message), mock.tract_layer(), mock=True)


def test_site_selection_spec_is_complete():
    v = spec_for("We can fund 3 permanent cooling centers. Where should they go?")
    assert v.primary_view == "map_and_table" and v.mock
    assert [r.rank for r in v.ranked_table if r.funded] == [1, 2, 3]
    assert [r.rank for r in v.ranked_table if not r.funded] == [4]
    kinds = [f.properties.feature_type for f in v.map_geojson.features]
    assert kinds.count("recommended_site") == 3 and kinds.count("catchment") == 3
    assert kinds.count("runner_up_site") == 1
    assert len(v.site_details) == 3 and all(d.cost_label == "[COST]" for d in v.site_details)


def test_driver_bars_sorted_and_dominant_driver_adds_heat():
    v = spec_for("where should they go")
    for b in v.driver_bars:
        mags = [abs(x.attribution_f) for x in b.bars]
        assert mags == sorted(mags, reverse=True)
        assert all((x.effect == "adds_heat") == (x.attribution_f >= 0) for x in b.bars)
    assert v.driver_bars[0].dominant_driver == "Street density"


def test_audit_scores_income_as_lower_means_need():
    v = spec_for("run the audit")
    assert v.primary_view == "equity_audit_table"
    income = next(r for r in v.audit_table if r.measure == "median_income")
    assert income.higher_means_need is False and income.toward_need is True
    assert v.audit_summary.measures_toward_need == 4 and v.audit_summary.measures_total == 4


def test_scatter_marks_sites_and_runner_up():
    v = spec_for("where should they go")
    marked = {p.site_rank: p.funded for p in v.audit_scatter.points if p.site_rank}
    assert marked == {1: True, 2: True, 3: True, 4: False}
    assert all(0 <= p.vulnerability <= 1 for p in v.audit_scatter.points)


def test_proposal_never_invents_costs_and_flags_finance():
    v = spec_for("Draft the council proposal")
    p = v.proposal
    assert v.primary_view == "proposal_document"
    assert all(r.cost == "[COST]" for r in p.sites)
    finance = next(c for c in p.checklist if "finance" in c.label)
    assert finance.done is False and finance.note == "needs a person"
    assert "52,429" not in p.recommendation  # sums come from the mock catchments, not DECISIONS.md


def test_budget_count_changes_funded_sites():
    v = spec_for("We can fund 2 permanent cooling centers")
    assert [r.rank for r in v.ranked_table if r.funded] == [1, 2]


def test_other_city_is_refused_with_empty_view():
    resp = mock.plan("Where should cooling centers go in Phoenix?")
    v = build_viz_spec(resp, mock.tract_layer(), mock=True)
    assert resp.status == "out_of_scope" and v.primary_view == "empty"


def test_final_response_round_trips_through_json():
    resp = mock.plan("where should they go")
    final = FinalResponse(**resp.model_dump(), viz_spec=build_viz_spec(resp, mock.tract_layer(), mock=True))
    data = json.loads(final.model_dump_json(by_alias=True))
    assert data["viz_spec"]["proposal"]["from"] == "[Department / office]"
    FinalResponse.model_validate(data)
