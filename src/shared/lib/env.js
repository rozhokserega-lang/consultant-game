/** Определение дев-окружения по адресу страницы. */

function isDevEnvironment() {
  try {
    const h = location.hostname;
    if (!h || h === 'localhost' || h === '127.0.0.1') return true;
    if (/[?&]dev=1(?:&|$)/.test(location.search)) return true;
    const p = location.pathname || '';
    if (/\/dev\/?$/.test(p) || p.includes('/dev/')) return true;
  } catch (_) { /* ignore */ }
  return false;
}
