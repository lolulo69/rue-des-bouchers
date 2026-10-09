// Parler aux gens la nuit (E / Ⓐ), GAME_DESIGN §12e.3 : la boîte de dialogue. Contenu : src/content/talk.js (contrat §14).
// Indépendant de l'API du moteur : le jeu fournit l'échange courant et la façon de choisir.
//
//   const talk = showTalk({
//     step: { speaker, say, choices: [{ i, label, available? }] },  // l'échange courant
//     onChoose: async (i) => ({ reply, next }),  // next = l'échange suivant, ou null quand la conversation se termine
//     onClose: () => {},                          // la boîte se ferme (Échap / Ⓑ / « Au revoir »)
//   });
// Clavier : 1–3 ou Entrée sur le choix focalisé, Échap pour partir. Manette : croix + Ⓐ, Ⓑ (via [data-pad-context]).
import './ui.css';
import { h, clear, portrait, nameOf } from './dom.js';

let current = null;
export const isTalkOpen = () => !!current;

export function showTalk({ step, onChoose, onClose, parent = document.body } = {}) {
  current?.close();
  const root = h('div#ui-talk.ui-root', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Conversation', dataset: { padContext: 'talk', testid: 'talk' } });
  parent.append(root);
  let busy = false;

  function draw(st, reply = null) {
    clear(root);
    const box = h('div.ui-talk-box');
    if (reply) box.append(h('div.ui-dialogue.ui-talk-reply', portrait(reply.speaker, 'neutral', 'lg'),
      h('div.ui-bubble', h('span.who', nameOf(reply.speaker)), h('p', reply.text))));
    if (st) {
      box.append(h('div.ui-dialogue', portrait(st.speaker, 'neutral', 'lg'), h('div.ui-bubble', h('span.who', nameOf(st.speaker)), h('p', st.say))));
      box.append(h('div.ui-col.ui-talk-choices', (st.choices ?? []).map((ch, k) => h('button.ui-action.ui-choice', {
        disabled: ch.available === false, dataset: { testid: 'talk-choice', i: ch.i ?? k },
        onclick: () => choose(st, ch.i ?? k),
      }, h('span.lbl', `${k + 1}. ${ch.label}`)))));
    } else {
      box.append(h('button.ui-btn.center', { dataset: { testid: 'talk-close' }, onclick: () => close() }, 'Au revoir'));
    }
    root.append(box);
    (root.querySelector('[data-testid=talk-choice]:not([disabled])') ?? root.querySelector('button'))?.focus();
  }
  async function choose(st, i) {
    if (busy) return;
    busy = true;
    const r = (await onChoose?.(i)) ?? {};
    busy = false;
    if (!current) return;
    draw(r.next ?? null, r.reply ? { speaker: st.speaker, text: r.reply } : null);
  }
  function onKey(e) {
    if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    const m = /^Digit([1-3])$/.exec(e.code);
    if (m) {
      const b = root.querySelectorAll('[data-testid=talk-choice]:not([disabled])')[Number(m[1]) - 1];
      if (b) { e.preventDefault(); b.click(); }
    }
    e.stopPropagation();
  }
  window.addEventListener('keydown', onKey, true);
  function close() {
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    current = null;
    onClose?.();
  }
  draw(step);
  current = { close, root };
  return current;
}
