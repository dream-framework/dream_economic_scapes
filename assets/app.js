(() => {
  'use strict';
  const BUILD_TAG = 'v21-truth-distortion';

  const DATA_URL = new URL('data/econ_latest.json', window.location.href).href;
  const AUDIT_URL = new URL('data/source_audit.json', window.location.href).href;
  const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
  const MAP_NAME = 'dream_world_d3';

  const CLUSTER_COLORS = {
    productive_coherence: '#79f2b0',
    symbolic_finance: '#b9a1ff',
    retention_drag: '#ffb84d',
    inflation_shock: '#ff6478',
    dust_overhead: '#9a7a57',
    transition: '#74d7ff',
    low_signal: '#2a3745'
  };

  const I18N = {
    en: {
      ui: {
        eyebrow: 'DREAM / S2 research PoC',
        title: 'S2 Global Economic Retention Atlas',
        loadingLiveFeed: 'loading live feed',
        noCachedData: 'No cached data loaded yet.',
        signal: 'Signal', official: 'Official', cleaned: 'Cleaned', region: 'Region', allRegions: 'All regions', search: 'Search', searchPlaceholder: 'country name or ISO3', downloadJson: 'Download JSON', downloadTitle: 'Download the loaded live-feed JSON analysis bundle',
        zoomIn: 'Zoom in', zoomOut: 'Zoom out', resetMap: 'Reset map view', reset: 'Reset', legend: 'Legend', playPauseTimeline: 'Play or pause timeline', speed: 'speed', showInferredFlows: 'show inferred flows',
        movieNotesDefault: 'Movie notes will summarize the selected year after live data loads.', dynamicsNoteDefault: 'Inferred pressure-gradient arcs from historical live-source indicators.',
        hoverClickCountry: 'Hover / click country', noCountrySelected: 'No country selected', noCountrySelectedPeriod: 'No country selected.', moveOverMapAfterLoad: 'Move over the map after the live feed loads.', moveOverMapSelectedYear: 'Move over the map to inspect the selected year.',
        currentLayer: 'Current layer', recentHistory: 'Recent live-source history', auditTrail: 'Audit trail', waitingForLiveFeed: 'Waiting for live feed.', noDynamicYears: 'no dynamic years',
        liveFeedLoaded: 'live feed loaded', countries: 'countries', generated: 'Generated', sourceLastUpdate: 'source last update', dynamics: 'dynamics', noLiveFeedRendered: 'no live feed data rendered',
        loadingBoundaries: 'Loading live feed and country boundaries...', noLivePrefix: 'No live feed data rendered.', noWorldBankMatch: 'No live World Bank country match.', noDynamicRecord: 'No live dynamic record for', selectedYear: 'selected year',
        year: 'Year', cluster: 'Cluster', pressure: 'Pressure', deltaPressure: 'Δ pressure', confidence: 'Confidence', latestSourceYear: 'Latest source year', formulaVersion: 'Formula version', signalMode: 'Signal mode',
        preparing: 'Preparing...', noLiveForDownload: 'No live-feed JSON is loaded yet. Run the refresh workflow or wait for the page to finish loading.',
        noHistoryCountry: 'Not enough live-source history for this country.', noDynamicHistoryCountry: 'Not enough live-source dynamic history for this country.',
        selectCountryDynamic: 'Select a country to inspect its 40-year retention state path.', selectCountryLive: 'Select a country to inspect live-source inputs.',
        lowSignal: 'low signal', mixed: 'mixed', shock: 'shock', text: 'text', themeDark: 'Dark theme', themeLight: 'Light theme', themeToggle: 'Toggle light/dark theme'
      },
      layers: {
        inflation: ['Inflation', 'Observed annual consumer-price inflation from the newest non-null World Bank / IMF IFS country observation.'],
        productive_capacity_score: ['Productive capacity', 'Physical production-capacity proxy: manufacturing/industry mass, GDP share, production momentum, manufactured exports, high-tech exports, technical depth, and a smaller real-growth term.'],
        sovereign_coherence_score: ['Sovereign coherence', 'Conservative revealed build-capacity proxy from physical production, technical depth, logistics/energy infrastructure, and limited strategic allocation inputs. It is not a narrative or ideology score.'],
        ppp_local_purchasing_power_score: ['PPP adjustment', 'Conservative price-level / purchasing-power cross-check. A lower local price level can modestly raise already-observed physical build capacity; it cannot create capacity without real production signals.'],
        economic_distortion_index: ['Distortion index', 'Truth-oriented conservative S2 audit: official projection compared with cleaned cross-checks, accounting divergence, structural masking, and revealed build capacity. High means official data may overstate economic health; it is not proof of intentional lying.'],
        retention_drag: ['Retention drag', 'Research proxy: residual inflation weighted by debt-service, government-expense, and weak-growth pressures.'],
        dynamics: ['Dynamics', '40-year live-feed layer: yearly DREAM/S2 proxy clusters plus inferred regional retention-pressure-gradient arcs. Arcs are hypotheses, not measured bilateral flows.'],
        pressure_score: ['S2 pressure', 'Composite DREAM/S2 retention-pressure score. The Official/Cleaned toggle changes whether this uses direct official-series inputs or the measurement-robust cleaned proxy inputs.'],
        symbolic_inflation: ['Symbolic / noise', 'Research proxy: residual inflation weighted by broad-money and private-credit financialization signals.'],
        dust_index: ['Dust index', 'Maintenance/overhead proxy using debt-service, financialization, government expense, unemployment, and negative growth pressure.'],
        coherence_score: ['Coherence', 'Stability proxy: higher means lower inflation deviation, debt pressure, labor slack, and financialization pressure.'],
        financialization_score: ['Finance field', 'Financialization proxy from broad money/GDP and domestic private credit/GDP where live-source coverage exists.'],
        debt_pressure_score: ['Debt pressure', 'Debt-service pressure proxy from total debt service as a share of exports where the live source has coverage.']
      },
      clusters: {
        productive_coherence: 'productive coherence', symbolic_finance: 'symbolic finance', retention_drag: 'retention drag', inflation_shock: 'inflation shock', dust_overhead: 'dust overhead', transition: 'transition', low_signal: 'low signal'
      }
    },
    ru: {
      ui: {
        eyebrow: 'DREAM / исследовательский PoC S2',
        title: 'Глобальный атлас экономической ретенции S2',
        loadingLiveFeed: 'загрузка живого потока данных',
        noCachedData: 'Кэшированные данные ещё не загружены.',
        signal: 'Сигнал', official: 'Официальный', cleaned: 'Очищенный', region: 'Регион', allRegions: 'Все регионы', search: 'Поиск', searchPlaceholder: 'страна или код ISO3', downloadJson: 'Скачать JSON', downloadTitle: 'Скачать загруженный пакет данных JSON для анализа',
        zoomIn: 'Приблизить', zoomOut: 'Отдалить', resetMap: 'Сбросить вид карты', reset: 'Сброс', legend: 'Легенда', playPauseTimeline: 'Запустить или остановить временную шкалу', speed: 'скорость', showInferredFlows: 'показать вычисленные потоки',
        movieNotesDefault: 'Текстовые заметки к фильму появятся после загрузки живых данных.', dynamicsNoteDefault: 'Вычисленные дуги градиента давления по историческим живым индикаторам.',
        hoverClickCountry: 'Навести / выбрать страну', noCountrySelected: 'Страна не выбрана', noCountrySelectedPeriod: 'Страна не выбрана.', moveOverMapAfterLoad: 'Наведите курсор на карту после загрузки живого потока данных.', moveOverMapSelectedYear: 'Наведите курсор на карту, чтобы изучить выбранный год.',
        currentLayer: 'Текущий слой', recentHistory: 'История по живым источникам', auditTrail: 'Аудит данных', waitingForLiveFeed: 'Ожидание живого потока данных.', noDynamicYears: 'нет динамических лет',
        liveFeedLoaded: 'живой поток загружен', countries: 'стран', generated: 'Сгенерировано', sourceLastUpdate: 'последнее обновление источника', dynamics: 'динамика', noLiveFeedRendered: 'живые данные не отрисованы',
        loadingBoundaries: 'Загрузка живого потока и границ стран...', noLivePrefix: 'Живые данные не отрисованы.', noWorldBankMatch: 'Нет совпадения со страной World Bank.', noDynamicRecord: 'Нет динамической записи для', selectedYear: 'выбранного года',
        year: 'Год', cluster: 'Кластер', pressure: 'Давление', deltaPressure: 'Δ давления', confidence: 'Уверенность', latestSourceYear: 'Последний год источника', formulaVersion: 'Версия формулы', signalMode: 'Режим сигнала',
        preparing: 'Подготовка...', noLiveForDownload: 'Живой JSON ещё не загружен. Запустите workflow обновления или дождитесь загрузки страницы.',
        noHistoryCountry: 'Недостаточно истории по живым источникам для этой страны.', noDynamicHistoryCountry: 'Недостаточно динамической истории по живым источникам для этой страны.',
        selectCountryDynamic: 'Выберите страну, чтобы изучить её 40-летнюю траекторию ретенционного состояния.', selectCountryLive: 'Выберите страну, чтобы изучить входные данные из живых источников.',
        lowSignal: 'низкий сигнал', mixed: 'смешанный режим', shock: 'шок', text: 'текст', themeDark: 'Тёмная тема', themeLight: 'Светлая тема', themeToggle: 'Переключить светлую/тёмную тему'
      },
      layers: {
        inflation: ['Инфляция', 'Наблюдаемая годовая инфляция потребительских цен по новейшему ненулевому наблюдению World Bank / IMF IFS для страны.'],
        productive_capacity_score: ['Производственная мощность', 'Прокси физической производственной мощности: масса и доля промышленности/производства, производственный импульс, экспорт промышленных товаров, высокотехнологичный экспорт, техническая глубина и меньший вклад реального роста.'],
        sovereign_coherence_score: ['Суверенная когерентность', 'Консервативный прокси выявленной способности строить сложные системы: физическое производство, техническая глубина, логистика/энергия и ограниченные индикаторы стратегического распределения ресурсов. Это не оценка идеологии и не оценка нарратива.'],
        ppp_local_purchasing_power_score: ['PPP-поправка', 'Консервативная поправка по уровню цен / покупательной способности. Более низкий внутренний уровень цен может немного усилить уже наблюдаемую физическую строительную мощность; без реальных производственных сигналов мощность не создаётся.'],
        economic_distortion_index: ['Индекс искажения', 'Консервативный S2-аудит, ориентированный на проверку реальности: официальная проекция сравнивается с очищенными перекрёстными сигналами, расхождением статистик, структурной маскировкой и выявленной способностью строить. Высокое значение означает возможное завышение здоровья экономики, а не доказательство умышленной лжи.'],
        retention_drag: ['Ретенционное сопротивление', 'Исследовательский прокси: остаточная инфляция, взвешенная давлением обслуживания долга, государственных расходов и слабого роста.'],
        dynamics: ['Динамика', '40-летний слой живых данных: годовые прокси-кластеры DREAM/S2 и вычисленные дуги градиента ретенционного давления по регионам. Дуги — гипотезы, а не измеренные двусторонние потоки.'],
        pressure_score: ['S2-напряжение', 'Составной показатель ретенционного давления DREAM/S2. Переключатель Официальный/Очищенный меняет прямые официальные входы на более устойчивые к методическим искажениям прокси.'],
        symbolic_inflation: ['Символическое / шум', 'Исследовательский прокси: остаточная инфляция, взвешенная сигналами денежной массы и частного кредита.'],
        dust_index: ['Индекс «пыли»', 'Прокси поддерживающих/накладных структур: обслуживание долга, финансиализация, государственные расходы, безработица и давление отрицательного роста.'],
        coherence_score: ['Когерентность', 'Прокси устойчивости: выше означает меньшие отклонения инфляции, долговое давление, скрытый трудовой запас и финансовое давление.'],
        financialization_score: ['Финансовое поле', 'Прокси финансиализации по денежной массе/GDP и внутреннему частному кредиту/GDP там, где живые источники имеют покрытие.'],
        debt_pressure_score: ['Долговое давление', 'Прокси давления обслуживания долга: общий debt service как доля экспорта, где живой источник имеет покрытие.']
      },
      clusters: {
        productive_coherence: 'производственная когерентность', symbolic_finance: 'символические финансы', retention_drag: 'ретенционное сопротивление', inflation_shock: 'инфляционный шок', dust_overhead: 'пыль / накладная структура', transition: 'переходный режим', low_signal: 'низкий сигнал'
      },
      regions: {
        'East Asia & Pacific': 'Восточная Азия и Тихоокеанский регион',
        'Europe & Central Asia': 'Европа и Центральная Азия',
        'Latin America & Caribbean': 'Латинская Америка и Карибы',
        'Middle East & North Africa': 'Ближний Восток и Северная Африка',
        'Middle East / North Africa / Afghanistan & Pakistan': 'Ближний Восток / Северная Африка / Афганистан и Пакистан',
        'MENA/Afghanistan/Pakistan': 'Ближний Восток / Афганистан и Пакистан',
        'North America': 'Северная Америка',
        'South Asia': 'Южная Азия',
        'Sub-Saharan Africa': 'Африка к югу от Сахары'
      }
    }
  };

  let currentLang = (window.localStorage.getItem('dreamAtlasLang') || 'en').toLowerCase() === 'ru' ? 'ru' : 'en';

  function t(key) {
    return I18N[currentLang]?.ui?.[key] || I18N.en.ui[key] || key;
  }

  function layerLabel(layer) {
    return I18N[currentLang]?.layers?.[layer.key]?.[0] || layer.label;
  }

  function layerDescription(layer) {
    return I18N[currentLang]?.layers?.[layer.key]?.[1] || layer.description;
  }

  function localizedCluster(key, fallback) {
    return I18N[currentLang]?.clusters?.[key] || fallback || key || 'n/a';
  }

  function regionName(region) {
    return currentLang === 'ru' ? (I18N.ru.regions?.[region] || region || 'n/a') : (region || 'n/a');
  }

  function applyStaticLanguage() {
    document.documentElement.lang = currentLang;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.id === 'feedMeta' && window.__dreamDataLoaded) return;
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    const search = document.getElementById('countrySearch');
    if (search) search.placeholder = t('searchPlaceholder');
    const download = document.getElementById('downloadData');
    if (download) download.title = t('downloadTitle');
    const langButton = document.getElementById('languageToggle');
    if (langButton) {
      langButton.textContent = currentLang === 'ru' ? 'EN' : 'RU';
      langButton.title = currentLang === 'ru' ? 'Switch to English' : 'Переключить на русский';
    }
    updateThemeButton();
    const official = document.querySelector('#dataModeToggle option[value="official"]');
    const cleaned = document.querySelector('#dataModeToggle option[value="cleaned"]');
    if (official) official.textContent = t('official');
    if (cleaned) cleaned.textContent = t('cleaned');
    const all = document.querySelector('#regionFilter option[value="all"]');
    if (all) all.textContent = t('allRegions');
    document.querySelectorAll('#regionFilter option[data-region]').forEach(opt => { opt.textContent = regionName(opt.dataset.region); });
  }

  const LAYERS = [
    {
      key: 'inflation',
      label: 'Inflation',
      short: 'CPI',
      unit: '%',
      source: 'values',
      min: -3,
      max: 25,
      decimals: 1,
      description: 'Observed annual consumer-price inflation from the newest non-null World Bank / IMF IFS country observation.'
    },
    {
      key: 'productive_capacity_score',
      label: 'Productive capacity',
      short: 'Productive',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Physical production-capacity proxy: manufacturing/industry mass, GDP share, production momentum, manufactured exports, high-tech exports, technical depth, and a smaller real-growth term.'
    },
    {
      key: 'sovereign_coherence_score',
      label: 'Sovereign coherence',
      short: 'Sovereign',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Conservative revealed build-capacity proxy from physical production, technical depth, logistics/energy infrastructure, and limited strategic allocation inputs. It is not a narrative or ideology score.'
    },
    {
      key: 'ppp_local_purchasing_power_score',
      label: 'PPP adjustment',
      short: 'PPP',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Conservative purchasing-power / price-level adjustment. It nudges real physical-capacity mass scores when local price levels make market-USD output understate domestic build capacity.'
    },
    {
      key: 'economic_distortion_index',
      label: 'Distortion index',
      short: 'Distortion',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Truth-oriented conservative S2 audit index: official projection versus cleaned cross-checks, accounting divergence, structural masking, and revealed build capacity. High values mean official data may be overstating economic health relative to deeper S2 signals, not proof of intentional lying.'
    },
    {
      key: 'retention_drag',
      label: 'Retention drag',
      short: 'Drag',
      unit: '%',
      source: 'derived',
      min: 0,
      max: 18,
      decimals: 1,
      description: 'Research proxy: residual inflation weighted by debt-service, government-expense, and weak-growth pressures.'
    },
    {
      key: 'dynamics',
      label: 'Dynamics',
      short: '40y dynamics',
      unit: 'cluster',
      mode: 'dynamics',
      decimals: 0,
      description: '40-year live-feed layer: yearly DREAM/S2 proxy clusters plus inferred regional retention-pressure-gradient arcs. Arcs are hypotheses, not measured bilateral flows.'
    },
    {
      key: 'pressure_score',
      label: 'S2 pressure',
      short: 'S2',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Composite DREAM/S2 retention-pressure score. The Official/Cleaned toggle changes whether this uses direct official-series inputs or the measurement-robust cleaned proxy inputs.'
    },
    {
      key: 'symbolic_inflation',
      label: 'Symbolic / noise',
      short: 'Noise',
      unit: '%',
      source: 'derived',
      min: 0,
      max: 14,
      decimals: 1,
      description: 'Research proxy: residual inflation weighted by broad-money and private-credit financialization signals.'
    },
    {
      key: 'dust_index',
      label: 'Dust index',
      short: 'Dust',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Maintenance/overhead proxy using debt-service, financialization, government expense, unemployment, and negative growth pressure.'
    },
    {
      key: 'coherence_score',
      label: 'Coherence',
      short: 'Coherence',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      invert: false,
      description: 'Stability proxy: higher means lower inflation deviation, debt pressure, labor slack, and financialization pressure.'
    },
    {
      key: 'financialization_score',
      label: 'Finance field',
      short: 'Finance',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Financialization proxy from broad money/GDP and domestic private credit/GDP where live-source coverage exists.'
    },
    {
      key: 'debt_pressure_score',
      label: 'Debt pressure',
      short: 'Debt',
      unit: '/100',
      source: 'derived',
      min: 0,
      max: 100,
      decimals: 0,
      description: 'Debt-service pressure proxy from total debt service as a share of exports where the live source has coverage.'
    }
  ];

  const state = {
    data: null,
    countryByIso3: new Map(),
    countryByNumeric: new Map(),
    selectedLayer: LAYERS.find(layer => layer.key === 'dynamics') || LAYERS[0],
    selectedCountry: null,
    geoLayer: null,
    geoFeatures: null,
    featureByMapName: new Map(),
    countryByMapName: new Map(),
    chart: null,
    map: null,
    region: 'all',
    search: '',
    dynamicYear: null,
    dynamicsTimer: null,
    dynamicSpeed: 0.1,
    dataMode: 'official',
    theme: (window.localStorage.getItem('dreamAtlasTheme') || 'dark').toLowerCase() === 'light' ? 'light' : 'dark',
    flowsVisible: false,
    styleFrame: null,
    lastFlowKey: null,
    svg: null,
    viewport: null,
    countryLayer: null,
    flowLayer: null,
    sphereLayer: null,
    tooltip: null,
    projection: null,
    geoPath: null,
    featureCollection: null,
    zoomBehavior: null,
    mapSizeKey: null,
    resizeTimer: null
  };

  const els = {
    status: document.getElementById('feedStatus'),
    meta: document.getElementById('feedMeta'),
    tabs: document.getElementById('layerTabs'),
    region: document.getElementById('regionFilter'),
    search: document.getElementById('countrySearch'),
    dataModeToggle: document.getElementById('dataModeToggle'),
    downloadData: document.getElementById('downloadData'),
    languageToggle: document.getElementById('languageToggle'),
    themeToggle: document.getElementById('themeToggle'),
    map: document.getElementById('map'),
    mapMessage: document.getElementById('mapMessage'),
    legendTitle: document.getElementById('legendTitle'),
    legendRamp: document.getElementById('legendRamp'),
    legendTicks: document.getElementById('legendTicks'),
    countryTitle: document.getElementById('countryTitle'),
    countrySubtitle: document.getElementById('countrySubtitle'),
    countryMetrics: document.getElementById('countryMetrics'),
    layerTitle: document.getElementById('layerTitle'),
    layerDescription: document.getElementById('layerDescription'),
    layerValue: document.getElementById('layerValue'),
    sparkline: document.getElementById('sparkline'),
    auditTrail: document.getElementById('auditTrail'),
    dynamicsPanel: document.getElementById('dynamicsPanel'),
    yearSlider: document.getElementById('yearSlider'),
    yearLabel: document.getElementById('yearLabel'),
    playButton: document.getElementById('playDynamics'),
    speedSelect: document.getElementById('speedSelect'),
    flowToggle: document.getElementById('flowToggle'),
    narrationText: document.getElementById('narrationText'),
    dynamicsNote: document.getElementById('dynamicsNote'),
    dynamicsNotesPanel: document.getElementById('dynamicsNotesPanel'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomReset: document.getElementById('zoomReset')
  };

  function setStatus(text, mode = 'loading', detail = '') {
    const spinner = mode === 'loading' ? '<span class="tiny-spinner" aria-hidden="true"></span>' : '';
    const badge = mode === 'ok' ? '●' : mode === 'warn' ? '▲' : mode === 'error' ? '×' : '';
    els.status.innerHTML = `${spinner}<span class="status-${mode}">${badge ? `${badge} ` : ''}${escapeHtml(text)}</span>`;
    if (detail) els.meta.textContent = detail;
  }

  function showMapMessage(message) {
    els.mapMessage.textContent = message;
    els.mapMessage.classList.remove('hidden');
  }

  function hideMapMessage() {
    els.mapMessage.classList.add('hidden');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function isDynamicsLayer(layer = state.selectedLayer) {
    return layer.mode === 'dynamics';
  }

  function isCleanMode() {
    return state.dataMode === 'cleaned';
  }

  function activeValues(country) {
    if (!country) return null;
    return isCleanMode() ? (country.cleaned?.values || country.values) : country.values;
  }

  function activeDerived(country) {
    if (!country) return null;
    return isCleanMode() ? (country.cleaned?.derived || country.derived) : country.derived;
  }

  function rowValue(row, key) {
    if (!row) return null;
    return isCleanMode() ? (row[`clean_${key}`] ?? row[key]) : row[key];
  }

  function rowCluster(row) {
    if (!row) return 'low_signal';
    return isCleanMode() ? (row.clean_cluster || row.cluster || 'low_signal') : (row.cluster || 'low_signal');
  }

  function rowClusterLabel(row) {
    return clusterLabel(rowCluster(row));
  }

  function activeRollupsByYear() {
    if (!state.data?.dynamics) return {};
    return isCleanMode()
      ? (state.data.dynamics.region_rollups_by_year_cleaned || state.data.dynamics.region_rollups_by_year || {})
      : (state.data.dynamics.region_rollups_by_year || {});
  }

  function activeFlowsByYear() {
    if (!state.data?.dynamics) return {};
    return isCleanMode()
      ? (state.data.dynamics.flows_by_year_cleaned || state.data.dynamics.flows_by_year || {})
      : (state.data.dynamics.flows_by_year || {});
  }

  function signalLabel() {
    if (currentLang === 'ru') return isCleanMode() ? 'Очищенный сигнал' : 'Официальный сигнал';
    return isCleanMode() ? 'Cleaned signal' : 'Official signal';
  }

  function updateThemeButton() {
    if (!els.themeToggle) return;
    const isLight = state.theme === 'light';
    els.themeToggle.innerHTML = `<i class="fa-solid ${isLight ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i>`;
    els.themeToggle.title = isLight ? t('themeLight') : t('themeDark');
    els.themeToggle.setAttribute('aria-label', t('themeToggle'));
  }

  function applyTheme() {
    document.body.dataset.theme = state.theme;
    window.localStorage.setItem('dreamAtlasTheme', state.theme);
    updateThemeButton();
  }

  function bindThemeToggle() {
    if (!els.themeToggle) return;
    els.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme();
      refreshMapStyles({ skipTooltip: true });
      renderInspector();
    });
  }

  function availableYears() {
    return state.data?.dynamics?.available_years || [];
  }

  function clusterLabel(key) {
    return localizedCluster(key, state.data?.cluster_labels?.[key]);
  }

  function formatValue(value, layer = state.selectedLayer) {
    if (isDynamicsLayer(layer)) return value || 'n/a';
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
    return `${Number(value).toFixed(layer.decimals)}${layer.unit === '%' ? '%' : ` ${layer.unit}`}`;
  }

  function historyRowForYear(country, year = state.dynamicYear) {
    if (!country || !Array.isArray(country.history)) return null;
    return country.history.find(row => Number(row.year) === Number(year)) || null;
  }

  function metric(country, layer) {
    if (!country) return null;
    if (isDynamicsLayer(layer)) {
      const row = historyRowForYear(country);
      return row ? rowClusterLabel(row) : null;
    }
    const bucket = layer.source === 'derived' ? activeDerived(country) : activeValues(country);
    return bucket ? bucket[layer.key] : null;
  }

  function dynamicPressure(country) {
    const row = historyRowForYear(country);
    return rowValue(row, 'pressure_score');
  }

  function dynamicCluster(country) {
    const row = historyRowForYear(country);
    return rowCluster(row);
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function valueRatio(value, layer) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
    return clamp01((Number(value) - layer.min) / (layer.max - layer.min));
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
  }

  function rgbToHex(rgb) {
    return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }

  function mix(c1, c2, t) {
    const a = hexToRgb(c1);
    const b = hexToRgb(c2);
    return rgbToHex([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);
  }

  function colorFor(value, layer) {
    const ratio = valueRatio(value, layer);
    if (ratio === null) return '#192632';
    const r = layer.invert ? 1 - ratio : ratio;
    if (r < 0.25) return mix('#22344a', '#2f87ff', r / 0.25);
    if (r < 0.5) return mix('#2f87ff', '#74e1ff', (r - 0.25) / 0.25);
    if (r < 0.75) return mix('#74e1ff', '#ffd36e', (r - 0.5) / 0.25);
    return mix('#ffd36e', '#ff7f6e', (r - 0.75) / 0.25);
  }

  function featureIso3(feature) {
    const props = feature.properties || {};
    return props.ISO_A3 || props.ADM0_A3 || props.SOV_A3 || props.iso_a3 || props.name;
  }

  function featureNumeric(feature) {
    if (feature.id !== undefined && feature.id !== null) return String(feature.id).padStart(3, '0');
    const props = feature.properties || {};
    const raw = props.ISO_N3 || props.iso_n3 || props.ADM0_A3_IS || props.WB_A3;
    return raw ? String(raw).padStart(3, '0') : null;
  }

  function countryForFeature(feature) {
    const iso3 = featureIso3(feature);
    const numeric = featureNumeric(feature);
    return state.countryByIso3.get(iso3) || state.countryByNumeric.get(numeric) || null;
  }

  function countryMatchesFilters(country) {
    if (!country) return false;
    if (state.region !== 'all' && country.region !== state.region) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const hay = `${country.name} ${country.iso3} ${country.iso2 || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function countryStyle(feature) {
    const country = countryForFeature(feature);
    const hasMatch = countryMatchesFilters(country);

    if (isDynamicsLayer()) {
      const row = hasMatch ? historyRowForYear(country) : null;
      const cluster = rowCluster(row);
      const color = row ? CLUSTER_COLORS[cluster] || CLUSTER_COLORS.low_signal : '#192632';
      return {
        color: hasMatch ? 'rgba(255,255,255,0.76)' : 'rgba(255,255,255,0.12)',
        weight: hasMatch ? 0.75 : 0.25,
        opacity: hasMatch ? 0.82 : 0.25,
        fillColor: color,
        fillOpacity: row ? 0.78 : 0.08
      };
    }

    const value = hasMatch ? metric(country, state.selectedLayer) : null;
    return {
      color: hasMatch ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.12)',
      weight: hasMatch ? 0.65 : 0.25,
      opacity: hasMatch ? 0.75 : 0.25,
      fillColor: colorFor(value, state.selectedLayer),
      fillOpacity: hasMatch && value !== null && value !== undefined ? 0.78 : 0.08
    };
  }

  function tooltipHtml(country, feature) {
    const name = country?.name || (feature.properties && (feature.properties.name || feature.properties.ADMIN)) || 'Unmatched geography';
    if (!country) {
      return `<strong>${escapeHtml(name)}</strong><br/>${escapeHtml(t('noWorldBankMatch'))}`;
    }
    if (isDynamicsLayer()) {
      const row = historyRowForYear(country);
      if (!row) {
        return `<strong>${escapeHtml(country.name)}</strong><br/>${escapeHtml(t('noDynamicRecord'))} ${escapeHtml(state.dynamicYear || t('selectedYear'))}.`;
      }
      return [
        `<strong>${escapeHtml(country.name)}</strong>`,
        `${escapeHtml(t('year'))}: <b>${escapeHtml(row.year)}</b>`,
        `${escapeHtml(t('signal'))}: <b>${escapeHtml(signalLabel())}</b>`,
        `${escapeHtml(t('cluster'))}: <b>${escapeHtml(rowClusterLabel(row))}</b>`,
        `${escapeHtml(t('pressure'))}: <b>${escapeHtml(rowValue(row, 'pressure_score') ?? 'n/a')}</b>/100`,
        `${escapeHtml(t('deltaPressure'))}: <b>${escapeHtml(rowValue(row, 'pressure_delta') ?? 'n/a')}</b>`
      ].join('<br/>');
    }
    const value = metric(country, state.selectedLayer);
    return [
      `<strong>${escapeHtml(country.name)}</strong>`,
      `${escapeHtml(layerLabel(state.selectedLayer))}: <b>${escapeHtml(formatValue(value))}</b>`,
      `${escapeHtml(t('year'))}: ${escapeHtml(country.latest_source_year || 'n/a')}`,
      `${escapeHtml(t('confidence'))}: ${Math.round((country.quality?.confidence || 0) * 100)}%`
    ].join('<br/>');
  }

  function setSelectedCountry(country) {
    state.selectedCountry = country;
    renderInspector();
  }

  function prepareFeatureCollection(features) {
    state.countryByMapName.clear();
    state.featureByMapName.clear();
    const prepared = features.map((feature, index) => {
      const country = countryForFeature(feature);
      const mapName = country?.iso3 || `unmatched-${feature.id ?? index}`;
      feature.properties = {
        ...(feature.properties || {}),
        original_name: feature.properties?.name || feature.properties?.ADMIN || mapName,
        display_name: country?.name || feature.properties?.name || feature.properties?.ADMIN || mapName,
        name: mapName
      };
      state.featureByMapName.set(mapName, feature);
      if (country) state.countryByMapName.set(mapName, country);
      return feature;
    });
    return { type: 'FeatureCollection', features: prepared };
  }

  function mapSize() {
    const rect = els.map.getBoundingClientRect();
    return {
      width: Math.max(420, rect.width || 900),
      height: Math.max(300, rect.height || 600)
    };
  }

  function resizeProjection() {
    if (!state.svg || !state.projection || !state.geoPath || !state.featureCollection) return;
    const { width, height } = mapSize();
    state.svg.attr('viewBox', `0 0 ${width} ${height}`);
    state.projection.fitExtent([[18, 18], [width - 18, height - 18]], state.featureCollection);
    state.sphereLayer.attr('d', state.geoPath({ type: 'Sphere' }));
  }

  function pointerPosition(event) {
    const rect = els.map.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function showTooltip(event, html) {
    if (!state.tooltip) return;
    const { x, y } = pointerPosition(event);
    state.tooltip
      .html(html)
      .classed('hidden', false)
      .style('left', `${Math.min(x + 14, els.map.clientWidth - 270)}px`)
      .style('top', `${Math.max(12, y + 14)}px`);
  }

  function hideTooltip() {
    if (state.tooltip) state.tooltip.classed('hidden', true);
  }

  function stylePath(selection) {
    selection
      .attr('d', state.geoPath)
      .style('fill', feature => countryStyle(feature).fillColor)
      .style('fill-opacity', feature => countryStyle(feature).fillOpacity)
      .style('stroke', feature => countryStyle(feature).color)
      .style('stroke-width', feature => countryStyle(feature).weight)
      .style('stroke-opacity', feature => countryStyle(feature).opacity);
  }

  function safeProjectedPoint(lon, lat) {
    const p = state.projection([Number(lon), Number(lat)]);
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null;
    return p;
  }

  function flowPath(flow) {
    if (!state.projection) return null;
    const lon0 = Number(flow.from_longitude);
    const lat0 = Number(flow.from_latitude);
    const lon1 = Number(flow.to_longitude);
    const lat1 = Number(flow.to_latitude);
    if (![lon0, lat0, lon1, lat1].every(Number.isFinite)) return null;

    // The stripe bug was caused by long geodesic/wrapped lines being drawn across the projection.
    // For this PoC we skip long jumps instead of trying to imply measured bilateral flows.
    const lonDelta = Math.abs(lon1 - lon0);
    if (lonDelta > 95) return null;

    const p0 = safeProjectedPoint(lon0, lat0);
    const p1 = safeProjectedPoint(lon1, lat1);
    if (!p0 || !p1) return null;

    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance < 6 || distance > Math.max(els.map.clientWidth, els.map.clientHeight) * 0.55) return null;

    const bend = Math.min(42, Math.max(10, distance * 0.18));
    const nx = -dy / Math.max(distance, 1);
    const ny = dx / Math.max(distance, 1);
    const cx = (p0[0] + p1[0]) / 2 + nx * bend;
    const cy = (p0[1] + p1[1]) / 2 + ny * bend;
    return `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
  }

  function currentFlowData() {
    if (!isDynamicsLayer() || !state.flowsVisible) return [];
    const flows = activeFlowsByYear()[String(state.dynamicYear)] || [];
    return flows.map(flow => ({ flow, path: flowPath(flow) })).filter(d => d.path);
  }

  function renderFlowLayer() {
    if (!state.flowLayer) return;
    const data = currentFlowData();
    state.flowLayer.selectAll('path.flow-line')
      .data(data, d => `${d.flow.from_region || 'from'}-${d.flow.to_region || 'to'}-${d.flow.strength || 0}`)
      .join(
        enter => enter.append('path')
          .attr('class', 'flow-line')
          .on('mousemove', (event, d) => showTooltip(event, flowTooltip(d.flow)))
          .on('mouseleave', hideTooltip),
        update => update,
        exit => exit.remove()
      )
      .attr('d', d => d.path)
      .style('stroke-width', d => Math.max(0.7, Math.min(2.0, Number(d.flow.strength || 0) / 42)))
      .style('opacity', d => Math.max(0.10, Math.min(0.28, Number(d.flow.strength || 0) / 230)));
  }

  function refreshMapStyles(options = {}) {
    if (!state.svg || !state.geoFeatures || !state.geoPath) return;
    if (state.styleFrame) window.cancelAnimationFrame(state.styleFrame);
    state.styleFrame = window.requestAnimationFrame(() => {
      state.styleFrame = null;
      resizeProjection();
      const paths = state.countryLayer.selectAll('path.country-shape')
        .data(state.geoFeatures, feature => feature.properties.name);

      const merged = paths.join(
        enter => enter.append('path')
          .attr('class', 'country-shape')
          .on('mousemove', (event, feature) => {
            const country = countryForFeature(feature);
            if (country) setSelectedCountry(country);
            const style = countryStyle(feature);
            state.countryLayer.selectAll('path.country-shape.hovered').classed('hovered', false);
            d3.select(event.currentTarget)
              .classed('hovered', true)
              .style('fill', style.fillColor)
              .style('fill-opacity', Math.min(0.95, (style.fillOpacity || 0.75) + 0.12))
              .style('stroke', '#ffd36e')
              .style('stroke-width', 1.4)
              .style('stroke-opacity', 0.95);
            showTooltip(event, tooltipHtml(country, feature));
          })
          .on('mouseleave', (event, feature) => {
            const style = countryStyle(feature);
            d3.select(event.currentTarget)
              .classed('hovered', false)
              .style('fill', style.fillColor)
              .style('fill-opacity', style.fillOpacity)
              .style('stroke', style.color)
              .style('stroke-width', style.weight)
              .style('stroke-opacity', style.opacity);
            hideTooltip();
          })
          .on('click', (event, feature) => {
            const country = countryForFeature(feature);
            if (country) setSelectedCountry(country);
          }),
        update => update,
        exit => exit.remove()
      );
      stylePath(merged);
      renderFlowLayer();
    });
  }

  function renderFlows() {
    refreshMapStyles({ skipTooltip: true });
  }

  function renderTabs() {
    els.tabs.innerHTML = '';
    LAYERS.forEach(layer => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `layer-tab ${layer.key === state.selectedLayer.key ? 'active' : ''}`;
      button.textContent = layerLabel(layer);
      button.addEventListener('click', () => {
        state.selectedLayer = layer;
        renderTabs();
        renderLegend();
        renderDynamicsControls();
        state.lastFlowKey = null;
        refreshMapStyles();
        renderInspector();
      });
      els.tabs.appendChild(button);
    });
  }

  function renderLegend() {
    const layer = state.selectedLayer;
    if (isDynamicsLayer(layer)) {
      els.legendTitle.textContent = `${signalLabel()} · ${layerLabel(layer)} (${state.dynamicYear || t('year')})`;
      els.legendRamp.className = 'cluster-legend';
      els.legendRamp.innerHTML = Object.entries(CLUSTER_COLORS).map(([key, color]) => `
        <div class="cluster-chip"><span style="background:${color}"></span>${escapeHtml(clusterLabel(key))}</div>
      `).join('');
      els.legendTicks.innerHTML = `<span>${escapeHtml(t('lowSignal'))}</span><span>${escapeHtml(t('mixed'))}</span><span>${escapeHtml(t('shock'))}</span>`;
      return;
    }
    els.legendTitle.textContent = `${layerLabel(layer)} (${layer.unit}) · ${signalLabel()}`;
    els.legendRamp.className = 'legend-ramp';
    els.legendRamp.innerHTML = '';
    els.legendTicks.innerHTML = `
      <span>${formatTick(layer.min, layer)}</span>
      <span>${formatTick((layer.min + layer.max) / 2, layer)}</span>
      <span>${formatTick(layer.max, layer)}</span>
    `;
  }

  function formatTick(value, layer) {
    const decimals = layer.decimals === 0 ? 0 : 1;
    return `${Number(value).toFixed(decimals)}${layer.unit === '%' ? '%' : ''}`;
  }

  function bindLanguageToggle() {
    if (!els.languageToggle) return;
    els.languageToggle.addEventListener('click', () => {
      currentLang = currentLang === 'ru' ? 'en' : 'ru';
      window.localStorage.setItem('dreamAtlasLang', currentLang);
      applyStaticLanguage();
      renderTabs();
      renderLegend();
      renderDynamicsControls();
      renderInspector();
      refreshMapStyles({ skipTooltip: true });
    });
  }

  function renderRegionFilter() {
    const regions = [...new Set(state.data.countries.map(c => c.region).filter(Boolean))].sort();
    for (const region of regions) {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = regionName(region);
      option.dataset.region = region;
      els.region.appendChild(option);
    }
    els.region.addEventListener('change', () => {
      state.region = els.region.value;
      refreshMapStyles();
    });
    els.search.addEventListener('input', () => {
      state.search = els.search.value.trim();
      refreshMapStyles();
    });
    if (els.dataModeToggle) {
      els.dataModeToggle.value = state.dataMode;
      els.dataModeToggle.addEventListener('change', () => {
        state.dataMode = els.dataModeToggle.value === 'cleaned' ? 'cleaned' : 'official';
        state.lastFlowKey = null;
        renderTabs();
        renderLegend();
        renderDynamicsControls();
        refreshMapStyles();
        renderInspector();
      });
    }
    if (els.downloadData) {
      els.downloadData.addEventListener('click', downloadAnalysisJson);
    }
  }


  function slugPart(value) {
    return String(value || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'all';
  }

  function triggerJsonDownload(filename, payload) {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadAnalysisJson() {
    if (!state.data) {
      showMapMessage(t('noLiveForDownload'));
      return;
    }

    const button = els.downloadData;
    const previousText = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = t('preparing');
    }

    let sourceAudit = null;
    let sourceAuditError = null;
    try {
      sourceAudit = await loadJson(AUDIT_URL, 'Source audit');
    } catch (error) {
      sourceAuditError = error.message;
    }

    const selectedCountry = state.selectedCountry ? {
      name: state.selectedCountry.name,
      iso3: state.selectedCountry.iso3,
      region: state.selectedCountry.region,
      latest_source_year: state.selectedCountry.latest_source_year
    } : null;

    const bundle = {
      export_type: 'dream_economic_retention_analysis_bundle',
      export_version: 'v2.1-truth-oriented-distortion-audit',
      exported_at_utc: new Date().toISOString(),
      app_url: window.location.href,
      data_url: DATA_URL,
      source_audit_url: AUDIT_URL,
      selected_view: {
        signal_mode: state.dataMode,
        layer_key: state.selectedLayer?.key || null,
        layer_label: state.selectedLayer?.label || null,
        dynamic_year: state.dynamicYear,
        region_filter: state.region,
        search_filter: state.search,
        flows_visible: state.flowsVisible,
        selected_country: selectedCountry
      },
      analysis_notes: [
        'This bundle contains the live econ_latest.json payload loaded by the app.',
        'Official and cleaned fields are both included when emitted by the ETL.',
        'Inferred flow arcs are pressure-gradient hypotheses, not measured bilateral trade or capital flows.',
        'Use source_audit to verify indicator coverage, formula version, and feed freshness.'
      ],
      econ_latest: state.data,
      source_audit: sourceAudit,
      source_audit_error: sourceAuditError
    };

    const generated = slugPart(state.data.generated_at_utc || new Date().toISOString().slice(0, 10));
    const mode = slugPart(state.dataMode);
    const layer = slugPart(state.selectedLayer?.key || 'layer');
    const filename = `dream-economic-retention-${mode}-${layer}-${generated}.json`;
    triggerJsonDownload(filename, bundle);

    if (button) {
      button.textContent = previousText;
      button.disabled = false;
    }
  }

  function renderDynamicsControls() {
    if (!els.dynamicsPanel) return;
    const years = availableYears();
    if (!isDynamicsLayer()) {
      els.dynamicsPanel.classList.add('hidden');
      if (els.dynamicsNotesPanel) els.dynamicsNotesPanel.classList.add('hidden');
      stopDynamicsPlayback();
      state.lastFlowKey = null;
      renderFlows();
      return;
    }

    els.dynamicsPanel.classList.remove('hidden');
    if (els.dynamicsNotesPanel) els.dynamicsNotesPanel.classList.remove('hidden');
    if (!years.length) {
      els.yearLabel.textContent = t('noDynamicYears');
      els.yearSlider.disabled = true;
      els.playButton.disabled = true;
      if (els.speedSelect) els.speedSelect.disabled = true;
      if (els.narrationText) els.narrationText.textContent = currentLang === 'ru' ? 'Текстовые заметки недоступны, пока 40-летний живой поток не даст пригодные наблюдения.' : 'No dynamic movie notes are available until the live 40-year feed has usable observations.';
      return;
    }

    if (!state.dynamicYear) state.dynamicYear = state.data.dynamics?.default_year || years[years.length - 1];
    els.yearSlider.min = String(Math.min(...years));
    els.yearSlider.max = String(Math.max(...years));
    els.yearSlider.step = '1';
    els.yearSlider.value = String(state.dynamicYear);
    els.yearSlider.disabled = false;
    els.playButton.disabled = false;
    if (els.speedSelect) {
      els.speedSelect.disabled = false;
      els.speedSelect.value = String(state.dynamicSpeed);
    }
    els.yearLabel.textContent = String(state.dynamicYear);
    els.dynamicsNote.textContent = currentLang === 'ru' ? 'Вычисленные градиенты давления по историческим индикаторам из живых источников.' : (state.data.dynamics?.flow_interpretation || 'Inferred pressure gradients from historical live-source indicators.');
    updateNarration();
  }

  function setDynamicYear(year) {
    const years = availableYears();
    if (!years.length) return;
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const bounded = Math.max(minYear, Math.min(maxYear, Number(year)));
    const nextYear = years.includes(bounded) ? bounded : nearestYear(bounded, years);
    if (Number(state.dynamicYear) === Number(nextYear)) return;
    state.dynamicYear = nextYear;
    if (els.yearSlider) els.yearSlider.value = String(state.dynamicYear);
    if (els.yearLabel) els.yearLabel.textContent = String(state.dynamicYear);
    renderLegend();
    refreshMapStyles({ skipTooltip: true });
    renderInspector();
    updateNarration();
  }

  function nearestYear(year, years) {
    return years.reduce((best, candidate) => Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best, years[0]);
  }

  function stopDynamicsPlayback() {
    if (state.dynamicsTimer) {
      window.clearInterval(state.dynamicsTimer);
      state.dynamicsTimer = null;
    }
    if (els.playButton) els.playButton.textContent = '▶';
  }

  function playbackIntervalMs() {
    const speed = Number(state.dynamicSpeed) || 1;
    const table = { 0.1: 7600, 0.25: 3600, 0.5: 2400, 1: 1600, 2: 900, 4: 500 };
    return table[speed] || Math.max(180, Math.round(900 / speed));
  }

  function startDynamicsPlayback() {
    const years = availableYears();
    if (!years.length) return;
    stopDynamicsPlayback();
    if (els.playButton) els.playButton.textContent = '❚❚';
    updateNarration();
    state.dynamicsTimer = window.setInterval(() => {
      const idx = years.indexOf(state.dynamicYear);
      const next = idx >= 0 && idx < years.length - 1 ? years[idx + 1] : years[0];
      setDynamicYear(next);
    }, playbackIntervalMs());
  }

  function toggleDynamicsPlayback() {
    if (state.dynamicsTimer) {
      stopDynamicsPlayback();
      return;
    }
    startDynamicsPlayback();
  }

  function updateNarration() {
    if (!els.narrationText || !isDynamicsLayer()) return;
    els.narrationText.textContent = buildDynamicNarration();
  }

  function buildDynamicNarration() {
    const years = availableYears();
    const year = Number(state.dynamicYear);
    const noNotes = currentLang === 'ru'
      ? 'Текстовые заметки недоступны, пока 40-летний живой поток не даст пригодные наблюдения.'
      : 'No dynamic movie notes are available until the live 40-year feed has usable observations.';
    if (!years.length || !year) return noNotes;

    const rollups = activeRollupsByYear()[String(year)] || {};
    const entries = Object.values(rollups).filter(row => row && row.pressure_score !== null && row.pressure_score !== undefined);
    if (!entries.length) {
      return currentLang === 'ru'
        ? `${year}: покрытие живых источников слишком редкое, чтобы описывать глобальное ретенционное состояние.`
        : `${year}: live-source coverage is too sparse to narrate a global retention state.`;
    }

    const ranked = entries.slice().sort((a, b) => Number(b.pressure_score || 0) - Number(a.pressure_score || 0));
    const top = ranked[0];
    const calm = ranked[ranked.length - 1];
    const flows = activeFlowsByYear()[String(year)] || [];
    const topFlow = flows[0];
    const prevYear = years.filter(candidate => candidate < year).pop();
    let trend = '';
    if (prevYear) {
      const prevEntries = Object.values(activeRollupsByYear()[String(prevYear)] || {}).filter(row => row && row.pressure_score !== null && row.pressure_score !== undefined);
      const currentAvg = average(entries.map(row => row.pressure_score));
      const prevAvg = average(prevEntries.map(row => row.pressure_score));
      if (currentAvg !== null && prevAvg !== null) {
        const delta = currentAvg - prevAvg;
        if (currentLang === 'ru') {
          const direction = delta > 0.4 ? 'растёт' : delta < -0.4 ? 'охлаждается' : 'в целом стабильное';
          trend = ` Среднее глобальное ретенционное давление ${direction} относительно ${prevYear}, изменение ${Math.abs(delta).toFixed(1)} пунктов.`;
        } else {
          const direction = delta > 0.4 ? 'rising' : delta < -0.4 ? 'cooling' : 'mostly stable';
          trend = ` Global average retention pressure is ${direction} versus ${prevYear}, by ${Math.abs(delta).toFixed(1)} points.`;
        }
      }
    }

    const cluster = clusterLabel(top.dominant_cluster || 'low_signal').toLowerCase();
    const topRegion = regionName(top.region);
    const calmName = calm && calm.region !== top.region
      ? (currentLang === 'ru'
        ? ` Самое спокойное региональное поле — ${regionName(calm.region)}, около ${Number(calm.pressure_score || 0).toFixed(0)}.`
        : ` The calmest regional field is ${regionName(calm.region)}, near ${Number(calm.pressure_score || 0).toFixed(0)}.`)
      : '';
    const flowText = topFlow
      ? (currentLang === 'ru'
        ? ` Самая сильная вычисленная дуга градиента давления идёт из ${regionName(topFlow.from_region)} к ${regionName(topFlow.to_region)}, сила ${Number(topFlow.strength || 0).toFixed(0)}.`
        : ` The strongest inferred pressure-gradient arc runs from ${regionName(topFlow.from_region)} toward ${regionName(topFlow.to_region)}, strength ${Number(topFlow.strength || 0).toFixed(0)}.`)
      : (currentLang === 'ru'
        ? ' В этом году сильная региональная дуга градиента давления не видна.'
        : ' No strong regional pressure-gradient arc is visible this year.');
    if (currentLang === 'ru') {
      return `${year} (${signalLabel()}): ${topRegion} несёт самое сильное ретенционное давление, около ${Number(top.pressure_score || 0).toFixed(0)}, с сигнатурой «${cluster}».${calmName}${flowText}${trend} Дуги являются вычисленными градиентами, а не измеренными торговыми или капитальными потоками.`;
    }
    return `${year} (${signalLabel()}): ${topRegion} carries the strongest retention pressure, near ${Number(top.pressure_score || 0).toFixed(0)}, with a ${cluster} signature.${calmName}${flowText}${trend} Arcs are inferred gradients, not measured trade or capital flows.`;
  }

  function average(values) {
    const nums = values.map(Number).filter(Number.isFinite);
    if (!nums.length) return null;
    return nums.reduce((sum, value) => sum + value, 0) / nums.length;
  }

  function splitAntiMeridian(from, to) {
    const [lat1, lon1] = from;
    const [lat2, lon2] = to;
    if (Math.abs(lon2 - lon1) <= 180) return [[from, to]];
    const adjustedLon2 = lon2 > lon1 ? lon2 - 360 : lon2 + 360;
    const boundary = lon1 > adjustedLon2 ? -180 : 180;
    const t = (boundary - lon1) / (adjustedLon2 - lon1);
    const midLat = lat1 + (lat2 - lat1) * t;
    const opposite = boundary === 180 ? -180 : 180;
    return [
      [[lat1, lon1], [midLat, boundary]],
      [[midLat, opposite], [lat2, lon2]]
    ];
  }

  function flowTooltip(flow) {
    return [
      `<strong>${escapeHtml(currentLang === 'ru' ? 'Вычисленная дуга градиента давления' : 'Inferred pressure-gradient arc')}</strong>`,
      `${escapeHtml(regionName(flow.from_region))} → ${escapeHtml(regionName(flow.to_region))}`,
      `${escapeHtml(currentLang === 'ru' ? 'Сила' : 'Strength')}: <b>${escapeHtml(flow.strength ?? 'n/a')}</b>`,
      `${escapeHtml(currentLang === 'ru' ? 'Δ источник' : 'Δ source')}: ${escapeHtml(flow.from_delta ?? 'n/a')} · ${escapeHtml(currentLang === 'ru' ? 'Δ приёмник' : 'Δ sink')}: ${escapeHtml(flow.to_delta ?? 'n/a')}`,
      `<span class="muted">${escapeHtml(currentLang === 'ru' ? 'Не измеренный торговый или капитальный поток.' : 'Not measured trade/capital flow.')}</span>`
    ].join('<br/>');
  }

  function renderInspector() {
    const country = state.selectedCountry;
    const layer = state.selectedLayer;
    els.layerTitle.innerHTML = `${escapeHtml(layerLabel(layer))} <span class="signal-mode-badge">${escapeHtml(signalLabel())}</span>`;
    els.layerDescription.textContent = layerDescription(layer);

    if (!country) {
      els.countryTitle.textContent = t('noCountrySelected');
      els.countrySubtitle.textContent = isDynamicsLayer() ? t('moveOverMapSelectedYear') : t('moveOverMapAfterLoad');
      els.countryMetrics.innerHTML = '';
      els.layerValue.textContent = '--';
      els.sparkline.textContent = t('noCountrySelectedPeriod');
      els.auditTrail.textContent = isDynamicsLayer() ? t('selectCountryDynamic') : t('selectCountryLive');
      return;
    }

    els.countryTitle.textContent = country.name;
    els.countrySubtitle.innerHTML = `${escapeHtml(country.iso3)} · ${escapeHtml(regionName(country.region) || 'region n/a')} · ${escapeHtml(country.income || 'income n/a')} <span class="quality-pill">${escapeHtml(currentLang === 'ru' ? 'уверенность' : 'confidence')} ${Math.round((country.quality?.confidence || 0) * 100)}%</span>`;

    if (isDynamicsLayer()) {
      const row = historyRowForYear(country);
      els.layerValue.textContent = row ? rowClusterLabel(row) : 'n/a';
      els.countryMetrics.innerHTML = dynamicMetricCards(country, row);
      renderDynamicSparkline(country);
      renderDynamicAudit(country, row);
      return;
    }

    const value = metric(country, layer);
    els.layerValue.textContent = formatValue(value, layer);
    els.countryMetrics.innerHTML = metricCards(country);
    renderSparkline(country);
    renderAudit(country);
  }

  function metricLabel(en, ru) {
    return currentLang === 'ru' ? ru : en;
  }

  function metricCards(country) {
    const values = activeValues(country) || {};
    const derived = activeDerived(country) || {};
    const rows = [
      [isCleanMode() ? metricLabel('Cleaned price pressure', 'Очищенное ценовое давление') : metricLabel('CPI inflation', 'Инфляция CPI'), values.inflation, '%', 1],
      [metricLabel('GDP growth', 'Рост GDP'), values.gdp_growth, '%', 1],
      [metricLabel('GDP pc growth', 'Рост GDP на душу'), values.gdp_pc_growth, '%', 1],
      [metricLabel('GDP deflator', 'Дефлятор GDP'), values.gdp_deflator_inflation, '%', 1],
      [metricLabel('Manufacturing share', 'Доля производства'), values.manufacturing_value_added_gdp, '% GDP', 1],
      [metricLabel('Manufacturing mass', 'Масса производства'), values.manufacturing_mass_score, '/100', 0],
      [metricLabel('Industry mass', 'Масса индустрии'), values.industry_mass_score, '/100', 0],
      [metricLabel('High-tech exports', 'Высокотех. экспорт'), values.high_tech_exports_share, '%', 1],
      [metricLabel('Productive capacity', 'Производственная мощность'), derived.productive_capacity_score, '/100', 0],
      [metricLabel('Sovereign coherence', 'Суверенная когерентность'), derived.sovereign_coherence_score, '/100', 0],
      [metricLabel('Technical depth', 'Техническая глубина'), derived.technical_depth_score, '/100', 0],
      [metricLabel('Infrastructure depth', 'Глубина инфраструктуры'), derived.infrastructure_depth_score, '/100', 0],
      [metricLabel('Strategic allocation', 'Стратегическое распределение'), derived.strategic_allocation_score, '/100', 0],
      [metricLabel('Capacity shield', 'Щит мощности'), derived.capacity_shield_score, '/100', 0],
      [metricLabel('PPP price level', 'PPP-уровень цен'), values.ppp_price_level_ratio, 'ratio', 2],
      [metricLabel('PPP purchasing adj.', 'PPP-поправка покуп. способности'), derived.ppp_local_purchasing_power_score, '/100', 0],
      [metricLabel('PPP capacity multiplier', 'PPP-множитель мощности'), derived.ppp_capacity_multiplier, 'x', 3],
      [metricLabel('Physical depth', 'Физическая глубина'), derived.physical_depth_score, '/100', 0],
      [metricLabel('Money growth', 'Рост денежной массы'), values.broad_money_growth, '%', 1],
      [metricLabel('S2 pressure', 'S2-напряжение'), derived.pressure_score, '/100', 0],
      [metricLabel('Distortion index', 'Индекс искажения'), derived.economic_distortion_index, '/100', 0],
      [metricLabel('Stats divergence', 'Расхождение статистик'), derived.measurement_divergence_score, '/100', 0],
      [metricLabel('Hidden labor slack', 'Скрытый трудовой запас'), derived.hidden_labor_slack_score, '/100', 0],
      [metricLabel('Finance field', 'Финансовое поле'), derived.financialization_score, '/100', 0],
      [metricLabel('Coherence', 'Когерентность'), derived.coherence_score, '/100', 0]
    ];
    return rows.map(([label, value, unit, decimals]) => metricCard(label, value, unit, decimals)).join('');
  }

  function dynamicMetricCards(country, row) {
    if (!row) {
      return `<div class="metric wide"><div class="label">${escapeHtml(metricLabel('Dynamic record', 'Динамическая запись'))}</div><div class="value">n/a</div></div>`;
    }
    const rows = [
      [t('year'), row.year, '', 0],
      [t('signal'), signalLabel(), 'text', 0],
      [t('cluster'), rowClusterLabel(row), 'text', 0],
      [metricLabel('Pressure score', 'Показатель давления'), rowValue(row, 'pressure_score'), '/100', 0],
      [t('deltaPressure'), rowValue(row, 'pressure_delta'), 'pts', 1],
      [isCleanMode() ? metricLabel('Cleaned price pressure', 'Очищенное ценовое давление') : metricLabel('CPI inflation', 'Инфляция CPI'), rowValue(row, 'inflation'), '%', 1],
      [metricLabel('Productive capacity', 'Производственная мощность'), rowValue(row, 'productive_capacity_score'), '/100', 0],
      [metricLabel('Sovereign coherence', 'Суверенная когерентность'), rowValue(row, 'sovereign_coherence_score'), '/100', 0],
      [metricLabel('Technical depth', 'Техническая глубина'), rowValue(row, 'technical_depth_score'), '/100', 0],
      [metricLabel('Infrastructure depth', 'Глубина инфраструктуры'), rowValue(row, 'infrastructure_depth_score'), '/100', 0],
      [metricLabel('Capacity shield', 'Щит мощности'), rowValue(row, 'capacity_shield_score'), '/100', 0],
      [metricLabel('PPP price level', 'PPP-уровень цен'), rowValue(row, 'ppp_price_level_ratio'), 'ratio', 2],
      [metricLabel('PPP purchasing adj.', 'PPP-поправка покуп. способности'), rowValue(row, 'ppp_local_purchasing_power_score'), '/100', 0],
      [metricLabel('PPP capacity multiplier', 'PPP-множитель мощности'), rowValue(row, 'ppp_capacity_multiplier'), 'x', 3],
      [metricLabel('Physical depth', 'Физическая глубина'), rowValue(row, 'physical_depth_score'), '/100', 0],
      [metricLabel('Retention drag', 'Ретенционное сопротивление'), rowValue(row, 'retention_drag'), '%', 1],
      [metricLabel('Dust index', 'Индекс «пыли»'), rowValue(row, 'dust_index'), '/100', 0],
      [metricLabel('Distortion index', 'Индекс искажения'), rowValue(row, 'economic_distortion_index'), '/100', 0],
      [metricLabel('Stats divergence', 'Расхождение статистик'), rowValue(row, 'measurement_divergence_score'), '/100', 0],
      [metricLabel('Coherence', 'Когерентность'), rowValue(row, 'coherence_score'), '/100', 0]
    ];
    return rows.map(([label, value, unit, decimals]) => metricCard(label, value, unit, decimals)).join('');
  }

  function metricCard(label, value, unit, decimals) {
    let formatted;
    if (unit === 'text') {
      formatted = value || 'n/a';
    } else if (value === null || value === undefined || Number.isNaN(Number(value))) {
      formatted = 'n/a';
    } else {
      formatted = `${Number(value).toFixed(decimals)}${unit === '%' ? '%' : unit ? ` ${unit}` : ''}`;
    }
    return `<div class="metric"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(formatted)}</div></div>`;
  }

  function renderSparkline(country) {
    const key = isCleanMode() ? 'clean_inflation' : 'inflation';
    const title = isCleanMode() ? metricLabel('Cleaned price-pressure %', 'Очищенное ценовое давление %') : metricLabel('CPI inflation %', 'Инфляция CPI %');
    const history = Array.isArray(country.history) ? country.history.filter(d => d[key] !== null && d[key] !== undefined) : [];
    if (history.length < 2) {
      els.sparkline.textContent = t('noHistoryCountry');
      return;
    }
    renderLineChart(history, key, title, value => `${Number(value).toFixed(1)}%`);
  }

  function renderDynamicSparkline(country) {
    const key = isCleanMode() ? 'clean_pressure_score' : 'pressure_score';
    const history = Array.isArray(country.history) ? country.history.filter(d => d[key] !== null && d[key] !== undefined) : [];
    if (history.length < 2) {
      els.sparkline.textContent = t('noDynamicHistoryCountry');
      return;
    }
    renderLineChart(history, key, currentLang === 'ru' ? `${signalLabel()} · ретенционное давление /100` : `${signalLabel()} retention pressure /100`, value => `${Number(value).toFixed(0)}/100`);
  }

  function renderLineChart(history, key, title, valueFormatter) {
    const width = 318;
    const height = 122;
    const pad = 22;
    const values = history.map(d => Number(d[key]));
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const x = i => pad + (i / Math.max(1, history.length - 1)) * (width - pad * 2);
    const y = v => height - pad - ((v - min) / Math.max(1e-9, max - min)) * (height - pad * 2);
    const points = history.map((d, i) => `${x(i).toFixed(1)},${y(Number(d[key])).toFixed(1)}`).join(' ');
    const latest = history[history.length - 1];
    const selected = history.find(row => Number(row.year) === Number(state.dynamicYear));
    const selectedDot = selected ? `<circle cx="${x(history.indexOf(selected)).toFixed(1)}" cy="${y(Number(selected[key])).toFixed(1)}" r="5" fill="#ff6478" />` : '';
    els.sparkline.innerHTML = `
      <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)} history">
        <line x1="${pad}" y1="${y(0).toFixed(1)}" x2="${width - pad}" y2="${y(0).toFixed(1)}" stroke="var(--chart-grid)" stroke-width="1" />
        <polyline points="${points}" fill="none" stroke="#74d7ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${x(history.length - 1).toFixed(1)}" cy="${y(Number(latest[key])).toFixed(1)}" r="4" fill="#ffd36e" />
        ${selectedDot}
        <text x="${pad}" y="14" fill="var(--muted)" font-size="10">${escapeHtml(title)}</text>
        <text x="${pad}" y="${height - 4}" fill="var(--muted)" font-size="10">${escapeHtml(history[0].year)}</text>
        <text x="${width - pad - 34}" y="${height - 4}" fill="var(--muted)" font-size="10">${escapeHtml(latest.year)}</text>
        <text x="${width - pad - 80}" y="16" fill="var(--text)" font-size="12">${escapeHtml(valueFormatter(latest[key]))}</text>
      </svg>
    `;
  }

  function renderAudit(country) {
    const q = country.quality || {};
    const missing = Array.isArray(q.missing_inputs) && q.missing_inputs.length ? q.missing_inputs.join(', ') : (currentLang === 'ru' ? 'нет' : 'none');
    if (currentLang === 'ru') {
      els.auditTrail.innerHTML = [
        `<div>Последний год источника: <b>${escapeHtml(country.latest_source_year || 'n/a')}</b></div>`,
        `<div>Отсутствующие входы модели: ${escapeHtml(missing)}</div>`,
        `<div>Сгенерировано UTC: ${escapeHtml(state.data.generated_at_utc || 'n/a')}</div>`,
        `<div>Версия формулы: ${escapeHtml(state.data.formula_version || 'n/a')}</div>`,
        `<div>Режим сигнала: <b>${escapeHtml(signalLabel())}</b></div>`,
        `<div>Очищенный режим — устойчивый к методическим искажениям прокси; он не восстанавливает полностью hedonics и национальные статистические методики.</div>`,
        `<div>Индекс искажения сравнивает официальную проекцию с очищенной S2-картиной. Это флаг завышения/расхождения, не юридическое доказательство лжи.</div>`,
        `<div>Производственная заметка: производственная мощность включает массу и глубину промышленности/производства, а не только рост GDP.</div>`,
        `<div>Суверенная заметка: суверенная когерентность использует не-IMF-каналы, где они доступны: WIPO патенты, UNESCO/UIS R&D, IEA электричество, транспортная инфраструктура и доля военных расходов SIPRI. Оценка консервативна и остаётся null при слабом покрытии.</div>`,
        `<div>Финансовая заметка: сглаженная глубина денежной массы/частного кредита; старое жёсткое клиппирование не используется в видимом финансовом поле.</div>`
      ].join('');
      return;
    }
    els.auditTrail.innerHTML = [
      `<div>Latest source year: <b>${escapeHtml(country.latest_source_year || 'n/a')}</b></div>`,
      `<div>Missing model inputs: ${escapeHtml(missing)}</div>`,
      `<div>Generated UTC: ${escapeHtml(state.data.generated_at_utc || 'n/a')}</div>`,
      `<div>Formula version: ${escapeHtml(state.data.formula_version || 'n/a')}</div>`,
      `<div>Signal mode: <b>${escapeHtml(signalLabel())}</b></div>`,
      `<div>Cleaned mode is a measurement-robust proxy; it does not truly reverse hedonics or national statistical methods.</div>`,
      `<div>Distortion index compares the official projection against cleaned S2 signals. It flags overstatement/divergence, not legal proof of lying.</div>`,
      `<div>Productive note: Productive capacity includes manufacturing/industry mass and depth, not GDP growth alone.</div>`,
      `<div>Sovereign note: Sovereign coherence uses non-IMF-linked source channels where available, including WIPO patents, UNESCO/UIS R&D, IEA electricity, transport infrastructure, and SIPRI military-expenditure share; it is conservative and null when coverage is sparse.</div>`,
      `<div>Finance note: smoothed broad-money/private-credit depth; legacy hard-clipped field is not used for the visible Finance score.</div>`
    ].join('');
  }

  function renderDynamicAudit(country, row) {
    const note = currentLang === 'ru' ? 'Слой динамики использует исторические индикаторы из живых источников.' : (state.data?.model_notes?.dynamics_layer || 'Dynamics layer uses historical live-source indicators.');
    if (currentLang === 'ru') {
      els.auditTrail.innerHTML = [
        `<div>Выбранный год: <b>${escapeHtml(state.dynamicYear || 'n/a')}</b></div>`,
        `<div>Входы country-year присутствуют: <b>${escapeHtml(row?.input_count ?? 'n/a')}</b> / входов модели</div>`,
        `<div>Режим сигнала: <b>${escapeHtml(signalLabel())}</b></div>`,
        `<div>Метод кластера: правило-ориентированная классификация прокси-состояний DREAM/S2.</div>`,
        `<div>Предупреждение о потоках: это вычисленные дуги градиента давления, а не наблюдаемые двусторонние потоки.</div>`,
        `<div>${escapeHtml(note)}</div>`
      ].join('');
      return;
    }
    els.auditTrail.innerHTML = [
      `<div>Selected year: <b>${escapeHtml(state.dynamicYear || 'n/a')}</b></div>`,
      `<div>Country-year inputs present: <b>${escapeHtml(row?.input_count ?? 'n/a')}</b> / model inputs</div>`,
      `<div>Signal mode: <b>${escapeHtml(signalLabel())}</b></div>`,
      `<div>Cluster method: rule-based DREAM/S2 proxy state classification.</div>`,
      `<div>Flow warning: inferred pressure-gradient arcs, not observed bilateral flows.</div>`,
      `<div>${escapeHtml(note)}</div>`
    ].join('');
  }

  function initMap() {
    if (!window.d3 || !window.topojson) {
      throw new Error('D3 or topojson-client failed to load from the CDN. Check network/CDN access or vendor d3.min.js into the repo.');
    }

    els.map.innerHTML = '';
    state.svg = d3.select(els.map).append('svg').attr('class', 'd3-world-map');
    state.viewport = state.svg.append('g').attr('class', 'map-viewport');
    state.sphereLayer = state.viewport.append('path').attr('class', 'sphere-bg');
    state.countryLayer = state.viewport.append('g').attr('class', 'country-layer');
    state.flowLayer = state.viewport.append('g').attr('class', 'flow-layer');
    state.tooltip = d3.select(els.map).append('div').attr('class', 'map-tooltip hidden');
    state.projection = d3.geoNaturalEarth1();
    state.geoPath = d3.geoPath(state.projection);

    state.zoomBehavior = d3.zoom()
      .scaleExtent([0.9, 8])
      .on('zoom', event => {
        state.viewport.attr('transform', event.transform);
      });
    state.svg.call(state.zoomBehavior);
    state.svg.on('mouseleave', hideTooltip);
    bindZoomControls();
    window.addEventListener('resize', () => {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(() => {
        state.mapSizeKey = null;
        refreshMapStyles();
      }, 120);
    });
  }

  function zoomMapBy(factor) {
    if (!state.svg || !state.zoomBehavior || !window.d3) return;
    state.svg.call(state.zoomBehavior.scaleBy, factor);
  }

  function resetMapZoom() {
    if (!state.svg || !state.zoomBehavior || !window.d3) return;
    state.svg.call(state.zoomBehavior.transform, d3.zoomIdentity);
  }

  function bindZoomControls() {
    if (els.zoomIn) els.zoomIn.addEventListener('click', () => zoomMapBy(1.45));
    if (els.zoomOut) els.zoomOut.addEventListener('click', () => zoomMapBy(1 / 1.45));
    if (els.zoomReset) els.zoomReset.addEventListener('click', resetMapZoom);
  }

  async function loadJson(url, label) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`${label} fetch failed: HTTP ${response.status} ${response.statusText} (${url})`);
    }
    return response.json();
  }

  function validatePayload(payload) {
    if (!payload || !Array.isArray(payload.countries) || !payload.countries.length) {
      throw new Error('Live feed JSON loaded but contains no countries array. Run the refresh-data workflow and inspect scripts/fetch_worldbank.py output.');
    }
  }

  function indexCountries(payload) {
    state.data = payload;
    state.countryByIso3.clear();
    state.countryByNumeric.clear();
    for (const country of payload.countries) {
      if (country.iso3) state.countryByIso3.set(country.iso3, country);
      if (country.isoNumeric) state.countryByNumeric.set(String(country.isoNumeric).padStart(3, '0'), country);
    }
    const years = availableYears();
    state.dynamicYear = payload.dynamics?.default_year || (years.length ? years[years.length - 1] : null);
  }

  function bindDynamicsEvents() {
    if (!els.yearSlider) return;
    els.yearSlider.addEventListener('input', () => setDynamicYear(Number(els.yearSlider.value)));
    els.playButton.addEventListener('click', toggleDynamicsPlayback);
    if (els.speedSelect) {
      els.speedSelect.addEventListener('change', () => {
        state.dynamicSpeed = Number(els.speedSelect.value) || 1;
        if (state.dynamicsTimer) startDynamicsPlayback();
        updateNarration();
      });
    }
    els.flowToggle.addEventListener('change', () => {
      state.flowsVisible = els.flowToggle.checked;
      state.lastFlowKey = null;
      renderFlows();
    });
  }

  async function bootstrap() {
    applyTheme();
    applyStaticLanguage();
    renderTabs();
    renderLegend();
    initMap();
    bindDynamicsEvents();
    bindLanguageToggle();
    bindThemeToggle();
    applyStaticLanguage();
    showMapMessage(t('loadingBoundaries'));

    try {
      const [payload, topology] = await Promise.all([
        loadJson(DATA_URL, 'Live economic feed'),
        loadJson(GEO_URL, 'Country boundaries')
      ]);
      validatePayload(payload);
      indexCountries(payload);

      const features = window.topojson.feature(topology, topology.objects.countries).features;
      const featureCollection = prepareFeatureCollection(features);
      state.geoFeatures = featureCollection.features;
      state.geoLayer = true;
      state.featureCollection = featureCollection;
      refreshMapStyles();

      renderRegionFilter();
      if (els.downloadData) els.downloadData.disabled = false;
      renderDynamicsControls();
      renderInspector();
      hideMapMessage();
      const countryCount = state.data.countries.length;
      const updated = state.data.generated_at_utc || 'unknown generation time';
      const years = availableYears();
      const yearText = years.length ? `; ${t('dynamics')} ${years[0]}-${years[years.length - 1]}` : '';
      window.__dreamDataLoaded = true;
      setStatus(`${t('liveFeedLoaded')}: ${countryCount} ${t('countries')}`, 'ok', `${t('generated')} ${updated}; ${t('sourceLastUpdate')} ${state.data.source_lastupdated || 'n/a'}${yearText}.`);
    } catch (error) {
      console.error(error);
      setStatus(t('noLiveFeedRendered'), 'error', error.message);
      showMapMessage(`${t('noLivePrefix')} ${error.message}`);
    }
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
