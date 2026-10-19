(() => {
  'use strict';

  const DEFAULT_FPS = [15, 30, 60, 144];
  const STORAGE_KEY = 'fpsTester.balls';
  const MIN_FPS = 1;
  const MAX_FPS = 2500;
  const COMMON_HZ = [
    24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 160, 165, 170, 175,
    180, 200, 240, 280, 300, 360, 390, 480, 500, 540, 600, 750, 1000
  ];

  const stage = document.getElementById('stage');
  const ballList = document.getElementById('ballList');
  const addForm = document.getElementById('addForm');
  const newFpsInput = document.getElementById('newFps');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const speedInput = document.getElementById('speed');
  const speedValue = document.getElementById('speedValue');
  const hzValue = document.getElementById('hzValue');

  // Cada bola: { fps, ballEl, trackEl, warnEl, lastX }
  let balls = [];

  // Estado de la animación
  let clock = 0;          // segundos de animación (no avanza en pausa)
  let offset = 0;         // px, evita saltos al cambiar la velocidad
  let speed = Number(speedInput.value);
  let paused = false;
  let lastNow = null;
  let travel = 0;         // recorrido disponible en px

  // Medición de Hz del monitor
  const frameTimes = [];
  let detectedHz = 0;

  // ---------- Utilidades ----------

  function normalizeFps(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n * 100) / 100;
    return rounded >= MIN_FPS && rounded <= MAX_FPS ? rounded : null;
  }

  function formatFps(fps) {
    return fps.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }

  function mod(value, m) {
    return ((value % m) + m) % m;
  }

  function sortBalls() {
    balls.sort((a, b) => a.fps - b.fps);
  }

  // ---------- Guardado ----------

  function loadFps() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          return data.map(normalizeFps).filter((fps) => fps !== null);
        }
      }
    } catch (e) {
      // localStorage bloqueado o datos corruptos: se usan los valores por defecto
    }
    return DEFAULT_FPS.slice();
  }

  function saveFps() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(balls.map((b) => b.fps)));
    } catch (e) {
      // Sin guardado disponible: la web sigue funcionando
    }
  }

  // ---------- Pintado de la interfaz ----------

  function render() {
    stage.textContent = '';
    ballList.textContent = '';

    if (balls.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No hay bolas. Añade unos FPS en el panel de abajo.';
      stage.appendChild(empty);
    }

    for (const ball of balls) {
      stage.appendChild(createLane(ball));
      ballList.appendChild(createListItem(ball));
    }

    measure();
    updateWarnings();
    draw();
  }

  function createLane(ball) {
    const lane = document.createElement('div');
    lane.className = 'lane';

    const label = document.createElement('div');
    label.className = 'lane-label';

    const fpsText = document.createElement('span');
    fpsText.className = 'lane-fps';
    fpsText.textContent = formatFps(ball.fps) + ' FPS';

    const warn = document.createElement('span');
    warn.className = 'lane-warn';

    label.append(fpsText, warn);

    const track = document.createElement('div');
    track.className = 'track';

    const dot = document.createElement('div');
    dot.className = 'ball';
    track.appendChild(dot);

    lane.append(label, track);

    ball.ballEl = dot;
    ball.trackEl = track;
    ball.warnEl = warn;
    ball.lastX = null;
    return lane;
  }

  function createListItem(ball) {
    const li = document.createElement('li');
    li.className = 'ball-item';

    const dot = document.createElement('span');
    dot.className = 'mini-ball';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = MIN_FPS;
    input.max = MAX_FPS;
    input.step = 'any';
    input.value = ball.fps;
    input.setAttribute('aria-label', 'FPS de la bola');

    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = 'FPS';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger';
    del.textContent = 'Borrar';

    input.addEventListener('change', () => {
      const fps = normalizeFps(input.value);
      if (fps === null) {
        input.value = ball.fps;
        return;
      }
      ball.fps = fps;
      sortBalls();
      saveFps();
      render();
    });

    del.addEventListener('click', () => {
      balls = balls.filter((b) => b !== ball);
      saveFps();
      render();
    });

    li.append(dot, input, unit, del);
    return li;
  }

  function updateWarnings() {
    for (const ball of balls) {
      const over = detectedHz > 0 && ball.fps > detectedHz * 1.02;
      ball.warnEl.textContent = over ? 'Tu monitor: máx. ' + detectedHz : '';
    }
  }

  // ---------- Animación ----------

  function measure() {
    const first = balls[0];
    travel = first ? first.trackEl.clientWidth - first.ballEl.offsetWidth : 0;
    for (const ball of balls) ball.lastX = null;
  }

  function draw() {
    if (travel <= 0) return;
    for (const ball of balls) {
      // El tiempo se "congela" entre fotogramas de la bola: solo avanza a sus FPS
      const t = Math.floor(clock * ball.fps) / ball.fps;
      const x = mod(t * speed + offset, travel);
      if (x !== ball.lastX) {
        ball.ballEl.style.transform = 'translate3d(' + x + 'px, 0, 0)';
        ball.lastX = x;
      }
    }
  }

  function frame(now) {
    if (lastNow !== null) {
      const dt = now - lastNow;
      recordFrame(dt);
      // Si la pestaña estuvo oculta, no se da un salto enorme
      if (!paused) clock += Math.min(dt, 100) / 1000;
    }
    lastNow = now;
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- Detección de Hz ----------

  function recordFrame(dt) {
    if (dt <= 0 || dt > 100) return;
    frameTimes.push(dt);
    if (frameTimes.length > 120) frameTimes.shift();
  }

  function snapHz(raw) {
    let best = COMMON_HZ[0];
    for (const hz of COMMON_HZ) {
      if (Math.abs(hz - raw) < Math.abs(best - raw)) best = hz;
    }
    return Math.abs(best - raw) / best < 0.03 ? best : Math.round(raw);
  }

  function updateHz() {
    if (frameTimes.length < 20) return;
    // Media del 50 % central para ignorar fotogramas perdidos
    const sorted = frameTimes.slice().sort((a, b) => a - b);
    const start = Math.floor(sorted.length * 0.25);
    const middle = sorted.slice(start, sorted.length - start);
    const avg = middle.reduce((sum, v) => sum + v, 0) / middle.length;
    const hz = snapHz(1000 / avg);
    if (hz !== detectedHz) {
      detectedHz = hz;
      hzValue.textContent = hz + ' Hz';
      updateWarnings();
    }
  }

  // ---------- Controles ----------

  function setPaused(value) {
    paused = value;
    pauseBtn.textContent = paused ? 'Reanudar' : 'Pausa';
  }

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fps = normalizeFps(newFpsInput.value);
    if (fps === null) return;
    balls.push({ fps });
    sortBalls();
    saveFps();
    render();
    newFpsInput.value = '';
    newFpsInput.focus();
  });

  pauseBtn.addEventListener('click', () => setPaused(!paused));

  resetBtn.addEventListener('click', () => {
    balls = DEFAULT_FPS.map((fps) => ({ fps }));
    saveFps();
    render();
  });

  speedInput.addEventListener('input', () => {
    const newSpeed = Number(speedInput.value);
    // Mantiene la posición actual para que las bolas no salten
    offset += clock * (speed - newSpeed);
    speed = newSpeed;
    speedValue.textContent = speed + ' px/s';
    for (const ball of balls) ball.lastX = null;
    draw();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    setPaused(!paused);
  });

  new ResizeObserver(() => {
    measure();
    draw();
  }).observe(stage);

  // ---------- Inicio ----------

  balls = loadFps().map((fps) => ({ fps }));
  sortBalls();
  render();
  setInterval(updateHz, 500);
  requestAnimationFrame(frame);
})();
