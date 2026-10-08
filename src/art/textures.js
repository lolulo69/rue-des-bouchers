// Textures procédurales (canvas) : briques flamandes, pavés, enseignes peintes, store rayé.
import * as THREE from 'three';

// Aléatoire déterministe : la rue est la même à chaque partie
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasTexture(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

// Briques : hue/sat/lum de base. Joints clairs, quelques briques plus sombres (boutisses brûlées).
export function brickTex(hue = 10, sat = 48, lum = 44, seed = 3) {
  const r = seeded(seed);
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#e4d8c4'; g.fillRect(0, 0, w, h);
    const bh = 16, bw = 42;
    for (let y = 0; y < h; y += bh) {
      const off = (y / bh) % 2 ? bw / 2 : 0;
      for (let x = -bw; x < w + bw; x += bw) {
        const l = lum + (r() - 0.5) * 12 - (r() < 0.08 ? 10 : 0);
        g.fillStyle = `hsl(${hue + (r() - 0.5) * 8}, ${sat}%, ${l}%)`;
        g.beginPath(); g.roundRect(x + off + 2, y + 2, bw - 4, bh - 4, 3); g.fill();
      }
    }
  });
}

export function cobbleTex() {
  const r = seeded(7);
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#26252a'; g.fillRect(0, 0, w, h);
    const sw = 40, sh = 28;
    for (let y = 0; y < h; y += sh) {
      const off = (y / sh) % 2 ? sw / 2 : 0;
      for (let x = -sw; x < w + sw; x += sw) {
        const l = 33 + r() * 14;
        g.fillStyle = `hsl(${25 + r() * 20}, ${6 + r() * 6}%, ${l}%)`;
        const jx = (r() - 0.5) * 3, jy = (r() - 0.5) * 3;
        g.beginPath(); g.roundRect(x + off + 3 + jx, y + 3 + jy, sw - 6, sh - 6, 9); g.fill();
        g.fillStyle = 'rgba(255,240,220,0.08)';
        g.beginPath(); g.roundRect(x + off + 6 + jx, y + 5 + jy, sw - 16, 6, 3); g.fill();
      }
    }
  }, [2, 26]);
}

// Dalles de pierre bleue du caniveau central
export function slabTex() {
  const r = seeded(11);
  return canvasTexture(64, 256, (g, w, h) => {
    g.fillStyle = '#1d1e22'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = `hsl(215, 8%, ${36 + r() * 8}%)`;
      g.fillRect(3, y + 2, w - 6, 28);
    }
  }, [1, 22]);
}

// Enseigne peinte : lettres dorées ou crème sur bois coloré, filet décoratif
export function signTex(text, bg, fg = '#f6e7c1', { sub = '', faded = false } = {}) {
  return canvasTexture(1024, 160, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.globalAlpha = faded ? 0.45 : 1;
    g.lineWidth = 5; g.strokeRect(14, 14, w - 28, h - 28);
    g.lineWidth = 2; g.strokeRect(24, 24, w - 48, h - 48);
    g.fillStyle = fg;
    let size = sub ? 70 : 84;
    do g.font = `italic bold ${size}px Georgia, serif`; while (g.measureText(text).width > w - 90 && (size -= 4) > 30);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + (sub ? -12 : 4));
    if (sub) { g.font = '600 26px Georgia, serif'; g.fillText(sub, w / 2, h / 2 + 46); }
    if (faded) { // peinture écaillée
      g.globalAlpha = 1; g.fillStyle = bg;
      const r = seeded(5);
      for (let i = 0; i < 40; i++) g.fillRect(r() * w, r() * h, 10 + r() * 40, 4 + r() * 10);
    }
  });
}

export function panelTex(lines, bg = '#f4efe2', fg = '#b0232a', w = 512, h = 256) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(([t, size], i) => {
      g.font = `bold ${size}px Arial, sans-serif`;
      g.fillText(t, w / 2, h * (i + 1) / (lines.length + 1));
    });
  });
}

export function stripeTex(a, b, n = 8) {
  return canvasTexture(256, 64, (g, w, h) => {
    for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * w) / n, 0, w / n + 1, h); }
  });
}

export function puffTex() {
  return canvasTexture(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}

// Vitrine éclairée : salle chaude vue à travers la vitre (suspensions, comptoir, silhouettes de bouteilles et de chaises)
export function shopGlassTex() {
  const r = seeded(21);
  return canvasTexture(128, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffd99a'); grad.addColorStop(0.55, '#f0a050'); grad.addColorStop(1, '#7a3a18');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { // suspensions
      const x = 20 + i * 44;
      const rg = g.createRadialGradient(x, 22, 0, x, 22, 22);
      rg.addColorStop(0, 'rgba(255,250,220,1)'); rg.addColorStop(1, 'rgba(255,250,220,0)');
      g.fillStyle = rg; g.fillRect(x - 22, 0, 44, 44);
    }
    g.fillStyle = 'rgba(60,25,10,0.75)';
    g.fillRect(0, 74, w, 6); // étagère
    for (let x = 4; x < w - 4; x += 6 + r() * 6) g.fillRect(x, 60 - r() * 8, 3, 14 + r() * 8);
    g.fillStyle = 'rgba(50,20,8,0.85)';
    g.fillRect(0, 96, w, 32); // comptoir
    for (let i = 0; i < 4; i++) { const x = 10 + i * 32 + r() * 6; g.beginPath(); g.arc(x, 92, 9, Math.PI, 0); g.fill(); g.fillRect(x - 9, 92, 18, 4); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; // reflet
    g.beginPath(); g.moveTo(w * 0.15, 0); g.lineTo(w * 0.35, 0); g.lineTo(w * 0.05, h); g.lineTo(-w * 0.15, h); g.fill();
  });
}
