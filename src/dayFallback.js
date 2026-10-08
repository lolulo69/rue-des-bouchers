// Interface de jour minimale (repli) tant que src/ui/index.js (agent UI) n'existe pas : même contrat que mountDayUI.
//   mountFallbackUI({ campaign, root, onSave, onNight, onQuit, onNew }) → { show(), hide(), destroy() }
// Volontairement sobre : elle sert à jouer la boucle de campagne de bout en bout et aux tests e2e.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const WEEKDAY = { mon: 'lundi', tue: 'mardi', wed: 'mercredi', thu: 'jeudi', fri: 'vendredi', sat: 'samedi', sun: 'dimanche' };
const PHASE = { morning: 'Matin · Koddex', afternoon: 'Après-midi', night: 'Nuit' };

export function mountFallbackUI({ campaign: c, root, onSave, onNight, onNew }) {
  let notice = '';
  const stats = () => {
    const s = c.state.stats;
    return `<div class="fb-stats">Sommeil ${Math.round(s.sleep)} · Asso ${Math.round(s.asso)} · Risque ${Math.round(s.risk)} · Job ${Math.round(s.job)} · Dossier ${Math.round(s.dossier)}/100</div>`;
  };
  const header = () => `<h2>Jour ${c.state.day} · ${WEEKDAY[c.weekday()]}${c.isSaturday() ? ' (samedi sans voitures)' : ''} — ${PHASE[c.state.phase]}</h2>${stats()}`;
  const btn = (act, label, extra = '') => `<button data-act="${act}" ${extra}>${esc(label)}</button>`;

  function body() {
    switch (c.step) {
      case 'cards': {
        const card = c.card();
        const d = card.data ?? card;
        const who = d.speaker ? `<p class="fb-speaker">${esc(c.content.CHARACTERS[d.speaker]?.name ?? d.speaker)}</p>` : '';
        const lines = (d.lines ?? []).map((l) => `<p>« ${esc(l)} »</p>`).join('');
        return `<div class="fb-card">${who}<h3>${esc(d.title ?? '')}</h3><p>${esc(d.text ?? '')}</p>${lines}</div>
          ${card.choices.map((ch) => btn(`card:${ch.i}`, ch.label, ch.available ? '' : 'disabled')).join('')}`;
      }
      case 'koddex': {
        const o = c.koddexOptions();
        const opts = [...(o.work.length ? o.work.map((w) => `<option value="${esc(w.id)}">Vrai travail : ${esc(w.label)}</option>`) : ['<option value="work">Vrai travail : le backlog</option>']),
          ...o.sideProjects.filter((p) => p.available).map((p) => `<option value="${esc(p.id)}">Projet perso : ${esc(p.label)}</option>`)].join('');
        const gag = o.gag ? (o.gag.lines ?? []).map((l) => `<p>${esc(typeof l === 'string' ? l : l.text)}</p>`).join('') : '';
        return `<div class="fb-term"><p>$ clode-kode --prompts ${o.prompts}</p>${gag}</div>
          ${Array.from({ length: o.prompts }, (_, i) => `<label>Prompt ${i + 1} <select data-prompt="${i}">${opts}</select></label>`).join('')}
          ${btn('koddex', 'Envoyer à Clode Kode')}`;
      }
      case 'actions': {
        const acts = c.availableActions();
        return `<p>Créneaux restants : ${c.state.timeLeft}</p>
          ${acts.map((a) => btn(`do:${a.id}`, `${a.label}${a.legality === 'illegal' ? ' (illégal)' : a.legality === 'grey' ? ' (limite)' : ''}${(a.cost?.time ?? 1) > 1 ? ` · ${a.cost.time} créneaux` : ''}`)).join('')}
          ${btn('end-afternoon', 'Finir l\'après-midi')}`;
      }
      case 'night':
        return `<p>La nuit tombe sur la rue des Bouchers.</p>${btn('night', 'Descendre dans la nuit')}`;
      case 'recap': {
        const n = c.state.nights.at(-1);
        const R = c.state.lastNight;
        return `<div class="fb-card"><h3>Bilan de la nuit</h3>
          <p>${R?.verdict?.map(esc).join('<br>') ?? ''}</p>
          <p>Sommeil de la nuit ${n?.sleep ?? '?'} · ${n?.evidence ?? 0} pièce(s) · +${n?.gained ?? 0} au dossier</p></div>
          ${btn('next-day', c.state.day >= c.cfg.CAMPAIGN.days ? 'Le verdict' : 'Jour suivant')}`;
      }
      case 'ended': {
        const e = c.state.ending;
        return `<div class="fb-card"><h3>${esc(e.title)}</h3>${c.state.epilogue.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
          ${e.canContinue ? btn('continue', e.continueLabel ?? 'Continuer') : ''}${btn('new', 'Nouvelle campagne')}`;
      }
      default: return '';
    }
  }

  function render() {
    root.innerHTML = `<div class="fb">${header()}${notice ? `<p class="fb-notice">${esc(notice)}</p>` : ''}${body()}</div>`;
    notice = '';
  }

  root.addEventListener('click', (ev) => {
    const act = ev.target.closest('button')?.dataset.act;
    if (!act) return;
    if (act.startsWith('card:')) notice = c.resolveCard(Number(act.slice(5))) ?? '';
    else if (act === 'koddex') {
      notice = c.koddex([...root.querySelectorAll('select[data-prompt]')].map((s) => s.value))
        .map((l) => (typeof l === 'string' ? l : `${c.content.CHARACTERS[l.speaker]?.name ?? l.speaker ?? ''} : ${l.text}`)).join(' · ');
    }
    else if (act.startsWith('do:')) { const r = c.doAction(act.slice(3)); notice = [r.result, r.seen.length ? `Vu par : ${r.seen.map((w) => w.id).join(', ')}` : ''].filter(Boolean).join(' · '); }
    else if (act === 'end-afternoon') c.endAfternoon();
    else if (act === 'night') return onNight();
    else if (act === 'next-day') c.nextDay();
    else if (act === 'continue') c.continueAfterEnding();
    else if (act === 'new') return onNew();
    onSave();
    render();
  });

  return {
    show() { root.classList.remove('hidden'); render(); },
    hide() { root.classList.add('hidden'); },
    destroy() { root.innerHTML = ''; root.classList.add('hidden'); },
  };
}
