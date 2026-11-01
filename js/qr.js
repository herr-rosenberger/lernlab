// Füllt jedes Element mit [data-qr] mit einem QR-Code zur Adresse der Seite (ohne Suchparameter). Sichtbar nur im Druck.
(() => {
  const basis = new URL('../assets/qr/qrcode.js', document.currentScript.src);
  addEventListener('DOMContentLoaded', () => {
    const ziele = document.querySelectorAll('[data-qr]'); if (!ziele.length) return;
    const s = document.createElement('script'); s.src = basis;
    s.onload = () => ziele.forEach(el => {
      const q = qrcode(0, 'M'); q.addData(location.origin + location.pathname); q.make();
      el.innerHTML = q.createSvgTag({ scalable: true, margin: 2 }); el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'QR-Code zu dieser Seite');
    });
    document.head.append(s);
  });
})();
