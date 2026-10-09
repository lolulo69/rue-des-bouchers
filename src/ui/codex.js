// Le Carnet de Pilou (touche C), l'Aide et l'À propos (qa/ui-review U10), depuis src/content/codex.js.
// Une fiche n'apparaît que si son `when` est vrai ; ses `updates` aussi (règle des spoilers).
// « Nouveau » : badges.js (vus dans la sauvegarde, tout est marqué vu à l'ouverture du Carnet).
import { h, portrait } from './dom.js';
import { CODEX } from '../content/codex.js';
import { keyHint, padControlsText } from '../input/hints.js';
import { inputMode } from '../input/index.js';
import { canReplayTutorials, replayTutorials } from './coach.js';

export const CARNET_TABS = [
  { id: 'characters', label: '👥 Personnes' },
  { id: 'places', label: '📍 Lieux' },
  { id: 'rules', label: '📜 Règles' },
];

const ok = (c, when) => !when || c.check(when, false);

// Fiches visibles d'un onglet : [{ card, updates: [{ text, key }], key }]
export function carnetEntries(c, tab) {
  return (CODEX.carnet?.[tab] ?? []).filter((card) => ok(c, card.when)).map((card) => ({
    card,
    key: card.id,
    updates: (card.updates ?? []).map((u, i) => ({ ...u, key: `${card.id}#${i}` })).filter((u) => ok(c, u.when)),
  }));
}
// seenBefore : ce qui était déjà vu à l'ouverture (badges.js › openCarnet) → étiquettes « nouveau »
export function carnetView(c, meta, { tab = 'characters', onTab, onClose, seenBefore = new Set() }) {
  const seen = seenBefore;
  const entries = carnetEntries(c, tab);
  const news = (t) => carnetEntries(c, t).reduce((n, e) => n + (seen.has(e.key) ? 0 : 1) + e.updates.filter((u) => !seen.has(u.key)).length, 0);
  const tabs = CARNET_TABS.map((t) => h(`button${t.id === tab ? '.on' : ''}`, { onclick: () => onTab(t.id), dataset: { tab: t.id } },
    t.label, t.id !== tab && news(t.id) ? h('span.ui-badge', news(t.id)) : null));
  const list = entries.map(({ card, key, updates }) => h('article.ui-codex-card', { dataset: { codex: card.id } },
    h('div.ui-dialogue',
      card.speaker ? portrait(card.speaker, 'neutral', 'sm') : null,
      h('h3', card.title, seen.has(key) ? null : h('span.ui-new', 'nouveau'))),
    h('p', card.text),
    card.position ? h('p.ui-codex-pos', card.position) : null,
    card.quote ? h('p.ui-codex-quote', card.quote) : null,
    updates.length ? h('ul.ui-list', updates.map((u) => h('li', u.text, seen.has(u.key) ? null : h('span.ui-new', 'nouveau')))) : null));
  return h('div.ui-codex', { dataset: { testid: 'carnet' } },
    h('div.ui-codex-head', h('h2', '📓 Le Carnet de Pilou'), h('p', 'Ce que vous savez de la rue, des gens et des règles. Il se remplit au fil des jours.')),
    h('div.ui-phone-tabs', tabs),
    h('div.ui-codex-list', list.length ? list : h('p.ui-empty', 'Rien encore. Ouvrez l’œil.')),
    h('button.ui-btn.center', { onclick: onClose, dataset: { testid: 'carnet-close' } }, `Refermer le carnet (${keyHint('C')})`));
}

export function helpView({ onClose, campaign = null }) {
  return h('div.ui-codex', { dataset: { testid: 'help' } },
    h('div.ui-codex-head', h('h2', '❓ Comment jouer')),
    // En mode manette, la carte des touches montre les boutons de la manette
    h('div.ui-codex-list', (CODEX.help ?? []).map((x) => h('article.ui-codex-card', { dataset: { help: x.id } }, h('h3', x.title),
      h('p', x.id === 'h_touches' && inputMode().mode === 'pad' ? padControlsText() : x.text)))),
    // Tutoriels de la nuit : les revoir à la prochaine nuit (si le moteur sait les rejouer)
    canReplayTutorials(campaign) ? h('button.ui-btn.light.center', { dataset: { testid: 'help-replay' }, onclick: (e) => {
      replayTutorials(campaign);
      e.currentTarget.textContent = 'C’est noté : les tutoriels reviendront à la prochaine nuit';
      e.currentTarget.disabled = true;
    } }, 'Revoir les tutoriels') : null,
    h('button.ui-btn.center', { onclick: onClose, dataset: { testid: 'help-close' } }, 'Compris'));
}

export function aboutView({ onClose }) {
  const a = CODEX.about ?? {};
  return h('div.ui-codex', { dataset: { testid: 'about' } },
    h('div.ui-codex-head', h('h2', a.title ?? 'À propos')),
    h('article.ui-codex-card', (a.lines ?? []).map((l) => h('p', l))),
    h('button.ui-btn.center', { onclick: onClose, dataset: { testid: 'about-close' } }, 'Fermer'));
}
