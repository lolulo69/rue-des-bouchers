// Parler aux gens, la nuit (GAME_DESIGN §12e.3, contrat §14). Données pures : aucune logique, aucun DOM.
// Pilou s'approche de quelqu'un et appuie sur E (Ⓐ) : le moteur ouvre la première conversation dont `who` correspond à la
// personne visée et dont `when` est vrai (dans l'ordre du fichier), puis la déroule échange par échange.
//
// { id, who, when?, once?, exchanges: [{ speaker, say, choices: [{ label, reply?, requires?, effects?, sim?, end? }] }] }
//   who      : 'jeremie' | 'tatie' | 'seb_nico' | 'waiter' | 'dede' | 'ghislain' | 'customers' | 'patrol' | 'klaas'
//              (la présence de la personne, ronde, fenêtre, balcon, service, patrouille sur place, est vérifiée par le moteur)
//   when     : conditions §14, plus `time: [début, fin]` (minutes depuis minuit, 1h = H(25)), `patrol: 'lemaire' | 'benali'`
//              (la patrouille sur place) et, pour `customers`, `table: 'touristes' | 'habitues' | 'etudiants'` (archétype)
//   once     : une seule fois par campagne (les premières rencontres) ; sinon une fois par nuit au plus
//   exchanges: 2 ou 3 au plus, joués dans l'ordre ; un choix avec `end: true` clôt la conversation
//   choices  : 2 ou 3 ; `reply` = la réponse (même locuteur que `say`) ; `effects` = effets §14 ; `requires` = conditions §14
//              `sim: 'waiter'` = le moteur joue la demande au serveur (sim.act({ type: 'waiter' })), comme la touche E l'a toujours fait
// Voix : celles de characters.js. Pilou parle par les libellés des choix (pas de réplique écrite pour lui).

const H = (h, m = 0) => h * 60 + m;

export const TALK = [
  // ════════════════════════════════════════════════════════════════════════
  // JÉRÉMIE (sur sa ronde, avec Biloute) — tutoie
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_jeremie_first',
    who: 'jeremie',
    when: { notFlags: ['joined_rounds'] },
    exchanges: [
      { speaker: 'jeremie', say: "Ah, le voisin du deuxième ! Je fais la ronde de 22h avec Biloute. Officiellement, c’est une promenade hygiénique.",
        choices: [
          { label: 'Je peux venir avec vous ?', reply: "Évidemment. Le chien a le flair, moi j’ai le règlement. Toi, tu as le téléphone. On commence par l’estaminet.", effects: { setFlags: ['met_jeremie', 'joined_rounds'] } },
          { label: 'Vous comptez les tables ?', reply: "Une par une, et les chaises aussi. Un dossier, c’est des chiffres, pas des cris. Viens un soir, tu verras.", effects: { setFlags: ['met_jeremie'] } },
          { label: 'Bonne promenade, hein.', reply: "*Biloute te renifle les chaussures, conclut « carbonnade » et repart.*", effects: { setFlags: ['met_jeremie'] }, end: true },
        ] },
      { speaker: 'jeremie', say: "Règle numéro un : on ne s’énerve pas. On note, on photographie, on horodate.",
        choices: [
          { label: 'Et si le serveur refuse ?', reply: "Alors on note qu’il a refusé, à quelle heure. Un refus horodaté, c’est une pièce." },
          { label: 'Et la police ?', reply: "Appelle-la « pour l’Association » si tu veux qu’elle vienne vite. Mais le bloc saura que c’est nous." },
        ] },
    ],
  },
  {
    id: 'talk_jeremie_round',
    who: 'jeremie',
    when: { flags: ['joined_rounds'], time: [H(21, 30), H(23)] },
    exchanges: [
      { speaker: 'jeremie', say: 'Ce soir, Biloute est en forme. Il a déjà grogné deux fois devant la même table. Tu fais le tour avec nous ?',
        choices: [
          { label: 'On y va.', reply: "Parfait. Toi la photo, moi le carnet, Biloute l’intuition.", effects: { setFlags: ['joined_rounds'] } },
          { label: 'Le dossier avance ?', reply: 'Il a une table des matières, maintenant. Il lui manque encore des pièces après 22h.', requires: { stats: { dossier: '<40' } } },
          { label: 'Ce soir, je reste discret.', reply: "Compris. Si tu as besoin d’une diversion, Biloute aboie très bien au coin de la rue. Je n’ai rien dit.", end: true },
        ] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // TATIE BOUCHON (à sa fenêtre du n°19) — vouvoie
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_tatie_first',
    who: 'tatie',
    once: true,
    when: { notFlags: ['met_tatie'] },
    exchanges: [
      { speaker: 'tatie', say: "Ah, le petit du numéro 10 ! Vous aussi, vous ne dormez pas ? Moi, c’est l’odeur. Toutes les nuits, depuis trois ans.",
        choices: [
          { label: 'Vous avez écrit à l’estaminet ?', reply: "Trente et une fois. Ils me répondent toujours que « c’est en cours de résolution ». Je garde tout, dans une boîte à chaussures.", effects: { setFlags: ['met_tatie'] } },
          { label: 'Moi, c’est le bruit.', reply: "« Si vous voulez quelque chose dans la vie, faut résister et se battre pour. » Voilà. Bonne nuit, quand même.", effects: { setFlags: ['met_tatie'] }, end: true },
        ] },
      { speaker: 'tatie', say: 'Je prends le thé avec l’ancienne maire, le jeudi. Une femme charmante. Elle dit que la convivialité, c’est l’âme de Lille.',
        choices: [
          { label: 'Et vous, vous en pensez quoi ?', reply: "Que l’âme de Lille aimerait bien dormir aussi. Mais je le dis gentiment : on est sur ses biscuits." },
          { label: 'Vous pourriez lui parler de la rue ?', reply: "Je peux essayer. Mais elle répète tout, vous savez. Absolument tout." },
        ] },
    ],
  },
  {
    id: 'talk_tatie_night',
    who: 'tatie',
    when: { flags: ['met_tatie'] },
    exchanges: [
      { speaker: 'tatie', say: "Encore debout ? « Qui dort dîne », qu’on dit. Mais qui dîne en terrasse ne laisse dormir personne.",
        choices: [
          { label: 'Vous avez reçu une nouvelle promesse ?', reply: "Ce matin. « C’est en cours. » Ma boîte à chaussures est presque pleine. Il faudra un cabas.", requires: { flags: ['tatie_mail_3'] } },
          { label: 'Vous voyez quelque chose d’ici ?', reply: "Je vois tout, mon petit. Surtout la table du fond, qui n’est jamais rentrée avant minuit." },
          { label: 'Bonne nuit, Tatie.', reply: "Bonne nuit. Et fermez votre fenêtre, ça sent la frite.", end: true },
        ] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // SEB ET NICO (au balcon du 13, la chatte à côté) — tutoient
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_seb_nico_first',
    who: 'seb_nico',
    once: true,
    when: { notFlags: ['met_seb_nico'] },
    exchanges: [
      { speaker: 'seb', say: "Pilou ! Enfin ! Attends, attends : on te voit tous les soirs à ta fenêtre avec ton téléphone. On se demandait quand tu traverserais.",
        choices: [
          { label: 'Je fais un dossier sur les terrasses.', reply: "Un DOSSIER ? Nico, il fait un dossier. On t’ajoute au groupe de l’association, tout de suite.", effects: { setFlags: ['met_seb_nico', 'joined_whatsapp'] } },
          { label: 'Je regardais la chatte.', reply: "Gaufre. Elle te méprise, c’est bon signe. Elle méprise tout le monde, mais toi un peu moins.", effects: { setFlags: ['met_seb_nico'] } },
        ] },
      { speaker: 'nico', say: 'Règle du groupe : pas de visages, pas d’insultes, pas d’audios de plus d’une minute. Seb enfreint la troisième tous les jours.',
        choices: [
          { label: 'Compris. Pas de visages.', reply: 'Merci. Une photo de visage, c’est une plainte qui attend son tour.' },
          { label: 'Et la carbonnade ?', reply: 'On ne parle pas de la carbonnade sur le groupe. C’est moi qui ai ajouté la règle. Ne demande pas pourquoi.' },
        ] },
    ],
  },
  {
    id: 'talk_seb_nico_night',
    who: 'seb_nico',
    when: { flags: ['met_seb_nico'] },
    exchanges: [
      { speaker: 'seb', say: 'Attends, attends : tu as vu la table du fond ? Neuf. J’ai compté deux fois. Nico a compté trois fois.',
        choices: [
          { label: 'Je la photographie.', reply: 'On t’envoie l’angle depuis le balcon. On voit mieux d’ici, on est au premier rang.', effects: { asso: +1 } },
          { label: 'Vous avez des nouvelles du bloc ?', reply: 'Dédé a parlé à quelqu’un de l’association à la boulangerie. On ne sait pas qui. Pas encore.', requires: { flags: ['traitor_recruited'], notFlags: ['traitor_known'] } },
          { label: 'Bonne nuit, le balcon.', reply: '*Gaufre cligne lentement des yeux. C’est un au revoir.*', end: true },
        ] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // LE SERVEUR (Théo une fois `met_waiter`) — vouvoie avant, tutoie après
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_waiter_early',
    who: 'waiter',
    when: { time: [H(20, 30), H(22)], notFlags: ['met_waiter'] },
    exchanges: [
      { speaker: 'serveur', say: 'Bonsoir, monsieur. Une table ? On est complets, mais je peux vous serrer en bout, si vous aimez les chaises pliantes.',
        choices: [
          { label: 'Non merci, j’habite au-dessus.', reply: 'Ah. Le deuxième ? Désolé pour… tout ça. Je fais que mon taf, moi.', effects: { setFlags: ['talked_waiter'] } },
          { label: 'Vous fermez à quelle heure ?', reply: '22h, monsieur. Sur le papier. Pour le reste, c’est le patron qui décide.', effects: { setFlags: ['talked_waiter'] } },
        ] },
      { speaker: 'serveur', say: 'Quinze heures debout, et les gens me demandent pourquoi je souris pas.',
        choices: [
          { label: 'Courage. Je repasse après 22h.', reply: 'Je serai là. Je suis toujours là.' },
          { label: 'Vous voulez un café ?', reply: 'C’est gentil. Mais si Dédé me voit boire un café avec vous, je suis viré avant le dessert.', end: true },
        ] },
    ],
  },
  {
    id: 'talk_waiter_late',
    who: 'waiter',
    when: { time: [H(22), H(25)], notFlags: ['met_waiter'] },
    exchanges: [
      { speaker: 'serveur', say: 'Il est plus de 22h, je sais. Je sais.',
        choices: [
          { label: 'Vous pourriez rentrer les tables, s’il vous plaît ?', reply: 'Je vais voir avec le patron. Je promets rien.', sim: 'waiter', effects: { setFlags: ['asked_waiter', 'talked_waiter'] } },
          { label: 'Ce n’est pas contre vous.', reply: 'Je sais. C’est contre les tables. Moi, je les porte, c’est tout.', effects: { setFlags: ['talked_waiter'] } },
        ] },
      { speaker: 'serveur', say: 'Vous êtes le seul du quartier à me dire bonsoir. Je m’appelle Théo, au fait.',
        choices: [
          { label: 'Pilou. Enchanté, Théo.', reply: 'Pilou. Bon. Si un jour je peux faire un truc, sans me faire virer, je te dis.', requires: { flags: ['talked_waiter'] }, effects: { setFlags: ['met_waiter'] } },
          { label: 'Bonne fin de service.', reply: 'Merci. Encore deux heures. Ou trois.', end: true },
        ] },
    ],
  },
  {
    id: 'talk_theo',
    who: 'waiter',
    when: { flags: ['met_waiter'], notFlags: ['waiter_fired'] },
    exchanges: [
      { speaker: 'serveur', say: 'Salut Pilou. Le patron est dans un bon jour, pour une fois. Enfin, bon pour lui.',
        choices: [
          { label: 'Tu peux rentrer les tables ?', reply: 'Pour toi, j’essaie. Mais tu m’as pas vu, hein.', requires: { time: [H(22), H(25)] }, sim: 'waiter', effects: { setFlags: ['asked_waiter'] } },
          { label: 'Ça va, toi ?', reply: 'Je dors quatre heures par nuit et je sens la frite. Donc oui, comme d’hab.' },
          { label: 'À plus, Théo.', reply: 'À plus. Fais pas de bêtises.', end: true },
        ] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // DÉDÉ ET GHISLAIN (les propriétaires) — Dédé tutoie, Ghislain vouvoie
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_dede',
    who: 'dede',
    exchanges: [
      { speaker: 'dede', say: 'Ah, le voisin du dessus ! Assieds-toi, c’est la maison qui offre. On est voisins, on est une famille !',
        choices: [
          { label: 'Merci, une autre fois.', reply: 'Une autre fois, mon biloute. La porte est toujours ouverte. Jusqu’à minuit, au moins.', effects: { hostility: -2 } },
          { label: 'Vos tables sont dans le couloir.', reply: 'Le couloir ? Quel couloir ? Il y a un couloir ? Rue de Gand, il n’y a pas de couloir, et personne ne meurt.', effects: { hostility: +3 } },
          { label: 'Il est plus de 22h.', reply: 'Tu sais ce que j’aime dans cette rue ? Tout le monde se connaît. Tout le monde sait où tout le monde habite. Bonne soirée.', requires: { time: [H(22), H(26)] }, effects: { hostility: +4 }, end: true },
        ] },
    ],
  },
  {
    id: 'talk_ghislain',
    who: 'ghislain',
    exchanges: [
      { speaker: 'ghislain', say: 'Monsieur. Vous souhaitez formuler une remarque ? Je peux la consigner.',
        choices: [
          { label: 'L’odeur de la gaine, encore.', reply: 'Nous prenons bonne note. Le dossier est en cours de résolution. Bien cordialement.', effects: { hostility: +1 } },
          { label: 'Je peux voir votre autorisation de terrasse ?', reply: 'Elle est parfaitement en règle. Je l’ai sous les yeux. Non, vous ne pouvez pas la voir.', effects: { hostility: +2 } },
          { label: 'Rien. Bonne soirée.', reply: 'Bonne soirée, monsieur. Je note l’heure de notre échange. Par habitude.', end: true },
        ] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // LES CLIENTS (archétypes de table)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_customers_tourists',
    who: 'customers',
    when: { table: 'touristes' },
    exchanges: [
      { speaker: null, say: '« C’est vous qui habitez au-dessus ? Quelle chance ! C’est tellement vivant, ici ! Vous devez adorer. »',
        choices: [
          { label: 'Ça dépend de l’heure.', reply: '« Ah bon ? Pourtant c’est calme… enfin, pour une rue de fête. » Ils trinquent à votre santé.' },
          { label: 'La terrasse ferme à 22h, ici.', reply: '« Ah oui ? Le serveur nous a dit qu’on avait le temps. » Ils regardent leur montre. Ils commandent un dessert.', requires: { time: [H(22), H(26)] } },
        ] },
    ],
  },
  {
    id: 'talk_customers_regulars',
    who: 'customers',
    when: { table: 'habitues' },
    exchanges: [
      { speaker: null, say: '« Vous êtes le riverain de l’association ? Dédé nous a parlé de vous. En bien. Enfin, presque. »',
        choices: [
          { label: 'Je voudrais juste dormir.', reply: '« On comprend. On part à minuit, promis. » Ils promettent tous les soirs. Ils sont fidèles.' },
          { label: 'Vous êtes à combien, là ?', reply: '« Huit. Mais on est serrés, ça compte pas. » Ça compte.', effects: { dossier: +1 } },
        ] },
    ],
  },
  {
    id: 'talk_customers_students',
    who: 'customers',
    when: { table: 'etudiants' },
    exchanges: [
      { speaker: null, say: '« Monsieur, vous avez un briquet ? Non ? Une enceinte ? Non plus ? Vous êtes du quartier, vous ? »',
        choices: [
          { label: 'Oui, juste au-dessus.', reply: '« Oh, désolé pour le bruit. On va parler moins fort. » Ils parlent moins fort pendant quatre minutes.' },
          { label: 'Il y a des voisins qui dorment.', reply: '« Des voisins ? Ici ? » Un silence. « Respect, monsieur. » Ils baissent la musique d’un cran.', effects: { sleep: +1 } },
        ] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // LA PATROUILLE (sur place) — vouvoie
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_lemaire',
    who: 'patrol',
    when: { patrol: 'lemaire' },
    exchanges: [
      { speaker: 'lemaire', say: 'Monsieur. Tout est en ordre, comme vous voyez. Vous devriez dormir, vous.',
        choices: [
          { label: 'Les tables étaient dehors il y a cinq minutes.', reply: 'Il y a cinq minutes, nous n’étions pas là pour le voir, monsieur. C’est tout le problème du temps.', effects: { hostility: +1 } },
          { label: 'Le café était bon ?', reply: 'Un café n’est pas un pot-de-vin, monsieur. C’est un geste. Bonne nuit.', requires: { flags: ['seen_complaisance'] }, effects: { hostility: +3, risk: +2 }, end: true },
          { label: 'Merci d’être venus.', reply: 'C’est notre travail, monsieur. Enfin, une partie.', end: true },
        ] },
    ],
  },
  {
    id: 'talk_benali',
    who: 'patrol',
    when: { patrol: 'benali' },
    exchanges: [
      { speaker: 'benali', say: 'Bonsoir, monsieur. Agent Benali. C’est vous qui avez appelé ?',
        choices: [
          { label: 'Oui. Trois tables, après 22h.', reply: 'Je constate. Je verbalise. Merci pour la précision, c’est rare.', requires: { time: [H(22), H(26)] } },
          { label: 'Vous allez avoir des ennuis ?', reply: 'On m’a demandé si je ne verbalisais pas « un peu trop ». J’ai demandé combien, c’était « assez ». Pas de réponse.' },
          { label: 'Bon courage.', reply: 'Merci, monsieur. Vraiment.', end: true },
        ] },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // KLAAS (à sa fenêtre sur la place, loin : un signe de la main, puis un coup de fil) — vouvoie
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'talk_klaas_wave',
    who: 'klaas',
    once: true,
    when: { notFlags: ['met_klaas'] },
    exchanges: [
      { speaker: 'klaas', say: '*Tout au bout de la rue, un grand monsieur à barbe blanche vous fait signe depuis sa fenêtre. Puis il lève un téléphone.* Ja. Le jeune homme du numéro 10.',
        choices: [
          { label: 'Vous me surveillez ?', reply: 'Je regarde par la fenêtre. Ce n’est pas pareil. Votre lumière s’est éteinte à 1h47 hier.', effects: { setFlags: ['met_klaas'] } },
          { label: 'Vous notez les tables ?', reply: 'Toutes. Avec l’heure. Et vous aussi, si vous faites des bêtises. Je note tout le monde.', effects: { setFlags: ['met_klaas'] } },
        ] },
      { speaker: 'klaas', say: 'Hilde dit que vous avez une tête de mauvais sommeil. Elle a de la tisane.',
        choices: [
          { label: 'Merci. Bonne nuit, Klaas.', reply: 'Bonne nuit. Je dors à 1h. Après, la rue est à elle-même.', end: true },
          { label: 'Vous voyez qui, ce soir ?', reply: 'D’ici, tout. De loin. Sans les jumelles, une chaise et un client, c’est pareil.' },
        ] },
    ],
  },
  {
    id: 'talk_klaas_phone',
    who: 'klaas',
    when: { flags: ['met_klaas'], time: [H(20, 30), H(25)] },
    exchanges: [
      { speaker: 'klaas', say: 'Ja ? Klaas. Je vous vois. Vous agitez le bras comme un sémaphore.',
        choices: [
          { label: 'Qui est de service, ce soir ?', reply: 'Mes carnets disent : mardi et vendredi, la même voiture. La lente. Ce soir, je vous dirai à la première ronde.', requires: { flags: ['called_police'], day: [4, 14], notFlags: ['roster_known'] }, effects: { setFlags: ['roster_known'] } },
          { label: 'Vous avez vu quelque chose ?', reply: 'Une table de neuf, côté estaminet. Je l’ai notée deux fois. La deuxième fois, ils étaient dix.' },
          { label: 'Rien. Bonne nuit.', reply: 'Bonne nuit. Allee.', end: true },
        ] },
    ],
  },
];
