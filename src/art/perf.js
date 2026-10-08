// Petit HUD de perf pour la QA : ?perf=1 dans l'URL. FPS, draw calls, triangles, personnages dessinés / de loin.
import { onFrame, stats } from './rig.js';

export function perfHud(force = false) {
  if (!force && !new URLSearchParams(location.search).has('perf')) return null;
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'fixed', left: '8px', bottom: '8px', zIndex: 60, padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,.65)', color: '#9fe870', font: '12px ui-monospace, monospace', pointerEvents: 'none', whiteSpace: 'pre' });
  document.body.appendChild(el);
  let frames = 0, acc = 0, worst = 0;
  const data = { fps: 0, ms: 0, worstMs: 0, calls: 0, triangles: 0 };
  onFrame((dt, t, camera, renderer) => {
    frames++; acc += dt; worst = Math.max(worst, dt);
    if (acc < 0.5) return;
    const info = renderer?.info.render;
    Object.assign(data, { fps: Math.round(frames / acc), ms: +((acc / frames) * 1000).toFixed(1), worstMs: +(worst * 1000).toFixed(1), calls: info?.calls ?? 0, triangles: info?.triangles ?? 0 });
    el.textContent = `${data.fps} fps · ${data.ms} ms (pire ${data.worstMs})\n${data.calls} draw calls · ${(data.triangles / 1000).toFixed(0)}k triangles\npersos ${stats.drawn}/${stats.proxies} (${stats.far} de loin) · CPU art ${stats.hooksMs.toFixed(1)}+${stats.rigMs.toFixed(1)} ms`;
    frames = 0; acc = 0; worst = 0;
  });
  return data;
}
