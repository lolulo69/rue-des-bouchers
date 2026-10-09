// Interface 2D des journées (GAME_DESIGN §3, §10, §13.A/D). Propriétaire : agent UI.
//
// Dans le jeu (main.js) :
//   mountDayUI({ campaign, root, content, onSave, onNight, onQuit, onNew }) → { show(), hide(), destroy() }
//   La campagne vient de main.js (créée avec narrative.js). onNight() part jouer la nuit 3D (rechargement de page).
// Jeu (main.js) et page autonome (ui.html) :
//   mount(engine?, { root, seed, onNight?, autoContinue? }) : écran titre + sauvegarde localStorage 'rdb.save.v1' ;
//   onNight(c, ui) part jouer la nuit 3D ; sans onNight, nuits simulées. autoContinue reprend la sauvegarde.
//
// Le moteur fournit la narration (c.tutorial, c.mediaFeed / c.readMedia, S.lastHeadline, S.endingMedia, c.introCards).
import './ui.css';
import * as narrative from '../sim/narrative.js';
import { createCampaign as defaultCreate, contentFromGlob } from '../sim/index.js';
import { NIGHT_END, KLAAS_NOTEBOOK } from '../content/night.js';
import { h, clear, portrait, nameOf, typewrite, effectChips, STAT_LABELS, setPortraitProvider } from './dom.js';
import { WEEKDAYS, WEEKDAYS_SHORT, PHASE_LABELS, LEGALITY, explain, afternoonMenu, upcomingEvent, eventDays, witnessName } from './rules.js';
import { phoneView, pullFeed, messageNode } from './phone.js';
import { phoneUnread, markPhoneSeen, carnetUnread, openCarnet } from './badges.js';
import { createVignette } from './vignette.js';
import { homography, toMatrix3d, quadSize } from './project.js';
import { carnetView, helpView, aboutView } from './codex.js';
// Indice manette d'une carte « Nouveau » : « RB » → glyphe de la manette en cours (RB/R1…)
const padHint = (t) => t.replace(/\b(LB|RB|LT|RT|A|B|X|Y)\b/g, (b) => padGlyph(b));
import { openMenu, isMenuOpen } from './menu.js';
import { applySettings } from './settings.js';
import { startPad, onInputMode, inputMode, padGlyph } from '../input/index.js';
import { startHints, keyHint } from '../input/hints.js';
export { openMenu } from './menu.js';

export const SAVE_KEY = 'rdb.save.v1';
export const UI_KEY = 'rdb.ui.v1';           // préférences d'affichage de l'UI (non-lus, répliques entendues, avant-nuit)
export const ENDINGS_KEY = 'rdb.endings.v1'; // fins découvertes, toutes campagnes confondues

const DEFAULT_CONTENT = contentFromGlob(import.meta.glob('../content/*.js', { eager: true }));

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible : on joue sans */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* idem */ } },
};

// Variables des lignes du carnet de Klaas (night.js) : jamais de {variable} laissée telle quelle
const klaasLine = (pool, day) => (pool?.length ? narrative.fill(pool[day % pool.length], { time: '01h00', n: 0 }) : null);

// ── Le titre du jeu (index.html #title, travelling 3D derrière) : un seul écran titre (QA v1.1) ─────────────────
// Remplace ses boutons « Campagne » / « Nuit libre » par le menu complet, en gardant leurs ids (#campaign, #start) :
//   #campaign déplie sur place « Continuer · jour N » (title-continue) et « Nouvelle campagne » (title-new, 2e clic pour
//   écraser une sauvegarde) ; #start lance la nuit libre ; « Comment jouer » et « À propos » ouvrent le menu.
// onNew() / onContinue() : le jeu monte l'interface de jour ; onFreeNight() : la soirée isolée.
export function titleMenu(titleEl, { engine = {}, onNew, onContinue, onFreeNight } = {}) {
  const create = engine.createCampaign ?? defaultCreate;
  const content = engine.content ?? DEFAULT_CONTENT;
  const old = [titleEl.querySelector('#campaign'), titleEl.querySelector('#start')].filter(Boolean);
  const anchor = old[0];
  const saved = store.get(SAVE_KEY);
  let existing = null;
  if (saved) { try { existing = create({ content, save: saved }); } catch { existing = null; } }
  if (existing?.ended) existing = null;
  const sub = h('div.ui-title-sub.hidden', { dataset: { testid: 'title-campaign' } });
  if (existing) {
    sub.append(h('button.ui-btn', { dataset: { testid: 'title-continue' }, onclick: () => onContinue?.() },
      `Continuer · jour ${existing.state.day}/14, ${WEEKDAYS[existing.weekday()]}`));
  }
  const newBtn = h('button.ui-btn' + (existing ? '.ghost' : ''), { dataset: { testid: 'title-new' } }, 'Nouvelle campagne');
  newBtn.onclick = () => {
    if (saved && !newBtn.dataset.armed) { newBtn.dataset.armed = '1'; newBtn.textContent = 'Écraser la sauvegarde ? Cliquez encore'; return; }
    onNew?.();
  };
  sub.append(newBtn);
  const campaignBtn = h('button#campaign', { 'aria-expanded': 'false' }, 'Campagne (14 jours)');
  campaignBtn.onclick = () => {
    const open = sub.classList.toggle('hidden') === false;
    campaignBtn.setAttribute('aria-expanded', String(open));
    if (open) (sub.querySelector('[data-testid=title-continue]') ?? newBtn).focus();
  };
  const menu = h('div.ui-title-menu', { dataset: { testid: 'title-menu' } },
    campaignBtn, sub,
    h('button#start', { onclick: () => onFreeNight?.() }, 'Nuit libre (une soirée isolée)'),
    h('div.ui-title-links',
      h('button', { dataset: { testid: 'title-help' }, onclick: () => openMenu({ page: 'help' }) }, '❓ Comment jouer'),
      h('button', { dataset: { testid: 'title-about' }, onclick: () => openMenu({ page: 'about' }) }, 'À propos')));
  if (anchor) anchor.replaceWith(menu); else titleEl.append(menu);
  for (const b of old.slice(1)) b.remove();
  startPad();
  startHints();
  return menu;
}

export function mountDayUI({ campaign, root, content, onSave, onNight, onQuit, onNew } = {}) {
  const ui = mount({ content }, { campaign, root, onSave, onNight, onQuit, onNew, deferRender: true });
  return { show: ui.show, hide: ui.hide, destroy: ui.destroy, render: ui.render };
}

export function mount(engine = {}, opts = {}) {
  const create = engine.createCampaign ?? defaultCreate;
  const content = engine.content ?? DEFAULT_CONTENT;
  if (opts.portrait) setPortraitProvider(opts.portrait);
  let root = opts.root ?? document.getElementById('ui-root');
  if (!root) { root = h('div#ui-root'); document.body.append(root); }
  root.classList.add('ui-root');
  const layer = h('div.ui-layer');
  const vignette = createVignette(root);
  root.append(layer);

  let c = opts.campaign ?? null;
  let meta = loadMeta();
  let view = {};
  let phone = { open: false, tab: 'whatsapp' };
  let panel = null; // 'carnet' | 'help' | 'about' (U10)
  let carnetTab = 'characters';
  let typing = null;
  let visible = false;

  function loadMeta() {
    const m = store.get(UI_KEY) ?? {};
    return { opened: [], overheard: [], dialogueAt: '', pulledAt: '', preNight: null, introSeen: false, workDone: [], ...m };
  }
  const saveMeta = () => store.set(UI_KEY, meta);
  const save = () => {
    if (!c) return;
    if (opts.onSave) opts.onSave(); else store.set(SAVE_KEY, c.save());
    saveMeta();
  };
  const statsSnap = () => ({ ...c.state.stats });
  const deltas = (before) => Object.fromEntries(Object.keys(STAT_LABELS).map((k) => [k, Math.round(c.state.stats[k] - before[k])]));
  // Partie neuve (intro à montrer) : jour 1, matin, aucun événement joué ni prompt donné. Pas de test sur les dialogues :
  // le moteur v1.1 en marque un comme vu dès le départ (call_background), et l'intro disparaissait.
  const fresh = () => c.state.day === 1 && c.state.phase === 'morning' && !c.state.seen.events.length && !c.state.koddexDone && !c.state.seen.actions.length;

  // ── campagne (page autonome) ────────────────────────────────────────
  function loadSave() {
    const s = store.get(SAVE_KEY);
    if (!s) return null;
    try { return create({ content, save: s, narrative }); } catch { return null; } // version incompatible → nouvelle
  }
  function newCampaign(seed = opts.seed ?? (Date.now() % 2147483646) + 1) {
    if (opts.onNew && opts.campaign) return opts.onNew();
    c = create({ seed, content, narrative });
    meta = { ...loadMeta(), opened: [], overheard: [], dialogueAt: '', pulledAt: '', preNight: null, introSeen: false, workDone: [] };
    view = {};
    save();
    render();
    return c;
  }
  function continueCampaign() {
    c = loadSave();
    if (!c) return null;
    view = {};
    render();
    return c;
  }
  function recordEnding() {
    const found = new Set(store.get(ENDINGS_KEY) ?? []);
    if (c?.state.ending?.id) found.add(c.state.ending.id);
    store.set(ENDINGS_KEY, [...found]);
  }
  const afterEngine = () => { save(); if (c.step === 'ended') recordEnding(); };
  // Étape affichée : le bilan de la matinée Koddex reste à l'écran jusqu'à « Quitter Koddex » (BUG-002),
  // même si le moteur est déjà passé à l'après-midi.
  // BUG-002 : le bilan Koddex reste affiché ; BUG-004 : le résultat de la dernière carte d'une phase aussi
  // BUG-007 : le résultat d'une carte passe avant la fin (le verdict de la commission du J14 termine la campagne)
  const shown = () => (view.cardResult ? 'cards' : c.step === 'ended' ? c.step : view.k?.done && !view.k.left ? 'koddex' : c.step);

  // ── tutoriel (déclencheurs de jour) ────────────────────────────────
  function tutorial(trigger) {
    const t = typeof c.tutorial === 'function' ? c.tutorial(trigger) : null;
    if (!t) return null;
    save();
    return h('div.ui-card.ui-tip', { dataset: { testid: 'tutorial' } }, h('span.ui-kicker', 'Astuce'), h('p', t.text));
  }

  // ── vignette selon l'écran ─────────────────────────────────────────
  // Bureau ou télétravail (§12b D) : le moteur le dit (c.workPlace()), sinon bureau
  // moteur v1.1 : c.state.workplace ('office' | 'home') ; accepte aussi une fonction (c.workplace / c.workPlace)
  const workPlace = () => (c ? (c.workplace?.() ?? c.workPlace?.() ?? c.state.workplace ?? null) : null);
  const deskScene = () => (workPlace() === 'home' ? 'home' : 'koddex');
  function sceneFor() {
    if (!c) return null;
    if (shown() === 'koddex') return deskScene();
    if (c.step === 'ended') return 'ending';
    if (c.state.day === 14 && c.state.phase !== 'morning') return 'mairie';
    if (c.state.phase === 'morning') return deskScene();
    // L'après-midi : la rue de jour ; une réunion à l'atelier, une démarche à la mairie (le temps du résultat)
    if (c.step === 'actions' || c.state.phase === 'afternoon') return view.result?.scene ?? 'street';
    return null;
  }

  // ── rendu ───────────────────────────────────────────────────────────
  // U4 : une seule boîte de dialogue par transition. Les cartes de dialogue suivantes de la même phase sont
  // « entendues en passant » (rangées dans le téléphone) et résolues AVANT le rendu, pour que l'étape affichée soit juste.
  function settleDialogues() {
    if (!c || view.result || shown() !== c.step) return;
    const at = `${c.state.day}:${c.state.phase}`;
    let moved = false;
    // (borné : un moteur qui renverrait la même carte ne doit jamais figer la page)
    for (let n = 0, card = c.step === 'cards' ? c.card() : null; n < 30 && card && card.type === 'dialogue' && meta.dialogueAt === at; n++, card = c.step === 'cards' ? c.card() : null) {
      meta.overheard.push({ id: `overheard:${card.id}:${c.state.day}`, speaker: card.data.speaker, text: (card.data.lines ?? []).join(' '), day: c.state.day });
      if (meta.overheard.length > 120) meta.overheard.shift();
      c.resolveCard(0);
      moved = true;
    }
    if (moved) afterEngine();
  }

  function render() {
    if (typing) { typing.skip?.(); typing = null; }
    clear(layer);
    settleDialogues();
    root.dataset.step = c ? shown() : 'title';
    if (!c && opts.onTitle && !panel) { vignette.set(null); return; } // dans le jeu : le titre est le titre 3D (#title)
    if (!c) {
      vignette.set(null);
      layer.append(panel === 'help' || panel === 'about' ? h('div.ui-wrap', panelView()) : titleScreen());
      return focusPrimary();
    }
    if (fresh() && !meta.introSeen && introCards().length) { vignette.set('koddex'); layer.append(introScreen()); return focusPrimary(); }
    // Nouveaux messages : relevés une fois par phase (le moteur applique leurs effets)
    const at = `${c.state.day}:${c.state.phase}`;
    if (c.step !== 'ended' && meta.pulledAt !== at) {
      meta.pulledAt = at;
      const got = pullFeed(c);
      view.notif = got.length ? got : view.notif;
      save();
    }
    vignette.set(sceneFor(), sceneFor() === 'ending' ? { id: c.state.ending?.id, flags: [...c.state.flags] } : undefined);
    root.dataset.scene = sceneFor() ?? 'none';
    const wrap = h('div.ui-wrap');
    if (c.step !== 'ended') wrap.append(header());
    if (phone.open) {
      wrap.append(phoneView(c, meta, { tab: phone.tab, seenBefore: phoneBefore, onTab: (t) => { phone.tab = t; render(); }, onClose: closePhone }));
      saveMeta();
    } else if (panel) {
      wrap.append(panelView());
      saveMeta();
    } else {
      const notif = notification();
      if (notif) wrap.append(notif);
      wrap.append(...[].concat(screen()).filter(Boolean));
    }
    layer.append(wrap);
    root.scrollTop = 0;
    placeMonitor();
    focusPrimary();
  }
  // v1.1 : le terminal Koddex posé sur le moniteur de la scène 3D (homographie CSS, recalée à chaque image).
  // Repli : la mise en page 2D si pas de scène de jour, qualité « Bas », ou écran trop petit pour être lisible.
  const MON_W = 560; // taille de conception : une échelle proche de 1 sur le moniteur (texte ≥ 11 px)
  const MON_H = 350;
  // Stabilité : la caméra assise « respire » ; on ne recale le terminal que si un coin a bougé de plus de 4 px
  // (coordonnées arrondies au pixel), sinon il tremblerait sous le curseur (et un clic ne trouverait jamais sa cible).
  let lastQuad = null;
  const moved = (a, b) => !a || !b || a.some((p, i) => Math.abs(p.x - b[i].x) > 4 || Math.abs(p.y - b[i].y) > 4);
  function placeMonitor() {
    const mon = layer.querySelector('.ui-monitor');
    lastQuad = null;
    const fit = () => {
      const raw = mon?.isConnected ? vignette.screenQuad() : null;
      const q = raw && raw.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
      const sz = q && quadSize(q);
      const ok = q && sz.w >= 420 && sz.h >= 240;
      root.classList.toggle('on-monitor', !!ok);
      if (!mon) return;
      if (!ok) { lastQuad = null; mon.style.transform = ''; return; }
      if (!moved(q, lastQuad)) return;
      lastQuad = q;
      const H = homography(MON_W, MON_H, q);
      mon.style.transform = H ? toMatrix3d(H) : '';
    };
    vignette.onFrame(mon ? fit : null);
    fit();
  }
  // Accessibilité : si le focus s'est perdu (l'élément a disparu au rendu), on le pose sur l'action principale.
  const PRIMARY = ['[data-testid=result-next]', '[data-testid=intro-next]', '[data-testid=commute-next]', '[data-testid=card-choice]:not([disabled])', '[data-testid=koddex-done]',
    '[data-testid=koddex-option]:not([disabled])', '[data-testid=night-go]', '[data-testid=recap-next]', '[data-testid=end-continue]', '[data-testid=end-new]',
    '[data-testid=title-continue]', '[data-testid=title-new]', '[data-testid=action]:not([disabled])', '[data-testid=phone-close]', '[data-testid=carnet-close]',
    '[data-testid=help-close]', '[data-testid=about-close]'];
  function focusPrimary(force = false) {
    if (!visible || isMenuOpen()) return;
    const a = document.activeElement;
    if (!force && a && a !== document.body && layer.contains(a)) return;
    for (const sel of PRIMARY) { const el = layer.querySelector(sel); if (el) { el.focus({ preventScroll: true }); return; } }
  }
  const introCards = () => (typeof c?.introCards === 'function' ? c.introCards() : narrative.introCards()) ?? [];
  // Ouvrir le téléphone / le Carnet efface leurs pastilles (§12c.3) : tout ce qui y est devient « vu » (sauvegardé)
  let phoneBefore = new Set();
  let carnetBefore = new Set();
  function openPhone(tab) {
    panel = null; phone = { open: true, tab: tab ?? phone.tab }; view.notif = null;
    phoneBefore = new Set(c.state.uiSeen?.phone ?? []);
    markPhoneSeen(c, meta); save(); render();
  }
  function openPanel(name) {
    phone.open = false; panel = name;
    if (name === 'carnet' && c) { carnetBefore = openCarnet(c); save(); }
    render();
  }
  function closePanel() { panel = null; render(); }
  function panelView() {
    if (panel === 'carnet' && c) return carnetView(c, meta, { tab: carnetTab, seenBefore: carnetBefore, onTab: (t) => { carnetTab = t; render(); }, onClose: closePanel });
    if (panel === 'help') return helpView({ onClose: closePanel, campaign: c });
    return aboutView({ onClose: closePanel });
  }
  function closePhone() { phone.open = false; render(); }

  function screen() {
    switch (shown()) {
      case 'cards': return cardScreen();
      case 'koddex': return koddexScreen();
      case 'actions': return actionsScreen();
      case 'night': return nightScreen();
      case 'recap': return recapScreen();
      case 'ended': return endScreen();
      default: return h('div.ui-card', h('p', `Étape inconnue : ${c.step}`));
    }
  }

  // ── notification du téléphone (entre deux phases) ─────────────────
  function notification() {
    const unread = phoneUnread(c, meta);
    if (!unread.length || c.step === 'recap' || c.step === 'ended') return null;
    // Le matin : les messages de la nuit sur le groupe, en aperçu
    const preview = unread.filter((m) => m.channel === 'whatsapp').slice(-2);
    return h('div.ui-notif', { dataset: { testid: 'phone-notif' } },
      h('div.ui-notif-head', h('b', `📱 ${unread.length} nouveau${unread.length > 1 ? 'x' : ''} message${unread.length > 1 ? 's' : ''}`),
        c.state.phase === 'morning' ? h('span', ' · cette nuit sur le groupe') : null),
      c.state.phase === 'morning' && preview.length ? h('div.ui-feed.mini', preview.map(messageNode)) : null,
      h('button.ui-btn.light', { onclick: () => openPhone(unread.at(-1).channel), dataset: { testid: 'phone-notif-open' } }, `Lire (${keyHint('T')})`));
  }

  // ── écran titre (page autonome) ────────────────────────────────────
  function titleScreen() {
    const existing = store.get(SAVE_KEY) ? loadSave() : null;
    const found = new Set(store.get(ENDINGS_KEY) ?? []);
    const col = h('div.ui-col');
    if (existing) {
      col.append(h('button.ui-btn', { onclick: continueCampaign, dataset: { testid: 'title-continue' } },
        `Continuer · jour ${existing.state.day}/14, ${WEEKDAYS[existing.weekday()]}`));
    } else if (store.get(SAVE_KEY)) {
      col.append(h('p.note', 'Votre sauvegarde vient d’une ancienne version du jeu : il faut recommencer.'));
    }
    const newBtn = h('button.ui-btn' + (existing ? '.ghost' : ''), { dataset: { testid: 'title-new' } }, 'Nouvelle campagne');
    newBtn.onclick = () => {
      if (existing && !newBtn.dataset.armed) { newBtn.dataset.armed = '1'; newBtn.textContent = 'Écraser la sauvegarde ? Cliquez encore'; return; }
      newCampaign();
    };
    col.append(newBtn);
    col.append(h('div.ui-row.ui-title-links',
      h('button.ui-btn.ghost', { onclick: () => openPanel('help'), dataset: { testid: 'title-help' } }, '❓ Comment jouer'),
      h('button.ui-btn.ghost', { onclick: () => openPanel('about'), dataset: { testid: 'title-about' } }, 'À propos')));
    return h('div.ui-title', h('div',
      h('h1', 'Rue des Bouchers'),
      h('p.sub', "Vieux-Lille. Quatorze jours avant la commission des terrasses. Pilou habite au-dessus de l’estaminet, la gaine souffle sous sa fenêtre, et les terrasses doivent rentrer à 22h. En théorie."),
      col,
      found.size ? endingsGrid(found, null) : null,
      h('p.note', 'Œuvre de fiction. La rue existe ; les personnages, commerces, policiers et élus sont inventés.')));
  }

  // ── intro (une fois, avant la première matinée) ─────────────────────
  function introScreen() {
    const cards = introCards();
    const i = Math.min(view.intro ?? 0, cards.length - 1);
    const card = cards[i];
    const done = () => { meta.introSeen = true; saveMeta(); view = {}; render(); };
    const next = () => { if (i + 1 >= cards.length) done(); else { view.intro = i + 1; render(); } };
    return h('div.ui-wrap.ui-intro', h('div.ui-card', { dataset: { testid: 'intro' } },
      h('div.ui-dots', cards.map((_, k) => h(`i${k === i ? '.on' : ''}`))),
      card.speaker ? h('div.ui-dialogue', portrait(card.speaker, 'neutral', 'lg'), h('h2', card.title)) : h('h2', card.title),
      h('p.ui-lead', card.text),
      h('div.ui-row',
        h('button.ui-btn', { onclick: next, dataset: { testid: 'intro-next' } }, i + 1 >= cards.length ? 'Commencer la journée' : 'Suivant'),
        h('button.ui-btn.light', { onclick: done, dataset: { testid: 'intro-skip' } }, 'Passer l’intro'))));
  }

  // ── en-tête ─────────────────────────────────────────────────────────
  function header() {
    const S = c.state;
    const evDays = eventDays(c);
    const up = upcomingEvent(c);
    const unread = phoneUnread(c, meta).length;
    const news = carnetUnread(c).length;
    const stats = Object.entries(STAT_LABELS).map(([k, label]) => h(`div.ui-stat${k === 'risk' ? '.danger' : ''}`, { dataset: { stat: k } },
      `${label} ${Math.round(S.stats[k])}`, h('i', h('b', { style: { width: `${S.stats[k]}%` } }))));
    return h('header.ui-header', { dataset: { testid: 'day-header', day: S.day, step: shown() } },
      h('div.ui-header-top',
        h('h1.ui-day', `Jour ${S.day}/14`, h('small', `${WEEKDAYS[c.weekday()]}${c.isSaturday() ? ' · sans voitures' : ''}`),
          workPlace() && S.phase === 'morning' ? h('small.ui-workplace', { dataset: { testid: 'workplace', place: workPlace() } }, workPlace() === 'home' ? ' · 🏠 Télétravail' : ' · 🏢 Bureau') : null),
        h('div.ui-row',
          h('div.ui-phase', ['morning', 'afternoon', 'night'].map((p) => h(`span${p === S.phase ? '.on' : ''}`, PHASE_LABELS[p]))),
          h('button.ui-btn.ghost.ui-icon', { onclick: () => (phone.open ? closePhone() : openPhone()), dataset: { testid: 'phone-open', unread }, 'aria-label': `Téléphone (${keyHint('T')})`, title: `Téléphone (${keyHint('T')})` },
            '📱', unread ? h('span.ui-badge', unread) : null),
          h('button.ui-btn.ghost.ui-icon', { onclick: () => (panel === 'carnet' ? closePanel() : openPanel('carnet')), dataset: { testid: 'carnet-open' }, 'aria-label': `Carnet (${keyHint('C')})`, title: `Carnet (${keyHint('C')})` },
            '📓', news ? h('span.ui-badge', news) : null),
          h('button.ui-btn.ghost.ui-icon', { onclick: () => (panel === 'help' ? closePanel() : openPanel('help')), dataset: { testid: 'help-open' }, 'aria-label': 'Comment jouer', title: 'Comment jouer' }, '❓'),
          h('button.ui-btn.ghost.ui-icon', { onclick: () => showMenu(), dataset: { testid: 'menu-open' }, 'aria-label': `Menu et réglages (${keyHint('Échap')})`, title: `Menu (${keyHint('Échap')})` }, '☰'))),
      h('div.ui-cal', Array.from({ length: 14 }, (_, k) => h(`i${k + 1 < S.day ? '.done' : ''}${k + 1 === S.day ? '.now' : ''}${evDays.has(k + 1) ? '.ev' : ''}`, { title: `Jour ${k + 1}` }))),
      up ? h('div.ui-upcoming', up.day === S.day ? 'Aujourd’hui : ' : `Jour ${up.day} (${WEEKDAYS_SHORT[c.weekday(up.day)]}) : `, h('b', up.title)) : null,
      h('div.ui-stats', stats));
  }

  // ── cartes (événements, dialogues, contre-offensives, infos) ──────
  // U4 : une seule boîte de dialogue par transition de phase. Les répliques suivantes sont « entendues en passant »
  // (rangées dans le téléphone) ; deux cartes consécutives du même personnage sont fusionnées dans la même boîte.
  function cardScreen() {
    if (view.result) return resultCard(view.result, () => { view = {}; render(); });
    const card = c.card();
    if (!card) return h('div.ui-card', h('p', '…'));
    const d = card.data ?? card;
    const speaker = d.speaker;
    // « Nouveau » : une carte info du moteur avec une charge `unlock` (ou un futur type 'unlock')
    // (moteur v1.1 : `unlock` = l'id de l'outil, title/text/hint au premier niveau ; accepte aussi un objet)
    if (card.unlock || card.type === 'unlock') return unlockCard(card, typeof card.unlock === 'object' ? card.unlock : (card.data ?? card));
    const kicker = card.workday === 'commute' ? '🚲 Le trajet' : card.workday === 'office' ? '🏢 Chez Koddex' : card.workday ? '🏠 À la maison'
      : { event: typeof d.day === 'number' ? 'Événement' : 'Imprévu', dialogue: 'Conversation', countermove: 'Le bloc contre-attaque', info: 'Nouvelles' }[card.type];
    const body = h(`div.ui-card.ui-card-${card.type}`, { dataset: { testid: 'card', type: card.type, id: card.id } }, h('span.ui-kicker', kicker));
    let merged = 0;
    if (card.type === 'dialogue') {
      const lines = [...(d.lines ?? [])];
      // fusionne les cartes suivantes du même personnage
      for (const next of c.state.cards.slice(1)) {
        if (next.type !== 'dialogue') break;
        const nd = c.content.DIALOGUE.find((x) => x.id === next.id);
        if (!nd || nd.speaker !== speaker) break;
        lines.push(...(nd.lines ?? []));
        merged++;
      }
      body.append(h('div.ui-dialogue', portrait(speaker, 'happy', 'lg'),
        h('div.ui-bubble', h('span.who', nameOf(speaker)), lines.map((l) => h('p', l)))));
    } else {
      const expr = card.type === 'countermove' ? 'suspicious' : 'neutral';
      body.append(speaker ? h('div.ui-dialogue', portrait(speaker, expr, 'lg'), h('h2', d.title ?? nameOf(speaker))) : h('h2', d.title ?? ''));
      if (d.text) body.append(h('p.ui-lead', d.text));
      if (card.scene?.length) body.append(h('div.ui-scene', card.scene.map((s) => h('div.ui-dialogue', portrait(s.speaker, 'neutral', 'sm'), h('div.ui-bubble', h('span.who', s.name ?? nameOf(s.speaker)), s.text)))));
    }
    const choices = h('div.ui-col');
    for (const ch of card.choices) {
      const src = d.choices?.[ch.i];
      const why = ch.available ? [] : explain(src?.requires, c);
      choices.append(h('button.ui-action.ui-choice', {
        disabled: !ch.available, dataset: { testid: 'card-choice', i: ch.i },
        onclick: () => choose(card, ch.i, merged),
      }, h('span.lbl', ch.label === 'OK' ? 'Continuer' : ch.label), why.length ? h('span.why', why.join(' · ')) : null));
    }
    body.append(choices);
    return body;
  }
  // « Nouveau : … » (src/sim/unlocks.js) : l'outil débloqué et comment s'en servir, au clavier ou à la manette
  function unlockCard(card, u) {
    const [kbd, pad] = String(u.hint ?? '').split(/\s*\/\s*/);
    const hint = inputMode().mode === 'pad' ? (pad ? padHint(pad) : kbd) : kbd;
    return h('div.ui-card.ui-card-unlock', { dataset: { testid: 'card', type: 'unlock', id: card.id } },
      h('span.ui-kicker', '✨ Nouveau'),
      h('h2', u.title ?? 'Nouvel outil'),
      u.text ? h('p.ui-lead', u.text) : null,
      hint ? h('p.ui-unlock-hint', { dataset: { testid: 'unlock-hint' } }, 'Touche : ', h('kbd', hint)) : null,
      h('button.ui-action.ui-choice', { dataset: { testid: 'card-choice', i: 0 }, onclick: () => choose(card, 0) }, h('span.lbl', 'Compris')));
  }
  function choose(card, i, merged = 0) {
    const before = statsSnap();
    const d = card.data ?? card;
    if (card.type === 'dialogue') meta.dialogueAt = `${c.state.day}:${c.state.phase}`;
    const result = c.resolveCard(i);
    for (let k = 0; k < merged && c.step === 'cards' && c.card()?.type === 'dialogue'; k++) c.resolveCard(0);
    afterEngine();
    const dl = deltas(before);
    view = result || Object.values(dl).some(Boolean) ? { result: { title: d.title ?? nameOf(d.speaker), text: result, deltas: dl }, cardResult: true } : {};
    render();
  }
  function resultCard(r, onNext, extra = null) {
    return h('div.ui-card', { dataset: { testid: 'result' } },
      r.title ? h('h2', r.title) : null,
      r.text ? h('p.ui-result', r.text) : null,
      extra,
      effectChips(r.deltas),
      h('button.ui-btn.center', { onclick: onNext, dataset: { testid: 'result-next' } }, 'Continuer'));
  }

  // ── matin : Koddex (terminal Clode Kode, prompts en cartes) ───────
  function koddexScreen() {
    const S = c.state;
    if (!view.k || view.k.day !== S.day) {
      const o = c.koddexOptions(); // une seule fois par matinée (le gag est tiré au sort)
      view.k = { day: S.day, opts: o, picks: [], usedWork: [], log: [], done: false, tuto: tutorial('morning_start') };
      if (o.gag) for (const l of o.gag.lines ?? []) view.k.log.push(termLine(o.gag.speaker, l));
    }
    const k = view.k;
    // Jour de bureau : le trajet en vélo électrique, une petite scène qu'on peut passer (§12b D)
    // (le moteur v1.1 pousse déjà sa carte « trajet » dans la file du matin : celle-ci ne sert que si c.commuteBeat existe)
    if (typeof c.commuteBeat === 'function' && workPlace() === 'office' && meta.commuteDay !== S.day && !k.picks.length && !k.done) return commuteCard();
    const term = h('div.ui-term-body');
    const termBox = h('div.ui-term', { dataset: { testid: 'terminal' }, onclick: () => { skipAll = true; typing?.skip?.(); } },
      h('div.ui-term-bar', h('i'), h('i'), h('i'), h('span', 'clode-kode — koddex/todo-app (main)')), term);
    const menu = h('div.ui-col', { dataset: { testid: 'koddex-menu' } });
    if (!k.done) {
      menu.append(h('div.ui-prompts', 'Prompts restants : ', Array.from({ length: k.opts.prompts }, (_, i) => h(`i${i < k.picks.length ? '.used' : ''}`))));
      // U1 : trois vrais travaux différents proposés, jamais deux fois le même dans la matinée
      const grid = h('div.ui-prompt-grid');
      for (const w of workChoices(k).slice(0, 2)) {
        grid.append(promptCard({ id: 'work', item: w, label: w.label, tag: 'Vrai travail', hint: 'Job +', legality: 'legal' }));
      }
      for (const p of k.opts.sideProjects) {
        if (!p.available || k.picks.includes(p.id)) continue;
        grid.append(promptCard({ id: p.id, item: p, label: p.label, tag: `Projet perso · ${LEGALITY[p.legality ?? 'legal'].label}`,
          hint: `Job ${p.job ?? -10}${p.risk ? ` · Risque +${p.risk} si Stéphane remarque` : ''}`, legality: p.legality ?? 'legal' }));
      }
      menu.append(grid);
    } else {
      menu.append(h('button.ui-btn.center', { dataset: { testid: 'koddex-done' }, onclick: () => { view = { k: { ...view.k, left: true } }; render(); } }, 'Quitter Koddex (direction la rue)'));
    }
    const freshLines = [];
    for (const line of k.log) {
      const node = h(`div.ui-term-line.${line.cls}`);
      term.append(node);
      if (line.fresh) { freshLines.push([node, line.text]); line.fresh = false; } else node.textContent = line.text;
    }
    queueMicrotask(() => typeAll(freshLines, term, menu));
    return [k.tuto, h('div.ui-monitor', { dataset: { testid: 'monitor' } }, termBox, menu)];
  }
  function commuteCard() {
    const beat = typeof c.commuteBeat === 'function' ? c.commuteBeat() : null;
    const go = () => { meta.commuteDay = c.state.day; saveMeta(); render(); };
    return h('div.ui-card.ui-commute', { dataset: { testid: 'commute' } },
      h('span.ui-kicker', '🚲 Le trajet'),
      h('h2', beat?.title ?? 'En vélo électrique jusqu’à Koddex'),
      h('p.ui-lead', beat?.text ?? 'Les pavés de la rue des Bouchers secouent la batterie, Biloute aboie au passage, et la rue de la Barre descend toute seule. Dix minutes plus tard : le badge, l’ascenseur, l’open space.'),
      h('div.ui-row',
        h('button.ui-btn', { onclick: go, dataset: { testid: 'commute-next' } }, 'Arriver au bureau'),
        h('button.ui-btn.light', { onclick: go, dataset: { testid: 'commute-skip' } }, 'Passer')));
  }
  function promptCard({ id, item, label, tag, hint, legality }) {
    return h(`button.ui-prompt.${legality}`, { dataset: { testid: 'koddex-option', id, work: id === 'work' ? item.id : undefined }, onclick: () => pick(id, item) },
      h('span.ui-prompt-tag', tag), h('span.lbl', label), h('span.why', hint));
  }
  function termLine(speaker, text) {
    if (speaker === 'clode') return { cls: 'clode', text, fresh: true };
    if (speaker === 'pilou') return { cls: 'me', text, fresh: true };
    return { cls: 'sys', text: `${nameOf(speaker)} : ${text}`, fresh: true };
  }
  function workChoices(k) {
    const ok = (k.opts.work ?? []).filter((w) => c.check(w.requires, false) && !(w.once && meta.workDone.includes(w.id)) && !k.usedWork.includes(w.id));
    if (!ok.length) return [{ id: 'backlog', label: 'Vider le backlog de Stéphane', result: 'Clode Kode a vidé le backlog. Stéphane a mis un emoji 🚀.' }];
    const start = (c.state.day * 7) % ok.length;
    return [...ok.slice(start), ...ok.slice(0, start)];
  }
  let skipAll = false;
  async function typeAll(list, term, menu) {
    if (!list.length) return;
    skipAll = false;
    menu.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    for (const [node, text] of list) {
      if (skipAll) { node.textContent = text; continue; }
      typing = typewrite(node, text, { cps: 90 });
      await typing;
      term.scrollTop = term.scrollHeight;
    }
    term.scrollTop = term.scrollHeight;
    typing = null;
    menu.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    focusPrimary();
  }
  function pick(id, item) {
    const k = view.k;
    if (k.done || k.picks.length >= k.opts.prompts) return;
    if (k.picks.length === 0) k.tuto = tutorial('first_prompt');
    k.picks.push(id);
    k.log.push({ cls: 'me', text: item.label, fresh: true });
    if (id === 'work') {
      k.usedWork.push(item.id);
      if (item.once) meta.workDone.push(item.id);
      k.log.push({ cls: 'clode', text: item.result ?? 'Fait. Avec toutes mes excuses pour le retard de 0,2 seconde.', fresh: true });
    } else {
      for (const l of item.lines ?? []) k.log.push(termLine(l.speaker, l.text));
    }
    if (k.picks.length >= k.opts.prompts) {
      const before = statsSnap();
      c.koddex(k.picks);
      for (const pid of k.picks) {
        const p = k.opts.sideProjects.find((x) => x.id === pid);
        if (p?.result) k.log.push({ cls: 'sys', text: `✔ Livré : ${p.result}`, fresh: true });
      }
      const dl = deltas(before);
      k.log.push({ cls: 'sys', text: `— Fin de matinée. Job ${dl.job >= 0 ? '+' : ''}${dl.job}${dl.risk ? `, Risque +${dl.risk} (Stéphane a remarqué quelque chose)` : ''}.`, fresh: true });
      k.done = true;
      afterEngine();
    }
    render();
  }

  // ── après-midi : menu d'actions ────────────────────────────────────
  function actionsScreen() {
    const S = c.state;
    if (view.result) return resultCard(view.result, () => { view = { tutoShown: true }; render(); }, view.result.extra);
    const tuto = view.tutoShown ? null : tutorial('afternoon_start');
    view.tutoShown = true;
    const menu = afternoonMenu(c);
    const groups = ['legal', 'grey', 'illegal'].map((lg) => {
      const items = menu.filter((m) => (m.action.legality ?? 'legal') === lg);
      if (!items.length) return null;
      items.sort((a, b) => Number(b.available) - Number(a.available));
      return h(`section.ui-group.${lg}`, { dataset: { testid: `group-${lg}` } },
        h('h3', LEGALITY[lg].label, h('small', ` · ${LEGALITY[lg].hint}`)),
        items.map(({ action: a, cost, available, why }) => h('button.ui-action', {
          disabled: !available, dataset: { testid: 'action', id: a.id }, onclick: () => doAction(a),
        }, h('span.lbl', a.label), h('span.cost', '⏱'.repeat(cost), ` ${cost} créneau${cost > 1 ? 'x' : ''}`),
        available ? hintOf(a) : h('span.why', why[0]?.startsWith('💬') ? null : '🔒 ', why.map((w) => w.replace(/\(([ETPNBLC])\)/g, (_, k) => `(${keyHint(k)})`)).join(' · ')))));
    });
    // v1.1 : le carnet de l'après-midi, posé sur la rue de jour (panneau à droite sur grand écran)
    return h('div.ui-notebook-panel', { dataset: { testid: 'notebook' } },
      h('div.ui-notebook-head', h('b', '📒 Carnet de l’après-midi'), h('span', `${WEEKDAYS[c.weekday()]} · jour ${S.day}`)),
      tuto,
      h('div.ui-slots', { dataset: { testid: 'slots', left: S.timeLeft } }, 'Temps libre cet après-midi : ',
        Array.from({ length: Math.max(S.timeLeft, 0) }, () => h('i')), S.timeLeft ? null : ' plus rien'),
      ...groups,
      h('button.ui-btn.center', { dataset: { testid: 'action-end' }, onclick: () => { c.endAfternoon(); afterEngine(); view = {}; render(); } },
        S.timeLeft ? 'Laisser tomber et attendre le soir' : 'Le soir tombe… (vers la nuit)'));
  }
  // Où se passe une action de l'après-midi (scène 3D du résultat) : l'atelier d'Hippolyte ou la mairie
  const ATELIER = /asso_meeting|hippolyte|heritage|recruit|banners|petition_start/;
  const MAIRIE = /mairie|delandre|aot|uritrottoir|petition_deliver|inspector|ars|hygiene|inquiry/;
  const sceneOfAction = (id) => (ATELIER.test(id) ? 'atelier' : MAIRIE.test(id) ? 'mairie' : null);
  // Indice d'effets (sans tout dévoiler) : ce que l'action fait bouger, et le risque d'être vu
  function hintOf(a) {
    const e = a.effects ?? {};
    const parts = Object.entries(STAT_LABELS).filter(([k]) => e[k] && k !== 'risk').map(([k, l]) => `${l} ${e[k] > 0 ? '▲' : '▼'}`);
    if (e.evidence) parts.push('Pièce au dossier');
    if (a.legality !== 'legal') parts.push('👁 peut se savoir');
    return parts.length ? h('span.why.hint', parts.join(' · ')) : null;
  }
  function doAction(a) {
    const before = statsSnap();
    const first = !c.state.seen.actions.length;
    const { result, seen } = c.doAction(a.id);
    afterEngine();
    const seenNode = seen?.length
      ? h('p', { dataset: { testid: 'seen' } }, '👁 Vu par : ', seen.map((s) => `${witnessName(s.id)}${s.ally ? ' (allié)' : ''}`).join(', '))
      : (a.legality !== 'legal' ? h('p', '👁 Personne ne semble avoir vu quoi que ce soit.') : null);
    view = { tutoShown: true, result: { title: a.label, text: result, deltas: deltas(before), scene: sceneOfAction(a.id), extra: h('div', seenNode, first ? tutorial('first_afternoon_action') : null) } };
    render();
  }

  // ── nuit ────────────────────────────────────────────────────────────
  function nightScreen() {
    const sat = c.isSaturday();
    const go = h('button.ui-btn.center', { dataset: { testid: 'night-go' } }, opts.onNight ? 'Descendre dans la rue (nuit)' : 'Passer la nuit');
    go.onclick = async () => {
      go.disabled = true;
      meta.preNight = { day: c.state.day, stats: statsSnap(), evidence: c.state.evidence.length };
      save();
      if (opts.onNight) {
        await opts.onNight(c, publicApi);
        if (c.step !== 'night') { afterEngine(); render(); }
      } else {
        // Repli sans 3D (page autonome, tests) : nuit simulée, Pilou reste à sa fenêtre.
        // boucle bornée (une nuit v1.1 peut attendre un événement de nuit) : les événements prennent le 1er choix
        const sim = c.createNight();
        for (let k = 0; !sim.state.ended && k < 3000; k++) {
          for (let ev = c.nightEventDue?.(sim); ev; ev = c.nightEventDue(sim)) c.resolveNightEvent(sim, ev.choices.find((x) => x.available)?.i ?? 0);
          sim.tick(1);
          sim.events.length = 0;
        }
        c.finishNight(sim);
        afterEngine();
        view = {};
        render();
      }
    };
    // v1.1 : le rebondissement de la nuit (c.tonightTwist()), en carte d'ouverture
    const tw = typeof c.tonightTwist === 'function' ? c.tonightTwist() : null;
    return h('div.ui-card.ui-night', { dataset: { testid: 'night', twist: tw?.id } },
      h('span.ui-kicker', tw ? `Nuit ${c.state.day} · ce soir` : `Nuit ${c.state.day}`),
      tw ? h('h2', { dataset: { testid: 'twist-title' } }, tw.title) : h('h2', sat ? 'Samedi soir, sans voitures. La rue est à eux.' : '20h30. Les terrasses se remplissent.'),
      tw ? h('p.ui-lead', { dataset: { testid: 'twist-intro' } }, tw.intro) : null,
      h('p', 'Photos, décibels, appels : tout ce qui se passe ce soir pèsera à la commission. Les nuits ne se rattrapent pas.'),
      go);
  }

  // ── bilan de nuit (U7) ─────────────────────────────────────────────
  function recapScreen() {
    const S = c.state;
    const sum = S.lastNight ?? {};
    const night = S.nights.at(-1) ?? {};
    const head = S.lastHeadline ?? narrative.recapHeadline(sum);
    const endLines = NIGHT_END?.[sum.reason ?? 'time'] ?? [];
    const mood = endLines.length ? endLines[S.day % endLines.length] : null;
    const pre = meta.preNight?.day === S.day ? meta.preNight : null;
    const last = S.day >= 14;
    // ▲▼ depuis le début de la nuit
    const deltaRow = h('div.ui-deltas', { dataset: { testid: 'recap-deltas' } }, Object.entries(STAT_LABELS).map(([k, label]) => {
      const now = Math.round(S.stats[k]);
      const d = pre ? now - Math.round(pre.stats[k]) : 0;
      const good = k === 'risk' ? d < 0 : d > 0;
      return h(`div.ui-delta${d ? (good ? '.up' : '.down') : ''}`, h('span', label), h('b', now), d ? h('em', `${d > 0 ? '▲' : '▼'} ${Math.abs(d)}`) : h('em', '='));
    }));
    // Carnet de Klaas : les pièces de la nuit qu'il a notées, sinon une ligne de son carnet
    const nightEv = S.evidence.filter((e) => e.day === S.day);
    const klaas = nightEv.filter((e) => /Klaas|carnet/i.test(e.label) || ['complaisance', 'tipoff'].includes(e.nightType)).slice(0, 2).map((e) => e.label);
    if (!klaas.length) { const l = klaasLine(KLAAS_NOTEBOOK?.bedtime?.precise ?? KLAAS_NOTEBOOK?.bedtime ?? [], S.day); if (l) klaas.push(l); }
    const unread = phoneUnread(c, meta).slice(-3);
    return h('div.ui-card.ui-recap', { dataset: { testid: 'recap' } },
      h('span.ui-kicker', `La Voix du Nordiste · lendemain de la nuit ${night.day ?? S.day}`),
      head ? h('h2.ui-headline', { dataset: { testid: 'recap-headline' } }, head.text) : null,
      mood ? h('p.ui-result', mood) : null,
      deltaRow,
      h('div.ui-fx',
        h('span', `📸 Pièces : ${night.evidence ?? 0}`), h('span', `📁 Dossier +${night.gained ?? 0}`),
        h('span', `🚓 Appels : ${night.police ?? 0}`), night.witnesses ? h('span.down', `👁 Témoins : ${night.witnesses}`) : null),
      (sum.verdict ?? []).length ? h('ul.ui-list', sum.verdict.map((v) => h('li', v))) : null,
      klaas.length ? h('div.ui-notebook', { dataset: { testid: 'recap-klaas' } }, portrait('klaas', 'neutral', 'sm'),
        h('div', h('span.who', 'Carnet de Klaas'), klaas.map((t) => h('p', t)))) : null,
      (sum.police ?? []).length ? h('div', h('h3', 'Main courante'), h('ul.ui-list.ui-police', sum.police.map((p) =>
        h('li', h('b', p.called), ` → ${p.arrived ?? '—'}`, p.patrol ? ` · ${p.patrol}` : '', ` · ${p.outcome ?? ''}`)))) : null,
      unread.length ? h('div', h('h3', '📱 Sur le téléphone'), h('div.ui-feed.mini', unread.map(messageNode))) : null,
      h('button.ui-btn.center', { dataset: { testid: 'recap-next' }, onclick: () => { c.nextDay(); afterEngine(); view = {}; render(); } },
        last ? 'Le verdict de la commission' : `Jour ${S.day + 1} →`));
  }

  // ── fin de campagne ─────────────────────────────────────────────────
  function endScreen() {
    const S = c.state;
    const before = new Set(store.get(ENDINGS_KEY) ?? []);
    recordEnding();
    const found = new Set(store.get(ENDINGS_KEY) ?? []);
    const e = S.ending ?? {};
    const isNew = e.id && !before.has(e.id);
    const front = S.endingMedia?.front ?? (e.id ? narrative.mediaEnding(e.id, S) : null);
    const buttons = h('div.ui-col');
    if (e.canContinue) buttons.append(h('button.ui-btn.center', { dataset: { testid: 'end-continue' }, onclick: () => { c.continueAfterEnding(); afterEngine(); view = {}; render(); } }, e.continueLabel ?? 'Continuer'));
    buttons.append(h('button.ui-btn.center' + (e.canContinue ? '.light' : ''), { dataset: { testid: 'end-new' }, onclick: () => {
      if (opts.onNew && opts.campaign) return opts.onNew();
      store.del(SAVE_KEY); c = null; view = {};
      if (opts.onTitle) opts.onTitle(); else render();
    } }, 'Nouvelle campagne'));
    return [
      // Le tableau de fin (art.scenes.ending) est rendu derrière ; ce bandeau laisse la place de le voir
      h('div.ui-ending-hero', { dataset: { testid: 'ending-hero' } },
        h('span.ui-kicker', { dataset: { testid: 'ending-kicker' } }, endingContext(e)),
        h('h1.ui-big', e.title ?? 'Fin'),
        isNew ? h('span.ui-new', 'Nouvelle fin découverte') : null),
      front ? newspaper(front, S) : null,
      h('div.ui-card', { dataset: { testid: 'ending', id: e.id } },
        h('h2', 'Épilogue'),
        h('div.ui-epilogue', (S.epilogue ?? []).map((t) => h('p', t))),
        h('h3', `Fins découvertes · ${[...found].filter((id) => content.ENDINGS.some((x) => x.id === id)).length}/${content.ENDINGS.length}`),
        endingsGrid(found, e.id),
        buttons),
    ];
  }
  // Surtitre de la fin : une fin anticipée (garde à vue, licenciement, déménagement avant la commission) donne son vrai jour
  const EARLY_CONTEXT = { custody: 'au commissariat', fired: 'chez Koddex', moving_out: 'les cartons' };
  function endingContext(e) {
    const early = c.cfg?.CAMPAIGN?.earlyEndings ?? ['custody', 'fired', 'moving_out'];
    const day = e.day ?? c.state.day;
    const isEarly = e.early || day < 14 || (early.includes(e.id) && !c.has('commission_done'));
    if (!isEarly) return 'Commission du jour 14';
    return `Jour ${day} · Fin anticipée${EARLY_CONTEXT[e.id] ? ` · ${EARLY_CONTEXT[e.id]}` : ''}`;
  }
  // La une de La Voix du Nordiste pour cette fin (MEDIA.press, entrée `ending`)
  function newspaper(front, S) {
    return h('article.ui-paper', { dataset: { testid: 'ending-paper' }, 'aria-label': 'La une de La Voix du Nordiste' },
      h('div.ui-paper-mast', h('b', 'La Voix du Nordiste'), h('span', `Édition du matin · lendemain du jour ${S.ending?.day ?? S.day}`)),
      front.headline ? h('h2.ui-paper-head', front.headline) : null,
      front.photo ? h('div.ui-paper-photo', { role: 'img', 'aria-label': front.photo }, h('span', `📷 ${front.photo}`)) : null,
      h('p.ui-paper-text', front.text));
  }
  // Galerie des fins : un emplacement par fin ; la fin secrète reste « ??? » tant qu'elle n'a pas été trouvée
  function endingsGrid(found, current) {
    return h('div.ui-endings', { dataset: { testid: 'endings' }, role: 'list' }, content.ENDINGS.map((x) => {
      const got = found.has(x.id);
      if (x.secret && !got) return h('div.locked.secret', { role: 'listitem', dataset: { slot: 'secret' }, 'aria-label': 'Fin secrète, pas encore trouvée' }, '???');
      return h(`div${got ? '' : '.locked'}${x.id === current ? '.now' : ''}`, { role: 'listitem', dataset: { ending: x.id } }, got ? `✓ ${x.title}` : `🔒 ${x.title}`);
    }));
  }

  // ── clavier : T ouvre le téléphone, Échap le ferme ──────────────────
  function onKey(e) {
    if (!visible || isMenuOpen() || e.target?.closest?.('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') { e.preventDefault(); if (phone.open || panel) { phone.open = false; closePanel(); } else showMenu(); return; }
    if (!c) return;
    // Entrée / Espace pendant la machine à écrire de Koddex : tout afficher d'un coup
    if (typing && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) { e.preventDefault(); skipAll = true; typing.skip(); return; }
    // 1–9 : choisir la n-ième réponse d'une carte
    if (/^Digit[1-9]$/.test(e.code) && shown() === 'cards' && !view.result && !phone.open && !panel) {
      const b = layer.querySelectorAll('[data-testid=card-choice]:not([disabled])')[Number(e.code.slice(5)) - 1];
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if (e.code === 'KeyT') { e.preventDefault(); if (phone.open) closePhone(); else openPhone(); }
    else if (e.code === 'KeyC') { e.preventDefault(); if (panel === 'carnet') closePanel(); else openPanel('carnet'); }
  }
  window.addEventListener('keydown', onKey);
  // Menu pause / réglages (Échap, ☰). « Quitter vers le titre » garde la sauvegarde (Continuer).
  function showMenu() {
    return openMenu({
      campaign: c, meta,
      onResume: () => focusPrimary(true),
      onQuit: c ? () => { saveMeta(); c = null; view = {}; phone.open = false; panel = null; if (opts.onTitle) opts.onTitle(); else render(); } : undefined,
    });
  }
  applySettings();
  // Manette : navigation au focus (src/input) et glyphes ; on redessine quand l'entrée change (clavier ↔ manette)
  startPad();
  startHints();
  const offMode = onInputMode(() => { if (visible) render(); });
  // BUG-005 : le jeu 3D annule Tab globalement (dossier de nuit). Tant que l'interface de jour est à l'écran, Tab
  // appartient à la navigation au clavier : on arrête l'événement avant le gestionnaire du jeu, sans l'annuler.
  // (Le menu pause gère lui-même Tab, piège de focus compris.)
  const keepTab = (e) => { if (e.code === 'Tab' && visible && !isMenuOpen() && !root.classList.contains('ui-hidden')) e.stopImmediatePropagation(); };
  window.addEventListener('keydown', keepTab, true);
  const onResize = () => vignette.resize();
  window.addEventListener('resize', onResize);

  // ── API publique ────────────────────────────────────────────────────
  function hide() { visible = false; vignette.pause(); root.classList.add('ui-hidden'); }
  function show() { visible = true; root.classList.remove('ui-hidden', 'hidden'); vignette.resume(); render(); }
  function destroy() {
    offMode();
    window.removeEventListener('keydown', keepTab, true);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    vignette.dispose();
    clear(layer);
    layer.remove();
  }
  const publicApi = {
    root,
    get campaign() { return c; },
    render, show, hide, destroy, newCampaign, continueCampaign, openPhone, closePhone, openPanel, closePanel,
    openMenu: showMenu,
    afterNight() { afterEngine(); show(); },
  };
  // autoContinue : reprendre la sauvegarde directement (retour de la nuit 3D, main.js)
  if (opts.autoContinue && !c && store.get(SAVE_KEY)) continueCampaign();
  if (!opts.deferRender) show();
  return publicApi;
}
