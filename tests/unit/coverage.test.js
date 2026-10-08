// Couverture du contenu (§13.F/G) : chaque ACTION, EVENT, COUNTERMOVE et ENDING doit être atteint par au moins une
// campagne seedée jouée par les 6 bots (même mesure que « Jamais atteint » de `npm run sim`).
// Un id encore jamais atteint est un test.todo (listé en sortie) : c'est la cible de l'agent d'équilibrage.
// COVERAGE_RUNS=n pour plus de graines (défaut 12 par bot).
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeContent, runCampaign, CAMPAIGN_BOTS } from '../../src/sim/index.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
const RUNS = Number(process.env.COVERAGE_RUNS ?? 12);

const used = { actions: new Map(), events: new Map(), countermoves: new Map(), endings: new Map() };
for (const name of Object.keys(CAMPAIGN_BOTS)) {
  for (let seed = 1; seed <= RUNS; seed++) {
    const { c } = runCampaign({ seed, content: K, bot: CAMPAIGN_BOTS[name]() });
    const S = c.state;
    for (const k of ['actions', 'events', 'countermoves']) {
      for (const id of Object.keys(S.counts[k] ?? {})) if (!used[k].has(id)) used[k].set(id, `${name}#${seed}`);
    }
    if (S.ending?.id && !used.endings.has(S.ending.id)) used.endings.set(S.ending.id, `${name}#${seed}`);
  }
}

const KINDS = { actions: K.ACTIONS, events: K.EVENTS, countermoves: K.COUNTERMOVES, endings: K.ENDINGS };
const unreached = Object.fromEntries(Object.entries(KINDS).map(([k, list]) => [k, list.map((x) => x.id).filter((id) => !used[k].has(id))]));
const total = Object.values(KINDS).reduce((s, l) => s + l.length, 0);
const missing = Object.values(unreached).reduce((s, l) => s + l.length, 0);
const REPORT = (`\nCouverture du contenu : ${total - missing}/${total} ids atteints (${Object.keys(CAMPAIGN_BOTS).length} bots × ${RUNS} graines).`
  + `${missing ? `\nJamais atteint (cible de l'équilibrage) :\n${Object.entries(unreached).filter(([, l]) => l.length).map(([k, l]) => `  ${k} (${l.length}/${KINDS[k].length}) : ${l.join(', ')}`).join('\n')}` : ''}\n`);

describe('couverture du contenu par les bots de campagne', () => {
  it('le contenu est chargé (rapport « jamais atteint » imprimé)', () => {
    for (const list of Object.values(KINDS)) expect(list.length).toBeGreaterThan(0);
    process.stderr.write(REPORT);
  });
  for (const [k, list] of Object.entries(KINDS)) {
    describe(k, () => {
      for (const { id } of list) {
        if (used[k].has(id)) it(`${id} (${used[k].get(id)})`, () => expect(used[k].has(id)).toBe(true));
        else it.todo(`${id} : jamais atteint par les bots`);
      }
    });
  }
});
