/** Сохранение прогресса в localStorage. */

const STORAGE_KEY = 'consultant_v2';

function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}
function saveSave(data) {
  try {
    if (!data || typeof data !== 'object') return false;
    const json = JSON.stringify(data);
    if (!json || json === '{}') return false;
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (e) {
    console.error('saveSave failed:', e);
    if (typeof showCrashOverlay === 'function') {
      showCrashOverlay(e, 'Не удалось сохранить прогресс');
    }
    return false;
  }
}
