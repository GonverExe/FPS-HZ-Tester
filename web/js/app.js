// Bolas, vídeo de 2500 FPS, panel de control y guardado. Necesita i18n.js y hz-meter.js.
(() => {
  'use strict';

  const DEFAULT_FPS = [15, 30, 60, 144];
  const DEFAULT_COLOR = '#f2f2f2';
  const STORAGE_KEY = 'fpsTester.balls';
  const LANG_KEY = 'fpsTester.lang';
  // Todas las bolas son el mismo vídeo de 2500 FPS: el fotograma n es la bola en el
  // instante n / 2500 s. Cada carril muestra solo los fotogramas que tocan a sus FPS.
  const VIDEO_FPS = 2500;
  const MIN_FPS = 1;
  const MAX_FPS = VIDEO_FPS;

  const { LOCALES, DEFAULT_LANG, RTL_LANGS, I18N } = window.FPSTester.i18n;
  const { createHzMeter } = window.FPSTester;

  const stage = document.getElementById('stage');
  const ballList = document.getElementById('ballList');
  const addForm = document.getElementById('addForm');
  const newFpsInput = document.getElementById('newFps');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const speedInput = document.getElementById('speed');
  const speedValue = document.getElementById('speedValue');
  const hzValue = document.getElementById('hzValue');
  const langSelect = document.getElementById('langSelect');

  const ARROW_UP = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 9.5l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ARROW_DOWN = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 4.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Cada bola: { fps, color, trackEl, canvas, ctx, fpsEl, warnEl, lastFrame }
  let balls = [];
  const itemBall = new WeakMap();   // fila del panel -> su bola
  let lang = DEFAULT_LANG;

  // Estado de la animación
  let clock = 0;          // segundos de animación (no avanza en pausa)
  let offset = 0;         // px, evita saltos al cambiar la velocidad
  let phaseFrame = 0;     // fotograma del vídeo desde el que arrancan todos los carriles
  let speed = Number(speedInput.value);
  let paused = false;
  let lastNow = null;
  let laneW = 0;          // tamaño de cada carril en px CSS
  let laneH = 0;
  let travel = 0;         // recorrido disponible en px

  const hzMeter = createHzMeter(showHz);

  // ---------- Utilidades ----------

  function t(key) {
    return I18N[lang][key] ?? I18N[DEFAULT_LANG][key];
  }

  function normalizeFps(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n * 100) / 100;
    return rounded >= MIN_FPS && rounded <= MAX_FPS ? rounded : null;
  }

  function formatFps(fps) {
    return fps.toLocaleString(LOCALES[lang], { maximumFractionDigits: 2 });
  }

  function mod(value, m) {
    return ((value % m) + m) % m;
  }

  function normalizeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_COLOR;
  }

  function makeBall(fps, color) {
    return { fps, color: normalizeColor(color) };
  }

  function defaultBalls() {
    return DEFAULT_FPS.map((fps) => makeBall(fps));
  }

  // ---------- Guardado ----------

  function loadBalls() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          // Las versiones anteriores guardaban solo los FPS, sin color
          return data
            .map((item) => (item !== null && typeof item === 'object' ? item : { fps: item }))
            .map((item) => ({ fps: normalizeFps(item.fps), color: item.color }))
            .filter((item) => item.fps !== null)
            .map((item) => makeBall(item.fps, item.color));
        }
      }
    } catch (e) {
      // localStorage bloqueado o datos corruptos: se usan los valores por defecto
    }
    return defaultBalls();
  }

  function saveBalls() {
    try {
      const data = balls.map((b) => ({ fps: b.fps, color: b.color }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Sin guardado disponible: la web sigue funcionando
    }
  }

  function loadLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) {
      // Sin guardado disponible
    }
    return DEFAULT_LANG;
  }

  function saveLang() {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      // Sin guardado disponible
    }
  }

  // ---------- Pintado de la interfaz ----------

  function applyLanguage() {
    document.documentElement.lang = LOCALES[lang].split('-u-')[0];
    // El árabe se escribe de derecha a izquierda
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
    document.title = t('title');
    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.dataset.i18n);
    }
    for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    }
    for (const el of document.querySelectorAll('[data-i18n-title]')) {
      el.title = t(el.dataset.i18nTitle);
    }
    for (const el of document.querySelectorAll('[data-i18n-aria]')) {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    }
    langSelect.value = lang;
    pauseBtn.textContent = paused ? t('resume') : t('pause');
    hzValue.textContent = hzText(hzMeter.hz);
    render();
  }

  // 0 significa que todavía se está midiendo
  function hzText(hz) {
    return hz ? hz + ' ' + t('hzUnit') : t('measuring');
  }

  function showHz(hz) {
    hzValue.textContent = hzText(hz);
    updateWarnings();
  }

  function render() {
    stage.textContent = '';
    ballList.textContent = '';

    if (balls.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = t('empty');
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

    const canvas = document.createElement('canvas');
    track.appendChild(canvas);

    lane.append(label, track);

    ball.trackEl = track;
    ball.canvas = canvas;
    ball.ctx = canvas.getContext('2d');
    ball.fpsEl = fpsText;
    ball.warnEl = warn;
    ball.lastFrame = null;
    return lane;
  }

  function createIconButton(className, svg, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn ' + className;
    btn.innerHTML = svg;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    return btn;
  }

  function createListItem(ball) {
    const li = document.createElement('li');
    li.className = 'ball-item';
    itemBall.set(li, ball);

    // El círculo de la izquierda es un selector de color: al hacer clic se abre
    const color = document.createElement('input');
    color.type = 'color';
    color.className = 'color-dot';
    color.value = ball.color;
    color.setAttribute('aria-label', t('ballColor'));

    const input = document.createElement('input');
    input.type = 'number';
    input.min = MIN_FPS;
    input.max = MAX_FPS;
    input.step = 'any';
    input.value = ball.fps;
    input.setAttribute('aria-label', t('ballFps'));

    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = 'FPS';

    const index = balls.indexOf(ball);
    const up = createIconButton('move-up', ARROW_UP, t('moveUp'));
    up.disabled = index === 0;
    const down = createIconButton('move-down', ARROW_DOWN, t('moveDown'));
    down.disabled = index === balls.length - 1;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger';
    del.textContent = t('delete');

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(up, down, del);

    color.addEventListener('input', () => {
      ball.color = normalizeColor(color.value);
      ball.lastFrame = null;
      draw();
    });
    color.addEventListener('change', saveBalls);

    input.addEventListener('change', () => {
      const fps = normalizeFps(input.value);
      if (fps === null) {
        input.value = ball.fps;
        return;
      }
      // Se actualiza sin rehacer la lista, así no se pierde el foco
      ball.fps = fps;
      input.value = fps;
      ball.fpsEl.textContent = formatFps(fps) + ' FPS';
      ball.lastFrame = null;
      updateWarnings();
      draw();
      saveBalls();
    });

    up.addEventListener('click', () => moveBall(ball, -1));
    down.addEventListener('click', () => moveBall(ball, 1));

    del.addEventListener('click', () => {
      balls = balls.filter((b) => b !== ball);
      saveBalls();
      render();
    });

    li.addEventListener('pointerdown', (e) => onItemPointerDown(e, li));

    li.append(color, input, unit, actions);
    return li;
  }

  // ---------- Reordenar ----------

  function moveBall(ball, delta) {
    const from = balls.indexOf(ball);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= balls.length) return;
    balls.splice(from, 1);
    balls.splice(to, 0, ball);
    saveBalls();
    render();
    // El foco sigue en la flecha, para poder seguir moviendo con el teclado
    const li = ballList.children[to];
    const same = li.querySelector(delta < 0 ? '.move-up' : '.move-down');
    const other = li.querySelector(delta < 0 ? '.move-down' : '.move-up');
    (same.disabled ? other : same).focus();
  }

  // Arrastrar una fila del panel. Con ratón empieza al moverla; en pantallas táctiles
  // hay que mantenerla pulsada un momento, para que deslizar el dedo siga haciendo scroll.
  let drag = null;

  function onItemPointerDown(e, li) {
    if (drag || e.button !== 0 || e.target.closest('input, button')) return;
    drag = {
      li,
      pointerId: e.pointerId,
      touch: e.pointerType === 'touch',
      startY: e.clientY,
      lastY: e.clientY,
      grabOffset: e.clientY - li.getBoundingClientRect().top,
      active: false,
      timer: 0
    };
    if (drag.touch) drag.timer = setTimeout(activateDrag, 300);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragCancel);
  }

  function activateDrag() {
    if (!drag) return;
    drag.active = true;
    drag.li.classList.add('dragging');
    ballList.classList.add('is-dragging');
  }

  function onDragMove(e) {
    if (e.pointerId !== drag.pointerId) return;
    drag.lastY = e.clientY;
    if (!drag.active) {
      const moved = Math.abs(drag.lastY - drag.startY);
      if (drag.touch) {
        // Si desliza antes de tiempo está haciendo scroll, no arrastrando
        if (moved > 8) endDrag(false);
        return;
      }
      if (moved < 4) return;
      activateDrag();
    }
    positionDraggedItem();
  }

  function onDragEnd(e) {
    if (e.pointerId === drag.pointerId) endDrag(true);
  }

  function onDragCancel(e) {
    if (e.pointerId === drag.pointerId) endDrag(false);
  }

  // Coloca la fila arrastrada en el hueco que le toca y la deja pegada al cursor
  function positionDraggedItem() {
    const li = drag.li;
    const desiredTop = drag.lastY - drag.grabOffset;
    const center = desiredTop + li.offsetHeight / 2;
    const before = [...ballList.children].find((el) => {
      if (el === li) return false;
      const r = el.getBoundingClientRect();
      return center < r.top + r.height / 2;
    });
    if (before) {
      if (li.nextElementSibling !== before) ballList.insertBefore(li, before);
    } else if (ballList.lastElementChild !== li) {
      ballList.appendChild(li);
    }
    li.style.transform = '';
    const naturalTop = li.getBoundingClientRect().top;
    li.style.transform = 'translateY(' + (desiredTop - naturalTop) + 'px)';
  }

  function endDrag(commit) {
    clearTimeout(drag.timer);
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    window.removeEventListener('pointercancel', onDragCancel);
    const { li, active } = drag;
    drag = null;
    li.classList.remove('dragging');
    li.style.transform = '';
    ballList.classList.remove('is-dragging');
    if (!active) return;
    if (commit) {
      // El nuevo orden es el de las filas en el panel
      balls = [...ballList.children].map((el) => itemBall.get(el));
      saveBalls();
    }
    render();
  }

  // Mientras se arrastra con el dedo, la página no hace scroll
  ballList.addEventListener('touchmove', (e) => {
    if (drag && drag.active) e.preventDefault();
  }, { passive: false });

  function updateWarnings() {
    for (const ball of balls) {
      const hz = hzMeter.hz;
      const over = hz > 0 && ball.fps > hz * 1.02;
      ball.warnEl.textContent = over ? t('maxWarn').replace('{hz}', hz) : '';
    }
  }

  // ---------- Animación ----------

  function measure() {
    const first = balls[0];
    if (!first) {
      travel = 0;
      return;
    }
    laneW = first.trackEl.clientWidth;
    laneH = first.trackEl.clientHeight;
    travel = laneW - laneH;
    const dpr = window.devicePixelRatio || 1;
    for (const ball of balls) {
      ball.canvas.width = Math.round(laneW * dpr);
      ball.canvas.height = Math.round(laneH * dpr);
      ball.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ball.lastFrame = null;
    }
  }

  function invalidateFrames() {
    for (const ball of balls) ball.lastFrame = null;
  }

  // Fotograma del vídeo de 2500 FPS que toca ver ahora mismo
  function currentVideoFrame() {
    return Math.floor(clock * VIDEO_FPS);
  }

  // Fotograma del vídeo que muestra un carril: de los fotogramas del vídeo solo
  // enseña uno de cada (2500 / FPS del carril), contando desde `phaseFrame`
  function laneVideoFrame(ball, videoFrame) {
    if (paused) return videoFrame;
    const laneFrame = Math.floor((videoFrame - phaseFrame) * ball.fps / VIDEO_FPS);
    return phaseFrame + Math.round(laneFrame * VIDEO_FPS / ball.fps);
  }

  // Dibuja el fotograma n del vídeo: la bola en el instante n / 2500 s
  function drawVideoFrame(ball, videoFrame) {
    const ctx = ball.ctx;
    const r = laneH / 2;
    const x = mod((videoFrame / VIDEO_FPS) * speed + offset, travel) + r;
    ctx.clearRect(0, 0, laneW, laneH);
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(x, r, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    if (travel <= 0) return;
    const videoFrame = currentVideoFrame();
    for (const ball of balls) {
      // En pausa todos los carriles muestran el mismo fotograma, así quedan alineados
      const shown = laneVideoFrame(ball, videoFrame);
      if (shown !== ball.lastFrame) {
        drawVideoFrame(ball, shown);
        ball.lastFrame = shown;
      }
    }
  }

  function frame(now) {
    if (lastNow !== null) {
      const dt = now - lastNow;
      hzMeter.record(dt, now);
      // Si la pestaña estuvo oculta, no se da un salto enorme
      if (!paused) clock += Math.min(dt, 100) / 1000;
    }
    lastNow = now;
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- Controles ----------

  function setPaused(value) {
    // Al reanudar, todos los carriles arrancan juntos desde el fotograma de la pausa
    if (paused && !value) phaseFrame = currentVideoFrame();
    paused = value;
    pauseBtn.textContent = paused ? t('resume') : t('pause');
    invalidateFrames();
    draw();
  }

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fps = normalizeFps(newFpsInput.value);
    if (fps === null) return;
    balls.push(makeBall(fps));
    saveBalls();
    render();
    newFpsInput.value = '';
    newFpsInput.focus();
  });

  pauseBtn.addEventListener('click', () => setPaused(!paused));

  resetBtn.addEventListener('click', () => {
    balls = defaultBalls();
    saveBalls();
    render();
  });

  langSelect.addEventListener('change', () => {
    if (!I18N[langSelect.value]) return;
    lang = langSelect.value;
    saveLang();
    applyLanguage();
  });

  speedInput.addEventListener('input', () => {
    const newSpeed = Number(speedInput.value);
    // Mantiene la posición del fotograma actual para que las bolas no salten
    offset += (currentVideoFrame() / VIDEO_FPS) * (speed - newSpeed);
    speed = newSpeed;
    speedValue.textContent = speed + ' px/s';
    invalidateFrames();
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

  // Chrome y Edge avisan al cambiar de monitor; en el resto basta con la comprobación
  // periódica de abajo
  window.screen.addEventListener?.('change', hzMeter.checkScreen);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) hzMeter.restart();
  });

  // ---------- Inicio ----------

  balls = loadBalls();
  lang = loadLang();
  applyLanguage();
  hzMeter.restart();
  setInterval(() => {
    hzMeter.checkScreen();
    hzMeter.update();
  }, 500);
  requestAnimationFrame(frame);
})();
