#!/usr/bin/env python3
"""Erzeugt die Schaltbilder (SVG) und Aufgaben für lernapps/8/schaltungen-berechnen und lernapps/8/schaltungen-vorhersagen.
Aufruf im Projektordner: python3 tools/schaltungen_erzeugen.py   (Ergebnisse werden aus den Schaltungswerten berechnet, nicht von Hand getippt)"""
import json, os, re
INK, BG = '#1a2436', '#f1f4f8'
SUB = '₀₁₂₃'
HALF = {'R': 27, 'L': 17, 'S': 18}

class C:
    def __init__(s, w=480, h=220): s.w, s.h, s.b = w, h, []
    def line(s, x1, y1, x2, y2): s.b.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>')
    def dot(s, x, y): s.b.append(f'<circle cx="{x}" cy="{y}" r="3.5" fill="{INK}"/>')
    def text(s, x, y, t, a='middle'): s.b.append(f'<text x="{x}" y="{y}" text-anchor="{a}" font-size="15" fill="{INK}" stroke="none">{t}</text>')
    def item(s, k, lab, cx, cy, vert):
        if k == 'R':
            s.b.append(f'<rect x="{cx-11 if vert else cx-27}" y="{cy-27 if vert else cy-11}" width="{22 if vert else 54}" height="{54 if vert else 22}" fill="{BG}"/>')
        elif k == 'L':
            s.b.append(f'<circle cx="{cx}" cy="{cy}" r="17" fill="{BG}"/><path d="M{cx-12} {cy-12}L{cx+12} {cy+12}M{cx+12} {cy-12}L{cx-12} {cy+12}"/>')
        else:
            if vert: s.b.append(f'<circle cx="{cx}" cy="{cy-18}" r="3" fill="{INK}"/><circle cx="{cx}" cy="{cy+18}" r="3" fill="{INK}"/><line x1="{cx}" y1="{cy+18}" x2="{cx-17}" y2="{cy-14}"/>')
            else: s.b.append(f'<circle cx="{cx-18}" cy="{cy}" r="3" fill="{INK}"/><circle cx="{cx+18}" cy="{cy}" r="3" fill="{INK}"/><line x1="{cx-18}" y1="{cy}" x2="{cx+14}" y2="{cy-17}"/>')
        if lab: s.text(cx + 24, cy + 5, lab, 'start') if vert else s.text(cx, cy - (26 if k != 'R' else 18), lab)
    def run(s, a, b, fixed, items, vert):  # Leitung mit Bauteilen entlang einer Strecke
        cur = a
        for k, lab, p in items:
            h = HALF[k]
            (s.line(fixed, cur, fixed, p - h) if vert else s.line(cur, fixed, p - h, fixed)); cur = p + h
            s.item(k, lab, fixed if vert else p, p if vert else fixed, vert)
        (s.line(fixed, cur, fixed, b) if vert else s.line(cur, fixed, b, fixed))
    def svg(s, title, extra=''):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s.w} {s.h}" role="img"><title>{title}</title><rect width="{s.w}" height="{s.h}" rx="10" fill="{BG}"/>'
                f'<g fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" font-family="sans-serif">{"".join(s.b)}{extra}</g></svg>')

def circuit(top, branches, ulabel, w=480, extra=None):
    """top: [(Art, Beschriftung, x)] auf der oberen Leitung; branches: [(x, [(Art, Beschriftung)])]; Art R, L oder S"""
    c = C(w); T, B, X0 = 50, 170, 44; xr = branches[-1][0]
    c.run(X0, xr, T, top, False); c.line(X0, B, xr, B)
    for i, (x, items) in enumerate(branches):
        n = len(items); pos = [(k, l, T + 120 * (j + 1) // (n + 1)) for j, (k, l) in enumerate(items)]
        c.run(T, B, x, pos, True)
        if i < len(branches) - 1: c.dot(x, T); c.dot(x, B)
    cy = (T + B) // 2  # Spannungsquelle links
    c.line(X0, T, X0, cy - 10); c.line(X0, cy + 10, X0, B)
    c.line(X0 - 14, cy - 10, X0 + 14, cy - 10); c.b.append(f'<line x1="{X0-8}" y1="{cy+10}" x2="{X0+8}" y2="{cy+10}" stroke-width="5"/>')
    c.text(X0 - 26, cy - 5, '+', 'end'); c.text(X0 + 26, cy + 5, ulabel, 'start')
    c.b.append(f'<path d="M88 44L102 50L88 56Z" fill="{INK}"/>')  # technische Stromrichtung
    if extra: extra(c)
    return c

def schreibe(pfad, c, titel):
    open(pfad, 'w', encoding='utf-8').write(c.svg(titel))

def N(v): return ('%g' % round(v, 4)).replace('.', '{,}')
def T(s, **k):
    for key, v in k.items(): s = s.replace('@' + key + '@', N(v))
    return s
def A(v): return round(v, 6)

# ================= L5: Schaltungen berechnen und erklären =================
d5 = 'lernapps/8/schaltungen-berechnen/'
R = lambda i, v: f'R{SUB[i]} = {v} Ω'
imgs5 = {}
def bild5(name, c, alt): schreibe(d5 + name + '.svg', c, alt); imgs5[name] = alt
# Reihe 2
U, r1, r2 = 12, 20, 40
bild5('reihe2', circuit([('R', R(1, r1), 176), ('R', R(2, r2), 308)], [(440, [])], f'U = {U} V'), f'Reihenschaltung: Spannungsquelle mit {U} V, dahinter in Reihe R1 = {r1} Ohm und R2 = {r2} Ohm.')
rg2 = r1 + r2; i2 = U / rg2
# Reihe 3
U3, a, b, c3 = 9, 10, 20, 30
bild5('reihe3', circuit([('R', R(1, a), 143), ('R', R(2, b), 242), ('R', R(3, c3), 341)], [(440, [])], f'U = {U3} V'), f'Reihenschaltung: Spannungsquelle mit {U3} V, dahinter in Reihe R1 = {a} Ohm, R2 = {b} Ohm und R3 = {c3} Ohm.')
rg3 = a + b + c3; i3 = U3 / rg3
# Parallel 2
Up, p1, p2 = 12, 30, 60
bild5('parallel2', circuit([], [(230, [('R', R(1, p1))]), (400, [('R', R(2, p2))])], f'U = {Up} V', 520), f'Parallelschaltung: Spannungsquelle mit {Up} V, daran parallel R1 = {p1} Ohm und R2 = {p2} Ohm.')
ip1, ip2 = Up / p1, Up / p2; ipg = ip1 + ip2
# Parallel 3
Uq, q1, q2, q3 = 6, 20, 30, 60
bild5('parallel3', circuit([], [(180, [('R', R(1, q1))]), (300, [('R', R(2, q2))]), (420, [('R', R(3, q3))])], f'U = {Uq} V', 560), f'Parallelschaltung: Spannungsquelle mit {Uq} V, daran parallel R1 = {q1} Ohm, R2 = {q2} Ohm und R3 = {q3} Ohm.')
iq1, iq2, iq3 = Uq / q1, Uq / q2, Uq / q3; iqg = iq1 + iq2 + iq3
# Parallel gleich
Ug, rg_ = 12, 100
bild5('parallel_gleich', circuit([], [(230, [('R', R(1, rg_))]), (400, [('R', R(2, rg_))])], f'U = {Ug} V', 520), f'Parallelschaltung: Spannungsquelle mit {Ug} V, daran parallel zwei Widerstände mit je {rg_} Ohm.')
# Gemischt
Um, m1, m2, m3 = 12, 20, 30, 60
bild5('gemischt', circuit([('R', R(1, m1), 150)], [(300, [('R', R(2, m2))]), (420, [('R', R(3, m3))])], f'U = {Um} V', 560), f'Gemischte Schaltung: Spannungsquelle mit {Um} V, dahinter R1 = {m1} Ohm in Reihe zu den parallelen Widerständen R2 = {m2} Ohm und R3 = {m3} Ohm.')
# gegeben: Strom durch R1 = 0,3 A (aus Rechnung konsistent machen)
rp = m2 * m3 / (m2 + m3); rgm = m1 + rp; im = Um / rgm; u1m = im * m1; u23 = Um - u1m; im2, im3 = u23 / m2, u23 / m3
assert abs(im2 + im3 - im) < 1e-9 and abs(im - 0.3) < 1e-9

def Z(id, frage, wert, einheit, bild, erk, hint=None, tol=0.001, zusatz=False):
    t = {'id': id, 'typ': 'zahl', 'frage': frage + (' (Zusatz)' if zusatz else ''), 'richtig': A(wert), 'toleranz': tol, 'einheit': einheit, 'bild': bild + '.svg', 'bildAlt': imgs5[bild], 'erklaerung': erk}
    if hint: t['hinweis'] = hint
    return t
def K(id, frage, opts, erk, bild=None, imgs=imgs5, d=None):
    t = {'id': id, 'typ': 'auswahl', 'frage': frage, 'optionen': opts, 'richtig': 0, 'erklaerung': erk}
    if bild: t['bild'], t['bildAlt'] = bild + '.svg', imgs[bild]
    return t
H_R = r'Reihenschaltung: Die Widerstände addieren sich, $R_{ges}=R_1+R_2+\dots$.'
H_I = r'Stromstärke: $I=\dfrac{U}{R}$.'
H_U = r'Teilspannung: $U_i=R_i\cdot I$ mit der Stromstärke $I$ im Stromkreis.'
t5 = [
 Z('r1', r'Berechne den Gesamtwiderstand $R_{ges}$ in $\Omega$.', rg2, 'Ω', 'reihe2', T(r'$R_{ges}=R_1+R_2=@a@\,\Omega+@b@\,\Omega=@c@\,\Omega$', a=r1, b=r2, c=rg2), H_R, 0.01),
 Z('r2', r'Berechne die Stromstärke $I$ im Stromkreis in A.', i2, 'A', 'reihe2', T(r'$I=\dfrac{U}{R_{ges}}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$', u=U, r=rg2, i=i2), r'Berechne zuerst $R_{ges}$, dann $I=\dfrac{U}{R_{ges}}$.'),
 Z('r3', r'Ein Amperemeter wird zwischen $R_1$ und $R_2$ eingebaut. Welche Stromstärke zeigt es in A?', i2, 'A', 'reihe2', 'In der Reihenschaltung ist die Stromstärke an jeder Stelle gleich groß, denn der Stromkreis ist unverzweigt. Es zeigt also ' + T('$@i@\\,\\mathrm{A}$', i=i2) + ' an.', 'Wie viel Ladung fließt pro Sekunde durch jede Stelle eines unverzweigten Stromkreises?'),
 Z('r4', r'Berechne die Spannung $U_2$ an $R_2$ in V.', i2 * r2, 'V', 'reihe2', T(r'$U_2=R_2\cdot I=@r@\,\Omega\cdot@i@\,\mathrm{A}=@u@\,\mathrm{V}$', r=r2, i=i2, u=i2 * r2), H_U, 0.01),
 Z('r5', r'Berechne die Spannung $U_1$ an $R_1$ in V.', i2 * r1, 'V', 'reihe2', T(r'$U_1=R_1\cdot I=@r@\,\Omega\cdot@i@\,\mathrm{A}=@u@\,\mathrm{V}$', r=r1, i=i2, u=i2 * r1), H_U, 0.01),
 K('r6', r'Wie hängen die Teilspannungen mit der Gesamtspannung $U$ zusammen?', [r'$U=U_1+U_2$', r'$U=U_1=U_2$', r'$U=U_1\cdot U_2$', r'$U=\dfrac{U_1+U_2}{2}$'], T(r'In der Reihenschaltung teilt sich die Spannung auf: $@a@\,\mathrm{V}+@b@\,\mathrm{V}=@c@\,\mathrm{V}$.', a=i2 * r1, b=i2 * r2, c=U), 'reihe2'),
 K('r7', 'Warum ist die Stromstärke in einer Reihenschaltung an allen Stellen gleich?', ['Der Stromkreis ist unverzweigt: Durch jede Stelle fließt pro Sekunde gleich viel Ladung.', 'Weil die Spannung an allen Widerständen gleich ist.', 'Weil alle Widerstände gleich groß sind.', 'Weil der erste Widerstand einen Teil des Stroms verbraucht.'], 'Ladung geht im Stromkreis nicht verloren. Im Modell (z. B. Wasserkreislauf) fließt durch jede Stelle des unverzweigten Rohrs pro Zeit gleich viel Wasser.'),
 Z('r8', r'Berechne den Gesamtwiderstand $R_{ges}$ in $\Omega$.', rg3, 'Ω', 'reihe3', T(r'$R_{ges}=@a@\,\Omega+@b@\,\Omega+@c@\,\Omega=@d@\,\Omega$', a=a, b=b, c=c3, d=rg3), H_R, 0.01),
 Z('r9', r'Berechne die Spannung $U_3$ an $R_3$ in V.', i3 * c3, 'V', 'reihe3', T(r'$I=\dfrac{U}{R_{ges}}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$, danach $U_3=R_3\cdot I=@c@\,\Omega\cdot@i@\,\mathrm{A}=@u3@\,\mathrm{V}$.', u=U3, r=rg3, i=i3, c=c3, u3=i3 * c3), 'Berechne zuerst die Stromstärke $I$ im Stromkreis.', 0.01),
 Z('p1', r'Welche Spannung liegt an $R_2$ an, in V?', Up, 'V', 'parallel2', 'In der Parallelschaltung liegt an jedem Zweig die volle Spannung der Quelle an.', 'An wie vielen Stellen kann der Strom die Spannungsquelle verlassen und wieder erreichen?', 0.01),
 Z('p2', r'Berechne die Stromstärke $I_1$ durch $R_1$ in A.', ip1, 'A', 'parallel2', T(r'$I_1=\dfrac{U}{R_1}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$', u=Up, r=p1, i=ip1), r'An $R_1$ liegt die volle Spannung $U$ an: $I_1=\dfrac{U}{R_1}$.'),
 Z('p3', r'Berechne die Stromstärke $I_2$ durch $R_2$ in A.', ip2, 'A', 'parallel2', T(r'$I_2=\dfrac{U}{R_2}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$', u=Up, r=p2, i=ip2), None),
 Z('p4', r'Berechne die Gesamtstromstärke $I$ an der Quelle in A.', ipg, 'A', 'parallel2', T(r'Knotenregel: $I=I_1+I_2=@a@\,\mathrm{A}+@b@\,\mathrm{A}=@c@\,\mathrm{A}$', a=ip1, b=ip2, c=ipg), 'Die Stromstärken der Zweige addieren sich.'),
 Z('p5', r'Berechne den Gesamtwiderstand $R_{ges}$ aus $U$ und $I$ in $\Omega$.', Up / ipg, 'Ω', 'parallel2', T(r'$R_{ges}=\dfrac{U}{I}=\dfrac{@u@\,\mathrm{V}}{@i@\,\mathrm{A}}=@r@\,\Omega$. Das ist weniger als jeder einzelne Widerstand.', u=Up, i=ipg, r=Up / ipg), r'Nutze die Definitionsgleichung $R=\dfrac{U}{I}$ mit der Gesamtstromstärke.', 0.01, True),
 K('p6', 'Der Gesamtwiderstand der Parallelschaltung ist kleiner als jeder einzelne Widerstand. Wie lässt sich das erklären?', ['Der Strom hat mehrere Wege. Bei gleicher Spannung fließt insgesamt mehr Strom als durch einen Zweig allein.', 'Parallelschaltungen haben immer die kleinere Spannung.', 'Der Strom wird in den Widerständen verbraucht.', 'Die Widerstände heben sich gegenseitig auf.'], 'Mit jedem Zweig kommt ein zusätzlicher Weg für die Ladung hinzu. Bei gleicher Spannung wird die Gesamtstromstärke größer, also ist der Gesamtwiderstand $R_{ges}=\\frac{U}{I}$ kleiner.', 'parallel2'),
 Z('p7', r'Berechne die Stromstärke $I_1$ durch $R_1$ in A.', iq1, 'A', 'parallel3', T(r'$I_1=\dfrac{U}{R_1}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$', u=Uq, r=q1, i=iq1), r'An allen Widerständen liegt die Spannung $U$ an.'),
 Z('p8', r'Berechne die Stromstärke $I_3$ durch $R_3$ in A.', iq3, 'A', 'parallel3', T(r'$I_3=\dfrac{U}{R_3}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$', u=Uq, r=q3, i=iq3), None),
 Z('p9', r'Berechne die Gesamtstromstärke $I$ an der Quelle in A.', iqg, 'A', 'parallel3', T(r'$I=I_1+I_2+I_3=@a@\,\mathrm{A}+@b@\,\mathrm{A}+@c@\,\mathrm{A}=@d@\,\mathrm{A}$', a=iq1, b=iq2, c=iq3, d=iqg), 'Berechne zuerst $I_1$, $I_2$ und $I_3$.'),
 Z('p10', r'Berechne den Gesamtwiderstand $R_{ges}$ in $\Omega$.', Uq / iqg, 'Ω', 'parallel3', T(r'$R_{ges}=\dfrac{U}{I}=\dfrac{@u@\,\mathrm{V}}{@i@\,\mathrm{A}}=@r@\,\Omega$', u=Uq, i=iqg, r=Uq / iqg), r'$R=\dfrac{U}{I}$ mit der Gesamtstromstärke.', 0.01, True),
 Z('p11', r'Berechne die Gesamtstromstärke $I$ an der Quelle in A.', 2 * Ug / rg_, 'A', 'parallel_gleich', T(r'Durch jeden Widerstand fließt $I_1=I_2=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$, zusammen $I=@g@\,\mathrm{A}$.', u=Ug, r=rg_, i=Ug / rg_, g=2 * Ug / rg_), 'Beide Zweige haben gleich große Widerstände.'),
 Z('p12', r'Berechne den Gesamtwiderstand $R_{ges}$ in $\Omega$.', rg_ / 2, 'Ω', 'parallel_gleich', T(r'$R_{ges}=\dfrac{U}{I}=\dfrac{@u@\,\mathrm{V}}{@i@\,\mathrm{A}}=@r@\,\Omega$. Zwei gleiche Widerstände parallel ergeben den halben Widerstand.', u=Ug, i=2 * Ug / rg_, r=rg_ / 2), r'$R=\dfrac{U}{I}$ mit der Gesamtstromstärke aus der vorigen Aufgabe.', 0.01, True),
 Z('g1', r'Durch $R_1$ fließt ein Strom von $0{,}3\,\mathrm{A}$. Berechne die Spannung $U_1$ an $R_1$ in V.', u1m, 'V', 'gemischt', T(r'$U_1=R_1\cdot I_1=@r@\,\Omega\cdot@i@\,\mathrm{A}=@u@\,\mathrm{V}$', r=m1, i=im, u=u1m), H_U, 0.01),
 Z('g2', r'Durch $R_1$ fließt $0{,}3\,\mathrm{A}$. Welche Spannung liegt dann an $R_2$ (und ebenso an $R_3$) in V?', u23, 'V', 'gemischt', T(r'$R_1$ liegt in Reihe zu den beiden parallelen Widerständen. Die Spannung teilt sich auf: $U=U_1+U_{23}$, also $U_{23}=@a@\,\mathrm{V}-@b@\,\mathrm{V}=@c@\,\mathrm{V}$. An $R_2$ und $R_3$ liegt dieselbe Spannung an.', a=Um, b=u1m, c=u23), 'Die Gesamtspannung teilt sich auf $R_1$ und die Parallelschaltung auf.', 0.01),
 Z('g3', r'Berechne die Stromstärke $I_2$ durch $R_2$ in A (mit $U_{23}=6\,\mathrm{V}$).', im2, 'A', 'gemischt', T(r'$I_2=\dfrac{U_{23}}{R_2}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$', u=u23, r=m2, i=im2), None),
 Z('g4', r'Berechne die Stromstärke $I_3$ durch $R_3$ in A (mit $U_{23}=6\,\mathrm{V}$).', im3, 'A', 'gemischt', T(r'$I_3=\dfrac{U_{23}}{R_3}=\dfrac{@u@\,\mathrm{V}}{@r@\,\Omega}=@i@\,\mathrm{A}$. Kontrolle: $I_2+I_3=@a@\,\mathrm{A}+@b@\,\mathrm{A}=@c@\,\mathrm{A}=I_1$.', u=u23, r=m3, i=im3, a=im2, b=im3, c=im), None),
 Z('g5', r'Berechne den Gesamtwiderstand der ganzen Schaltung aus $U$ und $I$ in $\Omega$ (mit $I=0{,}3\,\mathrm{A}$).', Um / im, 'Ω', 'gemischt', T(r'$R_{ges}=\dfrac{U}{I}=\dfrac{@u@\,\mathrm{V}}{@i@\,\mathrm{A}}=@r@\,\Omega$', u=Um, i=im, r=Um / im), r'$R=\dfrac{U}{I}$', 0.01, True),
 K('g6', r'Welche Aussage über die Stromstärken in der gemischten Schaltung ist richtig?', [r'$I_1=I_2+I_3$', r'$I_1=I_2=I_3$', r'$I_2=I_1+I_3$', r'$I_1+I_2=I_3$'], 'Der Strom durch $R_1$ teilt sich an der Verzweigung auf $R_2$ und $R_3$ auf. Danach fließt er wieder zusammen.', 'gemischt'),
 K('e1', 'Im Haushalt sind die Geräte parallel geschaltet. Welche Erklärung ist richtig?', ['An jedem Gerät liegt die volle Netzspannung an, und jedes Gerät lässt sich einzeln ein- und ausschalten.', 'Alle Geräte teilen sich die Spannung, deshalb sind sie schwächer.', 'Durch alle Geräte fließt immer dieselbe Stromstärke.', 'Der Strom wird auf die Geräte verteilt, bis er aufgebraucht ist.'], 'In der Parallelschaltung hat jeder Zweig die volle Spannung. Fällt ein Zweig aus oder wird ausgeschaltet, arbeiten die anderen unverändert weiter.'),
 K('e2', 'Welche Formulierung ist fachsprachlich korrekt?', ['Durch den Widerstand fließt eine Stromstärke von 0,2 A.', 'Der Strom wird im Widerstand verbraucht.', 'Die Spannung fließt durch den Widerstand.', 'Der Widerstand hat 0,2 A.'], 'Stromstärke fließt nicht „verbraucht“, und die Spannung fließt nicht: Die Spannung liegt an, die Stromstärke fließt durch. Im Widerstand wird elektrische Energie umgewandelt, Ladung geht nicht verloren.'),
]
json.dump({'aufgaben': t5}, open(d5 + 'aufgaben.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ================= L6: Was passiert, wenn …? =================
d6 = 'lernapps/8/schaltungen-vorhersagen/'
imgs6 = {}
def bild6(name, c, alt, extra=None): schreibe(d6 + name + '.svg', c, alt); imgs6[name] = alt
L = lambda i: f'L{SUB[i]}'; S = lambda i: f'S{SUB[i]}'
bild6('reihe2', circuit([('L', L(1), 176), ('L', L(2), 308)], [(440, [])], 'U = 6 V'), 'Reihenschaltung: Spannungsquelle mit 6 V, dahinter in Reihe die beiden gleichen Lampen L1 und L2.')
bild6('parallel2', circuit([], [(230, [('S', S(1)), ('L', L(1))]), (400, [('S', S(2)), ('L', L(2))])], 'U = 6 V', 520), 'Parallelschaltung: Spannungsquelle mit 6 V, daran parallel zwei Zweige, jeweils mit einem Schalter (S1, S2) in Reihe zu einer Lampe (L1, L2).')
def ueberbr(c):
    x = 308; c.b.append(f'<path d="M{x-42} 50V24H{x+42}V50"/>'); c.dot(x - 42, 50); c.dot(x + 42, 50); c.text(x, 16, 'Draht')
    c.text(176, 84, L(1)); c.text(308, 84, L(2))  # Lampenbeschriftung unter den Lampen, damit der Draht frei bleibt
bild6('ueberbrueckt', circuit([('L', '', 176), ('L', '', 308)], [(440, [])], 'U = 6 V', extra=ueberbr), 'Reihenschaltung aus L1 und L2. Ein Draht verbindet die Punkte vor und hinter L2 und überbrückt sie.')
def drahtlabel(c): c.text(414, 112, 'Draht', 'start')
bild6('quelle_kurz', circuit([], [(230, [('L', L(1))]), (400, [])], 'U = 6 V', 520, extra=drahtlabel), 'Spannungsquelle mit 6 V. Parallel zur Lampe L1 verläuft ein Draht, der die beiden Anschlüsse der Quelle direkt verbindet.')
bild6('gemischt', circuit([('L', L(1), 150)], [(300, [('L', L(2))]), (420, [('L', L(3))])], 'U = 6 V', 520), 'Spannungsquelle mit 6 V. Lampe L1 liegt in Reihe zu den beiden parallelen Lampen L2 und L3.')
bild6('hauptschalter', circuit([('S', 'S', 150)], [(300, [('L', L(1))]), (420, [('L', L(2))])], 'U = 6 V', 520), 'Spannungsquelle mit 6 V. Ein Schalter S liegt in Reihe zu den beiden parallelen Lampen L1 und L2.')
def W(id, frage, opts, erk, bild=None): return K(id, frage, opts, erk, bild, imgs6)
def Z6(id, frage, wert, einheit, bild, erk, hint=None):
    t = {'id': id, 'typ': 'zahl', 'frage': frage, 'richtig': A(wert), 'toleranz': 0.01, 'einheit': einheit, 'erklaerung': erk}
    if bild: t['bild'], t['bildAlt'] = bild + '.svg', imgs6[bild]
    if hint: t['hinweis'] = hint
    return t
MODELL = ' (Modell: gleiche Lampen mit gleichem, konstantem Widerstand)'
t6 = [
 W('w1', 'Lampe 2 wird aus der Fassung geschraubt. Was passiert mit Lampe 1?', ['Sie erlischt, weil der Stromkreis unterbrochen ist.', 'Sie leuchtet heller.', 'Sie leuchtet unverändert.', 'Sie leuchtet schwächer.'], 'Die Reihenschaltung hat nur einen Weg für den Strom. Ist er an einer Stelle unterbrochen, fließt nirgends ein Strom, und beide Lampen sind aus.', 'reihe2'),
 W('w2', 'Beide Schalter sind geschlossen. Dann wird Schalter S₂ geöffnet. Was gilt für Lampe 1?', ['Sie leuchtet unverändert weiter.', 'Sie erlischt ebenfalls.', 'Sie leuchtet heller.', 'Sie leuchtet schwächer.'], 'Jeder Zweig bildet mit der Quelle einen eigenen Stromkreis, und an jedem Zweig liegt die volle Spannung an. Der zweite Zweig beeinflusst den ersten nicht.', 'parallel2'),
 W('w3', 'Zuerst ist nur S₁ geschlossen. Dann wird auch S₂ geschlossen. Was geschieht mit der Stromstärke an der Quelle?', ['Sie wird größer.', 'Sie wird kleiner.', 'Sie bleibt gleich.', 'Sie wird null.'], 'Zum ersten Zweig kommt ein zweiter hinzu. Durch ihn fließt zusätzlich Strom, und die Gesamtstromstärke ist die Summe der Zweigströme. Der Gesamtwiderstand wird kleiner.', 'parallel2'),
 W('w4', 'Beide Schalter sind geschlossen. Lampe 2 wird herausgeschraubt. Wie ändert sich die Stromstärke an der Quelle?', ['Sie wird kleiner.', 'Sie wird größer.', 'Sie bleibt gleich.', 'Sie wird verdoppelt.'], 'Der Zweig mit Lampe 2 fällt weg, und es fließt nur noch der Strom durch Zweig 1. Die Gesamtstromstärke ist die Summe der Zweigströme, also kleiner.', 'parallel2'),
 W('w5', 'Zwei gleiche Lampen leuchten in Reihe an der Quelle. Wie hell leuchtet jede im Vergleich zu einer einzelnen Lampe an derselben Quelle?', ['Dunkler, denn jede Lampe bekommt nur einen Teil der Spannung.', 'Genauso hell.', 'Heller.', 'Eine leuchtet hell, die andere gar nicht.'], 'In der Reihenschaltung teilt sich die Spannung auf. Bei gleichen Lampen liegt an jeder nur die halbe Spannung an. Die Stromstärke ist kleiner als bei einer einzelnen Lampe.' + MODELL, 'reihe2'),
 W('w6', 'Eine dritte gleiche Lampe wird in Reihe zugeschaltet. Was geschieht mit der Stromstärke im Stromkreis?', ['Sie wird kleiner.', 'Sie wird größer.', 'Sie bleibt gleich.', 'Sie wird null.'], 'Mit jeder weiteren Lampe in Reihe steigt der Gesamtwiderstand. Bei gleicher Spannung wird die Stromstärke kleiner, und alle Lampen leuchten schwächer.', 'reihe2'),
 W('w7', 'Eine dritte gleiche Lampe wird parallel zugeschaltet. Was geschieht mit der Helligkeit von Lampe 1?', ['Sie bleibt gleich, denn an Lampe 1 liegt weiter die volle Spannung an.', 'Sie wird dunkler.', 'Sie wird heller.', 'Sie erlischt.'], 'Jeder Zweig hat die volle Spannung der Quelle. Lampe 1 merkt vom neuen Zweig nichts. Nur die Stromstärke an der Quelle wird größer.', 'parallel2'),
 W('w8', 'Lampe 2 wird mit einem Draht überbrückt. Was geschieht?', ['Lampe 2 erlischt, und Lampe 1 leuchtet heller.', 'Beide Lampen erlöschen.', 'Beide Lampen leuchten unverändert.', 'Lampe 1 erlischt, und Lampe 2 leuchtet heller.'], 'Der Strom fließt fast ohne Widerstand durch den Draht und nicht mehr durch Lampe 2. An Lampe 2 liegt (fast) keine Spannung an. Der Gesamtwiderstand sinkt, und an Lampe 1 liegt jetzt die volle Quellenspannung an. Sie leuchtet heller.', 'ueberbrueckt'),
 W('w9', 'Der Draht verbindet die beiden Anschlüsse der Quelle direkt. Was geschieht?', ['Durch den Draht fließt eine sehr große Stromstärke (Kurzschluss), die Lampe erlischt.', 'Die Lampe leuchtet heller.', 'Die Lampe leuchtet unverändert.', 'Es fließt gar kein Strom.'], 'Der Draht hat fast keinen Widerstand, deshalb wird die Stromstärke sehr groß. Draht und Quelle erhitzen sich, es besteht Brandgefahr. Im Haushalt löst dann die Sicherung aus. Durch die Lampe fließt kaum noch Strom.', 'quelle_kurz'),
 W('w10', 'L₃ wird herausgeschraubt. Was geschieht mit L₁ und L₂ (gleiche Lampen)?', ['L₁ leuchtet schwächer, L₂ leuchtet heller.', 'L₁ und L₂ leuchten unverändert.', 'L₁ leuchtet heller, L₂ leuchtet schwächer.', 'L₁ und L₂ erlöschen.'], 'Vorher liegen an L₁ zwei Drittel und an L₂ ein Drittel der Spannung, denn L₂ und L₃ teilen sich einen Zweig. Nachher sind L₁ und L₂ in Reihe, und an jeder liegt die Hälfte der Spannung. L₁ bekommt also weniger, L₂ mehr.' + MODELL, 'gemischt'),
 W('w11', 'Der Schalter S wird geöffnet. Was gilt für L₁ und L₂?', ['Beide Lampen erlöschen, denn S liegt im unverzweigten Teil des Stromkreises.', 'Beide Lampen leuchten weiter.', 'Nur L₁ erlischt.', 'Beide Lampen leuchten heller.'], 'Der gesamte Strom fließt durch S. Ist er geöffnet, fließt in keinem Zweig mehr ein Strom.', 'hauptschalter'),
 W('w12', 'Warum bleiben im Haushalt die übrigen Lampen an, wenn eine Glühlampe durchbrennt?', ['Die Lampen sind parallel geschaltet, und jede hat einen eigenen Stromkreis mit der vollen Spannung.', 'Die Lampen sind in Reihe geschaltet, und der Strom sucht sich einen Weg.', 'Die Steckdose gleicht den fehlenden Strom aus.', 'Die Sicherung schaltet die Lampe wieder ein.'], 'In der Parallelschaltung bildet jede Lampe einen eigenen Zweig. Fällt einer aus, fließt in den anderen Zweigen weiter derselbe Strom.'),
 W('w13', 'Eine Lichterkette soll weiterleuchten, wenn eine Lampe ausfällt. Wie müssen die Lampen geschaltet sein?', ['Parallel.', 'In Reihe.', 'Das ist egal.', 'Mit einem Draht überbrückt.'], 'Nur bei einer Parallelschaltung hat jede Lampe einen eigenen Weg für den Strom. Billige Lichterketten in Reihe gehen komplett aus, sobald eine Lampe fehlt.'),
 Z6('w14', 'Zwei gleiche Lampen sind in Reihe an die Quelle angeschlossen. Welche Spannung liegt an jeder Lampe in V?', 3, 'V', 'reihe2', 'Die Quellenspannung von 6 V teilt sich bei gleichen Lampen gleichmäßig auf: jeweils 3 V.', 'Die Spannung teilt sich in der Reihenschaltung auf.'),
 Z6('w15', 'Welche Spannung liegt an Lampe 2 in V, wenn beide Schalter geschlossen sind?', 6, 'V', 'parallel2', 'Jeder Zweig der Parallelschaltung liegt an der vollen Quellenspannung von 6 V.', 'Wie viele Stromkreise bilden die beiden Zweige?'),
]
json.dump({'aufgaben': t6}, open(d6 + 'aufgaben.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(t5), 'Aufgaben (L5),', len(t6), 'Aufgaben (L6),', len(imgs5) + len(imgs6), 'Bilder')
