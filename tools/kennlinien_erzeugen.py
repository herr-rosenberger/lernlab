#!/usr/bin/env python3
"""Erzeugt Kennlinien-Diagramme (SVG) und Aufgaben für lernapps/8/kennlinien-deuten.
Aufruf im Projektordner: python3 tools/kennlinien_erzeugen.py. Lösungen werden aus den Funktionen berechnet."""
import bisect, json
D = 'lernapps/8/kennlinien-deuten/'
INK, BG, GRID, GRID2, A1, A2 = '#1a2436', '#f1f4f8', '#d3dae5', '#9aa6b8', '#4338ca', '#c2410c'
z = lambda v: ('%g' % round(v, 4)).replace('.', ',')

# ---- glatte Kurve durch vorgegebene Punkte (monotone kubische Interpolation, Fritsch-Carlson) ----
def pchip(x, y):
    n = len(x); h = [x[i + 1] - x[i] for i in range(n - 1)]; d = [(y[i + 1] - y[i]) / h[i] for i in range(n - 1)]; m = [0.0] * n
    for i in range(1, n - 1):
        if d[i - 1] * d[i] > 0:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    def ende(h0, h1, d0, d1):
        v = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1)
        if v * d0 <= 0: return 0.0
        if d0 * d1 <= 0 and abs(v) > abs(3 * d0): return 3 * d0
        return v
    m[0] = ende(h[0], h[1], d[0], d[1]); m[-1] = ende(h[-1], h[-2], d[-1], d[-2])
    def f(t):
        i = max(0, min(n - 2, bisect.bisect_right(x, t) - 1)); s = (t - x[i]) / h[i]
        return (2 * s**3 - 3 * s**2 + 1) * y[i] + (s**3 - 2 * s**2 + s) * h[i] * m[i] + (-2 * s**3 + 3 * s**2) * y[i + 1] + (s**3 - s**2) * h[i] * m[i + 1]
    return f

W, H, L, R, T, B = 560, 380, 70, 24, 24, 58
def diagramm(name, xmax, ymax, xs, ys, xm, ym, kurven=(), punkte=(), titel=''):
    """xs/ys: Beschriftungsabstand, xm/ym: kleine Gitterlinien. kurven: [(Funktion, Farbe, gestrichelt, Beschriftung)]; punkte: [(U, I)] als Kreuze"""
    X = lambda v: L + v / xmax * (W - L - R); Y = lambda v: H - B - v / ymax * (H - T - B); p = []
    k = 0
    while k * xm <= xmax + 1e-9: p.append(f'<line x1="{X(k*xm):.1f}" y1="{T}" x2="{X(k*xm):.1f}" y2="{H-B}" stroke="{GRID}" stroke-width="1"/>'); k += 1
    k = 0
    while k * ym <= ymax + 1e-9: p.append(f'<line x1="{L}" y1="{Y(k*ym):.1f}" x2="{W-R}" y2="{Y(k*ym):.1f}" stroke="{GRID}" stroke-width="1"/>'); k += 1
    k = 0
    while k * xs <= xmax + 1e-9:
        p.append(f'<line x1="{X(k*xs):.1f}" y1="{T}" x2="{X(k*xs):.1f}" y2="{H-B}" stroke="{GRID2}" stroke-width="1.3"/><text x="{X(k*xs):.1f}" y="{H-B+20}" text-anchor="middle" font-size="15" fill="{INK}">{z(k*xs)}</text>'); k += 1
    k = 0
    while k * ys <= ymax + 1e-9:
        p.append(f'<line x1="{L}" y1="{Y(k*ys):.1f}" x2="{W-R}" y2="{Y(k*ys):.1f}" stroke="{GRID2}" stroke-width="1.3"/><text x="{L-8}" y="{Y(k*ys)+5:.1f}" text-anchor="end" font-size="15" fill="{INK}">{z(k*ys)}</text>'); k += 1
    p.append(f'<line x1="{L}" y1="{H-B}" x2="{W-R}" y2="{H-B}" stroke="{INK}" stroke-width="2.5"/><line x1="{L}" y1="{T}" x2="{L}" y2="{H-B}" stroke="{INK}" stroke-width="2.5"/>')
    p.append(f'<text x="{(L+W-R)/2:.0f}" y="{H-12}" text-anchor="middle" font-size="16" font-weight="700" fill="{INK}">U in V</text><text x="18" y="{(T+H-B)/2:.0f}" text-anchor="middle" font-size="16" font-weight="700" fill="{INK}" transform="rotate(-90 18 {(T+H-B)/2:.0f})">I in A</text>')
    for f, farbe, gestr, lab in kurven:
        pts = [(X(xmax * i / 300), Y(f(xmax * i / 300))) for i in range(301)]
        p.append(f'<polyline fill="none" stroke="{farbe}" stroke-width="3.2" stroke-linejoin="round"{" stroke-dasharray=\"9 6\"" if gestr else ""} points="{" ".join(f"{a:.1f},{b:.1f}" for a, b in pts)}"/>')
        if lab: ex, ey = X(xmax) - 8, Y(f(xmax)); p.append(f'<circle cx="{ex-14:.0f}" cy="{ey-14:.0f}" r="12" fill="{BG}" stroke="{farbe}" stroke-width="2"/><text x="{ex-14:.0f}" y="{ey-9:.0f}" text-anchor="middle" font-size="15" font-weight="700" fill="{INK}">{lab}</text>')
    for u, i in punkte:
        a, b = X(u), Y(i); p.append(f'<path d="M{a-5:.1f} {b-5:.1f}L{a+5:.1f} {b+5:.1f}M{a-5:.1f} {b+5:.1f}L{a+5:.1f} {b-5:.1f}" stroke="{A1}" stroke-width="2.6" stroke-linecap="round"/>')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img"><title>{titel}</title><rect width="{W}" height="{H}" rx="10" fill="{BG}"/><g font-family="sans-serif">{"".join(p)}</g></svg>'
    open(D + name + '.svg', 'w', encoding='utf-8').write(svg)

# ---- Bauteile ----
ohm = lambda u: u / 25                                   # Bauteil A: 25 Ohm
lampe = pchip([0, 1, 2, 3, 4, 5, 6], [0, 0.03, 0.05, 0.066, 0.08, 0.091, 0.10])   # Bauteil B: gleichmäßig flacher werdend, R = 40 Ohm bei 2 V, 50 Ohm bei 4 V, 60 Ohm bei 6 V
steil = lambda u: 0.004 * u * u                          # Bauteil C: R sinkt mit U
r1f, r2f = (lambda u: u / 20), (lambda u: u / 50)        # zwei Widerstände
mess_o = [(1, 0.026), (2, 0.049), (3, 0.077), (4, 0.101), (5, 0.124), (6, 0.151), (7, 0.172), (8, 0.201), (9, 0.223), (10, 0.252)]   # um I = U/40 gestreut
mess_l = [(0.5, 0.019), (1, 0.031), (2, 0.050), (3, 0.066), (4, 0.079), (5, 0.090), (6, 0.101)]
ALT = {}
def bild(name, alt, text, **kw): diagramm(name, titel=alt, **kw); ALT[name] = (alt, text)
pts = lambda f, us: ', '.join(f'({z(u)} V | {z(f(u))} A)' for u in us)
bild('bauteil_a', 'Kennlinie von Bauteil A im I-U-Diagramm. Waagerecht U in V von 0 bis 10, senkrecht I in A von 0 bis 0,5.',
     'Die Kennlinie von Bauteil A verläuft durch die Punkte ' + pts(ohm, [0, 2, 4, 6, 8, 10]) + '.', xmax=10, ymax=0.5, xs=2, ys=0.1, xm=1, ym=0.05, kurven=[(ohm, A1, False, '')])
bild('bauteil_b', 'Kennlinie von Bauteil B im I-U-Diagramm. Waagerecht U in V von 0 bis 6, senkrecht I in A von 0 bis 0,12.',
     'Die Kennlinie von Bauteil B verläuft durch die Punkte ' + pts(lampe, [0, 1, 2, 3, 4, 5, 6]) + '.', xmax=6, ymax=0.12, xs=1, ys=0.02, xm=0.5, ym=0.01, kurven=[(lampe, A1, False, '')])
bild('bauteil_c', 'Kennlinie von Bauteil C im I-U-Diagramm. Waagerecht U in V von 0 bis 10, senkrecht I in A von 0 bis 0,5.',
     'Die Kennlinie von Bauteil C verläuft durch die Punkte ' + pts(steil, [0, 2, 4, 5, 6, 8, 10]) + '.', xmax=10, ymax=0.5, xs=2, ys=0.1, xm=1, ym=0.05, kurven=[(steil, A1, False, '')])
bild('zwei_widerstaende', 'Zwei Kennlinien, 1 (durchgezogen) und 2 (gestrichelt), im I-U-Diagramm. Waagerecht U in V von 0 bis 10, senkrecht I in A von 0 bis 0,5.',
     'Kennlinie 1 verläuft durch ' + pts(r1f, [0, 4, 8, 10]) + '. Kennlinie 2 verläuft durch ' + pts(r2f, [0, 5, 10]) + '.', xmax=10, ymax=0.5, xs=2, ys=0.1, xm=1, ym=0.05, kurven=[(r1f, A1, False, '1'), (r2f, A2, True, '2')])
bild('messpunkte_a', 'Messpunkte eines Bauteils im I-U-Diagramm. Waagerecht U in V von 0 bis 10, senkrecht I in A von 0 bis 0,3.',
     'Die Messpunkte (U | I) sind: ' + ', '.join(f'({z(u)} V | {z(i)} A)' for u, i in mess_o) + '.', xmax=10, ymax=0.3, xs=2, ys=0.05, xm=1, ym=0.025, punkte=mess_o)
bild('messpunkte_b', 'Messpunkte eines Bauteils im I-U-Diagramm. Waagerecht U in V von 0 bis 6, senkrecht I in A von 0 bis 0,12.',
     'Die Messpunkte (U | I) sind: ' + ', '.join(f'({z(u)} V | {z(i)} A)' for u, i in mess_l) + '.', xmax=6, ymax=0.12, xs=1, ys=0.02, xm=0.5, ym=0.01, punkte=mess_l)
# ---- Aufgaben ----
def Z(id, frage, wert, einheit, name, erk, hint=None, tol=0.01):
    t = {'id': id, 'typ': 'zahl', 'frage': frage, 'richtig': round(wert, 6), 'toleranz': tol, 'einheit': einheit, 'erklaerung': erk}
    if name: t['bild'], t['bildAlt'], t['bildText'] = name + '.svg', ALT[name][0], ALT[name][1]
    if hint: t['hinweis'] = hint
    return t
def K(id, frage, opts, erk, name=None, hint=None):
    t = {'id': id, 'typ': 'auswahl', 'frage': frage, 'optionen': opts, 'richtig': 0, 'erklaerung': erk}
    if name: t['bild'], t['bildAlt'], t['bildText'] = name + '.svg', ALT[name][0], ALT[name][1]
    if hint: t['hinweis'] = hint
    return t
KAESTCHEN = 'Ein kleines Kästchen entspricht waagerecht {u} und senkrecht {i}.'
k10 = KAESTCHEN.format(u='1 V', i='0,05 A'); k6 = KAESTCHEN.format(u='0,5 V', i='0,01 A')
t = [
 K('f1', 'Was zeigt die Kennlinie von Bauteil A?', ['Einen ohmschen Widerstand: I ist proportional zu U.', 'Einen Widerstand, der bei hoher Spannung größer wird.', 'Eine Glühlampe.', 'Ein Bauteil, durch das erst ab einer bestimmten Spannung Strom fließt.'], 'Die Kennlinie ist eine Gerade durch den Ursprung. Verdoppelt man $U$, verdoppelt sich $I$. Der Quotient $R=\\dfrac{U}{I}$ ist konstant.', 'bauteil_a'),
 K('f2', 'Was zeigt die Kennlinie von Bauteil B?', ['Ein Bauteil, dessen Widerstand mit wachsender Spannung zunimmt.', 'Einen ohmschen Widerstand.', 'Ein Bauteil, dessen Widerstand mit wachsender Spannung abnimmt.', 'Ein Bauteil ohne Widerstand.'], 'Die Kennlinie ist keine Gerade und wird flacher: $I$ wächst langsamer als $U$, also wächst $R=\\dfrac{U}{I}$. So verhält sich zum Beispiel eine Glühlampe, deren Glühfaden mit steigender Spannung heißer wird.', 'bauteil_b'),
 K('f3', 'Was zeigt die Kennlinie von Bauteil C?', ['Ein Bauteil, dessen Widerstand mit wachsender Spannung abnimmt.', 'Einen ohmschen Widerstand.', 'Ein Bauteil, dessen Widerstand mit wachsender Spannung zunimmt.', 'Ein Bauteil, durch das nie Strom fließt.'], 'Die Kennlinie wird steiler: $I$ wächst schneller als $U$, also sinkt $R=\\dfrac{U}{I}$. Das Bauteil ist kein ohmscher Widerstand.', 'bauteil_c'),
 K('f4', 'Die Messpunkte liegen nicht exakt auf einer Geraden. Was lässt sich trotzdem sagen?', ['Die Punkte liegen nahe an einer Geraden durch den Ursprung. Die kleinen Abweichungen sind Messungenauigkeiten, es ist ein ohmscher Widerstand.', 'Es ist kein ohmscher Widerstand, weil die Punkte nicht genau auf einer Linie liegen.', 'Es ist eine Glühlampe.', 'Man kann aus den Messpunkten nichts schließen.'], 'Jede Messung hat kleine Abweichungen. Entscheidend ist der Gesamtverlauf: Die Punkte folgen einer Ursprungsgeraden.', 'messpunkte_a'),
 K('f5', 'Wie verlaufen die Messpunkte, und was bedeutet das?', ['Sie folgen einer Kurve, die flacher wird. Das Bauteil ist kein ohmscher Widerstand.', 'Sie folgen einer Geraden durch den Ursprung. Das Bauteil ist ein ohmscher Widerstand.', 'Sie folgen einer Kurve, die steiler wird. Der Widerstand wird kleiner.', 'Sie liegen alle auf einer waagerechten Linie.'], 'Die Stromstärke wächst langsamer als die Spannung, der Quotient $\\dfrac{U}{I}$ wird größer. Das ist typisch für eine Glühlampe.', 'messpunkte_b'),
 Z('a1', 'Wie groß ist die Stromstärke von Bauteil A bei $6\\,\\mathrm{V}$? Gib sie in A an.', ohm(6), 'A', 'bauteil_a', 'Man liest an der Kennlinie bei $6\\,\\mathrm{V}$ den Wert $0{,}24\\,\\mathrm{A}$ ab.', k10 + ' Gehe von 6 V senkrecht nach oben bis zur Kennlinie.'),
 Z('a2', 'Bei welcher Spannung fließen durch Bauteil A $0{,}3\\,\\mathrm{A}$? Gib sie in V an.', 7.5, 'V', 'bauteil_a', 'Bei $0{,}3\\,\\mathrm{A}$ liest man waagerecht $7{,}5\\,\\mathrm{V}$ ab.', k10, 0.3),
 Z('a3', 'Wie groß ist die Stromstärke von Bauteil B bei $4\\,\\mathrm{V}$? Gib sie in A an.', 0.08, 'A', 'bauteil_b', 'Bei $4\\,\\mathrm{V}$ liest man $0{,}08\\,\\mathrm{A}$ ab.', k6, 0.005),
 Z('a4', 'Bei welcher Spannung fließen durch Bauteil B $0{,}05\\,\\mathrm{A}$? Gib sie in V an.', 2, 'V', 'bauteil_b', 'Bei $0{,}05\\,\\mathrm{A}$ liest man waagerecht $2\\,\\mathrm{V}$ ab.', k6, 0.2),
 Z('a5', 'Wie groß ist bei $10\\,\\mathrm{V}$ die Stromstärke bei Kennlinie 1? Gib sie in A an.', r1f(10), 'A', 'zwei_widerstaende', 'Die durchgezogene Kennlinie 1 liegt bei $10\\,\\mathrm{V}$ bei $0{,}5\\,\\mathrm{A}$.', k10),
 Z('a6', 'Wie groß ist bei $10\\,\\mathrm{V}$ die Stromstärke bei Kennlinie 2? Gib sie in A an.', r2f(10), 'A', 'zwei_widerstaende', 'Die gestrichelte Kennlinie 2 liegt bei $10\\,\\mathrm{V}$ bei $0{,}2\\,\\mathrm{A}$.', k10),
 Z('r1', 'Berechne den Widerstand von Bauteil A aus dem Wert bei $10\\,\\mathrm{V}$. Gib ihn in $\\Omega$ an.', 25, 'Ω', 'bauteil_a', '$R=\\dfrac{U}{I}=\\dfrac{10\\,\\mathrm{V}}{0{,}4\\,\\mathrm{A}}=25\\,\\Omega$', 'Lies zuerst bei $10\\,\\mathrm{V}$ die Stromstärke ab. ' + k10, 1),
 Z('r2', 'Berechne den Widerstand von Bauteil B bei $2\\,\\mathrm{V}$. Gib ihn in $\\Omega$ an.', 40, 'Ω', 'bauteil_b', '$R=\\dfrac{U}{I}=\\dfrac{2\\,\\mathrm{V}}{0{,}05\\,\\mathrm{A}}=40\\,\\Omega$', 'Lies bei $2\\,\\mathrm{V}$ die Stromstärke ab. ' + k6, 2),
 Z('r3', 'Berechne den Widerstand von Bauteil B bei $6\\,\\mathrm{V}$. Gib ihn in $\\Omega$ an.', 60, 'Ω', 'bauteil_b', '$R=\\dfrac{U}{I}=\\dfrac{6\\,\\mathrm{V}}{0{,}1\\,\\mathrm{A}}=60\\,\\Omega$', k6, 2),
 K('r4', 'Vergleiche den Widerstand von Bauteil B bei $2\\,\\mathrm{V}$ und bei $6\\,\\mathrm{V}$. Was stellst du fest?', ['Bei $6\\,\\mathrm{V}$ ist der Widerstand größer als bei $2\\,\\mathrm{V}$.', 'Der Widerstand ist bei beiden Spannungen gleich groß.', 'Bei $6\\,\\mathrm{V}$ ist der Widerstand kleiner als bei $2\\,\\mathrm{V}$.', 'Das lässt sich nicht vergleichen.'], 'Bei $2\\,\\mathrm{V}$ ist $R=40\\,\\Omega$, bei $6\\,\\mathrm{V}$ ist $R=60\\,\\Omega$. Der Widerstand wächst mit der Spannung, das Bauteil ist nicht ohmsch.', 'bauteil_b'),
 Z('r5', 'Berechne den Widerstand von Bauteil C bei $5\\,\\mathrm{V}$. Gib ihn in $\\Omega$ an.', 50, 'Ω', 'bauteil_c', '$R=\\dfrac{U}{I}=\\dfrac{5\\,\\mathrm{V}}{0{,}1\\,\\mathrm{A}}=50\\,\\Omega$', k10, 2),
 Z('r6', 'Berechne den Widerstand von Bauteil C bei $10\\,\\mathrm{V}$. Gib ihn in $\\Omega$ an.', 25, 'Ω', 'bauteil_c', '$R=\\dfrac{U}{I}=\\dfrac{10\\,\\mathrm{V}}{0{,}4\\,\\mathrm{A}}=25\\,\\Omega$. Bei $5\\,\\mathrm{V}$ waren es $50\\,\\Omega$: Der Widerstand sinkt mit wachsender Spannung.', k10, 1),
 Z('r7', 'Berechne den Widerstand von Bauteil 1 (durchgezogen) aus dem Wert bei $10\\,\\mathrm{V}$. Gib ihn in $\\Omega$ an.', 20, 'Ω', 'zwei_widerstaende', '$R_1=\\dfrac{U}{I}=\\dfrac{10\\,\\mathrm{V}}{0{,}5\\,\\mathrm{A}}=20\\,\\Omega$', k10, 1),
 Z('r8', 'Berechne den Widerstand von Bauteil 2 (gestrichelt) aus dem Wert bei $10\\,\\mathrm{V}$. Gib ihn in $\\Omega$ an.', 50, 'Ω', 'zwei_widerstaende', '$R_2=\\dfrac{U}{I}=\\dfrac{10\\,\\mathrm{V}}{0{,}2\\,\\mathrm{A}}=50\\,\\Omega$', k10, 2),
 Z('r9', 'Schätze den Widerstand des Bauteils aus den Messpunkten. Gib ihn in $\\Omega$ an.', 40, 'Ω', 'messpunkte_a', 'Die Punkte liegen nahe an der Ursprungsgeraden durch $(8\\,\\mathrm{V}\\,|\\,0{,}2\\,\\mathrm{A})$. Daraus folgt $R=\\dfrac{8\\,\\mathrm{V}}{0{,}2\\,\\mathrm{A}}=40\\,\\Omega$. Einzelne Punkte weichen etwas ab, deshalb ist das ein Schätzwert.', 'Wähle einen Punkt, der gut auf der Geraden liegt, oder lege die Gerade gedanklich durch den Ursprung.', 3),
 K('v1', 'Welche der beiden Kennlinien gehört zum Bauteil mit dem größeren Widerstand?', ['Kennlinie 2 (gestrichelt): Bei gleicher Spannung fließt weniger Strom.', 'Kennlinie 1 (durchgezogen): Sie ist steiler.', 'Beide, denn die Widerstände sind gleich.', 'Das lässt sich nur mit einer dritten Kennlinie sagen.'], 'Bei gleicher Spannung fließt durch Bauteil 2 weniger Strom, also ist sein Widerstand größer. Je flacher die Kennlinie, desto größer der Widerstand.', 'zwei_widerstaende'),
 K('c1', 'Die Kennlinie eines Bauteils ist eine Gerade durch den Ursprung. Was folgt daraus?', ['$I$ ist proportional zu $U$, und der Quotient $R=\\dfrac{U}{I}$ ist konstant.', '$I$ ist konstant, egal wie groß $U$ ist.', 'Der Widerstand wächst mit der Spannung.', 'Das Bauteil ist eine Glühlampe.'], 'So ist ein ohmscher Widerstand definiert: Das Verhältnis aus Spannung und Stromstärke bleibt gleich.'),
 Z('c2', 'Durch einen ohmschen Widerstand fließen bei $3\\,\\mathrm{V}$ genau $0{,}06\\,\\mathrm{A}$. Welche Stromstärke fließt bei $9\\,\\mathrm{V}$? Gib sie in A an.', 0.18, 'A', None, 'Die Spannung wird verdreifacht, also auch die Stromstärke: $I=3\\cdot0{,}06\\,\\mathrm{A}=0{,}18\\,\\mathrm{A}$.', 'Bei einem ohmschen Widerstand ist $I$ proportional zu $U$.', 0.005),
 K('c3', 'Warum ist die Kennlinie einer Glühlampe keine Gerade?', ['Der Glühfaden wird mit steigender Spannung heißer, und sein Widerstand wächst.', 'Die Spannungsquelle wird bei höherer Spannung schwächer.', 'Die Lampe verbraucht den Strom.', 'Die Messgeräte verfälschen die Werte.'], 'Mit der Temperatur nimmt der Widerstand des Glühfadens zu. Deshalb wächst $I$ langsamer als $U$.'),
 K('c4', 'Jemand sagt: „Der Widerstand dieser Glühlampe beträgt $60\\,\\Omega$.“ Warum ist diese Aussage unvollständig?', ['Der Widerstand hängt von der Spannung ab. Die $60\\,\\Omega$ gelten nur bei einer bestimmten Spannung.', 'Der Widerstand einer Lampe lässt sich nicht berechnen.', 'Eine Lampe hat überhaupt keinen Widerstand.', 'Der Widerstand ist immer größer als $100\\,\\Omega$.'], 'Bei einem nicht-ohmschen Bauteil gibt es keinen festen Widerstandswert. Man muss dazusagen, bei welcher Spannung $R=\\dfrac{U}{I}$ berechnet wurde.'),
 K('c5', 'Bei einem Bauteil fließen bei $2\\,\\mathrm{V}$ genau $0{,}04\\,\\mathrm{A}$ und bei $4\\,\\mathrm{V}$ genau $0{,}10\\,\\mathrm{A}$. Ist es ein ohmscher Widerstand?', ['Nein: Bei $2\\,\\mathrm{V}$ ist $R=50\\,\\Omega$, bei $4\\,\\mathrm{V}$ nur $40\\,\\Omega$. Der Widerstand ist nicht konstant.', 'Ja, denn die Stromstärke wird größer, wenn die Spannung größer wird.', 'Ja, denn $R$ ist beide Male gleich groß.', 'Nein, weil die Stromstärke zu klein ist.'], '$\\dfrac{2\\,\\mathrm{V}}{0{,}04\\,\\mathrm{A}}=50\\,\\Omega$ und $\\dfrac{4\\,\\mathrm{V}}{0{,}10\\,\\mathrm{A}}=40\\,\\Omega$. Bei einem ohmschen Widerstand müssten beide Werte gleich sein. Dass $I$ mit $U$ wächst, reicht dafür nicht.'),
]
json.dump({'aufgaben': t}, open(D + 'aufgaben.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(t), 'Aufgaben,', len(ALT), 'Diagramme')
