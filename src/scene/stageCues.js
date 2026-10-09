// Repères de mise en scène des lignes de nuit (§12e.6 « ça existe ou ça n'existe pas »), d'après la proposition du
// contenu (qa/stage-cues.md). Données pures (aucun import) : le contenu étiquette ses lignes, le vérificateur de
// cohérence valide, le metteur en scène (src/scene/stage.js) joue.
//
// Format d'une ligne : stage: { cue: '<id>', at?: '<ancre>', dur?: secondes }
//   • cue : une clé de STAGE_CUES, ou un motif de STAGE_CUE_PATTERNS (twist:<twistId>:<n>, event:<id>, witness:<kind>)
//   • at  : une clé de STAGE_ANCHORS (facultatif : chaque repère a sa place par défaut)
// Chaque repère : { stage, opts?, desc, status } — stage = la scène jouée par la bibliothèque ; status 'live' (jouée par
// le metteur en scène), 'system' (déjà mise en scène par son système : police, sim, cloche) ou 'ui' (montrée par le HUD).

export const STAGE_ANCHORS = ['under_window', 'terrace', 'door_10', 'end_A', 'end_B', 'balcony_13', 'window_19', 'window_klaas', 'corner'];

const C = (stage, desc, opts = undefined, status = 'live') => ({ stage, desc, ...(opts ? { opts } : {}), status });

export const STAGE_CUES = {
  // ---- passages (quelqu'un traverse la rue) ----
  'pass:scooter': C('scooter', 'un scooter remonte la rue en zigzag (moteur deux-temps)'),
  'pass:drunk_singer': C('drunk_singer', 'un passant éméché chante en marchant'),
  'pass:delivery_rider': C('delivery_rider', 'un livreur à vélo tourne dans la rue, téléphone à la main'),
  'pass:heels': C('passerby', 'des talons sur les pavés, un juron', { heels: true, swear: true }),
  'pass:suitcase': C('passerby', 'une valise à roulettes sur les pavés', { suitcase: true }),
  'pass:cyclist_bell': C('bike', 'un cycliste insiste sur sa sonnette', { bell: 3 }),
  'pass:bike_singer': C('bike', 'un V’Lille passe, le cycliste chante', { sing: true, bell: 2 }),
  'pass:student_group': C('student_choir', 'une bande d’étudiants passe en chantant'),
  'pass:kid_scooter': C('kid_scooter', 'un enfant en trottinette, son père derrière'),
  'pass:bachelor_party': C('bachelor_party', 'un enterrement de vie de garçon déguisé passe en chantant'),
  'pass:ambulance': C('ambulance', 'une ambulance remonte la rue au pas, gyrophare'),
  'pass:jogger': C('passerby', 'un joggeur à lampe frontale', { jogger: true }),
  'pass:street_sweeper': C('street_sweeper', 'la balayeuse passe au bout de la rue et fait demi-tour', { pass: 'end' }),
  'pass:runner': C('passerby', 'quelqu’un court vers le bout de la rue en criant', { run: true, shout: true }),
  'pass:passerby': C('passerby', 'un passant traverse la rue'),
  'pass:dog_walker': C('dog_walker', 'quelqu’un promène son chien'),
  // ---- personnages de passage qui s'arrêtent ----
  'npc:couple_argue': C('couple_argue', 'un couple se dispute (sous la fenêtre par défaut)'),
  'npc:tourist_asks': C('tourist_lost', 'un touriste demande son chemin à la terrasse, qui pointe dans tous les sens'),
  'npc:guitarist': C('guitarist', 'un musicien s’installe à l’angle et joue'),
  'npc:guitarist_leaves': C('guitarist', 'le musicien range et s’en va', { leave: true }),
  'npc:taxi_waits': C('taxi', 'un taxi attend au bout de la rue, warnings allumés'),
  'npc:lost_keys': C('passerby', 'un homme cherche ses clés à la lumière de son téléphone', { lostKeys: true }),
  // ---- personnages de la rue ----
  'char:gaufre_edge': C('gaufre_balcony', 'Gaufre au bord du balcon d’en face'),
  'char:ghislain_smoke': C('ghislain_smoke', 'Ghislain fume sur le pas de la porte et lève les yeux'),
  'char:dede_laugh': C('dede_laugh', 'le rire de Dédé (à sa porte)'),
  'char:klaas_lamp_on': C('window_opens', 'la lampe de Klaas s’allume, place Maurice-Schumann', { who: 'klaas' }),
  'char:hilde_curtain': C('window_opens', 'le rideau de Hilde bouge, une silhouette', { who: 'hilde' }),
  'char:tatie_window': C('window_opens', 'Tatie ouvre sa fenêtre, renifle, referme', { who: 'tatie' }),
  'char:jeremie_light': C('window_opens', 'une lumière au 3e chez Jérémie', { who: 'jeremie' }),
  'char:seb_nico_laugh': C('seb_nico_laugh', 'Seb et Nico rient sur leur balcon'),
  'char:waiter_board': C('waiter_board', 'le serveur efface l’ardoise'),
  'char:waiter_sits_smoke': C('waiter_smoke', 'le serveur s’assoit en terrasse avec une cigarette'),
  'char:waiter_glasses': C('waiter_setup', 'le serveur aligne les verres'),
  'char:klaas_glint': C('binoculars_glint', 'un reflet au bout de la rue : les jumelles de Klaas'),
  'win:opposite_opens': C('window_opens', 'en face, une fenêtre s’ouvre, quelqu’un regarde, referme'),
  // ---- à une table ----
  'table:phone_loud': C('phone_loud', 'un client téléphone en haut-parleur'),
  'table:toast': C('toast', 'une table se lève et trinque'),
  'table:glass_break': C('glass_breaks', 'un verre se brise, applaudissements'),
  'table:chair_falls': C('chair_falls', 'une chaise tombe, le serveur la relève'),
  'table:group_photo': C('group_photo', 'photo de groupe au flash'),
  'table:pigeon': C('pigeon', 'un pigeon vole une frite sur une table'),
  // ---- objets, effets ----
  'prop:bottle_roll': C('bottle_rolls', 'une bouteille roule sur les pavés jusqu’à un pied de chaise'),
  'prop:ac_drip': C('ac_drip', 'la clim goutte sous la fenêtre'),
  'prop:parasol_snap': C('umbrella_flap', 'un parasol claque, on le referme'),
  'prop:glass_tower': C('glass_stack', 'une tour de gobelets sur le rebord de la porte'),
  'prop:board_malunes': C('ardoise', 'l’ardoise des Mal Lunés devant leur terrasse'),
  'fx:exhaust_puff': C('exhaust_cough', 'la gaine tousse une bouffée de friture', undefined),
  'fx:exhaust_puff_big': C('exhaust_cough', 'grosse bouffée de friture', { big: true }),
  'light:sunset_gables': C('sunset', 'le soleil couchant sur les pignons'),
  'rain:drops': C('rain_look', 'quelques gouttes : la terrasse lève les yeux'),
  'rain:umbrellas': C('rain_umbrellas', 'les parapluies s’ouvrent en terrasse'),
  'rain:gutter': C('gutter', 'la gouttière d’en face déborde'),
  'crowd:sing': C('crowd_song', 'une terrasse chante en chœur'),
  // ---- audio seul (entendu, à une position) ----
  'audio:bell_far': C('bells', 'la cloche de Saint-Maurice sonne le quart', { n: 1 }),
  'audio:bell_22_tail': C('bells', 'la dernière note de 22h', { n: 1, soft: true }),
  'audio:dog_far': C('dog_far', 'un chien aboie vers la place (on le voit, petit)'),
  'audio:song_far': C('birthday_far', 'une terrasse plus loin chante « Joyeux anniversaire »'),
  'audio:siren_far': C('police_car_far', 'une sirène passe rue de la Barre (gyrophare au bout de la rue)'),
  'audio:shout_high': C('window_opens', 'une voix crie depuis une fenêtre', { who: 'neighbour', shout: true }),
  'audio:wedding_horn': C('wedding_car', 'klaxons de mariage au bout de la rue'),
  'audio:cat_fight': C('cat_fight', 'deux chats se disputent dans l’impasse'),
  'audio:quiet_dip': C('quiet', 'la rue se tait un instant'),
  'audio:owl': C('owl', 'un hibou (ou un client)'),
  'audio:snore': C('snore', 'un ronflement depuis un balcon'),
  // ---- génériques (lignes des systèmes de nuit) ----
  bark: C('talk', 'un client parle (voix, à une table dehors)', { mood: 'calm' }),
  bark_shout: C('talk', 'quelqu’un crie dans la rue', { mood: 'shout' }),
  klaas_writes: C('binoculars_glint', 'Klaas à sa fenêtre, carnet et jumelles'),
  klaas_lamp_off: C('window_opens', 'Klaas éteint sa lampe (elle s’éteint au bout de la rue)', { who: 'klaas', off: true }),
  waiter_reply: C('waiter_reply', 'le serveur se tourne vers Pilou, un geste (opts.gesture : shrug | nod | point), une réponse'),
  bell_22: C('bells', 'les dix coups de 22h (sonnés par l’ambiance de la rue, automatiquement)', { n: 0 }, 'system'),
  round_note: C('round_note', 'Jérémie s’arrête et note dans son carnet'),
  db_meter: C('talk', 'le téléphone de Pilou affiche les dB (mis en scène par le HUD)', undefined, 'ui'),
  phone_buzz: C('talk', 'le téléphone de Pilou vibre (mis en scène par le HUD et son son)', undefined, 'ui'),
  police_cafe: C('talk', 'café offert à la patrouille (mis en scène par la police : tasses, Dédé)', undefined, 'system'),
  police_tipoff: C('talk', 'les tables rentrent avant la police (mis en scène par la sim : chaises qui raclent)', undefined, 'system'),
  pee: C('talk', 'quelqu’un urine dans une porte (mis en scène par la sim)', undefined, 'system'),
};

// Motifs : twist:<twistId>:<n> (n-ième événement / fenêtre du twist, joué par la scène du twist), event:<id> (événement
// à carte), witness:<kind> (ce témoin se tourne et regarde ; les clients lèvent leur téléphone si filmé)
export const STAGE_CUE_PATTERNS = [/^twist:[a-z0-9_]+:\d+$/, /^event:[a-z0-9_]+$/, /^witness:[a-z0-9_]+$/];

export const isStageCue = (cue) => typeof cue === 'string' && (cue in STAGE_CUES || STAGE_CUE_PATTERNS.some((re) => re.test(cue)));
// Valide un repère de ligne ({ cue, at?, dur? } ou une chaîne) ; renvoie null si bon, sinon la raison
export function stageCueError(stage) {
  const s = typeof stage === 'string' ? { cue: stage } : stage;
  if (!s || typeof s !== 'object') return 'pas de repère de scène';
  if (!isStageCue(s.cue)) return `repère inconnu « ${s.cue} »`;
  if (s.at !== undefined && !STAGE_ANCHORS.includes(s.at)) return `ancre inconnue « ${s.at} »`;
  if (s.dur !== undefined && !(Number.isFinite(s.dur) && s.dur > 0 && s.dur <= 600)) return `durée invalide « ${s.dur} »`;
  return null;
}
// Lignes jugées impossibles à mettre en scène (à retirer ou conditionner côté contenu)
export const UNSTAGEABLE = { window_lamp: 'reflet du visage de Pilou dans la vitre : seulement si Pilou est à la fenêtre (state: { at: "window" }), sinon à retirer' };
