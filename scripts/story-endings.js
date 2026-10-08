// Mode `npm run story -- --ending <id|all>` : une transcription par fin (et par variante de garde à vue),
// dans qa/stories/endings/<nom>.md (+ <nom>-2.md, une seconde partie différente, pour juger la variété).
//
// Méthode, dans l'ordre :
//   1. parties naturelles : on cherche, parmi les bots qui visent cette fin, une graine qui y arrive d'elle-même ;
//   2. choix pilotés : on oriente seulement les CHOIX du joueur vers la fin visée (une décision qu'un joueur peut prendre) ;
//   3. pilotage d'état (dernier recours) : drapeaux ou stats forcés comme dans tests/unit/checklist.test.js,
//      chaque forçage étant écrit dans la transcription (« ⚙️ Pilotage (test, hors jeu) »).
// Le fichier qa/stories/endings/README.md dit, pour chaque fin, laquelle des trois méthodes a suffi.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const pickLabel = (patterns) => (c, card, ok) => {
  for (const re of patterns) { const ch = ok.find((x) => re.test(x.label)); if (ch) return ch.i; }
  return undefined;
};
// Forçage d'état, une fois, à partir d'un jour donné
const forceOnce = (fromDay, phaseStep, fx, why) => {
  const done = new WeakSet(); // une fois par campagne (chaque graine a la sienne)
  return (c, note) => {
    if (done.has(c) || c.state.day < fromDay || c.step !== phaseStep) return;
    done.add(c);
    c.apply(fx, 'engine', 'story-steer');
    note(why);
  };
};
const chain = (...fns) => (c, note) => fns.forEach((f) => f(c, note));

export const SPECS = [
  { name: 'legal_victory', ending: 'legal_victory', bots: ['legal', 'slacker', 'mixed'] },
  { name: 'negotiated_peace', ending: 'negotiated_peace', bots: ['diplomat'] },
  {
    name: 'scandal', ending: 'scandal', bots: ['mixed', 'stealthy', 'legal'],
    choose: [/corruption/i, /dossier complet/i],
    force: {
      bot: 'mixed',
      onStep: forceOnce(9, 'actions', { setFlags: ['seen_complaisance', 'bribe_photo', 'corruption_proof', 'press_contacted'] },
        'la photo de l’enveloppe (depuis la fenêtre) et le contact avec la journaliste sont posés au J9'),
    },
  },
  { name: 'custody-bucket', ending: 'custody', bots: ['reckless', 'stealthy'], variant: (f) => (f.has('bucket_witnessed') || f.has('video_viral')) && !f.has('kitchen_sabotage_caught') && !f.has('laxative_caught') },
  {
    name: 'custody-sucree', ending: 'custody', bots: ['reckless', 'stealthy', 'mixed'], variant: (f) => f.has('kitchen_sabotage_caught') && !f.has('laxative_caught'),
    force: {
      bot: 'reckless',
      // Sans informateur : le bot ne peut pas aller jusqu'au laxatif, la variante reste « sucrée »
      onStep: forceOnce(4, 'koddex', { setFlags: ['kitchen_sabotaged', 'kitchen_sabotage_caught'], risk: 95 }, 'le sabotage de la cuisine (sel et sucre) a été vu par Dédé, la nuit du J3'),
    },
  },
  {
    name: 'custody-laxative', ending: 'custody', bots: ['reckless', 'stealthy', 'mixed'], variant: (f) => f.has('laxative_caught'),
    force: {
      bot: 'reckless',
      onStep: chain(
        forceOnce(3, 'actions', { setFlags: ['asked_waiter', 'waiter_bribed', 'waiter_informant', 'met_waiter'] }, 'Théo est devenu l’informateur de Pilou (J3)'),
        forceOnce(4, 'koddex', { setFlags: ['laxative_done', 'laxative_caught'], risk: 95 }, 'la carbonnade laxative a été remontée jusqu’à Pilou, la nuit du J3'),
      ),
    },
  },
  { name: 'moving_out', ending: 'moving_out', bots: ['passive', 'stealthy', 'slacker'] },
  {
    name: 'fired', ending: 'fired', bots: ['slacker', 'reckless', 'stealthy'], noContinue: true,
    force: { bot: 'slacker', onStep: forceOnce(5, 'night', { job: -100 }, 'Stéphane a fait le compte des prompts « perso » : Job à 0 (J5)') },
  },
  {
    name: 'turncoat', ending: 'turncoat', bots: ['mixed', 'slacker', 'legal'], choose: [/habitué/i],
    force: {
      bot: 'mixed', choose: [/habitué/i],
      onStep: chain(
        forceOnce(4, 'actions', { setFlags: ['carbonnade_1'] }, 'Pilou a mangé la carbonnade de l’estaminet (J4)'),
        forceOnce(8, 'actions', { setFlags: ['carbonnade_2'] }, 'il y est retourné (J8)'),
        forceOnce(11, 'actions', { setFlags: ['carbonnade_3'] }, 'troisième fois : Pilou a « sa » table (J11)'),
        forceOnce(14, 'cards', { asso: -100 }, 'l’association a appris pour la carbonnade : elle ne suit plus Pilou (J14)'),
      ),
    },
  },
  {
    name: 'the_return', ending: 'the_return', bots: ['diplomat', 'legal', 'mixed'],
    choose: [/problème à la fois/i, /On verra après/i],
  },
];

export async function run({ tell, ENDING, ROOT }) {
  const dir = join(ROOT, 'qa', 'stories', 'endings');
  mkdirSync(dir, { recursive: true });
  const specs = ENDING === 'all' ? SPECS : SPECS.filter((s) => s.name === ENDING || s.ending === ENDING);
  if (!specs.length) throw new Error(`fin inconnue : ${ENDING} (${SPECS.map((s) => s.name).join(', ')}, all)`);
  const report = [];
  for (const spec of specs) {
    const ok = (r) => r.ending === spec.ending && (!spec.variant || spec.variant(r.flags));
    const found = [];
    const tryRun = (botName, seed, steerWith, method) => {
      const r = tell({ botName, seed, steerWith, title: `${spec.name} (${method})` });
      if (ok(r) && !found.some((x) => x.botName === botName && x.seed === seed)) found.push({ ...r, botName, seed, method });
    };
    const base = spec.noContinue ? { noContinue: true } : null;
    const chooser = spec.choose ? { ...base, choose: pickLabel(spec.choose) } : null;
    for (const [method, steer] of [['naturelle', base], ...(chooser ? [['choix pilotés', chooser]] : [])]) {
      for (let seed = 1; seed <= 20 && found.length < 2; seed++) for (const b of spec.bots) if (found.length < 2) tryRun(b, seed, steer, method);
    }
    if (found.length < 2 && spec.force) {
      const steer = { noContinue: spec.noContinue, onStep: spec.force.onStep, choose: pickLabel(spec.force.choose ?? spec.choose ?? []) };
      for (let seed = 1; seed <= 12 && found.length < 2; seed++) tryRun(spec.force.bot, seed, steer, 'état forcé');
    }
    found.forEach((r, k) => writeFileSync(join(dir, `${spec.name}${k ? '-2' : ''}.md`), r.text));
    report.push({ spec, found });
    console.log(`${spec.name} : ${found.length ? found.map((r) => `${r.botName}#${r.seed} (${r.method})`).join(', ') : 'INTROUVABLE'}`);
  }
  if (ENDING === 'all') {
    const rows = report.map(({ spec, found }) => `| ${spec.name} | ${found.map((r, k) => `[${spec.name}${k ? '-2' : ''}.md](${spec.name}${k ? '-2' : ''}.md) · bot ${r.botName}, graine ${r.seed} · ${r.method}`).join('<br>') || '**introuvable**'} |`);
    writeFileSync(join(dir, 'README.md'), `# Transcriptions par fin\n\nGénérées par \`npm run story -- --ending all\` (scripts/story-endings.js).\n`
      + 'Méthode : « naturelle » = le bot y arrive seul · « choix pilotés » = seuls les choix du joueur sont orientés · '
      + '« état forcé » = drapeaux/stats posés pour le test, visibles dans la transcription (⚙️).\n\n| Fin | Transcriptions |\n|---|---|\n'
      + rows.join('\n') + '\n');
  }
}
