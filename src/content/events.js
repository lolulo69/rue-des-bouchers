// Événements (GAME_DESIGN §3, §14). Données pures : aucune logique, aucun DOM.
// Deux familles :
//   • fixes : `day` + `phase`, ils arrivent toujours ce jour-là (J1, J4, J6, J7, J9, J11, J13, J14) ;
//   • aléatoires : pas de `day`, une condition `when` (avec `chance`), `once` par défaut.
// Chaque choix : { label, requires?, effects?, result }. Un choix sans `requires` est toujours proposé,
// donc chaque événement fixe a au moins une issue de repli.
// J14 : `scene` = discours modulaires (cf. d14_commission), affichés avant les choix.
// Évidences : quality 0–1 (même échelle que la sim), legal: false = inutilisable devant la commission.
import { WHATSAPP_GROUP } from './characters.js';

export const EVENTS = [
  // ════════════════════════════════════════════════════════════════════════
  // CALENDRIER FIXE
  // ════════════════════════════════════════════════════════════════════════

  // ── J1 · lundi : le décor ───────────────────────────────────────────────
  {
    id: 'd1_monday',
    day: 1,
    phase: 'morning',
    speaker: 'jeremie',
    title: 'Lundi, 7h12 : la rue se réveille (vous, pas vraiment)',
    text:
      "La gaine de l’estaminet a ronronné jusqu’à 23h30, la dernière chaise a raclé les pavés à 0h40. Dans l’escalier, Jérémie vous tend un tract plié en quatre : « Assemblée générale dimanche prochain. On a deux semaines avant la commission des terrasses. Deux semaines, Pilou. Il faut un dossier. » Biloute vous renifle la cheville, l’air de dire que lui, il a déjà commencé.",
    choices: [
      {
        label: "« Je suis dedans. Je photographierai tout. »",
        effects: { asso: +5, setFlags: ['met_jeremie'] },
        result:
          "Jérémie hoche la tête comme un notaire satisfait. « Horodatage, distance, nombre de personnes par table. Une photo floue, c’est un souvenir. Une photo nette, c’est une pièce. »",
      },
      {
        label: "« Je dors deux heures par nuit, Jérémie. Je verrai. »",
        effects: { sleep: +5, setFlags: ['met_jeremie'] },
        result:
          "« Justement. C’est pour ça qu’il faut un dossier. » Il remonte. Biloute reste une seconde de plus, par principe.",
      },
    ],
  },

  // ── J4 · jeudi : Colette Verhaeghe dîne à l'estaminet ──────────────────────
  {
    id: 'd4_colette_dinner',
    day: 4,
    phase: 'night',
    speaker: 'colette',
    title: "J4 · Une ancienne maire en terrasse",
    text:
      "20h50. Une berline se gare rue de la Barre, là où rien ne se gare. Colette Verhaeghe descend, foulard de soie et sourire de campagne, et prend LA table de l’estaminet, celle qui mord sur le couloir de passage. Dédé lui embrasse les deux mains. Ghislain apporte une carte qui n’existe pas pour les autres clients. Huit couverts. À une table. Rue des Bouchers.",
    choices: [
      {
        label: 'Photographier la tablée depuis la fenêtre',
        effects: {
          dossier: +6,
          hostility: +5,
          setFlags: ['colette_dinner_seen', 'colette_dinner_photo'],
          evidence: { kind: 'photo', quality: 0.8, legal: true, label: "J4 · Colette Verhaeghe à 8 sur une table de 6, en débord sur le couloir" },
        },
        result:
          "Clic. Huit personnes, une table, un couloir réduit à la largeur d’une poussette pliée. Colette lève son verre vers votre fenêtre. Elle ne vous a pas vu. Probablement. Elle trinque peut-être juste avec la façade.",
      },
      {
        label: 'Descendre la saluer « en voisin »',
        effects: { hostility: +10, asso: +3, sleep: -5, setFlags: ['colette_dinner_seen'] },
        result:
          "« Ah, un riverain ! Mes chers amis, voilà la vraie vie de quartier ! » Elle vous serre la main, vous présente comme « un passionné », et vous ressortez avec une carte de visite et l’impression d’avoir été inauguré. Dédé, lui, a retenu votre visage.",
      },
      {
        label: 'Prévenir le groupe : « Colette est en bas »',
        effects: { asso: +6, setFlags: ['colette_dinner_seen', 'whatsapp_rally'] },
        result: `Sur « ${WHATSAPP_GROUP} », trente-quatre messages en six minutes. Seb a déjà zoomé sur le dessert. Nico rappelle que « zoomer sur un dessert n’est pas une preuve ». Tatie Bouchon répond : « Je la vois bientôt pour le thé, je lui dirai. » Tout le monde se tait une seconde.`,
      },
      {
        label: 'Noter qui est à sa table (avec Klaas)',
        requires: { flags: ['met_klaas'] },
        effects: {
          dossier: +4,
          setFlags: ['colette_dinner_seen'],
          evidence: { kind: 'carnet', quality: 0.7, legal: true, label: 'Carnet de Klaas, J4 : « 20h52, ex-maire, 8 couverts, table 1, couloir à 1m10 »' },
        },
        result:
          "Au téléphone, Klaas lit son carnet sans hâte : « 20h52. Ex-maire. Huit couverts. Table un. Couloir : un mètre dix, à vue de nez. Mon nez est fiable. » Il raccroche. Vous l’entendez tourner la page.",
      },
      {
        label: 'Repérer qui d’autre mange gratis à sa table',
        requires: { flags: ['seen_complaisance'] },
        effects: {
          dossier: +5,
          corruption: -3,
          setFlags: ['colette_dinner_seen', 'colette_dinner_photo'],
          evidence: { kind: 'photo', quality: 0.65, legal: true, label: "J4 · Le brigadier Lemaire, en civil, au dîner de Colette" },
        },
        result:
          "En bout de table, en civil mais avec la même moustache : le brigadier Lemaire. Il ne paie pas son waterzooi. Personne ne paie rien, d’ailleurs. Ce soir, l’addition, c’est la rue.",
      },
      {
        label: 'Fermer les volets. Ce soir, on dort.',
        effects: { sleep: +8, setFlags: ['colette_dinner_ignored'] },
        result:
          "Vous fermez. On entend quand même le discours de Colette sur « la convivialité, ADN de Lille », mais en mono. C’est déjà ça.",
      },
    ],
  },

  // ── J6 · premier samedi sans voitures ───────────────────────────────────
  {
    id: 'd6_saturday',
    day: 6,
    phase: 'afternoon',
    speaker: 'seb',
    title: 'J6 · Samedi piéton : la rue appartient à la foule',
    text:
      "Pas de voitures le samedi. Résultat : à 17h, on boit debout du n°1 à la place, des grappes de six, de dix, de vingt. Seb vous appelle du balcon d’en face, Gaufre sous le bras : « Attends, attends : la dernière fois, trois personnes ont fait pipi contre ta porte avant minuit. Trois. On fait quoi ce soir ? »",
    choices: [
      {
        label: 'Organiser une veille croisée balcon / fenêtre avec Seb et Nico',
        requires: { flags: ['met_seb_nico'] },
        effects: { asso: +5, dossier: +3, sleep: -5, setFlags: ['saturday1_done', 'whatsapp_rally'] },
        result:
          "Plan de bataille : Seb filme côté pair, Nico horodate, vous mesurez. Nico : « On ne publie rien sans heure, sans lieu et sans flou sur les visages. » Seb : « Même les visages des gens qui… » Nico : « Surtout eux. »",
      },
      {
        label: 'Coller sur la porte : « CECI N’EST PAS UN URINOIR »',
        effects: { asso: +2, hostility: +3, setFlags: ['saturday1_done'] },
        result:
          "Magritte serait fier. Les clients aussi : ils se prennent en photo devant. L’un d’eux l’arrose quand même, par respect pour le surréalisme.",
      },
      {
        label: 'Aller dormir chez Klaas et Hilde, place Maurice-Schumann',
        requires: { flags: ['met_hilde'] },
        effects: { sleep: +15, dossier: -2, setFlags: ['saturday1_done', 'hilde_tisane'] },
        result:
          "Canapé-lit, tisane au tilleul, tarte au sucre. Klaas veille à la fenêtre et note pour deux. Vous ratez la nuit, mais vous dormez. Au matin, une page de carnet vous attend sur la table, pliée comme une lettre d’amour administrative.",
      },
      {
        label: 'Faire comme d’habitude',
        effects: { setFlags: ['saturday1_done'] },
        result: 'La rue fera ce qu’elle fait toujours le samedi. Vous aussi : compter.',
      },
    ],
  },

  // ── J7 · dimanche : assemblée générale, vote de stratégie ───────────────
  {
    id: 'd7_general_meeting',
    day: 7,
    phase: 'afternoon',
    speaker: 'jeremie',
    title: "J7 · Assemblée générale de l’Association de la rue des Bouchers",
    text:
      "Quorum atteint à deux chaises près (Régis « arrive »). Jérémie ouvre la séance par la lecture du procès-verbal précédent, qui tenait sur un post-it. Klaas a apporté son carnet, Hilde une tarte, Tatie un proverbe, Seb et Nico un vidéoprojecteur. Hippolyte vouvoie le vidéoprojecteur. Ordre du jour, point unique : « Quelle stratégie jusqu’à la commission ? »",
    choices: [
      {
        label: 'Défendre la voie légale : dossier, mairie, avocat',
        effects: { asso: +6, risk: -5, setFlags: ['ag_held', 'stance_legal'] },
        result:
          "Vote à main levée. Klaas lève la main et l’autre main, pour être sûr. Jérémie : « Adopté. On va les noyer sous les pièces jointes. » Tatie : « Faut résister et se battre pour. Avec des tampons. »",
      },
      {
        label: 'Proposer le dialogue avec les restaurateurs',
        effects: { asso: +4, hostility: -10, setFlags: ['ag_held', 'stance_dialogue'] },
        result:
          "Hilde applaudit doucement. Seb soupire (« c’est moins dramatique »), Nico note « charte de bon voisinage » au tableau. Jérémie rédigera une lettre que Ghislain archivera, mais au moins elle sera archivée poliment.",
      },
      {
        label: "Pousser l’« action directe »",
        effects: { asso: -6, hostility: +8, setFlags: ['ag_held', 'stance_direct'] },
        result:
          "Silence. Hilde pose sa tarte. Seb dit « ouh » avec une pointe d’admiration. Le vote passe d’une voix, celle de Régis, arrivé pile pour ça, qui « comprend les deux côtés ». Klaas, lui, ouvre son carnet à une page vierge. Ce n’est pas bon signe.",
      },
      {
        label: "Tenir l’AG dans l’atelier d’Hippolyte et voter la voie légale",
        requires: { flags: ['hippolyte_room'] },
        effects: { asso: +10, risk: -5, setFlags: ['ag_held', 'stance_legal'] },
        result:
          "Sous les poutres de l’ancienne carrosserie, avec une calèche de 1880 en guise de tribune, même la voie légale a de l’allure. Hippolyte : « Nos ancêtres ont survécu au canal à ciel ouvert. Nous survivrons au waterzooi. »",
      },
    ],
  },

  // ── J9 · mardi : l'inspectrice revient pour la clim ─────────────────────
  {
    id: 'd9_inspector',
    day: 9,
    phase: 'afternoon',
    speaker: 'delphine',
    title: "J9 · L’inspectrice revient pour la clim",
    text:
      "La mairie a programmé une contre-visite du groupe de climatisation posé sans autorisation sur la façade du n°10. Tout dépend d’une chose : l’estaminet sait-il qu’elle vient ? Dans ce quartier, une visite annoncée, c’est une visite racontée à Colette, donc à Dédé, donc à la clim, qui se retrouve soudain très bien cachée.",
    choices: [
      {
        label: 'Glisser à Delphine que la visite doit rester surprise',
        requires: { flags: ['delphine_channel'] },
        effects: { dossier: +8, corruption: -5, setFlags: ['inspector_surprise', 'ac_violation_confirmed'] },
        result:
          "Delphine arrive à 15h04 sans prévenir, avec un mètre laser et un humour sec. Ghislain essaie « on allait justement déposer la demande ». Elle note : « Groupe extérieur, façade, aucune autorisation. Demande ‹ justement › non déposée. » Infraction confirmée.",
      },
      {
        label: 'Passer par Hippolyte et le service du patrimoine',
        requires: { flags: ['heritage_angle'] },
        effects: { dossier: +8, hostility: +5, setFlags: ['inspector_surprise', 'ac_violation_confirmed'] },
        result:
          "L’architecte du patrimoine accompagne l’inspectrice « par hasard ». Il regarde la clim comme on regarde une verrue sur un Rubens. Personne n’a eu le temps de prévenir personne. Infraction confirmée, avec un adjectif en plus : « inacceptable ».",
      },
      {
        label: 'Laisser la mairie annoncer la visite, mais fournir les photos de la clim',
        requires: { stats: { dossier: '>=40' } },
        effects: { dossier: +4, setFlags: ['inspector_announced', 'ac_violation_confirmed'] },
        result:
          "Visite annoncée : la clim est cachée sous une bâche verte avec une guirlande lumineuse. En plein été. Delphine soulève la bâche, compare avec vos photos horodatées, et note : « Décoration de Noël, groupe de climatisation dessous. » Confirmé quand même. Merci les photos.",
      },
      {
        label: 'Laisser la procédure suivre son cours',
        effects: { setFlags: ['inspector_announced', 'ac_case_stalled'], corruption: +3 },
        result:
          "Visite annoncée par courrier, donc annoncée à Colette, donc à tout le monde. Le jour J, il n’y a plus de clim sur la façade, juste quatre trous rebouchés au mastic frais et une jardinière de géraniums très contents. « Constat : néant. Le dossier reste ouvert. » Il le restera longtemps. La clim, elle, revient vendredi.",
      },
    ],
  },

  // ── J11 · jeudi : la réunion sur l'extraction ───────────────────────────
  {
    id: 'd11_exhaust_meeting',
    day: 11,
    phase: 'afternoon',
    speaker: 'ghislain',
    title: "J11 · Réunion « gaine d’extraction », salle 3B, mairie annexe",
    text:
      "Autour de la table : un technicien de la ville, un représentant de l’hygiène, Ghislain avec un classeur de 400 pages intitulé « Démarches en cours », et vous. Ghislain ouvre : « Nous tenons à rappeler que la situation est en cours de résolution depuis 2023. » Le technicien se tourne vers vous : « Qu’avez-vous comme éléments ? »",
    choices: [
      {
        label: "Poser les mesures, la plainte à l’ARS et l’avis du patrimoine",
        requires: { stats: { dossier: '>=50' }, flags: ['ars_complaint', 'heritage_angle'] },
        effects: { sleep: +5, dossier: +5, setFlags: ['exhaust_meeting_won'] },
        result:
          "Relevés horodatés, plainte à l’ARS, avis du patrimoine sur une gaine qui défigure une façade de 1729. Le technicien referme le classeur de Ghislain sans l’ouvrir. « Déplacement de la gaine en toiture sous trois mois. » Ghislain écrit « en cours » dans la marge, par réflexe.",
      },
      {
        label: 'Poser les devis jamais signés de l’estaminet',
        requires: { flags: ['read_quotes'] },
        effects: { hostility: +15, risk: +5, setFlags: ['exhaust_meeting_delayed'] },
        result:
          "Vous posez les devis. Ghislain blêmit, puis sourit : « Intéressant. Comment avez-vous obtenu nos documents internes ? » Le technicien range poliment vos feuilles hors de la table. « Nous ne pouvons pas examiner ces pièces. Étude complémentaire. » Elles étaient pourtant vraies.",
      },
      {
        label: 'Poser les relevés en dB et les photos de la gaine',
        requires: { stats: { dossier: '>=30' } },
        effects: { setFlags: ['exhaust_meeting_delayed'] },
        result:
          "« Éléments recevables mais insuffisants pour trancher. » Décision : une étude complémentaire, confiée à un bureau d’études, qui rendra ses conclusions « à l’automne ». On ne précise pas lequel.",
      },
      {
        label: 'Raconter ses nuits',
        effects: { sleep: -5, setFlags: ['exhaust_meeting_lost'] },
        result:
          "Vous racontez l’odeur de friture à 23h, la vapeur sous la fenêtre, le ronron. Le technicien compatit. Ghislain fait glisser son classeur de 400 pages. « Statu quo, dans l’attente d’éléments objectifs. » Vous rentrez. La gaine vous attend, tiède.",
      },
    ],
  },

  // ── J13 · second samedi ─────────────────────────────────────────────────
  {
    id: 'd13_saturday',
    day: 13,
    phase: 'afternoon',
    speaker: 'nico',
    title: 'J13 · Dernier samedi avant la commission',
    text:
      "Veille de commission, samedi piéton, ciel dégagé : les conditions idéales pour une fête de rue non déclarée. Nico vous écrit : « C’est la dernière nuit qui compte. Ce qui se passe ce soir sera dans les dossiers demain. Des deux côtés. »",
    choices: [
      {
        label: "Mobiliser tout le monde aux fenêtres, carnets et téléphones prêts",
        requires: { stats: { asso: '>=40' } },
        effects: { asso: +4, dossier: +5, sleep: -8, setFlags: ['saturday2_done', 'whatsapp_rally'] },
        result:
          "Douze fenêtres allumées, douze téléphones horodatés. La rue des Bouchers se découvre un service de contrôle citoyen. Dédé lève les yeux, compte les fenêtres, et rentre deux tables avant la cloche. Ce soir, au moins.",
      },
      {
        label: 'Répondre au lobbying « samedi festif » avec la pétition',
        requires: { flags: ['cm_festive_saturday', 'petition_started'] },
        effects: { asso: +5, hostility: +5, setFlags: ['saturday2_done', 'petition_delivered'] },
        result:
          "Le bloc réclamait un « samedi festif ». Vous déposez à la mairie, en réponse, une pétition pour un « dimanche dormi ». Jérémie l’a reliée. Hippolyte a fourni la reliure en cuir.",
      },
      {
        label: "Faire profil bas pour arriver frais à la commission",
        effects: { sleep: +10, setFlags: ['saturday2_done'] },
        result:
          "Bouchons d’oreilles, masque, ventilateur pour couvrir le reste. Vous dormez par morceaux, mais demain vous saurez au moins dire « aménagement du domaine public » sans bafouiller.",
      },
    ],
  },

  // ── J14 · dimanche : la commission des terrasses ────────────────────────
  // Les choix encodent les seuils (README : « Commission »). Les fins lisent ensuite les drapeaux.
  {
    id: 'd14_commission',
    day: 14,
    phase: 'afternoon',
    speaker: 'lescaut',
    title: 'J14 · Commission des terrasses, salle du conseil',
    text:
      "Lambris, micro qui grésille, carafe d’eau tiède. Au premier rang, le bloc en tenue du dimanche : Dédé sourit à tout le monde, Ghislain a apporté son classeur, désormais à 600 pages. Colette Verhaeghe s’assoit « en simple citoyenne », au premier rang, à côté du micro. Bertrand Lescaut ouvre la séance : « Je vous entends tous. Je vous écoute, maintenant. » C’est à vous.",
    // Scène de la commission : le moteur affiche, dans l'ordre, chaque réplique dont `when` correspond
    // (même principe que les épilogues), puis les choix. Forces et faiblesses du dossier → discours.
    scene: [
      // ── Ouverture ──────────────────────────────────────────────────────
      {
        speaker: 'lescaut',
        when: {},
        text: "« Mesdames, messieurs, la commission examine ce jour le renouvellement de l’autorisation d’occupation temporaire de l’Estaminet La Ch’tite Bernadette. Chacun aura la parole. Brièvement. Monsieur Ghislain, merci de ne pas lire les 600 pages. »",
      },

      // ── Jérémie, pour l'association : les forces du dossier ────────────
      {
        speaker: 'jeremie',
        when: {},
        text: "« Monsieur le maire, je préside l’Association de la rue des Bouchers. Nous ne sommes pas contre les terrasses. Nous sommes pour l’arrêté. Celui que vous avez signé. »",
      },
      {
        speaker: 'jeremie',
        when: { stats: { dossier: '>=70' } },
        text: "« Notre dossier compte des dizaines de pièces : photos horodatées, relevés en décibels, nombre de personnes par table. Nous ne racontons pas nos nuits. Nous les avons mesurées. »",
      },
      {
        speaker: 'jeremie',
        when: { stats: { dossier: '>=40' } },
        text: "« Tables dehors après 22h00, soir après soir. Ce n’est pas une impression : c’est un tableau. Je l’ai imprimé en A3. »",
      },
      {
        speaker: 'jeremie',
        when: { flags: ['corridor_measured'] },
        text: "« Le couloir de passage a été mesuré au mètre ruban. Des tables empiètent de plusieurs dizaines de centimètres. C’est par là que passent les poussettes, les fauteuils et les pompiers. »",
      },
      {
        speaker: 'jeremie',
        when: { flags: ['proj_db_logger'] },
        text: "« Un enregistreur tourne en continu à la fenêtre d’un riverain. Il ne dort pas, lui. Les courbes sont en annexe 4. »",
      },
      {
        speaker: 'jeremie',
        when: { flags: ['colette_dinner_photo'] },
        text: "« Pièce 12 : un dîner de huit personnes à une table de six, le jeudi de la première semaine. » Il ne regarde pas le premier rang. Tout le monde regarde le premier rang.",
      },
      {
        speaker: 'jeremie',
        when: { flags: ['tatie_emails_shared'] },
        text: "« Madame Bouchon a reçu des réponses écrites de l’établissement, toutes identiques sur le fond : ‹ c’est en cours de résolution ›. Nous les versons au dossier. Elles parlent d’elles-mêmes. Elles ne parlent que de ça. »",
      },
      {
        speaker: 'jeremie',
        when: { flags: ['petition_delivered'] },
        text: "« Et voici la pétition des riverains. » Il pose sur la table un volume relié cuir. Hippolyte, au fond, hoche la tête avec fierté.",
      },
      {
        speaker: 'jeremie',
        when: { stats: { dossier: '<30' } },
        text: "« Nous avons… quelques photos. » Il les étale. Deux sont floues. Une montre surtout Biloute. Le silence est long.",
      },

      // ── Ghislain, pour l'établissement : les faiblesses du dossier ─────
      {
        speaker: 'ghislain',
        when: {},
        text: "« Monsieur le maire, l’établissement a toujours fait preuve d’une démarche constructive. Toutes les remarques ont été prises en compte et sont en cours de résolution. » Il ouvre son classeur à la page 1. Il y en a 600.",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['cm_happy_petition'] },
        text: "« Je verse au dossier une pétition de 2 300 clients satisfaits, dont une majorité hors de la métropole, et un certain Jean Bon, de Bruxelles. Leur attachement à la rue est sincère. »",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['bucket_witnessed'] },
        text: "« Je rappelle aussi qu’un plaignant a vidé un seau d’eau sur nos clients, devant témoins. Nous parlons de nuisances ? Parlons-en. »",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['video_viral'] },
        text: "« La vidéo a été vue plusieurs milliers de fois. Je la tiens à disposition de la commission. » Il ne la montre pas. Il n’a pas besoin.",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['complaint_filed'] },
        text: "« Une plainte est en cours contre l’un des riverains ici présents. Je ne la commenterai pas. » Il la commente du regard pendant dix secondes.",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['serial_caller'] },
        text: "« La police municipale a reçu un nombre d’appels… disons, remarquable. Au point de ne plus se déplacer. Cela dit quelque chose. Je laisse la commission juger quoi. »",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['read_quotes'] },
        text: "« Certaines pièces adverses proviennent manifestement de nos documents internes. Je m’interroge sur leur provenance. Je ne suis pas le seul, je crois. »",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['traitor_recruited'], notFlags: ['traitor_known'] },
        text: "« Les riverains eux-mêmes sont divisés. J’ai ici le message d’un membre de l’association qui ‹ comprend les deux côtés ›. » Jérémie se fige. Régis regarde le plafond.",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['fake_reviews_traced'] },
        text: "« Des faux avis ont été publiés contre nous. Ils ont été retracés. Je n’en dirai pas plus, par délicatesse. » Il en dit plus.",
      },
      {
        speaker: 'ghislain',
        when: { flags: ['stance_dialogue'] },
        text: "« Cela dit, nous avons noté la démarche de dialogue de l’association. Nous… y sommes ouverts. » On dirait que la phrase lui coûte un rein.",
      },

      // ── Delphine Vermeersch, l'inspectrice ─────────────────────────────
      {
        speaker: 'delphine',
        when: { flags: ['ac_violation_confirmed'], notFlags: ['conflict_exposed'] },
        text: "« Pour le service : groupe de climatisation extérieur, posé en façade sans autorisation, constaté lors de la contre-visite de mardi. L’infraction est caractérisée. Je n’ai pas d’adjectif à ajouter. Le service du patrimoine en a plusieurs. »",
      },
      {
        speaker: 'delphine',
        when: { flags: ['ac_case_stalled'], notFlags: ['conflict_exposed'] },
        text: "« La visite de contrôle était annoncée. Le jour dit, il n’y avait plus de climatisation sur la façade, mais une jardinière. Le dossier reste ouvert. » Elle referme le sien avec un bruit sec.",
      },
      {
        speaker: 'delphine',
        when: { flags: ['exhaust_meeting_won'] },
        text: "« Pour mémoire, la réunion technique de jeudi a acté le déplacement de la gaine d’extraction en toiture. La ville a donc déjà reconnu le problème. »",
      },
      {
        speaker: 'delphine',
        when: { flags: ['conflict_exposed'] },
        text: "Delphine Vermeersch n’est pas là. Un collègue lit sa note d’une voix monocorde : « L’inspectrice s’est déportée de ce dossier pour des raisons de déontologie. » Ghislain sourit pour la première fois de l’année.",
      },

      // ── Colette Verhaeghe, « simple citoyenne » ────────────────────────
      {
        speaker: 'colette',
        when: { notFlags: ['press_scandal'] },
        text: "Colette Verhaeghe se lève sans qu’on lui donne la parole : « Mes chers amis, la convivialité, c’est l’ADN de Lille. Rue de Gand, on ferme à minuit. Je dis ça, je ne dis rien. » Elle se rassoit. Elle a tout dit.",
      },

      // ── Le maire, avant la parole de Pilou ─────────────────────────────
      {
        speaker: 'lescaut',
        when: { flags: ['lescaut_ally'] },
        text: "Bertrand Lescaut vous fait un signe de tête discret. « J’ai lu votre dossier, monsieur Dubeton. Tout votre dossier. Je vous écoute. »",
      },
      {
        speaker: 'lescaut',
        when: { notFlags: ['lescaut_ally'] },
        text: "Bertrand Lescaut se tourne vers vous : « Monsieur Dubeton. Vous avez la parole. Trois minutes. Je vous entends. »",
      },
    ],
    choices: [
      {
        label: 'Plaider le dossier complet : photos, dB, couloir, PV',
        requires: { stats: { dossier: '>=70', risk: '<40' } },
        effects: { dossier: +5, setFlags: ['commission_done', 'won_legal', 'commission_won'] },
        result:
          "Pièce après pièce, horodatée, mesurée, sourcée. Maître Vandamme n’a presque rien à ajouter, ce qui le contrarie. Ghislain ouvre son classeur pour répondre et constate qu’il ne contient que des e-mails « c’est en cours ». La commission suspend l’autorisation de terrasse de l’estaminet.",
      },
      {
        label: "Plaider la clim : l’infraction est confirmée depuis mardi",
        requires: { stats: { dossier: '>=50', risk: '<40' }, flags: ['ac_violation_confirmed'] },
        effects: { setFlags: ['commission_done', 'won_legal', 'commission_won'] },
        result:
          "Delphine confirme au micro : groupe de climatisation sans autorisation, constaté. « Un établissement qui ne respecte pas l’urbanisme ne peut pas prétendre gérer un domaine public. » L’AOT est suspendue. Dédé applaudit, par réflexe, puis s’arrête.",
      },
      {
        label: "Plaider l’extraction : la ville a déjà acté le déplacement",
        requires: { stats: { dossier: '>=50', risk: '<40' }, flags: ['exhaust_meeting_won'] },
        effects: { setFlags: ['commission_done', 'won_legal', 'commission_won'] },
        result:
          "« La ville elle-même a acté le problème de la gaine jeudi. Combien de ‹ en cours › faut-il encore ? » Le technicien hoche la tête. Le maire aussi. L’AOT est suspendue en attendant les travaux.",
      },
      {
        label: 'Présenter la charte de bon voisinage, signée par les deux camps',
        requires: { stats: { asso: '>=60' }, hidden: { hostility: '<60' }, flags: ['charter_drafted'] },
        effects: { hostility: -20, setFlags: ['commission_done', 'won_peace', 'commission_won'] },
        result:
          "Jérémie lit la charte : tables rentrées à 22h, couloir dégagé, interlocuteur unique côté bloc, réunion trimestrielle avec tarte de Hilde. Le Goulot a signé en premier, Bloemkool ensuite « pour l’image », et Dédé enfin, la main sur le cœur, sous le regard du maire. Ghislain a archivé sa copie.",
      },
      {
        label: "Tendre la main au bloc, devant toute la salle",
        requires: { stats: { asso: '>=75' }, hidden: { hostility: '<45' } },
        effects: { hostility: -15, setFlags: ['commission_done', 'won_peace', 'commission_won'] },
        result:
          "Vous proposez une charte, là, au micro, sans l’avoir négociée. Silence. Puis Le Goulot dit « moi je signe ». Bloemkool suit pour ne pas être le dernier. Dédé, coincé, signe en riant trop fort. Le maire a l’air sincèrement soulagé.",
      },
      {
        label: "Faire sortir l’affaire de corruption le matin même dans La Voix du Nordiste",
        requires: { flags: ['corruption_proof', 'press_contacted'] },
        effects: { hostility: +25, corruption: -40, setFlags: ['commission_done', 'won_scandal', 'commission_won', 'press_scandal'] },
        result:
          "La une du journal : « Terrasses et waterzooi : la police municipale mange-t-elle à l’œil ? » La salle bruisse. Colette se découvre un rendez-vous urgent. Le Commandant Desmet annonce, sans qu’on lui demande, que « l’affaire est prise très au sérieux ». La commission devient un point presse. Le bloc a perdu, et ne l’oubliera pas.",
      },
      {
        label: 'Venir… en habitué de l’estaminet',
        requires: { flags: ['carbonnade_3'] },
        effects: { setFlags: ['commission_done'] },
        result:
          "Dédé vous fait signe de vous asseoir avec eux. Vous hésitez une seconde. Une seule. Au fond de la salle, Klaas ouvre son carnet.",
      },
      {
        label: 'Improviser avec ce qu’on a',
        effects: { setFlags: ['commission_done', 'commission_lost'] },
        result:
          "Vous parlez du sommeil, de la gaine, du droit à la nuit. C’est sincère. Ghislain répond avec 600 pages, Colette avec « l’ADN de Lille ». « La commission prend acte des efforts de l’établissement. » L’AOT est renouvelée. Avec, en prime, une extension d’une table.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // ÉVÉNEMENTS ALÉATOIRES (≥ 12)
  // ════════════════════════════════════════════════════════════════════════

  {
    id: 'r_drache',
    when: { phase: 'night', notFlags: ['random_drache'], chance: 0.12 },
    once: true,
    title: 'Drache nationale',
    text:
      "21h15 : le ciel du Nord se souvient qu’il est le ciel du Nord. Une drache tombe d’un coup, droite, épaisse. Les terrasses se vident en quatre minutes chrono. Les parasols, ça décore, mais ça n’abrite pas grand-chose.",
    choices: [
      {
        label: 'Ouvrir grand la fenêtre et écouter la pluie',
        effects: { sleep: +15, setFlags: ['random_drache'] },
        result: "Le plus beau bruit du monde : des pavés mouillés et personne dessus. Vous vous endormez avant 22h, pour la première fois depuis mai.",
      },
      {
        label: 'Photographier les tables rentrées en quatre minutes',
        effects: {
          dossier: +3,
          setFlags: ['random_drache'],
          evidence: { kind: 'photo', quality: 0.7, legal: true, label: 'Terrasse rentrée en 4 minutes sous la pluie (quand ils veulent, ils peuvent)' },
        },
        result: "Quatre minutes pour tout rentrer. Le soir de la pluie. Les autres soirs, il leur en faut quarante. Jérémie appelle ça « une démonstration de faisabilité ».",
      },
    ],
  },

  {
    id: 'r_suitcases',
    when: { phase: 'night', day: [3, 13], chance: 0.15 },
    once: true,
    title: '1h07 : roulettes sur pavés',
    text:
      "Une valise à roulettes sur des pavés de 1729, c’est un concert de batterie lent. Deux, c’est un orchestre. Un groupe de touristes cherche « le n°27, l’appart avec la terrasse en bas ». Ils sonnent chez vous. Deux fois.",
    choices: [
      {
        label: 'Leur indiquer le n°27, poliment',
        effects: { sleep: -6, asso: +1 },
        result: "« Merci ! Le proprio nous a dit que la rue était super vivante ! » C’est exact. Régis loue « l’ambiance » à la nuitée.",
      },
      {
        label: 'Noter l’heure et le numéro',
        effects: { sleep: -6, dossier: +1 },
        result: "1h07, n°27, 78 dB de roulettes. Ce n’est pas une infraction. C’est une information.",
      },
    ],
  },

  {
    id: 'r_hilde_soup',
    speaker: 'hilde',
    when: { phase: 'afternoon', stats: { sleep: '<35' }, chance: 0.35 },
    once: true,
    title: 'Hilde frappe à la porte',
    text:
      "Une casserole emballée dans un torchon, un thermos et un regard inquiet. « Klaas m’a dit que votre lumière était encore allumée à trois heures. Vous avez une tête de chicon cuit. Mangez. »",
    choices: [
      {
        label: 'Accepter la soupe et la tisane',
        effects: { sleep: +12, asso: +3, setFlags: ['met_hilde', 'hilde_tisane'] },
        result: "Soupe de poireaux, tisane au tilleul, tarte au sucre « pour la route ». Elle ne repart que quand le bol est vide. Vous dormez trois heures d’affilée l’après-midi, comme un enfant.",
      },
      {
        label: "« Je n’ai pas le temps, Hilde, j’ai un dossier. »",
        effects: { asso: -2, setFlags: ['met_hilde'] },
        result: "Elle pose quand même le thermos sur la console. « Un dossier, ça ne se mange pas. » Elle a raison, et ça vous agace.",
      },
    ],
  },

  {
    id: 'r_waiter_smoke',
    speaker: 'serveur',
    when: { phase: 'night', day: [2, 13], flags: ['talked_waiter'], notFlags: ['met_waiter'], chance: 0.3 },
    once: true,
    title: 'Pause clope sous le store',
    text:
      "0h20. Le serveur fume sous le store, la tête contre le mur, comme un homme qui a porté 140 assiettes. Il vous reconnaît : « C’est vous qui demandez gentiment, vous. Les autres crient. Moi c’est Théo. »",
    choices: [
      {
        label: 'Discuter, sans rien demander',
        effects: { setFlags: ['met_waiter'], hostility: -2 },
        result: "Il parle des quinze heures par jour, des tables qu’on lui dit de « ressortir doucement », des patrons qui « gèrent ». Il ne vous dit rien d’utile. Il vous dit tout.",
      },
      {
        label: 'Lui demander s’il a vu la police manger gratuitement',
        requires: { flags: ['seen_complaisance'] },
        effects: { setFlags: ['met_waiter'], dossier: +2, hostility: +3 },
        result: "Il écrase sa cigarette. « Je fais que mon taf, moi. » Pause. « Mais le mardi, le brigadier, il prend un dessert aussi. » Il rentre avant que vous ayez fini de noter.",
      },
    ],
  },

  {
    id: 'r_bachelor_party',
    when: { phase: 'night', day: [5, 13], chance: 0.12 },
    once: true,
    title: 'Enterrement de vie de garçon, quatorze participants',
    text:
      "Quatorze garçons en t-shirts identiques « LA DER DE KEVIN » réclament une table. L’estaminet colle trois tables de six et décrète que c’est « une grande table ». Kevin est déguisé en chope. Il est 23h40.",
    choices: [
      {
        label: 'Photographier la « grande table » de quatorze',
        effects: {
          dossier: +4,
          evidence: { kind: 'photo', quality: 0.75, legal: true, label: '23h40 · 14 personnes sur trois tables collées, après 22h' },
        },
        result: "Trois tables collées, quatorze convives, 23h40. Ghislain appellera ça « trois tables de 4,67 ». Klaas appellera ça une ligne de plus.",
      },
      {
        label: 'Leur souhaiter un bon mariage depuis la fenêtre',
        effects: { sleep: -5, asso: +1 },
        result: "Ils vous chantent une chanson en retour. Toute la chanson. Kevin pleure. Vous aussi, un peu, mais pas pour la même raison.",
      },
    ],
  },

  {
    id: 'r_stephane_vocal',
    speaker: 'stephane',
    when: { phase: 'morning', day: [3, 12], chance: 0.2 },
    once: true,
    title: 'Message vocal de 4 min 12',
    text:
      "« Hello la team ! Petite vibe check. Je sens qu’on est un peu en mode pantoufle cette semaine, et c’est ok, on est une famille, mais une famille qui ship. Pilou, j’ai vu tes commits à 3h du mat’, j’adore l’énergie, par contre ça parle beaucoup de décibels ? Bisous de… peu importe d’où. »",
    choices: [
      {
        label: 'Répondre par un vocal de 4 min 13 sur la « roadmap »',
        effects: { job: +6, sleep: -3 },
        result: "Vous dites « synergie », « scalable » et « on itère ». Stéphane répond par un pouce. Votre dignité répond par un silence.",
      },
      {
        label: "Lui dire la vérité : vous ne dormez plus",
        effects: { job: -3, asso: +1 },
        result: "« Ah mais grave, le sommeil c’est la base. Tu devrais tester le breathwork. » Il ne fait pas le lien avec la rue. Delphine, elle, le fera peut-être, au dîner.",
      },
    ],
  },

  {
    id: 'r_biloute_chairs',
    speaker: 'biloute',
    when: { phase: 'night', day: [2, 12], flags: ['joined_rounds'], chance: 0.25 },
    once: true,
    title: 'Biloute flaire une livraison',
    text:
      "Pendant la ronde, Biloute s’arrête net devant la porte de service de l’estaminet et grogne. Une camionnette décharge, en pleine ronde, douze chaises pliantes neuves. *Biloute s’assoit. Biloute fixe les chaises. Biloute juge.*",
    choices: [
      {
        label: 'Photographier la livraison',
        effects: {
          dossier: +3,
          hostility: +3,
          evidence: { kind: 'photo', quality: 0.7, legal: true, label: '20h45 · 12 chaises supplémentaires livrées pour une terrasse « limitée »' },
        },
        result: "Douze chaises de plus pour une terrasse dont la surface n’a pas bougé. Jérémie dira « c’est mathématique ». Dédé dira « c’est pour la réserve ». La réserve fait dix mètres carrés.",
      },
      {
        label: 'Récompenser Biloute (une frite trouvée)',
        effects: { asso: +2 },
        result: "Jérémie : « Ne lui donne pas de frites. » Trop tard. Biloute est désormais un informateur rémunéré.",
      },
    ],
  },

  {
    id: 'r_klaas_roster',
    speaker: 'klaas',
    when: { phase: 'afternoon', day: [5, 13], flags: ['met_klaas', 'called_police'], notFlags: ['roster_known'], chance: 0.4 },
    once: true,
    title: 'Le carnet de Klaas, page 41',
    text:
      "Klaas vous montre une page couverte de colonnes au crayon. « Ja. Mardi, vendredi : moustache. Lent. Lundi, mercredi : le jeune. Rapide. Carnet de PV. Le reste : je ne sais pas encore. » Il a déduit le planning de la police municipale avec une précision que la police municipale n’a pas.",
    choices: [
      {
        label: 'Recopier le planning',
        effects: { dossier: +2, setFlags: ['roster_known'] },
        result: "Vous savez maintenant quel soir appeler. Klaas ajoute, sans lever les yeux : « Et vous, je note aussi quand vous appelez. »",
      },
    ],
  },

  {
    id: 'r_guided_tour',
    speaker: 'hippolyte',
    when: { phase: 'afternoon', notFlags: ['knows_trou'], chance: 0.2 },
    once: true,
    title: "Visite guidée : « le Trou »",
    text:
      "Un guide de l’office de tourisme arrête son groupe sous votre fenêtre : « Rue des Bouchers, 1729. Pendant des siècles, on l’appelait ‹ le Trou ›, tant elle était sale. Un canal coulait dessous jusqu’en 1912. » Hippolyte, qui passait, corrige un détail sur le canal. Le guide le remercie, vexé.",
    choices: [
      {
        label: 'Retenir la formule',
        effects: { asso: +2, setFlags: ['knows_trou', 'met_hippolyte'] },
        result: "Le bloc dit « ça a toujours été une rue festive ». Vous pourrez répondre : « Ça a toujours été un trou. » Hippolyte approuve : « Avec des archives. »",
      },
    ],
  },

  {
    id: 'r_fire_brigade',
    when: { phase: 'night', day: [3, 13], chance: 0.1 },
    once: true,
    title: 'Les pompiers ne passent pas',
    text:
      "22h35. Un malaise au n°31. Le véhicule de secours s’engage depuis la place Maurice-Schumann et s’arrête net : le couloir de passage est occupé par deux tables, une poussette et un serveur. Il faut deux minutes pour dégager. Deux longues minutes.",
    choices: [
      {
        label: 'Filmer, de la fenêtre, le camion bloqué',
        effects: {
          dossier: +8,
          hostility: +5,
          evidence: { kind: 'video', quality: 0.85, legal: true, label: '22h35 · Secours bloqués 2 min par des tables dans le couloir de passage' },
        },
        result: "Ce n’est plus une histoire de sommeil. C’est une histoire de sécurité. Le monsieur du n°31 va bien. Le dossier aussi, désormais.",
      },
      {
        label: 'Descendre aider à pousser les tables',
        effects: { asso: +5, sleep: -5, hostility: -3 },
        result: "Vous poussez, le serveur pousse, même Dédé pousse. Pendant deux minutes, il n’y a plus de bloc et plus de riverains. Puis tout le monde se rassoit.",
      },
    ],
  },

  {
    id: 'r_traitor_gossip',
    speaker: 'seb',
    when: { phase: 'afternoon', flags: ['traitor_recruited'], notFlags: ['traitor_known'], chance: 0.45 },
    once: true,
    title: 'Seb : « Attends, attends »',
    text:
      "« Attends, attends. Régis. À l’estaminet. Hier. Une carbonnade. Il a pas payé. Et il a montré son téléphone à Ghislain. » Nico, derrière : « On a la capture. On a l’heure. On n’a pas le contenu du téléphone. » Seb : « On a l’ambiance. »",
    choices: [
      {
        label: "Le dire à Jérémie, discrètement",
        effects: { asso: +3, setFlags: ['traitor_known'] },
        result: "Jérémie soupire comme un président qui découvre un trésorier. « On ne l’exclut pas. On arrête juste de parler devant lui. »",
      },
      {
        label: 'Le balancer sur le groupe',
        effects: { asso: -5, hostility: +5, setFlags: ['traitor_known', 'traitor_public'] },
        result: `Sur « ${WHATSAPP_GROUP} », c’est l’explosion. Régis quitte le groupe, revient « pour clarifier », re-quitte. Tatie : « Les loups ne se mangent pas entre eux, mais ils mangent la carbonnade. »`,
      },
    ],
  },

  {
    id: 'r_bombance_rumour',
    speaker: 'tatie',
    when: { day: [8, 13], phase: 'afternoon', notFlags: ['bombance_rumour'], chance: 0.35 },
    once: true,
    title: 'Une affiche sur la vitrine de La Bombance',
    text:
      "Sur la vitrine blanchie du n°4, l’affiche « À LOUER » a été remplacée par « BIENTÔT ». Bientôt quoi ? Tatie Bouchon a sa petite idée : « Colette m’a dit qu’un garçon très bien voulait y faire un bar à cocktails. Avec DJ. Elle trouvait ça ‹ dynamique ›. »",
    choices: [
      {
        label: 'Prévenir Hippolyte',
        effects: { setFlags: ['bombance_rumour', 'met_hippolyte'] },
        result: "Hippolyte : « Un bar à cocktails, au n°4. Dans une maison de 1730. Avec DJ. » Il le répète deux fois, à voix basse, comme une condamnation.",
      },
      {
        label: "« Un problème à la fois. »",
        effects: { setFlags: ['bombance_rumour'], sleep: +2 },
        result: "Sage. Mais l’affiche « BIENTÔT » reste là, et elle vous regarde chaque fois que vous passez.",
      },
    ],
  },

  {
    id: 'r_colette_interview',
    speaker: 'colette',
    when: { day: [5, 12], phase: 'morning', notFlags: ['press_article'], chance: 0.2 },
    once: true,
    title: "La Voix du Nordiste : « Colette Verhaeghe : laissez vivre Lille ! »",
    text:
      "Pleine page. Colette pose devant un estaminet qui ressemble beaucoup à l’estaminet : « La convivialité, c’est l’ADN de Lille. Je comprends les riverains, j’en ai été une, mais rue de Gand ferme bien à minuit, non ? » Pas un mot sur la règle des 22h. Ni sur le couloir.",
    choices: [
      {
        label: "Envoyer un droit de réponse à la journaliste",
        requires: { stats: { dossier: '>=20' } },
        effects: { asso: +3, setFlags: ['press_contacted'] },
        result: "Anne-Sophie Lepoutre répond en dix minutes : « Vous avez des éléments ? » Vous en avez. Elle garde votre numéro.",
      },
      {
        label: "Encadrer l’article dans les toilettes",
        effects: { sleep: +2 },
        result: "Une place d’honneur. Colette y sourira à chacun de vos passages. C’est une forme de dialogue.",
      },
    ],
  },

  {
    id: 'r_consultation',
    when: { phase: 'afternoon', day: [2, 12], chance: 0.15 },
    once: true,
    title: 'Consultation citoyenne en ligne',
    text:
      "La mairie lance une « grande consultation sur la vie nocturne ». Il faut un compte FranceConnect, un justificatif de domicile de moins de trois mois au format PDF de moins de 2 Mo, et répondre à la question 1 : « Sur une échelle de 1 à 10, à quel point aimez-vous la convivialité ? »",
    choices: [
      {
        label: 'Remplir les 47 questions sérieusement',
        effects: { dossier: +2, job: -2 },
        result: "Question 46 : « Avez-vous des suggestions ? » Champ limité à 140 caractères. Vous écrivez « Appliquer l’arrêté existant. » Il en reste 112.",
      },
      {
        label: `Partager le lien sur « ${WHATSAPP_GROUP} »`,
        effects: { asso: +3, setFlags: ['whatsapp_rally'] },
        result: "Seb relaie avec trois gyrophares. Tatie ne trouve pas FranceConnect. Klaas remplit le formulaire en recopiant son carnet dans le champ « suggestions », en plusieurs fois.",
      },
    ],
  },

  {
    id: 'r_aot_pdf',
    speaker: 'jeremie',
    when: { phase: 'afternoon', flags: ['aot_requested'], notFlags: ['legal_view'], chance: 0.6 },
    once: true,
    title: "Le plan des zones arrive (scanné de travers)",
    text:
      "Après onze relances, la mairie envoie enfin l’autorisation d’occupation temporaire de l’estaminet, avec son plan. PDF scanné de biais, une tache de café sur la cote du couloir, mais lisible. Jérémie l’imprime en A3. Puis en A2.",
    choices: [
      {
        label: 'Étudier le plan, mètre ruban en main',
        effects: { dossier: +3, setFlags: ['legal_view'] },
        result: "La zone autorisée s’arrête bien avant là où commencent les tables. Vous voyez désormais la rue comme un géomètre : en fantômes verts et en couloir rouge.",
      },
    ],
  },

  {
    id: 'r_influencer',
    when: { phase: 'night', day: [3, 13], chance: 0.12 },
    once: true,
    title: '« La rue la plus authentique de Lille »',
    text:
      "Une influenceuse filme un « vlog Vieux-Lille » au milieu du couloir de passage, ring light allumée. Elle tourne la même prise sept fois : « Ici, c’est vraiment la vraie vie lilloise, les gens sont trop chaleureux. » En arrière-plan de chaque prise : votre porte, bloquée par une chaise, et la terrasse qui mord sur le couloir.",
    choices: [
      {
        label: 'Récupérer la vidéo publiée, horodatée',
        effects: {
          dossier: +3,
          evidence: { kind: 'video', quality: 0.6, legal: true, label: 'Vidéo publique : tables dans le couloir et porte bloquée, en fond de vlog' },
        },
        result: "Merci, la vraie vie lilloise. Sa vidéo fait 80 000 vues, et elle est datée, géolocalisée et publique. Le meilleur témoin de la rue est une ring light.",
      },
      {
        label: 'Ignorer',
        effects: {},
        result: 'Elle repart au bout de sept prises. La porte, elle, reste.',
      },
    ],
  },

  {
    id: 'r_hippolyte_workshop',
    speaker: 'hippolyte',
    when: { phase: 'afternoon', day: [2, 10], notFlags: ['hippolyte_room'], stats: { asso: '>=30' }, chance: 0.3 },
    once: true,
    title: "Une invitation sur papier vergé",
    text:
      "Un carton glissé sous votre porte, à l’encre noire : « Monsieur Dubeton, l’association pourrait, si elle le souhaite, se réunir dans l’ancienne carrosserie, rue de la Baignerie. Le lieu a connu des débats plus vifs. En 1848, par exemple. Hippolyte. »",
    choices: [
      {
        label: "Accepter, avec gratitude",
        effects: { asso: +5, setFlags: ['hippolyte_room', 'met_hippolyte'] },
        result: "Une cour pavée, une porte cochère en chêne, des calèches sous des draps. Hippolyte vous vouvoie, et vouvoie aussi le chat. L’association a désormais une salle qui en impose.",
      },
      {
        label: "Lui demander aussi d’appeler le patrimoine pour la clim",
        requires: { flags: ['met_hippolyte'] },
        effects: { asso: +3, setFlags: ['hippolyte_room', 'heritage_angle'] },
        result: "« Une clim en façade d’une maison de 1729. » Il prend son stylo-plume. « Je connais l’architecte. Je connaissais son père. J’ai vendu une calèche à son grand-père. »",
      },
    ],
  },

  {
    id: 'r_tatie_proverb',
    speaker: 'tatie',
    when: { phase: 'morning', stats: { asso: '<35' }, chance: 0.25 },
    once: true,
    title: 'Tatie Bouchon à sa fenêtre',
    text:
      "Vous passez sous la fenêtre du n°19. Tatie Bouchon vous interpelle, un arrosoir à la main : « Vous avez une mine ! Écoutez-moi : si vous voulez quelque chose dans la vie, faut résister et se battre pour. Et le pour, il faut le savoir avant de se battre. »",
    choices: [
      {
        label: "« Et vous, Tatie, vous êtes avec nous ? »",
        effects: { asso: +4, setFlags: ['met_tatie'], clearFlags: ['tatie_wavering'] },
        result: "« Moi ? Je suis avec la rue. La rue, c’est vous. Sauf à l’heure du thé. » C’est un oui. Avec astérisque.",
      },
      {
        label: 'Hocher la tête et filer',
        effects: { setFlags: ['met_tatie'] },
        result: "« Un proverbe, ça ne se hoche pas, ça se médite ! » crie-t-elle dans votre dos.",
      },
    ],
  },

  {
    id: 'r_charter_talks',
    speaker: 'jeremie',
    when: { day: [8, 13], phase: 'afternoon', flags: ['stance_dialogue'], notFlags: ['charter_drafted'], stats: { asso: '>=40' }, chance: 0.6 },
    once: true,
    title: "Une table de négociation (sans débord)",
    text:
      "L’AG a voté le dialogue, alors Jérémie l’organise. Rendez-vous au Goulot, le plus conciliant du bloc, à 15h, terrasse vide. D’un côté : Jérémie, son classeur, et vous. De l’autre : le patron du Goulot, une serveuse de Bloemkool « pour l’image », et Dédé, qui arrive en retard avec des gaufres. Ghislain a envoyé un e-mail : « Nous prenons note. »",
    choices: [
      {
        label: "Négocier article par article",
        effects: { asso: +3, hostility: -12, setFlags: ['charter_drafted'] },
        result:
          "Deux heures, quatre cafés, une gaufre chacun. Article 1 : tables rentrées à 22h00. Article 2 : couloir libre. Article 3 : une réunion par trimestre. Dédé raye « trimestre » et écrit « quand on veut ». Jérémie le re-raye. Le brouillon de charte existe. Reste à le faire signer devant le maire.",
      },
      {
        label: "Exiger 22h00 pile, sans discussion",
        effects: { hostility: +6 },
        result:
          "Dédé repose sa gaufre. « Alors on n’a rien à se dire, mon biloute. » Le patron du Goulot soupire, la serveuse de Bloemkool regarde son téléphone. La réunion a duré onze minutes. Jérémie range son classeur sans un mot, ce qui, chez lui, est un cri.",
      },
    ],
  },
  {
    id: 'r_bombance_project',
    speaker: 'tatie',
    when: { day: [12, 13], phase: 'afternoon', flags: ['bombance_rumour'], notFlags: ['bombance_bar_project', 'bombance_blocked'], chance: 0.5 },
    once: true,
    title: 'Permis déposé au n°4',
    text:
      "Un panneau blanc est apparu sur la façade de La Bombance : « Déclaration préalable de travaux · Changement de destination · Bar de nuit ». Tatie, ravie d’avoir eu raison : « Je vous l’avais dit. C’est Colette qui me l’a dit. Je ne devrais pas vous le dire. »",
    choices: [
      {
        label: "Lancer Hippolyte sur l’angle patrimoine du n°4",
        requires: { flags: ['hippolyte_room'] },
        effects: { setFlags: ['bombance_bar_project', 'bombance_blocked'] },
        result: "Hippolyte sort un plan de 1730. Le n°4 est en périmètre protégé, la devanture aussi. « Un DJ ici ? Il faudra d’abord passer sur le corps de l’architecte des Bâtiments de France. Il est très vivant. » Projet bloqué.",
      },
      {
        label: 'Former un recours avec Maître Vandamme',
        requires: { flags: ['lawyer_hired'], stats: { dossier: '>=50' } },
        effects: { setFlags: ['bombance_bar_project', 'bombance_blocked'] },
        result: "Maître Vandamme rédige un recours d’une politesse glaçante. Le porteur de projet découvre l’arrêté des 22h, le couloir, et l’association. Il préfère la rue Royale.",
      },
      {
        label: "On verra après la commission",
        effects: { setFlags: ['bombance_bar_project', 'bombance_wait'] },
        result: "Après la commission. Bien sûr. Le panneau blanc, lui, n’attend personne.",
      },
    ],
  },
];
