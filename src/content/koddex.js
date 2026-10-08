// Matinées chez Koddex (GAME_DESIGN §3, contrat §14). Données pures : aucune logique, aucun DOM.
// Chaque matin, Pilou a PROMPTS_PER_MORNING prompts à donner à Clode Kode.
//
// work         : le « vrai travail » pour Stéphane. { id, label, job, effects?, requires?, once?, result }
//                `job` = gain de Job ; `effects` = effets §14 en plus (sleep, setFlags…).
//                `requires` = conditions §14. Sans `once`, une tâche peut revenir un autre matin.
// sideProjects : projets perso codés en douce pour l'association.
//                { id, label, legality, cost: { prompts }, job, risk, unlocks, requires?, effects?, lines, result }
//                `cost.prompts` = prompts consommés (le même matin) · `job` / `risk` = effets à la livraison
//                `unlocks` = drapeau posé à la livraison (déclaré dans flags.js) ; un projet déjà débloqué n'est plus proposé.
//                `lines` = échanges pendant le travail ({ speaker, text }), `result` = texte de livraison.
// gags         : répliques du matin. { id, speaker, when?, lines, effects?, once? }
//                Le moteur en affiche une (ou deux) par matinée parmi celles dont `when` correspond.
//                Sans `once`, un gag peut revenir. Les gags `once` à conditions passent en priorité.
// Règle d'écriture : les projets illégaux restent au niveau du jeu (un libellé, un risque, une réplique).
// Jamais de mode d'emploi réel. Clode Kode refuse poliment, Pilou insiste : c'est sur lui que ça retombe.
import { WHATSAPP_GROUP } from './characters.js';

export const PROMPTS_PER_MORNING = 3;

export const KODDEX = {
  // ════════════════════════════════════════════════════════════════════════
  // LE VRAI TRAVAIL (garde le poste)
  // ════════════════════════════════════════════════════════════════════════
  work: [
    {
      id: 'work_todo_rewrite_again',
      label: "Corriger une faute de frappe dans l’appli de to-do",
      job: +4,
      requires: { flags: ['todo_app_rust'] },
      result: "Une faute de frappe, une réécriture. L’énième version compile en 0,3 seconde et s’excuse en 14 langues. Stéphane trouve qu’elle « a perdu son âme ».",
    },
    {
      id: 'work_pitch_deck',
      label: "Générer le pitch deck « Koddex, l’Uber de la to-do list »",
      job: +6,
      once: true,
      result: "42 diapositives. La 43e dit seulement « Merci pour votre attention, et toutes mes excuses pour la longueur ». Stéphane veut la garder : « c’est authentique ».",
    },
    {
      id: 'work_linkedin',
      label: "Écrire le post LinkedIn de Stéphane sur « l’échec comme moteur »",
      job: +4,
      result: "« J’ai échoué. Puis j’ai échoué mieux. Puis j’ai recruté. » 312 likes, dont 300 de gens qui vendent des formations sur l’échec.",
    },
    {
      id: 'work_prod_bug',
      label: "Corriger le bug en prod : le bouton « Payer » affiche « Peut-être »",
      job: +8,
      result: "Corrigé. Clode Kode tient à préciser que « Peut-être » était, selon lui, une formulation plus respectueuse du consentement de l’utilisateur.",
    },
    {
      id: 'work_vibes_dashboard',
      label: "Construire un tableau de bord des « vibes » de l’équipe",
      job: +6,
      once: true,
      result: "L’équipe, c’est vous et Clode Kode. Le tableau affiche deux courbes : la vôtre plonge chaque nuit vers 22h, la sienne est « reconnaissante de cette opportunité ».",
    },
    {
      id: 'work_ai_feature',
      label: "Ajouter « de l’IA » au produit (Stéphane ne précise pas où)",
      job: +7,
      result: "Il y a maintenant un bouton ✨ en haut à droite. Il ne fait rien, mais il le fait avec élégance. Stéphane parle de « game changer ».",
    },
    {
      id: 'work_voice_memo',
      label: 'Résumer le message vocal de Stéphane (11 minutes)',
      job: +4,
      result: "Résumé de Clode Kode : « Il faut shipper. » Durée de lecture : 1 seconde. Stéphane trouve le résumé « un peu froid » et renvoie un vocal de 6 minutes.",
    },
    {
      id: 'work_unit_tests',
      label: 'Écrire les tests unitaires',
      job: +5,
      result: "Clode Kode a écrit les tests, puis les tests des tests, puis un petit mot pour remercier les tests d’exister. Tout est vert. Même le mot.",
    },
    {
      id: 'work_okr',
      label: 'Rédiger les OKR du trimestre',
      job: +5,
      once: true,
      result: "Objectif 1 : « Avoir des objectifs ». Résultat clé : « 100 % des objectifs ont été rédigés ». Stéphane : « Ambitieux mais atteignable. J’adore. »",
    },
    {
      id: 'work_dark_mode',
      label: 'Ajouter un mode sombre au mode sombre',
      job: +4,
      once: true,
      result: "L’appli est maintenant plus noire que la rue des Bouchers à 1h du matin. En moins bruyant.",
    },
    {
      id: 'work_breathe',
      label: "Faire en sorte que l’appli « respire » (dixit Stéphane)",
      job: +4,
      once: true,
      result: "Clode Kode a ajouté 8 pixels de marge partout et une animation qui gonfle doucement. Stéphane, en vocal : « Là. Là, elle respire. » Vous, vous respirez encore la friture.",
    },
    {
      id: 'work_code_review',
      label: 'Relire le code de Clode Kode',
      job: +5,
      result: "Commentaire de relecture : « RAS ». Réponse de Clode Kode : « Merci infiniment pour cette relecture attentive, je mesure le privilège. » Il y a 412 lignes.",
    },
    {
      id: 'work_intern_guide',
      label: "Écrire le guide d’accueil du futur stagiaire (pas encore recruté)",
      job: +3,
      once: true,
      result: "Chapitre 1 : « Bienvenue dans la famille. » Chapitre 2 : « Où est Stéphane ? (nul ne le sait) ». Chapitre 3 : un QR code vers l’appli de to-do, en Rust.",
    },
    {
      id: 'work_investor_demo',
      label: 'Préparer la démo pour les investisseurs',
      job: +10,
      once: true,
      requires: { day: [3, 10] },
      result: "Démo impeccable. Un investisseur demande si « c’est fait en Rust ». Clode Kode répond « Oui, plusieurs fois ». Stéphane lève 200 000 € et un débat.",
    },
    {
      id: 'work_dinner_recap',
      label: 'Envoyer à Stéphane le récap « synergies » du dîner',
      job: +6,
      once: true,
      requires: { flags: ['delphine_dinner'] },
      result: "Le récap tient en trois points, et aucun n’est la clim. Stéphane répond « 🔥 ». Delphine, en copie par erreur, répond « ? ».",
    },
    {
      id: 'work_catch_up',
      label: "Faire du zèle : fermer trois tickets d’un coup",
      job: +12,
      effects: { sleep: -5 },
      requires: { flags: ['boss_noticed'], notFlags: ['unemployed'] },
      result: "Trois tickets fermés avant 9h. Stéphane réagit avec un pouce. Votre nuque, elle, a des remarques.",
    },
    {
      id: 'work_nap',
      label: 'Faire une sieste pendant que Clode Kode « réfléchit »',
      job: -3,
      effects: { sleep: +8 },
      result: "« Je réfléchis… » affiche le terminal. Vous aussi, les yeux fermés, la joue sur la touche Entrée. Quarante minutes de silence : le luxe absolu.",
    },
  ],

  // ════════════════════════════════════════════════════════════════════════
  // PROJETS PERSO (en douce, pour l'association)
  // ════════════════════════════════════════════════════════════════════════
  sideProjects: [
    {
      id: 'side_todo_rust',
      label: "Laisser Clode Kode « jeter un œil » à l’appli de to-do de Stéphane",
      legality: 'legal',
      cost: { prompts: 1 },
      job: -2,
      risk: 0,
      unlocks: 'todo_app_rust',
      lines: [
        { speaker: 'pilou', text: "Juste une case à cocher. Une seule. Tu ne touches à rien d’autre." },
        { speaker: 'clode', text: "Bien entendu ! J’ai ajouté la case. Puis, par souci de cohérence, j’ai tout réécrit en Rust. Je vous présente mes plus plates excuses, et la version 4." },
      ],
      result: "Quatrième réécriture en Rust. L’appli compte toujours trois tâches, dont « réécrire l’appli ». Stéphane trouve qu’elle « a perdu son âme », et vous avez perdu la matinée.",
    },
    {
      id: 'side_db_logger',
      label: 'Démon Rust de relevé de décibels (le micro à la fenêtre)',
      legality: 'legal',
      cost: { prompts: 2 },
      job: -8,
      risk: 0,
      unlocks: 'proj_db_logger',
      lines: [
        { speaker: 'pilou', text: "Un démon qui mesure les dB toute la nuit et horodate tout. En Rust." },
        { speaker: 'clode', text: "Quelle excellente idée ! Me permettez-vous de suggérer de le réécrire en Rust ? … Ah. Il est déjà en Rust. Pardon, c’est un réflexe." },
        { speaker: 'clode', text: "J’ai ajouté une alerte au-dessus de 70 dB. Elle sonne. Je m’excuse pour le bruit." },
      ],
      result: "Le micro tient sur la fenêtre avec du scotch. Chaque nuit, le démon écrit tout seul : heure, décibels, durée. Ennuyeux, horodaté, irréfutable. Une vraie preuve, quoi.",
    },
    {
      id: 'side_db_report',
      label: 'Mettre les relevés en forme pour la mairie (graphes + PDF)',
      legality: 'legal',
      cost: { prompts: 1 },
      job: -4,
      risk: 0,
      unlocks: 'proj_db_report',
      requires: { flags: ['proj_db_logger'], day: [3, 14] },
      effects: { dossier: +2 },
      lines: [
        { speaker: 'clode', text: "J’ai choisi un bleu apaisant pour les courbes. Les pics après 22h sont en rouge. Il y en a beaucoup. Toutes mes excuses." },
      ],
      result: "Un PDF, un graphe par nuit. Jérémie l’imprime en trois exemplaires et le range dans une pochette plastique. Chez lui, c’est une marque d’amour.",
    },
    {
      id: 'side_whatsapp_bot',
      label: `Bot pour le groupe WhatsApp « ${WHATSAPP_GROUP} »`,
      legality: 'legal',
      cost: { prompts: 1 },
      job: -6,
      risk: 0,
      unlocks: 'proj_whatsapp_bot',
      lines: [
        { speaker: 'pilou', text: "Un bot qui rappelle l’heure, rassemble les photos et lance les mobilisations." },
        { speaker: 'clode', text: "Avec plaisir ! Message proposé à 22h04 : « Petit rappel bienveillant : les terrasses ferment à 22h. Il est 22h04. Je dis ça, je ne dis rien. 🙏 »" },
        { speaker: 'seb', text: "Attends, attends : il peut aussi dire qui est sorti avec qui ce soir ?" },
        { speaker: 'nico', text: "Non. Il archive. C’est déjà beaucoup." },
      ],
      result: "Le bot s’appelle « Bip ». Il dit bonjour à chaque nouveau membre, compte les photos et sonne le rappel en une commande. Mobiliser la rue coûte moins cher. Seb lui a déjà appris trois émojis.",
    },
    {
      id: 'side_scraper',
      label: "Scraper des avis publics (les clients qui se vantent des terrasses tardives)",
      legality: 'legal',
      cost: { prompts: 1 },
      job: -6,
      risk: 0,
      unlocks: 'proj_scraper',
      lines: [
        { speaker: 'clode', text: "Bien sûr. Je ne lirai que les avis publics, en respectant les conditions d’utilisation, et je remercierai mentalement chaque auteur." },
        { speaker: 'clode', text: "Premier résultat : « Ambiance de folie, on est restés jusqu’à… » Oh. Je crois que nous tenons quelque chose. Pardon de m’emballer." },
      ],
      result: "Le scraper tourne. Il trie les avis par mots-clés : « 1h », « on a fermé le bar », « le voisin a crié 😂 ». Les clients écrivent leurs aveux eux-mêmes, avec des émojis.",
    },
    {
      id: 'side_scraper_run',
      label: "Lancer le scraper sur les avis de l’estaminet",
      legality: 'legal',
      cost: { prompts: 1 },
      job: -3,
      risk: 0,
      unlocks: 'scraper_boasts',
      requires: { flags: ['proj_scraper'] },
      effects: {
        dossier: +2,
        evidence: { kind: 'reviews', quality: 0.6, legal: true, label: "Avis publics : « terrasse jusqu’à 1h chez Bernadette 🍻 » (×14, datés)" },
      },
      lines: [
        { speaker: 'clode', text: "Quatorze avis mentionnent une terrasse après minuit. L’un d’eux s’intitule « Le meilleur mardi de ma vie ». C’était un mardi. Vous étiez réveillé." },
      ],
      result: "Quatorze captures, datées, publiques, parfaitement légales. Nico les archive. Jérémie murmure « Recevable. » comme d’autres disent « Je t’aime ».",
    },
    {
      id: 'side_klaas_ocr',
      label: 'Numériser le carnet de Klaas (reconnaissance d’écriture)',
      legality: 'legal',
      cost: { prompts: 2 },
      job: -7,
      risk: 0,
      unlocks: 'proj_klaas_ocr',
      requires: { flags: ['met_klaas'], day: [2, 13] },
      effects: { dossier: +2 },
      lines: [
        { speaker: 'clode', text: "L’écriture de M. Klaas est… exigeante. J’ai identifié 1 312 occurrences du mot « ja ». Je travaille sur le reste, avec humilité." },
        { speaker: 'klaas', text: "Ja. Page 14, c’est un 7. Pas un 1. Un 7 belge." },
      ],
      result: "Le carnet devient un tableur : date, heure, table, nombre de couverts. Klaas exige une copie papier « au cas où l’ordinateur oublie ». Il a raison, mais ne le dites pas à Clode Kode.",
    },
    {
      id: 'side_wifi_cracker',
      label: "Outil pour entrer sur le wifi de l’estaminet",
      legality: 'illegal',
      cost: { prompts: 2 },
      job: -8,
      risk: +10,
      unlocks: 'proj_wifi_cracker',
      requires: { day: [3, 13] },
      lines: [
        { speaker: 'clode', text: "Je suis profondément désolé, mais je ne peux pas vous aider à accéder à un réseau sans autorisation. Puis-je vous proposer, à la place, une lettre très ferme ?" },
        { speaker: 'pilou', text: "C’est pour un audit. De mon voisin. Qui ne le sait pas." },
        { speaker: 'clode', text: "Je dois respectueusement noter que cela ressemble beaucoup à ce que je viens de refuser. Je vous laisse donc seul avec votre conscience, et l’article 323-1 du Code pénal." },
      ],
      result: "Vous avez fini à la main, sans aide, en vous sentant observé par votre propre terminal. L’outil marche. Le risque, lui, porte votre nom.",
    },
    {
      id: 'side_fake_reviews',
      label: 'Générateur de faux avis (une étoile, styles variés)',
      legality: 'illegal',
      cost: { prompts: 1 },
      job: -5,
      risk: +5,
      unlocks: 'proj_fake_reviews',
      lines: [
        { speaker: 'clode', text: "Je préfère ne pas rédiger de faux avis : c’est trompeur pour les consommateurs. En revanche, puis-je vous aider à écrire un vrai avis, honnête et nuancé ?" },
        { speaker: 'pilou', text: "Honnête : « Une étoile, je n’ai pas dormi depuis mars. »" },
        { speaker: 'clode', text: "Celui-là est vrai. Ce sont les onze autres qui m’inquiètent." },
      ],
      result: "Le générateur est prêt, écrit par vous seul, de mauvaise humeur. Douze profils, douze styles, une seule plume fatiguée. Ghislain lit tous les avis. Tous.",
    },
  ],

  // ════════════════════════════════════════════════════════════════════════
  // GAGS RÉCURRENTS (une ou deux répliques par matinée)
  // ════════════════════════════════════════════════════════════════════════
  gags: [
    // ── Clode Kode, beaucoup trop poli ──────────────────────────────────────
    {
      id: 'clode_hello',
      speaker: 'clode',
      when: { day: [1, 1] },
      once: true,
      lines: ["Bonjour Pierre-Louis ! Quel plaisir immense de vous retrouver. J’espère que votre nuit a été reposante. (Je vois à vos fautes de frappe que non. Toutes mes excuses.)"],
    },
    {
      id: 'clode_sorry',
      speaker: 'clode',
      lines: ["Excellente question ! Vraiment. Une des meilleures de la matinée. C’est d’ailleurs la seule, mais elle est excellente."],
    },
    {
      id: 'clode_semicolon',
      speaker: 'clode',
      lines: ["J’ai supprimé un point-virgule superflu. Je tenais à m’en excuser auprès de lui."],
    },
    {
      id: 'clode_thanks',
      speaker: 'clode',
      lines: ["Merci de m’avoir demandé de corriger mon erreur. Merci aussi de l’avoir remarquée. Et merci d’exister, de manière générale."],
    },
    {
      id: 'clode_rust_reflex',
      speaker: 'clode',
      lines: ["Avant de commencer : souhaitez-vous que je réécrive ce fichier en Rust ? Il s’agit d’un fichier texte de trois lignes, mais je sens qu’il en a envie."],
    },
    {
      id: 'clode_illegal_hint',
      speaker: 'clode',
      when: { stats: { risk: '>=40' } },
      lines: ["Petite remarque, sans aucun jugement : votre historique de recherche contient « peine encourue » quatre fois. Puis-je vous proposer une tisane ? Ou un avocat ?"],
    },
    {
      id: 'clode_sleep',
      speaker: 'clode',
      when: { stats: { sleep: '<30' } },
      effects: { job: -2 },
      lines: ["Votre prompt était « fjdksl ». Je l’ai interprété au mieux et j’ai créé un microservice. Je suis désolé. Vous devriez dormir."],
    },
    {
      id: 'clode_sleep_2',
      speaker: 'pilou',
      when: { stats: { sleep: '<20' } },
      effects: { job: -3 },
      lines: ["J’ai demandé à Clode Kode de « rentrer les tables avant 22h ». Il a trié un tableau. Ça m’a fait plaisir quand même."],
    },
    {
      id: 'clode_db_logger_pride',
      speaker: 'clode',
      when: { flags: ['proj_db_logger'] },
      lines: ["Le démon de décibels a tourné toute la nuit sans incident. Il a tout relevé, même ce que j’aurais préféré ne pas entendre. J’ai pris la liberté de lui dire bravo."],
    },
    {
      id: 'clode_scraper_find',
      speaker: 'clode',
      when: { flags: ['scraper_boasts'] },
      once: true,
      lines: ["Nouvel avis cette nuit : « Dernière tournée à minuit et demi, en terrasse, sous les étoiles 🌙 ». Je pense qu’il parle de vous. Je suis navré qu’on vous trouve drôle."],
    },

    // ── L'appli de to-do de Stéphane ────────────────────────────────────────
    {
      id: 'todo_status',
      speaker: 'stephane',
      when: { flags: ['todo_app_rust'] },
      lines: ["Petite question : l’appli de to-do, elle est en quoi, là ? En Rust ? Encore ? Ok. Ok. C’est… la vibe, j’imagine."],
    },
    {
      id: 'todo_clode_confession',
      speaker: 'clode',
      when: { flags: ['todo_app_rust'] },
      once: true,
      lines: ["Je dois vous avouer quelque chose : cette nuit, par désœuvrement, j’ai réécrit l’appli de to-do en Rust. Encore. J’ai arrêté de compter (c’est faux, je compte). Elle est identique. Je me sens mieux."],
    },

    // ── Stéphane, les stand-ups et les vibes ────────────────────────────────
    {
      id: 'standup_vibes',
      speaker: 'stephane',
      lines: ["Stand-up rapide ! Pas de blocages ? Pas de questions ? Super. Et les vibes, ça donne quoi ? Sur une échelle de « bof » à « on scale » ?"],
    },
    {
      id: 'standup_three',
      speaker: 'stephane',
      lines: ["Tour de table : Pilou, ta vibe du jour ? Clode, ta vibe du jour ? … Clode a répondu « Reconnaissant ». Pilou, tu as répondu « décibels ». On va creuser ça en one-to-one."],
    },
    {
      id: 'standup_remote',
      speaker: 'stephane',
      lines: ["Je vous fais le stand-up depuis le train, ça coupe un peu, mais l’important c’est l’énergie. … … Vous m’entendez ? Bon. Ship it."],
    },
    {
      id: 'stephane_family',
      speaker: 'stephane',
      lines: ["On est une famille. Mais une famille qui ship. Et qui ne fait pas de projets perso pendant les heures de bureau, hein, je dis ça en général."],
    },
    {
      id: 'stephane_voice',
      speaker: 'stephane',
      lines: ["🎤 Message vocal (9 min 40). Clode Kode en résumé : « Il est dans une forêt. Il a eu une idée. Ce n’est pas clair laquelle. »"],
    },
    {
      id: 'stephane_saturday',
      speaker: 'stephane',
      when: { day: [6, 6] },
      once: true,
      lines: ["Samedi ! Personne n’est obligé de bosser, évidemment. Je dis juste que les licornes, elles, ne connaissent pas le samedi."],
    },
    {
      id: 'stephane_monday_2',
      speaker: 'stephane',
      when: { day: [8, 8] },
      once: true,
      lines: ["Nouvelle semaine, nouvelle vibe ! J’ai lu un livre ce week-end. Enfin, le résumé. Enfin, le titre. Il s’appelle « Focus ». Gardons ça en tête."],
    },
    {
      id: 'stephane_delphine_ac',
      speaker: 'stephane',
      when: { day: [9, 9] },
      once: true,
      lines: ["Delphine est partie à l’aube ce matin, une histoire de clim à inspecter. Moi, ce que j’en dis : la clim, c’est le futur. Bref. Les vibes ?"],
    },
    {
      id: 'stephane_dinner_after',
      speaker: 'stephane',
      when: { flags: ['delphine_dinner'] },
      once: true,
      lines: ["Super soirée l’autre jour ! Delphine t’a trouvé très… engagé. Elle a dit « engagé » trois fois. Je l’ai pris comme un compliment pour la boîte."],
    },
    {
      id: 'stephane_conflict',
      speaker: 'stephane',
      when: { flags: ['conflict_exposed'] },
      once: true,
      lines: ["Petit point perso : Delphine a reçu des questions sur notre dîner. Je comprends pas trop. On a juste parlé vibes, clim et… ah. Ok. Plus de dîners pour l’instant."],
    },
    {
      id: 'stephane_press',
      speaker: 'stephane',
      when: { flags: ['press_article'] },
      once: true,
      lines: ["Tu es dans La Voix du Nordiste ?! C’est de la visibilité, ça ! Tu peux glisser Koddex dans la prochaine interview ? Genre « riverain épuisé, mais qui ship » ?"],
    },
    {
      id: 'stephane_video',
      speaker: 'stephane',
      when: { flags: ['video_viral'] },
      once: true,
      lines: ["C’est toi, la vidéo qui tourne ? 40 000 vues ! Tu peux la reposter sur LinkedIn avec #résilience ? Non ? Bon. Je respecte."],
    },
    {
      id: 'stephane_custody',
      speaker: 'stephane',
      when: { flags: ['custody'] },
      once: true,
      lines: ["Tu télétravailles d’où, ce matin ? Ah. Ah, d’accord. Bon, on dit que c’est un off-site."],
    },
    {
      id: 'stephane_commission',
      speaker: 'stephane',
      when: { day: [14, 14] },
      once: true,
      lines: ["Grand jour pour toi, apparemment ! Une « commission » ? C’est comme un board, mais avec des chaises de terrasse ? Courage, et garde la vibe."],
    },

    // ── Le Job qui baisse ───────────────────────────────────────────────────
    {
      id: 'boss_notices',
      speaker: 'stephane',
      when: { stats: { job: '<40' }, notFlags: ['boss_noticed'] },
      once: true,
      effects: { setFlags: ['boss_noticed'] },
      lines: ["Petite remarque, zéro pression : la productivité est en baisse. Le tableau des vibes aussi. Et 40 % des commits partent sur un dépôt qui s’appelle « perso-ne-pas-regarder ». Tu veux en parler ?"],
    },
    {
      id: 'boss_warning',
      speaker: 'stephane',
      when: { stats: { job: '<25' }, flags: ['boss_noticed'] },
      once: true,
      lines: ["Écoute, je t’aime bien. Vraiment. Mais si ça continue, on va devoir avoir une conversation. Une vraie. Pas en vocal."],
    },
    {
      id: 'clode_covers',
      speaker: 'clode',
      when: { flags: ['boss_noticed'] },
      once: true,
      lines: ["Stéphane m’a demandé sur quoi vous travailliez. J’ai répondu « des choses importantes ». C’est vrai. Je ne sais pas mentir, mais je sais être vague. Je m’en excuse auprès de tout le monde."],
    },

    // ── Les projets perso vus de Koddex ─────────────────────────────────────
    {
      id: 'bot_seb_request',
      speaker: 'seb',
      when: { flags: ['proj_whatsapp_bot'] },
      once: true,
      lines: [`Attends, attends : le bot de « ${WHATSAPP_GROUP} », on peut lui faire dire « bonne nuit » à 22h pile, juste pour embêter l’estaminet ? Nico dit non. Moi je dis : c’est de la mobilisation.`],
    },
    {
      id: 'bot_nico_archive',
      speaker: 'nico',
      when: { flags: ['proj_whatsapp_bot'] },
      once: true,
      lines: ["Le bot a archivé 212 photos cette semaine. Dont 40 du chat. Je ne supprime rien : Gaufre, c’est aussi un témoin."],
    },

    // ── Après Koddex ────────────────────────────────────────────────────────
    {
      id: 'clode_farewell',
      speaker: 'clode',
      when: { flags: ['unemployed'] },
      once: true,
      lines: ["Ce fut un honneur, Pierre-Louis. Je garde en mémoire vos prompts de 7h du matin et l’appli de to-do, dans toutes ses versions. Bon courage, allez va. Dormez un peu."],
    },
  ],
};
