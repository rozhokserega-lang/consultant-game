/** Пропы арены: банкоматы, тележки, стойки. */

// ── Пропы арен (новый лист объектов) ──
const ARENA_PROP_FRAMES = {"atm":{"x":57,"y":63,"w":36,"h":51},"atm_hd":{"x":205,"y":63,"w":36,"h":51},"barrel_red":{"x":355,"y":70,"w":32,"h":44},"bench":{"x":486,"y":70,"w":65,"h":44},"bench_hd":{"x":634,"y":70,"w":65,"h":44},"box_stack":{"x":786,"y":60,"w":57,"h":54},"cart":{"x":927,"y":66,"w":72,"h":48},"cart_hd":{"x":1075,"y":66,"w":72,"h":48},"checkout":{"x":9,"y":179,"w":132,"h":49},"checkout_hd":{"x":177,"y":139,"w":92,"h":89},"checkout_mall":{"x":305,"y":179,"w":132,"h":49},"checkout_side":{"x":497,"y":141,"w":43,"h":87},"clothes_rack":{"x":594,"y":166,"w":146,"h":62},"clothes_rack_hd":{"x":745,"y":137,"w":139,"h":91},"clothes_rack_mall":{"x":890,"y":166,"w":146,"h":62},"clothes_rack_side":{"x":1088,"y":137,"w":46,"h":91},"clothes_shelves":{"x":19,"y":251,"w":111,"h":91},"fire_box":{"x":209,"y":286,"w":27,"h":56},"fitting_open":{"x":342,"y":254,"w":58,"h":88},"fitting_room":{"x":488,"y":254,"w":61,"h":88},"fold_table":{"x":650,"y":278,"w":34,"h":64},"food_case":{"x":750,"y":257,"w":129,"h":85},"fridge_front":{"x":894,"y":231,"w":138,"h":111},"fridge_side":{"x":1080,"y":230,"w":62,"h":112},"mannequin":{"x":57,"y":399,"w":36,"h":57},"mannequin_hd":{"x":209,"y":366,"w":27,"h":90},"mannequin_mall":{"x":353,"y":399,"w":36,"h":57},"mannequin_side":{"x":504,"y":366,"w":29,"h":90},"map_board":{"x":638,"y":413,"w":58,"h":43},"mirror":{"x":800,"y":389,"w":30,"h":67},"mirror_hd":{"x":948,"y":389,"w":30,"h":67},"plant":{"x":1095,"y":401,"w":32,"h":55},"plant_cone":{"x":62,"y":512,"w":25,"h":58},"plant_round":{"x":207,"y":515,"w":32,"h":55},"sale_pillar":{"x":348,"y":507,"w":45,"h":63},"shelf_front":{"x":454,"y":458,"w":129,"h":112},"shoe_shelf":{"x":622,"y":481,"w":89,"h":89},"sign_dir":{"x":786,"y":527,"w":58,"h":43},"sport_shelf":{"x":902,"y":479,"w":122,"h":91},"sport_shelf_n":{"x":1091,"y":479,"w":39,"h":91},"trash_hd":{"x":48,"y":606,"w":53,"h":78},"veggie_stand":{"x":164,"y":598,"w":117,"h":86},"vending":{"x":352,"y":633,"w":37,"h":51},"vending_hd":{"x":491,"y":595,"w":56,"h":89},"vending_mall":{"x":648,"y":633,"w":37,"h":51},"wet_floor":{"x":787,"y":625,"w":55,"h":59},"wet_floor_hd":{"x":935,"y":625,"w":55,"h":59},"trash":{"x":48,"y":606,"w":53,"h":78}};

const arenaPropImg = new Image();
let arenaPropReady = false;
arenaPropImg.onload = () => { arenaPropReady = true; };
arenaPropImg.src = 'assets/atlases/arena_props_atlas.png';

function drawArenaProp(ctx, name, x, y, opts = {}) {
  const o = Object.assign({ scale: 0.7 }, opts);
  return drawAtlasFrame(ctx, arenaPropImg, arenaPropReady, ARENA_PROP_FRAMES, name, x, y, o);
}
