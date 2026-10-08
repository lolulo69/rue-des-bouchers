// Journées au bureau ou en télétravail (GAME_DESIGN §12b.D). Données pures : aucune logique, aucun DOM.
// Le moteur tire chaque matin le lieu de travail (bureau / maison, graine de campagne, jamais la maison le J14) et choisit
// dans la liste qui correspond ; les conditions `when` sont celles du §14 (day, flags, notFlags, stats, chance…).
//
// WORKDAYS.commute   : jour de bureau, le trajet en vélo électrique avant Koddex. { id, when?, lines, effects?, once? }
//                      Une entrée par matin de bureau au plus. `speaker` facultatif (sinon : narration).
// WORKDAYS.office    : jour de bureau, ce qui se passe autour (Stéphane en personne, la machine à café, la cantine).
//                      { id, speaker?, when?, lines, once? }
// WORKDAYS.home      : jour de télétravail, au bureau à deux écrans du salon, côté rue, juste à côté de LA fenêtre.
//   distractions     : la rue s'invite, à un mètre du clavier. { id, when?, at?, title, text, choices: [{ label, requires?, effects?, result }] }
//                      Un choix sans `requires` reste toujours possible (« rester concentré »). `at` = heure (minutes).
//   calls            : les visios de Stéphane. { id, speaker: 'stephane', when?, lines, once? }
// WORKDAYS.koddex    : répliques de Clode Kode qui changent avec le lieu. { office: [gag], home: [gag] }, même forme que
//                      KODDEX.gags (koddex.js) : { id, speaker, when?, lines, once? }
// Rappel du lieu (§12b.D, corrigé) : 2e étage sans ascenseur, vélo garé dans le couloir d'entrée ; le bureau de Pilou est dans
// le salon, côté rue, contre la fenêtre au-dessus de la terrasse (l'odeur de l'extraction y arrive en premier). Côté cour : sa
// chambre et celle de sa fille (présente seulement par sa chambre : jamais nommée, jamais en scène).

export const WORKDAYS = {
  // ════════════════════════════════════════════════════════════════════════
  // LE TRAJET EN VÉLO ÉLECTRIQUE (jours de bureau)
  // ════════════════════════════════════════════════════════════════════════
  commute: [
    {
      id: 'commute_corridor',
      when: { day: [1, 4] },
      once: true,
      lines: [
        "Le vélo électrique occupe la moitié du couloir d’entrée, entre la bibliothèque et la porte. Vous le descendez sur l’épaule : deux étages, pas d’ascenseur.",
        "En bas, la rue dort. Les chaises de l’estaminet sont empilées, enchaînées, presque innocentes.",
      ],
    },
    {
      id: 'commute_cobbles',
      lines: [
        "Les pavés de la rue des Bouchers, à vélo, c’est un massage gratuit et non sollicité. Votre café remonte jusqu’aux dents.",
      ],
    },
    {
      id: 'commute_biloute',
      when: { flags: ['met_jeremie'], chance: 0.5 },
      speaker: 'biloute',
      lines: [
        "*Biloute s’échappe de la promenade du matin et court après votre roue arrière sur trente mètres. Jérémie crie « Biloute ! » sur trois tons.*",
      ],
    },
    {
      id: 'commute_klaas',
      when: { flags: ['met_klaas'], chance: 0.4 },
      lines: [
        "Au bout de la rue, à sa fenêtre sur la place, Klaas vous fait un petit signe. Puis il regarde sa montre. Puis il note quelque chose.",
      ],
    },
    {
      id: 'commute_tatie',
      when: { flags: ['met_tatie'], chance: 0.4 },
      speaker: 'tatie',
      lines: [
        "« Vous allez travailler en vélo ? Très bien. ‹ Qui pédale le matin ne dort pas en réunion. › » Elle referme sa fenêtre, satisfaite.",
      ],
    },
    {
      id: 'commute_delivery',
      when: { chance: 0.4 },
      lines: [
        "Un camion de livraison bloque la rue, warnings allumés, fûts de bière sur les pavés. Vous passez sur le trottoir, au pas. Le livreur vous salue comme un collègue.",
      ],
    },
    {
      id: 'commute_battery',
      when: { day: [4, 12], chance: 0.3 },
      once: true,
      lines: [
        "À mi-chemin, l’écran du vélo affiche 0 %. Vous l’aviez branché… à la prise du couloir, celle qui ne marche plus depuis la rénovation.",
        "Vingt-quatre kilos de vélo électrique, sans électricité. Vous arrivez chez Koddex en sueur et en retard.",
      ],
      effects: { job: -3, sleep: -2, setFlags: ['ebike_battery_died'] },
    },
    {
      id: 'commute_drache',
      when: { flags: ['random_drache'], chance: 0.6 },
      once: true,
      lines: [
        "Il drache. Vous pédalez quand même. À l’arrivée, Stéphane dit que vous avez « une énergie très outdoor ».",
      ],
    },
    {
      id: 'commute_tired',
      when: { stats: { sleep: '<35' } },
      lines: [
        "Vous pédalez au radar. Le vélo fait le travail, la batterie aussi. Vous, vous comptez les pavés pour ne pas vous endormir.",
      ],
    },
    {
      id: 'commute_saturday_after',
      when: { day: [7, 7] },
      once: true,
      lines: [
        "Dimanche matin, pas de bureau, mais le vélo ressort quand même. Dans la rue, des gobelets, une banane gonflable dégonflée, et votre porte d’entrée qu’il faudra laver.",
      ],
    },
  ],

  // ════════════════════════════════════════════════════════════════════════
  // AU BUREAU : Stéphane en personne, les collègues
  // ════════════════════════════════════════════════════════════════════════
  office: [
    {
      id: 'office_stephane_hello',
      speaker: 'stephane',
      when: { day: [1, 5] },
      once: true,
      lines: [
        "Pilou ! En vrai ! Ça fait plaisir de voir des humains. Viens, on fait un check-in debout, c’est plus agile.",
      ],
    },
    {
      id: 'office_coffee_ac',
      when: { chance: 0.5 },
      once: true,
      lines: [
        "À la machine à café, une collègue baisse la voix : « Il paraît que la femme de Stéphane bosse sur une histoire de clim posée sans autorisation, dans le Vieux-Lille. »",
        "Un autre : « Une clim ? Dans le Vieux-Lille ? En plein été ? Elle va se faire des amis. » Vous buvez votre café très lentement.",
      ],
    },
    {
      id: 'office_lunch_terraces',
      when: { day: [3, 13], chance: 0.5 },
      once: true,
      lines: [
        "À la cantine, la stagiaire raconte sa soirée « trop sympa » en terrasse dans le Vieux-Lille, jusqu’à une heure du matin. Elle cite le nom de la rue.",
        "Vous découpez votre quiche en très petits morceaux.",
      ],
    },
    {
      id: 'office_lunch_inspector',
      when: { flags: ['ac_violation_confirmed'] },
      once: true,
      lines: [
        "Stéphane, à la cantine, rayonnant : « Delphine a fait tomber un dossier de clim hier. Elle était contente. Elle n’est jamais contente. »",
      ],
      speaker: 'stephane',
    },
    {
      id: 'office_battery_joke',
      speaker: 'stephane',
      when: { flags: ['ebike_battery_died'] },
      once: true,
      lines: [
        "Alors, la batterie ? Tu sais qu’on a des bornes au sous-sol ? Non ? C’était dans le Notion d’onboarding. Page 47.",
      ],
    },
    {
      id: 'office_standup',
      speaker: 'stephane',
      when: { chance: 0.4 },
      lines: [
        "Stand-up ! Chacun dit sa victoire de la veille. Pilou ? … « J’ai relevé 71 décibels à 23h40. » Super. On va dire que c’est de la data.",
      ],
    },
    {
      id: 'office_colleague_sleep',
      when: { stats: { sleep: '<30' } },
      lines: [
        "Un collègue vous tend un deuxième café sans rien dire. Puis un troisième. Au bureau, on a compris avant vous.",
      ],
    },
    {
      id: 'office_press',
      when: { flags: ['press_article'] },
      once: true,
      lines: [
        "Quelqu’un a imprimé l’article de La Voix du Nordiste et l’a punaisé à côté de la machine à café, avec une flèche au feutre : « c’est Pilou ?? »",
      ],
    },
  ],

  // ════════════════════════════════════════════════════════════════════════
  // EN TÉLÉTRAVAIL : le bureau du salon, contre la fenêtre sur la rue
  // ════════════════════════════════════════════════════════════════════════
  home: {
    distractions: [
      {
        id: 'home_terrace_setup',
        at: 11 * 60 + 30,
        when: { day: [2, 13] },
        title: '11h30 : la terrasse se monte',
        text:
          "Des raclements de chaises sur les pavés, à un mètre de votre clavier. Par la fenêtre, juste à côté de votre écran, le serveur installe la terrasse. Une table, puis deux, puis une troisième, bien au milieu du passage.",
        choices: [
          {
            label: 'Photographier depuis la fenêtre, horodatage compris',
            requires: { flags: ['legal_view'] },
            effects: {
              job: -2,
              dossier: +2,
              evidence: { kind: 'photo', quality: 0.6, legal: true, label: 'Terrasse montée hors de sa zone à 11h30, photographiée depuis la fenêtre' },
            },
            result: "Plan des zones en main, aucun doute : la troisième table mord sur le couloir avant même le service de midi. Clic. Retour à l’écran, à cinquante centimètres de la scène du crime.",
          },
          {
            label: 'Prendre une photo, pour plus tard',
            effects: {
              job: -2,
              dossier: +1,
              evidence: { kind: 'photo', quality: 0.4, legal: true, label: 'Terrasse en cours d’installation à 11h30, depuis la fenêtre' },
            },
            result: "La photo est nette, l’heure aussi. Sans le plan des zones, difficile de dire où s’arrête leur droit. Mais c’est au dossier.",
          },
          {
            label: 'Rester concentré',
            effects: { job: +1 },
            result: "Vous tournez l’écran pour ne plus voir la rue. Vous l’entendez quand même. Clode Kode vous félicite pour votre « focus remarquable ».",
          },
        ],
      },
      {
        id: 'home_exhaust',
        at: 11 * 60 + 30,
        when: { day: [1, 13], notFlags: ['exhaust_meeting_won'] },
        title: "11h30 : l’odeur arrive",
        text:
          "Votre bureau est à un mètre de la fenêtre, et la gaine juste en dessous : l’extraction démarre, et le clavier sent la friture avant midi.",
        choices: [
          {
            label: 'Fermer les deux fenêtres du salon',
            effects: { job: -1 },
            result: "Il fait vingt-sept degrés dans le salon. Vous tenez dix minutes, fenêtres fermées, en t-shirt. Puis vous rouvrez, et la friture revient.",
          },
          {
            label: 'Envoyer un mot à Tatie : « ça recommence »',
            requires: { flags: ['met_tatie'] },
            effects: { job: -1, asso: +1 },
            result: "Tatie répond en trente secondes : « Je sais. J’ai déjà écrit. Ils m’ont dit que c’était en cours. »",
          },
          {
            label: 'Ignorer, et coder',
            effects: { job: +1 },
            result: "Vous codez en apnée. Clode Kode remarque que vos messages de commit contiennent le mot « frites ».",
          },
        ],
      },
      {
        id: 'home_delivery',
        at: 9 * 60 + 15,
        when: { chance: 0.5 },
        title: '9h15 : la livraison',
        text:
          "Un camion de bière se gare sous vos fenêtres, moteur allumé. Les fûts roulent sur les pavés un par un. Votre café vibre dans la tasse.",
        choices: [
          {
            label: 'Relever les décibels de la livraison',
            effects: { job: -1 },
            result: "74 dB à 9h15. Pas une infraction : la livraison du matin, c’est la vie d’une rue. Mais vous notez. Vous notez toujours.",
          },
          {
            label: 'Mettre un casque et continuer',
            effects: { job: +1 },
            result: "Casque sur les oreilles, playlist « focus ». Les fûts continuent de rouler, mais en musique.",
          },
        ],
      },
      {
        id: 'home_ghislain_stool',
        at: 10 * 60 + 40,
        when: { day: [2, 13], chance: 0.5 },
        title: '10h40 : Ghislain sur son tabouret',
        text:
          "Par la fenêtre, à côté de votre écran : Ghislain, perché sur un tabouret, astique l’enseigne de l’estaminet, chignon impeccable. Il lève les yeux vers votre fenêtre. Vous vous figez.",
        choices: [
          {
            label: 'Lui faire un petit signe',
            effects: { hostility: -2, job: -1 },
            result: "Ghislain vous rend votre signe, d’un hochement d’un millimètre. Dans son classeur mental, une ligne s’ajoute : « Riverain, courtois, 10h40. »",
          },
          {
            label: 'Faire semblant de lire votre écran',
            result: "Vous fixez votre écran avec une concentration de chirurgien. Il est en veille. Ghislain, lui, n’est pas dupe.",
          },
        ],
      },
      {
        id: 'home_jeremie_stairs',
        when: { flags: ['met_jeremie'], chance: 0.4 },
        title: 'Dans l’escalier',
        text:
          "Jérémie frappe à la porte, Biloute dans les bras. « Tu es là ? Parfait. Ton vélo bloque le couloir… non, je plaisante, il est chez toi. Mais tu as cinq minutes pour une signature ? »",
        choices: [
          {
            label: 'Signer, et parler du dossier',
            effects: { job: -2, asso: +2 },
            result: "Cinq minutes deviennent vingt. Biloute renifle le vélo électrique avec méfiance. Jérémie repart avec sa signature et une idée de pétition.",
          },
          {
            label: "« Je suis en réunion, je t’appelle ce soir »",
            effects: { job: +1 },
            result: "Jérémie hoche la tête, compréhensif. Biloute, moins. *Il vous regarde comme on regarde un traître.*",
          },
        ],
      },
    ],

    calls: [
      {
        id: 'call_background',
        speaker: 'stephane',
        when: { day: [1, 6] },
        once: true,
        lines: [
          "Ah, t’es en remote ! C’est quoi, derrière toi, des parasols ? Tu bosses depuis une terrasse ? Respect, c’est très lifestyle.",
        ],
      },
      {
        id: 'call_noise',
        speaker: 'stephane',
        when: { chance: 0.5 },
        lines: [
          "Attends, c’est quoi ce bruit derrière toi ? Des chaises ? Sur des pavés ? Mets-toi en mute quand tu ne parles pas, c’est un process.",
        ],
      },
      {
        id: 'call_lunch',
        speaker: 'stephane',
        when: { chance: 0.4 },
        lines: [
          "Tu manges devant ton écran ? Moi aussi. On est une famille, mais une famille qui mange devant son écran.",
        ],
      },
      {
        id: 'call_delphine',
        speaker: 'stephane',
        when: { flags: ['delphine_dinner'] },
        once: true,
        lines: [
          "Delphine m’a dit que tu avais été « très intéressant » au dîner. Elle ne dit jamais ça. Je ne sais pas si c’est bon signe.",
        ],
      },
      {
        id: 'call_job_low',
        speaker: 'stephane',
        when: { stats: { job: '<45' } },
        lines: [
          "Pilou, je t’appelle en visio parce que c’est plus humain. Ta vélocité baisse. Le télétravail, c’est de la confiance. La confiance, ça se ship.",
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // CLODE KODE : selon le lieu
  // ════════════════════════════════════════════════════════════════════════
  koddex: {
    office: [
      {
        id: 'clode_office_wifi',
        speaker: 'clode',
        lines: ["Bonjour Pierre-Louis. Le wifi du bureau est 40 % plus rapide que le vôtre. Je ne dis pas que c’est mieux. Je le constate."],
      },
      {
        id: 'clode_office_stephane',
        speaker: 'clode',
        when: { chance: 0.5 },
        lines: ["Stéphane se tient derrière vous depuis deux minutes. Je vous suggère de ne pas ouvrir l’onglet « relevés dB » tout de suite."],
      },
      {
        id: 'clode_office_battery',
        speaker: 'clode',
        when: { flags: ['ebike_battery_died'] },
        once: true,
        lines: ["J’ai rédigé un rappel quotidien : « Brancher le vélo à une prise qui fonctionne. » Avec toutes mes excuses pour l’intrusion."],
      },
    ],
    home: [
      {
        id: 'clode_home_focus',
        speaker: 'clode',
        lines: ["Je remarque une baisse de 12 % de votre vitesse de frappe vers 11h30, heure de démarrage de l’extraction. Simple corrélation."],
      },
      {
        id: 'clode_home_window',
        speaker: 'clode',
        when: { chance: 0.5 },
        lines: ["Votre webcam montre surtout l’arrière de votre tête, tournée vers la fenêtre, depuis quatre minutes. Je peux patienter."],
      },
      {
        id: 'clode_home_courtyard',
        speaker: 'clode',
        when: { stats: { sleep: '<35' } },
        lines: ["Puis-je suggérer cinq minutes côté cour, loin de la fenêtre ? Les études montrent que les pigeons sont moins bruyants que les terrasses."],
      },
    ],
  },
};
