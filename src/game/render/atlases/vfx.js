/** Боевые эффекты: попадания, взрывы, искры. */

const VFX_FRAMES = {"fx_hit_blood":{"x":812,"y":226,"w":74,"h":56},"fx_hit_spark":{"x":430,"y":246,"w":50,"h":36},"fx_slash":{"x":496,"y":246,"w":52,"h":30},"fx_bolt":{"x":572,"y":250,"w":54,"h":24},"fx_blood":{"x":938,"y":234,"w":54,"h":42},"fx_medkit":{"x":257,"y":244,"w":37,"h":42},"fx_potion":{"x":308,"y":242,"w":26,"h":44},"fx_skull":{"x":786,"y":303,"w":45,"h":49},"fx_void_orb":{"x":848,"y":296,"w":70,"h":61},"fx_smoke":{"x":522,"y":312,"w":78,"h":35},"fx_aura_gold":{"x":256,"y":394,"w":42,"h":54},"fx_aura_dark":{"x":310,"y":386,"w":52,"h":63},"fx_tornado":{"x":634,"y":388,"w":66,"h":64},"fx_shield":{"x":80,"y":396,"w":48,"h":50},"fx_aoe_fire":{"x":422,"y":404,"w":90,"h":50},"fx_aoe_ice":{"x":528,"y":412,"w":92,"h":42},"fx_aoe_void":{"x":716,"y":404,"w":90,"h":50},"fx_aoe_rune":{"x":918,"y":403,"w":94,"h":53},"fx_boom1":{"x":740,"y":478,"w":81,"h":76},"fx_boom2":{"x":836,"y":478,"w":92,"h":78},"fx_boom3":{"x":939,"y":482,"w":75,"h":72},"fx_boom4":{"x":476,"y":496,"w":76,"h":54},"fx_boom5":{"x":565,"y":488,"w":74,"h":66},"fx_boom6":{"x":654,"y":487,"w":78,"h":68},"fx_crystal":{"x":957,"y":594,"w":43,"h":60},"fx_levelup":{"x":373,"y":637,"w":39,"h":29},"fx_chest":{"x":425,"y":599,"w":59,"h":54}};
const VFX_BOOM_FRAMES = ['fx_boom1','fx_boom2','fx_boom3','fx_boom4','fx_boom5','fx_boom6'];
const vfxImg = new Image();
let vfxReady = false;
vfxImg.onload = () => { vfxReady = true; };
vfxImg.src = 'assets/atlases/vfx_atlas.png';

function drawVfx(ctx, name, x, y, opts = {}) {
  return drawAtlasFrame(ctx, vfxImg, vfxReady, VFX_FRAMES, name, x, y, opts);
}
