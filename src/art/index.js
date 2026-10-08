// API de l'art pour le gameplay (le build agent branche les appels). Documentation : src/art/README.md.
//   import { art } from './art/index.js'   (rempli par buildWorld) — ou world.art
//   art.fx.splash(pos) · art.props.place('banner', 'balconyRail') · art.anim.play('klaas', 'binoculars')
//   art.portrait('klaas', 'happy') → dataURL · art.scenes.koddex() → { scene, camera, update }
import { onFrame } from './rig.js';
import { CAST_IDS, EXPRESSIONS } from './characters.js';
import { createFx } from './fx.js';
import { createProps } from './propkit.js';
import { createDirector } from './anim.js';
import { perfHud } from './perf.js';
import { createWeather } from './weather.js';
import { audio } from '../audio/index.js';
import { portrait, portraitIds, portraitExpressions } from './portraits.js';
import { scenes } from './scenes.js';

// portrait et scenes marchent sans la rue (phases de jour) : disponibles dès l'import
export const art = { portrait, portraitIds, portraitExpressions, scenes, audio };

export function attachArt(scene, world) {
  let director = null;
  const fx = createFx(scene, world, { onFrame, audio, react: (...a) => director?.react(...a) });
  const props = createProps(scene, world, { onFrame });
  director = createDirector(scene, world, { onFrame, audio, fx, props });
  Object.assign(art, {
    world,
    fx,
    props,
    anim: director,
    cast: {
      ids: CAST_IDS,
      get: director.get,
      spawn: director.spawn,
      // Agent de police prêt à patrouiller (à vélo le samedi) : remplace person(0x1b2847)
      officer: (id = 'lemaire', { bike = false, at = null } = {}) => {
        const p = director.spawn(id, { at });
        if (bike) director.patrol(p, { bike: true, path: [p.position.clone()] });
        return p;
      },
    },
    weather: createWeather(scene, world, { onFrame, fx }),
    terrace: { parasols: director.parasols, collapse: director.collapse, rush: director.rush, film: director.film },
    expressions: Object.keys(EXPRESSIONS),
    audio,
    perf: perfHud(),
  });
  return art;
}
