#!/usr/bin/env python3
"""Refresh live World Bank economic inputs for the S2 Economic Retention Atlas.

This script writes only live public-source records. If the World Bank API is
unavailable, the GitHub Action fails and the site keeps the last committed live
JSON. No demo or synthetic country records are generated.
"""
from __future__ import annotations

import json
import math
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pycountry
import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

WB_BASE = "https://api.worldbank.org/v2"
CURRENT_YEAR = datetime.now(timezone.utc).year
HISTORY_YEARS = 40
START_YEAR = CURRENT_YEAR - HISTORY_YEARS
END_YEAR = CURRENT_YEAR
FORMULA_VERSION = "s2-econ-retention-poc-v1.2-truth-oriented-distortion-audit"


@dataclass(frozen=True)
class Indicator:
    key: str
    code: str
    label: str
    unit: str
    role: str


INDICATORS: List[Indicator] = [
    Indicator("inflation", "FP.CPI.TOTL.ZG", "Inflation, consumer prices (annual %)", "%", "observed_price_pressure"),
    Indicator("cpi_index", "FP.CPI.TOTL", "Consumer price index", "index", "observed_price_level"),
    Indicator("gdp_deflator_inflation", "NY.GDP.DEFL.KD.ZG", "Inflation, GDP deflator (annual %)", "%", "economy_wide_price_pressure_crosscheck"),
    Indicator("gdp_growth", "NY.GDP.MKTP.KD.ZG", "GDP growth (annual %)", "%", "real_output_growth"),
    Indicator("gdp_pc_growth", "NY.GDP.PCAP.KD.ZG", "GDP per capita growth (annual %)", "%", "productive_growth_proxy"),
    Indicator("broad_money_gdp", "FM.LBL.BMNY.GD.ZS", "Broad money (% of GDP)", "% of GDP", "financialization_depth_proxy"),
    Indicator("broad_money_growth", "FM.LBL.BMNY.ZG", "Broad money growth (annual %)", "%", "monetary_expansion_proxy"),
    Indicator("domestic_credit_private_gdp", "FS.AST.PRVT.GD.ZS", "Domestic credit to private sector (% of GDP)", "% of GDP", "financialization_proxy"),
    Indicator("debt_service_exports", "DT.TDS.DECT.EX.ZS", "Total debt service (% of exports)", "% of exports", "debt_pressure_proxy"),
    Indicator("gov_expense_gdp", "GC.XPN.TOTL.GD.ZS", "Expense (% of GDP)", "% of GDP", "overhead_proxy"),
    Indicator("unemployment", "SL.UEM.TOTL.ZS", "Unemployment, total (% of labor force)", "%", "labor_slack_proxy"),
    Indicator("labor_force_participation", "SL.TLF.CACT.ZS", "Labor force participation rate, total (% ages 15+)", "%", "hidden_labor_slack_crosscheck"),
    Indicator("employment_to_population", "SL.EMP.TOTL.SP.ZS", "Employment to population ratio, 15+, total (%)", "%", "hidden_labor_slack_crosscheck"),
    Indicator("trade_gdp", "NE.TRD.GNFS.ZS", "Trade (% of GDP)", "% of GDP", "openness_context"),
    Indicator("exports_gdp", "NE.EXP.GNFS.ZS", "Exports of goods and services (% of GDP)", "% of GDP", "external_throughput_proxy"),
    Indicator("manufacturing_value_added_gdp", "NV.IND.MANF.ZS", "Manufacturing, value added (% of GDP)", "% of GDP", "physical_production_depth_proxy"),
    Indicator("industry_value_added_gdp", "NV.IND.TOTL.ZS", "Industry, value added (% of GDP)", "% of GDP", "physical_production_depth_proxy"),
    Indicator("manufacturing_value_added_usd", "NV.IND.MANF.CD", "Manufacturing, value added (current US$)", "current US$", "physical_production_mass_proxy"),
    Indicator("industry_value_added_usd", "NV.IND.TOTL.CD", "Industry, value added (current US$)", "current US$", "physical_production_mass_proxy"),
    Indicator("manufacturing_growth", "NV.IND.MANF.KD.ZG", "Manufacturing, value added (annual % growth)", "%", "physical_production_momentum_proxy"),
    Indicator("industry_growth", "NV.IND.TOTL.KD.ZG", "Industry, value added (annual % growth)", "%", "physical_production_momentum_proxy"),
    Indicator("manufactures_exports_share", "TX.VAL.MANF.ZS.UN", "Manufactures exports (% of merchandise exports)", "%", "manufacturing_export_complexity_proxy"),
    Indicator("high_tech_exports_share", "TX.VAL.TECH.MF.ZS", "High-technology exports (% of manufactured exports)", "%", "productive_complexity_proxy"),
    Indicator("r_and_d_gdp", "GB.XPD.RSDV.GD.ZS", "Research and development expenditure (% of GDP)", "% of GDP", "technical_depth_proxy_non_imf"),
    Indicator("researchers_per_million", "SP.POP.SCIE.RD.P6", "Researchers in R&D (per million people)", "per million", "technical_labor_depth_proxy_non_imf"),
    Indicator("patent_applications_residents", "IP.PAT.RESD", "Patent applications, residents", "applications", "revealed_technical_output_proxy_wipo"),
    Indicator("container_port_traffic_teu", "IS.SHP.GOOD.TU", "Container port traffic (TEU)", "TEU", "logistics_throughput_proxy_non_imf"),
    Indicator("rail_lines_km", "IS.RRS.TOTL.KM", "Rail lines (total route-km)", "route-km", "physical_infrastructure_proxy_non_imf"),
    Indicator("electric_power_consumption_kwh_pc", "EG.USE.ELEC.KH.PC", "Electric power consumption (kWh per capita)", "kWh per capita", "physical_energy_depth_proxy_iea"),
    Indicator("military_expenditure_gdp", "MS.MIL.XPND.GD.ZS", "Military expenditure (% of GDP)", "% of GDP", "state_directed_strategic_allocation_proxy_sipri"),
    Indicator("ppp_price_level_ratio", "PA.NUS.GDP.PLI", "Price level index (GDP), divided by 100 for conservative PPP ratio", "index US=100 -> ratio", "conservative_purchasing_power_price_level_crosscheck"),
    Indicator("ppp_gdp_conversion_factor", "PA.NUS.PPP", "PPP conversion factor, GDP (LCU per international $)", "LCU per international $", "purchasing_power_audit_context"),
    Indicator("ppp_private_consumption_factor", "PA.NUS.PRVT.PP", "PPP conversion factor, private consumption (LCU per international $)", "LCU per international $", "household_purchasing_power_audit_context"),
]

MODEL_INPUT_KEYS = [
    "inflation",
    "gdp_growth",
    "gdp_pc_growth",
    "gdp_deflator_inflation",
    "broad_money_gdp",
    "broad_money_growth",
    "domestic_credit_private_gdp",
    "debt_service_exports",
    "gov_expense_gdp",
    "unemployment",
    "labor_force_participation",
    "employment_to_population",
    "manufacturing_value_added_gdp",
    "industry_value_added_gdp",
    "manufacturing_mass_score",
    "industry_mass_score",
    "manufacturing_growth",
    "industry_growth",
    "manufactures_exports_share",
    "high_tech_exports_share",
    "r_and_d_gdp",
    "researchers_per_million",
    "patent_applications_mass_score",
    "container_port_mass_score",
    "rail_lines_mass_score",
    "electric_power_consumption_kwh_pc",
    "military_expenditure_gdp",
    "ppp_price_level_ratio",
]

CLUSTER_LABELS = {
    "productive_coherence": "Productive coherence",
    "symbolic_finance": "Symbolic finance",
    "retention_drag": "Retention drag",
    "inflation_shock": "Inflation shock",
    "dust_overhead": "Dust / overhead",
    "transition": "Transition / mixed",
    "low_signal": "Low signal",
}


def fetch_worldbank(path: str, params: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    query = {"format": "json", "per_page": 20000}
    if params:
        query.update(params)
    url = f"{WB_BASE}/{path.lstrip('/')}"
    response = requests.get(url, params=query, timeout=60)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list) or len(payload) < 2:
        raise RuntimeError(f"Unexpected World Bank response for {url}: {payload!r}")
    meta = payload[0] or {}
    rows = payload[1] or []
    return meta, rows


def fetch_paged(path: str, params: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    all_rows: List[Dict[str, Any]] = []
    first_meta, rows = fetch_worldbank(path, params)
    all_rows.extend(rows)
    pages = int(first_meta.get("pages") or 1)
    for page in range(2, pages + 1):
        page_params = dict(params or {})
        page_params["page"] = page
        _, page_rows = fetch_worldbank(path, page_params)
        all_rows.extend(page_rows)
    return all_rows, first_meta


def parse_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        val = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(val) or math.isinf(val):
        return None
    return val


def numeric_iso3(iso3: str) -> Optional[str]:
    try:
        country = pycountry.countries.get(alpha_3=iso3)
        if country and getattr(country, "numeric", None):
            return str(country.numeric).zfill(3)
    except Exception:
        return None
    return None


def load_countries() -> Dict[str, Dict[str, Any]]:
    rows, meta = fetch_paged("country")
    countries: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        iso3 = row.get("id")
        iso2 = row.get("iso2Code")
        region = (row.get("region") or {}).get("value")
        region_id = (row.get("region") or {}).get("id")
        if not iso3 or not iso2 or iso2 == "" or region_id == "NA":
            continue
        numeric = numeric_iso3(iso3)
        if not numeric:
            continue
        countries[iso3] = {
            "iso3": iso3,
            "iso2": iso2,
            "isoNumeric": numeric,
            "name": row.get("name") or iso3,
            "region": region,
            "income": (row.get("incomeLevel") or {}).get("value"),
            "lending_type": (row.get("lendingType") or {}).get("value"),
            "capital_city": row.get("capitalCity"),
            "longitude": parse_float(row.get("longitude")),
            "latitude": parse_float(row.get("latitude")),
        }
    if not countries:
        raise RuntimeError(f"No countries loaded from World Bank country API metadata: {meta}")
    return countries


def fetch_indicator(indicator: Indicator) -> Tuple[Dict[str, Dict[int, float]], Dict[str, Any]]:
    meta, rows = fetch_worldbank(
        f"country/all/indicator/{indicator.code}",
        {"date": f"{START_YEAR}:{END_YEAR}"},
    )
    series: Dict[str, Dict[int, float]] = {}
    for row in rows:
        iso3 = row.get("countryiso3code")
        year_raw = row.get("date")
        value = parse_float(row.get("value"))
        if not iso3 or value is None:
            continue
        try:
            year = int(year_raw)
        except (TypeError, ValueError):
            continue
        if START_YEAR <= year <= END_YEAR:
            if indicator.key == "ppp_price_level_ratio":
                # Use PA.NUS.GDP.PLI because the World Bank all-country API
                # currently rejects the ratio code in all-country mode.
                # GDP.PLI is the same price-level concept on a
                # US=100 index scale, so divide by 100 to keep the model
                # using the original ratio semantics: US ~= 1.00, China 2024
                # ~= 0.49, India 2024 ~= 0.24.
                value = value / 100.0
            series.setdefault(iso3, {})[year] = value
    return series, meta


def latest_non_null(series: Dict[int, float]) -> Tuple[Optional[int], Optional[float]]:
    if not series:
        return None, None
    year = max(series)
    return year, series[year]


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def score_range(value: Optional[float], low: float, high: float) -> Optional[float]:
    if value is None:
        return None
    return clamp((value - low) / (high - low))


def soft_score(value: Optional[float], floor: float, half_life: float) -> Optional[float]:
    """Smooth 0..1 score that avoids hard 100% saturation for deep financial systems.

    A value at floor scores 0; floor + half_life scores 0.5; additional
    depth approaches 1 asymptotically instead of clipping abruptly.
    """
    if value is None:
        return None
    if value <= floor:
        return 0.0
    return clamp(1.0 - math.exp(-math.log(2.0) * (value - floor) / half_life))


def avg_present(values: Iterable[Optional[float]], min_count: int = 1) -> Optional[float]:
    vals = [v for v in values if v is not None]
    if len(vals) < min_count:
        return None
    return sum(vals) / len(vals)


def weighted_avg_present(items: Iterable[Tuple[Optional[float], float]], min_count: int = 1) -> Optional[float]:
    vals = [(v, w) for v, w in items if v is not None and w > 0]
    if len(vals) < min_count:
        return None
    total_w = sum(w for _, w in vals)
    if total_w <= 0:
        return None
    return sum(float(v) * float(w) for v, w in vals) / total_w


def round_or_none(value: Optional[float], digits: int = 3) -> Optional[float]:
    if value is None:
        return None
    return round(float(value), digits)


def build_measurement_adjusted_values(values: Dict[str, Optional[float]]) -> Dict[str, Optional[float]]:
    """Build a measurement-robust proxy input set from live public indicators.

    This is deliberately conservative: it does not claim to reverse hedonics,
    national-account deflator methods, or labor-stat definitions. It creates a
    second signal mode by triangulating CPI with GDP-deflator inflation, broad
    money growth net of real growth, and hidden labor-slack proxies.
    """
    cleaned = dict(values)

    inflation = values.get("inflation")
    gdp_deflator = values.get("gdp_deflator_inflation")
    broad_money_growth = values.get("broad_money_growth")
    gdp_growth = values.get("gdp_growth")
    gdp_pc_growth = values.get("gdp_pc_growth")

    real_anchor = avg_present([
        max(gdp_growth, 0.0) if gdp_growth is not None else None,
        max(gdp_pc_growth, 0.0) if gdp_pc_growth is not None else None,
    ])
    money_gap = None
    if broad_money_growth is not None:
        money_gap = max(0.0, broad_money_growth - (real_anchor or 0.0))

    # Convert monetary expansion into a weak price-pressure proxy. It is capped
    # and weighted so it can reveal official-series disagreement without turning
    # money growth into one-for-one inflation.
    monetary_price_proxy = min(35.0, money_gap * 0.35) if money_gap is not None else None
    price_inputs = [v for v in [inflation, gdp_deflator, monetary_price_proxy] if v is not None]
    if price_inputs:
        avg_price = sum(price_inputs) / len(price_inputs)
        high_price = max(price_inputs)
        cleaned["inflation"] = round_or_none(0.68 * avg_price + 0.32 * high_price)

    unemployment = values.get("unemployment")
    labor_force_participation = values.get("labor_force_participation")
    employment_to_population = values.get("employment_to_population")
    participation_gap = score_range(62.0 - labor_force_participation if labor_force_participation is not None else None, 0, 22)
    employment_gap = score_range(58.0 - employment_to_population if employment_to_population is not None else None, 0, 18)
    hidden_labor = avg_present([participation_gap, employment_gap], min_count=1)
    if hidden_labor is not None:
        hidden_unemployment_equiv = 4.0 + hidden_labor * 16.0
        cleaned["unemployment"] = round_or_none(max(unemployment or 0.0, hidden_unemployment_equiv))

    return cleaned


def derive_metrics(values: Dict[str, Optional[float]]) -> Dict[str, Optional[float]]:
    inflation = values.get("inflation")
    gdp_deflator = values.get("gdp_deflator_inflation")
    gdp_growth = values.get("gdp_growth")
    gdp_pc_growth = values.get("gdp_pc_growth")
    broad_money = values.get("broad_money_gdp")
    broad_money_growth = values.get("broad_money_growth")
    domestic_credit = values.get("domestic_credit_private_gdp")
    debt_service = values.get("debt_service_exports")
    gov_expense = values.get("gov_expense_gdp")
    unemployment = values.get("unemployment")
    labor_force_participation = values.get("labor_force_participation")
    employment_to_population = values.get("employment_to_population")
    exports_gdp = values.get("exports_gdp")
    manufacturing_share = values.get("manufacturing_value_added_gdp")
    industry_share = values.get("industry_value_added_gdp")
    manufacturing_mass_score_raw = values.get("manufacturing_mass_score")
    industry_mass_score_raw = values.get("industry_mass_score")
    manufacturing_growth = values.get("manufacturing_growth")
    industry_growth = values.get("industry_growth")
    manufactures_exports_share = values.get("manufactures_exports_share")
    high_tech_exports_share = values.get("high_tech_exports_share")
    r_and_d_gdp = values.get("r_and_d_gdp")
    researchers_per_million = values.get("researchers_per_million")
    patent_applications_mass_score_raw = values.get("patent_applications_mass_score")
    container_port_mass_score_raw = values.get("container_port_mass_score")
    rail_lines_mass_score_raw = values.get("rail_lines_mass_score")
    electric_power_consumption_kwh_pc = values.get("electric_power_consumption_kwh_pc")
    military_expenditure_gdp = values.get("military_expenditure_gdp")
    ppp_price_level_ratio = values.get("ppp_price_level_ratio")

    # Conservative PPP/price-level adjustment:
    # PA.NUS.GDP.PLI / 100 < 1 means market USD values tend to understate local
    # purchasing power. It is not a free boost. It only nudges already-observed
    # physical mass/industrial capacity, and the multiplier is intentionally small.
    ppp_local_purchasing_power_signal = score_range(1.0 - ppp_price_level_ratio if ppp_price_level_ratio is not None else None, 0.0, 0.65)
    ppp_high_cost_signal = score_range(ppp_price_level_ratio - 1.0 if ppp_price_level_ratio is not None else None, 0.0, 0.75)
    ppp_mass_multiplier = 1.0
    if ppp_local_purchasing_power_signal is not None:
        ppp_mass_multiplier += 0.12 * ppp_local_purchasing_power_signal
    if ppp_high_cost_signal is not None:
        ppp_mass_multiplier -= 0.06 * ppp_high_cost_signal
    ppp_mass_multiplier = clamp(ppp_mass_multiplier, 0.94, 1.12)

    inflation_positive = max(inflation, 0.0) if inflation is not None else None
    deflator_positive = max(gdp_deflator, 0.0) if gdp_deflator is not None else None
    broad_price_positive = max([v for v in [inflation_positive, deflator_positive] if v is not None], default=None)

    growth_signal = avg_present([
        score_range(gdp_growth, 0, 6),
        score_range(gdp_pc_growth, 0, 5),
    ])

    manufacturing_mass_signal_raw = manufacturing_mass_score_raw / 100.0 if manufacturing_mass_score_raw is not None else None
    industry_mass_signal_raw = industry_mass_score_raw / 100.0 if industry_mass_score_raw is not None else None
    manufacturing_mass_signal = clamp(manufacturing_mass_signal_raw * ppp_mass_multiplier) if manufacturing_mass_signal_raw is not None else None
    industry_mass_signal = clamp(industry_mass_signal_raw * ppp_mass_multiplier) if industry_mass_signal_raw is not None else None
    physical_depth_signal = weighted_avg_present([
        (score_range(manufacturing_share, 6, 28), 1.45),
        (score_range(industry_share, 16, 46), 0.95),
        (manufacturing_mass_signal, 1.65),
        (industry_mass_signal, 0.95),
        (score_range(manufactures_exports_share, 15, 88), 0.75),
        (score_range(high_tech_exports_share, 3, 45), 0.60),
        (score_range(exports_gdp, 8, 65), 0.25),
    ], min_count=1)
    physical_momentum_signal = avg_present([
        score_range(manufacturing_growth, -2, 8),
        score_range(industry_growth, -2, 8),
    ], min_count=1)

    patent_mass_signal = patent_applications_mass_score_raw / 100.0 if patent_applications_mass_score_raw is not None else None
    container_port_signal = container_port_mass_score_raw / 100.0 if container_port_mass_score_raw is not None else None
    rail_lines_signal = rail_lines_mass_score_raw / 100.0 if rail_lines_mass_score_raw is not None else None

    technical_depth_signal = weighted_avg_present([
        (score_range(r_and_d_gdp, 0.25, 4.0), 0.85),
        (score_range(researchers_per_million, 250, 6500), 0.70),
        (patent_mass_signal, 0.90),
        (score_range(high_tech_exports_share, 3, 45), 0.55),
    ], min_count=1)

    infrastructure_depth_signal = weighted_avg_present([
        (container_port_signal, 0.85),
        (rail_lines_signal, 0.65),
        (score_range(electric_power_consumption_kwh_pc, 450, 9500), 0.65),
        (score_range(exports_gdp, 8, 65), 0.25),
    ], min_count=1)

    strategic_allocation_signal = weighted_avg_present([
        # Strategic allocation can reveal state-directed build capacity, but
        # it is not automatically productive; keep the weight conservative.
        (score_range(military_expenditure_gdp, 1.0, 8.0), 1.0),
    ], min_count=1)

    productive_capacity = weighted_avg_present([
        (physical_depth_signal, 0.68),
        (physical_momentum_signal, 0.17),
        (growth_signal, 0.08),
        (technical_depth_signal, 0.07),
    ], min_count=1)

    sovereign_coherence = weighted_avg_present([
        (productive_capacity, 0.48),
        (technical_depth_signal, 0.23),
        (infrastructure_depth_signal, 0.17),
        (strategic_allocation_signal, 0.12),
    ], min_count=2)
    capacity_shield_values = [v for v in [productive_capacity, sovereign_coherence] if v is not None]
    capacity_shield = max(capacity_shield_values) if capacity_shield_values else None

    productive = None
    residual = None
    if inflation_positive is not None and productive_capacity is not None:
        # Productive inflation is now gated mainly by physical production capacity,
        # not by GDP growth alone. This prevents a real builder/manufacturer from
        # being scored as unproductive simply because its official CPI is low or
        # because service/asset-heavy GDP growth is high elsewhere.
        productive = inflation_positive * productive_capacity
        residual = max(0.0, inflation_positive - productive)

    # Legacy hard-clipped score is kept for audit, but not used as the main finance field.
    # The old 50..200 / 30..180 clips could make high-M2/high-credit systems display as
    # "100% financialized". The smooth score reduces that false saturation while still
    # marking very deep banking/credit systems as high signal.
    legacy_finance_score = avg_present([
        score_range(broad_money, 50, 200),
        score_range(domestic_credit, 30, 180),
    ])
    finance_score = avg_present([
        soft_score(broad_money, floor=45, half_life=105),
        soft_score(domestic_credit, floor=35, half_life=100),
    ])

    debt_score = score_range(debt_service, 5, 40)
    gov_score = score_range(gov_expense, 15, 45)
    labor_score = score_range(unemployment, 4, 20)
    growth_drag = score_range(-gdp_pc_growth if gdp_pc_growth is not None else None, 0, 5)

    cpi_deflator_gap = abs(inflation - gdp_deflator) if inflation is not None and gdp_deflator is not None else None
    deflator_gap_score = score_range(cpi_deflator_gap, 0, 8)
    monetary_expansion_score = score_range(broad_money_growth, 4, 25)
    labor_participation_gap = score_range(62.0 - labor_force_participation if labor_force_participation is not None else None, 0, 22)
    employment_gap = score_range(58.0 - employment_to_population if employment_to_population is not None else None, 0, 18)
    hidden_labor_slack = avg_present([labor_participation_gap, employment_gap, labor_score], min_count=1)

    symbolic = residual * finance_score if residual is not None and finance_score is not None else None
    drag_pressure = avg_present([debt_score, gov_score, growth_drag])
    retention_drag = residual * drag_pressure if residual is not None and drag_pressure is not None else None
    # Physical capacity offsets dust: factories, ports, rails, industrial clusters,
    # and export complexity are not symbolic recursion. They should reduce the
    # maintenance/noise interpretation rather than increase it.
    dust_base = avg_present([debt_score, finance_score, gov_score, labor_score, hidden_labor_slack, growth_drag], min_count=2)
    # Conservative recalibration: revealed build capacity should offset the
    # interpretation of activity as "dust/noise". Use the stronger of direct
    # productive capacity and broader sovereign coherence, but cap the offset.
    dust = clamp(dust_base * (1.0 - 0.34 * capacity_shield)) if dust_base is not None and capacity_shield is not None else dust_base

    inflation_deviation = score_range(abs(inflation - 2.0) if inflation is not None else None, 0, 18)
    coherence_pressure = avg_present([
        inflation_deviation,
        debt_score,
        finance_score * 0.78 if finance_score is not None else None,
        hidden_labor_slack,
        growth_drag,
        ppp_high_cost_signal * 0.18 if ppp_high_cost_signal is not None else None,
        (1.0 - capacity_shield) * 0.42 if capacity_shield is not None else None,
    ], min_count=2)
    coherence = (1.0 - coherence_pressure) if coherence_pressure is not None else None

    pressure = avg_present([
        score_range(inflation if inflation is not None else None, 0, 20),
        score_range(retention_drag, 0, 15),
        finance_score * 0.72 if finance_score is not None else None,
        dust,
        1.0 - coherence if coherence is not None else None,
        ppp_high_cost_signal * 0.16 if ppp_high_cost_signal is not None else None,
        (1.0 - capacity_shield) * 0.46 if capacity_shield is not None else None,
    ], min_count=2)

    # Measurement-robust S2 layer: a live-source cross-check view. It does not claim to
    # reverse hedonics, GDP-deflator methodology, or labor-stat definitions. It applies S2
    # to less single-series-dependent stress proxies and flags official-series divergence.
    broad_price_score = score_range(broad_price_positive, 0, 18)
    measurement_divergence = avg_present([deflator_gap_score, hidden_labor_slack], min_count=1)
    robust_pressure = avg_present([
        broad_price_score,
        monetary_expansion_score,
        debt_score,
        gov_score,
        growth_drag,
        hidden_labor_slack,
        finance_score * 0.52 if finance_score is not None else None,
        ppp_high_cost_signal * 0.14 if ppp_high_cost_signal is not None else None,
        (1.0 - capacity_shield) * 0.62 if capacity_shield is not None else None,
    ], min_count=2)
    measurement_robust_s2 = None
    if robust_pressure is not None:
        # Divergence raises the score modestly, but cannot create signal alone.
        measurement_robust_s2 = clamp(robust_pressure * (0.78 + 0.22 * (measurement_divergence or 0.0)))

    return {
        "productive_inflation": round_or_none(productive),
        "productive_capacity_score": round_or_none(productive_capacity * 100 if productive_capacity is not None else None, 2),
        "sovereign_coherence_score": round_or_none(sovereign_coherence * 100 if sovereign_coherence is not None else None, 2),
        "technical_depth_score": round_or_none(technical_depth_signal * 100 if technical_depth_signal is not None else None, 2),
        "infrastructure_depth_score": round_or_none(infrastructure_depth_signal * 100 if infrastructure_depth_signal is not None else None, 2),
        "strategic_allocation_score": round_or_none(strategic_allocation_signal * 100 if strategic_allocation_signal is not None else None, 2),
        "capacity_shield_score": round_or_none(capacity_shield * 100 if capacity_shield is not None else None, 2),
        "physical_depth_score": round_or_none(physical_depth_signal * 100 if physical_depth_signal is not None else None, 2),
        "physical_momentum_score": round_or_none(physical_momentum_signal * 100 if physical_momentum_signal is not None else None, 2),
        "ppp_local_purchasing_power_score": round_or_none(ppp_local_purchasing_power_signal * 100 if ppp_local_purchasing_power_signal is not None else None, 2),
        "ppp_high_cost_score": round_or_none(ppp_high_cost_signal * 100 if ppp_high_cost_signal is not None else None, 2),
        "ppp_capacity_multiplier": round_or_none(ppp_mass_multiplier, 4) if ppp_price_level_ratio is not None else None,
        "retention_drag": round_or_none(retention_drag),
        "symbolic_inflation": round_or_none(symbolic),
        "dust_index": round_or_none(dust * 100 if dust is not None else None, 2),
        "coherence_score": round_or_none(coherence * 100 if coherence is not None else None, 2),
        "financialization_score": round_or_none(finance_score * 100 if finance_score is not None else None, 2),
        "legacy_financialization_score": round_or_none(legacy_finance_score * 100 if legacy_finance_score is not None else None, 2),
        "debt_pressure_score": round_or_none(debt_score * 100 if debt_score is not None else None, 2),
        "gov_overhead_score": round_or_none(gov_score * 100 if gov_score is not None else None, 2),
        "labor_slack_score": round_or_none(labor_score * 100 if labor_score is not None else None, 2),
        "hidden_labor_slack_score": round_or_none(hidden_labor_slack * 100 if hidden_labor_slack is not None else None, 2),
        "monetary_expansion_score": round_or_none(monetary_expansion_score * 100 if monetary_expansion_score is not None else None, 2),
        "measurement_divergence_score": round_or_none(measurement_divergence * 100 if measurement_divergence is not None else None, 2),
        "measurement_robust_s2_score": round_or_none(measurement_robust_s2 * 100 if measurement_robust_s2 is not None else None, 2),
        "negative_growth_score": round_or_none(growth_drag * 100 if growth_drag is not None else None, 2),
        "pressure_score": round_or_none(pressure * 100 if pressure is not None else None, 2),
    }


def compute_economic_distortion_index(
    values: Dict[str, Optional[float]],
    derived: Dict[str, Optional[float]],
    cleaned_values: Dict[str, Optional[float]],
    cleaned_derived: Dict[str, Optional[float]],
) -> Optional[float]:
    """Truth-oriented conservative official-vs-revealed S2 distortion index.

    This remains an audit index, not a lie detector. There is no single live feed
    that equals "truth". The score therefore uses cross-source consistency:

    1. Official-over-cleaned gap: official projection looks healthier than the
       cleaned S2 cross-check projection.
    2. Accounting/statistical divergence: CPI vs GDP-deflator, monetary growth
       vs price pressure, and labor-participation / employment slack.
    3. Structural masking: finance depth, debt service, public overhead, PPP
       high-cost drag, and dust pressure.
    4. Revealed-capacity check: productive capacity, sovereign coherence, and
       capacity shield reduce false positive distortion when hard build capacity
       is genuinely visible, but do not erase financial/debt/statistical stress.

    All inputs are live-source fields already present in the JSON. Missing values
    stay missing; no country values are invented.
    """
    official_pressure = derived.get("pressure_score")
    clean_pressure = cleaned_derived.get("pressure_score")
    official_coherence = derived.get("coherence_score")
    clean_coherence = cleaned_derived.get("coherence_score")
    official_capacity = derived.get("capacity_shield_score")
    clean_capacity = cleaned_derived.get("capacity_shield_score")

    # Direct official -> cleaned deterioration. Positive only when the cleaned
    # cross-check view is worse than the official headline view.
    pressure_gap = score_range(
        (clean_pressure - official_pressure) if clean_pressure is not None and official_pressure is not None else None,
        0,
        26,
    )
    coherence_gap = score_range(
        (official_coherence - clean_coherence) if official_coherence is not None and clean_coherence is not None else None,
        0,
        28,
    )
    capacity_gap = score_range(
        (official_capacity - clean_capacity) if official_capacity is not None and clean_capacity is not None else None,
        0,
        24,
    )
    official_price = values.get("inflation")
    clean_price = cleaned_values.get("inflation")
    price_gap = score_range(
        (clean_price - official_price) if clean_price is not None and official_price is not None else None,
        0,
        12,
    )
    direct_gap = weighted_avg_present([
        (pressure_gap, 1.60),
        (coherence_gap, 1.10),
        (capacity_gap, 0.55),
        (price_gap, 0.70),
    ], min_count=1)

    # Accounting/statistical divergence. These are live-feed cross-checks. They
    # do not choose an ideology; they flag non-alignment between official series.
    divergence_score = cleaned_derived.get("measurement_divergence_score") or derived.get("measurement_divergence_score")
    divergence_signal = (divergence_score / 100.0) if divergence_score is not None else None
    cpi_deflator_gap_signal = score_range(
        abs((values.get("gdp_deflator_inflation") or 0.0) - official_price)
        if values.get("gdp_deflator_inflation") is not None and official_price is not None else None,
        1,
        16,
    )
    money_growth = values.get("broad_money_growth")
    monetary_signal = (derived.get("monetary_expansion_score") / 100.0) if derived.get("monetary_expansion_score") is not None else None
    money_price_gap_signal = score_range(
        (money_growth - max(official_price or 0.0, values.get("gdp_deflator_inflation") or 0.0))
        if money_growth is not None and (official_price is not None or values.get("gdp_deflator_inflation") is not None) else None,
        2,
        28,
    )
    hidden_labor_signal = (cleaned_derived.get("hidden_labor_slack_score") / 100.0) if cleaned_derived.get("hidden_labor_slack_score") is not None else None
    accounting_divergence = weighted_avg_present([
        (divergence_signal, 1.10),
        (cpi_deflator_gap_signal, 0.95),
        (money_price_gap_signal, 0.85),
        (monetary_signal, 0.55),
        (hidden_labor_signal, 0.75),
    ], min_count=1)

    # Structural masking residuals: if a system has deep finance, high debt,
    # high public overhead, high-cost PPP drag, or dust pressure, its official
    # health projection deserves audit even when official/cleaned headline gaps
    # are numerically small.
    finance_signal = (derived.get("financialization_score") / 100.0) if derived.get("financialization_score") is not None else None
    debt_signal = (derived.get("debt_pressure_score") / 100.0) if derived.get("debt_pressure_score") is not None else None
    overhead_signal = (derived.get("gov_overhead_score") / 100.0) if derived.get("gov_overhead_score") is not None else None
    ppp_high_cost_signal = (derived.get("ppp_high_cost_score") / 100.0) if derived.get("ppp_high_cost_score") is not None else None
    dust_signal = (cleaned_derived.get("dust_index") / 100.0) if cleaned_derived.get("dust_index") is not None else None
    weak_clean_coherence = score_range(62.0 - clean_coherence if clean_coherence is not None else None, 0, 38)
    structural_masking = weighted_avg_present([
        (finance_signal, 1.05),
        (debt_signal, 0.90),
        (overhead_signal, 0.80),
        (ppp_high_cost_signal, 0.55),
        (dust_signal, 0.90),
        (weak_clean_coherence, 0.85),
    ], min_count=2)

    # Revealed coherence: real productive/sovereign/infrastructure/technical
    # strength acts as a conservative truth cross-check. Strong revealed capacity
    # should reduce false accusations of distortion, but not erase debt/finance
    # or accounting divergence.
    capacity_shield = (cleaned_derived.get("capacity_shield_score") or derived.get("capacity_shield_score"))
    productive_capacity = (cleaned_derived.get("productive_capacity_score") or derived.get("productive_capacity_score"))
    sovereign_coherence = (cleaned_derived.get("sovereign_coherence_score") or derived.get("sovereign_coherence_score"))
    technical_depth = (cleaned_derived.get("technical_depth_score") or derived.get("technical_depth_score"))
    infrastructure_depth = (cleaned_derived.get("infrastructure_depth_score") or derived.get("infrastructure_depth_score"))
    revealed_capacity = weighted_avg_present([
        ((capacity_shield / 100.0) if capacity_shield is not None else None, 1.15),
        ((productive_capacity / 100.0) if productive_capacity is not None else None, 0.95),
        ((sovereign_coherence / 100.0) if sovereign_coherence is not None else None, 1.05),
        ((technical_depth / 100.0) if technical_depth is not None else None, 0.60),
        ((infrastructure_depth / 100.0) if infrastructure_depth is not None else None, 0.55),
    ], min_count=2)
    revealed_shortfall = (1.0 - revealed_capacity) if revealed_capacity is not None else None

    # Headline overstatement asks: does the official headline look healthy while
    # the cleaned/accounting/structural field says stress? This catches the USA=0
    # failure mode without making finance or debt alone equal "lying".
    official_health = weighted_avg_present([
        ((1.0 - score_range(official_pressure, 15, 78)) if official_pressure is not None else None, 1.00),
        ((official_coherence / 100.0) if official_coherence is not None else None, 0.85),
        (score_range(values.get("gdp_pc_growth"), -3, 5), 0.35),
    ], min_count=1)
    truth_stress = weighted_avg_present([
        ((clean_pressure / 100.0) if clean_pressure is not None else None, 1.05),
        (accounting_divergence, 1.00),
        (structural_masking, 1.05),
        (revealed_shortfall, 0.55),
    ], min_count=2)
    headline_overstatement = None
    if official_health is not None and truth_stress is not None:
        # If headline health and truth stress both exist, their product is a
        # conservative measure of an official-health overstatement risk.
        headline_overstatement = clamp(truth_stress * (0.45 + 0.55 * official_health))

    # Capacity correction: real build capacity lowers the final score modestly.
    # It is capped so that high capacity cannot fully hide measurement distortion.
    capacity_credit = 0.0
    if revealed_capacity is not None:
        capacity_credit = 0.07 * revealed_capacity

    raw = weighted_avg_present([
        (direct_gap, 1.25),
        (headline_overstatement, 1.15),
        (accounting_divergence, 1.00),
        (structural_masking, 0.95),
        (revealed_shortfall, 0.30),
    ], min_count=1)
    if raw is None:
        return None

    cleaned_pressure_gate = score_range(clean_pressure, 10, 82) if clean_pressure is not None else 0.5
    gate = 0.86 + 0.14 * cleaned_pressure_gate
    adjusted = clamp((raw * gate) - capacity_credit)

    # A small nonzero floor only when multiple live cross-checks exist. This is
    # not a dummy value; it is proportional to observed accounting/structural
    # residuals and prevents false 0s in high-finance/high-debt systems.
    residual_floor = weighted_avg_present([
        (accounting_divergence, 1.0),
        (structural_masking, 1.0),
    ], min_count=2)
    if residual_floor is not None:
        adjusted = max(adjusted, 0.30 * residual_floor)

    return round_or_none(clamp(adjusted) * 100, 2)

def classify_cluster(values: Dict[str, Optional[float]], derived: Dict[str, Optional[float]], input_count: int) -> str:
    if input_count < 3:
        return "low_signal"

    inflation = values.get("inflation")
    gdp_pc = values.get("gdp_pc_growth")
    retention_drag = derived.get("retention_drag")
    symbolic = derived.get("symbolic_inflation")
    dust = derived.get("dust_index")
    coherence = derived.get("coherence_score")
    finance = derived.get("financialization_score")
    sovereign = derived.get("sovereign_coherence_score")

    if inflation is not None and inflation >= 18:
        return "inflation_shock"
    if retention_drag is not None and retention_drag >= 5:
        return "retention_drag"
    if finance is not None and finance >= 68 and (symbolic or 0) >= (retention_drag or 0):
        return "symbolic_finance"
    if dust is not None and dust >= 62:
        return "dust_overhead"
    if (coherence is not None and coherence >= 62 and (gdp_pc is None or gdp_pc >= 0) and (inflation is None or inflation <= 8)) or (sovereign is not None and sovereign >= 68 and (inflation is None or inflation <= 12)):
        return "productive_coherence"
    return "transition"


def compact_history_row(
    year: int,
    values: Dict[str, Optional[float]],
    derived: Dict[str, Optional[float]],
    cluster: str,
    input_count: int,
    cleaned_values: Dict[str, Optional[float]],
    cleaned_derived: Dict[str, Optional[float]],
    cleaned_cluster: str,
) -> Dict[str, Any]:
    row = {
        "year": year,
        "inflation": values.get("inflation"),
        "gdp_deflator_inflation": values.get("gdp_deflator_inflation"),
        "gdp_growth": values.get("gdp_growth"),
        "gdp_pc_growth": values.get("gdp_pc_growth"),
        "broad_money_gdp": values.get("broad_money_gdp"),
        "broad_money_growth": values.get("broad_money_growth"),
        "domestic_credit_private_gdp": values.get("domestic_credit_private_gdp"),
        "debt_service_exports": values.get("debt_service_exports"),
        "gov_expense_gdp": values.get("gov_expense_gdp"),
        "unemployment": values.get("unemployment"),
        "labor_force_participation": values.get("labor_force_participation"),
        "employment_to_population": values.get("employment_to_population"),
        "exports_gdp": values.get("exports_gdp"),
        "manufacturing_value_added_gdp": values.get("manufacturing_value_added_gdp"),
        "industry_value_added_gdp": values.get("industry_value_added_gdp"),
        "manufacturing_mass_score": values.get("manufacturing_mass_score"),
        "industry_mass_score": values.get("industry_mass_score"),
        "manufacturing_growth": values.get("manufacturing_growth"),
        "industry_growth": values.get("industry_growth"),
        "manufactures_exports_share": values.get("manufactures_exports_share"),
        "high_tech_exports_share": values.get("high_tech_exports_share"),
        "r_and_d_gdp": values.get("r_and_d_gdp"),
        "researchers_per_million": values.get("researchers_per_million"),
        "patent_applications_mass_score": values.get("patent_applications_mass_score"),
        "container_port_mass_score": values.get("container_port_mass_score"),
        "rail_lines_mass_score": values.get("rail_lines_mass_score"),
        "electric_power_consumption_kwh_pc": values.get("electric_power_consumption_kwh_pc"),
        "military_expenditure_gdp": values.get("military_expenditure_gdp"),
        "ppp_price_level_ratio": values.get("ppp_price_level_ratio"),
        "ppp_gdp_conversion_factor": values.get("ppp_gdp_conversion_factor"),
        "ppp_private_consumption_factor": values.get("ppp_private_consumption_factor"),
        "productive_inflation": derived.get("productive_inflation"),
        "productive_capacity_score": derived.get("productive_capacity_score"),
        "sovereign_coherence_score": derived.get("sovereign_coherence_score"),
        "technical_depth_score": derived.get("technical_depth_score"),
        "infrastructure_depth_score": derived.get("infrastructure_depth_score"),
        "strategic_allocation_score": derived.get("strategic_allocation_score"),
        "capacity_shield_score": derived.get("capacity_shield_score"),
        "physical_depth_score": derived.get("physical_depth_score"),
        "physical_momentum_score": derived.get("physical_momentum_score"),
        "ppp_local_purchasing_power_score": derived.get("ppp_local_purchasing_power_score"),
        "ppp_high_cost_score": derived.get("ppp_high_cost_score"),
        "ppp_capacity_multiplier": derived.get("ppp_capacity_multiplier"),
        "retention_drag": derived.get("retention_drag"),
        "symbolic_inflation": derived.get("symbolic_inflation"),
        "dust_index": derived.get("dust_index"),
        "coherence_score": derived.get("coherence_score"),
        "financialization_score": derived.get("financialization_score"),
        "legacy_financialization_score": derived.get("legacy_financialization_score"),
        "debt_pressure_score": derived.get("debt_pressure_score"),
        "hidden_labor_slack_score": derived.get("hidden_labor_slack_score"),
        "monetary_expansion_score": derived.get("monetary_expansion_score"),
        "measurement_divergence_score": derived.get("measurement_divergence_score"),
        "measurement_robust_s2_score": derived.get("measurement_robust_s2_score"),
        "economic_distortion_index": derived.get("economic_distortion_index"),
        "pressure_score": derived.get("pressure_score"),
        "cluster": cluster,
        "cluster_label": CLUSTER_LABELS[cluster],
        "input_count": input_count,
    }
    for key in [
        "inflation",
        "gdp_deflator_inflation",
        "gdp_growth",
        "gdp_pc_growth",
        "broad_money_growth",
        "unemployment",
        "exports_gdp",
        "manufacturing_value_added_gdp",
        "industry_value_added_gdp",
        "manufacturing_mass_score",
        "industry_mass_score",
        "manufacturing_growth",
        "industry_growth",
        "manufactures_exports_share",
        "high_tech_exports_share",
        "r_and_d_gdp",
        "researchers_per_million",
        "patent_applications_mass_score",
        "container_port_mass_score",
        "rail_lines_mass_score",
        "electric_power_consumption_kwh_pc",
        "military_expenditure_gdp",
        "ppp_price_level_ratio",
        "ppp_gdp_conversion_factor",
        "ppp_private_consumption_factor",
    ]:
        row[f"clean_{key}"] = cleaned_values.get(key)
    for key in [
        "productive_inflation",
        "productive_capacity_score",
        "sovereign_coherence_score",
        "technical_depth_score",
        "infrastructure_depth_score",
        "strategic_allocation_score",
        "capacity_shield_score",
        "physical_depth_score",
        "physical_momentum_score",
        "ppp_local_purchasing_power_score",
        "ppp_high_cost_score",
        "ppp_capacity_multiplier",
        "retention_drag",
        "symbolic_inflation",
        "dust_index",
        "coherence_score",
        "financialization_score",
        "debt_pressure_score",
        "hidden_labor_slack_score",
        "monetary_expansion_score",
        "measurement_divergence_score",
        "measurement_robust_s2_score",
        "economic_distortion_index",
        "pressure_score",
    ]:
        row[f"clean_{key}"] = cleaned_derived.get(key)
    row["clean_cluster"] = cleaned_cluster
    row["clean_cluster_label"] = CLUSTER_LABELS[cleaned_cluster]
    return row


def previous_pressure(history: List[Dict[str, Any]], current_index: int, key: str = "pressure_score") -> Optional[float]:
    for idx in range(current_index - 1, -1, -1):
        value = history[idx].get(key)
        if value is not None:
            return float(value)
    return None


def enrich_pressure_deltas(history: List[Dict[str, Any]], key: str = "pressure_score", out_key: str = "pressure_delta") -> None:
    for idx, row in enumerate(history):
        prev = previous_pressure(history, idx, key)
        current = row.get(key)
        row[out_key] = round_or_none(float(current) - prev, 2) if current is not None and prev is not None else None


def average(values: Iterable[Optional[float]]) -> Optional[float]:
    vals = [float(v) for v in values if v is not None]
    if not vals:
        return None
    return round(mean(vals), 3)


def build_year_region_rollups(countries: List[Dict[str, Any]], mode: str = "official") -> Dict[int, Dict[str, Dict[str, Any]]]:
    buckets: Dict[int, Dict[str, List[Dict[str, Any]]]] = defaultdict(lambda: defaultdict(list))
    prefix = "clean_" if mode == "cleaned" else ""
    pressure_key = f"{prefix}pressure_score"
    cluster_key = f"{prefix}cluster"
    for country in countries:
        region = country.get("region") or "Unknown"
        for row in country.get("history", []):
            if row.get(pressure_key) is not None:
                buckets[int(row["year"])][region].append({"country": country, "row": row})

    rollups: Dict[int, Dict[str, Dict[str, Any]]] = {}
    for year, region_map in buckets.items():
        rollups[year] = {}
        for region, items in region_map.items():
            countries_with_coords = [item["country"] for item in items if item["country"].get("latitude") is not None and item["country"].get("longitude") is not None]
            rows = [item["row"] for item in items]
            if countries_with_coords:
                lat = average([c.get("latitude") for c in countries_with_coords])
                lon = average([c.get("longitude") for c in countries_with_coords])
            else:
                lat = None
                lon = None
            cluster_counts: Dict[str, int] = defaultdict(int)
            for row in rows:
                cluster_counts[row.get(cluster_key) or "low_signal"] += 1
            rollups[year][region] = {
                "region": region,
                "count": len(rows),
                "latitude": lat,
                "longitude": lon,
                "signal_mode": mode,
                "pressure_score": average([r.get(pressure_key) for r in rows]),
                "inflation": average([r.get(f"{prefix}inflation") for r in rows]),
                "retention_drag": average([r.get(f"{prefix}retention_drag") for r in rows]),
                "coherence_score": average([r.get(f"{prefix}coherence_score") for r in rows]),
                "dust_index": average([r.get(f"{prefix}dust_index") for r in rows]),
                "dominant_cluster": max(cluster_counts.items(), key=lambda kv: kv[1])[0] if cluster_counts else "low_signal",
                "cluster_counts": dict(sorted(cluster_counts.items())),
            }
    return rollups


def build_flows_by_year(rollups: Dict[int, Dict[str, Dict[str, Any]]]) -> Dict[int, List[Dict[str, Any]]]:
    years = sorted(rollups)
    flows: Dict[int, List[Dict[str, Any]]] = {}
    for year in years:
        prev_years = [candidate for candidate in years if candidate < year]
        if not prev_years:
            flows[year] = []
            continue
        prev_year = max(prev_years)
        current = rollups[year]
        previous = rollups[prev_year]
        deltas: List[Dict[str, Any]] = []
        for region, cur in current.items():
            if region not in previous:
                continue
            cur_pressure = cur.get("pressure_score")
            prev_pressure = previous[region].get("pressure_score")
            if cur_pressure is None or prev_pressure is None or cur.get("latitude") is None or cur.get("longitude") is None:
                continue
            deltas.append({**cur, "delta": round(float(cur_pressure) - float(prev_pressure), 3)})

        sources = sorted([r for r in deltas if r["delta"] > 0], key=lambda r: r["delta"], reverse=True)[:5]
        sinks = sorted([r for r in deltas if r["delta"] < 0], key=lambda r: r["delta"])[:5]
        if not sinks:
            sinks = sorted(deltas, key=lambda r: r.get("pressure_score") or 999)[:5]

        used_pairs = set()
        arcs: List[Dict[str, Any]] = []
        for source in sources:
            for sink in sinks:
                if source["region"] == sink["region"]:
                    continue
                pair = (source["region"], sink["region"])
                if pair in used_pairs:
                    continue
                pressure_gap = max(0.0, float(source.get("pressure_score") or 0) - float(sink.get("pressure_score") or 0))
                delta_gap = max(0.0, float(source.get("delta") or 0) - float(sink.get("delta") or 0))
                strength = min(100.0, pressure_gap * 0.55 + delta_gap * 2.2)
                if strength < 2.5:
                    continue
                used_pairs.add(pair)
                arcs.append({
                    "year": year,
                    "from_region": source["region"],
                    "to_region": sink["region"],
                    "from_latitude": source["latitude"],
                    "from_longitude": source["longitude"],
                    "to_latitude": sink["latitude"],
                    "to_longitude": sink["longitude"],
                    "from_pressure": round_or_none(source.get("pressure_score"), 2),
                    "to_pressure": round_or_none(sink.get("pressure_score"), 2),
                    "from_delta": round_or_none(source.get("delta"), 2),
                    "to_delta": round_or_none(sink.get("delta"), 2),
                    "strength": round_or_none(strength, 2),
                    "interpretation": "inferred_retention_pressure_gradient_not_trade_or_capital_flow",
                })
                break
        flows[year] = sorted(arcs, key=lambda arc: arc["strength"], reverse=True)[:8]
    return flows


def build_mass_scores(
    indicator_data: Dict[str, Dict[str, Dict[int, float]]],
    country_iso3s: Iterable[str],
    indicator_key: str,
) -> Dict[str, Dict[int, float]]:
    """Normalize absolute output mass per year on a log scale.

    This keeps the production layer from treating a tiny high-share economy as
    equivalent to a civilization-scale manufacturing base, while avoiding a
    pure winner-take-all linear world-share score.
    """
    allowed = set(country_iso3s)
    series_by_country = indicator_data.get(indicator_key, {})
    years = set()
    for iso3, series in series_by_country.items():
        if iso3 not in allowed:
            continue
        years.update(series.keys())

    max_by_year: Dict[int, float] = {}
    for year in years:
        logs = []
        for iso3, series in series_by_country.items():
            if iso3 not in allowed:
                continue
            value = series.get(year)
            if value is not None and value > 0:
                logs.append(math.log1p(value))
        if logs:
            max_by_year[year] = max(logs)

    out: Dict[str, Dict[int, float]] = {}
    for iso3, series in series_by_country.items():
        if iso3 not in allowed:
            continue
        for year, value in series.items():
            denom = max_by_year.get(year)
            if value is None or value <= 0 or not denom:
                continue
            out.setdefault(iso3, {})[year] = round_or_none(100.0 * math.log1p(value) / denom, 3)
    return out


def build_payload() -> Dict[str, Any]:
    countries_meta = load_countries()
    indicator_data: Dict[str, Dict[str, Dict[int, float]]] = {}
    source_meta: Dict[str, Dict[str, Any]] = {}

    for indicator in INDICATORS:
        print(f"Fetching {indicator.code} {indicator.label}", file=sys.stderr)
        series, meta = fetch_indicator(indicator)
        indicator_data[indicator.key] = series
        source_meta[indicator.key] = {
            "code": indicator.code,
            "label": indicator.label,
            "unit": indicator.unit,
            "role": indicator.role,
            "api_url": f"{WB_BASE}/country/all/indicator/{indicator.code}?format=json&per_page=20000&date={START_YEAR}:{END_YEAR}",
            "lastupdated": meta.get("lastupdated"),
            "sourceid": meta.get("sourceid"),
            "rows": meta.get("total"),
        }

    synthetic_series = {
        "manufacturing_mass_score": build_mass_scores(indicator_data, countries_meta.keys(), "manufacturing_value_added_usd"),
        "industry_mass_score": build_mass_scores(indicator_data, countries_meta.keys(), "industry_value_added_usd"),
        "patent_applications_mass_score": build_mass_scores(indicator_data, countries_meta.keys(), "patent_applications_residents"),
        "container_port_mass_score": build_mass_scores(indicator_data, countries_meta.keys(), "container_port_traffic_teu"),
        "rail_lines_mass_score": build_mass_scores(indicator_data, countries_meta.keys(), "rail_lines_km"),
    }
    synthetic_labels = {
        "manufacturing_mass_score": "Log-normalized manufacturing value-added mass score vs largest country-year producer",
        "industry_mass_score": "Log-normalized industry value-added mass score vs largest country-year producer",
        "patent_applications_mass_score": "Log-normalized resident patent-application mass score vs largest country-year producer",
        "container_port_mass_score": "Log-normalized container-port throughput mass score vs largest country-year port system",
        "rail_lines_mass_score": "Log-normalized rail-route infrastructure mass score vs largest country-year rail network",
    }

    countries: List[Dict[str, Any]] = []
    observed_years = set()
    for iso3, base in countries_meta.items():
        values: Dict[str, Optional[float]] = {}
        value_years: Dict[str, Optional[int]] = {}
        history_by_year: Dict[int, Dict[str, Optional[float]]] = {year: {} for year in range(START_YEAR, END_YEAR + 1)}

        for indicator in INDICATORS:
            series = indicator_data[indicator.key].get(iso3, {})
            latest_year, latest_value = latest_non_null(series)
            values[indicator.key] = round_or_none(latest_value)
            value_years[indicator.key] = latest_year
            for year, val in series.items():
                history_by_year.setdefault(year, {})[indicator.key] = round_or_none(val)
                observed_years.add(year)

        for key, by_country in synthetic_series.items():
            series = by_country.get(iso3, {})
            latest_year, latest_value = latest_non_null(series)
            values[key] = round_or_none(latest_value)
            value_years[key] = latest_year
            for year, val in series.items():
                history_by_year.setdefault(year, {})[key] = round_or_none(val)
                observed_years.add(year)

        if not any(v is not None for v in values.values()):
            continue

        derived = derive_metrics(values)
        cleaned_values = build_measurement_adjusted_values(values)
        cleaned_derived = derive_metrics(cleaned_values)
        latest_distortion = compute_economic_distortion_index(values, derived, cleaned_values, cleaned_derived)
        derived["economic_distortion_index"] = latest_distortion
        cleaned_derived["economic_distortion_index"] = latest_distortion
        observed_inputs = [key for key in MODEL_INPUT_KEYS if values.get(key) is not None]
        missing_inputs = [key for key in MODEL_INPUT_KEYS if values.get(key) is None]
        latest_years = [year for year in value_years.values() if year is not None]
        latest_source_year = max(latest_years) if latest_years else None
        latest_cluster = classify_cluster(values, derived, len(observed_inputs))
        cleaned_latest_cluster = classify_cluster(cleaned_values, cleaned_derived, len(observed_inputs))

        history: List[Dict[str, Any]] = []
        for year in sorted(history_by_year):
            year_keys = [indicator.key for indicator in INDICATORS] + list(synthetic_series.keys())
            year_values = {key: round_or_none(history_by_year[year].get(key)) for key in year_keys}
            input_count = len([key for key in MODEL_INPUT_KEYS if year_values.get(key) is not None])
            if input_count == 0:
                continue
            year_derived = derive_metrics(year_values)
            year_cleaned_values = build_measurement_adjusted_values(year_values)
            year_cleaned_derived = derive_metrics(year_cleaned_values)
            year_distortion = compute_economic_distortion_index(year_values, year_derived, year_cleaned_values, year_cleaned_derived)
            year_derived["economic_distortion_index"] = year_distortion
            year_cleaned_derived["economic_distortion_index"] = year_distortion
            cluster = classify_cluster(year_values, year_derived, input_count)
            cleaned_cluster = classify_cluster(year_cleaned_values, year_cleaned_derived, input_count)
            history.append(compact_history_row(
                year,
                year_values,
                year_derived,
                cluster,
                input_count,
                year_cleaned_values,
                year_cleaned_derived,
                cleaned_cluster,
            ))
        enrich_pressure_deltas(history)
        enrich_pressure_deltas(history, "clean_pressure_score", "clean_pressure_delta")

        countries.append({
            **base,
            "latest_source_year": latest_source_year,
            "values": values,
            "value_years": value_years,
            "derived": derived,
            "cleaned": {
                "values": cleaned_values,
                "derived": cleaned_derived,
                "latest_cluster": cleaned_latest_cluster,
                "latest_cluster_label": CLUSTER_LABELS[cleaned_latest_cluster],
            },
            "latest_cluster": latest_cluster,
            "latest_cluster_label": CLUSTER_LABELS[latest_cluster],
            "history": history,
            "quality": {
                "confidence": round(len(observed_inputs) / len(MODEL_INPUT_KEYS), 3),
                "observed_inputs": observed_inputs,
                "missing_inputs": missing_inputs,
                "input_count": len(observed_inputs),
                "required_input_count": len(MODEL_INPUT_KEYS),
            },
        })

    if not countries:
        raise RuntimeError("World Bank API returned no usable country observations; refusing to write empty live feed.")

    countries.sort(key=lambda item: item["name"])
    rollups = build_year_region_rollups(countries, "official")
    rollups_cleaned = build_year_region_rollups(countries, "cleaned")
    flows_by_year = build_flows_by_year(rollups)
    flows_by_year_cleaned = build_flows_by_year(rollups_cleaned)
    available_years = sorted([year for year in observed_years if ((year in rollups and len(rollups[year]) >= 2) or (year in rollups_cleaned and len(rollups_cleaned[year]) >= 2))])
    source_lastupdated = max(
        [meta.get("lastupdated") for meta in source_meta.values() if meta.get("lastupdated")],
        default=None,
    )

    return {
        "schema": "s2-economic-retention-atlas/live-feed/v2-dynamics",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "date_window": {"start_year": START_YEAR, "end_year": END_YEAR, "history_years_requested": HISTORY_YEARS},
        "formula_version": FORMULA_VERSION,
        "live_only": True,
        "source_family": "World Bank Indicators API / WDI plus non-IMF-linked source series where available (WIPO, UNESCO/UIS, SIPRI, IEA, infrastructure/transport) and conservative PPP/price-level cross-checks",
        "source_lastupdated": source_lastupdated,
        "source_metadata": {**source_meta, **{key: {"code": key, "label": label, "unit": "0-100", "role": "derived_physical_mass_normalizer", "api_url": None, "lastupdated": source_lastupdated, "sourceid": "derived_from_world_bank_absolute_value_added", "rows": None} for key, label in synthetic_labels.items()}},
        "cluster_labels": CLUSTER_LABELS,
        "model_notes": {
            "no_demo_data": "No synthetic country records or demo values are written. Derived layers use only present live-source inputs and emit null when needed inputs are absent.",
            "productive_capacity_score": "0-100 physical productive capacity proxy from manufacturing/industry value-added mass and GDP share, production momentum, manufactured/export complexity, technical depth, and a smaller real-growth term.",
            "sovereign_coherence_score": "0-100 conservative proxy for revealed state/build capacity from physical production, technical depth, logistics/energy infrastructure, and limited strategic allocation inputs. It is not a claim about ideology or military effectiveness.",
            "capacity_shield_score": "The stronger of productive capacity and sovereign coherence, used conservatively to reduce false dust/noise attribution.",
            "ppp_adjustment": "Conservative PPP/price-level adjustment from PA.NUS.GDP.PLI divided by 100. Low domestic price levels only nudge already-observed physical mass upward by at most 12%; high price levels can apply a small cost drag. It does not invent capacity where physical-production signals are absent.",
            "productive_inflation": "max(CPI inflation,0) multiplied by the physical productive capacity score, not GDP growth alone.",
            "retention_drag": "Residual positive inflation after productive component, weighted by present debt-service, government-expense, and negative-growth pressure scores.",
            "symbolic_inflation": "Residual positive inflation weighted by smooth broad-money/GDP and private-credit/GDP financialization scores. The old hard-clipped finance score is retained as legacy_financialization_score for audit only.",
            "measurement_robust_s2_score": "Measurement-robust S2 stress score from CPI/GDP-deflator cross-check, broad-money growth, hidden labor slack, debt/overhead, weak growth, and smoothed finance depth. This does not truly reverse hedonics or national methodology; it reduces dependence on any single official series.",
            "official_cleaned_toggle": "The app exposes a global Official/Cleaned toggle. Official mode uses direct World Bank series. Cleaned mode uses the measurement-adjusted proxy input set for all layers, including dynamics and flows.",
            "economic_distortion_index": "0-100 truth-oriented conservative S2 audit index. It compares official projection against cleaned cross-checks, accounting divergence, structural masking, and revealed build capacity. High means official health may be overstated relative to deeper live-source S2 signals; it is not proof of intentional lying.",
            "measurement_divergence_score": "CPI-vs-GDP-deflator divergence plus labor slack cross-checks from participation/employment signals.",
            "dust_index": "0-100 maintenance/overhead proxy from present debt, finance, government expense, unemployment, and negative-growth pressures, partially offset by measured physical productive capacity.",
            "coherence_score": "100 minus present pressure scores from inflation deviation, debt, finance, labor slack, negative growth, and missing capacity shield. Higher is more coherent.",
            "dynamics_layer": "Yearly cluster states and inferred regional pressure-gradient arcs from historical live-source indicators. Arcs are not measured trade/capital flows; they are visual hypotheses from retention-pressure gradients."
        },
        "dynamics": {
            "available_years": available_years,
            "default_year": max(available_years) if available_years else None,
            "region_rollups_by_year": {str(year): rollups[year] for year in sorted(rollups)},
            "region_rollups_by_year_cleaned": {str(year): rollups_cleaned[year] for year in sorted(rollups_cleaned)},
            "flows_by_year": {str(year): flows_by_year.get(year, []) for year in sorted(flows_by_year)},
            "flows_by_year_cleaned": {str(year): flows_by_year_cleaned.get(year, []) for year in sorted(flows_by_year_cleaned)},
            "flow_interpretation": "Inferred retention-pressure gradient arcs, not observed bilateral financial/trade flows.",
        },
        "countries": countries,
    }


def write_json(path: Path, payload: Any) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def main() -> int:
    payload = build_payload()
    write_json(DATA_DIR / "econ_latest.json", payload)
    audit = {
        "generated_at_utc": payload["generated_at_utc"],
        "formula_version": FORMULA_VERSION,
        "live_only": True,
        "country_count": len(payload["countries"]),
        "date_window": payload["date_window"],
        "source_metadata": payload["source_metadata"],
        "cluster_labels": payload["cluster_labels"],
        "dynamics": {
            "available_years": payload["dynamics"]["available_years"],
            "flow_interpretation": payload["dynamics"]["flow_interpretation"],
        },
        "model_notes": payload["model_notes"],
    }
    write_json(DATA_DIR / "source_audit.json", audit)
    print(f"Wrote {len(payload['countries'])} live country records to data/econ_latest.json")
    print(f"Dynamics years: {len(payload['dynamics']['available_years'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
