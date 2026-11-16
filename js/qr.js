// QR-Codes ohne Fremddienst. LernLab.qr(element, url) füllt ein Element; Elemente mit [data-qr] bekommen den Code der Seite (nur im Druck sichtbar).
(() => {
  const basis = new URL('../assets/qr/qrcode.js', document.currentScript.src); let geladen;
  const lib = () => geladen || (geladen = new Promise((ok, fehler) => { if (window.qrcode) return ok(); const s = document.createElement('script'); s.src = basis; s.onload = ok; s.onerror = fehler; document.head.append(s); }));
  const fuelle = (el, url) => { const q = qrcode(0, 'M'); q.addData(url); q.make(); el.innerHTML = q.createSvgTag({ scalable: true, margin: 2 }); el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'QR-Code zum Link'); };
  (window.LernLab = window.LernLab || {}).qr = (el, url) => lib().then(() => fuelle(el, url));
  addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-qr]').forEach(el => LernLab.qr(el, location.href.split(/[?#]/)[0].replace(/index\.html$/, ''))));
})();
