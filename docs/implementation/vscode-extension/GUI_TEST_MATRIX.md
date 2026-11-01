# INTERLIS VS Code – verbindliche GUI- und Integrationsmatrix

**Version 1.0 · 1. November 2026**  
Gilt zusammen mit [EXECUTION_PLAN.md](EXECUTION_PLAN.md), dessen Abnahmekriterien und [FEATURE_AUDIT.md](FEATURE_AUDIT.md). Dies ist eine **Spezifikation noch auszuführender Tests**, kein Testprotokoll. Sämtliche 42 Szenarien haben einen echten Benutzerpfad und ein prüfbares Ergebnis.

## 1. Was hier als GUI-Test zählt

Eine aus dem bezeichneten Core-/Extension-Commitpaar gebaute VSIX wird in einem **isolierten echten VS Code Desktop** installiert. Der Server ist der zugehörige reale Java-LSP aus dem gepinnten Bundle. Maus, Tastatur, Command Palette, Explorer, Editor, Problems und Webview werden durch einen GUI-Treiber bedient. Primär: ExTester/Selenium mit kompatibel gepinntem VS Code und ChromeDriver. Linux darf Xvfb verwenden: Es bleibt eine echte Electron-Workbench. Ein Test mit einer selbstgebauten HTML-Imitation ist keine Alternative.

`@vscode/test-electron` und `vscode.executeDefinitionProvider` bleiben gute **zusätzliche Integrationstests**, sind aber allein keine GUI-Abnahme. Ebenso wenig genügen JSDOM, ein Mock-LanguageClient, ein Renderer mit erfundenem Graph als einziger End-to-End-Eingabe, ein Screenshot ohne Assertion oder direktes Aufrufen von `controller.dragNode()`.

Die Testumgebung darf Dateien und Konfiguration vorbereiten, Ergebnisse auslesen und eigene Testlogs schreiben. Die zu prüfende Benutzeraktion darf sie nicht über versteckte Produktfunktionen ersetzen. Für Webview-Elemente sind öffentlich sichtbare Buttons, ARIA-Namen und stabile `data-testid`-Attribute zulässig. **Keine produktiven Testcommands**, die beliebige Änderungen, Exporte oder Erfolgsmeldungen ohne Benutzerpfad ausführen.

## 2. Kleine Testarchitektur – Klassen und Methoden

Die folgenden Klassen liegen unter `EXT_DIR/test/gui`, nicht im Produktbundle. Bei gleicher vorhandener Funktion keinen zweiten Wrapper bauen.

| Klasse | Vertrag und vorgesehene Methoden |
|---|---|
| `GuiRunEnvironment` | `prepare(artifact, fixture, options)`, `start()`, `stop()`: eigene user-data-/extensions-/workspace-Verzeichnisse, VSIX- und Serverhash, gepinnte Tools; Prozessbaum nur eigener Instanz beenden. |
| `WorkbenchPage` | `openFile(path)`, `executePalette(title)`, `openProblems()`, `openOutline()`, `reloadWindow()`: echte Workbench-Elemente, sichtbare Bereitschaft abwarten. |
| `SourceEditorPage` | `type(text)`, `press(keys)`, `selectRange(range)`, `hoverAt(position)`, `readText()`, `isDirty()`, `cursor()`: W3C-Key-/Pointeraktionen; Textlesen als Orakel, kein Edit per JS-Eval. |
| `ProblemsPage` | `entries()`, `openDiagnostic(code)`, `openRelatedLocation(label)`: sichtbare Problems-Zeilen/RelatedInformation und tatsächliche Editornavigation prüfen. |
| `DiagramPage` | `waitForDocument()`, `node(id)`, `edge(id)`, `dragNode(id, delta)`, `dragRouteHandle(id, handle, delta)`, `toggleFilter(path)`, `setLayoutOption(name,value)`, `readViewGeometry()`: im wirklichen Webview arbeiten; Drag mittels Pointer down/move/up. |
| `ExportDialogPage` | `chooseFormat(format)`, `setDestination(path)`, `accept()`, `cancel()`: tatsächlicher VS-Code-Savedialog. Ein einfacher VS-Code-Dateidialog darf im isolierten Testprofil aktiviert werden, ohne Nutzerkonfiguration zu ändern. |
| `ArtifactInspector` | `assertSvg(path, expected)`, `assertPng(path, expected)`, `assertGraphml(path, expected)`, `assertDocx(path, expected)`: Bytes, Parser und inhaltliche Orakel; kein Dateiendungscheck als Erfolg. |
| `GuiEvidenceRecorder` | `begin(caseId, identities)`, `capture(name)`, `recordAction(...)`, `finish(outcome)`: Screenshots, Assertions, tatsächliche Exits, Laufzeiten und Belegverweise. Kein pauschales PASS bei erzeugtem Screenshot. |

Ein lesender DOMzugriff zum Messen von `getBoundingClientRect`, SVG-Pfaden, `viewBox`, gerendertem Text oder ARIA-Zustand ist erlaubt. Geometrie vor/nach echter Interaktion messen. Produktzustand nicht mittels Eval verändern. Exportprüfungen dürfen gespeicherte Dateien mit Java/Node auswerten. Kein Python.

### Bereitschaft statt Schlafen

Auf sichtbaren Serverstatus, passende Dokumentrevision, Diagrammstatus und ausgeschalteten Layoutspinner warten. Bounded waits mit genauer Fehlermeldung. Kein beliebig langer `sleep`, der ein Rennen verdeckt. Bei Drag Koordinaten aus dem aktuellen Bounding-Rect und Viewport bestimmen; keine für einen Entwicklerbildschirm fest codierten Pixel. Screenshot darf nicht aus einem früheren Lauf übernommen werden.

## 3. Fixtures und fachliche Orakel

V0 erzeugt kleine, lesbare, versionierte `.ili`-Fixtures. Sie werden mit der tatsächlichen Java-Engine geprüft. Neue synthetische Modelle nicht allein deshalb als gültig deklarieren, weil eine Referenzextension einen Graph zeichnet. Der Originalcompiler bleibt eine zusätzliche Referenz, nicht der alleinige Normentscheider.

| Fixturefamilie | Enthaltene Fälle |
|---|---|
| `editor-basic` | Gültiges 2.3-/2.4-Modell, echte Syntax-/Typfehler, Warnung, strukturierte Kommentare und Metaattribute. |
| `workspace-imports` | Offener Root, offener ungespeicherter Import, geschlossener Import, nicht importierter Fehlernachbar, Mehrdeutigkeit; lokale Testrepositoryindizes mit transitiver Kette und kontrolliertem HTTP-Server. |
| `rename` | Deklaration, END, qualifizierte Referenzsegmente, Constraints/Funktionen/Views, EXTENDED, mehrere Dateien; kein Text-/Kommentarersatz. |
| `uml-core` | MODEL/TOPIC, gleiche einfache Klassennamen in unterschiedlichen Scopes, Vererbung, Strukturkomposition, Domain/Enum, Constraint, View, binäre und n-äre Assoziation mit eigenen Attributen, Selbstbeziehung und mehrere Kanten zwischen denselben Endpunkten. |
| `uml-imports` | Direkter und indirekter Import, tatsächlicher nicht auflösbarer externer Bezug, read-only Quelle, partielle Projektion. Unbekanntes nicht als bestätigte vollständige Semantik ausgeben. |
| `unicode-security` | CRLF, Tabs, Umlaute, Emoji vor Ankern; Zeichenfolgen mit `<`, `&`, Quotes, ESC, Bidi; manipulierte Webviewmessages nur im separaten negativen Sicherheitstest. |
| `documentation` | Abstrakte und konkrete Vererbung, rekursive Strukturen, FORMAT-/Geometrietypen, enum/constraints, Kommentare, benannte Rollen, vier Beschriftungssprachen. |
| `performance` | Deterministisch erzeugte gültige kleine/mittlere Modelle gemäss Planbudget; Generatorsource im Test, keine Magic-Zähler im Produkt. |

Vorhandene echte Quellen zusätzlich verwenden, insbesondere das unveränderte Office-Original im Core unter `testdata/cli-modernization/original/SO_AGI_DataCatalog_Base_20260529.ili`, soweit im aktuellen Checkout vorhanden. Erwartung bleibt die bestehende Compilerentscheidung; es ist ein **Negativ- und Darstellungsfall**, kein Anlass zur Modelländerung oder neuen Norminterpretation. Die erste Revision der Kernfixtures erhält einen Hash. Kein Produktionssonderfall für deren Modell-/Klassennamen.

## 4. Szenarien V0 – installierter vertikaler Pfad

### GUI-01 – Installation, Aktivierung und eigener Sprachserver
**Aktion:** Frische Testinstanz, neue VSIX installieren, `.ili` über Explorer öffnen.  
**Orakel:** Extension aktiviert, eigenes Serverbinary startet, stdout bleibt Protokoll, Sprache stimmt, Status wird bereit. Server-/VSIXhash stimmt mit Produktpaar. Keine alte INTERLIS-Extension oder ein Development-Classpath liefert die Funktion.  
**Beleg:** Workbenchscreenshot, installierte Extension-ID/-Version, Serverstartlog mit PID/Artefakthash ohne Secrets. **Fällig ab V0.**

### GUI-02 – Tippen, Problems und Korrektur
**Aktion:** Im Editor einen echten Fehler in einer gültigen Quelle tippen, Problems öffnen und den Fehler wählen; Fehler durch Tastatureingabe korrigieren.  
**Orakel:** Passende Diagnose erscheint, Klick navigiert zum echten Bereich, korrigierte Version entfernt den Fehler. V0 darf noch Baselineprosa haben, ab V1 gelten verständliche Texte/RelatedInformation.  
**Beleg:** Vorher-/Nachherscreenshots, Dokumentversionen und tatsächliche Problems-Einträge. **Fällig ab V0.**

### GUI-03 – Formatierung und Neustart ohne Datenverlust
**Aktion:** Im gültigen Modell eine Referenz per F12 aufrufen; unformatierten Text schreiben, „Format Document“ auslösen, Undo, Redo; Serverrestart über vorgesehenen Command.  
**Orakel:** F12 landet an der richtigen Deklaration; Text bleibt semantisch gleich; Undo/Redo funktioniert; ungespeicherter Text und aktive Datei bleiben beim Restart bestehen, Diagnosen werden neu aktuell. Keine verwaisten Java-Prozesse nach Testende. **Fällig ab V0.**

## 5. Szenarien V1 – LSP-/Editorbasis

### GUI-04 – DE/EN-Diagnosen und verwandte Deklaration
**Aktion:** Namenskonfliktmodell öffnen, Diagnosesprache wechseln, in Problems die verwandte Quellstelle öffnen.  
**Orakel:** Code/Severity/Range gleich, richtige DE-/EN-Prosa, kein `diagnostic.semantics...`-Dump, echte zweite Deklaration statt fixem Zeilenwert; ANSI-Escapes fehlen. **Fällig ab V1.**

### GUI-05 – Hover und F12 im ungespeicherten Modell
**Aktion:** Deklaration im offenen Buffer ändern, auf qualifizierte Segmente hovern und F12 benutzen.  
**Orakel:** Symbolart, Dokumentation und Ziel stammen aus dem aktuellen zulässigen Snapshot; passende Segmente führen zu Modell/Topic/Typ. Keine alte On-Disk-Quelle überschreibt den Buffer. **Fällig ab V1.**

### GUI-06 – Referenzen über offene und geschlossene Quellen
**Aktion:** „Find All References“ für ein verwendetes Symbol öffnen, Treffer in einer geschlossenen Datei auswählen.  
**Orakel:** Sichtbare Fundliste umfasst tatsächliche semantische Treffer, keine gleichlautenden Kommentare/Strings/unimportierten Namen. Geschlossene Datei öffnet am richtigen Bereich. **Fällig ab V1.**

### GUI-07 – Projektweites Rename und Undo
**Aktion:** F2 auf Referenz, neuen Namen eingeben, tatsächliche Vorschau/Änderung bestätigen; danach Undo.  
**Orakel:** Deklaration, END und Referenzen mehrerer editierbarer Dateien korrekt, qualifizierte Präfixe bleiben; Undo stellt vorherigen Stand wieder her. Kollision oder read-only notwendige Änderung liefert keine Teilumbenennung. **Fällig ab V1.**

### GUI-08 – Rootprüfung ohne Fehler aus Nachbarmodellen
**Aktion:** Gültigen Root auswählen und „Compile Current Model“ auslösen, während ein unbenötigtes defektes Modell im Workspace liegt; danach dieses Modell ausdrücklich prüfen.  
**Orakel:** Root-Compile wird nicht durch fremden Fehler abgelehnt; dessen Workspace-Problems dürfen als solche weiterhin sichtbar bleiben. Zweiter Compile zeigt seinen tatsächlichen Fehler. Keine zweite CLI-Engine und kein Verlust offener Buffers. **Fällig ab V1.**

### GUI-09 – Transitive Imports, Offline und genaue Repositoryversion
**Aktion:** Modell mit zweistufigem Import aus kontrolliertem Testrepository öffnen, F12 in Import; Server neu starten, Offline einschalten, Quelle erneut öffnen.  
**Orakel:** Gleiche gepinnte Bytes/Quellstellen aus Cache, keine unkontrollierte neuere Version. Leerer Cache offline liefert konkreten Importfehler. Doppelte Kandidaten werden nicht alphabetisch „gelöst“. **Fällig ab V1.**

### GUI-10 – Externe Quelle bleibt read-only
**Aktion:** Repositoryziel per F12 öffnen; Text eintippen/Rename versuchen und Diagramm-/Hoverkontext abrufen.  
**Orakel:** Quelle ist sichtbar, inhaltsidentisch und nicht editierbar. Öffnen darf ihren Ursprung nicht in Workspace-Datei verwandeln. Keine Cachemutation, kein unbemerktes Kopieren in Benutzerprojekt. **Fällig ab V1.**

### GUI-11 – Outline, Faltung, Completion und Semantic Tokens
**Aktion:** Outline aufklappen, Modell→Topic→Klasse→Attribut wählen; Block/Kommentar falten; Completion an qualifiziertem Typ annehmen; Theme wechseln.  
**Orakel:** Hierarchie wirklich verschachtelt, Auswahl richtig, Scope-/Version-gerechte Kandidaten, nur passendes Namenssegment ersetzt. Semantic Tokens ergänzen TextMate, Kommentare/Metaattribute bleiben sinnvoll. **Fällig ab V1.**

## 6. Szenarien V2 – erste echte UML-Interaktion

### GUI-12 – Modell zu echter interaktiver Ansicht
**Aktion:** Reales `uml-core` öffnen, „Show Diagram“ über Editorcommand; auf fertige Ansicht warten.  
**Orakel:** Richtiger Java-`DiagramDocument` und Snapshot, echte Sprotty-Views, Modell-/Topiccontainer und alle erwarteten Typ-/Beziehungskategorien. Kein statisches Ersatzbild. **Fällig ab V2.**

### GUI-13 – Knoten und Container mit der Maus bewegen
**Aktion:** Knoten um sichtbare Strecke ziehen; anschliessend Topicrahmen mit Kindern ziehen.  
**Orakel:** Geometrie und inzidente Kanten reagieren, Kindkoordinaten bleiben relativ korrekt; `.ili`-Bytes, Buffertext und Dirtyzustand ändern sich **nicht**. Screenshot vor/nach, gemessene Positionen. **Fällig ab V2.**

### GUI-14 – Kantenführung bearbeiten
**Aktion:** Kante auswählen, sichtbaren inneren Routinghandle ziehen; andere Kante mit denselben Endpunkten kontrollieren.  
**Orakel:** Route tatsächlich geändert, Endpunktsymbole/Beziehungsbedeutung unverändert, andere Kante nicht versehentlich verändert. Kein Ziehen auf anderes Klassenziel als semantisches Reconnect. Source unverändert. **Fällig ab V2.**

### GUI-15 – Symbolgenaue Diagramm→Quellnavigation
**Aktion:** Klasse, Attribut und Assoziation im Webview anklicken und Navigation auslösen.  
**Orakel:** Passende reale URI und UTF-16-Range; gleiche einfache Namen führen nicht zum falschen Scope. CRLF/Emoji vor Anker korrekt. Eine Dragbewegung löst nicht anschliessend einen versehentlichen Navigationsclick aus. **Fällig ab V2.**

### GUI-16 – N-äre Assoziation, Endnotation und Selbstbeziehung
**Aktion:** Fixture mit drei Rollen, eigenen Assoziationsattributen, Komposition und Selbstkante anzeigen; Details auswählen.  
**Orakel:** Kein Verlust von Rolle/Attribut/Multiplicity, keine falsche binäre Reduktion. Diamanten stehen am fachlich richtigen Ende. Selbstkante sichtbar; Endlabels kollidieren nicht unlesbar. Daten- und Bildassertion gemeinsam. **Fällig ab V2.**

### GUI-17 – Liveänderung und verspätete Antwort
**Aktion:** Editor neben Diagramm; Attribut hinzufügen, schnell wieder ändern; Layoutantwort im kontrollierten Testtransport verzögern, nicht synthetisch erfolgreich beantworten.  
**Orakel:** Nur aktuelle Generation gewinnt. Alte Ansicht klar stale/partial markiert, kein stiller Rücksprung. Verschobener unveränderter Knoten behält Position. Alte Navigationsanker werden geprüft oder abgelehnt. **Fällig ab V2.**

### GUI-18 – Explizite Datei, Pinning und parallele Panels
**Aktion:** Diagramm für A öffnen, Editor B aktivieren; zweites Diagramm B öffnen; zwischen beiden wechseln.  
**Orakel:** A bleibt standardmässig an A gebunden, B an B; dokumentierter Follow-Active-Modus nur bei ausdrücklicher Aktivierung. Kein Quell-/Layout-/Snapshotzustand zwischen Panels. **Fällig ab V2.**

## 7. Szenarien V3 – UML-Parität und Exporte

### GUI-19 – Filterbaum, All/None/Reset und leere Ansicht
**Aktion:** Klassen, Strukturen, Domains, Views und Assoziationen einzeln schalten; All, None, Reset bedienen.  
**Orakel:** Knoten/Kompartimente/Kanten konsistent; None zeigt erklärten Leerzustand mit Zugang zu Filtern, keine endlose Ladeanzeige. Filter ändern keine Modellsemantik. **Fällig ab V3.**

### GUI-20 – Direkte/indirekte Imports und externe Stubs
**Aktion:** Importmodelle anzeigen, indirekte ausblenden, letzte sichtbare Referenz auf externen Stub verbergen.  
**Orakel:** Richtige Core-projizierte direkte/indirekte Mengen; Stub verschwindet mit letzter sichtbarer Kante. Leere Container verschwinden nachvollziehbar; Show stellt Positionen wieder her. **Fällig ab V3.**

### GUI-21 – Kompartimente, Vererbung und Beschriftungen
**Aktion:** OWN/NONE/OWN_AND_INHERITED, abstrakte Deemphasis, Constraints, Typen, Rollen-/Kardinalitätslabels und Inline-Enums schalten.  
**Orakel:** Geerbte Mitglieder mit korrektem Ursprung, keine doppelten IDs; Exaktheit von Multiplicity/Typen; sichtbare Auswahl wird im Export übernommen. Abstrakt bleibt auch ohne Farbe erkennbar. **Fällig ab V3.**

### GUI-22 – Layoutreset, Settle, Routing und Knotenanordnung
**Aktion:** Manuelle Positionen erzeugen; Settle, Reset Layout, Richtungs-/NodePlacement-Wahl und ORTHOGONAL/POLYLINE/SPLINES auslösen.  
**Orakel:** Settle erhält sinnvoll fixierte Nutzerpositionen; Reset hat eigenen klaren Umfang, verändert keine Filter; Orthogonal hat rechtwinklige Segmente; Splines sind echte Kurven, keine als SPLINES bezeichneten Polylinien. Labels/Container werden mitgeführt. **Fällig ab V3.**

### GUI-23 – Zoom, Scrollbalken, Tastatur und Fit
**Aktion:** Mausradzoom, Scrollbalkendrag, Pfeiltastenpan, Fit/Reset View; Fokus vorher/nachher prüfen.  
**Orakel:** Richtige Koordinatentransformation, begrenzter Pan, sichtbare Toolbar, keine unbedienbaren Endzustände. Editorpfeiltasten verschieben nicht das Diagramm ohne dessen Fokus. **Fällig ab V3.**

### GUI-24 – Eigener Layout-Undo/-Redo und Viewpersistenz
**Aktion:** Knoten ziehen, Kante verändern, Layout-Undo/-Redo; Panel verstecken/zeigen und Window Reload.  
**Orakel:** Nur Viewzustand wird rückgängig gemacht, Text-Undo separat; passende Positionen/Viewport/Filter nach Reopen, geänderte Symbole werden sicher abgeglichen. Veraltete IDs nicht durch Labelheuristik auf andere Symbole mappen. **Fällig ab V3.**

### GUI-25 – Quellselektion→Diagramm, Fokus und Nachbarschaft
**Aktion:** Cursor auf deklariertes/verwendetes Symbol, „Reveal in Diagram“, ausgewählten Bereich fokussieren, Nachbarschaftstiefe und übersetzte Labels wählen.  
**Orakel:** Symbolgebundene Highlights, Core-projizierte Umgebung/Tiefe, gültige Übersetzungszuordnung; Ursprung/Identität bleibt. Kein semantisches Editing. **Fällig ab V3.**

### GUI-26 – SVG-/PNG-Export und Cancel
**Aktion:** Ansicht filtern und verschieben; vollständige Ansicht und sichtbaren Viewport jeweils als SVG/PNG speichern; einen Export abbrechen.  
**Orakel:** Tatsächliche Dateien, XML/PNG-Decoder erfolgreich, Dimensionen/Clip/Ausschnitt stimmen, keine abgeschnittenen Labels, keine externen Ressourcen; Cancel schreibt nichts. „Vollständig“ bedeutet gesamte aktuelle gefilterte Diagrammfläche, nicht bloss Bildschirm und nicht heimlich ungefilterte Semantik. **Fällig ab V3.**

### GUI-27 – Inkscape-Connectoren, Kreuzungen und Exportparität
**Aktion:** INKSCAPE statt STANDARD für orthogonale/Polylineansicht wählen, GAPS/PLAIN umschalten und SVG exportieren; Splinevariante ebenfalls prüfen.  
**Orakel:** Korrekte Namespaces/Start-/Endreferenzen tatsächlicher Objekte, keine falschen Live-Connector-Versprechen für Bézierkurven. Kreuzungslücken ohne beschädigte Verbindungen. SVG erneut im echten Browser laden und mit dem Webview vergleichen; Parser- und Bildbelege. **Fällig ab V3.**

### GUI-28 – Themes, Accessibility und gefährliche Labels
**Aktion:** Hell/Dunkel/High-Contrast, Tastaturbedienung von Filtern/Toolbar; Modelle mit HTML-/URL-/Bidi-/Kontrollzeichen anzeigen.  
**Orakel:** Beschriftungen lesbar, keine funktionsentscheidende reine Farbcodierung, Fokusanzeige und zugängliche Namen; kein Script/unerlaubter Netzrequest/Command-URI. Sicherheitsprüfung umfasst generiertes SVG und HTML. **Fällig ab V3.**

## 8. Szenarien V4 – Editorparität und Dokumentation

### GUI-29 – Completion-Slots und gespiegelte Snippets
**Aktion:** MODEL, CLASS, DOMAIN, UNIT, VIEW TOPIC durch echte Suggestions/Enter/Tab aufbauen, Headerfelder ändern.  
**Orakel:** Richtige Reihenfolge, Name nur als Identifier hinter END, MODEL-Punkt, andere Blocksemikolons, kein END für DOMAIN/UNIT; finaler $0 ist normales Editieren. Scope-/Versions-Completion ersetzt korrekt; Header-Placeholder nicht von Suggestpopup überschrieben. **Fällig ab V4.**

### GUI-30 – Auto-Close beim Tippen und Ausschlussfälle
**Aktion:** Newline nach vollständigem mehrzeiligem Kopf, ABSTRACT/EXTENDS, VIEW TOPIC; Gegenfälle Kommentare/Strings/Metaattribute/Wertzuweisung und vorhandenes END.  
**Orakel:** Revisionsgebundener Java-Vorschlag, passende Einrückung/DEPENDS ON, kein doppeltes END; Cursor an dokumentierter Stelle, kein TS-Parser. Eine verspätete Antwort verändert neueren Text nicht. **Fällig ab V4.**

### GUI-31 – Sichere Quick Fixes und einzelnes Undo
**Aktion:** Fehlendes eindeutiges Semikolon, falschen END-Namen und nachweislich unbenutzten Import über sichtbare Glühbirne reparieren; anschließend Undo.  
**Orakel:** Nur exakte aktuelle Edits, kein Treffer in Kommentar/String, Importkommata/ganze IMPORTS-Zeile korrekt. Unvollständiger Analyseumfang bietet keinen gefährlichen „unused import“-Fix. Warningpolicy/Compile-Ergebnis nicht durch Editorlint verfälscht. **Fällig ab V4.**

### GUI-32 – Modellvorlage, Fehler und Abbruch
**Aktion:** Lokale/built-in und explizit konfigurierte HTTP-Vorlage wählen; kontrollierte Fehlerquelle/Cancel.  
**Orakel:** Neues ungespeichertes Dokument, kein Überschreiben vorhandener Datei, hilfreiche Meldung bei HTTP-/Grössenfehler, keine automatische Ausführung von Vorlageninhalt. Baselinevorlage läuft auch ohne Netz. **Fällig ab V4.**

### GUI-33 – Markdown-/HTML-Katalog in vier Sprachen
**Aktion:** Aktuellen Modellkatalog erzeugen, DE/EN/FR/IT-Beschriftungen und Headeroverride/Inheritancemodus wählen; Preview und Dateispeicherung.  
**Orakel:** Echte aktuelle Semantik, Modellnamen unverändert, richtige Tabellen/Typen/Strukturverweise, keine Rekursionsschleife; sicherer lokaler Preview ohne ungefragten Netzrenderer. Quellen-/Snapshotprovenienz angegeben. **Fällig ab V4.**

### GUI-34 – DOCX und rekursive Dokumentation
**Aktion:** DOCX über normalen Command/Savedialog erzeugen, zweiten Export abbrechen.  
**Orakel:** Gültiges ZIP/OOXML mit ContentTypes/Relationships/Worddocument, echte Tabellen/Überschriften/Typen; rekursive Struktur als begrenzter Verweis, alle erwarteten Klassen. Exportinhalt stammt nicht aus SVGtext oder eigenem ILIparser. Native Wordinstallation ist hierfür nicht Pflicht; ZIP-/OOXML- und Inhaltsprüfung sind es. **Fällig ab V4.**

### GUI-35 – Mermaid, PlantUML und GraphML
**Aktion:** Alle drei Formate per GUIcommand speichern, auch Modell mit n-ärer Assoziation und Sonderzeichen; Preview der zentralen UMLansicht daneben.  
**Orakel:** Syntax-/Strukturprüfung, enthaltene IDs/Rollen/Multiplicity, keine still verlorene Semantik. Bewusste formatbedingte Begrenzungen sichtbar. Keine alten GLSP-/Remote-PlantUML-Server starten. **Fällig ab V4.**

## 9. Szenarien V5 – tatsächliches Produkt und Widerstandsfähigkeit

### GUI-36 – Saubere Offlineinstallation ohne Quellrepos
**Aktion:** Gepackte VSIX in neuer Instanz ohne alte Repos, ohne installierte JVM im PATH installieren; Netzwerk für Produktfunktion sperren, lokale Modelle öffnen und UML exportieren.  
**Orakel:** Gebündelte Runtime, Server und UI funktionieren; kein Nachladen von `@ilic/*`/Altprojekt/Browserskript/Compiler. Vorab für Testharness benötigte VSCode-/Driverdownloads getrennt. **Fällig V5.**

### GUI-37 – Workspace Trust und sichere Konfiguration
**Aktion:** Untrusted Workspace mit bösartigen Java-/Serverpfadsettings öffnen, Trust explizit erteilen, dann normalen Ablauf ausführen.  
**Orakel:** Im eingeschränkten Modus nur zugesagte passive Sprachressourcen, keine Workspace-gesteuerte Code-/Netzausführung; Trustübergang gezielt initialisiert. Benutzer- und Workspacepfade/Remoteauthority korrekt getrennt. **Fällig V5.**

### GUI-38 – Crash, Startfehler und inkompatibles Bundle
**Aktion:** Eigenen Testserver beenden, Restartcommand; gesondert ungültigen Runtimepfad bzw. absichtlich inkompatibles Bundle in isolierter Testkopie konfigurieren.  
**Orakel:** Verständlicher Status/Output, bounded retries, kein stiller alter Compilerfallback. Dirtybuffer bleibt, nach Wiederherstellung neue ServerInstance/Snapshots, alte Antworten/Anker verworfen. **Fällig V5.**

### GUI-39 – Multi-root und tatsächlicher Remotehost
**Aktion:** Zwei Ordner im gleichen Modellraum; Datei in zweitem Ordner referenzieren, Ordner entfernen/hinzufügen. Zusätzlich reale lokale VS-Code-UI an autorisierten Linux-Remote/Container anschliessen und Modell/UML/Export öffnen.  
**Orakel:** Dokumentierte shared-model-space-Semantik, keine stille Auswahl doppelter Modelle; Server/Runtime tatsächlich im Workspacehost, Webviewnavigation/Exportpfade richtige Authority. Reiner lokaler Prozess mit `remote=true` zählt nicht. **Fällig V5.**

### GUI-40 – Schnelle Edits, Cancel und belastete Ansicht
**Aktion:** Deterministische schnelle Eingabefolge, Layout für mittleres Modell starten und abbrechen, danach kleine aktuelle Anfrage.  
**Orakel:** UI bleibt benutzbar, aktuellste Version gewinnt, Abbruch endet kontrolliert, kein dauerhaft blockierter Worker. Budgets aus Plan/Kandidatmanifest messen, nicht nach Lauf lockern. Teilansicht ehrlich gekennzeichnet. **Fällig V5.**

### GUI-41 – Wiederholtes Öffnen/Schliessen und Zustandsgrenzen
**Aktion:** Mindestens 20 Panel-/Dokument-Open/Close-Zyklen, Settingswechsel, Windowreload; dabei zwei Dateien mit gleichen Namen in verschiedenen Ordnern.  
**Orakel:** Keine anwachsende Zahl Server/Worker/Listener/Panels, kein fremder Layoutzustand; begrenzte Speicher-/Ressourcenbeobachtung. Nutzerdateien und globale Settings unverändert. **Fällig V5.**

### GUI-42 – Plattform- und Harness-Negativprobe
**Aktion:** Auf jedem Pflicht-OS die neue Distribution aus Unicode-/Leerzeichenpfad starten; eine separate Testkopie mit fehlendem Server oder bewusst unerfüllbarer sichtbarer Knotenerwartung prüfen.  
**Orakel:** Positivpfad inklusive echter GUI auf macOS arm64/Linux x64/Windows x64 funktioniert. Negativpfad endet tatsächlich ungleich 0 und nennt fehlende Voraussetzung/Assertion. Kein Harness-PASS bei null Tests, alten Screenshots oder falschem Kandidaten. **Fällig V5.**

## 10. Selektion je Phase und Plattform

| Phase | Fällige GUI-Szenarien auf primärer Plattform | Warum nicht alles? |
|---|---|---|
| V0 | GUI-01–03 | Erst vertikalen echten Host prüfen. Noch kein behauptetes UML. |
| V1 | GUI-01–11 | Text-/Repository-/Diagnosesemantik vollständig im neuen Host. |
| V2 | GUI-12–18 plus GUI-02/05/07 | UMLbasis und betroffene Sprach-/Revisionsgrenzen. |
| V3 | GUI-12–28 plus GUI-02/07 | Vollständiger UMLpfad, nicht sämtliche unberührte Compilerkorpora. |
| V4 | GUI-29–35 plus GUI-04/07/12/17/26 | Editorhilfen/Exporte und deren unmittelbare Consumer. |
| V5 | GUI-01–42 | Gesamte neue Oberfläche am endgültigen Produktpaar. |

**V5 Crossplatform-Smoke auf Linux x64 und Windows x64:** GUI-01,02,05,07,10,12,13,14,18,19,23,26,29,34,36,38,42. Diese Auswahl ist kleiner als die primäre Gesamtmatrix, enthält aber reale Webviewinteraktion, native Pfade, UTF-8, Artefakte und Startverhalten. Pro Plattform einen tatsächlich installierten passenden VSIX-/Runtimehash ausweisen.

**Remote zusätzlich:** GUI-39 auf mindestens einem echten autorisierten Linux-Remote/Dev-Containerhost, einschliesslich Teilpfaden von GUI-02/12/15/26. Remotequalifikation darf nicht durch ein rein lokales Browserbild ersetzt werden.

Auf der primären Plattform dürfen unveränderte Szenarien beim unabhängigen Review anhand frischer Rohbelege desselben Produktpaars verifiziert werden, **aber** der Reviewer muss pro Phase die geänderten risikotragenden GUIpfade selbst neu ausführen und mindestens eine neue eigene Variante entwickeln. V5: eigener vollständiger Smoke mit Installation, Editor, Node-/Route-Drag, Filter, Export und Neustart plus zwei neue übergreifende Gegenproben. Kein neuer Gesamtreport aus alten Logs.

## 11. Belege, Unabhängigkeit und GUI-Blocker

Je Lauf speichern: beide vollständigen Commit-SHAs, Baselines, Dirty-Status vorher/nachher, VSIX-/Server-/UI-/Runtimehash, VSCode-/Driver-/Harnessversion, Betriebssystem/Architektur, Fixturehash, Case-ID, exakte Aktionen/Assertions, tatsächlicher Exit, Screenshots und Log-/Tracepfade. Mindestbilder bei Erfolg: Workbench mit Problems; Diagramm vor/nach Node-Drag; vor/nach Routing; Filterleerzustand; Exportvorschau; bei V5 Plattformstart. Fehler immer bildlich und textuell sichern.

Reviewer muss die relevanten Bilder **ansehen**, nicht nur Dateiexistenz oder Dateigrösse prüfen. Rote Flaggen: leere Panels, abgeschnittene Beschriftungen, überlappende unlesbare Rollenlabels, verborgenes falsches Modell, nicht sichtbare fokussierte Controls. Eine bestandene DOMassertion macht einen unbrauchbaren Screenshot nicht akzeptabel.

Fehlt Display, passende VS-Code-/Driverausführung, Webviewzugriff oder Remote-/Pflichtplattformberechtigung: `BLOCKED (INFRA)` für die fälligen Kriterien. Nicht heimlich GUI durch APItests ersetzen. Keine globale Entsperr-/Accessibility-/Antiviruseinstellung ändern, keinen bestehenden Nutzereditor übernehmen. Erforderliche Betriebssystemfreigabe konkret benennen; die nächste Phase bleibt bis zur tatsächlichen Abnahme gesperrt.
