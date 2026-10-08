// Garde-fous d'équilibrage (§13.F) : des chemins vers une fin qui ont déjà cassé sans que personne ne le voie.
// Les taux exacts se mesurent avec `npm run sim -- --runs 1000` (qa/balance.md) ; ici, quelques graines fixes.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeContent, runCampaign, CAMPAIGN_BOTS } from '../../src/sim/index.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
const share = (bot, ending, seeds) => {
  let n = 0;
  for (let seed = 1; seed <= seeds; seed++) if (runCampaign({ seed, content: K, bot: CAMPAIGN_BOTS[bot]() }).c.state.ending?.id === ending) n++;
  return n / seeds;
};

describe('équilibrage : chemins vers les fins', () => {
  // Le tire-au-flanc (projets perso, sieste, travail minimal) doit pouvoir se faire virer (§13.F : ≥ 2 % de ses parties)
  it('licencié : le tire-au-flanc se fait virer (≥ 2 % sur 30 graines)', { timeout: 30_000 }, () => {
    expect(share('slacker', 'fired', 30)).toBeGreaterThanOrEqual(0.02);
  });
});
