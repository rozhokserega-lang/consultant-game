/** Витрины магазинов вдоль верхней стены. */

const STOREFRONT_FRAMES = {"store_tech":{"x":7,"y":2,"w":94,"h":91},"store_clothes":{"x":111,"y":16,"w":100,"h":77},"store_food":{"x":216,"y":16,"w":105,"h":77},"store_sport":{"x":324,"y":16,"w":102,"h":77}};
const storefrontImg = new Image();
let storefrontReady = false;
storefrontImg.onload = () => { storefrontReady = true; };
storefrontImg.src = 'assets/atlases/storefront_atlas.png';

function drawStorefrontSprite(ctx, name, x, y, opts = {}) {
  if (drawAtlasFrame(ctx, storefrontImg, storefrontReady, STOREFRONT_FRAMES, name, x, y, opts)) return true;
  return drawSprite(ctx, name, x, y, opts);
}
