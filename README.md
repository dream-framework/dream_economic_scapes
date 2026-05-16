# S2 Global Economic Retention Atlas

Live-feed GitHub Pages proof-of-concept for a DREAM/S2 economic atlas.

This repo is intentionally **free-stack** and **live-only**:

- No backend server.
- No paid map service.
- No API keys.
- No demo or mocked economic data.
- GitHub Actions refreshes public live-source data into repo JSON.
- GitHub Pages serves the static app.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Plain HTML/CSS/JavaScript | No build pipeline needed for the PoC. |
| Map | Apache D3/SVG + world-atlas GeoJSON/TopoJSON | Free, no key, static-friendly, avoids raster tile seams and Leaflet wrap artifacts. |
| Boundaries | world-atlas TopoJSON CDN | Static geography only, not demo economic data. |
| Data ETL | Python | Easy source audit and metric formulas. |
| Scheduler | GitHub Actions cron + manual trigger | Free for public repos and simple for private repos within GitHub limits. |
| Storage | `/data/econ_latest.json` committed to the repo | The GitHub Page feeds from the GitHub repo itself. |

## Live data sources

The PoC pulls from the World Bank Indicators API using World Development Indicators and linked source databases. The ETL queries a rolling **40-year** date window and reads the newest non-null country observation for the static layers.

Indicators used:

| Key | World Bank code | Role |
| --- | --- | --- |
| `inflation` | `FP.CPI.TOTL.ZG` | observed CPI inflation |
| `cpi_index` | `FP.CPI.TOTL` | observed CPI level |
| `gdp_deflator_inflation` | `NY.GDP.DEFL.KD.ZG` | economy-wide inflation cross-check |
| `gdp_growth` | `NY.GDP.MKTP.KD.ZG` | real output growth |
| `gdp_pc_growth` | `NY.GDP.PCAP.KD.ZG` | productive growth proxy |
| `broad_money_gdp` | `FM.LBL.BMNY.GD.ZS` | smoothed financial depth proxy |
| `broad_money_growth` | `FM.LBL.BMNY.ZG` | monetary expansion proxy |
| `domestic_credit_private_gdp` | `FS.AST.PRVT.GD.ZS` | financialization proxy |
| `debt_service_exports` | `DT.TDS.DECT.EX.ZS` | debt pressure proxy |
| `gov_expense_gdp` | `GC.XPN.TOTL.GD.ZS` | overhead proxy |
| `unemployment` | `SL.UEM.TOTL.ZS` | labor slack proxy |
| `labor_force_participation` | `SL.TLF.CACT.ZS` | hidden labor slack cross-check |
| `employment_to_population` | `SL.EMP.TOTL.SP.ZS` | hidden labor slack cross-check |
| `trade_gdp` | `NE.TRD.GNFS.ZS` | openness context |
| `exports_gdp` | `NE.EXP.GNFS.ZS` | external throughput proxy |
| `manufacturing_value_added_gdp` | `NV.IND.MANF.ZS` | manufacturing depth proxy |
| `industry_value_added_gdp` | `NV.IND.TOTL.ZS` | industry depth proxy |
| `manufacturing_value_added_usd` | `NV.IND.MANF.CD` | absolute manufacturing mass proxy |
| `industry_value_added_usd` | `NV.IND.TOTL.CD` | absolute industrial mass proxy |
| `manufacturing_growth` | `NV.IND.MANF.KD.ZG` | physical production momentum proxy |
| `industry_growth` | `NV.IND.TOTL.KD.ZG` | industrial momentum proxy |
| `manufactures_exports_share` | `TX.VAL.MANF.ZS.UN` | manufacturing export complexity proxy |
| `high_tech_exports_share` | `TX.VAL.TECH.MF.ZS` | productive complexity proxy |
| `r_and_d_gdp` | `GB.XPD.RSDV.GD.ZS` | technical depth proxy, non-IMF-linked |
| `researchers_per_million` | `SP.POP.SCIE.RD.P6` | technical labor depth proxy, UNESCO/UIS-linked |
| `patent_applications_residents` | `IP.PAT.RESD` | revealed technical-output proxy, WIPO-linked |
| `container_port_traffic_teu` | `IS.SHP.GOOD.TU` | logistics throughput proxy |
| `rail_lines_km` | `IS.RRS.TOTL.KM` | physical infrastructure proxy |
| `electric_power_consumption_kwh_pc` | `EG.USE.ELEC.KH.PC` | energy-depth proxy, IEA-linked |
| `military_expenditure_gdp` | `MS.MIL.XPND.GD.ZS` | conservative state-directed strategic allocation proxy, SIPRI-linked |
| `manufacturing_mass_score` | derived from `NV.IND.MANF.CD` | log-normalized 0-100 manufacturing mass score |
| `industry_mass_score` | derived from `NV.IND.TOTL.CD` | log-normalized 0-100 industrial mass score |
| `patent_applications_mass_score` | derived from `IP.PAT.RESD` | log-normalized 0-100 resident-patent mass score |
| `container_port_mass_score` | derived from `IS.SHP.GOOD.TU` | log-normalized 0-100 container-port throughput score |
| `rail_lines_mass_score` | derived from `IS.RRS.TOTL.KM` | log-normalized 0-100 rail-route infrastructure score |

## Derived research layers

These are research proxies, not official economic categories. A global **Signal** toggle switches every tab between Official and Cleaned mode. Official mode uses direct World Bank series; Cleaned mode uses a measurement-robust proxy input set that triangulates CPI against GDP-deflator inflation, broad-money growth, hidden labor slack, debt/overhead, weak growth, and smoothed finance depth. This does not truly reverse hedonics or national-statistical methodology.

- **Observed inflation**: latest non-null CPI inflation.
- **Productive capacity**: 0-100 physical production-capacity score from manufacturing/industry value-added mass, manufacturing/industry GDP share, production momentum, manufactured exports, high-tech exports, technical depth, and a smaller real-growth term. This replaces the old GDP-growth-only Productive tab.
- **Sovereign coherence**: 0-100 conservative revealed-build proxy from physical production, technical depth, logistics/energy infrastructure, and limited state-directed strategic allocation. It uses non-IMF-linked source channels where available and is intentionally not an ideology, narrative, or military-effectiveness score.
- **Capacity shield**: the stronger of Productive capacity and Sovereign coherence, used conservatively to avoid mislabeling real build capacity as dust/noise.
- **Productive inflation**: positive CPI inflation multiplied by Productive capacity, kept as an audit field rather than the main map layer.
- **Retention drag**: residual positive inflation after productive component, weighted by present debt-service, government-expense, and negative-growth pressure scores.
- **Symbolic/noise inflation**: residual positive inflation weighted by smoothed broad-money/GDP and private-credit/GDP financialization scores.
- **S2 pressure**: composite retention-pressure score shown in either Official or Cleaned mode.
- **Dust index**: 0-100 maintenance/overhead proxy from present debt, finance, government expense, unemployment, and negative-growth pressures, partially offset by measured capacity shield.
- **Coherence score**: 100 minus present pressure scores from inflation deviation, debt, finance, labor slack, negative growth, and weak capacity shield.
- **Dynamics**: yearly 40-year cluster states plus inferred regional retention-pressure-gradient arcs.

The ETL emits `null` when needed source inputs are missing. It does not substitute demo values.

## Dynamics layer

The **Dynamics** tab adds the requested historical layer:

- timeline slider across the live-source years available in the 40-year pull;
- play/pause animation;
- playback speed control at 0.5x, 1x, 2x, and 4x;
- text movie notes that summarize the selected year from live-source rollups;
- no voice narration or browser speech;
- per-country yearly cluster state;
- country inspector for pressure score, pressure delta, inflation, retention drag, dust, and coherence;
- regional flow arcs.

The arcs are **not measured bilateral trade, capital, or CPI flows**. They are explicitly labelled as inferred retention-pressure-gradient arcs from regional year-over-year pressure changes. This makes them suitable for visual hypothesis generation, not final econometric claims.

Cluster states:

| Cluster | Meaning |
| --- | --- |
| Productive coherence | Higher coherence, non-negative growth, moderate inflation. |
| Symbolic finance | High financialization pressure where symbolic residual dominates. |
| Retention drag | Residual inflation weighted by debt, overhead, or weak growth. |
| Inflation shock | Very high observed CPI inflation. |
| Dust / overhead | Maintenance/overhead pressures dominate. |
| Transition / mixed | No single pressure mode dominates. |
| Low signal | Insufficient live-source inputs for a strong state assignment. |


## v0.5 official/cleaned signal toggle

The app replaces the separate Clean S2 tab with a global **Signal: Official / Cleaned** toggle that affects every layer, including Dynamics and inferred flow arcs. It also corrects the earlier finance-field saturation problem. The old finance score clipped broad-money/GDP and private-credit/GDP at hard ceilings, which could display countries such as China as `100/100`. The new visible finance field uses a smooth asymptotic transform, keeps the old hard-clipped value only as `legacy_financialization_score` for audit, and adds cross-check inputs: GDP-deflator inflation, broad-money growth, labor-force participation, and employment-to-population.

## v0.4 UI stability patch

The app now opens directly on the Dynamics layer so the movie controls are visible immediately after the live JSON loads. The map renderer was also stabilized for timeline playback:

* Leaflet uses canvas-preferred rendering and disables zoom/fade animation.
* Timeline playback updates country styles through `requestAnimationFrame`.
* Tooltip text is not recomputed for every country on every movie tick.
* Flow arcs are redrawn only when the active year/filter actually changes.
* Default playback intervals are slightly slower to reduce raster-tile flicker.


## Download analysis JSON

The top toolbar includes a **Download JSON** button. After the live feed loads, it exports a single analysis bundle containing:

- the loaded `data/econ_latest.json` payload;
- the current app view context: Official/Cleaned mode, selected layer, selected Dynamics year, filters, and selected country;
- `data/source_audit.json` when available;
- notes reminding downstream analysis that inferred arcs are pressure-gradient hypotheses, not measured bilateral flows.

This export is meant for copy-off analysis, reproducibility checks, and sharing the exact live-feed state used in a visual inspection.

## Deploy

1. Create a new GitHub repo, for example `s2-economic-retention-atlas`.
2. Upload these files to the repo's `main` branch.
3. Go to **Settings -> Pages**.
4. Set **Source** to **GitHub Actions**.
5. Go to **Actions -> Refresh live economic data and deploy Pages**.
6. Click **Run workflow**.

The first successful run creates:

- `data/econ_latest.json`
- `data/source_audit.json`
- a deployed GitHub Pages site

Until the action has successfully written live JSON, the app shows a tiny loader and then an exact no-data/error message. This is expected because there is no demo fallback.

## Local validation

Syntax checks that do not require network access:

```bash
python -m py_compile scripts/fetch_worldbank.py
node --check assets/app.js
```

Live ETL check, requires internet:

```bash
pip install -r scripts/requirements.txt
python scripts/fetch_worldbank.py
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Research caveats

- World Bank macro indicators are not real-time tick data. They are live public feeds that update as the source database updates.
- Country coverage varies by indicator, especially debt-service and government-expense fields.
- Flow arcs are inferred from pressure gradients and must not be interpreted as observed bilateral flows.
- The PoC is designed to test whether the visual decomposition is useful before adding more feeds such as OECD, IMF SDMX, ECB, BIS, or FRED-key-based feeds.
- The formulas are deliberately transparent and versioned in `scripts/fetch_worldbank.py` and in the output JSON.
- The Cleaned signal mode is a robustness cross-check, not a "true inflation" or shadow-statistics claim. It should be tested against later inflation acceleration, output revisions, and crisis onsets before being treated as evidence.


## v0.8 map-rendering note

The map renderer was changed from Leaflet/ECharts-style map components to a D3 SVG renderer using a Natural Earth projection. Country fills are applied directly to SVG paths, hover preserves the underlying fill color, and optional inferred-flow paths are hidden by default and clipped/skipped when they would create projection-spanning stripes.


## v0.9 UI addition

Zoom controls: use the + / - / Reset buttons on the map, mouse wheel, trackpad pinch, or drag to pan.

## v0.6 calibration note

The Productive layer no longer means “GDP growth explains inflation.” That was too service/GDP sensitive and could understate countries with civilization-scale physical build capacity. The layer now maps **productive capacity**: manufacturing/industry depth, absolute manufacturing and industry mass, production momentum, manufactured export share, high-tech export share, and a smaller growth term. Absolute mass is log-normalized by year so a very large industrial base is visible without making the map a pure winner-take-all GDP chart.

## v1.1 sovereign-coherence calibration

This release adds a conservative **Sovereign coherence** layer and recalibrates Dust, Coherence, S2 pressure, and Cleaned S2 so real build capacity is less likely to be treated as decay/noise. The goal is not to infer hidden capability from ideology or media narratives. The app only uses live-source fields when present, including non-IMF-linked WDI channels such as WIPO patents, UNESCO/UIS R&D inputs, IEA electricity consumption, transport infrastructure, and SIPRI military-expenditure share. Missing countries remain `null` rather than being guessed.

The model now distinguishes:

- market/official macro signal;
- physical productive capacity;
- broader revealed sovereign build coherence;
- measurement-robust Cleaned signal.

This is a calibration pass, not a final geopolitical capability model.

## v0.12 bilingual interface

The static site now includes a compact EN/RU toggle in the toolbar. The Russian interface translates the visible UI, layer names, method notes, audit panels, tooltips, legends, and movie notes while preserving mathematical notation, units, source identifiers, and the underlying live JSON schema.


## v1.4 beauty-renderer lock

This release keeps the bilingual/sovereign-calibration feature set but restores the D3/SVG map paint path from the v0.08 build — the version confirmed visually clean in project review. It removes the v0.13 GPU/will-change map overrides and returns to direct country-path fills with light hover easing. The goal is to minimize flicker while preserving zoom buttons, RU/EN UI, Official/Cleaned mode, JSON export, and the sovereign-coherence calibration.


## v15 Conservative PPP / price-level adjustment

This build adds a conservative purchasing-power cross-check using World Bank/WDI PPP price-level indicators. The live API input is `PA.NUS.GDP.PLI`, the GDP price-level index on a US=100 scale, divided by 100 before use so the model keeps ratio semantics. Values below 1 can indicate that market-USD output understates local domestic purchasing power. The model uses this only as a small adjustment to already-observed physical-production mass signals: maximum +12% multiplier when local price levels are low, maximum -6% cost drag when price levels are high. It does not invent build capacity where manufacturing, industry, infrastructure, or technical-depth inputs are missing.

## v16 Distortion index + compact theme release

This build adds a conservative **Economic distortion index** layer. It compares the official projection against the cleaned S2 cross-checks and asks whether cleaned signals imply more stress, less coherence, weaker capacity, larger hidden labor slack, or price-series divergence. It is a statistical overstatement/divergence flag, not a legal proof of intentional misreporting.

UI changes:

- compact typography and smaller data cards for denser research use;
- light/dark theme toggle using a tiny Font Awesome icon button;
- Russian/English UI retained, including legends;
- Dynamics movie default speed slowed to 0.5x, with 0.25x available for reading notes;
- movie text notes moved into the inspector side panel so the map remains visible;
- D3/SVG "beauty" renderer retained to avoid the prior stripe/flicker issues.

Data rule: no dummy country records, no invented values. The ETL only emits live-source values, nulls, and derived statistics from those values plus documented conservative formula weights.


## v18 Distortion-index calibration fix

This release fixes a one-sided-gate failure in the Economic distortion index. Earlier builds could show 0 for large advanced financialized economies when cleaned S2 pressure was not strictly higher than official pressure. v18 keeps the direct Official-vs-Cleaned deterioration channel, but adds conservative live-source audit residuals: financialization depth, debt pressure, government overhead, hidden labor slack, CPI/deflator divergence, monetary expansion, PPP high-cost signal, dust pressure, and weak cleaned coherence. The score remains an audit-priority signal, not proof of intentional lying. Missing live-source values remain null and no dummy country records are generated.


## v21 Truth-oriented distortion audit

This release recalibrates the Economic distortion index so it no longer depends only on whether cleaned pressure is numerically higher than official pressure. The score now combines four conservative live-source blocks:

1. Official-over-cleaned gap: official pressure, coherence, and capacity compared with cleaned S2 cross-checks.
2. Accounting divergence: CPI vs GDP deflator, broad-money growth vs price pressure, and labor participation/employment slack.
3. Structural masking: finance depth, debt service, public overhead, high-cost PPP drag, weak cleaned coherence, and dust pressure.
4. Revealed capacity check: productive capacity, sovereign coherence, technical depth, infrastructure depth, and capacity shield reduce false positives where real build capacity is visible.

This is not a proof-of-lying score and does not treat any single institution as truth. It is an audit-priority index: how far the official-facing macro projection appears to diverge from cross-checked S2 coherence. Missing live inputs remain null; the app writes no dummy country records and invents no country values.
