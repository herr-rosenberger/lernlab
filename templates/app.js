// Logik der Simulation. Farben aus dem Theme: getComputedStyle(document.documentElement).getPropertyValue('--accent')
// Formeln in Beschriftungen: LernLab.mathe(element) mit <script src="../js/math.js"></script> in der index.html.
const regler = document.getElementById('p1'), ausgabe = document.getElementById('o1');
regler.addEventListener('input', () => { ausgabe.textContent = regler.value; });
ausgabe.textContent = regler.value;
