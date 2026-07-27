# Lösungen für die Lernspiele

Diese Übersicht dokumentiert die "richtigen" Lösungen für alle Spiele im Lernbereich
(`learningGames` in [app.js](app.js)). Sie basiert auf den Daten- und Logik-Strukturen
in app.js (Stand: aktuelle Version) und dient als Antwortschlüssel, nicht als
Bestandteil der Website selbst.

## 1. SDG-Sprint (`sdg-sprint`)

Datenquelle: `sdgSprintRounds` (app.js:1162). Für jede Situation ist die passende SDG-Nummer angegeben.

| # | Situation (Kurzfassung) | Richtiges SDG |
|---|---|---|
| 1 | Schulhof mit Bäumen, offenem Boden, Regengärten gegen Hitze/Starkregen | **SDG 11** – Nachhaltige Städte |
| 2 | Küstengruppe schützt Seegras (Kohlenstoff, Wellenbremse, Lebensraum) | **SDG 14** – Leben unter Wasser |
| 3 | Dürre-Region baut Frühwarnsysteme, Hitzepläne, faire Unterstützung | **SDG 13** – Klimaschutz |
| 4 | Klasse prüft Herkunft, Müll und Waldschutz eines Produkts | **SDG 12** – Nachhaltiger Konsum |
| 5 | Region gibt Höfen dürreresistentes Saatgut + fairen Marktzugang | **SDG 2** – Kein Hunger |
| 6 | Jugendgruppen mehrerer Länder teilen Flutdaten, Warnwerkzeuge, Fördermittel | **SDG 17** – Partnerschaften |

## 2. Ursache-Kette / Cause Chain (`chain-builder`)

Datenquelle: `chainGameRounds` (app.js:1237). Die Kette muss in der `links`-Reihenfolge
gebaut werden (die Einträge aus `decoys` sind absichtliche Fehlantworten).

**Starkregen-Kette** (Start: Versiegelte Fläche)
1. Regen versickert schlechter
2. Mehr Wasser fließt oberflächlich ab
3. Lokales Überflutungsrisiko steigt
4. Entsiegelung und Speicher unterbrechen die Kette

**Riff-Hitze-Kette** (Start: Marine Hitzewelle)
1. Korallen geraten unter Stress
2. Algenverlust löst Bleiche aus
3. Ohne ihre Algen fehlt Korallen Energie
4. Sauberes Wasser und Klimaschutz verbessern Chancen

**Konsum-Kette** (Start: Billiger Trend-Kauf)
1. Hohe Nachfrage treibt Neuproduktion an
2. Produktion verbraucht Wasser, Energie und Fläche
3. Kurze Nutzung erzeugt Müll und Emissionen
4. Reparatur, Secondhand und Teilen unterbrechen die Kette

## 3. Stadt-Baumeister / City Builder (`city-builder`)

Regeln (app.js:1414–1416, 3529): Budget = **12** Punkte, muss vollständig verteilt werden.
Gelöst, wenn alle vier Werte ≥ 60 und der Durchschnitt ≥ 69 ist.

Eine funktionierende Verteilung:

| Maßnahme | Punkte |
|---|---|
| Schattenbäume | 1 |
| Offener Boden | 6 |
| Regenspeicher | 0 |
| Sichere Wege | 5 |

Ergebnis: Kühlung 63, Überflutungsschutz 74, Biodiversität 77, Fairness 63 → Durchschnitt **69** ✅ (alle Werte ≥ 60).

## 4. Riff-Rettung / Reef Rescue (`reef-rescue`)

Regeln (app.js:1417–1419, 3537): Budget = **9**, muss nicht vollständig verbraucht werden.
Gelöst, wenn Erholung, Drucksenkung und Unterstützung alle ≥ 58, Durchschnitt ≥ 65 und
mindestens eine Kartenkombination (Synergie) aktiv ist.

Eine funktionierende Auswahl (Kosten 8 von 9):

- Emissionen senken (4)
- Hitze-Alarm (2)
- Lokale Guides (2)

Aktive Synergien: „Emissionen senken + Hitze-Alarm" (+8 Drucksenkung) und
„Hitze-Alarm + lokale Guides" (+8 Unterstützung).

Ergebnis: Erholung 62, Drucksenkung 58, Unterstützung 74 → Durchschnitt **65** ✅.

## 5. Klimarat 2035 / Climate Council (`climate-council`)

Regeln (app.js:1420–1422, 3410–3415): Budget = **14**, muss vollständig verteilt werden,
jede Maßnahme mindestens 1 Punkt. Gelöst, wenn alle vier Werte ≥ 90 und Durchschnitt ≥ 94.

Eine funktionierende Verteilung:

| Maßnahme | Punkte |
|---|---|
| Saubere Energie | 2 |
| Faire Mobilität | 2 |
| Ernährungswende | 1 |
| Natur wiederherstellen | 5 |
| Klimagerechtigkeit | 4 |

Ergebnis: Klima 91, Natur 91, Gerechtigkeit 93, Resilienz 100 → Durchschnitt **94** ✅.

## 6. Wissens-Quiz (`quizQuestions`)

Datenquelle: `quizQuestions` (app.js:1545). Reihenfolge wie im Code, `correct`-Index (0-basiert).

| # | Frage (Kurzfassung) | Richtige Antwort |
|---|---|---|
| 1 | Was bedeutet Korallenbleiche? | Koralle stößt unter Stress ihre Algen ab |
| 2 | Wo speichert Seegras Kohlenstoff langfristig? | Vor allem im Sediment |
| 3 | Grundidee einer Schwammstadt? | Regenwasser speichern und wiederverwenden |
| 4 | Welches SDG steht direkt für Klimaschutz? | SDG 13 |
| 5 | Welche zwei SDGs betreffen Ökosysteme Wasser/Land? | SDG 14 und SDG 15 |
| 6 | Warum ist SDG 17 wichtig? | Weil Lösungen oft Partnerschaften brauchen |
| 7 | Wie schützt Seegras Küsten? | Bremst Wellen, stabilisiert Sediment |
| 8 | Haupttreiber globaler Korallenbleiche? | Anhaltender Hitzestress im Meer |
| 9 | Warum kühlen Grünflächen eine Schwammstadt? | Schatten + Verdunstung |
| 10 | Kann lokaler Riffschutz globalen Klimaschutz ersetzen? | Nein, verbessert aber lokale Widerstandskraft |
| 11 | Warum sind versiegelte Flächen bei Starkregen problematisch? | Wasser versickert schlecht, fließt schnell ab |
| 12 | Was beschreibt „Blue Carbon" am besten? | Kohlenstoff, den Küsten-/Meeresökosysteme speichern |

---

*Hinweis: Bei den drei Budget-Spielen (Stadt-Baumeister, Riff-Rettung, Klimarat) gibt es
mehrere gültige Lösungen – die oben genannten sind jeweils ein Beispiel, das die
Gewinnbedingung im Code erfüllt.*
