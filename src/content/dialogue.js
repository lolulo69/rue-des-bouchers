// Répliques contextuelles du casting (GAME_DESIGN §14). Données pures : aucune logique, aucun DOM.
// { id, speaker, when, lines, effects?, once? }
// when    : conditions §14 (day, phase, flags, notFlags, stats, hidden, chance), toutes facultatives, en ET
// lines   : une ou plusieurs répliques, dites dans l'ordre
// effects : effets §14, petits (une réplique n'est pas une action) · once : une seule fois par campagne
// Règle d'écriture : les actes risqués de Pilou ne sont jamais décrits. On n'en voit que la réaction
// (un drapeau → une surprise, un soupçon, un reproche). Règle des spoilers : voir README.md.

import { WHATSAPP_GROUP } from './characters.js';

export const DIALOGUE = [
  // ════════════════════════════════════════════════════════════════════════
  // JÉRÉMIE — président, procédurier, optimiste par devoir (+ Biloute)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'jeremie_hello',
    speaker: 'jeremie',
    when: { day: [1, 2] }, // met_jeremie est posé dès le matin du J1 : on ne le teste plus (balance pass 3)
    lines: [
      "Pilou ! Le voisin du deuxième. Jérémie, troisième étage, président de l’Association de la rue des Bouchers.",
      "On se croise dans l’escalier depuis deux ans, il était temps qu’on se parle autrement qu’en s’excusant pour le teckel.",
    ],
    effects: { setFlags: ['met_jeremie'] },
    once: true,
  },
  {
    id: 'jeremie_rule_22h',
    speaker: 'jeremie',
    when: { phase: 'night', flags: ['met_jeremie'] },
    lines: [
      "Vingt-deux heures, rue des Bouchers. Pas vingt-deux heures quinze, pas « le temps que les clients finissent leur verre ».",
      "C’est l’arrêté. Je l’ai imprimé, plastifié, et il est dans la poche de la laisse de Biloute.",
    ],
  },
  {
    id: 'jeremie_rule_six',
    speaker: 'jeremie',
    when: { phase: 'night', flags: ['met_jeremie'], chance: 0.5 },
    lines: [
      "Six par table. Compte avec moi : un, deux, trois… huit. Et la poussette, je ne la compte même pas.",
      "On ne s’énerve pas, on note. Un dossier, c’est des chiffres, pas des cris.",
    ],
  },
  {
    id: 'jeremie_rounds_invite',
    speaker: 'jeremie',
    when: { day: [1, 5], phase: 'night', flags: ['met_jeremie'], notFlags: ['joined_rounds'] },
    lines: [
      "Tous les soirs à 22h, je sors Biloute. Officiellement, c’est une promenade hygiénique.",
      "Officieusement, c’est une ronde. Allez, viens. Le chien a le flair, moi j’ai le règlement, toi tu as le téléphone.",
    ],
    effects: { setFlags: ['joined_rounds'] },
    once: true,
  },
  {
    id: 'jeremie_rounds_regular',
    speaker: 'jeremie',
    when: { phase: 'night', flags: ['joined_rounds'], chance: 0.4 },
    lines: [
      "Biloute s’est arrêté devant le pied de parasol de l’estaminet. Il le renifle toujours au même endroit.",
      "Je ne dis pas que c’est une preuve. Je dis que ce chien a de l’instinct juridique.",
    ],
  },
  {
    id: 'jeremie_saturday',
    speaker: 'jeremie',
    when: { day: [6, 6], phase: 'afternoon', flags: ['met_jeremie'] },
    lines: [
      "Samedi. Pas de voitures, donc tout le monde dans la rue, debout, un verre à la main. Le couloir de passage devient une fosse d’orchestre.",
      "Ce soir, on reste groupés, on photographie, et on ne répond à aucune provocation. Même pas à un enterrement de vie de garçon.",
    ],
  },
  {
    id: 'jeremie_dossier_growing',
    speaker: 'jeremie',
    when: { flags: ['met_jeremie'], stats: { dossier: '>=40' } },
    lines: [
      "J’ai relu le dossier hier soir. Il commence à ressembler à quelque chose. Il a même une table des matières.",
      "Un dossier solide, c’est ce qui fait la différence entre « des riverains qui râlent » et « des riverains qui ont raison ».",
    ],
  },
  {
    id: 'jeremie_dossier_thin',
    speaker: 'jeremie',
    when: { day: [8, 13], flags: ['met_jeremie'], stats: { dossier: '<20' } },
    lines: [
      "Je ne veux pas t’alarmer, mais pour la commission on a trois photos floues et un relevé de décibels pris pendant que Biloute aboyait.",
      "Il nous faut du propre. Horodaté. Avec des chaises dedans.",
    ],
  },
  {
    id: 'jeremie_low_sleep',
    speaker: 'jeremie',
    when: { flags: ['met_jeremie'], stats: { sleep: '<25' } },
    lines: [
      "Tu as une tête de dossier classé sans suite. Tu as dormi combien ?",
      "Va te coucher. L’arrêté sera encore là demain. Les chaises aussi, malheureusement.",
    ],
  },
  {
    id: 'jeremie_called_as_asso',
    speaker: 'jeremie',
    when: { flags: ['called_as_asso'] },
    lines: [
      "Tu as appelé la police au nom de l’association ? Ça marche, ils viennent plus vite.",
      "Mais maintenant le bloc sait d’où viennent les appels. On a gagné du temps et perdu l’effet de surprise.",
    ],
    once: true,
  },
  {
    id: 'jeremie_ag_soon',
    speaker: 'jeremie',
    when: { day: [5, 6], phase: 'afternoon', flags: ['met_jeremie'] },
    lines: [
      "L’assemblée générale, c’est dimanche. J’ai préparé l’ordre du jour, les procurations, et un gâteau de Hilde au cas où ça dégénérerait.",
    ],
  },
  {
    id: 'jeremie_stance_direct',
    speaker: 'jeremie',
    when: { flags: ['stance_direct'] },
    lines: [
      "L’AG a voté « action directe ». En tant que président, je prends acte.",
      "En tant que voisin, je te demande juste une chose : que rien ne me retombe sur la tête quand je sors le chien.",
    ],
    once: true,
  },
  {
    id: 'jeremie_shocked_illegal',
    speaker: 'jeremie',
    when: { flags: ['klaas_noted_pilou', 'met_jeremie'] },
    lines: [
      "Klaas m’a lu une ligne de son carnet. Une ligne avec ton nom dedans.",
      "Je ne veux pas savoir. Vraiment. Mais si le bloc l’apprend, c’est toute l’association qui passe pour une bande de voyous.",
    ],
    effects: { asso: -3 },
    once: true,
  },
  {
    id: 'jeremie_commission_eve',
    speaker: 'jeremie',
    when: { day: [13, 13], flags: ['met_jeremie'] },
    lines: [
      "Demain, la commission. J’ai repassé ma chemise et classé les pièces par ordre chronologique, puis par ordre de gravité, puis de nouveau chronologique.",
      "Quoi qu’il arrive, on aura essayé. Proprement. Enfin, le plus proprement possible.",
    ],
  },

  {
    id: 'jeremie_asso_meeting',
    speaker: 'jeremie',
    when: { flags: ['asso_meeting'] },
    lines: [
      "Belle réunion. Quatorze présents, onze chaises, un teckel. On a voté trois motions et mangé deux tartes.",
      "Le compte rendu part ce soir. Je l’ai déjà rédigé, en fait. Avant la réunion. Par efficacité.",
    ],
    once: true,
  },
  {
    id: 'jeremie_reported_mairie',
    speaker: 'jeremie',
    when: { flags: ['reported_mairie'] },
    lines: [
      "Ton signalement est parti à la mairie. Accusé de réception automatique : « Votre demande sera traitée dans les meilleurs délais. »",
      "Les meilleurs délais, en mairie, c’est une unité de mesure à part entière. Mais c’est daté, et c’est ce qui compte.",
    ],
    once: true,
  },
  {
    id: 'jeremie_stance_legal',
    speaker: 'jeremie',
    when: { flags: ['stance_legal'] },
    lines: [
      "L’AG a voté la voie légale. Je ne vais pas mentir : j’ai failli pleurer. Des procédures, des pièces, des dates. Mon terrain.",
    ],
    once: true,
  },
  {
    id: 'jeremie_police_flooded',
    speaker: 'jeremie',
    when: { flags: ['police_flooded', 'met_jeremie'] },
    lines: [
      "Le standard de la police municipale m’a appelé. Moi. Pour me demander si l’association pouvait « calmer un de ses membres ».",
      "Un appel, c’est un signalement. Trente, c’est un fan-club. On revient au dossier, d’accord ?",
    ],
    effects: { asso: -2 },
    once: true,
  },
  {
    id: 'jeremie_exhaust_lost',
    speaker: 'jeremie',
    when: { flags: ['exhaust_meeting_lost'] },
    lines: [
      "Statu quo sur la gaine. La ville « prend acte des positions de chacun ». J’ai pris acte aussi. Dans le classeur rouge.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // KLAAS — voit tout, note tout, horodaté
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'klaas_hello',
    speaker: 'klaas',
    when: { notFlags: ['met_klaas'] },
    lines: [
      "Ja. Vous êtes le jeune homme du numéro 10, deuxième étage. Lumière éteinte à 1h47 hier. Rallumée à 1h52.",
      "Je ne vous espionne pas. Je regarde par la fenêtre. Ce n’est pas pareil.",
    ],
    effects: { setFlags: ['met_klaas'] },
    once: true,
  },
  {
    id: 'klaas_notebook_reading',
    speaker: 'klaas',
    when: { phase: 'night', flags: ['met_klaas'], chance: 0.5 },
    lines: [
      "22h04. Estaminet : terrasse dehors. 22h11 : toujours dehors. 22h19 : on apporte des frites.",
      "Les frites, je les note aussi. Ça montre l’intention.",
    ],
  },
  {
    id: 'klaas_notebook_count',
    speaker: 'klaas',
    when: { flags: ['met_klaas'], day: [3, 14] },
    lines: [
      "Carnet numéro 3. Le numéro 1 est plein, le numéro 2 est chez Hilde, sous la boîte à biscuits. Elle dit qu’il prend de la place.",
    ],
  },
  {
    id: 'klaas_far_away',
    speaker: 'klaas',
    when: { phase: 'night', flags: ['met_klaas'], chance: 0.4 },
    lines: [
      "D’ici je vois toute la rue. Mais de loin. Après 23h, sans les jumelles, une chaise et un client, c’est la même chose.",
      "Les jumelles étaient à mon père. Il comptait les bateaux sur l’Escaut. Moi je compte les tables. Allee.",
    ],
  },
  {
    id: 'klaas_six_per_table',
    speaker: 'klaas',
    when: { phase: 'night', flags: ['met_klaas'], chance: 0.4 },
    lines: [
      "Table du fond, estaminet. Neuf personnes. J’ai compté deux fois. La deuxième fois, il y en avait dix.",
    ],
  },
  {
    id: 'klaas_saturday',
    speaker: 'klaas',
    when: { day: [13, 13], flags: ['met_klaas', 'saturday1_done'] },
    lines: [
      "Samedi dernier : quarante-trois personnes debout, des pipis contre les portes que j’ai arrêté de compter, une qui a chanté. Faux.",
      "Ce soir je prends un carnet neuf. Par précaution.",
    ],
  },
  {
    id: 'klaas_roster',
    speaker: 'klaas',
    when: { flags: ['roster_known'] },
    lines: [
      "J’ai relu mes carnets. Le mardi et le vendredi, c’est toujours la même patrouille. Celle qui ne verbalise jamais.",
      "Je ne dis pas que c’est suspect. Je dis que c’est régulier. Ce qui est régulier, on peut l’écrire.",
    ],
  },
  {
    id: 'klaas_complaisance',
    speaker: 'klaas',
    when: { flags: ['seen_complaisance', 'met_klaas'] },
    lines: [
      "Voiture de police devant l’estaminet. Un café. Puis un deuxième café. Puis le départ. Procès-verbaux : zéro.",
      "C’est la première fois que je souligne une ligne deux fois.",
    ],
    once: true,
  },
  {
    id: 'klaas_noted_pilou',
    speaker: 'klaas',
    when: { flags: ['klaas_noted_pilou'], notFlags: ['klaas_persuaded'] },
    lines: [
      "Je vous ai vu. Je l’ai noté. Avec l’heure.",
      "Je note tout le monde, jongen. C’est pour ça qu’on me croit.",
    ],
    once: true,
  },
  {
    id: 'klaas_persuaded',
    speaker: 'klaas',
    when: { flags: ['klaas_persuaded'] },
    lines: [
      "Hier soir, entre 23h et minuit, j’ai… nettoyé mes lunettes. Longtemps.",
      "Hilde dit que ça arrive à tout le monde. Je ne suis pas d’accord, mais c’est noté nulle part.",
    ],
    once: true,
  },
  {
    id: 'klaas_asleep',
    speaker: 'klaas',
    when: { phase: 'afternoon', flags: ['met_klaas'], stats: { sleep: '<30' } },
    lines: [
      "Vous avez les mêmes yeux que moi après la Fête de la musique 2019. Je l’avais noté aussi.",
    ],
  },
  {
    id: 'klaas_exhaust',
    speaker: 'klaas',
    when: { flags: ['met_klaas'], chance: 0.3 },
    lines: [
      "Même d’ici, quand le vent vient du sud, je sens la friture. Hilde a ouvert la fenêtre hier. Elle l’a refermée.",
    ],
  },

  {
    id: 'klaas_ocr',
    speaker: 'klaas',
    when: { flags: ['proj_klaas_ocr'] },
    lines: [
      "Vous avez mis mes carnets dans l’ordinateur ? Tout ? Même le chapitre sur le pigeon de 2021 ?",
      "Ja. Le tableur ne fait pas de fautes. Moi non plus. Nous allons bien nous entendre.",
    ],
    once: true,
  },
  {
    id: 'klaas_saturday2',
    speaker: 'klaas',
    when: { flags: ['saturday2_done', 'met_klaas'] },
    lines: [
      "Deux samedis. J’ai fait la moyenne : quarante et une personnes debout, deux portes arrosées, zéro procès-verbal.",
      "La moyenne, c’est la seule chose dans cette rue qui ne déborde pas.",
    ],
    once: true,
  },
  {
    id: 'klaas_cardboard',
    speaker: 'klaas',
    when: { flags: ['cardboard_exhaust', 'met_klaas'] },
    lines: [
      "7h10, sortie de l’extraction : un carton. Je l’ai noté. Qui l’a posé, je ne l’ai pas vu.",
      "Je l’ai écrit comme ça : « pas vu ». C’est la vérité. Ce n’est pas toute la vérité, mais c’est la mienne.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // HILDE — tisane, soupe, tarte au sucre, déteste la violence
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'hilde_hello',
    speaker: 'hilde',
    when: { notFlags: ['met_hilde'] },
    lines: [
      "Vous êtes Pilou ? Klaas m’a parlé de vous. Enfin, il m’a lu ce qu’il a écrit sur vous. C’est gentil, rassurez-vous.",
      "Prenez une part de tarte au sucre. On ne se bat pas le ventre vide.",
    ],
    effects: { setFlags: ['met_hilde'] },
    once: true,
  },
  {
    id: 'hilde_tisane',
    speaker: 'hilde',
    when: { flags: ['met_hilde'], notFlags: ['hilde_tisane'], stats: { sleep: '<40' } },
    lines: [
      "Tenez, une tisane. Tilleul, verveine, et un petit secret de ma grand-mère.",
      "Le secret, c’est le miel. Mais ne le dites pas, ça casse la magie.",
    ],
    effects: { sleep: +10, setFlags: ['hilde_tisane'] },
    once: true,
  },
  {
    id: 'hilde_soup',
    speaker: 'hilde',
    when: { phase: 'afternoon', flags: ['hilde_tisane'], stats: { sleep: '<30' } },
    lines: [
      "Je vous ai gardé de la soupe. Poireaux, pommes de terre. Rien qui fasse du bruit.",
    ],
    effects: { sleep: +5 },
  },
  {
    id: 'hilde_klaas',
    speaker: 'hilde',
    when: { flags: ['met_hilde', 'met_klaas'], chance: 0.5 },
    lines: [
      "Klaas a encore passé la soirée à la fenêtre. Je lui ai mis un coussin sur le rebord, au moins il ne se fait plus mal aux coudes.",
      "Il dit qu’il veille sur la rue. Moi je veille sur lui. Quelqu’un doit bien le faire.",
    ],
  },
  {
    id: 'hilde_noise',
    speaker: 'hilde',
    when: { phase: 'night', flags: ['met_hilde'], chance: 0.4 },
    lines: [
      "Les chaises sur les pavés, à 22h… Ça me rappelle les trains de marchandises de mon enfance. Sauf que les trains, eux, partaient.",
    ],
  },
  {
    id: 'hilde_waiter',
    speaker: 'hilde',
    when: { flags: ['met_hilde'], chance: 0.3 },
    lines: [
      "Le petit serveur, en bas de chez vous, il a l’air si fatigué. Je lui apporterais bien une soupe, à lui aussi.",
      "Ce n’est pas lui qui a décidé de la terrasse. Il ne faut pas se tromper de colère.",
    ],
  },
  {
    id: 'hilde_bucket',
    speaker: 'hilde',
    when: { flags: ['bucket_witnessed', 'met_hilde'] },
    lines: [
      "On m’a parlé d’un seau. Je n’ai pas voulu entendre la suite.",
      "L’eau, Pilou, c’est pour la tisane.",
    ],
    effects: { asso: -2 },
    once: true,
  },
  {
    id: 'hilde_kitchen',
    speaker: 'hilde',
    when: { flags: ['kitchen_sabotaged', 'met_hilde'] },
    lines: [
      "On dit que la carbonnade de l’estaminet avait un drôle de goût hier. Klaas a ri. Moi pas.",
      "On ne joue pas avec l’assiette des gens. Même celle de Dédé.",
    ],
    once: true,
  },
  {
    id: 'hilde_custody_risk',
    speaker: 'hilde',
    when: { flags: ['met_hilde'], stats: { risk: '>=60' } },
    lines: [
      "Vous avez l’air de quelqu’un qui regarde par-dessus son épaule. Klaas fait pareil, mais lui c’est pour voir.",
      "Promettez-moi de ne rien faire de bête. Ou au moins de manger avant.",
    ],
  },
  {
    id: 'hilde_ag',
    speaker: 'hilde',
    when: { day: [7, 7], flags: ['met_hilde'] },
    lines: [
      "J’ai fait deux gâteaux pour l’assemblée générale. Un pour ceux qui gagnent le vote, un pour consoler les autres.",
    ],
  },

  {
    id: 'hilde_complaint',
    speaker: 'hilde',
    when: { flags: ['complaint_filed', 'met_hilde'] },
    lines: [
      "Une plainte contre vous ? Mon Dieu. Je vous ai fait un gratin.",
      "Au commissariat on mange mal, tout le monde le sait. Gardez-en un peu, au cas où.",
    ],
    once: true,
  },
  {
    id: 'hilde_ag_held',
    speaker: 'hilde',
    when: { flags: ['ag_held', 'met_hilde'] },
    lines: [
      "Les deux gâteaux sont partis. Celui des gagnants et celui des perdants. Je crois que certains ont voté deux fois pour avoir les deux.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // TATIE BOUCHON — proverbes bancals, e-mails, girouette, thé avec Martine
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'tatie_hello',
    speaker: 'tatie',
    when: { day: [1, 3] }, // tatie_mail_01 pose met_tatie dès le matin du J1 (balance pass 3)
    lines: [
      "Ah, le petit du numéro 10 ! Asseyez-vous. Je vais vous dire une chose que la vie m’a apprise.",
      "« Si vous voulez quelque chose dans la vie, faut résister et se battre pour. » Voilà. Un biscuit ?",
    ],
    effects: { setFlags: ['met_tatie'] },
    once: true,
  },
  {
    id: 'tatie_emails',
    speaker: 'tatie',
    when: { flags: ['met_tatie'], chance: 0.5 },
    lines: [
      "J’ai encore écrit à l’estaminet pour l’odeur de friture. Réponse dans l’heure : « c’est en cours de résolution ».",
      "En cours depuis trois ans. À ce rythme-là, je serai résolue avant eux.",
    ],
  },
  {
    id: 'tatie_mail_3',
    speaker: 'tatie',
    when: { flags: ['tatie_mail_3'] },
    lines: [
      "Encore une promesse. Je les imprime, vous savez. Je les range dans une boîte à chaussures. Elle s’appelle « En cours ».",
    ],
    once: true,
  },
  {
    id: 'tatie_mail_7',
    speaker: 'tatie',
    when: { flags: ['tatie_mail_7'] },
    lines: [
      "Encore une promesse, encore un « c’est en cours ». Même ma machine à laver a un programme plus court.",
      "« Promesse qui traîne ne vaut pas le papier de l’imprimante. » C’est de moi, celle-là.",
    ],
    once: true,
  },
  {
    id: 'tatie_proverb_sleep',
    speaker: 'tatie',
    when: { flags: ['met_tatie'], stats: { sleep: '<35' } },
    lines: [
      "Vous avez une mine… « Qui dort dîne », qu’on dit. Mais qui dîne en terrasse ne laisse dormir personne.",
    ],
  },
  {
    id: 'tatie_proverb_dossier',
    speaker: 'tatie',
    when: { flags: ['met_tatie'], stats: { dossier: '>=30' } },
    lines: [
      "« Petit à petit, l’oiseau fait son dossier. » Continuez comme ça, mon petit. Et mettez des dates, la mairie adore les dates.",
    ],
  },
  {
    id: 'tatie_martine',
    speaker: 'tatie',
    when: { flags: ['met_tatie'], chance: 0.4 },
    lines: [
      "J’ai pris le thé avec Martine, mardi. Une femme charmante. Elle dit que la convivialité, c’est l’âme de Lille.",
      "Moi je dis que l’âme de Lille, elle aimerait bien dormir aussi. Mais je l’ai dit gentiment, on était sur ses biscuits.",
    ],
  },
  {
    id: 'tatie_wavering',
    speaker: 'tatie',
    when: { flags: ['tatie_wavering'] },
    lines: [
      "Dédé m’a offert un petit verre de genièvre, l’autre jour. Il est moins méchant qu’on le dit, vous savez.",
      "Enfin… « Il ne faut pas juger un estaminet à son genièvre. » Non, attendez, je ne sais plus dans quel sens elle va, celle-là.",
    ],
    once: true,
  },
  {
    id: 'tatie_resist',
    speaker: 'tatie',
    when: { flags: ['met_tatie'], notFlags: ['tatie_wavering'], stats: { asso: '<30' } },
    lines: [
      "Les autres se découragent ? Pas moi. « Si vous voulez quelque chose dans la vie, faut résister et se battre pour. »",
      "Je l’ai brodée sur un coussin. Le coussin résiste très bien.",
    ],
  },
  {
    id: 'tatie_shared',
    speaker: 'tatie',
    when: { flags: ['tatie_emails_shared'] },
    lines: [
      "J’ai tout donné à Jérémie, la boîte à chaussures entière. Il a fait des photocopies. Il avait les larmes aux yeux.",
      "Trois ans d’« en cours », ça finit par peser lourd. Au sens propre : il a fallu un cabas.",
    ],
    once: true,
  },
  {
    id: 'tatie_shocked',
    speaker: 'tatie',
    when: { flags: ['stink_bomb', 'met_tatie'] },
    lines: [
      "Il paraît qu’il y a eu une odeur pire que la friture, hier soir. Je ne pensais pas que c’était possible.",
      "« Ce n’est pas en ajoutant de l’odeur qu’on enlève l’odeur. » Retenez bien celle-là.",
    ],
    once: true,
  },

  {
    id: 'tatie_mail_12',
    speaker: 'tatie',
    when: { flags: ['tatie_mail_12'] },
    lines: [
      "Douze. La dernière, c’est une réponse automatique. Même leur ordinateur me dit que c’est en cours.",
      "« Quand la machine répond à la place de l’homme, c’est que l’homme n’a plus rien à dire. » Je l’imprime aussi, celle-là.",
    ],
    once: true,
  },
  {
    id: 'tatie_bloc_fooled',
    speaker: 'tatie',
    when: { flags: ['bloc_fooled', 'met_tatie'] },
    lines: [
      "J’ai raconté à Martine le plan que vous m’aviez confié. Il paraît qu’en bas, ils ont tout rangé pour rien toute la soirée.",
      "« Qui sème le vent récolte des chaises vides. » Je ne me sens pas du tout coupable. Un peu fière, même.",
    ],
    once: true,
  },
  {
    id: 'tatie_hygiene',
    speaker: 'tatie',
    when: { flags: ['hygiene_visit', 'met_tatie'] },
    lines: [
      "Le service d’hygiène est venu à l’estaminet ! Ghislain m’a écrit que c’était « une visite de courtoisie ».",
      "De la courtoisie avec des gants en latex et une lampe torche. Je veux bien la même chez moi.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // SEB — le feuilletonniste du balcon, admin du groupe
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'seb_hello',
    speaker: 'seb',
    when: { notFlags: ['met_seb_nico'] },
    lines: [
      "Pilou ! Enfin ! Attends, attends : on te voit tous les soirs à ta fenêtre, on se demandait quand tu traverserais.",
      `Tu es bien dans « ${WHATSAPP_GROUP} » ? Désactive les notifs, sinon tu ne dormiras pas mieux.`,
    ],
    effects: { setFlags: ['met_seb_nico'] },
    once: true,
  },
  {
    id: 'seb_group_activity',
    speaker: 'seb',
    when: { flags: ['met_seb_nico'], phase: 'night', chance: 0.5 },
    lines: [
      `Il y a eu quarante-deux messages sur « ${WHATSAPP_GROUP} » hier soir, entre 22h et minuit. Dont trente-neuf photos de la même table.`,
      "C’est la table qui a changé, attends, regarde : ils ont rajouté une chaise pliante.",
    ],
  },
  {
    id: 'seb_cat',
    speaker: 'seb',
    when: { flags: ['met_seb_nico'], phase: 'night', chance: 0.4 },
    lines: [
      "Gaufre est rentrée à 23h12. C’est notre indicateur : quand la chatte en a marre du bruit, c’est qu’on dépasse les bornes.",
    ],
  },
  {
    id: 'seb_saturday',
    speaker: 'seb',
    when: { day: [6, 6], phase: 'night', flags: ['met_seb_nico'] },
    lines: [
      "Attends, attends. Il y a un enterrement de vie de garçon en costumes de banane. Six bananes à une table. Non, huit. Il en arrive encore.",
      "Je filme ou je compte ? Les deux ? Les deux.",
    ],
  },
  {
    id: 'seb_pee_door',
    speaker: 'seb',
    when: { flags: ['pee_at_door', 'met_seb_nico'] },
    lines: [
      "Pilou. Je l’ai vu depuis le balcon. Contre TA porte. Gaufre a détourné le regard, c’est dire.",
      "J’ai la photo. De dos, rassure-toi. Nico l’a déjà archivée dans « Captures ».",
    ],
    once: true,
  },
  {
    id: 'seb_tipoff',
    speaker: 'seb',
    when: { flags: ['seen_tipoff', 'met_seb_nico'] },
    lines: [
      "Tu as vu ? Les tables rentrent toutes d’un coup, et la police arrive cinq minutes après. Cinq minutes pile.",
      "Quelqu’un a un coup de fil d’avance, et c’est pas la météo.",
    ],
    once: true,
  },
  {
    id: 'seb_traitor',
    speaker: 'seb',
    when: { flags: ['traitor_known', 'met_seb_nico'], notFlags: ['traitor_public'] },
    lines: [
      "Régis. RÉGIS. Celui qui « comprend les deux côtés ». Il comprenait surtout la carte des desserts.",
      "Nico veut le retirer du groupe. Moi je veux qu’il reste, pour voir sa tête quand on parle de lui.",
    ],
    once: true,
  },
  {
    id: 'seb_bucket',
    speaker: 'seb',
    when: { flags: ['bucket_witnessed', 'met_seb_nico'] },
    lines: [
      "Attends. ATTENDS. C’était toi, le seau ?! Gaufre est rentrée en courant, j’ai cru qu’il pleuvait d’un seul côté de la rue.",
      "Je n’ai rien posté. Pour l’instant. Tu me dois une histoire.",
    ],
    once: true,
  },
  {
    id: 'seb_video',
    speaker: 'seb',
    when: { flags: ['video_viral'] },
    lines: [
      "Pilou… tu es sur TikTok. Pas dans le bon sens. Ma cousine de Roubaix me l’a envoyé.",
    ],
    effects: { asso: -2 },
    once: true,
  },
  {
    id: 'seb_banners',
    speaker: 'seb',
    when: { flags: ['banners_up', 'met_seb_nico'] },
    lines: [
      "« LE SOMMEIL EST UN DROIT », en lettres de quarante centimètres. On l’a vue depuis la place. Les clients prennent des selfies devant.",
      "On est devenus une attraction. C’était pas le plan, mais j’adore.",
    ],
    once: true,
  },

  {
    id: 'seb_martine_ignored',
    speaker: 'seb',
    when: { flags: ['martine_dinner_ignored', 'met_seb_nico'] },
    lines: [
      "Martine Aubrac a dîné EN BAS DE CHEZ TOI et tu n’as même pas ouvert la fenêtre ?!",
      "J’ai dû tout raconter dans le groupe tout seul. Avec des photos de travers. Tu me dois un feuilleton.",
    ],
    once: true,
  },
  {
    id: 'seb_inspector_surprise',
    speaker: 'seb',
    when: { flags: ['inspector_surprise', 'met_seb_nico'] },
    lines: [
      "Attends, attends. L’inspectrice est arrivée à pied, sans prévenir, avec un mètre laser. Ghislain a lâché son classeur.",
      "Le chignon a bougé. Je te jure. Il a BOUGÉ.",
    ],
    once: true,
  },
  {
    id: 'seb_read_reservations',
    speaker: 'seb',
    when: { flags: ['read_reservations', 'met_seb_nico'] },
    lines: [
      "Attends. Tu SAIS combien de couverts ils ont pris samedi ? Non. Je veux pas savoir comment. Si, je veux savoir. Non.",
      "Bon. Je n’ai rien entendu. Mais je n’ai rien entendu très attentivement.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // NICO — pince-sans-rire, archive tout, pose la question qui fâche
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'nico_hello',
    speaker: 'nico',
    when: { flags: ['met_seb_nico'], notFlags: ['joined_whatsapp'] },
    lines: [
      "Règles du groupe : on reste poli, on horodate, et on ne parle pas de la carbonnade. La troisième, c’est moi qui l’ai ajoutée.",
      "Seb enfreint la deuxième tous les jours. On l’aime quand même.",
    ],
  },
  {
    id: 'nico_screenshots',
    speaker: 'nico',
    when: { flags: ['met_seb_nico'], chance: 0.4 },
    lines: [
      "J’ai un dossier « Captures » sur le téléphone. Deux mille quatre cents images. Dont quatre de vacances.",
    ],
  },
  {
    id: 'nico_corridor',
    speaker: 'nico',
    when: { phase: 'night', flags: ['met_seb_nico'], chance: 0.4 },
    lines: [
      "Question bête : le couloir de passage, il fait combien de large ? Parce qu’une poussette vient de faire demi-tour.",
      "Seb dit qu’elle allait dans l’autre sens. Elle n’allait pas dans l’autre sens.",
    ],
  },
  {
    id: 'nico_legal_view',
    speaker: 'nico',
    when: { flags: ['legal_view', 'met_seb_nico'] },
    lines: [
      "Tu as le plan des zones ? Montre. … Ah. Donc les trois tables collées à notre porte d’entrée sont, techniquement, chez nous.",
      "Je vais imprimer ça en A3. Pour le frigo.",
    ],
    once: true,
  },
  {
    id: 'nico_rally',
    speaker: 'nico',
    when: { flags: ['whatsapp_rally'] },
    lines: [
      "Ton message de mobilisation a eu dix-sept pouces levés et un « je peux pas ce soir, j’ai yoga ». C’est un record.",
    ],
    once: true,
  },
  {
    id: 'nico_risky',
    speaker: 'nico',
    when: { flags: ['met_seb_nico'], stats: { risk: '>=50' } },
    lines: [
      "Je pose la question parce que personne ne la pose : si la police sonne chez toi demain, on dit quoi dans le groupe ?",
      "Moi je dis rien. J’archive.",
    ],
  },
  {
    id: 'nico_fake_reviews',
    speaker: 'nico',
    when: { flags: ['fake_reviews_traced'] },
    lines: [
      "Les faux avis. Ils sont remontés jusqu’à toi. J’ai supprimé trois messages du groupe ce matin, juste au cas où.",
      "Ne me remercie pas. Ne me raconte rien non plus.",
    ],
    once: true,
  },
  {
    id: 'nico_hate_wave',
    speaker: 'nico',
    when: { flags: ['cm_fake_post'] },
    lines: [
      "Le post « Bernadette harcelée » tourne partout. Des milliers de partages. Bernadette n’existe pas, mais elle a déjà un comité de soutien.",
      "Ne réponds pas à chaud. Réponds bien, ou ne réponds pas.",
    ],
    once: true,
  },
  {
    id: 'nico_sleep',
    speaker: 'nico',
    when: { flags: ['met_seb_nico'], stats: { sleep: '<25' } },
    lines: [
      "Tu as envoyé un message à 4h12 dans le groupe. Il disait juste « chaise ». On s’inquiète.",
    ],
  },

  {
    id: 'nico_filmed_faces',
    speaker: 'nico',
    when: { flags: ['filmed_faces', 'met_seb_nico'] },
    lines: [
      "Tu as filmé des clients à visage découvert. Règle numéro un du groupe. Je ne poste pas ça.",
      "Floute, ou garde-le pour toi. Une vidéo de visages, c’est une plainte qui attend son tour.",
    ],
    once: true,
  },
  {
    id: 'nico_read_emails',
    speaker: 'nico',
    when: { flags: ['read_emails', 'met_seb_nico'] },
    lines: [
      "Tu as des e-mails de l’estaminet. Je ne te demande pas d’où ils sortent.",
      "Je constate juste qu’on ne pourra jamais les montrer à la commission. Ce sont les preuves les plus inutiles et les plus savoureuses de l’année.",
    ],
    once: true,
  },
  {
    id: 'nico_fake_reviews_seen',
    speaker: 'nico',
    when: { flags: ['fake_reviews', 'met_seb_nico'], notFlags: ['fake_reviews_traced'] },
    lines: [
      "Quarante avis une étoile sur l’estaminet depuis hier. Tous avec la même virgule mal placée.",
      "Moi, j’ai rien vu. J’archive, c’est tout. Et j’archive ça très loin.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // HIPPOLYTE — carrossier héritier, patrimoine, vouvoie tout le monde
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'hippolyte_hello',
    speaker: 'hippolyte',
    when: { notFlags: ['met_hippolyte'] },
    lines: [
      "Monsieur Dubeton. Entrez, je vous prie. Attention aux pavés de la cour : ils ont vu passer des calèches avant de voir passer des trottinettes.",
      "Ma famille fabrique ici depuis 1827. Nous avons survécu à deux guerres et au canal. Nous survivrons à une terrasse.",
    ],
    effects: { setFlags: ['met_hippolyte'] },
    once: true,
  },
  {
    id: 'hippolyte_trou',
    speaker: 'hippolyte',
    when: { flags: ['met_hippolyte'], notFlags: ['knows_trou'] },
    lines: [
      "Savez-vous comment on appelait la rue des Bouchers, pendant des siècles ? « Le Trou ». Tant elle était sale.",
      "Les restaurateurs disent que c’est une rue de fête depuis toujours. Je leur réponds que c’est surtout un trou depuis toujours.",
    ],
    effects: { setFlags: ['knows_trou'] },
    once: true,
  },
  {
    id: 'hippolyte_canal',
    speaker: 'hippolyte',
    when: { flags: ['met_hippolyte'], chance: 0.4 },
    lines: [
      "Jusqu’en 1912, un canal coulait sous la rue. On l’a couvert. On aurait pu, dans un élan d’audace, y verser les chaises.",
      "Je plaisante, naturellement. Le patrimoine ne mérite pas ça.",
    ],
  },
  {
    id: 'hippolyte_ac',
    speaker: 'hippolyte',
    when: { flags: ['met_hippolyte'], chance: 0.5 },
    lines: [
      "Une climatisation posée sur une façade de 1729, sans autorisation. C’est comme coller un autocollant sur un Rubens.",
      "Le service du patrimoine n’aime pas les autocollants. Je connais personnellement trois personnes qui n’aiment pas les autocollants.",
    ],
  },
  {
    id: 'hippolyte_heritage',
    speaker: 'hippolyte',
    when: { flags: ['heritage_angle'] },
    lines: [
      "J’ai écrit au service du patrimoine. Sur papier à en-tête, à la plume. Ils m’ont répondu sous huit jours. Personne n’a jamais vu ça.",
    ],
    once: true,
  },
  {
    id: 'hippolyte_room',
    speaker: 'hippolyte',
    when: { flags: ['hippolyte_room'] },
    lines: [
      "L’atelier est à vous. Le chauffage date de 1954, le café de ce matin. Ne vous asseyez pas sur la banquette du landau, elle est classée dans mon cœur.",
    ],
    once: true,
  },
  {
    id: 'hippolyte_saturday',
    speaker: 'hippolyte',
    when: { day: [6, 6], flags: ['met_hippolyte'] },
    lines: [
      "Samedi, pas de voitures. Mon arrière-grand-père se plaignait déjà des fiacres. Il aurait préféré les fiacres, croyez-moi.",
    ],
  },
  {
    id: 'hippolyte_sabotage',
    speaker: 'hippolyte',
    when: { flags: ['sabotage_parasols', 'met_hippolyte'] },
    lines: [
      "J’apprends que des parasols ont disparu. Je ne pose aucune question. Je remarque simplement que la discrétion est une vertu ancienne.",
      "Une vertu que La Voix du Nordiste, en revanche, ne pratique guère.",
    ],
    once: true,
  },
  {
    id: 'hippolyte_bombance',
    speaker: 'hippolyte',
    when: { flags: ['bombance_rumour', 'met_hippolyte'] },
    lines: [
      "La Bombance, au numéro 4. Un bar voudrait s’y installer. Ce local était une sellerie en 1880. J’ai les plans.",
      "Les plans sont une arme élégante, monsieur Dubeton. Ils ne font aucun bruit.",
    ],
    once: true,
  },

  {
    id: 'hippolyte_ac_stalled',
    speaker: 'hippolyte',
    when: { flags: ['ac_case_stalled', 'met_hippolyte'] },
    lines: [
      "Le dossier de la climatisation s’enlise. Comme le canal avant qu’on le couvre, en 1912.",
      "Je vais écrire au patrimoine une seconde fois. Sur un papier plus épais.",
    ],
    once: true,
  },
  {
    id: 'hippolyte_inspector_announced',
    speaker: 'hippolyte',
    when: { flags: ['inspector_announced', 'met_hippolyte'] },
    lines: [
      "Une visite annoncée trois jours à l’avance. Et, par un heureux hasard, la climatisation s’était déguisée en jardinière la veille.",
      "Mon arrière-grand-père appelait cela « recevoir ». Moi, j’appelle cela « prévenir ».",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // LE BLOC — Dédé, Ghislain, le serveur
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'dede_jovial',
    speaker: 'dede',
    when: { day: [1, 5] },
    lines: [
      "Ah, le voisin du dessus ! Allez va, descends boire un coup, c’est la maison qui offre. On est voisins, on est une famille !",
      "Une famille où il y en a un qui dort, et l’autre qui travaille. Hé hé.",
    ],
  },
  {
    id: 'dede_rue_de_gand',
    speaker: 'dede',
    when: { phase: 'night', chance: 0.4 },
    lines: [
      "Vingt-deux heures ? Rue de Gand, ils ferment à minuit ! Minuit, mon biloute ! Et personne ne meurt, rue de Gand.",
    ],
  },
  {
    id: 'dede_threat_smile',
    speaker: 'dede',
    when: { hidden: { hostility: '>=50' } },
    lines: [
      "Tu sais ce que j’aime dans cette rue ? Tout le monde se connaît. Tout le monde sait où tout le monde habite.",
      "C’est convivial, hein. Allez, bonne soirée.",
    ],
  },
  {
    id: 'dede_carbonnade',
    speaker: 'dede',
    when: { flags: ['carbonnade_1'] },
    lines: [
      "Alors, cette carbonnade ? Hein ? Avoue. Avoue qu’elle est bonne. Klaas te regarde, mais avoue quand même.",
    ],
    once: true,
  },
  {
    id: 'dede_kitchen',
    speaker: 'dede',
    when: { flags: ['kitchen_sabotaged'], notFlags: ['kitchen_sabotage_caught'] },
    lines: [
      "Une carbonnade sucrée comme un gâteau. Une crème brûlée salée comme la mer du Nord. Vingt ans de métier, jamais vu ça.",
      "Je ne sais pas qui. Mais je cherche, mon biloute. Je cherche.",
    ],
    effects: { hostility: +5 },
    once: true,
  },
  {
    id: 'ghislain_email',
    speaker: 'ghislain',
    when: { flags: ['met_tatie'] },
    lines: [
      "Nous prenons bonne note de votre remarque concernant les nuisances olfactives. Le dossier est en cours de résolution.",
      "Je vous remercie pour votre patience, qui est, je n’en doute pas, inépuisable. Bien cordialement.",
    ],
  },
  {
    id: 'ghislain_paperwork',
    speaker: 'ghislain',
    when: { chance: 0.4 },
    lines: [
      "Notre autorisation d’occupation temporaire est parfaitement en règle. Je l’ai sous les yeux. Non, vous ne pouvez pas la voir.",
    ],
  },
  {
    id: 'ghislain_ac',
    speaker: 'ghislain',
    when: { day: [8, 10] },
    lines: [
      "La climatisation fait l’objet d’une régularisation administrative. C’est un mot long, qui veut dire que c’est en cours.",
    ],
  },
  {
    id: 'ghislain_formal_notice',
    speaker: 'ghislain',
    when: { flags: ['formal_notice'] },
    lines: [
      "Nous avons reçu votre mise en demeure. Elle est très bien rédigée. Je l’ai classée avec les autres. Le classeur est vert.",
    ],
    once: true,
  },
  {
    id: 'ghislain_camera',
    speaker: 'ghislain',
    when: { flags: ['camera_found'] },
    lines: [
      "Nous avons trouvé un objet qui n’était pas à nous sous notre store. Nous avons ouvert un dossier. Il est déjà très épais.",
    ],
    effects: { hostility: +5 },
    once: true,
  },
  {
    id: 'serveur_tired',
    speaker: 'serveur',
    when: { phase: 'night', chance: 0.4 },
    lines: [
      "Je fais que mon taf, moi. Quinze heures debout, et les gens me demandent pourquoi je souris pas.",
    ],
  },
  {
    id: 'serveur_22h',
    speaker: 'serveur',
    when: { phase: 'night', flags: ['asked_waiter'] },
    lines: [
      "Je sais, il est 22h. Je sais. Moi je rentrerais tout. Mais c’est pas moi qui décide, c’est le monsieur au chignon.",
    ],
  },
  {
    id: 'serveur_named',
    speaker: 'serveur',
    when: { flags: ['met_waiter'], phase: 'night', chance: 0.4 },
    lines: [
      "Tu m’appelles Théo maintenant ? Ça fait bizarre. Ici on m’appelle « s’il vous plaît », « hep » ou « garçon ».",
    ],
  },
  {
    id: 'serveur_suspicious',
    speaker: 'serveur',
    when: { flags: ['sabotage_chairs'] },
    lines: [
      "Trois chaises qui lâchent dans la même soirée. Dédé a regardé toutes les fenêtres de la rue. Surtout la vôtre.",
      "Moi j’ai rien vu. Mais à votre place, je descendrais pas l’escalier en sifflant.",
    ],
    once: true,
  },
  {
    id: 'serveur_fired',
    speaker: 'serveur',
    when: { flags: ['waiter_fired'] },
    lines: [
      "Ils m’ont viré. Bon. Au moins je vais pouvoir dormir. Ça, je vous l’envie pas, vous.",
    ],
    once: true,
  },

  {
    id: 'ghislain_hygiene',
    speaker: 'ghislain',
    when: { flags: ['hygiene_visit'] },
    lines: [
      "Le service d’hygiène nous a rendu une visite de courtoisie. Nous avons apprécié leur courtoisie. Nous avons noté le nom de chacun.",
    ],
    effects: { hostility: +3 },
    once: true,
  },
  {
    id: 'ghislain_lawyer',
    speaker: 'ghislain',
    when: { flags: ['cm_lawyer_reply'] },
    lines: [
      "Notre conseil vous a répondu. Sur papier à en-tête. Il est très cher, ce papier. Nous comptons sur vous pour le lire en entier.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // POLICE — Lemaire, Benali, le chef
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'lemaire_order',
    speaker: 'lemaire',
    when: { phase: 'night', flags: ['called_police'], notFlags: ['lemaire_transferred'] },
    lines: [
      "Tout est en ordre, monsieur. Les tables sont rentrées. Si elles étaient dehors avant, nous n’étions pas là pour le voir.",
    ],
  },
  {
    id: 'lemaire_priorities',
    speaker: 'lemaire',
    when: { phase: 'night', flags: ['called_police'], notFlags: ['lemaire_transferred'], chance: 0.5 },
    lines: [
      "Vous savez, monsieur, on a d’autres priorités. Des vraies. Avec des gens qui crient, pas avec des chaises.",
    ],
  },
  {
    id: 'lemaire_again',
    speaker: 'lemaire',
    when: { flags: ['serial_caller'] },
    lines: [
      "C’est encore vous. On commence à reconnaître votre numéro au standard. Il y a un petit dessin à côté.",
    ],
  },
  {
    id: 'lemaire_coffee',
    speaker: 'lemaire',
    when: { flags: ['seen_complaisance'] },
    lines: [
      "Un café, ce n’est pas un pot-de-vin, monsieur. C’est un geste. Deux cafés, c’est de la politesse. Le waterzooi… c’est de la gastronomie.",
    ],
  },
  {
    id: 'lemaire_transferred',
    speaker: 'lemaire',
    when: { flags: ['lemaire_transferred'] },
    lines: [
      "Muté aux parcmètres de Lomme. Vous êtes content ? Là-bas, personne ne m’offre rien. Même pas un sourire.",
    ],
    once: true,
  },
  {
    id: 'benali_by_book',
    speaker: 'benali',
    when: { phase: 'night', flags: ['called_police'] },
    lines: [
      "Bonsoir, monsieur. Agent Benali. J’ai constaté sept tables en terrasse à 22h26, en infraction à l’arrêté municipal. Je verbalise.",
      "Oui, même celle-là. Oui, même avec le dessert.",
    ],
  },
  {
    id: 'benali_fined',
    speaker: 'benali',
    when: { flags: ['benali_fined'] },
    lines: [
      "Le procès-verbal est dressé. Ma hiérarchie appréciera. Ou pas. On verra bien.",
    ],
    once: true,
  },
  {
    id: 'benali_tired',
    speaker: 'benali',
    when: { flags: ['benali_fined'], chance: 0.4 },
    lines: [
      "On m’a demandé en réunion si je ne verbalisais pas « un peu trop ». J’ai demandé combien c’était, « assez ». Pas de réponse.",
    ],
  },
  {
    id: 'benali_transferred',
    speaker: 'benali',
    when: { flags: ['benali_transferred'] },
    lines: [
      "Je suis muté à Hellemmes. Excès de zèle, c’est écrit noir sur blanc. Je vais encadrer le courrier.",
      "Bon courage, monsieur. Vraiment.",
    ],
    once: true,
  },
  {
    id: 'chef_scandal',
    speaker: 'chef',
    when: { flags: ['chief_came'] },
    lines: [
      "Nous prenons cette affaire très au sérieux. Très. Au sérieux. Je l’ai dit deux fois, vous pouvez le noter.",
    ],
    once: true,
  },
  {
    id: 'chef_press',
    speaker: 'chef',
    when: { flags: ['press_article'] },
    lines: [
      "J’ai lu l’article de La Voix du Nordiste. Le photographe a pris mon mauvais profil. Pour le reste, une enquête est en cours.",
    ],
    once: true,
  },
  {
    id: 'chef_inquiry',
    speaker: 'chef',
    when: { flags: ['inquiry_open'] },
    lines: [
      "Une enquête interne est ouverte. Je n’ai aucun commentaire, sauf celui-ci : la police municipale de Lille est exemplaire. Globalement.",
    ],
    once: true,
  },
  {
    id: 'chef_warning',
    speaker: 'chef',
    when: { flags: ['chief_came'], stats: { risk: '>=60' } },
    lines: [
      "Monsieur Dubeton. Nous avons un dossier sur les terrasses. Nous en avons aussi un sur vous. Le vôtre grossit plus vite.",
    ],
  },

  {
    id: 'chef_complaint',
    speaker: 'chef',
    when: { flags: ['complaint_filed'] },
    lines: [
      "Monsieur Dubeton. Commandant Desmet. Une plainte a été déposée à votre encontre. Je vous en informe avec le plus grand sérieux.",
      "Je ne me déplace pas, d’habitude. Considérez cela comme un honneur. Un honneur administratif.",
    ],
    once: true,
  },
  {
    id: 'chef_flooded',
    speaker: 'chef',
    when: { flags: ['police_flooded'] },
    lines: [
      "Le standard m’informe d’un volume d’appels inhabituel en provenance d’un même numéro. Nous prenons cela très au sérieux. Le standardiste aussi : il a demandé un congé.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // INSTITUTIONS — Delphine, Martine, Delandre, Stéphane
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'delphine_ac',
    speaker: 'delphine',
    when: { flags: ['emailed_inspector'], notFlags: ['ac_violation_confirmed'] },
    lines: [
      "J’ai bien reçu votre e-mail. Les photos sont nettes, les dates aussi. C’est rare. Merci.",
      "Je ne vous promets rien. Je ne promets jamais rien. Mais je lis tout.",
    ],
    once: true,
  },
  {
    id: 'delphine_dinner',
    speaker: 'delphine',
    when: { flags: ['delphine_dinner'] },
    lines: [
      "Stéphane m’a dit que vous étiez « le Rust guy ». Il dit ça de tout le monde, je crois.",
      "On ne parlera pas du dossier ce soir. Le mot « arrangement » me donne de l’urticaire.",
    ],
    once: true,
  },
  {
    id: 'delphine_visit',
    speaker: 'delphine',
    when: { flags: ['ac_violation_confirmed'] },
    lines: [
      "Unité extérieure, quatre-vingts centimètres sur soixante, fixée à une façade ancienne. Autorisation : aucune. Excuse : « c’est en cours ».",
      "J’ai entendu « c’est en cours » onze fois cette année. Je commence à le prendre personnellement.",
    ],
    once: true,
  },
  {
    id: 'delphine_conflict',
    speaker: 'delphine',
    when: { flags: ['conflict_exposed'] },
    lines: [
      "On me demande si j’ai été influencée par un dîner. Je mange chez moi tous les soirs, monsieur Dubeton. C’était chez moi.",
      "Ça ne va pas m’aider. Et vous non plus.",
    ],
    once: true,
  },
  {
    id: 'martine_conviviality',
    speaker: 'martine',
    when: { day: [3, 14] },
    lines: [
      "Mes chers amis, la convivialité, c’est l’ADN de Lille. Les terrasses, c’est le cœur qui bat de la ville.",
      "Un cœur qui bat jusqu’à minuit, comme partout ailleurs. On va regarder ça.",
    ],
  },
  {
    id: 'martine_dinner',
    speaker: 'martine',
    when: { flags: ['martine_dinner_seen'] },
    lines: [
      "J’étais simplement venue goûter la carbonnade. Une ancienne maire a bien le droit de dîner, non ?",
      "Et de saluer quelques amis. On a encore le droit d’avoir des amis, à Lille.",
    ],
    once: true,
  },
  {
    id: 'martine_tatie',
    speaker: 'martine',
    when: { flags: ['met_tatie'], chance: 0.3 },
    lines: [
      "Votre voisine, Tatie Bouchon, est un trésor. Elle me raconte tout. Absolument tout. Je l’adore.",
    ],
  },
  {
    id: 'martine_scandal',
    speaker: 'martine',
    when: { flags: ['press_scandal'] },
    lines: [
      "Je découvre cette affaire dans la presse, comme tout le monde. Je n’ai jamais rien su. Je ne connais personne. On va regarder ça.",
    ],
    once: true,
  },
  {
    id: 'delandre_meeting',
    speaker: 'delandre',
    when: { flags: ['delandre_meeting'] },
    lines: [
      "Monsieur Dubeton. Je vous entends. J’ai mis en place les 22h, vous savez. On me l’a beaucoup reproché, dans certains salons.",
      "Apportez-moi du solide. Pas de rancœur, pas de surprises dans la presse. Du solide.",
    ],
    once: true,
  },
  {
    id: 'delandre_requested',
    speaker: 'delandre',
    when: { flags: ['delandre_requested'], notFlags: ['delandre_meeting'] },
    lines: [
      "Le cabinet du maire a bien reçu votre demande. Le maire vous entend. Son agenda, un peu moins.",
    ],
  },
  {
    id: 'delandre_petition',
    speaker: 'delandre',
    when: { flags: ['petition_delivered', 'met_delandre'] },
    lines: [
      "Votre pétition est sur mon bureau. Elle a plus de signatures que celle des « clients heureux ». Et moins de fautes d’orthographe.",
    ],
    once: true,
  },
  {
    id: 'delandre_scandal',
    speaker: 'delandre',
    when: { flags: ['press_scandal', 'met_delandre'] },
    lines: [
      "Je déteste les surprises dans la presse. Celle-là, je dois l’avouer, je la déteste un peu moins.",
    ],
    once: true,
  },
  {
    id: 'stephane_vibes',
    speaker: 'stephane',
    when: { phase: 'morning', chance: 0.4 },
    lines: [
      "Pilou, ma team ! Je suis à Lisbonne pour un off-site, mais je sens les vibes d’ici. Elles sont bonnes. Enfin, moyennes.",
    ],
  },
  {
    id: 'stephane_tired',
    speaker: 'stephane',
    when: { phase: 'morning', stats: { sleep: '<30' } },
    lines: [
      "T’as l’air cramé, bro. Tu devrais essayer le cold plunge. Ou dormir. Mais surtout le cold plunge.",
    ],
  },
  {
    id: 'stephane_job',
    speaker: 'stephane',
    when: { phase: 'morning', stats: { job: '<40' } },
    lines: [
      "On est une famille, Pilou. Mais une famille qui ship. Et là, la famille se demande ce que tu ships.",
    ],
  },
  {
    id: 'stephane_todo',
    speaker: 'stephane',
    when: { flags: ['todo_app_rust'] },
    lines: [
      "Mon app de to-do est encore en Rust ? Elle démarre en deux millisecondes maintenant. Je n’ai plus le temps de prendre un café.",
    ],
    once: true,
  },
  {
    id: 'stephane_delphine',
    speaker: 'stephane',
    when: { phase: 'morning', chance: 0.3 },
    lines: [
      "Delphine bosse sur un dossier de clim dans le Vieux-Lille. Elle rentre crevée. Je lui ai proposé un framework de priorisation. Elle a dit non.",
    ],
  },
  {
    id: 'delphine_met',
    speaker: 'delphine',
    when: { flags: ['met_delphine'], phase: 'afternoon', chance: 0.3 },
    lines: [
      "On s’est vus chez moi, monsieur Dubeton. Ici, on est à la mairie. Je vous vouvoie, et je relis tout deux fois.",
    ],
  },
  {
    id: 'stephane_db_report',
    speaker: 'stephane',
    when: { flags: ['proj_db_report'] },
    lines: [
      "C’est quoi ces graphes de décibels dans le drive partagé ? Des courbes, des PDF, un logo ? C’est un side project ?",
      "J’adore. On pivote ? « Koddex, the noise company. » Non ? Je laisse mûrir.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // RÉGIS DEWAELE — n°27, deux meublés, « dans la nuance ». Traître seulement après traitor_known
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'regis_hello',
    speaker: 'regis',
    when: { day: [1, 8], notFlags: ['traitor_known'] },
    lines: [
      "Régis, numéro 27. Membre de l’association depuis le début. Moi, je comprends les deux côtés, hein.",
      "Le sommeil, c’est important. L’ambiance aussi. Il faut trouver un équilibre. Dans la nuance.",
    ],
    once: true,
  },
  {
    id: 'regis_tenants',
    speaker: 'regis',
    when: { notFlags: ['traitor_known'], chance: 0.4 },
    lines: [
      "Mes locataires adorent l’ambiance. Cinq étoiles, à chaque fois. Bon, ils dorment avec des bouchons d’oreilles, mais avec le sourire.",
    ],
  },
  {
    id: 'regis_22h',
    speaker: 'regis',
    when: { phase: 'night', notFlags: ['traitor_known'], chance: 0.3 },
    lines: [
      "Vingt-deux heures, c’est bien. Vingt-deux heures trente, ce serait bien aussi. Je dis ça, je ne dis rien.",
    ],
  },
  {
    id: 'regis_saturday',
    speaker: 'regis',
    when: { day: [6, 6], notFlags: ['traitor_known'] },
    lines: [
      "Ce soir, mes deux appartements sont complets. Un enterrement de vie de jeune fille dans chacun. Ce sera… vivant.",
    ],
    once: true,
  },
  {
    id: 'regis_courted',
    speaker: 'regis',
    when: { flags: ['regis_courted'], notFlags: ['traitor_known'] },
    lines: [
      "Moi, je dîne chez moi. Le plus souvent. Il faut savoir sortir, aussi, prendre le pouls de la rue. Dans la nuance.",
      "Klaas et son carnet… Il note tout, Klaas. Même les gens qui n’ont rien fait. Surtout eux, j’ai l’impression.",
    ],
    once: true,
  },
  {
    id: 'regis_unmasked',
    speaker: 'regis',
    when: { flags: ['traitor_known'] },
    lines: [
      "Traître, traître… Tout de suite les grands mots. Je faisais de la médiation. En amont.",
      "Je comprends les deux côtés. C’est juste que l’un des deux côtés offre le dessert.",
    ],
    once: true,
  },
  {
    id: 'regis_ag',
    speaker: 'regis',
    when: { flags: ['ag_held'], notFlags: ['traitor_known'] },
    lines: [
      "Belle assemblée générale, hein ? J’ai voté pour la nuance. Ce n’était pas sur le bulletin, mais je l’ai écrit dans la marge.",
      "Et j’ai pris des notes. Beaucoup de notes. Pour le compte rendu : on n’est jamais trop transparent.",
    ],
    once: true,
  },
  {
    id: 'regis_after',
    speaker: 'regis',
    when: { flags: ['traitor_known'], chance: 0.3 },
    lines: [
      "Vous ne me dites plus bonjour dans la rue. Je le comprends. Je comprends tout, moi. C’est mon drame.",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // LA PRESSE ET L'AVOCAT — Anne-Sophie Lepoutre (La Voix du Nordiste), Maître Vandamme
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'journaliste_first',
    speaker: 'journaliste',
    when: { flags: ['press_contacted'], notFlags: ['press_article'], stats: { dossier: '<40' } },
    lines: [
      "Vous avez des éléments ? Des photos, des PV, des dates ?",
      "Parce que « mon voisin fait du bruit », j’en reçois quarante par semaine. Je les classe par quartier.",
    ],
    once: true,
  },
  {
    id: 'journaliste_thin',
    speaker: 'journaliste',
    when: { flags: ['press_contacted'], notFlags: ['press_article'], stats: { dossier: '<25' } },
    lines: [
      "Votre histoire est sympathique, mais il me manque un angle. Une chaise sur des pavés, ça ne fait pas une une.",
    ],
  },
  {
    id: 'journaliste_solid',
    speaker: 'journaliste',
    when: { flags: ['press_contacted'], stats: { dossier: '>=40' } },
    lines: [
      "Ça, c’est un dossier. Horodaté, chiffré, recoupé. Je le montre à mon rédac’ chef avant le bouclage. Ne parlez à personne d’autre.",
    ],
    once: true,
  },
  {
    id: 'journaliste_article',
    speaker: 'journaliste',
    when: { flags: ['press_article'] },
    lines: [
      "L’article est sorti, page 7. Pas la une : il y avait un concours de carbonnade à Lambersart. Mais page 7, dans le Vieux-Lille, tout le monde la lit en attendant son café.",
    ],
    once: true,
  },
  {
    id: 'journaliste_illicit',
    speaker: 'journaliste',
    when: { flags: ['press_contacted', 'bribe_photo_illegal'] },
    lines: [
      "Je ne vous demande pas comment vous avez eu cette photo. Je ne la publierai pas sans une deuxième source.",
      "Et à titre personnel, je vous conseille un bon avocat. Celui de votre association, par exemple.",
    ],
    once: true,
  },
  {
    id: 'journaliste_scandal',
    speaker: 'journaliste',
    when: { flags: ['press_scandal'] },
    lines: [
      "La police municipale, un estaminet, des cafés offerts. Mon rédac’ chef a dit « enfin ». Il ne dit jamais « enfin ».",
    ],
    once: true,
  },
  {
    id: 'avocat_hired',
    speaker: 'avocat',
    when: { flags: ['lawyer_hired'] },
    lines: [
      "En l’état du dossier, j’ai trois remarques et une facture. Commençons par la facture, c’est la plus courte.",
    ],
    once: true,
  },
  {
    id: 'avocat_notice',
    speaker: 'avocat',
    when: { flags: ['formal_notice'] },
    lines: [
      "La mise en demeure est partie en recommandé. Je l’ai rédigée avec une politesse qui devrait les empêcher de dormir.",
      "Une forme de réciprocité, en somme.",
    ],
    once: true,
  },
  {
    id: 'avocat_reply',
    speaker: 'avocat',
    when: { flags: ['cm_lawyer_reply', 'lawyer_hired'] },
    lines: [
      "Leur conseil répond que la terrasse « participe à l’animation du quartier ». C’est joli. En droit, cela ne veut strictement rien dire.",
    ],
    once: true,
  },
  {
    id: 'avocat_illicit',
    speaker: 'avocat',
    when: { flags: ['lawyer_hired', 'camera_awning'] },
    lines: [
      "Une caméra sous le store d’un tiers ? En l’état du dossier, cette vidéo n’existe pas.",
      "Je vous conseille vivement de faire comme elle.",
    ],
    once: true,
  },
  {
    id: 'avocat_complaint',
    speaker: 'avocat',
    when: { flags: ['lawyer_hired', 'complaint_filed'] },
    lines: [
      "Une plainte contre vous. Je vous facture l’heure entamée pour vous dire ceci : ne dites plus rien. À personne. Surtout pas sur WhatsApp.",
    ],
    once: true,
  },
  {
    id: 'avocat_solid',
    speaker: 'avocat',
    when: { flags: ['lawyer_hired'], stats: { dossier: '>=50' } },
    lines: [
      "Des preuves licites, horodatées, recoupées. Je n’ai rien à redire. C’est extrêmement désagréable pour un avocat.",
    ],
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // LES ANIMAUX — Biloute (teckel de Jérémie) et Gaufre (chatte de Seb et Nico) : onomatopées et didascalies
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'biloute_stairs',
    speaker: 'biloute',
    when: { flags: ['met_jeremie', 'carbonnade_1'], chance: 0.3 },
    lines: [
      "*Renifle vos chaussures dans l’escalier. Conclut « carbonnade ». Vous regarde avec reproche.*",
    ],
  },
  {
    id: 'biloute_corridor',
    speaker: 'biloute',
    when: { phase: 'night', flags: ['joined_rounds'], chance: 0.4 },
    lines: [
      "Ouaf ! *S’arrête net devant une chaise qui mord sur le couloir de passage. Ne bouge plus.* Ouaf.",
    ],
  },
  {
    id: 'biloute_frite',
    speaker: 'biloute',
    when: { phase: 'night', flags: ['met_jeremie'], chance: 0.3 },
    lines: [
      "*A trouvé une frite entre deux pavés. La soirée est un succès.*",
    ],
  },
  {
    id: 'biloute_22h',
    speaker: 'biloute',
    when: { phase: 'night', flags: ['joined_rounds'], chance: 0.3 },
    lines: [
      "*22h00. Les chaises raclent les pavés. Grogne en direction de l’estaminet. Jérémie murmure « bon chien ».*",
    ],
  },
  {
    id: 'biloute_carbonnade',
    speaker: 'biloute',
    when: { flags: ['carbonnade_1', 'met_jeremie'] },
    lines: [
      "*Vous renifle longuement. Très longuement.* Grrr. *Il sait.*",
    ],
    once: true,
  },
  {
    id: 'biloute_nervous',
    speaker: 'biloute',
    when: { phase: 'night', flags: ['joined_rounds'], stats: { risk: '>=40' } },
    lines: [
      "OUAF ! OUAF ! *Au pire moment, évidemment. Jérémie fait semblant de chercher ses clés.*",
    ],
  },
  {
    id: 'gaufre_balcony',
    speaker: 'gaufre',
    when: { phase: 'night', flags: ['met_seb_nico'], chance: 0.3 },
    lines: [
      "*Au balcon du 13. Clignement lent. Seb et Nico sont là, et ils regardent.*",
    ],
  },
  {
    id: 'gaufre_leaves',
    speaker: 'gaufre',
    when: { phase: 'night', chance: 0.25 },
    lines: [
      "*Se lève, s’étire, tourne le dos à la rue et rentre. Même elle en a assez.*",
    ],
  },
  {
    id: 'gaufre_saturday',
    speaker: 'gaufre',
    when: { day: [13, 13], phase: 'night' },
    lines: [
      "*N’est pas sortie du tout. Samedi : trop de monde, trop de bruit. Elle a raison.*",
    ],
    once: true,
  },
  {
    id: 'gaufre_pee',
    speaker: 'gaufre',
    when: { flags: ['pee_at_door'] },
    lines: [
      "*Fixe votre porte d’entrée. Puis vous. Ne dit rien. N’en pense pas moins.*",
    ],
    once: true,
  },
  {
    id: 'gaufre_bucket',
    speaker: 'gaufre',
    when: { flags: ['bucket_witnessed'] },
    lines: [
      "*Un seul clignement. Très lent. Elle a vu.*",
    ],
    once: true,
  },
  {
    id: 'nico_hate_wave_answered',
    speaker: 'nico',
    when: { flags: ['hate_wave_answered'] },
    lines: [
      "Ta réponse a été partagée plus que leur post. Trois photos, une date, zéro insulte. J’en ai fait une capture pour l’encadrer.",
    ],
    once: true,
  },
  {
    id: 'klaas_certified',
    speaker: 'klaas',
    when: { flags: ['klaas_log_certified'] },
    lines: [
      "Mes carnets ont un tampon, maintenant. Hilde dit que je marche plus droit depuis.",
      "Ce n’est pas pour le tampon. C’est que quelqu’un les a enfin lus jusqu’au bout.",
    ],
    once: true,
  },
  {
    id: 'serveur_testimony',
    speaker: 'serveur',
    when: { flags: ['waiter_testimony'] },
    lines: [
      "J’ai signé. Ma mère dit que je suis courageux. Mon banquier dit que je suis au chômage. Les deux ont raison.",
    ],
    once: true,
  },
  {
    id: 'hilde_laxative',
    speaker: 'hilde',
    when: { flags: ['laxative_done', 'met_hilde'] },
    lines: [
      "Des clients malades, à la terrasse d’en bas. Klaas dit qu’on ne sait pas qui. Je ne veux pas le savoir.",
      "Si c’était quelqu’un de chez nous, Pilou, ce ne serait plus une querelle de voisins. Ce serait autre chose. Quelque chose de grave.",
    ],
    effects: { asso: -3 },
    once: true,
  },
  {
    id: 'avocat_backroom_caught',
    speaker: 'avocat',
    when: { flags: ['backroom_caught', 'lawyer_hired'] },
    lines: [
      "Dans l’arrière-salle. Entre les fûts. En l’état du dossier, je vais avoir besoin d’un café. Et vous, d’un très bon souvenir de la loi.",
    ],
    once: true,
  },
  {
    id: 'serveur_backroom',
    speaker: 'serveur',
    when: { flags: ['backroom_sneak'], notFlags: ['backroom_caught'] },
    lines: [
      "Quelqu’un a bougé deux fûts dans l’arrière-salle, hier soir. Dédé croit aux fantômes. Moi, je crois pas aux fantômes. Je crois que je vais rien dire.",
    ],
    once: true,
  },
  // ════════════════════════════════════════════════════════════════════════
  // RÉACTIONS AUX REBONDISSEMENTS DE NUIT (twists.js, drapeaux `after`), le lendemain : content-story
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'tw_birthday_klaas',
    speaker: 'klaas',
    when: { flags: ['twist_birthday', 'met_klaas'] },
    lines: [
      "Table 4 : onze personnes, un gâteau, quarante bougies. 23h40 : chant. Quarante voix. J’ai chanté aussi. Je ne l’ai pas noté.",
    ],
    once: true,
  },
  {
    id: 'tw_birthday_seb',
    speaker: 'seb',
    when: { flags: ['twist_birthday', 'met_seb_nico'] },
    lines: [
      "Attends, attends : le Jojo de la table 4, il a quarante ans et il a pleuré quand toute la rue a chanté. J’ai pleuré aussi. Nico dit que c’est la fatigue.",
    ],
    once: true,
  },
  {
    id: 'tw_influencer_nico',
    speaker: 'nico',
    when: { flags: ['twist_influencer', 'met_seb_nico'] },
    lines: [
      "La vidéo de l’influenceuse : 80 000 vues. J’ai fait des captures de chaque plan où on voit les tables dans le couloir. Elle nous a rendu service sans le savoir.",
      "Dans un plan, on voit ta fenêtre, Pilou. Et toi dedans. Fais attention à ce que tu fais quand il y a une ring light dans la rue.",
    ],
    once: true,
  },
  {
    id: 'tw_hen_jeremie',
    speaker: 'jeremie',
    when: { flags: ['twist_hen_party', 'met_jeremie'] },
    lines: [
      "Un mégaphone en terrasse, ce n’est pas prévu par l’arrêté. J’ai vérifié. Ce n’est pas interdit non plus. J’ai écrit à la mairie pour combler ce vide juridique.",
      "Biloute a signé le serment de la mariée. Je ne sais pas ce qu’il a juré. Il a l’air serein.",
    ],
    once: true,
  },
  {
    id: 'tw_drache_hilde',
    speaker: 'hilde',
    when: { flags: ['twist_drache', 'met_hilde'] },
    lines: [
      "Avec cette pluie, ils se sont tous serrés sous le store. Quatorze sous trois tables, Klaas a compté. Moi j’ai fait une soupe : quand il pleut, il faut une soupe. Tu en veux ?",
    ],
    once: true,
  },
  {
    id: 'tw_heatwave_tatie',
    speaker: 'tatie',
    when: { flags: ['twist_heatwave', 'met_tatie'] },
    lines: [
      "Vingt-neuf degrés à minuit ! Comme dit le proverbe : quand il fait chaud dehors, il fait chaud dedans. Je l’ai inventé cette nuit, en ne dormant pas.",
    ],
    once: true,
  },
  {
    id: 'tw_heatwave_klaas',
    speaker: 'klaas',
    when: { flags: ['twist_heatwave', 'met_klaas'] },
    lines: [
      "Fenêtres ouvertes partout. J’ai entendu des conversations à trois tables de distance. Je ne les ai pas notées. Certaines choses ne regardent pas le carnet.",
    ],
    once: true,
  },
  {
    id: 'tw_guide_hippolyte',
    speaker: 'hippolyte',
    when: { flags: ['twist_guide_tour', 'met_hippolyte'] },
    lines: [
      "Le guide de la balade nocturne a daté le canal de 1910. C’est 1912. Je lui ai écrit, à l’office de tourisme, sur papier à en-tête. On me répondra sous huit jours. Personne n’a jamais vu ça.",
    ],
    once: true,
  },
  {
    id: 'tw_regis_party_seb',
    speaker: 'seb',
    when: { flags: ['twist_regis_party', 'met_seb_nico'] },
    lines: [
      "Attends, attends : la basse de l’autre nuit, c’était le 27. Chez Régis. Dix-neuf étudiants. Il dit « groupe calme » dans son annonce. Calme comme une sono, quoi.",
    ],
    once: true,
  },
  {
    id: 'tw_regis_party_regis',
    speaker: 'regis',
    when: { flags: ['twist_regis_party'] },
    lines: [
      "Pour l’autre soir, je comprends tout à fait. Les deux côtés. J’avais bien précisé « calme » dans l’annonce. Ce sont eux qui n’ont pas lu.",
    ],
    once: true,
  },
  {
    id: 'tw_busker_hilde',
    speaker: 'hilde',
    when: { flags: ['twist_busker', 'met_hilde'] },
    lines: [
      "L’accordéoniste sous votre fenêtre… Il joue bien, le pauvre. Trois chansons, mais il les joue bien. Je lui ai apporté une tisane, pour la voix. Il m’a joué la quatrième. Il en connaissait une quatrième.",
    ],
    once: true,
  },
  {
    id: 'tw_power_cut_klaas',
    speaker: 'klaas',
    when: { flags: ['twist_power_cut', 'met_klaas'] },
    lines: [
      "La nuit de la panne : quarante-cinq minutes sans courant. Je n’ai rien vu. Je n’ai rien noté. Première page blanche depuis 2019. J’ai bien dormi, après. Ja.",
    ],
    once: true,
  },
  {
    id: 'tw_power_cut_nico',
    speaker: 'nico',
    when: { flags: ['twist_power_cut', 'met_seb_nico'] },
    lines: [
      "Pendant la panne, j’ai mesuré 34 dB sur notre balcon. Trente-quatre. Je l’ai mis en fond d’écran du groupe. C’est notre objectif, maintenant : la panne, sans la panne.",
    ],
    once: true,
  },
  {
    id: 'tw_waiter_holidays_seb',
    speaker: 'seb',
    when: { flags: ['twist_waiter_holidays', 'met_seb_nico'] },
    lines: [
      "Le serveur est parti en vacances, et devine : toutes les tables rentrées à 22h, le soir de son départ. Il avait un train. On devrait lui offrir un abonnement SNCF.",
    ],
    once: true,
  },
  {
    id: 'tw_fete_voisins_jeremie',
    speaker: 'jeremie',
    when: { flags: ['twist_fete_voisins', 'met_jeremie'] },
    lines: [
      "La fête des voisins : rangée à 22h00 pile, quarante-trois personnes, deux tartes. J’ai photographié notre place vide à 22h01, et la terrasse pleine à 22h01. Les deux photos vont au dossier, côte à côte.",
    ],
    once: true,
  },
  {
    id: 'tw_fire_jeremie',
    speaker: 'jeremie',
    when: { flags: ['twist_fire_inspection', 'met_jeremie'] },
    lines: [
      "Les pompiers ont mesuré le couloir : 1,40 m. Il en faut trois. Ce n’est pas moi qui le dis, ce sont eux, avec un mètre plus grand que le mien. C’est la plus belle pièce du dossier.",
    ],
    once: true,
  },
  {
    id: 'tw_delandre_tatie',
    speaker: 'tatie',
    when: { flags: ['twist_delandre_walk', 'met_tatie'] },
    lines: [
      "Le maire est passé l’autre soir, à pied ! Je l’ai vu de ma fenêtre. Il a regardé les bonnes tables. Martine, elle, ne venait qu’en berline. Je dis ça, je ne dis rien.",
    ],
    once: true,
  },
  {
    id: 'tw_lost_dog_jeremie',
    speaker: 'jeremie',
    when: { flags: ['twist_lost_dog', 'met_jeremie'] },
    lines: [
      "Biloute a été retrouvé sous la table 3 de l’estaminet, avec une frite. Je ne lui en veux pas. Je lui ai simplement expliqué, longuement, la notion de conflit d’intérêts.",
    ],
    once: true,
  },
  {
    id: 'tw_lost_dog_biloute',
    speaker: 'biloute',
    when: { flags: ['twist_lost_dog', 'met_jeremie'] },
    lines: [
      "*Évite votre regard. Sent la frite. Remue la queue, mais sans conviction.*",
    ],
    once: true,
  },
  {
    id: 'tw_tv_nico',
    speaker: 'nico',
    when: { flags: ['twist_tv_crew', 'met_seb_nico'] },
    lines: [
      "Le reportage est passé à la télé. J’ai envoyé à la rédaction nos photos de la même terrasse, prises à 22h33, trois minutes après le départ de la caméra. Horodatées. Ils peuvent faire une suite.",
    ],
    once: true,
  },
  {
    id: 'tw_tv_stephane',
    speaker: 'stephane',
    when: { phase: 'morning', flags: ['twist_tv_crew'] },
    lines: [
      "Pilou, je t’ai vu à la télé, à ta fenêtre, en arrière-plan. Petit feedback : la posture, c’était pas très « growth ». On en parle en one-to-one ?",
    ],
    once: true,
  },
  {
    id: 'tw_sweeper_hippolyte',
    speaker: 'hippolyte',
    when: { flags: ['twist_street_sweeper', 'met_hippolyte'] },
    lines: [
      "Une balayeuse à 23h30, voilà enfin une institution qui statue. Je propose de l’inviter à la prochaine assemblée générale. Elle ne votera pas, mais elle fera le ménage.",
    ],
    once: true,
  },
  {
    id: 'tw_van_klaas',
    speaker: 'klaas',
    when: { flags: ['twist_van_corridor', 'met_klaas'] },
    lines: [
      "Samedi : camionnette dans le couloir, deux heures, warnings allumés. Un samedi « sans voitures ». J’ai noté la plaque. Je l’ai notée deux fois, pour le principe.",
    ],
    once: true,
  },
  {
    id: 'tw_match_tatie',
    speaker: 'tatie',
    when: { flags: ['twist_match_night', 'met_tatie'] },
    lines: [
      "Cent cinquante supporters sous ma fenêtre ! Comme dit le proverbe : qui crie « but » à minuit ne dort pas à une heure. Moi non plus, du coup.",
    ],
    once: true,
  },
  {
    id: 'tw_exhaust_silent_klaas',
    speaker: 'klaas',
    when: { flags: ['twist_exhaust_silent', 'met_klaas'] },
    lines: [
      "La gaine éteinte la veille de la réunion. Je n’interprète pas. Je mets les deux dates l’une à côté de l’autre. C’est le carnet qui interprète.",
    ],
    once: true,
  },
  {
    id: 'tw_model_street_seb',
    speaker: 'seb',
    when: { flags: ['twist_model_street', 'met_seb_nico'] },
    lines: [
      "Tu as vu la rue, le soir de la visite annoncée ? Six par table, couloir libre, géraniums neufs. Attends, attends : c’est ça qu’ils appellent une visite « annoncée ». On devrait en annoncer tous les soirs.",
    ],
    once: true,
  },
  {
    id: 'tw_inspector_seen_nico',
    speaker: 'nico',
    when: { flags: ['twist_inspector_seen', 'met_seb_nico'] },
    lines: [
      "La dame au carnet, au Goulot, l’autre soir… c’était l’inspectrice. Elle notait plus vite que Klaas. Klaas est vexé. Il dit que c’est une « collègue ».",
    ],
    once: true,
  },
];
