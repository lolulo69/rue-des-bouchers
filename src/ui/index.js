// Interface 2D des journées (GAME_DESIGN §3, §10, §13.A/D). Propriétaire : agent UI.
//
//   import { mount } from './ui/index.js';
//   const ui = mount(engine?, { onNight, root, seed });
//
// engine (facultatif) : { createCampaign, content } ; par défaut src/sim/index.js + src/content/*.
// onNight(c, ui)      : appelé quand c.step === 'night'. L'hôte (main.js) cache l'UI, joue la nuit 3D
//                       (c.createNight() … c.finishNight(sim)) et résout la promesse : l'UI sauvegarde et reprend.
//                       Sans onNight, l'UI propose de passer la nuit en simulation (repli sans 3D, tests).
// Sauvegarde : localStorage 'rdb.save.v1' après chaque appel au moteur (README de src/sim).
import './ui.css';
import { createCampaign as defaultCreate, contentFromGlob, POLICIES, playNight } from '../sim/index.js';
import { INTRO_CARDS, TUTORIAL } from '../content/intro.js';
import { RECAP_HEADLINES, NIGHT_END } from '../content/night.js';
import { h, clear, portrait, nameOf, typewrite, effectChips, STAT_LABELS, setPortraitProvider } from './dom.js';
import {
  WEEKDAYS, WEEKDAYS_SHORT, PHASE_LABELS, LEGALITY, explain, afternoonMenu, upcomingEvent, eventDays,
  witnessName, recapVars, pickHeadline,
} from './rules.js';
import { phoneView } from './phone.js';

export const SAVE_KEY = 'rdb.save.v1';
export const UI_KEY = 'rdb.ui.v1';           // historique du téléphone, tutoriel vu, intro vue
export const ENDINGS_KEY = 'rdb.endings.v1'; // fins découvertes, toutes campagnes confondues

const DEFAULT_CONTENT = contentFromGlob(import.meta.glob('../content/*.js', { eager: true }));

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible : on joue sans */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* idem */ } },
};

export function mount(engine = {}, opts = {}) {
  const create = engine.createCampaign ?? defaultCreate;
  const content = engine.content ?? DEFAULT_CONTENT;
  if (opts.portrait) setPortraitProvider(opts.portrait);
  let root = opts.root ?? document.getElementById('ui-root');
  if (!root) { root = h('div#ui-root'); document.body.append(root); }
  root.classList.remove('ui-hidden');

  let c = null;
  let meta = freshMeta();
  let view = {};          // état local de l'écran courant (résultats affichés, terminal…)
  let phone = { open: false, tab: 'whatsapp' };
  let typing = null;

  function freshMeta() { return { seed: 0, history: [], tuto: [], introDone: false, koddexDay: 0 }; }
  const save = () => { if (!c) return; store.set(SAVE_KEY, c.save()); store.set(UI_KEY, meta); };
  const statsSnap = () => ({ ...c.state.stats });
  const deltas = (before) => Object.fromEntries(Object.keys(STAT_LABELS).map((k) => [k, Math.round(c.state.stats[k] - before[k])]));

  // ── campagne ────────────────────────────────────────────────────────
  function loadSave() {
    const s = store.get(SAVE_KEY);
    if (!s) return null;
    try { return create({ content, save: s }); } catch { return null; } // version incompatible → « Nouvelle campagne »
  }
  function newCampaign(seed = opts.seed ?? (Date.now() % 2147483646) + 1) {
    c = create({ seed, content });
    meta = freshMeta();
    meta.seed = seed;
    view = {};
    save();
    render();
    return c;
  }
  function continueCampaign() {
    c = loadSave();
    if (!c) return null;
    meta = { ...freshMeta(), ...(store.get(UI_KEY) ?? {}), introDone: true };
    view = {};
    render();
    return c;
  }
  function recordEnding() {
    const found = new Set(store.get(ENDINGS_KEY) ?? []);
    if (c.state.ending?.id) found.add(c.state.ending.id);
    store.set(ENDINGS_KEY, [...found]);
  }
  const pushHistory = (e) => { meta.history.push({ day: c.state.day, ...e }); if (meta.history.length > 200) meta.history.shift(); };

  // ── tutoriel (déclencheurs côté jour) ──────────────────────────────
  function tutorial(trigger) {
    const t = (TUTORIAL ?? []).find((x) => x.trigger === trigger && !meta.tuto.includes(x.id) && (!x.when || c.check(x.when, false)));
    if (!t) return null;
    meta.tuto.push(t.id);
    store.set(UI_KEY, meta);
    return h('div.ui-card', { dataset: { testid: 'tutorial' } }, h('span.ui-kicker', 'Astuce'), h('p', t.text));
  }

  // ── rendu ───────────────────────────────────────────────────────────
  function render() {
    if (typing) { typing.skip?.(); typing = null; }
    clear(root);
    root.dataset.step = c ? c.step : 'title';
    if (!c) return root.append(titleScreen());
    if (!meta.introDone && INTRO_CARDS?.length) return root.append(introScreen());
    const wrap = h('div.ui-wrap');
    if (c.step !== 'ended') wrap.append(header());
    if (phone.open) wrap.append(phoneView(c, meta.history, {
      tab: phone.tab, onTab: (t) => { phone.tab = t; render(); }, onClose: () => { phone.open = false; render(); },
    }));
    else wrap.append(...[].concat(screen()).filter(Boolean));
    root.append(wrap);
    root.scrollTop = 0;
  }

  function screen() {
    switch (c.step) {
      case 'cards': return cardScreen();
      case 'koddex': return koddexScreen();
      case 'actions': return actionsScreen();
      case 'night': return nightScreen();
      case 'recap': return recapScreen();
      case 'ended': return endScreen();
      default: return h('div.ui-card', h('p', `Étape inconnue : ${c.step}`));
    }
  }

  // ── écran titre ─────────────────────────────────────────────────────
  function titleScreen() {
    const existing = store.get(SAVE_KEY) ? loadSave() : null;
    const found = new Set(store.get(ENDINGS_KEY) ?? []);
    const col = h('div.ui-col');
    if (existing) {
      col.append(h('button.ui-btn', { onclick: continueCampaign, dataset: { testid: 'title-continue' } },
        `Continuer · jour ${existing.state.day}/14, ${WEEKDAYS[existing.weekday()]}`));
    } else if (store.get(SAVE_KEY)) {
      col.append(h('p.note', 'Votre sauvegarde vient d’une ancienne version du jeu : il faut recommencer.'));
    }
    const newBtn = h('button.ui-btn' + (existing ? '.ghost' : ''), { dataset: { testid: 'title-new' } }, 'Nouvelle campagne');
    newBtn.onclick = () => {
      if (existing && !newBtn.dataset.armed) { newBtn.dataset.armed = '1'; newBtn.textContent = 'Écraser la sauvegarde ? Cliquez encore'; return; }
      newCampaign();
    };
    col.append(newBtn);
    return h('div.ui-title', h('div',
      h('h1', 'Rue des Bouchers'),
      h('p.sub', "Vieux-Lille. Quatorze jours avant la commission des terrasses. Pilou habite au-dessus de l'estaminet, la gaine souffle sous sa fenêtre, et les terrasses doivent rentrer à 22h. En théorie."),
      col,
      found.size ? endingsGrid(found, null) : null,
      h('p.note', "Œuvre de fiction. La rue existe ; les personnages, commerces, policiers et élus sont inventés.")));
  }

  // ── intro (jour 1) ──────────────────────────────────────────────────
  function introScreen() {
    const i = view.intro ?? 0;
    const card = INTRO_CARDS[i];
    const next = () => { if (i + 1 >= INTRO_CARDS.length) { meta.introDone = true; save(); view = {}; } else view.intro = i + 1; render(); };
    const skip = () => { meta.introDone = true; save(); view = {}; render(); };
    return h('div.ui-wrap', h('div.ui-card', { dataset: { testid: 'intro' } },
      h('span.ui-kicker', `${i + 1} / ${INTRO_CARDS.length}`),
      card.speaker ? h('div.ui-dialogue', portrait(card.speaker), h('h2', card.title)) : h('h2', card.title),
      h('p', card.text),
      h('div.ui-row',
        h('button.ui-btn', { onclick: next, dataset: { testid: 'intro-next' } }, i + 1 >= INTRO_CARDS.length ? 'Commencer' : 'Suivant'),
        h('button.ui-btn.light', { onclick: skip, dataset: { testid: 'intro-skip' } }, 'Passer'))));
  }

  // ── en-tête ─────────────────────────────────────────────────────────
  function header() {
    const S = c.state;
    const evDays = eventDays(c);
    const up = upcomingEvent(c);
    const phases = ['morning', 'afternoon', 'night'];
    const stats = Object.entries(STAT_LABELS).map(([k, label]) => h(`div.ui-stat${k === 'risk' ? '.danger' : ''}`, { dataset: { stat: k } },
      `${label} ${Math.round(S.stats[k])}`, h('i', h('b', { style: { width: `${S.stats[k]}%` } }))));
    return h('header.ui-header', { dataset: { testid: 'day-header', day: S.day, step: c.step } },
      h('div.ui-header-top',
        h('h1.ui-day', `Jour ${S.day}/14`, h('small', `${WEEKDAYS[c.weekday()]}${c.isSaturday() ? ' · sans voitures' : ''}`)),
        h('div.ui-row',
          h('div.ui-phase', phases.map((p) => h(`span${p === S.phase ? '.on' : ''}`, PHASE_LABELS[p]))),
          h('button.ui-btn.ghost', { onclick: () => { phone.open = !phone.open; render(); }, dataset: { testid: 'phone-open' }, 'aria-label': 'Téléphone' }, '📱'))),
      h('div.ui-cal', Array.from({ length: 14 }, (_, k) => h(`i${k + 1 < S.day ? '.done' : ''}${k + 1 === S.day ? '.now' : ''}${evDays.has(k + 1) ? '.ev' : ''}`, { title: `Jour ${k + 1}` }))),
      up ? h('div.ui-upcoming', up.day === S.day ? 'Aujourd’hui : ' : `Jour ${up.day} (${WEEKDAYS_SHORT[c.weekday(up.day)]}) : `, h('b', up.title)) : null,
      h('div.ui-stats', stats));
  }

  // ── cartes (événements, dialogues, contre-offensives, infos) ──────
  function cardScreen() {
    if (view.result) return resultCard(view.result, () => { view = {}; render(); });
    const card = c.card();
    if (!card) return h('div.ui-card', h('p', '…'));
    const d = card.data ?? card;
    const speaker = d.speaker;
    const kicker = { event: typeof d.day === 'number' ? 'Événement' : 'Imprévu', dialogue: 'Conversation', countermove: 'Le bloc contre-attaque', info: 'Nouvelles' }[card.type];
    const body = h('div.ui-card', { dataset: { testid: 'card', type: card.type, id: card.id } }, h('span.ui-kicker', kicker));
    if (card.type === 'dialogue') {
      for (const line of d.lines ?? []) body.append(h('div.ui-dialogue', portrait(speaker), h('div.ui-bubble', h('span.who', nameOf(speaker)), line)));
    } else {
      body.append(speaker ? h('div.ui-dialogue', portrait(speaker, card.type === 'countermove' ? 'suspicious' : 'neutral'), h('h2', d.title ?? nameOf(speaker))) : h('h2', d.title ?? ''));
      if (d.text) body.append(h('p', d.text));
    }
    const choices = h('div.ui-col');
    for (const ch of card.choices) {
      const src = d.choices?.[ch.i];
      const why = ch.available ? [] : explain(src?.requires, c);
      choices.append(h('button.ui-action', {
        disabled: !ch.available, style: { '--c': 'var(--ui-gold)' }, dataset: { testid: 'card-choice', i: ch.i },
        onclick: () => choose(card, ch.i),
      }, h('span.lbl', ch.label === 'OK' ? 'Continuer' : ch.label), why.length ? h('span.why', why.join(' · ')) : null));
    }
    body.append(choices);
    return body;
  }
  function choose(card, i) {
    const before = statsSnap();
    const d = card.data ?? card;
    const result = c.resolveCard(i);
    const text = card.type === 'dialogue' ? (d.lines ?? []).join(' ') : d.text;
    if (card.type !== 'info') pushHistory({ type: card.type, id: card.id, speaker: d.speaker, title: d.title, text: result ? `${text ?? ''} ${result}`.trim() : text });
    save();
    if (c.step === 'ended') recordEnding();
    const dl = deltas(before);
    if (result || Object.values(dl).some(Boolean)) view = { result: { title: d.title ?? nameOf(d.speaker), text: result, deltas: dl } };
    else view = {};
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

  // ── matin : Koddex (terminal Clode Kode) ───────────────────────────
  function koddexScreen() {
    const S = c.state;
    if (!view.k || view.k.day !== S.day) {
      const opts = c.koddexOptions(); // une seule fois par matinée (tire le gag au sort)
      view.k = { day: S.day, opts, picks: [], log: [], done: false, tuto: tutorial('morning_start') };
      if (opts.gag) for (const l of opts.gag.lines ?? []) view.k.log.push({ cls: opts.gag.speaker === 'clode' ? 'clode' : 'sys', text: opts.gag.speaker === 'clode' ? l : `${nameOf(opts.gag.speaker)} : ${l}`, fresh: true });
    }
    const k = view.k;
    const term = h('div.ui-term-body');
    const termBox = h('div.ui-term', { dataset: { testid: 'terminal' }, onclick: () => typing?.skip?.() },
      h('div.ui-term-bar', h('i'), h('i'), h('i'), h('span', 'clode-kode — koddex/todo-app (main)')), term);
    const usedProjects = new Set(k.picks);
    const works = workChoices(k);
    const menu = h('div.ui-col', { dataset: { testid: 'koddex-menu' } });
    if (!k.done) {
      menu.append(h('div.ui-prompts', `Prompts restants : `, Array.from({ length: k.opts.prompts }, (_, i) => h(`i${i < k.picks.length ? '.used' : ''}`))));
      const w = works[k.picks.length % works.length];
      menu.append(h('button.ui-action', { style: { '--c': 'var(--ui-legal)' }, dataset: { testid: 'koddex-option', id: 'work' }, onclick: () => pick('work', w) },
        h('span.lbl', w ? w.label : 'Faire le vrai travail'), h('span.cost', 'Travail · Job +')));
      for (const p of k.opts.sideProjects) {
        if (!p.available || usedProjects.has(p.id)) continue;
        const L = LEGALITY[p.legality ?? 'legal'];
        menu.append(h('button.ui-action', {
          style: { '--c': `var(--ui-${p.legality ?? 'legal'})` }, dataset: { testid: 'koddex-option', id: p.id }, onclick: () => pick(p.id, p),
        }, h('span.lbl', p.label), h('span.cost', `Projet perso · ${L.label}`),
        h('span.why', `Job ${p.job ?? -10}${p.risk ? ` · Risque +${p.risk} si Stéphane remarque` : ''}`)));
      }
    } else {
      menu.append(h('button.ui-btn.center', { dataset: { testid: 'koddex-done' }, onclick: () => { view = {}; render(); } }, 'Quitter Koddex (direction la rue)'));
    }
    // Rejoue le journal : les lignes déjà tapées s'affichent d'un coup, les nouvelles à la machine à écrire
    const fresh = [];
    for (const line of k.log) {
      const node = h(`div.ui-term-line.${line.cls}`);
      term.append(node);
      if (line.fresh) { fresh.push([node, line.text]); line.fresh = false; } else node.textContent = line.text;
    }
    queueMicrotask(() => typeAll(fresh, term, menu));
    return [k.tuto, termBox, menu];
  }
  function workChoices(k) {
    const S = c.state;
    const ok = (k.opts.work ?? []).filter((w) => c.check(w.requires, false) && !(w.once && (meta.workDone ?? []).includes(w.id)));
    if (!ok.length) return [{ id: 'work', label: 'Faire le vrai travail', result: 'Clode Kode a fait le travail. Stéphane a mis un emoji 🚀.' }];
    const start = (S.day * 7 + meta.seed) % ok.length;
    return [...ok.slice(start), ...ok.slice(0, start)];
  }
  async function typeAll(list, term, menu) {
    if (!list.length) return;
    menu.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    for (const [node, text] of list) {
      typing = typewrite(node, text, { cps: 90 });
      await typing;
      term.scrollTop = term.scrollHeight;
    }
    typing = null;
    menu.querySelectorAll('button').forEach((b) => { b.disabled = false; });
  }
  function pick(id, item) {
    const k = view.k;
    if (k.done || k.picks.length >= k.opts.prompts) return;
    if (k.picks.length === 0) k.tuto = tutorial('first_prompt');
    k.picks.push(id);
    k.log.push({ cls: 'me', text: item?.label ?? 'Faire le vrai travail', fresh: true });
    if (id === 'work') {
      k.log.push({ cls: 'clode', text: item?.result ?? 'Fait. Avec toutes mes excuses pour le retard de 0,2 seconde.', fresh: true });
      if (item?.once) meta.workDone = [...(meta.workDone ?? []), item.id];
    } else {
      for (const l of item.lines ?? []) k.log.push({ cls: l.speaker === 'clode' ? 'clode' : l.speaker === 'pilou' ? 'me' : 'sys', text: l.speaker === 'clode' || l.speaker === 'pilou' ? l.text : `${nameOf(l.speaker)} : ${l.text}`, fresh: true });
    }
    if (k.picks.length >= k.opts.prompts) {
      const before = statsSnap();
      c.koddex(k.picks);
      for (const pid of k.picks) {
        const p = k.opts.sideProjects.find((x) => x.id === pid);
        if (p?.result) k.log.push({ cls: 'sys', text: `✔ Livré : ${p.result}`, fresh: true });
      }
      const dl = deltas(before);
      k.log.push({ cls: 'sys', text: `— Fin de matinée. Job ${dl.job >= 0 ? '+' : ''}${dl.job}${dl.risk ? `, Risque +${dl.risk}` : ''}${c.has('boss_noticed') && dl.risk ? ' (Stéphane a remarqué quelque chose)' : ''}.`, fresh: true });
      k.done = true;
      save();
      if (c.step === 'ended') recordEnding();
    }
    render();
  }

  // ── après-midi : menu d'actions ────────────────────────────────────
  function actionsScreen() {
    const S = c.state;
    if (view.result) return resultCard(view.result, () => { view = { afterFirst: true }; render(); }, view.result.seenNode);
    const tuto = view.tutoShown ? null : tutorial('afternoon_start');
    view.tutoShown = true;
    const menu = afternoonMenu(c);
    const groups = ['legal', 'grey', 'illegal'].map((lg) => {
      const items = menu.filter((m) => (m.action.legality ?? 'legal') === lg);
      if (!items.length) return null;
      items.sort((a, b) => Number(b.available) - Number(a.available));
      return h(`section.ui-group.${lg}`, { dataset: { testid: `group-${lg}` } },
        h('h3', LEGALITY[lg].label, h('small', { style: { fontWeight: 600, textTransform: 'none', opacity: 0.7, letterSpacing: 0 } }, ` · ${LEGALITY[lg].hint}`)),
        items.map(({ action: a, cost, available, why }) => h('button.ui-action', {
          disabled: !available, dataset: { testid: 'action', id: a.id }, onclick: () => doAction(a),
        }, h('span.lbl', a.label), h('span.cost', `${cost} créneau${cost > 1 ? 'x' : ''}`), why.length ? h('span.why', why.join(' · ')) : null)));
    });
    return [
      tuto,
      h('div.ui-slots', { dataset: { testid: 'slots', left: S.timeLeft } }, 'Temps libre cet après-midi : ',
        Array.from({ length: Math.max(S.timeLeft, 0) }, () => h('i')), S.timeLeft ? null : ' plus rien'),
      ...groups,
      h('button.ui-btn.center', { dataset: { testid: 'action-end' }, onclick: () => { c.endAfternoon(); save(); view = {}; render(); } },
        S.timeLeft ? 'Laisser tomber et attendre le soir' : 'Le soir tombe… (vers la nuit)'),
    ];
  }
  function doAction(a) {
    const before = statsSnap();
    const first = !c.state.seen.actions.length;
    const { result, seen } = c.doAction(a.id);
    save();
    if (c.step === 'ended') recordEnding();
    pushHistory({ type: 'action', id: a.id, speaker: 'pilou', title: a.label, text: result ?? '', channel: null });
    const seenNode = seen?.length
      ? h('p', { dataset: { testid: 'seen' } }, '👁 Vu par : ', seen.map((s) => `${witnessName(s.id)}${s.ally ? ' (allié)' : ''}`).join(', '))
      : (a.legality !== 'legal' ? h('p', '👁 Personne ne semble avoir rien vu.') : null);
    view = { result: { title: a.label, text: result, deltas: deltas(before), seenNode: h('div', seenNode, first ? tutorial('first_afternoon_action') : null) } };
    render();
  }

  // ── nuit ────────────────────────────────────────────────────────────
  function nightScreen() {
    const sat = c.isSaturday();
    const go = h('button.ui-btn.center', { dataset: { testid: 'night-go' } }, opts.onNight ? 'Descendre dans la rue (nuit)' : 'Passer la nuit');
    go.onclick = async () => {
      go.disabled = true;
      if (opts.onNight) {
        hide();
        try { await opts.onNight(c, ui); } finally { save(); show(); }
      } else {
        // Repli sans 3D (tests, page autonome) : nuit simulée, Pilou reste à sa fenêtre sans rien faire.
        const sim = c.createNight();
        playNight(sim, POLICIES.passive(), c);
        c.finishNight(sim);
        save();
        if (c.step === 'ended') recordEnding();
        render();
      }
    };
    return h('div.ui-card', { dataset: { testid: 'night' } },
      h('span.ui-kicker', `Nuit ${c.state.day}`),
      h('h2', sat ? 'Samedi soir, sans voitures. La rue est à eux.' : '20h30. Les terrasses se remplissent.'),
      h('p', "Photos, décibels, appels : tout ce qui se passe ce soir pèsera à la commission. Les nuits ne se rattrapent pas."),
      go);
  }

  // ── bilan de nuit ───────────────────────────────────────────────────
  function recapScreen() {
    const S = c.state;
    const sum = S.lastNight ?? {};
    const night = S.nights.at(-1) ?? {};
    const head = pickHeadline(RECAP_HEADLINES, recapVars(sum, c));
    const endLines = NIGHT_END?.[sum.reason ?? 'time'] ?? [];
    const mood = endLines.length ? endLines[S.day % endLines.length] : null;
    const last = S.day >= 14;
    return h('div.ui-card', { dataset: { testid: 'recap' } },
      h('span.ui-kicker', `Bilan de la nuit ${night.day ?? S.day}`),
      head ? h('h2', { style: { fontFamily: 'Georgia, serif' } }, head.text) : null,
      mood ? h('p.ui-result', mood) : null,
      h('ul.ui-list', (sum.verdict ?? []).map((v) => h('li', v))),
      h('div.ui-fx',
        h('span', `Pièces cette nuit : ${night.evidence ?? 0}`),
        h('span', `Dossier +${night.gained ?? 0}`),
        h('span', `Appels police : ${night.police ?? 0}`),
        night.witnesses ? h('span.down', `Témoins : ${night.witnesses}`) : null),
      (sum.police ?? []).length ? h('div', h('h3', 'Police'), h('ul.ui-list', sum.police.map((p) => h('li', `${p.called} → ${p.arrived ?? '—'} · ${p.outcome ?? ''}`)))) : null,
      h('button.ui-btn.center', { dataset: { testid: 'recap-next' }, onclick: () => { c.nextDay(); save(); if (c.step === 'ended') recordEnding(); view = {}; render(); } },
        last ? 'Le verdict de la commission' : `Jour ${S.day + 1} →`));
  }

  // ── fin de campagne ─────────────────────────────────────────────────
  function endScreen() {
    const S = c.state;
    recordEnding();
    const found = new Set(store.get(ENDINGS_KEY) ?? []);
    const e = S.ending ?? {};
    const buttons = h('div.ui-col');
    if (e.canContinue) buttons.append(h('button.ui-btn.center', { dataset: { testid: 'end-continue' }, onclick: () => { c.continueAfterEnding(); save(); view = {}; render(); } }, e.continueLabel ?? 'Continuer'));
    buttons.append(h('button.ui-btn.center' + (e.canContinue ? '.light' : ''), { dataset: { testid: 'end-new' }, onclick: () => { store.del(SAVE_KEY); c = null; render(); } }, 'Nouvelle campagne'));
    return h('div.ui-card', { dataset: { testid: 'ending', id: e.id } },
      h('span.ui-kicker', e.early ? `Fin anticipée · jour ${e.day}` : 'Commission du jour 14'),
      h('p.ui-big', e.title ?? 'Fin'),
      h('div.ui-epilogue', (S.epilogue ?? []).map((t) => h('p', t))),
      h('h3', 'Fins découvertes'),
      endingsGrid(found, e.id),
      buttons);
  }
  function endingsGrid(found, current) {
    const list = content.ENDINGS.filter((x) => !x.secret || found.has(x.id)); // les fins secrètes restent cachées
    return h('div.ui-endings', { dataset: { testid: 'endings' } }, list.map((x) => h(`div${found.has(x.id) ? '' : '.locked'}${x.id === current ? '.now' : ''}`,
      { dataset: { ending: x.id } }, found.has(x.id) ? x.title : `🔒 ${x.title}`)));
  }

  // ── API publique ────────────────────────────────────────────────────
  function hide() { root.classList.add('ui-hidden'); }
  function show() { root.classList.remove('ui-hidden'); render(); }
  const ui = {
    root,
    get campaign() { return c; },
    render, show, hide, newCampaign, continueCampaign,
    /** À appeler par l'hôte si la nuit s'est terminée hors de onNight (ex. rechargement) */
    afterNight() { save(); show(); },
    destroy() { clear(root); },
  };
  if (opts.autoContinue && store.get(SAVE_KEY)) continueCampaign(); else render();
  return ui;
}
