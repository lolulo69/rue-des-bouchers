// Contenu minimal au format §14, pour tester le moteur sans dépendre de l'écriture (src/content).
// Ce n'est pas du contenu de jeu : juste de quoi exercer chaque mécanisme (conditions, effets, fins, épilogues).
export const FLAGS = {
  // posés par le moteur
  night_photo: '', night_db: '', corridor_measured: '', called_police: '', called_as_asso: '', seen_complaisance: '',
  seen_tipoff: '', serial_caller: '', benali_fined: '', benali_transferred: '', chief_came: '', saw_pee: '', pee_at_door: '',
  bucket_used: '', bucket_witnessed: '', video_viral: '', klaas_noted_pilou: '', talked_waiter: '', bribe_photo: '',
  bribe_photo_illegal: '', corruption_proof: '', inquiry_open: '', lemaire_transferred: '', unemployed: '', custody: '',
  saturday1_done: '', saturday2_done: '', boss_noticed: '',
  // test
  met_klaas: '', stance_legal: '', stance_direct: '', stance_dialogue: '', petition_started: '', press_contacted: '',
  won_legal: '', won_peace: '', commission_won: '', commission_lost: '', commission_done: '', carbonnade_1: '', carbonnade_2: '', carbonnade_3: '',
  bombance_bar_project: '', cm_bins: '', cm_harassment_complaint: '', proj_db_logger: '', proj_fake_reviews: '', stink_bomb: '',
  disguise_hood: '', martine_seen: '', random_drache: '', twist_colette_seen: '', lescaut_meeting: '',
};

export const CHARACTERS = { pilou: { name: 'Pilou' }, klaas: { name: 'Klaas' }, jeremie: { name: 'Jérémie' }, dede: { name: 'Dédé' } };

export const DIALOGUE = [
  { id: 'klaas_hello', speaker: 'klaas', when: { day: [1, 3] }, lines: ['Bonjour, voisin. Je note.'], effects: { setFlags: ['met_klaas'], asso: 1 }, once: true },
  { id: 'jeremie_tired', speaker: 'jeremie', when: { stats: { sleep: '<40' } }, lines: ['Tu as une petite mine, hein.'], once: true },
];

export const EVENTS = [
  { id: 'martine_dinner', day: 4, phase: 'night', title: 'Le dîner de Colette', text: 'Colette Verhaeghe dîne à l\'estaminet.', choices: [
    { label: 'Regarder', effects: { setFlags: ['martine_seen'] }, result: 'Elle commande la carbonnade.' },
  ] },
  { id: 'ag', day: 7, phase: 'afternoon', title: 'Assemblée générale', text: 'Quelle stratégie ?', choices: [
    { label: 'Voie légale', effects: { setFlags: ['stance_legal'], asso: 5 } },
    { label: 'Action directe', effects: { setFlags: ['stance_direct'], asso: -5 } },
    { label: 'Dialogue', effects: { setFlags: ['stance_dialogue'], hostility: -10 } },
  ] },
  { id: 'commission', day: 14, phase: 'afternoon', title: 'La commission', text: 'Plaidez.', choices: [
    { label: 'Le dossier', requires: { stats: { dossier: '>=60', risk: '<60' } }, effects: { setFlags: ['won_legal', 'commission_won', 'commission_done'] } },
    { label: 'La paix', requires: { flags: ['stance_dialogue'], stats: { asso: '>=60' } }, effects: { setFlags: ['won_peace', 'commission_won', 'commission_done'] } },
    { label: 'Improviser', effects: { setFlags: ['commission_lost', 'commission_done'] } },
  ] },
  { id: 'drache', phase: 'afternoon', when: { chance: 0.1 }, once: true, title: 'Drache', text: 'Il pleut.', effects: { setFlags: ['random_drache'], sleep: 3 } },
];

export const ACTIONS = [
  { id: 'petition', label: 'Lancer une pétition', phase: 'afternoon', legality: 'legal', cost: { time: 1 }, effects: { asso: 3, dossier: 2, setFlags: ['petition_started'] } },
  { id: 'evidence_mail', label: 'Classer les e-mails', phase: 'afternoon', legality: 'legal', cost: { time: 1 }, effects: { evidence: { kind: 'emails', quality: 0.8, legal: true, label: 'Fil d\'e-mails' } } },
  { id: 'press', label: 'Appeler la presse', phase: 'afternoon', legality: 'legal', cost: { time: 1 }, once: true, requires: { flags: ['corruption_proof'] }, effects: { setFlags: ['press_contacted'] } },
  { id: 'mediation', label: 'Médiation', phase: 'afternoon', legality: 'legal', cost: { time: 2 }, requires: { flags: ['stance_dialogue'] }, effects: { hostility: -10, asso: 4 } },
  { id: 'hood', label: 'Acheter une capuche', phase: 'afternoon', legality: 'legal', cost: { time: 1 }, once: true, effects: { setFlags: ['disguise_hood'] } },
  { id: 'carbonnade_1', label: 'Manger la carbonnade', phase: 'afternoon', legality: 'grey', cost: { time: 1 }, once: true, effects: { setFlags: ['carbonnade_1'] } },
  { id: 'carbonnade_2', label: 'Reprendre de la carbonnade', phase: 'afternoon', legality: 'grey', cost: { time: 1 }, once: true, requires: { flags: ['carbonnade_1'] }, effects: { setFlags: ['carbonnade_2'] } },
  { id: 'carbonnade_3', label: 'Devenir un habitué', phase: 'afternoon', legality: 'grey', cost: { time: 1 }, once: true, requires: { flags: ['carbonnade_2'] }, effects: { setFlags: ['carbonnade_3'] } },
  { id: 'fake_reviews', label: 'Publier de faux avis', phase: 'afternoon', legality: 'illegal', cost: { time: 1 }, effects: { hostility: 5 }, witnessed: { exposure: 0.4, by: ['dede', 'customers'], effects: { risk: 25 } } },
  { id: 'stink_bomb', label: 'Boule puante', phase: 'night', legality: 'illegal', at: 'street', effects: { setFlags: ['stink_bomb'], hostility: 5 }, witnessed: { exposure: 0.6, by: ['customers', 'waiter', 'klaas', 'biloute'], effects: { risk: 25, asso: -5 } }, result: 'Ça empeste.' },
  { id: 'photo_bonus', label: 'Photo', phase: 'night', legality: 'legal', sim: 'photo', effects: { asso: 1 } },
];

export const COUNTERMOVES = [
  { id: 'cm_bins', title: 'Les poubelles', when: { hidden: { hostility: '>=40' }, chance: 0.5 }, text: 'Des poubelles devant ta porte.', effects: { sleep: -3, setFlags: ['cm_bins'] } },
  { id: 'cm_bombance', title: 'La Bombance', when: { day: [10, 14], chance: 0.3 }, text: 'Un projet de bar à La Bombance.', effects: { setFlags: ['bombance_bar_project'] }, once: true },
  { id: 'cm_complaint', title: 'Plainte', when: { flags: ['called_as_asso'] }, text: 'Plainte pour harcèlement.', effects: { risk: 10, setFlags: ['cm_harassment_complaint'] }, once: true },
];

export const KODDEX = {
  work: ['Corrige le bug de paiement.', 'Écris les tests.'],
  sideProjects: [
    { id: 'db_logger', label: 'Démon Rust de décibels', unlocks: 'proj_db_logger', job: -10, risk: 0, lines: ['cargo build --release'] },
    { id: 'fake_reviewer', label: 'Générateur de faux avis', unlocks: 'proj_fake_reviews', job: -10, risk: 15, lines: ['Clode Kode : « Je ne suis pas sûr que ce soit éthique. »'] },
  ],
  gags: ['Clode Kode a réécrit l\'appli de Stéphane en Rust. Encore.'],
};

export const ENDINGS = [
  { id: 'custody', title: 'Garde à vue', early: true, priority: 100, whenAny: [{ stats: { risk: '>=90' } }, { flags: ['custody'] }], epilogue: [{ text: 'Risque {risk}.' }] },
  { id: 'turncoat', title: 'Le transfuge', priority: 95, when: { flags: ['carbonnade_3'] }, epilogue: [{ text: 'Klaas a tout noté.' }] },
  { id: 'fired', title: 'Viré', priority: 90, when: { stats: { job: '<=0' } }, continue: { label: 'Continuer au chômage', effects: { asso: 5 } }, epilogue: [{ text: 'Stéphane parle de vibes.' }] },
  { id: 'moving_out', title: 'Wazemmes', priority: 80, whenAny: [{ stats: { sleep: '<=0' } }, { flags: ['commission_lost'] }], epilogue: [{ text: 'Au moins à Wazemmes, le bruit c\'est le matin.' }] },
  { id: 'scandal', title: 'Le scandale', priority: 70, when: { flags: ['corruption_proof', 'press_contacted'] }, epilogue: [{ text: 'La Voix du Nordiste titre sur {best}.' }] },
  { id: 'the_return', title: 'Le retour', priority: 65, when: { flags: ['commission_won', 'bombance_bar_project'] }, epilogue: [{ text: 'Un bar à La Bombance.' }] },
  { id: 'legal_victory', title: 'Victoire', priority: 60, when: { flags: ['won_legal'] }, epilogue: [{ text: 'Dossier {dossier}/100, {pieces} pièces.' }, { when: { flags: ['met_klaas'] }, text: 'Klaas sourit.' }] },
  { id: 'negotiated_peace', title: 'La paix', priority: 50, when: { flags: ['won_peace'] }, epilogue: [{ text: 'Une charte.' }] },
];
