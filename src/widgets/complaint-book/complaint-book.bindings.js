/** Строки книги жалоб со счётчиками киллов. */

Object.assign(Game.prototype, {
  renderComplaintBook() {
    const list = document.getElementById('hub-book');
    if (!list) return;
    list.innerHTML = '';
    let total = 0;
    for (const entry of COMPLAINT_BOOK) {
      const n = (this.killLog && this.killLog[entry.id]) || 0;
      total += n;
      const el = document.createElement('div');
      el.className = 'book-row' + (n <= 0 ? ' zero' : '') + (entry.boss ? ' boss' : '');
      const ico = document.createElement('div');
      ico.className = 'ico';
      const cv = document.createElement('canvas');
      if (!paintComplaintPortrait(cv, entry)) {
        ico.textContent = entry.ico || '?';
        ico.style.fontSize = entry.boss ? '28px' : '22px';
      } else {
        ico.appendChild(cv);
      }
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = entry.name;
      const cnt = document.createElement('div');
      cnt.className = 'cnt';
      cnt.textContent = String(n);
      el.appendChild(ico);
      el.appendChild(nm);
      el.appendChild(cnt);
      list.appendChild(el);
    }
    const tot = document.getElementById('book-total');
    if (tot) tot.textContent = 'Всего выписано жалоб: ' + total;
  },
});
