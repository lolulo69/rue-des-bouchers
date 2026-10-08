// Le téléphone de Pilou : groupe WhatsApp, presse, réseaux.
// Source : src/content/media.js (MEDIA) s'il existe, sinon l'historique des cartes vues pendant la campagne.
// MEDIA attendu : [{ id, channel: 'whatsapp'|'press'|'social', speaker?, author?, when?, text, title? }]
import { h, portrait, nameOf } from './dom.js';
import { WHATSAPP_GROUP } from '../content/characters.js';

const MEDIA_MODULES = import.meta.glob('../content/media.js', { eager: true });
const RAW_MEDIA = Object.values(MEDIA_MODULES)[0]?.MEDIA ?? [];
// media.js exporte { whatsapp: [...], press: [...], social: [...] } (§14) : on aplatit en entrées avec `channel`.
// Les entrées `ending` ne s'affichent que sur l'écran de fin.
const MEDIA = Array.isArray(RAW_MEDIA) ? RAW_MEDIA : Object.entries(RAW_MEDIA)
  .flatMap(([channel, list]) => list.filter((m) => !m.ending).map((m) => ({ ...m, channel, title: m.title ?? m.headline })));

const TABS = [
  { id: 'whatsapp', label: '💬 ' + WHATSAPP_GROUP },
  { id: 'press', label: '📰 Presse' },
  { id: 'social', label: '📣 Réseaux' },
];

// Classe une carte vue dans un canal du téléphone (repli sans media.js)
export function channelOfCard(card) {
  const who = card.speaker;
  if (card.type === 'countermove' && /post|réseaux|partages|en ligne/i.test(card.text)) return 'social';
  if (/Voix du Nordiste|article|journal|manchette/i.test(card.text) || who === 'journaliste') return 'press';
  if (['seb', 'nico', 'jeremie', 'klaas', 'hilde', 'tatie', 'hippolyte', 'regis'].includes(who)) return 'whatsapp';
  if (card.type === 'countermove') return 'social';
  return null;
}

export function feedItems(c, history) {
  const items = [];
  for (const m of MEDIA) {
    if (m.when && !c.check(m.when, false)) continue;
    items.push({ channel: m.channel, speaker: m.speaker, author: m.author, title: m.title, text: m.text, day: m.when?.day?.[0] });
  }
  for (const e of history) {
    const ch = e.channel ?? channelOfCard(e);
    if (ch) items.push({ ...e, channel: ch });
  }
  return items;
}

export function phoneView(c, history, { tab = 'whatsapp', onTab, onClose }) {
  const items = feedItems(c, history).filter((i) => i.channel === tab).slice(-40).reverse();
  const feed = h('div.ui-feed', items.length
    ? items.map((i) => h(`div.ui-msg.${i.channel}`,
      i.speaker ? portrait(i.speaker, 'neutral', 'sm') : null,
      h('div.ui-bubble',
        h('span.who', i.author ?? (i.speaker ? nameOf(i.speaker) : i.title ?? '')),
        i.title && i.speaker ? h('b', i.title) : null,
        h('p', i.text),
        i.day ? h('time', `jour ${i.day}`) : null)))
    : h('p.ui-empty', tab === 'whatsapp' ? 'Le groupe est calme. Pour une fois.' : tab === 'press' ? 'Rien dans le journal. La rue des Bouchers attend son heure.' : 'Aucune publication. Le bloc prépare sûrement quelque chose.'));
  return h('div.ui-phone', { dataset: { testid: 'phone' } },
    h('div.ui-phone-tabs', TABS.map((t) => h(`button${t.id === tab ? '.on' : ''}`, { onclick: () => onTab(t.id), dataset: { tab: t.id } }, t.label))),
    feed,
    h('button.ui-btn.center', { onclick: onClose, dataset: { testid: 'phone-close' } }, 'Ranger le téléphone'));
}
