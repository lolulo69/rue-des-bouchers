// Twists et déblocages de test (format §14 v1.1). Contenu de remplacement pour les tests du moteur,
// pas le contenu du jeu (src/content/twists.js et unlocks.js, écrits par les auteurs).
const H = (h, m = 0) => h * 60 + m;
export const TWISTS = [
  { id: 'fx_martine', day: 4, title: 'Martine dîne à l’estaminet', intro: 'Ce soir, l’ancienne maire dîne en terrasse.', sim: { closeDelay: 25 }, props: ['martine_table'], lines: { recap: ['Martine a dîné jusqu’à minuit.'] }, after: { setFlags: ['twist_martine_seen'] } },
  { id: 'fx_birthday', pool: true, title: 'Anniversaire à la table 4', intro: 'Onze personnes à la table 4.', sim: { tables: [{ rest: 'bernadette', count: 11, label: 'table 4' }], events: [{ at: H(23, 40), text: 'Joyeux anniversaire ! (à tue-tête)', simEffect: { noise: 8 } }] }, props: ['candles'] },
  { id: 'fx_influencer', pool: true, title: 'Une influenceuse et son ring light', intro: 'Elle filme tout.', sim: { witnesses: [{ id: 'influencer', at: 'street', filming: true, p: 1 }] }, props: ['ring_light'], after: { media: ['wa_influencer'] } },
  { id: 'fx_match', pool: true, title: 'Match sur écran géant', intro: 'Un écran dehors.', sim: { noise: 1.3, events: [{ at: H(21, 40), text: 'BUT !', simEffect: { noise: 12, minutes: 3 } }] } },
  { id: 'fx_evjf', pool: true, title: 'EVJF au mégaphone', intro: 'Un enterrement de vie de jeune fille.', sim: { crowd: 1.3, noise: 1.15 } },
  { id: 'fx_van', pool: true, when: { weekday: 'sat' }, title: 'Camionnette dans le couloir', intro: 'Une camionnette garée au milieu.', sim: { corridorBlocked: true, opportunities: ['night_photo'] }, props: ['van'] },
  { id: 'fx_drache', pool: true, title: 'La drache', intro: 'Il va pleuvoir.', sim: { rain: true } },
  { id: 'fx_heat', pool: true, title: 'Canicule', intro: 'Fenêtres ouvertes.', sim: { noise: 1.3, closeDelay: 30 } },
  { id: 'fx_guide', pool: true, title: 'La visite du guide', intro: 'Un groupe de touristes.', sim: { witnesses: [{ id: 'guide', at: 'street', p: 0.5, from: H(21), to: H(22) }] } },
  { id: 'fx_students', pool: true, title: 'Soirée étudiante chez Régis', intro: 'Ça danse au-dessus.', sim: { noise: 1.2 } },
  { id: 'fx_busker', pool: true, title: 'Un musicien sous la fenêtre', intro: 'Accordéon.', sim: { events: [{ at: H(22, 10), text: 'L’accordéon attaque « Le P’tit Quinquin ».', simEffect: { noise: 6, minutes: 20 } }] } },
  { id: 'fx_blackout', pool: true, title: 'Coupure de courant', intro: 'Tout s’éteint.', sim: { darkness: 0.8, exhaustOff: true } },
  { id: 'fx_last_shift', pool: true, title: 'Dernier soir du serveur avant les vacances', intro: 'Il fait la fête.', sim: { closeDelay: 15, crowd: 1.1 } },
  { id: 'fx_fete_voisins', pool: true, title: 'Fête des voisins', intro: 'L’asso contre-programme.', sim: { crowd: 0.8 } },
  { id: 'fx_firemen', pool: true, title: 'Inspection des pompiers', intro: 'Le couloir est contrôlé.', sim: { opportunities: ['night_photo'] } },
  { id: 'fx_walk', pool: true, when: { flags: ['stance_dialogue'] }, title: 'La balade du maire', intro: 'Le maire passe à 23h.', sim: { events: [{ at: H(23), text: 'Le maire descend la rue.' }] } },
  { id: 'fx_quiet', pool: true, title: 'Soirée calme (pour une fois)', intro: 'Un mardi tranquille.', sim: { crowd: 0.7 } },
  { id: 'fx_ladies', pool: true, title: 'Les copines de Ghislain', intro: 'Une grande tablée.', sim: { tables: [{ rest: 'malunes', count: 9 }] } },
];
export const UNLOCKS = [
  { id: 'u_db', unlocks: { keys: ['B'], actions: ['night_db'] }, when: { day: [2, 14] }, card: { title: 'Nouveau : le relevé de décibels', text: 'B pour mesurer.', hint: 'B' } },
  { id: 'u_stink', unlocks: { actions: ['stink_bomb'] }, when: { flags: ['stance_direct'] }, card: { title: 'Nouveau : la boule puante', text: 'Pour les grands jours.' } },
  { id: 'u_petition', unlocks: { actions: ['petition'] }, when: { day: [3, 14] }, card: { title: 'Nouveau : la pétition', text: 'Faire signer la rue.' } },
];
