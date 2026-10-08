// Le téléphone de Pilou : groupe WhatsApp, presse, réseaux (src/content/media.js via narrative.mediaFeed).
// Chaque entrée n'apparaît qu'une fois : à la lecture, l'UI la range dans l'historique (meta.feed, sauvegardé)
// et applique ses effets par le moteur (c.apply). Voir GAME_DESIGN, Build notes « narrative-wiring ».
import { h, portrait, nameOf } from './dom.js';
import { WHATSAPP_GROUP, PLACES } from '../content/characters.js';
import { mediaFeed } from '../sim/narrative.js';

export const FEEDS = ['whatsapp', 'press', 'social'];
const TABS = { whatsapp: '💬 ' + WHATSAPP_GROUP, press: '📰 Presse', social: '📣 Réseaux' };

// Relève les nouveaux messages (tous fils) : les ajoute à meta.feed, applique leurs effets. Renvoie le nombre de nouveautés.
export function pullFeed(c, meta) {
  meta.mediaSeen ??= [];
  meta.feed ??= [];
  const fresh = mediaFeed(c.state, c.state.day, { seen: meta.mediaSeen });
  let n = 0;
  for (const channel of FEEDS) {
    for (const m of fresh[channel] ?? []) {
      meta.mediaSeen.push(m.id);
      meta.feed.push({ id: m.id, channel, day: c.state.day, author: m.author, handle: m.handle, text: m.text, headline: m.headline, photo: m.photo, stars: m.stars, kind: m.kind });
      const effects = { ...(m.effects ?? {}) };
      if (m.setFlags?.length) effects.setFlags = [...(effects.setFlags ?? []), ...m.setFlags];
      if (Object.keys(effects).length) c.apply(effects, 'story', m.id);
      n++;
    }
  }
  if (meta.feed.length > 300) meta.feed.splice(0, meta.feed.length - 300);
  return n;
}

export const unread = (meta) => (meta.feed ?? []).filter((m) => !m.read).length;

function authorName(m) {
  if (m.handle) return m.handle;
  if (PLACES[m.author]) return PLACES[m.author].name;
  if (m.author === 'reviewer') return 'Un client';
  return nameOf(m.author);
}

export function phoneView(meta, { tab = 'whatsapp', onTab, onClose }) {
  const items = (meta.feed ?? []).filter((i) => i.channel === tab).slice(-40).reverse();
  for (const i of items) i.read = true;
  const feed = h('div.ui-feed', items.length
    ? items.map((i) => h(`div.ui-msg.${i.channel}`, { dataset: { media: i.id } },
      i.channel !== 'press' && !PLACES[i.author] && i.author !== 'reviewer' ? portrait(i.author, 'neutral', 'sm') : null,
      h('div.ui-bubble',
        h('span.who', authorName(i), i.stars ? ` · ${'★'.repeat(i.stars)}${'☆'.repeat(5 - i.stars)}` : ''),
        i.headline ? h('b', i.headline) : null,
        h('p', i.text),
        i.photo ? h('p', { style: { fontStyle: 'italic', opacity: 0.75 } }, `📷 ${i.photo}`) : null,
        h('time', `jour ${i.day}`))))
    : h('p.ui-empty', tab === 'whatsapp' ? 'Le groupe est calme. Pour une fois.' : tab === 'press' ? 'Rien dans le journal. La rue des Bouchers attend son heure.' : 'Aucune publication. Le bloc prépare sûrement quelque chose.'));
  return h('div.ui-phone', { dataset: { testid: 'phone' } },
    h('div.ui-phone-tabs', FEEDS.map((t) => h(`button${t === tab ? '.on' : ''}`, { onclick: () => onTab(t), dataset: { tab: t } }, TABS[t]))),
    feed,
    h('button.ui-btn.center', { onclick: onClose, dataset: { testid: 'phone-close' } }, 'Ranger le téléphone'));
}
