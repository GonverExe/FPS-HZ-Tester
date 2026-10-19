(() => {
  'use strict';

  const DEFAULT_FPS = [15, 30, 60, 144];
  const STORAGE_KEY = 'fpsTester.balls';
  const LANG_KEY = 'fpsTester.lang';
  const MIN_FPS = 1;
  const MAX_FPS = 2500;
  const MAX_BLUR_SAMPLES = 256;
  const COMMON_HZ = [
    24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 160, 165, 170, 175,
    180, 200, 240, 280, 300, 360, 390, 480, 500, 540, 600, 750, 1000
  ];

  // ---------- Idiomas ----------

  const LOCALES = {
    es: 'es-ES', en: 'en-US', ru: 'ru-RU', fr: 'fr-FR', pt: 'pt-BR', it: 'it-IT', zh: 'zh-CN'
  };

  const I18N = {
    es: {
      title: 'Test de FPS / Hz',
      subtitle: 'Cada bola es un vídeo que se reproduce a sus FPS, con desenfoque de movimiento como una cámara real. Si dos bolas se ven igual de suaves, tu monitor ya no puede mostrar más.',
      monitor: 'Tu monitor',
      measuring: 'Midiendo…',
      hzTitle: 'Frecuencia medida con requestAnimationFrame',
      hzUnit: 'Hz',
      language: 'Idioma',
      stageLabel: 'Bolas en movimiento',
      panelLabel: 'Controles',
      addBall: 'Añadir bola',
      placeholder: 'Ej. 240',
      add: 'Añadir',
      pause: 'Pausa',
      resume: 'Reanudar',
      speed: 'Velocidad',
      blur: 'Desenfoque',
      reset: 'Restaurar por defecto',
      hintBefore: 'Pulsa ',
      spaceKey: 'Espacio',
      hintAfter: ' para pausar o reanudar. Los cambios se guardan en este navegador.',
      delete: 'Borrar',
      ballFps: 'FPS de la bola',
      empty: 'No hay bolas. Añade unos FPS en el panel de abajo.',
      maxWarn: 'Tu monitor: máx. {hz}'
    },
    en: {
      title: 'FPS / Hz Test',
      subtitle: 'Each ball is a video playing at its own FPS, with motion blur like a real camera. If two balls look equally smooth, your monitor can’t show any more.',
      monitor: 'Your monitor',
      measuring: 'Measuring…',
      hzTitle: 'Refresh rate measured with requestAnimationFrame',
      hzUnit: 'Hz',
      language: 'Language',
      stageLabel: 'Moving balls',
      panelLabel: 'Controls',
      addBall: 'Add ball',
      placeholder: 'e.g. 240',
      add: 'Add',
      pause: 'Pause',
      resume: 'Resume',
      speed: 'Speed',
      blur: 'Motion blur',
      reset: 'Restore defaults',
      hintBefore: 'Press ',
      spaceKey: 'Space',
      hintAfter: ' to pause or resume. Your changes are saved in this browser.',
      delete: 'Delete',
      ballFps: 'Ball FPS',
      empty: 'No balls yet. Add some FPS in the panel below.',
      maxWarn: 'Your monitor: max {hz}'
    },
    ru: {
      title: 'Тест FPS / Гц',
      subtitle: 'Каждый шар — это видео, которое воспроизводится со своей частотой кадров и с размытием движения, как у настоящей камеры. Если два шара выглядят одинаково плавно, ваш монитор больше не может показать.',
      monitor: 'Ваш монитор',
      measuring: 'Измерение…',
      hzTitle: 'Частота измерена с помощью requestAnimationFrame',
      hzUnit: 'Гц',
      language: 'Язык',
      stageLabel: 'Движущиеся шары',
      panelLabel: 'Управление',
      addBall: 'Добавить шар',
      placeholder: 'Напр. 240',
      add: 'Добавить',
      pause: 'Пауза',
      resume: 'Продолжить',
      speed: 'Скорость',
      blur: 'Размытие',
      reset: 'Восстановить по умолчанию',
      hintBefore: 'Нажмите ',
      spaceKey: 'Пробел',
      hintAfter: ', чтобы поставить на паузу или продолжить. Изменения сохраняются в этом браузере.',
      delete: 'Удалить',
      ballFps: 'FPS шара',
      empty: 'Шаров нет. Добавьте FPS на панели ниже.',
      maxWarn: 'Ваш монитор: макс. {hz}'
    },
    fr: {
      title: 'Test FPS / Hz',
      subtitle: 'Chaque balle est une vidéo lue à ses propres FPS, avec un flou de mouvement comme une vraie caméra. Si deux balles semblent aussi fluides l’une que l’autre, votre écran ne peut pas afficher plus.',
      monitor: 'Votre écran',
      measuring: 'Mesure…',
      hzTitle: 'Fréquence mesurée avec requestAnimationFrame',
      hzUnit: 'Hz',
      language: 'Langue',
      stageLabel: 'Balles en mouvement',
      panelLabel: 'Commandes',
      addBall: 'Ajouter une balle',
      placeholder: 'Ex. 240',
      add: 'Ajouter',
      pause: 'Pause',
      resume: 'Reprendre',
      speed: 'Vitesse',
      blur: 'Flou',
      reset: 'Rétablir par défaut',
      hintBefore: 'Appuyez sur ',
      spaceKey: 'Espace',
      hintAfter: ' pour mettre en pause ou reprendre. Vos modifications sont enregistrées dans ce navigateur.',
      delete: 'Supprimer',
      ballFps: 'FPS de la balle',
      empty: 'Aucune balle. Ajoutez des FPS dans le panneau ci-dessous.',
      maxWarn: 'Votre écran : max. {hz}'
    },
    pt: {
      title: 'Teste de FPS / Hz',
      subtitle: 'Cada bola é um vídeo reproduzido no seu próprio FPS, com desfoque de movimento como uma câmera de verdade. Se duas bolas parecem igualmente suaves, seu monitor não consegue mostrar mais.',
      monitor: 'Seu monitor',
      measuring: 'Medindo…',
      hzTitle: 'Frequência medida com requestAnimationFrame',
      hzUnit: 'Hz',
      language: 'Idioma',
      stageLabel: 'Bolas em movimento',
      panelLabel: 'Controles',
      addBall: 'Adicionar bola',
      placeholder: 'Ex. 240',
      add: 'Adicionar',
      pause: 'Pausar',
      resume: 'Retomar',
      speed: 'Velocidade',
      blur: 'Desfoque',
      reset: 'Restaurar padrão',
      hintBefore: 'Pressione ',
      spaceKey: 'Espaço',
      hintAfter: ' para pausar ou retomar. As alterações são salvas neste navegador.',
      delete: 'Excluir',
      ballFps: 'FPS da bola',
      empty: 'Nenhuma bola. Adicione FPS no painel abaixo.',
      maxWarn: 'Seu monitor: máx. {hz}'
    },
    it: {
      title: 'Test FPS / Hz',
      subtitle: 'Ogni pallina è un video riprodotto ai suoi FPS, con sfocatura di movimento come una vera videocamera. Se due palline sembrano ugualmente fluide, il tuo monitor non può mostrare di più.',
      monitor: 'Il tuo monitor',
      measuring: 'Misurazione…',
      hzTitle: 'Frequenza misurata con requestAnimationFrame',
      hzUnit: 'Hz',
      language: 'Lingua',
      stageLabel: 'Palline in movimento',
      panelLabel: 'Controlli',
      addBall: 'Aggiungi pallina',
      placeholder: 'Es. 240',
      add: 'Aggiungi',
      pause: 'Pausa',
      resume: 'Riprendi',
      speed: 'Velocità',
      blur: 'Sfocatura',
      reset: 'Ripristina predefiniti',
      hintBefore: 'Premi ',
      spaceKey: 'Spazio',
      hintAfter: ' per mettere in pausa o riprendere. Le modifiche vengono salvate in questo browser.',
      delete: 'Elimina',
      ballFps: 'FPS della pallina',
      empty: 'Nessuna pallina. Aggiungi degli FPS nel pannello qui sotto.',
      maxWarn: 'Il tuo monitor: max {hz}'
    },
    zh: {
      title: 'FPS / Hz 测试',
      subtitle: '每个小球都是一段按各自 FPS 播放的视频，带有和真实摄像机一样的运动模糊。如果两个小球看起来一样流畅，说明你的显示器已无法显示更高的帧率。',
      monitor: '你的显示器',
      measuring: '测量中…',
      hzTitle: '使用 requestAnimationFrame 测得的刷新率',
      hzUnit: 'Hz',
      language: '语言',
      stageLabel: '移动的小球',
      panelLabel: '控制',
      addBall: '添加小球',
      placeholder: '例如 240',
      add: '添加',
      pause: '暂停',
      resume: '继续',
      speed: '速度',
      blur: '运动模糊',
      reset: '恢复默认',
      hintBefore: '按 ',
      spaceKey: '空格键',
      hintAfter: ' 暂停或继续。更改会保存在此浏览器中。',
      delete: '删除',
      ballFps: '小球 FPS',
      empty: '还没有小球。请在下方面板中添加 FPS。',
      maxWarn: '你的显示器：最高 {hz}'
    }
  };

  const stage = document.getElementById('stage');
  const ballList = document.getElementById('ballList');
  const addForm = document.getElementById('addForm');
  const newFpsInput = document.getElementById('newFps');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const speedInput = document.getElementById('speed');
  const speedValue = document.getElementById('speedValue');
  const blurInput = document.getElementById('blur');
  const blurValue = document.getElementById('blurValue');
  const hzValue = document.getElementById('hzValue');
  const langSelect = document.getElementById('langSelect');

  const ballColor = getComputedStyle(document.documentElement).getPropertyValue('--ball').trim() || '#f2f2f2';

  // Cada bola: { fps, trackEl, canvas, ctx, warnEl, lastFrame }
  let balls = [];
  let lang = 'es';

  // Estado de la animación
  let clock = 0;          // segundos de animación (no avanza en pausa)
  let offset = 0;         // px, evita saltos al cambiar la velocidad
  let speed = Number(speedInput.value);
  let blur = Number(blurInput.value) / 100;  // parte del fotograma con el "obturador" abierto
  let paused = false;
  let lastNow = null;
  let laneW = 0;          // tamaño de cada carril en px CSS
  let laneH = 0;
  let travel = 0;         // recorrido disponible en px

  // Medición de Hz del monitor
  const frameTimes = [];
  let detectedHz = 0;

  // ---------- Utilidades ----------

  function t(key) {
    return I18N[lang][key] ?? I18N.es[key];
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

  function formatBlur() {
    return blur.toLocaleString(LOCALES[lang], { style: 'percent' });
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

  function loadLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) {
      // Sin guardado disponible
    }
    // Si no hay idioma guardado, se usa el del navegador si está disponible
    for (const code of navigator.languages || [navigator.language]) {
      const short = String(code).slice(0, 2).toLowerCase();
      if (I18N[short]) return short;
    }
    return 'es';
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
    document.documentElement.lang = LOCALES[lang];
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
    hzValue.textContent = detectedHz ? detectedHz + ' ' + t('hzUnit') : t('measuring');
    blurValue.textContent = formatBlur();
    render();
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
    ball.warnEl = warn;
    ball.lastFrame = null;
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
    input.setAttribute('aria-label', t('ballFps'));

    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = 'FPS';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger';
    del.textContent = t('delete');

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
      ball.warnEl.textContent = over ? t('maxWarn').replace('{hz}', detectedHz) : '';
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

  // Dibuja un fotograma del "vídeo" de una bola. Como en una cámara, el fotograma
  // recoge todo el movimiento mientras el obturador está abierto: se dibujan muchas
  // copias de la bola a lo largo de ese tramo y se promedian (desenfoque de movimiento).
  function drawFrame(ball, frameIndex) {
    const ctx = ball.ctx;
    const r = laneH / 2;
    const frameStart = frameIndex / ball.fps;
    const exposure = blur / ball.fps;
    const blurPx = exposure * speed;
    const samples = blurPx < 0.5 ? 1 : Math.min(MAX_BLUR_SAMPLES, Math.ceil(blurPx) + 1);

    ctx.clearRect(0, 0, laneW, laneH);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1 / samples;
    ctx.fillStyle = ballColor;
    for (let i = 0; i < samples; i++) {
      const time = samples === 1 ? frameStart : frameStart + exposure * (i / (samples - 1));
      const x = mod(time * speed + offset, travel) + r;
      ctx.beginPath();
      ctx.arc(x, r, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function draw() {
    if (travel <= 0) return;
    for (const ball of balls) {
      // Como un vídeo: el fotograma solo cambia a los FPS de la bola
      const frameIndex = Math.floor(clock * ball.fps);
      if (frameIndex !== ball.lastFrame) {
        drawFrame(ball, frameIndex);
        ball.lastFrame = frameIndex;
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
      hzValue.textContent = hz + ' ' + t('hzUnit');
      updateWarnings();
    }
  }

  // ---------- Controles ----------

  function setPaused(value) {
    paused = value;
    pauseBtn.textContent = paused ? t('resume') : t('pause');
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

  langSelect.addEventListener('change', () => {
    if (!I18N[langSelect.value]) return;
    lang = langSelect.value;
    saveLang();
    applyLanguage();
  });

  speedInput.addEventListener('input', () => {
    const newSpeed = Number(speedInput.value);
    // Mantiene la posición actual para que las bolas no salten
    offset += clock * (speed - newSpeed);
    speed = newSpeed;
    speedValue.textContent = speed + ' px/s';
    invalidateFrames();
    draw();
  });

  blurInput.addEventListener('input', () => {
    blur = Number(blurInput.value) / 100;
    blurValue.textContent = formatBlur();
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

  // ---------- Inicio ----------

  balls = loadFps().map((fps) => ({ fps }));
  sortBalls();
  lang = loadLang();
  applyLanguage();
  setInterval(updateHz, 500);
  requestAnimationFrame(frame);
})();
