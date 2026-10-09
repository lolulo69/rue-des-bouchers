// Le téléphone de Pilou : groupe WhatsApp, presse, réseaux.
// Les messages arrivent par le moteur (c.mediaFeed() → c.readMedia(feed, id) : marque reçu, applique les effets,
// note { type: 'media', feed, id, day } au journal). L'historique affiché est relu depuis ce journal.
// Non-lus : badges.js (vus dans la sauvegarde, tout est marqué vu à l'ouverture du téléphone).
// meta.overheard : répliques de dialogue « entendues en passant » (au-delà d'une boîte de dialogue par transition).
import { h, portrait, nameOf } from './dom.js';
import { WHATSAPP_GROUP, PLACES } from '../content/characters.js';
import { keyHint } from '../input/hints.js';

export const FEEDS = ['whatsapp', 'press', 'social'];
const TABS = { whatsapp: '💬 ' + WHATSAPP_GROUP, press: '📰 Presse', social: '📣 Réseaux' };

// Relève les nouveaux messages : le moteur les marque reçus et applique leurs effets. → [{ feed, id }]
export function pullFeed(c) {
  if (typeof c.mediaFeed !== 'function') return [];
  const fresh = c.mediaFeed();
  const got = [];
  for (const feed of FEEDS) for (const m of fresh[feed] ?? []) if (c.readMedia(feed, m.id)) got.push({ feed, id: m.id });
  return got;
}

// Tout ce qui est arrivé dans le téléphone, du plus ancien au plus récent
export function phoneHistory(c, meta) {
  const M = c.content.MEDIA ?? {};
  const items = [];
  for (const j of c.state.journal) {
    if (j.type !== 'media') continue;
    const m = (M[j.feed] ?? []).find((x) => x.id === j.id);
    if (m) items.push({ ...m, channel: j.feed, day: j.day, phase: j.phase });
  }
  for (const o of meta.overheard ?? []) items.push({ ...o, channel: 'whatsapp', overheard: true });
  return items.sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
}

function authorName(m) {
  if (m.handle) return m.handle;
  if (PLACES[m.author]) return PLACES[m.author].name;
  if (m.author === 'reviewer') return 'Un client';
  return nameOf(m.author ?? m.speaker);
}

export function messageNode(m) {
  const who = m.author ?? m.speaker;
  const face = m.channel !== 'press' && who && !PLACES[who] && who !== 'reviewer';
  return h(`div.ui-msg.${m.channel}`, { dataset: { media: m.id } },
    face ? portrait(who, 'neutral', 'sm') : null,
    h('div.ui-bubble',
      h('span.who', authorName(m), m.overheard ? ' · en passant' : '', m.stars ? ` · ${'★'.repeat(m.stars)}${'☆'.repeat(5 - m.stars)}` : ''),
      m.headline ? h('b', m.headline) : null,
      h('p', m.text),
      m.photo ? h('p.ui-photo', `📷 ${m.photo}`) : null,
      m.day ? h('time', `jour ${m.day}`) : null));
}

// seenBefore : ce qui était déjà vu à l'ouverture (badges.js) → pastilles des autres onglets
export function phoneView(c, meta, { tab = 'whatsapp', onTab, onClose, seenBefore = new Set() }) {
  const all = phoneHistory(c, meta);
  const unread = new Set(all.filter((m) => !seenBefore.has(m.id)).map((m) => m.id));
  const items = all.filter((i) => i.channel === tab).slice(-40).reverse();
  const count = (f) => all.filter((m) => m.channel === f && unread.has(m.id)).length;
  const feed = h('div.ui-feed', items.length
    ? items.map(messageNode)
    : h('p.ui-empty', tab === 'whatsapp' ? 'Le groupe est calme. Pour une fois.' : tab === 'press' ? 'Rien dans le journal. La rue des Bouchers attend son heure.' : 'Aucune publication. Le bloc prépare sûrement quelque chose.'));
  return h('div.ui-phone', { dataset: { testid: 'phone' } },
    h('div.ui-phone-tabs', FEEDS.map((t) => h(`button${t === tab ? '.on' : ''}`, { onclick: () => onTab(t), dataset: { tab: t } },
      TABS[t], t !== tab && count(t) ? h('span.ui-badge', count(t)) : null))),
    feed,
    h('button.ui-btn.center', { onclick: onClose, dataset: { testid: 'phone-close' } }, `Ranger le téléphone (${keyHint('T')})`));
}
