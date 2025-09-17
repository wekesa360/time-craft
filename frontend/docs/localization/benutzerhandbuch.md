# Deutsches Lokalisierungs-Benutzerhandbuch

Willkommen zum umfassenden Benutzerhandbuch für die deutschen Lokalisierungsfunktionen in TimeCraft. Dieses Handbuch hilft Ihnen dabei, alle sprachbezogenen Funktionen der Anwendung zu verstehen und zu nutzen.

## Inhaltsverzeichnis

1. [Erste Schritte](#erste-schritte)
2. [Sprachwechsel](#sprachwechsel)
3. [Spracheinstellungen](#spracheinstellungen)
4. [Deutsche Besonderheiten](#deutsche-besonderheiten)
5. [Barrierefreiheit](#barrierefreiheit)
6. [Leistungsmerkmale](#leistungsmerkmale)
7. [Fehlerbehebung](#fehlerbehebung)

## Erste Schritte

TimeCraft unterstützt mehrere Sprachen mit umfassender deutscher Lokalisierung. Die Anwendung erkennt automatisch die Spracheinstellung Ihres Browsers und stellt die Benutzeroberfläche entsprechend ein.

### Unterstützte Sprachen

- **Englisch (US)** - Standardsprache
- **Deutsch** - Vollständige Lokalisierung mit kulturellen Anpassungen

### Ersteinrichtung

Beim ersten Öffnen von TimeCraft:

1. Die Anwendung erkennt automatisch Ihre Browser-Sprache
2. Wenn Deutsch erkannt wird, wechselt die Benutzeroberfläche automatisch zu Deutsch
3. Sie können die Sprache jederzeit manuell über den Sprachselektor ändern

## Sprachwechsel

### Schneller Sprachwechsel

Der schnellste Weg, die Sprache zu ändern, ist die Verwendung des Sprachselektors in der oberen Navigation:

1. **Kompakter Selektor** (im Header): Klicken Sie auf die Sprachflagge/den Code (z.B. "DE" oder "EN")
2. **Dropdown-Menü**: Wählen Sie Ihre bevorzugte Sprache aus dem Dropdown-Menü
3. **Button-Variante**: Klicken Sie auf den Sprachbutton in den Einstellungen

### Sprachselektor-Varianten

TimeCraft bietet drei verschiedene Sprachselektor-Stile:

#### 1. Dropdown-Selektor (Standard)
- **Ort**: Einstellungsseite, Lokalisierungsseite
- **Funktionen**: 
  - Zeigt Sprachname und nativen Namen
  - Flaggen-Icons zur visuellen Identifikation
  - Ladezustände während Sprachwechseln
  - Barrierefreiheit mit Tastaturnavigation

#### 2. Kompakter Selektor
- **Ort**: Hauptnavigation im Header
- **Funktionen**:
  - Minimaler Platzbedarf
  - Schneller Zugriff
  - Zeigt aktuellen Sprachcode und Flagge

#### 3. Button-Selektor
- **Ort**: Einstellungsbereiche
- **Funktionen**:
  - Nebeneinander liegende Sprachbuttons
  - Visuelles Feedback für aktuelle Auswahl
  - Sofortiger Wechsel ohne Dropdown

### Sprachwechsel-Prozess

Wenn Sie die Sprache wechseln:

1. **Sofortige UI-Aktualisierung**: Oberflächentext ändert sich sofort
2. **Zustandserhaltung**: Ihre aktuelle Seite und Formulardaten bleiben erhalten
3. **Sanfte Übergänge**: Animierte Übergänge bieten visuelles Feedback
4. **Cache-Aktualisierung**: Neue Sprachübersetzungen werden für schnelleren zukünftigen Zugriff zwischengespeichert
5. **Einstellungen speichern**: Ihre Sprachwahl wird in Ihrem Profil gespeichert

## Spracheinstellungen

### Zugriff auf Spracheinstellungen

Navigieren Sie zu den Spracheinstellungen über:

1. **Einstellungsseite**: Einstellungen → Sprachbereich
2. **Lokalisierungsseite**: Direkter Zugriff über das Navigationsmenü
3. **Benutzerprofil**: Kontoeinstellungen → Spracheinstellungen

### Spracheinstellungen

#### Aktueller Sprachstatus
- Zeigen Sie Ihre aktuell ausgewählte Sprache an
- Sehen Sie den Abdeckungsgrad der Sprache in Prozent
- Überprüfen Sie den Zeitstempel der letzten Aktualisierung für Übersetzungen

#### Sprachauswahloptionen
- **Hauptsprache**: Ihre primäre Oberflächensprache
- **Fallback-Sprache**: Sprache, die verwendet wird, wenn Übersetzungen fehlen (normalerweise Englisch)
- **Auto-Erkennung**: Automatische Spracherkennung vom Browser aktivieren/deaktivieren

#### Regionale Einstellungen
- **Datumsformat**: Lokalisierte Datumsformatierung (TT.MM.JJJJ für Deutsch)
- **Zahlenformat**: Regionale Zahlenformatierung (1.234,56 für Deutsch)
- **Zeitformat**: 24-Stunden-Format-Präferenz

### Übersetzungsabdeckung

Jede Sprache zeigt ihre Übersetzungsabdeckung:
- **100%**: Vollständig übersetzt
- **90-99%**: Nahezu vollständig mit geringfügigen Lücken
- **<90%**: Teilweise Übersetzung mit englischen Fallbacks

## Deutsche Besonderheiten

### Textlayout-Optimierungen

Deutsche Texte benötigen oft mehr Platz aufgrund von zusammengesetzten Wörtern. TimeCraft beinhaltet:

#### Responsive Textbehandlung
- **Automatischer Textumbruch**: Lange deutsche Wörter brechen angemessen um
- **Dynamische Abstände**: Oberflächenelemente passen sich an längeren Text an
- **Unterstützung für zusammengesetzte Wörter**: Ordnungsgemäße Behandlung deutscher Komposita

#### Typografie-Verbesserungen
- **Schriftoptimierung**: Schriften ausgewählt für deutsche Zeichenunterstützung
- **Zeilenhöhen-Anpassung**: Optimiert für deutsche Textlesbarkeit
- **Textkontrast**: Verbesserter Kontrast für deutsche Sonderzeichen (ä, ö, ü, ß)

### Kulturelle Anpassungen

#### Datums- und Zeitformate
- **Datumsformat**: TT.MM.JJJJ (z.B. 15.03.2024)
- **Zeitformat**: 24-Stunden-Format (z.B. 14:30)
- **Wochenbeginn**: Montag als erster Wochentag

#### Zahlenformatierung
- **Dezimaltrennzeichen**: Komma (,) statt Punkt
- **Tausendertrennzeichen**: Punkt (.) oder Leerzeichen
- **Währung**: Euro (€) Formatierung

### Deutsche Grammatik-Unterstützung

#### Ordnungsgemäße Groß-/Kleinschreibung
- **Substantiv-Großschreibung**: Automatische Großschreibung deutscher Substantive
- **Formelle Anrede**: Ordnungsgemäße Sie/Du-Behandlung in Oberflächentexten
- **Geschlechtsneutrale Sprache**: Inklusive Sprachoptionen wo angemessen

## Barrierefreiheit

### Screenreader-Unterstützung

#### Deutsche Sprachansagen
- **Sprachwechsel**: Screenreader kündigen Sprachwechsel an
- **Inhaltsvorlesung**: Ordnungsgemäße deutsche Aussprache und Intonation
- **Navigationslabels**: Deutsche Labels für alle interaktiven Elemente

#### ARIA-Labels
- **Deutsche Beschreibungen**: Alle ARIA-Labels ins Deutsche übersetzt
- **Kontextinformationen**: Zusätzlicher Kontext für deutsche Benutzer
- **Formularlabels**: Umfassende deutsche Formularbeschriftung

### Tastaturnavigation

#### Deutsche Tastaturlayout-Unterstützung
- **Umlaute**: Ordnungsgemäße Unterstützung für ä, ö, ü, ß Zeichen
- **Tastenkombinationen**: Deutsche spezifische Tastenkombinationen
- **Tab-Navigation**: Logische Tab-Reihenfolge für deutsche Oberfläche

### Hoher Kontrast-Modus

#### Deutsche Text-Optimierung
- **Zeichensichtbarkeit**: Verbesserte Sichtbarkeit für deutsche Sonderzeichen
- **Textkontrast**: Optimierte Kontrastverhältnisse für deutschen Text
- **Farbkodierung**: Barrierefreie Farbschemata für deutsche Benutzer

## Leistungsmerkmale

### Übersetzungs-Caching

#### Automatisches Caching
- **Lokaler Speicher**: Deutsche Übersetzungen lokal zwischengespeichert für schnelleren Zugriff
- **Komprimierung**: Übersetzungsdateien komprimiert um Speicherplatz zu sparen
- **Intelligente Updates**: Nur aktualisierte Übersetzungen werden neu heruntergeladen

#### Cache-Verwaltung
- **Cache-Statistiken**: Cache-Leistung in Einstellungen anzeigen
- **Manuelle Aktualisierung**: Erzwungene Aktualisierung des Übersetzungs-Cache
- **Cache löschen**: Cache löschen bei Problemen

### Lazy Loading

#### Bedarfsgerechtes Laden
- **Komponenten-Laden**: Lokalisierungskomponenten laden nur bei Bedarf
- **Bundle-Splitting**: Deutsche Übersetzungen in separaten Bundles
- **Vorausladen**: Intelligentes Vorausladen wahrscheinlich benötigter Übersetzungen

### Leistungsüberwachung

#### Echtzeit-Metriken
- **Ladezeiten**: Übersetzungslade-Leistung überwachen
- **Cache-Trefferquote**: Cache-Effektivität verfolgen
- **Speicherverbrauch**: Speicherverbrauch von Übersetzungen überwachen

## Erweiterte Funktionen

### Übersetzungs-Fallbacks

#### Fallback-Hierarchie
1. **Angeforderte Sprache**: Deutsch (falls verfügbar)
2. **Fallback-Sprache**: Englisch (Standard)
3. **Schlüssel-Anzeige**: Roher Übersetzungsschlüssel (wenn alles andere fehlschlägt)

#### Behandlung fehlender Übersetzungen
- **Graceful Degradation**: Englischer Text für fehlende deutsche Übersetzungen
- **Protokollierung**: Fehlende Übersetzungen zur Verbesserung protokolliert
- **Benutzer-Feedback**: Option zum Melden fehlender Übersetzungen

### Offline-Unterstützung

#### Service Worker Caching
- **Offline-Zugriff**: Deutsche Übersetzungen offline verfügbar
- **Hintergrund-Sync**: Automatische Synchronisation bei wiederhergestellter Verbindung
- **Cache-First-Strategie**: Zwischengespeicherte Übersetzungen werden zuerst für Geschwindigkeit bereitgestellt

## Best Practices

### Für optimale Erfahrung

1. **Cache aktuell halten**: Regelmäßig Übersetzungs-Cache aktualisieren
2. **Probleme melden**: Feedback-System verwenden um Übersetzungsprobleme zu melden
3. **Tastenkombinationen verwenden**: Deutsche spezifische Shortcuts für Effizienz lernen
4. **Auto-Erkennung aktivieren**: App Ihre Sprachpräferenz erkennen lassen

### Leistungstipps

1. **Sprachen vorladen**: Vorausladen für häufig verwendete Sprachen aktivieren
2. **Cache löschen**: Cache löschen bei langsamer Leistung
3. **Nutzung überwachen**: Leistungsmetriken in Einstellungen überprüfen
4. **Regelmäßig aktualisieren**: App für neueste Übersetzungen aktuell halten

## Integration mit anderen Funktionen

### Aufgabenverwaltung
- **Deutsche Aufgabennamen**: Vollständige Unterstützung für deutsche Aufgabenbeschreibungen
- **Datumsformatierung**: Deutsche Datumsformate in Aufgabenplanung
- **Prioritätslabels**: Deutsche Prioritäts- und Statuslabels

### Gesundheitsverfolgung
- **Metrik-Namen**: Deutsche Namen für Gesundheitsmetriken
- **Zielsetzung**: Deutsche Zielbeschreibungen
- **Fortschrittsberichte**: Deutsche formatierte Fortschrittsberichte

### Kalender-Integration
- **Deutsche Kalender**: Deutsche Monats- und Tagesnamen
- **Feiertags-Unterstützung**: Deutsche Feiertage und Gedenktage
- **Ereignisbeschreibungen**: Deutsche Ereignis- und Terminbeschreibungen

### Fokus-Sitzungen
- **Deutsche Anweisungen**: Fokus-Sitzungsanweisungen auf Deutsch
- **Pausenerinnerungen**: Deutsche Pausen- und Ruheerinnerungen
- **Erfolgsmeldungen**: Deutsche Erfolgs- und Motivationsmeldungen

## Hilfe erhalten

### Support-Ressourcen

1. **In-App-Hilfe**: Hilfesystem innerhalb der Anwendung aufrufen
2. **Dokumentation**: Umfassende Dokumentation verfügbar
3. **Community-Forum**: Deutschsprachiger Community-Support
4. **Support kontaktieren**: Direkter Support auf Deutsch

### Feedback und Verbesserungen

#### Wie Sie Feedback geben können
1. **Übersetzungsprobleme**: Falsche oder fehlende Übersetzungen melden
2. **Feature-Anfragen**: Verbesserungen zur deutschen Lokalisierung vorschlagen
3. **Fehlerberichte**: Sprachbezogene Fehler melden
4. **Benutzererfahrung**: Feedback zur deutschen Benutzererfahrung teilen

#### Zu Übersetzungen beitragen
- **Community-Beiträge**: Helfen Sie, deutsche Übersetzungen zu verbessern
- **Review-Prozess**: An der Übersetzungsüberprüfung teilnehmen
- **Qualitätssicherung**: Helfen Sie beim Testen neuer deutscher Funktionen

---

*Dieses Benutzerhandbuch ist sowohl auf Englisch als auch auf Deutsch verfügbar. Wechseln Sie in den Spracheinstellungen zu Deutsch, um die deutsche Version dieser Dokumentation anzuzeigen.*