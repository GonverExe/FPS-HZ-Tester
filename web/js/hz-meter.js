// Medición de los Hz del monitor: se cuentan los fotogramas que dibuja el navegador.
// JavaScript no puede leer la frecuencia del monitor, solo a qué ritmo pinta el navegador.
(() => {
  'use strict';

  const COMMON_HZ = [
    24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 160, 165, 170, 175,
    180, 200, 240, 280, 300, 360, 390, 480, 500, 540, 600, 750, 1000
  ];
  const WARMUP_MS = 300;     // se ignoran los fotogramas justo después de empezar
  const WINDOW_MS = 1000;    // se mide con el último segundo de fotogramas
  const MIN_SAMPLES = 20;    // hace falta al menos medio segundo de fotogramas
  const MIN_SPAN_MS = 500;   // para dar un valor fiable

  // Frecuencia a partir de los tiempos entre fotogramas. Un fotograma perdido dura el
  // doble y cuenta como dos, así la media no baja; y al dividir el tiempo total entre
  // los fotogramas, el redondeo de los relojes poco precisos se compensa.
  function estimateHz(dts) {
    const sorted = dts.slice().sort((a, b) => a - b);
    const period = sorted[Math.floor(sorted.length / 2)];
    let time = 0;
    let frames = 0;
    for (const dt of dts) {
      const n = Math.round(dt / period);
      if (n < 1 || n > 4) continue;
      time += dt;
      frames += n;
    }
    return frames ? (1000 * frames) / time : 0;
  }

  // Solo se redondea a una frecuencia típica si está a menos del 1 % (59,94 -> 60);
  // así un límite de FPS como 141 o 237 se ve tal cual
  function snapHz(raw) {
    let best = COMMON_HZ[0];
    for (const hz of COMMON_HZ) {
      if (Math.abs(hz - raw) < Math.abs(best - raw)) best = hz;
    }
    return Math.abs(best - raw) / best < 0.01 ? best : Math.round(raw);
  }

  // Al pasar la ventana a otro monitor cambian los datos de `screen` (tamaño, posición
  // en el escritorio o escala)
  function screenKey() {
    const s = window.screen;
    return [s.width, s.height, s.availLeft, s.availTop, window.devicePixelRatio].join('|');
  }

  // `onChange(hz)` se llama cada vez que cambia el valor; 0 significa "midiendo"
  function createHzMeter(onChange) {
    let frameTimes = [];   // { at, dt } en ms
    let start = 0;
    let hz = 0;
    let currentScreen = screenKey();

    function set(value) {
      if (value === hz) return;
      hz = value;
      onChange(hz);
    }

    // Empieza a medir de cero: al cargar, al volver a la pestaña o al cambiar de monitor
    function restart() {
      frameTimes = [];
      start = performance.now();
      set(0);
    }

    function record(dt, now) {
      if (dt <= 0 || dt > 100 || now - start < WARMUP_MS) return;
      frameTimes.push({ at: now, dt });
      while (now - frameTimes[0].at > WINDOW_MS) frameTimes.shift();
    }

    function update() {
      if (frameTimes.length < MIN_SAMPLES) return;
      if (frameTimes[frameTimes.length - 1].at - frameTimes[0].at < MIN_SPAN_MS) return;
      set(snapHz(estimateHz(frameTimes.map((f) => f.dt))));
    }

    function checkScreen() {
      const key = screenKey();
      if (key === currentScreen) return;
      currentScreen = key;
      restart();
    }

    return {
      get hz() { return hz; },
      restart,
      record,
      update,
      checkScreen
    };
  }

  window.FPSTester = window.FPSTester || {};
  window.FPSTester.createHzMeter = createHzMeter;
})();
