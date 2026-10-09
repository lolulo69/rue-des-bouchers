// Ouverture et tutoriel du jour 1 (GAME_DESIGN §2, §3, §11). Données pures : aucune logique, aucun DOM.
//
// INTRO_CARDS : ≤ 6 cartes courtes affichées avant la première matinée (« Suivant » / « Passer »).
//   { id, title, text, speaker? }
// TUTORIAL : invites douces, une seule fois chacune, déclenchées par la PREMIÈRE occurrence d'un événement.
//   { id, trigger, when?, text, once: true }
//   trigger : identifiant d'un déclencheur moteur (liste ci-dessous). `when` = conditions §14 (souvent day: [1, 1]).
//   Déclencheurs :
//     morning_start · first_prompt · afternoon_start · first_afternoon_action
//     night_start · near_door · at_window · first_photo · first_photo_blurry · corridor_needs_measure
//     bell_22 · first_phone · first_police_call · first_tipoff · first_complaisance
//     first_waiter · first_dossier · legal_view_toggle · near_bucket · first_witness · bed · night_end
// Touches (main.js) : ZQSD/WASD + souris, E interagir, P photo, T téléphone, Tab dossier, L vue légale, F seau, M muet.
import { WHATSAPP_GROUP } from './characters.js';

export const INTRO_CARDS = [
  {
    id: 'card_street',
    title: 'Rue des Bouchers, Vieux-Lille',
    text:
      "Une rue pavée de 150 mètres, ouverte en 1729. Aujourd’hui, c’est l’une des rues les plus « conviviales » de Lille. Il y a des terrasses du n°1 jusqu’à la place Maurice-Schumann. Et des gens qui habitent au-dessus.",
  },
  {
    id: 'card_pilou',
    title: 'Pilou',
    speaker: 'pilou',
    text:
      "Pierre-Louis Dubeton, dit Pilou. Développeur Rust chez Koddex, où il passe ses journées à écrire des prompts pour Clode Kode. Deuxième étage du n°10. Il ne dort plus vraiment depuis le printemps.",
  },
  {
    id: 'card_exhaust',
    title: 'Sous la fenêtre',
    text:
      "Au rez-de-chaussée : l’Estaminet La Ch’tite Bernadette. Sa gaine d’extraction monte le long de la façade jusque sous la fenêtre de Pilou. Elle ronronne et souffle de la friture jusqu’à 23h30. Une clim est apparue sur la façade, sans autorisation : une inspectrice de la mairie est passée, le dossier est ouvert. L’estaminet, lui, répond à tout que « c’est en cours de résolution ».",
  },
  {
    id: 'card_rules',
    title: 'La règle',
    text:
      "Depuis cette année, rue des Bouchers, les terrasses ferment à 22h00, tous les soirs. Six personnes par table, maximum. Un couloir libre au milieu de la rue, pour les poussettes, les fauteuils et les pompiers. Ailleurs dans le Vieux-Lille, on ferme plus tard, et les restaurateurs vous le rappelleront souvent.",
  },
  {
    id: 'card_asso',
    title: "L’Association de la rue des Bouchers",
    speaker: 'jeremie',
    text: `Jérémie, le président, et son teckel Biloute. Klaas, qui voit tout depuis la place et note tout, et Hilde, qui soigne tout le monde. Tatie Bouchon et ses e-mails. Seb et Nico, en face, qui tiennent le groupe « ${WHATSAPP_GROUP} ». Hippolyte et sa vieille carrosserie. Ils sont fatigués, eux aussi.`,
  },
  {
    id: 'card_goal',
    title: 'Quatorze nuits',
    text:
      "Dans deux semaines, la commission des terrasses statuera à la mairie. D’ici là : des preuves, des alliés, et un peu de sommeil si possible. Vous pouvez rester dans les clous, ou pas. La rue regarde. Klaas aussi.",
  },
];

export const TUTORIAL = [
  // ── Matin (Koddex) ─────────────────────────────────────────────────────
  {
    id: 'tuto_morning',
    trigger: 'morning_start',
    when: { day: [1, 1] },
    once: true,
    text:
      "Le matin, c’est Koddex. Vous avez 3 prompts pour Clode Kode. Du vrai travail fait monter la jauge Travail. Un projet perso peut aider la lutte, mais Stéphane finira par le remarquer.",
  },
  {
    id: 'tuto_first_prompt',
    trigger: 'first_prompt',
    once: true,
    text: "Clode Kode est très poli, toujours. Il refusera aussi poliment tout ce qui n’est pas légal. Ça ne vous empêchera pas d’essayer, mais vous serez seul.",
  },
  // ── Après-midi (association) ───────────────────────────────────────────
  {
    id: 'tuto_afternoon',
    trigger: 'afternoon_start',
    when: { day: [1, 1] },
    once: true,
    text:
      "L’après-midi, vous avez 3 créneaux : association, mairie, presse, avocat… C’est aussi le moment où le bloc des restaurateurs réplique. Commencez simple : allez parler à vos voisins.",
  },
  {
    id: 'tuto_first_afternoon_action',
    trigger: 'first_afternoon_action',
    once: true,
    text: "Chaque action a un coût et des conséquences. Certaines plaisent à Hilde, d’autres à Seb et Nico. Rarement aux deux.",
  },
  // ── Nuit (3D) ──────────────────────────────────────────────────────────
  {
    id: 'tuto_night',
    trigger: 'night_start',
    when: { day: [1, 1] },
    once: true,
    text: '20h30. Déplacez-vous avec ZQSD (ou WASD) et la souris. La nuit dure jusqu’à 2h30 (elle file plus vite après 22h30). Les menus mettent le jeu en pause.',
  },
  {
    id: 'tuto_door',
    trigger: 'near_door',
    once: true,
    text: 'E pour interagir : la porte de l’immeuble mène à la rue, l’escalier à votre appartement.',
  },
  {
    id: 'tuto_window',
    trigger: 'at_window',
    once: true,
    text: "Depuis votre fenêtre, vous voyez la terrasse de l’estaminet. Vous la voyez, mais elle aussi peut vous voir. Ici, l’œil 👁 liste les témoins possibles.",
  },
  {
    id: 'tuto_photo',
    trigger: 'first_photo',
    once: true,
    text: 'P pour photographier. Une table à plus de 6, ou encore dehors après 22h00 (plus 5 minutes de tolérance), devient une pièce du dossier. Heure, décibels et nombre de personnes sont notés automatiquement.',
  },
  {
    id: 'tuto_photo_blurry',
    trigger: 'first_photo_blurry',
    once: true,
    text: 'Photo floue : vous manquez de sommeil. Une pièce floue vaut moins devant la commission. Dormir, c’est aussi travailler le dossier.',
  },
  {
    id: 'tuto_corridor',
    trigger: 'corridor_needs_measure',
    once: true,
    text: 'Une table mord sur le couloir de passage ? Ça ne se prouve pas depuis la fenêtre. Descendez dans la rue avec votre mètre ruban et photographiez à moins de 5 mètres.',
  },
  {
    id: 'tuto_legal_view',
    trigger: 'legal_view_toggle',
    once: true,
    text: 'L : vue légale. En vert, les zones autorisées. En rouge, le couloir qui doit rester libre. Rien de tout ça n’est tracé au sol, évidemment.',
  },
  {
    id: 'tuto_bell',
    trigger: 'bell_22',
    when: { day: [1, 1] },
    once: true,
    text: "22h00 : la cloche. Écoutez les chaises racler les pavés : c’est le bruit d’une terrasse qui rentre. Le silence, lui, veut dire qu’elle reste.",
  },
  {
    id: 'tuto_phone',
    trigger: 'first_phone',
    once: true,
    text: `T : le téléphone. Police municipale, mairie, « ${WHATSAPP_GROUP} ». Appeler « pour l’Association » fait venir la police plus vite, mais le bloc saura que c’est vous.`,
  },
  {
    id: 'tuto_police_call',
    trigger: 'first_police_call',
    once: true,
    text: "La police viendra… peut-être. Ce qui se passe quand elle arrive vaut parfois plus qu’un PV. Gardez un œil sur la terrasse pendant l’attente.",
  },
  {
    id: 'tuto_tipoff',
    trigger: 'first_tipoff',
    once: true,
    text: "Les tables viennent de rentrer, juste avant la patrouille. Hasard ? Si Klaas les voit ressortir, ce sera dans son carnet. Et dans votre dossier.",
  },
  {
    id: 'tuto_complaisance',
    trigger: 'first_complaisance',
    once: true,
    text: "Un café, zéro PV. Si quelqu’un l’a vu, c’est une pièce : la complaisance, ça se documente aussi.",
  },
  {
    id: 'tuto_waiter',
    trigger: 'first_waiter',
    once: true,
    text: 'Demander poliment au serveur de rentrer les tables, après 22h00, c’est légal et parfois efficace. Il est moins hostile que ses patrons. Pour l’instant.',
  },
  {
    id: 'tuto_dossier',
    trigger: 'first_dossier',
    once: true,
    text: 'Tab : le dossier. Chaque pièce a une qualité et une légalité. Une pièce obtenue illégalement ne vaut rien devant la commission. La presse, elle, est moins regardante.',
  },
  {
    id: 'tuto_bucket',
    trigger: 'near_bucket',
    once: true,
    text: "Le seau d’eau. F pour l’utiliser. C’est illégal. Si personne ne vous voit, il ne s’est rien passé. Si quelqu’un vous voit, il s’est passé beaucoup de choses.",
  },
  {
    id: 'tuto_witness',
    trigger: 'first_witness',
    once: true,
    text: "On vous a vu. Le Risque monte avec chaque témoin, et plus encore s’il y a une vidéo. Klaas note aussi ce que vous faites, vous.",
  },
  {
    id: 'tuto_bed',
    trigger: 'bed',
    once: true,
    text: "Le lit (E) : essayer de dormir. Le temps passe plus vite, et le Sommeil ne remonte que si le bruit retombe. Ce que vous ne voyez pas, la rue ne vous le racontera pas.",
  },
  {
    id: 'tuto_night_end',
    trigger: 'night_end',
    when: { day: [1, 1] },
    once: true,
    text: "Fin de la première nuit. Le bilan récapitule les preuves, la police et les témoins. Demain matin, Koddex. Douze nuits avant la commission.",
  },
];
