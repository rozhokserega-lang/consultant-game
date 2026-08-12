/** Вылазка: фон хаб-парковки (нарисованная текстура). */

const extractHubBgImg = new Image();
let extractHubBgReady = false;
extractHubBgImg.onload = () => { extractHubBgReady = true; };
extractHubBgImg.src = 'assets/extract/hub-parking-bg.jpg';

function isExtractHubBgReady() {
  return extractHubBgReady;
}

function drawExtractHubBg(ctx, w, h) {
  if (!extractHubBgReady) return false;
  ctx.drawImage(extractHubBgImg, 0, 0, w, h);
  return true;
}
