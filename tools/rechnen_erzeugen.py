#!/usr/bin/env python3
"""Erzeugt die Aufgaben für lernapps/8/widerstand-berechnen (Rechnen mit R = U/I). Alle Lösungen werden berechnet.
Aufruf im Projektordner: python3 tools/rechnen_erzeugen.py"""
import json
D = 'lernapps/8/widerstand-berechnen/'
def N(v): return ('%g' % round(v, 4)).replace('.', '{,}')
def T(s, **k):
    for key, v in k.items(): s = s.replace('@' + key + '@', N(v))
    return s
V, A, MA, OM, KOM = r'\,\mathrm{V}', r'\,\mathrm{A}', r'\,\mathrm{mA}', r'\,\Omega', r'\,\mathrm{k}\Omega'
HF = r'Schreibe große Zahlen ohne Punkt, zum Beispiel 4700.'
def Z(id, frage, wert, einheit, erk, hint=None, tol=None):
    wert = round(wert, 6); tol = tol if tol is not None else max(0.0005, abs(wert) * 0.005)
    t = {'id': id, 'typ': 'zahl', 'frage': frage, 'richtig': wert, 'toleranz': round(tol, 6), 'einheit': einheit, 'erklaerung': erk}
    if hint: t['hinweis'] = hint
    return t
def K(id, frage, opts, erk): return {'id': id, 'typ': 'auswahl', 'frage': frage, 'optionen': opts, 'richtig': 0, 'erklaerung': erk}
t = []
# ---- A: Einheiten umrechnen ----
t += [
 Z('e1', T(r'Wandle um: $@a@' + MA + r'$ sind wie viel A?', a=250), 0.25, 'A', T(r'$1' + MA + r'=0{,}001' + A + r'$, also $@a@' + MA + r'=@a@\cdot0{,}001' + A + r'=@b@' + A + r'$.', a=250, b=0.25), r'Milli bedeutet ein Tausendstel: $1' + MA + r'=0{,}001' + A + r'$.', 0.0001),
 Z('e2', T(r'Wandle um: $@a@' + A + r'$ sind wie viel mA?', a=0.35), 350, 'mA', T(r'$1' + A + r'=1000' + MA + r'$, also $@a@' + A + r'=@a@\cdot1000' + MA + r'=@b@' + MA + r'$.', a=0.35, b=350), r'$1' + A + r'=1000' + MA + r'$. ' + HF, 0.01),
 Z('e3', T(r'Wandle um: $@a@' + KOM + r'$ sind wie viel Ω?', a=4.7), 4700, 'Ω', T(r'$1' + KOM + r'=1000' + OM + r'$, also $@a@' + KOM + r'=@b@' + OM + r'$.', a=4.7, b=4700), r'Kilo bedeutet tausend: $1' + KOM + r'=1000' + OM + r'$. ' + HF, 0.1),
 Z('e4', T(r'Wandle um: $@a@' + OM + r'$ sind wie viel kΩ?', a=680), 0.68, 'kΩ', T(r'$@a@' + OM + r'=@a@:1000' + KOM + r'=@b@' + KOM + r'$.', a=680, b=0.68), r'$1' + KOM + r'=1000' + OM + r'$', 0.001),
 Z('e5', T(r'Wandle um: $@a@' + MA + r'$ sind wie viel A?', a=45), 0.045, 'A', T(r'$@a@' + MA + r'=@b@' + A + r'$.', a=45, b=0.045), r'$1' + MA + r'=0{,}001' + A + r'$', 0.0001),
 Z('e6', T(r'Wandle um: $@a@' + A + r'$ sind wie viel mA?', a=1.2), 1200, 'mA', T(r'$@a@' + A + r'=@b@' + MA + r'$.', a=1.2, b=1200), r'$1' + A + r'=1000' + MA + r'$. ' + HF, 0.01),
]
# ---- B: Formeln und Einheiten ----
t += [
 K('u1', r'Die Gleichung $R=\dfrac{U}{I}$ wird nach $U$ umgestellt. Wie lautet sie?', [r'$U=R\cdot I$', r'$U=\dfrac{R}{I}$', r'$U=\dfrac{I}{R}$', r'$U=R+I$'], r'Beide Seiten mit $I$ multiplizieren: $R\cdot I=U$.'),
 K('u2', r'Die Gleichung $R=\dfrac{U}{I}$ wird nach $I$ umgestellt. Wie lautet sie?', [r'$I=\dfrac{U}{R}$', r'$I=U\cdot R$', r'$I=\dfrac{R}{U}$', r'$I=U-R$'], r'Erst mit $I$ multiplizieren: $R\cdot I=U$. Dann durch $R$ teilen: $I=\dfrac{U}{R}$.'),
 K('u3', r'Welche Einheit entsteht bei $\dfrac{\mathrm{V}}{\mathrm{A}}$?', [r'Ohm ($\Omega$)', 'Volt (V)', 'Ampere (A)', 'Sekunde (s)'], r'Das ist die Definition der Einheit Ohm: $1\,\Omega=1\,\dfrac{\mathrm{V}}{\mathrm{A}}$.'),
 K('u4', r'Welche Einheit entsteht bei $\dfrac{\mathrm{V}}{\mathrm{mA}}$?', [r'Kiloohm ($\mathrm{k}\Omega$)', r'Ohm ($\Omega$)', r'Milliohm ($\mathrm{m}\Omega$)', 'Ampere (A)'], r'$1\,\dfrac{\mathrm{V}}{\mathrm{mA}}=\dfrac{1\,\mathrm{V}}{0{,}001\,\mathrm{A}}=1000\,\Omega=1\,\mathrm{k}\Omega$. Wer Spannung in V und Stromstärke in mA einsetzt, erhält den Widerstand in kΩ.'),
]
# ---- C: Widerstand berechnen ----
FR = r'$R=\dfrac{U}{I}$'
t += [
 Z('c1', T(r'An einem Widerstand liegen $@u@' + V + r'$, es fließen $@i@' + A + r'$. Berechne $R$ in Ω.', u=6, i=0.2), 6 / 0.2, 'Ω', T(r'$R=\dfrac{U}{I}=\dfrac{@u@' + V + r'}{@i@' + A + r'}=@r@' + OM + r'$', u=6, i=0.2, r=30), FR),
 Z('c2', T(r'An einem Widerstand liegen $@u@' + V + r'$, es fließen $@i@' + A + r'$. Berechne $R$ in Ω.', u=12, i=0.05), 12 / 0.05, 'Ω', T(r'$R=\dfrac{U}{I}=\dfrac{@u@' + V + r'}{@i@' + A + r'}=@r@' + OM + r'$', u=12, i=0.05, r=240), FR),
 Z('c3', T(r'Ein Lämpchen liegt an $@u@' + V + r'$, es fließen $@i@' + MA + r'$. Berechne $R$ in Ω.', u=3, i=25), 3 / 0.025, 'Ω', T(r'$@i@' + MA + r'=0{,}025' + A + r'$, also $R=\dfrac{@u@' + V + r'}{0{,}025' + A + r'}=@r@' + OM + r'$', u=3, i=25, r=120), r'Wandle zuerst die Stromstärke in A um: $1' + MA + r'=0{,}001' + A + r'$.'),
 Z('c4', T(r'Ein Toaster liegt an der Netzspannung von $@u@' + V + r'$, es fließen $@i@' + A + r'$. Berechne $R$ in Ω.', u=230, i=4.6), 230 / 4.6, 'Ω', T(r'$R=\dfrac{U}{I}=\dfrac{@u@' + V + r'}{@i@' + A + r'}=@r@' + OM + r'$', u=230, i=4.6, r=50), FR),
 Z('c5', T(r'An einem Widerstand liegen $@u@' + V + r'$, es fließen $@i@' + MA + r'$. Berechne $R$ in kΩ.', u=9, i=3), 9 / 3, 'kΩ', T(r'$R=\dfrac{@u@' + V + r'}{@i@' + MA + r'}=@r@' + KOM + r'$. Mit V und mA kommt der Widerstand direkt in kΩ heraus.', u=9, i=3, r=3), r'Rechne ohne Umwandlung: $\dfrac{\mathrm{V}}{\mathrm{mA}}$ ergibt kΩ.'),
 Z('c6', T(r'Ein Spielzeugmotor liegt an $@u@' + V + r'$, es fließen $@i@' + MA + r'$. Berechne $R$ in Ω.', u=4.5, i=90), 4.5 / 0.09, 'Ω', T(r'$@i@' + MA + r'=0{,}09' + A + r'$, also $R=\dfrac{@u@' + V + r'}{0{,}09' + A + r'}=@r@' + OM + r'$', u=4.5, i=90, r=50), r'Wandle zuerst $90' + MA + r'$ in A um.'),
]
# ---- D: Stromstärke berechnen ----
FI = r'$I=\dfrac{U}{R}$'
t += [
 Z('i1', T(r'An einem Widerstand von $@r@' + OM + r'$ liegen $@u@' + V + r'$. Berechne $I$ in A.', r=40, u=12), 12 / 40, 'A', T(r'$I=\dfrac{U}{R}=\dfrac{@u@' + V + r'}{@r@' + OM + r'}=@i@' + A + r'$', u=12, r=40, i=0.3), FI),
 Z('i2', T(r'An einem Widerstand von $@r@' + KOM + r'$ liegen $@u@' + V + r'$. Berechne $I$ in mA, auf eine Nachkommastelle gerundet.', r=2.2, u=9), 4.1, 'mA', T(r'$I=\dfrac{U}{R}=\dfrac{@u@' + V + r'}{@r@' + KOM + r'}\approx@i@' + MA + r'$ (Taschenrechner: 4,0909 mA)', u=9, r=2.2, i=4.1), r'Mit V und kΩ kommt die Stromstärke direkt in mA heraus.', 0.06),
 Z('i3', T(r'Eine Glühlampe hat den Widerstand $@r@' + OM + r'$ und liegt an der Netzspannung von $@u@' + V + r'$. Berechne $I$ in A.', r=1150, u=230), 230 / 1150, 'A', T(r'$I=\dfrac{U}{R}=\dfrac{@u@' + V + r'}{@r@' + OM + r'}=@i@' + A + r'$', u=230, r=1150, i=0.2), FI + ' ' + HF),
 Z('i4', T(r'An einem Widerstand von $@r@' + OM + r'$ liegen $@u@' + V + r'$. Berechne $I$ in mA.', r=150, u=6), 6 / 150 * 1000, 'mA', T(r'$I=\dfrac{U}{R}=\dfrac{@u@' + V + r'}{@r@' + OM + r'}=@i@' + A + r'=@m@' + MA + r'$', u=6, r=150, i=0.04, m=40), r'Berechne zuerst $I$ in A und wandle dann um: $1' + A + r'=1000' + MA + r'$.'),
 Z('i5', T(r'Ein Spielzeugmotor hat den Widerstand $@r@' + OM + r'$ und liegt an $@u@' + V + r'$. Berechne $I$ in A.', r=12, u=3), 3 / 12, 'A', T(r'$I=\dfrac{U}{R}=\dfrac{@u@' + V + r'}{@r@' + OM + r'}=@i@' + A + r'$', u=3, r=12, i=0.25), FI),
]
# ---- E: Spannung berechnen ----
FU = r'$U=R\cdot I$'
t += [
 Z('v1', T(r'Durch einen Widerstand von $@r@' + OM + r'$ fließen $@i@' + MA + r'$. Berechne $U$ in V.', r=470, i=20), 470 * 0.02, 'V', T(r'$@i@' + MA + r'=0{,}02' + A + r'$, also $U=R\cdot I=@r@' + OM + r'\cdot0{,}02' + A + r'=@u@' + V + r'$', i=20, r=470, u=9.4), FU + r' Wandle zuerst die Stromstärke in A um.', 0.05),
 Z('v2', T(r'Durch einen Widerstand von $@r@' + OM + r'$ fließen $@i@' + A + r'$. Berechne $U$ in V.', r=100, i=0.06), 100 * 0.06, 'V', T(r'$U=R\cdot I=@r@' + OM + r'\cdot@i@' + A + r'=@u@' + V + r'$', r=100, i=0.06, u=6), FU),
 Z('v3', T(r'Durch einen Widerstand von $@r@' + KOM + r'$ fließen $@i@' + MA + r'$. Berechne $U$ in V.', r=1.5, i=4), 1.5 * 4, 'V', T(r'$U=R\cdot I=@r@' + KOM + r'\cdot@i@' + MA + r'=@u@' + V + r'$. Mit kΩ und mA kommt die Spannung direkt in V heraus.', r=1.5, i=4, u=6), FU + r' Mit kΩ und mA brauchst du nicht umzurechnen.'),
 Z('v4', T(r'Durch einen Widerstand von $@r@' + OM + r'$ fließen $@i@' + A + r'$. Berechne $U$ in V.', r=22, i=0.15), 22 * 0.15, 'V', T(r'$U=R\cdot I=@r@' + OM + r'\cdot@i@' + A + r'=@u@' + V + r'$', r=22, i=0.15, u=3.3), FU, 0.05),
]
# ---- F: Genauigkeit und Plausibilität ----
t += [
 Z('g1', r'An einem Widerstand liegen $4{,}5\,\mathrm{V}$ (zwei gültige Ziffern), es fließen $0{,}032\,\mathrm{A}$ (zwei gültige Ziffern). Berechne $R$ in Ω und gib das Ergebnis mit zwei gültigen Ziffern an.', 140, 'Ω', r'Der Taschenrechner zeigt $140{,}625\,\Omega$. Das Ergebnis darf nicht genauer sein als die Messwerte: Mit zwei gültigen Ziffern ist $R\approx140\,\Omega$.', r'Zwei gültige Ziffern bei $140{,}625$ sind „1“ und „4“. Die Größenordnung bleibt erhalten.', 1),
 K('g2', r'Du berechnest $R=\dfrac{7{,}5\,\mathrm{V}}{0{,}018\,\mathrm{A}}$. Der Taschenrechner zeigt $416{,}666667$. Spannung und Stromstärke sind auf zwei gültige Ziffern gemessen. Welche Angabe ist sinnvoll?', [r'$R\approx420\,\Omega$', r'$R=416{,}666667\,\Omega$', r'$R=416{,}7\,\Omega$', r'$R\approx400\,\Omega$'], r'Das Ergebnis darf nicht genauer angegeben werden als die Messwerte. Mit zwei gültigen Ziffern: $R\approx420\,\Omega$. Alle weiteren Stellen auf dem Taschenrechner sind nicht aussagekräftig.'),
 K('g3', r'Jemand rechnet $R=\dfrac{12\,\mathrm{V}}{20\,\mathrm{mA}}=0{,}6\,\Omega$. Was ist falsch?', [r'Die Stromstärke wurde nicht in A umgerechnet. Richtig ist $R=\dfrac{12\,\mathrm{V}}{0{,}02\,\mathrm{A}}=600\,\Omega$.', 'Die Formel muss $R=U\\cdot I$ lauten.', 'Man darf die Stromstärke nicht in die Formel einsetzen.', 'Nichts, die Rechnung stimmt.'], r'Die Einheit $\dfrac{\mathrm{V}}{\mathrm{mA}}$ ergibt kΩ: $\dfrac{12}{20}\,\mathrm{k}\Omega=0{,}6\,\mathrm{k}\Omega=600\,\Omega$. Der Fehler: Es wurde mit mA gerechnet, aber das Ergebnis in Ω angegeben.'),
 K('g4', r'Eine Taschenlampenbirne hat bei $4{,}5\,\mathrm{V}$ eine Stromstärke von $0{,}3\,\mathrm{A}$. Welcher Widerstand ist plausibel?', [r'etwa $15\,\Omega$', r'etwa $1{,}5\,\Omega$', r'etwa $150\,\Omega$', r'etwa $1350\,\Omega$'], r'Überschlag: $\dfrac{4{,}5\,\mathrm{V}}{0{,}3\,\mathrm{A}}=15\,\Omega$. Prüfe Ergebnisse immer auf ihre Größenordnung.'),
]
# ---- G: Proportionalität ----
t += [
 Z('p1', r'Durch einen ohmschen Widerstand fließen bei $6\,\mathrm{V}$ genau $0{,}3\,\mathrm{A}$. Welche Stromstärke fließt bei $9\,\mathrm{V}$? Gib sie in A an.', 0.45, 'A', r'Der Widerstand ist konstant: $R=\dfrac{6\,\mathrm{V}}{0{,}3\,\mathrm{A}}=20\,\Omega$. Dann ist $I=\dfrac{9\,\mathrm{V}}{20\,\Omega}=0{,}45\,\mathrm{A}$. Oder: Die Spannung wird um das 1,5-Fache größer, also auch die Stromstärke.', r'Berechne zuerst den Widerstand.'),
 Z('p2', r'Durch einen ohmschen Widerstand fließen bei $5\,\mathrm{V}$ genau $0{,}1\,\mathrm{A}$. Bei welcher Spannung fließen $0{,}3\,\mathrm{A}$? Gib sie in V an.', 15, 'V', r'$R=\dfrac{5\,\mathrm{V}}{0{,}1\,\mathrm{A}}=50\,\Omega$ und $U=R\cdot I=50\,\Omega\cdot0{,}3\,\mathrm{A}=15\,\mathrm{V}$.', r'Berechne zuerst den Widerstand.', 0.05),
]
# ---- H: Verbindung zum Haushalt ----
t += [
 Z('h1', r'Ein Heizgerät hat den Widerstand $46\,\Omega$ und liegt an der Netzspannung von $230\,\mathrm{V}$. Berechne die Stromstärke in A.', 5, 'A', r'$I=\dfrac{U}{R}=\dfrac{230\,\mathrm{V}}{46\,\Omega}=5\,\mathrm{A}$', r'$I=\dfrac{U}{R}$'),
 Z('h2', r'Jedes Heizgerät aus der letzten Aufgabe benötigt $5\,\mathrm{A}$. Wie viele solcher Geräte dürfen höchstens gleichzeitig an einem Stromkreis mit einer $16\,\mathrm{A}$-Sicherung betrieben werden? Die Geräte sind parallel geschaltet.', 3, 'Geräte', r'Die Stromstärken der parallelen Zweige addieren sich: $3\cdot5\,\mathrm{A}=15\,\mathrm{A}<16\,\mathrm{A}$. Bei vier Geräten wären es $20\,\mathrm{A}$, die Sicherung würde auslösen.', r'Die Gesamtstromstärke ist die Summe der Stromstärken in den Zweigen.', 0.001),
]
ids = [x['id'] for x in t]; assert len(ids) == len(set(ids))
json.dump({'aufgaben': t}, open(D + 'aufgaben.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(t), 'Aufgaben')
