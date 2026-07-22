# Agenten-Leitfaden für Turnierdaten

Kurzleitfaden für Agenten, die diese GitHub-Pages-Website mit Turnierinformationen pflegen. Die aktive App lädt ihr Event-Verzeichnis aus `data/events/index.json` und die einzelnen produktiven Event-Dateien aus `data/events/<event-id>.json`; die übrigen JSON-Dateien unter `data/` bleiben als Referenz- und Kompatibilitätsdateien erhalten.

## Schnellstart für Agenten

1. **Aktive Datenquelle bearbeiten:** Neue oder geänderte Turniere gehören als eigene Datei nach `data/events/` und werden in `data/events/index.json` registriert.
2. **Eindeutige Turnier-ID setzen:** `id` muss stabil, URL-tauglich und eindeutig sein, z. B. `verein-turnier-2026-07-05`.
3. **Direktlink prüfen:** Turnierseiten werden mit `?t=<turnier-id>` geöffnet, z. B. `turnier.html?t=skv-hochberg-2026-07-05`.
4. **JSON validieren:** Vor Abschluss `./scripts/pages-preflight.sh` ausführen.
5. **Referenzdateien nur bei Bedarf anfassen:** `data/config.json`, `data/spielplan.json`, `data/event.json`, `data/catering.json`, `data/spielfeldlayout.json`, `data/anfahrt.json` und `sample-data.json` sind nicht die primäre Mehrturnier-Datenquelle.

## Aktive Datenstruktur

`data/events/index.json` hat diese Grundform:

```json
{
  "events": [
    { "id": "turnier-id", "file": "turnier-id.json" }
  ]
}
```

## Pflicht- und optionale Felder pro Turnier

### `id`

Die eindeutige, URL-taugliche `id` wird im Event-Verzeichnis (`data/events/index.json`) gepflegt und muss zum Dateinamen passen. In der einzelnen Event-Datei selbst steht keine `id`.

### `event`

Pflicht:

- `event.name` (String)
- `event.date` (ISO-Datum `YYYY-MM-DD`)
- `event.startTime` (24h-Uhrzeit `HH:MM`)
- `event.location` (String)

Optional:

- `event.endTime` (24h-Uhrzeit `HH:MM`)

### `geo`

Optional, aber empfohlen für die Geo-Sortierung auf der Auswahlseite:

- `geo.lat` (Zahl)
- `geo.lon` (Zahl)

Wenn keine verlässlichen Koordinaten vorliegen, das Objekt lieber weglassen statt zu raten.

### `quickInfo`

Pflicht:

- `quickInfo` (Array aus Strings): kurze Regeln, Hinweise und organisatorische Eckdaten.

### `trainerMeeting`

Pflicht:

- `trainerMeeting.time` (String, idealerweise `HH:MM` oder klarer Text)
- `trainerMeeting.location` (String)

### `awardCeremony`

Pflicht:

- `awardCeremony.isPlanned` (Boolean)

Optional:

- `awardCeremony.time` (String)
- `awardCeremony.location` (String)

Wenn keine Siegerehrung geplant ist, `isPlanned` auf `false` setzen und Zeit/Ort weglassen.

### `catering`

Pflicht:

- `catering.offerings` (Array aus Strings)

Optional:

- `catering.payment` (String)
- `catering.notes` (String)

### `directions`

Pflicht:

- `directions.address` (String; mehrzeilig mit `\n` möglich)

Optional:

- `directions.parking` (String)
- `directions.publicTransport` (String)
- `directions.website` (URL-String)
- `directions.notice` (String)

### `fieldLayout`

Pflicht:

- `fieldLayout.summary` (String)
- `fieldLayout.fields` (Array)

Optional:

- `fieldLayout.title` (String)
- `fieldLayout.image.url` (String; relativer Pfad, z. B. `images/layout-name.png`)
- `fieldLayout.image.alt` (String; Pflicht, wenn ein Bild gesetzt wird)

Pro Eintrag in `fieldLayout.fields`:

- `field` (String, z. B. `Feld A`)
- `group` (String, z. B. Gruppenname oder Teamliste)

### `matches`

Pflicht:

- `matches` (Array)

Pro Spiel:

- `time` (`HH:MM`)
- `field` (String, z. B. `Feld A`)
- `group` (String, z. B. `A` oder `Gruppe A`)
- `home.club` (String)
- `home.team` (String)
- `away.club` (String)
- `away.team` (String)

## Referenz- und Kompatibilitätsdateien

Diese Dateien unter `data/` werden im Preflight weiterhin validiert, sind aber nicht die primäre Quelle für die Mehrturnier-Website:

1. `data/config.json`
2. `data/spielplan.json`
3. `data/event.json`
4. `data/catering.json`
5. `data/spielfeldlayout.json`
6. `data/anfahrt.json`

`sample-data.json` ist ebenfalls nur eine Vorlage/Referenz. Änderungen an echten Turnieren müssen als einzelne Event-Datei in `data/events/` landen und im Verzeichnis registriert werden.

## Validierung und Qualitätscheck

Vor jedem Abschluss ausführen:

```bash
./scripts/pages-preflight.sh
```

Der Check validiert JSON-Dateien, interne HTML-Links, Pflicht-Assets und die Datenquellen in `script.js`.

Zusätzliche manuelle Prüfungen bei Datenänderungen:

- Ist `data/events/index.json` und jede Event-Datei valides UTF-8-JSON ohne Kommentare?
- Sind Datum und Uhrzeiten einheitlich (`YYYY-MM-DD`, `HH:MM`)?
- Ist jede `id` eindeutig?
- Existieren referenzierte Bilder wirklich im Repository?
- Hat jedes Bild einen aussagekräftigen Alt-Text?
- Sind Mannschaftsnamen in Spielplan und Feldlayout konsistent geschrieben?
- Funktioniert ein Direktlink wie `turnier.html?t=<turnier-id>` lokal?

## Lokale Ansicht

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

- Auswahlseite: `http://localhost:8000/`
- Direktlink: `http://localhost:8000/turnier.html?t=<turnier-id>`

## Häufige Fehler vermeiden

- Keine produktiven Turnierdaten in den Referenzdateien unter `data/*.json` ändern; Event-Dateien gehören nach `data/events/`.
- Keine ungültigen JSON-Kommentare oder trailing commas einfügen.
- Keine ungesicherten Koordinaten erfinden.
- Keine leeren Pflichtfelder stehen lassen.
- Bei neuen Layoutbildern immer Datei, relativen Pfad und Alt-Text gemeinsam pflegen.
