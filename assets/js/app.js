// Minimal JS for charts and demo logic
(function () {
  const $ = (id) => document.getElementById(id);

  function formatSecondsToMmSs(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  // Hero chart: illustrative gain curve
  const heroCtx = $('heroChart');
  if (heroCtx && window.Chart) {
    const labels = Array.from({ length: 11 }, (_, i) => i / 10);
    const base = labels.map((x) => 18 + 10 * x); // trains/hour baseline + AI
    const stabilized = labels.map((x) => 18 + 12 * Math.pow(x, 0.7));
    new Chart(heroCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Baseline',
            data: base,
            borderColor: '#94a3b8',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.35,
          },
          {
            label: 'With AI Control',
            data: stabilized,
            borderColor: '#2563eb',
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.35,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { title: { display: true, text: 'AI precision factor' } },
          y: { title: { display: true, text: 'Trains per hour' } },
        },
      },
    });
  }

  // Demo controls
  const controls = ['headway', 'dwell', 'clearance', 'variability', 'ai'];
  const valueEls = {
    headway: $('headwayVal'),
    dwell: $('dwellVal'),
    clearance: $('clearanceVal'),
    variability: $('variabilityVal'),
    ai: $('aiVal'),
  };

  function readInputs() {
    return {
      headway: Number($('headway').value),
      dwell: Number($('dwell').value),
      clearance: Number($('clearance').value),
      variability: Number($('variability').value) / 100,
      ai: Number($('ai').value),
    };
  }

  function updateLabels() {
    const v = readInputs();
    valueEls.headway.textContent = `${v.headway}s`;
    valueEls.dwell.textContent = `${v.dwell}s`;
    valueEls.clearance.textContent = `${v.clearance}s`;
    valueEls.variability.textContent = `${Math.round(v.variability * 100)}%`;
    valueEls.ai.textContent = `${v.ai.toFixed(2)}`;
  }

  // Simple throughput model
  function computeMetrics(params) {
    const { headway, dwell, clearance, variability, ai } = params;

    // Base headway per train considering dwell and clearance
    const technicalHeadway = headway + clearance + 0.2 * dwell;

    // Variability increases headway; AI precision reduces effective variability
    const effectiveVariability = clamp(variability * (1 - 0.75 * ai), 0, 0.8);

    // Buffer multiplier based on remaining variability
    const bufferMultiplier = 1 + 0.8 * effectiveVariability;

    // AI sequencing benefit reduces conflicts translating into headway reduction
    const aiBenefit = 1 - 0.12 * Math.pow(ai, 0.8);

    const effectiveHeadway = Math.max(30, technicalHeadway * bufferMultiplier * aiBenefit);
    const tph = 3600 / effectiveHeadway; // trains per hour

    // Stability index (0-100)
    const stability = Math.round(100 * (1 - effectiveVariability) * (1 / aiBenefit));

    return {
      effectiveHeadway,
      tph,
      stability: clamp(stability, 0, 100),
    };
  }

  // Chart for demo
  const demoCtx = $('demoChart');
  let demoChart = null;

  function ensureDemoChart() {
    if (!demoCtx || !window.Chart) return;
    if (demoChart) return demoChart;

    const xs = Array.from({ length: 21 }, (_, i) => i / 20);
    const baseData = xs.map((x) => 0);
    const aiData = xs.map((x) => 0);
    demoChart = new Chart(demoCtx, {
      type: 'line',
      data: {
        labels: xs,
        datasets: [
          {
            label: 'Baseline (ai=0)',
            data: baseData,
            borderColor: '#94a3b8',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
          },
          {
            label: 'With AI',
            data: aiData,
            borderColor: '#2563eb',
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.3,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { title: { display: true, text: 'AI precision factor' } },
          y: { title: { display: true, text: 'Trains per hour' } },
        },
      },
    });
    return demoChart;
  }

  function updateDemo() {
    updateLabels();
    const v = readInputs();
    const chart = ensureDemoChart();
    if (!chart) return;

    // Recompute curves for ai sweep and baseline
    const xs = chart.data.labels;
    chart.data.datasets[0].data = xs.map((ai) => computeMetrics({ ...v, ai: 0 }).tph);
    chart.data.datasets[1].data = xs.map((ai) => computeMetrics({ ...v, ai }).tph);
    chart.update();

    const metrics = computeMetrics(v);
    const kpiThroughput = document.getElementById('kpiThroughput');
    const kpiHeadway = document.getElementById('kpiHeadway');
    const kpiStability = document.getElementById('kpiStability');
    if (kpiThroughput) kpiThroughput.textContent = `${metrics.tph.toFixed(1)} tph`;
    if (kpiHeadway) kpiHeadway.textContent = `${formatSecondsToMmSs(metrics.effectiveHeadway)} min`;
    if (kpiStability) kpiStability.textContent = `${metrics.stability}`;
  }

  // Bind controls
  controls.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', updateDemo);
    el.addEventListener('change', updateDemo);
  });

  // Buttons
  const defaults = { headway: 120, dwell: 30, clearance: 20, variability: 20, ai: 0.6 };
  const resetBtn = $('resetBtn');
  const randomBtn = $('randomBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      Object.entries(defaults).forEach(([k, v]) => { $(k).value = String(v); });
      updateDemo();
    });
  }
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      $('headway').value = String(60 + Math.round(Math.random() * 240));
      $('dwell').value = String(15 + Math.round(Math.random() * 75));
      $('clearance').value = String(10 + Math.round(Math.random() * 50));
      $('variability').value = String(Math.round(Math.random() * 50));
      $('ai').value = (Math.random()).toFixed(2);
      updateDemo();
    });
  }

  // Year in footer
  const yearEl = $('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Initial render
  updateDemo();
})();

