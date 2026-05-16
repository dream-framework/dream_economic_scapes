# Research notes: economic S2 retention atlas PoC

## Goal

Use live public macroeconomic feeds to test whether a map-based DREAM/S2 decomposition helps reveal country and regional patterns that are not obvious from CPI inflation alone.

## Live-only rule

The app has no synthetic data path. The only economic records displayed are the JSON records written by `scripts/fetch_worldbank.py` from live World Bank API calls. If the live-source action fails or has not run, the app renders no economic data.

## Model version

Current formula version: `s2-econ-retention-poc-v0.7-sovereign-coherence-conservative` with app shell `v1.1-sovereign-calibration`.

## Static-layer hypothesis

Observed inflation can be decomposed into visually separable research fields:

```text
observed positive inflation ~= productive component + residual pressure
residual pressure -> retention drag + symbolic/noise pressure
```

This is not asserted as an official macroeconomic identity. It is a research scaffold for visual exploration.

## Measurement-robust / Cleaned signal hypothesis

The first finance-field formula over-saturated high broad-money/private-credit countries. In particular, a hard 50..200 broad-money/GDP scale could make China appear as `100/100` financialization, while the U.S. could be understated when World Bank broad-money coverage was stale or absent. That should be treated as a model bug, not a finding.

The Cleaned signal mode therefore:

- smooths financial depth instead of hard-clipping it;
- keeps the old hard-clipped score only as `legacy_financialization_score` for audit;
- cross-checks CPI inflation against GDP-deflator inflation;
- adds broad-money growth as a monetary expansion signal;
- adds labor-force participation and employment-to-population as labor-stat cross-checks;
- emits a measurement divergence score so users can see when official series disagree.

This still does **not** truly reverse hedonics, CPI methodology, GDP-deflator methodology, or national labor definitions. It is a live-source robustness mode for research and PoC use; the UI lets users toggle Official/Cleaned globally across all tabs.

## Dynamics-layer hypothesis

The new layer treats country-year observations as points in a yearly retention-state space. It asks whether the global macro field forms visible:

- productive coherence zones;
- symbolic finance zones;
- retention-drag basins;
- dust/overhead zones;
- shock regions;
- transition regions.

A yearly pressure score is computed from present live-source inputs. Regional arcs are then inferred from year-over-year pressure-gradient changes. These arcs are **visual hypotheses only** and are not measured bilateral trade, capital, CPI, or migration flows.

## Null handling

- Missing live-source inputs remain `null`.
- Derived fields remain `null` when they lack enough live inputs.
- Each country emits a `quality.confidence` score based on observed model inputs.
- Country-year dynamic rows emit `input_count` so weak historical coverage is visible.

## Suggested next feeds

After the World Bank-only PoC works, add optional feed adapters:

1. OECD SDMX for higher-frequency OECD country indicators.
2. ECB Statistical Data Warehouse for Euro-area monetary and inflation feeds.
3. BIS credit/debt series.
4. IMF SDMX/DataMapper if the endpoint and licensing are stable for automated use.
5. FRED only if the repo owner is comfortable using a free API key through GitHub Actions secrets.
6. UN Comtrade or Atlas-style trade data for measured flow overlays, replacing the current inferred-gradient arcs.

## Validation checks to add next

- Country-level backtesting against inflation acceleration/deceleration.
- Regional clustering stability under formula parameter perturbation.
- Missingness sensitivity maps.
- Compare derived dust/coherence layers against future GDP growth revisions and inflation volatility.
- Compare inferred pressure-gradient arcs against measured trade/current-account/capital-flow data once a free source is added.
- Backtest the Cleaned signal mode against later inflation acceleration, GDP revisions, unemployment/participation changes, and crisis indicators.

## Playback and movie notes

The Dynamics layer can be played as a 40-year movie. The speed selector changes the year-step interval only; it does not alter data or interpolation. The movie-note text is generated from the selected year's live-source regional rollups and inferred pressure-gradient arcs. Voice narration has been removed; no browser speech synthesis is used.


## Official/Cleaned toggle

The next-release UI has a global Signal selector. Official mode shows direct World Bank-derived layers. Cleaned mode re-runs the same layer logic on measurement-adjusted proxy inputs: CPI is triangulated with GDP-deflator inflation and broad-money growth net of real growth; unemployment is cross-checked against labor-force participation and employment-to-population. This is not a true reversal of hedonics, GDP-deflator methodology, or labor-stat definitions. It is a robustness lens that asks whether the S2 pattern survives when the source signal is less dependent on one official headline series.

## Flow stripe bug note

The persistent horizontal stripe seen across Eurasia/North America was consistent with straight pressure-gradient polylines spanning longitudes across the map wrap/anti-meridian. The patched frontend now clears flows whenever the active layer is not Dynamics, includes the Signal mode in the flow cache key, lowers line opacity/weight, and splits anti-meridian segments instead of drawing one long wrapped line.


## v0.7 map-renderer change

The app shell now uses Apache D3/SVG for the world choropleth instead of Leaflet/OpenStreetMap raster tiles. This is a renderer/UI change only; it does not alter the live-feed ETL, formulas, Official/Cleaned toggle, Dynamics movie notes, or downloaded JSON schema. The purpose is to eliminate persistent horizontal stripe artifacts seen in the Leaflet build. Inferred flow arcs remain optional and are disabled by default. Very long longitude-jump arcs are skipped rather than wrapped across the map.


## v0.8 map-rendering note

The map renderer was changed from Leaflet/ECharts-style map components to a D3 SVG renderer using a Natural Earth projection. Country fills are applied directly to SVG paths, hover preserves the underlying fill color, and optional inferred-flow paths are hidden by default and clipped/skipped when they would create projection-spanning stripes.


## v0.6 physical-productivity calibration

Problem found during visual review: the cleaned Productive layer could rank China below the United States because the prior formula treated productivity mainly as real GDP/GDP-per-capita growth accompanying CPI inflation. That is not the intended DREAM/S2 meaning of productive coherence. A country that builds factories, ports, rail, power systems, ships, equipment, and durable industrial capacity should not be penalized merely because official CPI is low or because the service/asset share of GDP differs.

Patch: Productive is now a 0-100 physical productive-capacity score. Inputs include manufacturing value-added as % of GDP, industry value-added as % of GDP, absolute manufacturing value-added, absolute industry value-added, manufacturing and industry growth, manufactured exports share, high-tech exports share, exports/GDP, and a smaller real-growth term. Absolute values are log-normalized per year against the largest country-year producer to capture civilization-scale output without turning the metric into a pure size ranking.

Research caveat: these are still official World Bank/National Accounts series. This does not directly observe high-speed rail, shipbuilding tonnage, port throughput, robot density, grid buildout, or supply-chain centrality. Those should become future feeds when free and reliable sources are added.

## v1.1 sovereign-coherence calibration

The next calibration step separates official market accounting from revealed build coherence. GDP, CPI, and finance depth remain useful, but they are not allowed to define productive civilization-scale capacity by themselves. The new Sovereign coherence field is deliberately conservative and uses only present live-source inputs: physical production, R&D/technical depth, patent mass, port throughput, rail route-km, electricity consumption per capita, and SIPRI military-expenditure share.

Interpretation rules:

- High Sovereign coherence means the source record shows durable build capacity or technical/infrastructure depth.
- It does not mean the state is good, free, efficient, safe, or militarily superior.
- It does not infer hidden programs when public data are missing. Countries with sparse coverage stay low-confidence or null.
- Capacity shield reduces false dust/noise attribution where production, technical depth, or infrastructure are visibly real.

This addresses the calibration issue where a country with large industrial build capacity could appear less productive than a service/asset-heavy economy under GDP/CPI-only logic.


## v15 Conservative PPP / price-level adjustment

This build adds a conservative purchasing-power cross-check using World Bank/WDI PPP price-level indicators. The live API input is `PA.NUS.GDP.PLI`, the GDP price-level index on a US=100 scale, divided by 100 before use so the model keeps ratio semantics. Values below 1 can indicate that market-USD output understates local domestic purchasing power. The model uses this only as a small adjustment to already-observed physical-production mass signals: maximum +12% multiplier when local price levels are low, maximum -6% cost drag when price levels are high. It does not invent build capacity where manufacturing, industry, infrastructure, or technical-depth inputs are missing.

## v18 Economic distortion index calibration fix

The Economic distortion index is a conservative S2 overstatement/divergence score:

- cleaned S2 pressure above official S2 pressure;
- official coherence above cleaned coherence;
- official capacity above cleaned capacity;
- cleaned hidden labor slack above official hidden labor slack;
- cleaned price-pressure estimate above official CPI;
- explicit price-series measurement divergence.

The output should be read as: "official-facing data may overstate economic health relative to cleaned S2 cross-checks." It is not a truth machine and not proof that a state intentionally lies. The purpose is to identify countries requiring deeper audit.

The UI was made denser and the movie text was moved off the map. Dynamics playback now defaults to 0.5x and includes 0.25x for readable narration. Light mode is supported but formulas, indicator IDs, and math notation are unchanged.


## v18 Distortion-index calibration fix

This release fixes a one-sided-gate failure in the Economic distortion index. Earlier builds could show 0 for large advanced financialized economies when cleaned S2 pressure was not strictly higher than official pressure. v18 keeps the direct Official-vs-Cleaned deterioration channel, but adds conservative live-source audit residuals: financialization depth, debt pressure, government overhead, hidden labor slack, CPI/deflator divergence, monetary expansion, PPP high-cost signal, dust pressure, and weak cleaned coherence. The score remains an audit-priority signal, not proof of intentional lying. Missing live-source values remain null and no dummy country records are generated.


## v21 Truth-oriented distortion audit

This release recalibrates the Economic distortion index so it no longer depends only on whether cleaned pressure is numerically higher than official pressure. The score now combines four conservative live-source blocks:

1. Official-over-cleaned gap: official pressure, coherence, and capacity compared with cleaned S2 cross-checks.
2. Accounting divergence: CPI vs GDP deflator, broad-money growth vs price pressure, and labor participation/employment slack.
3. Structural masking: finance depth, debt service, public overhead, high-cost PPP drag, weak cleaned coherence, and dust pressure.
4. Revealed capacity check: productive capacity, sovereign coherence, technical depth, infrastructure depth, and capacity shield reduce false positives where real build capacity is visible.

This is not a proof-of-lying score and does not treat any single institution as truth. It is an audit-priority index: how far the official-facing macro projection appears to diverge from cross-checked S2 coherence. Missing live inputs remain null; the app writes no dummy country records and invents no country values.
