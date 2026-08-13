/**
 * Распродажа: спрайт-лист Маши.
 */
'use strict';

const MASHA_ANIM = {"frames":{"run_0":{"x":2,"y":2,"w":76,"h":85},"run_1":{"x":80,"y":2,"w":76,"h":85},"run_2":{"x":158,"y":2,"w":76,"h":85},"run_3":{"x":236,"y":2,"w":75,"h":85},"run_4":{"x":313,"y":2,"w":76,"h":85},"walk_right_0":{"x":2,"y":89,"w":49,"h":85},"walk_right_1":{"x":53,"y":89,"w":49,"h":85},"walk_right_2":{"x":104,"y":89,"w":49,"h":85},"walk_right_3":{"x":155,"y":89,"w":49,"h":85},"walk_right_4":{"x":206,"y":89,"w":49,"h":85},"walk_right_5":{"x":257,"y":89,"w":49,"h":85},"walk_right_6":{"x":308,"y":89,"w":49,"h":85},"walk_down_0":{"x":2,"y":176,"w":61,"h":85},"walk_down_1":{"x":65,"y":176,"w":60,"h":85},"walk_down_2":{"x":127,"y":176,"w":61,"h":85},"walk_down_3":{"x":190,"y":176,"w":61,"h":85},"walk_down_4":{"x":253,"y":176,"w":60,"h":85},"walk_down_5":{"x":315,"y":176,"w":61,"h":85},"walk_up_0":{"x":2,"y":263,"w":40,"h":85},"walk_up_1":{"x":44,"y":263,"w":38,"h":85},"walk_up_2":{"x":84,"y":263,"w":38,"h":85},"walk_up_3":{"x":124,"y":263,"w":38,"h":85},"walk_up_4":{"x":164,"y":263,"w":38,"h":85},"walk_up_5":{"x":204,"y":263,"w":40,"h":85},"atk_punch_0":{"x":2,"y":350,"w":65,"h":85},"atk_punch_1":{"x":69,"y":350,"w":65,"h":85},"atk_punch_2":{"x":136,"y":350,"w":65,"h":85},"atk_punch_3":{"x":203,"y":350,"w":65,"h":85},"atk_punch_4":{"x":270,"y":350,"w":65,"h":85}},"anims":{"run":["run_0","run_1","run_2","run_3","run_4"],"walk_right":["walk_right_0","walk_right_1","walk_right_2","walk_right_3","walk_right_4","walk_right_5","walk_right_6"],"walk_down":["walk_down_0","walk_down_1","walk_down_2","walk_down_3","walk_down_4","walk_down_5"],"walk_up":["walk_up_0","walk_up_1","walk_up_2","walk_up_3","walk_up_4","walk_up_5"],"atk_punch":["atk_punch_0","atk_punch_1","atk_punch_2","atk_punch_3","atk_punch_4"]}};

const mashaAnimImg = new Image();
let mashaAnimReady = false;
mashaAnimImg.onload = () => { mashaAnimReady = true; };
mashaAnimImg.src = 'assets/heroes/masha/atlas.png';

HERO_ANIM_PACKS.masha = {
  id: 'masha',
  frames: MASHA_ANIM.frames,
  anims: MASHA_ANIM.anims,
  img: mashaAnimImg,
  ready() { return mashaAnimReady; },
};
