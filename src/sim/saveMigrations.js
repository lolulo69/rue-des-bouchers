// Sauvegardes : schéma versionné, migrations, renommages d'ids du contenu, et nettoyage contre le contenu courant.
// Le contenu change pendant que les auteurs écrivent : une sauvegarde ne doit jamais planter parce qu'un drapeau
// ou un id a été renommé ou supprimé. Ce qui est renommé suit la table ; ce qui est inconnu est ignoré sans bruit.
export const SAVE_VERSION = 4;

// Renommages connus (ancien → nouveau). Ajouter ici chaque renommage d'id du contenu. (Les renommages des élus,
// antérieurs à toute sauvegarde publiée, n'y figurent pas : la garde des noms réels les refuserait.)
export const RENAMES = {
  flags: {
    igpn_open: 'inquiry_open',
    kitchen_sabotage_done: 'kitchen_sabotaged',
  },
  // Ids d'actions, d'événements, de dialogues, de contre-offensives, de médias (un seul espace de noms suffit)
  ids: {
    pm_igpn_report: 'pm_inquiry_report',
    press_igpn: 'press_inquiry',
    chef_igpn: 'chef_inquiry',
  },
};

export class SaveError extends Error {
  constructor(message, reason) { super(message); this.reason = reason; }
}

const renameFlag = (f) => RENAMES.flags[f] ?? f;
const renameId = (id) => RENAMES.ids[id] ?? RENAMES.flags[id] ?? id;
const renameKeys = (o = {}) => Object.fromEntries(Object.entries(o).map(([k, v]) => [renameId(k), v]));
const uniq = (a) => [...new Set(a)];

// Une migration par version : v → v + 1
const MIGRATIONS = {
  // v1 → v2 : champs ajoutés après la v0.4 (tutoriel, médias, gags), compteurs complets
  1: (s) => {
    s.seen = { events: [], dialogue: [], countermoves: [], actions: [], tutorial: [], media: [], ...(s.seen ?? {}) };
    s.counts = { actions: {}, events: {}, dialogue: {}, countermoves: {}, koddex: {}, ...(s.counts ?? {}) };
    s.witnessMemories ??= [];
    s.nights ??= [];
    s.cards ??= [];
    s.journal ??= [];
    s.version = 2;
    return s;
  },
  // v2 → v3 (v1.1) : twists de nuit et outils débloqués. Une campagne en cours n'a rien débloqué : on lui donne
  // tout ce que le contenu verrouille, pour ne pas retirer des verbes au joueur en pleine partie (voir campaign.js).
  2: (s) => {
    s.twistHistory ??= [];
    s.tonightTwist ??= null;
    s.unlocked ??= null; // null = « tout ce qui est verrouillable », résolu au chargement contre le contenu
    s.pushedMedia ??= [];
    s.version = 3;
    return s;
  },
  // v3 → v4 (§12b.D) : bureau / maison chaque jour ; le plan est recalculé au chargement (campaign.js), à la graine
  3: (s) => {
    s.workplaces ??= null;
    s.workplace ??= 'office';
    s.version = 4;
    return s;
  },
};

// → { save, notes } ; lève SaveError si la sauvegarde est illisible ou vient d'une version plus récente du jeu.
export function migrateSave(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.day !== 'number' || !raw.stats) {
    throw new SaveError('Cette sauvegarde est illisible.', 'malformed');
  }
  const s = structuredClone(raw);
  const notes = [];
  s.version ??= 1;
  if (s.version > SAVE_VERSION) {
    throw new SaveError('Cette sauvegarde vient d’une version plus récente du jeu.', 'future');
  }
  while (s.version < SAVE_VERSION) {
    const m = MIGRATIONS[s.version];
    if (!m) throw new SaveError(`Cette sauvegarde (v${s.version}) est trop ancienne pour être reprise.`, 'too-old');
    const from = s.version;
    m(s);
    notes.push(`migrée v${from} → v${s.version}`);
  }
  // Renommages d'ids
  const before = JSON.stringify([s.flags, s.seen, s.cards]);
  s.flags = uniq((s.flags ?? []).map(renameFlag));
  for (const k of Object.keys(s.seen)) s.seen[k] = (s.seen[k] ?? []).map(renameId); // pas de dédoublonnage : des listes répètent légitimement
  for (const k of Object.keys(s.counts)) s.counts[k] = renameKeys(s.counts[k]);
  s.cards = (s.cards ?? []).map((c) => ({ ...c, id: renameId(c.id) }));
  if (s.pendingEnding) s.pendingEnding = renameId(s.pendingEnding);
  if (JSON.stringify([s.flags, s.seen, s.cards]) !== before) notes.push('ids renommés');
  return { save: s, notes };
}

// Nettoyage contre le contenu chargé : les cartes en attente qui pointent vers un contenu disparu sont retirées
// (sinon c.card() n'aurait rien à afficher), une fin demandée inconnue est oubliée. Les drapeaux inconnus restent :
// ils ne gênent aucune condition et reviendront utiles si le contenu les réintroduit.
export function sanitizeSave(s, K) {
  const known = {
    event: new Set(K.EVENTS.map((e) => e.id)),
    dialogue: new Set(K.DIALOGUE.map((d) => d.id)),
    countermove: new Set(K.COUNTERMOVES.map((m) => m.id)),
  };
  const notes = [];
  const kept = s.cards.filter((c) => c.type === 'info' || known[c.type]?.has(c.id));
  if (kept.length !== s.cards.length) notes.push(`${s.cards.length - kept.length} carte(s) retirée(s) (contenu disparu)`);
  s.cards = kept;
  if (s.pendingEnding && !K.ENDINGS.some((e) => e.id === s.pendingEnding)) { notes.push(`fin « ${s.pendingEnding} » inconnue oubliée`); s.pendingEnding = null; }
  // Étape « cartes » vidée par le nettoyage : on la laisse au moteur (resolveCard / afterCards) — signalé ici
  return notes;
}

// Pour l'interface : la sauvegarde peut-elle être reprise ? { ok, message }
export function checkSave(raw) {
  if (!raw) return { ok: false, message: null };
  try {
    migrateSave(raw);
    return { ok: true, message: null };
  } catch (e) {
    return { ok: false, reason: e.reason ?? 'error', message: `${e.message} On ne peut pas la reprendre : commencez une nouvelle campagne (l’ancienne est gardée de côté).` };
  }
}
