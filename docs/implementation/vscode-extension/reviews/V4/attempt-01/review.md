# Unabhängiger Review V4 – INTERLIS VS Code

## 1. Identität

**Phase / kumulative Abnahme:** V4 (Editorhilfen, Completion/Snippets/QuickFixes, Dokumentations- und Graph-Exporte). Die kumulative Prüfung bis V4 umfasst F01–F60 im erklärten Scope; F53/F54 (gebündelte Runtime, Plattform-/Remote-Matrix) bleiben V5 und sind hier keine V4-Fehler.

**Reviewer:** OpenCode `2.0.28`, Provider `deepseek`, API-Modell `deepseek-flash`, direkter Host `https://api.deepseek.com`.
Die aktuelle Modellkatalogauskunft dieser Session ordnet `deepseek/deepseek-flash` dem Anzeigenamen **DeepSeek V4.1 Flash 1017** zu; `phases/V4/model-preflight.json` bestätigt dieselbe Zuordnung und den Hash der offiziellen Preisseite (`5794123512…f515b`). Das Sessionprofil setzt `baseURL: https://api.deepseek.com`. Kein OpenRouter-/Go-/Zen-/Proxyfallback, keine Credentialdatei gelesen oder ausgegeben. Die Nachweise sind in `reviewer-model-identity.json` festgehalten.

| Identität | Wert |
|---|---|
| AssignmentBase | Core `20b0029d824b3602d9a304320bf0feae4c35c1f9`, Extension `73badd9807f407aea048d397af5549fe907a1501` |
| PhaseBase | Core `a0272965c4691320ca316d519581d4db4cefc930`, Extension `26743af31198ea0945093318742b8c83c741ce16` |
| Candidate / tatsächlicher HEAD | Core `668caa9a975ffac41a56880c9349a70ee3fdc788`, Extension `e38cfb73e781952ad8ae0b597d2e6ea5504ae717` |
| Tracked Zustand vorher/nachher | Core sauber; Extension tracked sauber. Einzige untracked Datei: `opencode.json` (Review-Runner-Konfiguration, kein Produktfile). |
| Installierte Extension | `edigonzales.interlis-vscode` `0.0.1`, Bundle `f631446e9cb7bf3bce987d36509eb7d560ed7a022b81a8431c5fe9937a1110e9` |
| Unabhängig gebautes VSIX | `7dd056b987c97f4feec52d1e94223a60578e4c251fa6d2d8c18351b5466985c0`; 75/75 entpackte Einträge byte-identisch zum bewahrten Kandidaten-VSIX `deca8f9b…fe584`. Containerhash differiert nur durch ZIP-Zeitstempel. |
| Server | `interlis-lsp` `39d34e79…b6e961`, `interlis-documentation` `1e4d4c4d…28d19fa`, `interlis-compiler` `30c817cd…d73c0`; Core-Commit im Bundle `668caa9…` |
| Schema/UI | `diagram-document-1.0.schema.json` `105e7eeb…6fc779`; `diagram-ui.tgz` `2dc6e90f…c403f7`; `adapter.cjs` `b1e8ac3a…c5f5` |
| Umgebung | macOS arm64, VS Code `1.140.0`, ExTester `8.28.1`, ChromeDriver `150.0.7871.250`, JDK Temurin `25.0.3` (Entwicklerruntime; V4 bündelt noch keine Runtime) |

Alle 60 im Request gelisteten Artefakte sind vorhanden und haben die dort angegebenen SHA-256-Werte. Der unabhängige Stage-Lauf erzeugte ein byte-identisches Lockfile und identische Hashes für 12 Server- und 47 Renderer-Dateien (`reviewer-build-verification.json`).

## 2. Eigene Ziel-, Code- und Architekturprüfung

Der Core-Diff `a0272965…668caa9` umfasst 39 Dateien (+4027/−17): reine Editorpläne (`EditorAssistanceService`, `EditorCompletions`, `EditorSyntax`, `MetaAttributeCatalog`), das neue Modul `interlis-documentation`, LSP-Transport für `interlis/editorAssist` und `interlis/export`, sowie Dokumentation. Der Extension-Diff `26743af3…e38cfb7` umfasst 19 Dateien (+747/−23): `src/editor/{assistance,snippets}.ts`, `src/commands/{documentation,templates}.ts`, Manifest/Keybindings, Fixtures, GUI-Harness und Berichte.

- **Eine Sprachautorität:** Completion, QuickFixes und Auto-Close-Pläne entstehen in Java aus `AnalysisSnapshot`/Syntax; die Extension führt nur native TextEdits, Snippets und Cursor aus. Ich habe keinen neuen TS-Parser, keine TS-Symboltabelle und keine Shell-Kompilierung der Diskdatei gefunden. `EditorAssist`-Verhandlung ist capabilitygebunden; ohne Verhandlung bleibt Standard-`onTypeFormatting` aktiv und der Customrequest wird abgewiesen.
- **Keine Altprojektabhängigkeit:** `npm run verify:no-legacy-dependencies` und der unabhängige Paketgraph sind grün; kein `@ilic/*`, kein `file:`/`workspace:`/Git-Link, kein WASM-Altpfad im aktiven Extensionpaket.
- **Eine Diagrammquelle:** V4 ändert den neutralen Renderer/Projektor nicht; die bestehende gemeinsame Quelle bleibt die Autorität. Die neuen Exporte konsumieren `DiagramDocument` über `DiagramProjectors`; es gibt keine zweite Semantik in TS.
- **Dokumentation:** `DocumentationProjector` arbeitet ausschliesslich auf `CompiledSchema`, ist unveränderlich, begrenzt Einträge/Text und stellt rekursive Strukturen als Referenzen dar. `LspExportService` prüft Format, Snapshot, Source-Revisionen und vollständige Kompilation; DOCX ist echtes OOXML, kein Text-ZIP.
- **Host:** `DocumentationCommands` prüft Serverinstanz, Dokumentversion, Snapshot und Format erneut, schreibt über temporäre Datei und verwirft veraltete Antworten. Template-Laden ist literal, grössen-/zeitbegrenzt, trust- und HTTPS-gebunden (HTTP nur Loopback-Test).
- **Gefundene Abweichung:** Der bestehende `MermaidRenderer` gibt die Vererbungskante als `source <|-- target` aus. Bei der realen GUI-35-Projektion ist `source=Child`, `target=Base`; Mermaid zeigt damit „Child <|-- Base“ (umgekehrte Vererbung), während PlantUML korrekt „Base <|-- Child“ und GraphML `source=Child,target=Base` liefert. Das ist ein fachlich falscher, stiller Export und wird als **V4-MERMAID-INHERITANCE** geführt.

## 3. Jede fällige Muss-AC

| AC-ID | Status | Eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|
| V4-01 | **erfüllt** | Java `EditorCompletionTest`/`EditorTemplateContractTest` (Teil der 66 Compiler-Tests, 0 Fehler); GUI-29 versions-/scope-gerechte Segmentersetzung; CP-SNIPPET automatische Suggestions | – |
| V4-02 | **erfüllt** | Authoring GUI-29/30; CP-SNIPPET: MODEL-Snippet, gespiegelter Name, `de`-Stop, Right verlässt Snippet, normales Tab, genau ein END, Disk unverändert | – |
| V4-03 | **erfüllt** | GUI-31 drei Fixes + je ein Undo; CP-QUICKFIX: vollständige Quelle bietet END-Fix, unvollständige Quelle bietet keinen unsafe Importlöschfix; 2 echte Fehler sichtbar | – |
| V4-04 | **erfüllt** | 8 Dokumentationstests; Katalog zeigt effektive/geerbte Member mit Origin, exakte Typen, Constraints, rekursive Referenz; Budgets greifen | – |
| V4-05 | **erfüllt** | GUI-33/34; 8 MD/HTML-Dateien, vier Labels, Headeroverride, ABSTRACT, OOXML mit 5 wohlgeformten Teilen, 4 Tabellen, kein Script/externer Href | – |
| V4-06 | **verletzt** | GUI-35/Artefaktprüfung: Mermaid `N5 <|-- N4` vs. PlantUML `N4 <|-- N5` vs. GraphML `Child→Base` | **V4-MERMAID-INHERITANCE** |
| V4-07 | **erfüllt** | Authoring 7/7; GUI-04/07 im frischen Comfort-Lauf; GUI-12/13/17 eigene UML-Gegenprobe 2/2; GUI-26 frischer V3-Subset 10/10; 18 Bilder tatsächlich angesehen | Der GUI-35-Oracle prüft die Vererbungsrichtung nicht; das ist Teil des V4-06-Findings. |
| V4-08 | **erfüllt** | 66 Compiler + 8 Docs + 74 LSP + 24 Bridge, 0 Fehler/Skips; TS-Build/Dependency/10 Unit/1 stdio; installierte Suites; keine neuen XFAIL/Disabled | Fehlende Richtungsassertion im Exporttest, Ursache V4-06. |
| V4-09 | **verletzt** | Unabhängige Prüfung und neue Gegenproben ausgeführt; ein gültiges PASS ist wegen V4-06 und des nicht-grünen Comfort-Pflichtlaufs nicht möglich | Prozess ausgeführt, Freigabe verweigert. |

## 4. Featureparität

Für V4 relevant und mit realem Benutzerpfad belegt:

- **F11/F15/F16:** kontextabhängige Completion, qualifizierte Segmentersetzung, 2.3/2.4-Slots, EXTENDS/LIST/BAG/FORMAT/UNIT/IMPORTS, Metaattributname/-wert. Java-Tests plus GUI-29 und CP-SNIPPET; keine zweite Client-Semantik.
- **F12–F14:** MODEL/TOPIC/CLASS/STRUCTURE/ASSOCIATION/VIEW/GRAPHIC/DOMAIN/UNIT/Role-Vorlagen, gespiegelte Namen, Tab/Enter/Endplatzhalter, Auto-END nur nach vollständigem Kopf. Authoring GUI-29/30 und CP-SNIPPET.
- **F18:** Semikolon-, END-Namen- und beweisbar unbenutzter Import-Fix, versionsgebunden, Undo; CP-QUICKFIX bestätigt die negative Grenze.
- **F47–F52:** CompiledSchema-Katalog, DE/FR/IT/EN-Labels, Headeroverrides, Inheritance-Modi, rekursive Strukturen, HTML/Markdown/DOCX, GraphML/Mermaid/PlantUML, sichere Vorschau/Speichern/Cancel.
- **F57/F58/F60:** CSP/escaped Texte, Grössen-/Zeitlimits, Cancellation, echte installierte GUI. F53/F54 bleiben ausdrücklich V5.

**Kumulativ bis V4:** Die bereits in V0–V3 abgenommenen F01–F10 und F19–F46 werden durch den V4-Diff nicht neu implementiert; die fälligen Regressionen GUI-04/07/12/17/26 und der V3-Subset GUI-19–28 wurden auf dem Kandidaten ausgeführt. F53/F54 (Runtimebündelung, Plattform-/Remote-Matrix) sind V5-Pflicht und werden hier nicht als V4-Fehler gewertet. Die neuen F11–F18/F47–F52-Pfade sind oben mit realen Benutzerpfaden belegt.

**Nicht als V4-Fehler gewertet:** Die GUI-35-Zentralansicht ist bewusst `PARTIAL`, weil andere Vorlagenpuffer offen sind. Die Grafik ist klein/weit herausgezoomt, aber der Status ist ehrlich; die Exportdateien stammen aus erfolgreichem CompileCurrent und vollständiger Projektion. Die HTML-Tabellen sind im schmalen Panel eng umbrochen, aber nicht horizontal abgeschnitten; das ist eine optionale UX-Beobachtung, kein Muss-Finding.

## 5. Risikobasierte Tests

| Gate/Case | Fällig warum / nicht fällig warum | Kommando/CWD | Exit / Tests / Fehler / Skips | Eigener Lauf oder geprüftes Artefakt | Rohbeleg |
|---|---|---|---|---|---|
| T0 Build/Artefakt | Neue Java-Module, LSP-Verträge, Lock, VSIX | `npm ci`; `stage-core --core-dir <detached>`; `package:vsix` in Scratch | 0; Lock identisch; 12+47 Hashes; 60/60 Request-Artefakte; 75/75 VSIX-Einträge identisch | eigener Lauf auf exaktem Paar | `logs/npm-ci.log`, `logs/stage-scratch.log`, `logs/package-scratch2.log`, `reviewer-build-verification.json` |
| T1 Java/Compiler | Neue Editorpläne/Queries, Doku-Projektion | `./gradlew` im Core, `--rerun-tasks` | 0; 66/66, 8/8, 74/74, 24/24; 0 Fehler/Skips | eigener Lauf | `logs/java-tests.log` |
| T1 Extension | Neue Host-/Editor-/Exportpfade | `npm run build`, `verify:no-legacy-dependencies`, `test:unit`, `test:protocol` | 0; 10/10 Unit, 1/1 echter stdio | eigener Lauf | `logs/ext-checks.log` |
| T2 LSP-Transport | EditorAssist/Export/Version/Cancel | im Java-LSP- und Extension-Protokolltest | 0; echter Paketprozess; sechs Formate; EditorAssist-Caret/Stale | eigener Lauf | `logs/java-tests.log`, `logs/ext-checks.log` |
| T3 Artefakt-/Safety | MD/HTML/DOCX/GraphML/Mermaid/PlantUML | `node evidence/build/verify-artifacts.cjs` | 29 Prüfungen; 28 grün, 1 rot (Mermaid-Richtung) | eigener Lauf | `reviewer-artifact-checks.json` |
| T4 GUI-29–35 | V4-Pflicht | Authoring-Suite mit installiertem VSIX | 0; 7/7 | eigener Lauf | `build/reports/gui/authoring/2026-11-02T11-13-42-875Z` |
| T4 GUI-04/07 | V4-Regression | Comfort-Lauf | GUI-04/07 je bestanden; Gesamtlauf 8/28, danach GUI-09-Timeout | eigener Lauf (Teil) | `build/reports/gui/comfort/2026-11-02T11-58-00-034Z` |
| T4 GUI-12/13/17 | V4-Regression | Eigene UML-Gegenprobe mit realer Webview | 0; 2/2 | eigener Lauf | `evidence/build/subset-custom-uml` |
| T4 GUI-26 | V4-Regression | V3-Subset der Produktsuite | 0; 10/10 | eigener Lauf | `evidence/build/subset-comfort-v3` |
| T4 Comfort vollständig | angefordertes Pflichtgate | `gui.cjs --suite comfort`, zweimal | **1; 8/28**; GUI-09 `analysisReady`-Timeout nach Offline-Restart; keine Java-Reste | eigener Lauf, nicht grün | `.../comfort/2026-11-02T11-58-00-034Z`, `.../12-00-35-629Z`, Logs |
| T4 Negativcanary | Harness muss scheitern | `--canary missing-status` | **1 erwartet**; GUI-01 scheitert an unmöglichem Status; 2/3 Fälle protokolliert | eigener Lauf | `build/reports/gui/smoke/2026-11-02T12-16-55-526Z` |
| T6 breite Compiler-/Korpus-/Safari-/Plattformmatrix | **nicht fällig:** keine Parser-/Binder-/Normänderung; V4 fügt Queries/Doku/Export hinzu. V5-Runtime/Plattform/Remote ist gesperrt. | – | – | – | – |

Keine Pythonaufrufe in diesem Review; verwendet wurden Node, Gradle, POSIX-Shell, `xmllint` und `unzip`. Der Comfort-Ausfall ist **kein** nachträglich entfernter Pflichtcheck. Zwei frische Versuche endeten am selben Punkt. Die Serverlogs zeigen nach dem Offline-Restart `didOpen` für `External.ili`, aber im 20-Sekunden-Fenster kein `interlis/analysisReady`; es bleibt offen, ob die Meldung zu spät kommt oder ausbleibt. Die für V4 geforderten Fälle 04/07/12/17/26 wurden separat ausgeführt und bestanden; der Gesamtlauf bleibt dennoch offen.

## 6. Echte GUI und Sichtprüfung

Installiert wurde in einem isolierten Profil das eigene VSIX mit `edigonzales.interlis-vscode` 0.0.1; der reale Java-LSP lief aus dem Bundle, es gab keine alten INTERLIS-Extensions und keine Development-Classpath-Funktion. Die GUI-Aktionen erfolgten über Explorer, Command Palette, echte Tastatur/Pointer-Events und native Save-Dialoge; keine Controller-/Eval-Ersatzaktion.

Tatsächlich mit dem Bildwerkzeug geöffnet und in `image-read-inventory.json` mit SHA-256 inventarisiert (18 Bilder):

- `GUI-29-model.png`: MODEL Demo (fr), VERSION, gespiegeltes END, Body-Caret; keine Abschneidung.
- `GUI-30-Auto.png`: `CLASS Auto (ABSTRACT)` mit separatem Body und END; Caret Zeile 5 Spalte 3.
- `GUI-31-import-fixed.png`: IMPORTS Spare entfernt, restliche Quelle intakt.
- `GUI-33-html-tables.png`: italienische Tabelle, enger Umbruch, aber kein horizontaler Überlauf; Scripttext bleibt Text; ABSTRACT sichtbar.
- `GUI-34-saved.png`: DOCX-Speichertoast, Quelle unverändert.
- `GUI-35-central-uml.png`: ehrlicher `Partial diagram — check Problems`-Zustand, fit-skaliert klein; **kein** Beleg für vollständiges UML.
- `CP-SNIPPET-left.png`: MODEL CursorProbe (de), ein END, Ln 2 Col 22.
- `CP-QUICKFIX-negative.png`: „No code actions available“ an `IMPORTS Spare`; Problems zeigt zwei echte Fehler.
- `CP-DOCS-dirty.png`: `CLASS RenamedAlpha` im dirty Buffer, gespeicherter Markdown-Toast.
- `GUI-04-german.png`: deutsche Diagnose mit Code/Range und RelatedInformation; Mischung aus Deutsch/Englisch, kein ANSI-Dump.
- `GUI-07-declaration.png`: RenamedBuilding in Deklaration/END und qualifizierter Verwendung; Problems leer.
- `CP-GUI12-diagram.png` / `CP-GUI13-moved.png`: echte Sprotty-Kategorien/Kanten; Knoten A nach Pointer-Drag sichtbar bewegt; Quelle unverändert.
- `CP-GUI17-held.png` / `CP-GUI17-current.png`: gehaltene echte Layoutantwort als „Updating diagram…“, danach aktueller `newAttribute`-Stand; stabiler Knoten behält Geometrie.
- `GUI-26-files-saved.png`: `Export saved: GUI-26-PNG-VISIBLE.png`, Filter `VIEW` aus, aktuelle Ansicht sichtbar.

Kein Bild wurde aus einem Dateinamen oder aus einer fremden Behauptung abgeleitet. Frühere Fehlversuchsbilder wurden während der Iteration angesehen, aber durch spätere Runs ersetzt und deshalb nicht als aktuelle Belege gezählt.

**Quell-/Bufferunverändertheit:** Authoring GUI-29..31 und die eigene UML-Gegenprobe lesen Quelle und Disk-Hash nach den Aktionen; der Knoten-/Container-Drag ändert nur `transform`, nicht `.ili`/Buffer. `CP-DOCS` schreibt nur die gewählte Zieldatei; der dirty Editor und die Diskquelle bleiben unverändert.

**Exporte/Dialoge/Cancel:** GUI-26 speichert echte SVG/PNG-Dateien, prüft PNG-IHDR und Pixelgleichheit zwischen SVG und PNG sowie Cancel ohne Datei. GUI-33/34 speichern echte MD/HTML/DOCX; GUI-35 speichert echte Mermaid/PlantUML/GraphML. Die Mermaid-Datei ist formal vorhanden, aber semantisch falsch (Finding).

**Plattform/Remote:** V4 beansprucht nur macOS arm64 Entwicklungs-GUI; Linux/Windows/Remote und gebündelte Runtime bleiben V5. Es wird keine Crossbuild-Behauptung erhoben.

## 7. Neue Gegenproben

1. **CP-SNIPPET — automatische Suggestions statt Trigger Suggest.** Hypothese: Mit `editor.quickSuggestions` öffnet sich das echte Suggest-Widget ohne Palette; MODEL-Snippet akzeptiert, Name gespiegelt, Tab zum `de`-Stop, Right verlässt das Snippet, Tab ist danach normale Einrückung (kein Platzhaltersprung), genau ein END, Disk unverändert. Ergebnis: PASS. Status `Ln 2, Col 22 (2 selected)` → `Ln 2, Col 22` → `Ln 2, Col 25`; ein `END CursorProbe.`. Falsifizierbar: Ein Platzhaltersprung hätte die Zeile gewechselt; ein doppeltes END wäre sichtbar.
2. **CP-QUICKFIX — negative Grenze.** Hypothese: Ein Modell mit echtem unaufgelöstem Typ und unbenutzt aussehendem Import darf keinen Importlöschfix anbieten, obwohl ein normaler END-Fix als UI-Kontrolle funktioniert. Ergebnis: PASS; Kontrollaktion „Correct END name to C“, am IMPORTS keine Aktion, Problems 2 Fehler. Falsifizierbar: Ein angebotener „Remove unused import Spare“ hätte den Test scheitern lassen.
3. **CP-DOCS — aktueller Dirty-Snapshot.** Hypothese: Export aus dem ungespeicherten Buffer enthält `Live.Data.RenamedAlpha`, nicht `Live.Data.Alpha`; Buffer und Disk bleiben unverändert. Ergebnis: PASS; gespeicherte `CP-DOCS-dirty.md` enthält die aktuelle Klasse, Snapshot/Sources, keine stale Klasse. Falsifizierbar: Ein Export aus der Diskdatei hätte `Live.Data.Alpha` gezeigt.
4. **CP-GUI12-13 — echte Webview-Interaktion.** Hypothese: Sprotty-Kategorien/Kanten sind real; ein Pointer-Drag ändert die Geometrie, aber weder Buffer noch Disk. Ergebnis: PASS (2/2); Transform geändert, `activeText` und SHA-256 der `.ili` identisch. Der erste Versuch scheiterte nur an einer externen Clipboard-/Fokus-Störung im Harness; die Quelle blieb dabei nachweislich unverändert. Die korrigierte Gegenprobe nutzt eine read-only-DOM-Textprobe statt Clipboard.
5. **CP-GUI17 — gehaltene echte Layoutantwort.** Hypothese: Ein gehaltener echter ELK-Worker-Response darf eine neuere Generation nicht ersetzen und keinen manuell bewegten Knoten verlieren. Ergebnis: PASS; Status „Updating diagram…“, danach aktueller `newAttribute`-Stand, stabile Transform nach Freigabe unverändert, Quelle nur durch expliziten Textedit geändert.
6. **CP-ARTIFACTS — Format-/Semantikprüfung.** Hypothese: Alle V4-Artefakte sind wohlgeformt und formatübergreifend konsistent. Ergebnis: 29 Prüfungen, 28 grün, **1 rot**: Mermaid-Vererbungsrichtung. XML/DOCX/OOXML/GraphML/HTML/Markdown sind grün; der eine Fehler ist reproduzierbar.

## 8. Findings / Blocker

### M1 — V4-MERMAID-INHERITANCE (Muss, V4-06)

- **Quelle:** `CORE/interlis-projection/src/main/java/guru/interlis/projection/MermaidRenderer.java:40`
- **Reproduktion:** Authoring-Lauf `2026-11-02T11-13-42-875Z`; `GUI-35-graph.mmd` enthält `N5 <|-- N4`, `GUI-35-graph.puml` enthält `N4 <|-- N5`, GraphML hat die INHERITANCE-Kante `source=Child, target=Base`.
- **Erwartung:** Mermaid muss `Base <|-- Child` (oder `Child --|> Base`) ausgeben; die offizielle Mermaid-Syntax `Animal <|-- Duck` bedeutet „Duck erbt von Animal“, der Pfeilkopf zeigt auf die Basisklasse.
- **Beobachtung:** `source <|-- target` kehrt die Vererbung um. Der Nutzer erhält eine formal gültige, aber fachlich falsche Mermaid-Datei; die GUI-35-Prüfung merkt das nicht, weil sie nur „Child“/Rollen/Strings enthält.
- **Korrektur:** Mermaid-Renderer auf `target <|-- source` bzw. `source --|> target` umstellen; Regression in `DiagramProjectionTest` (Richtung) und GUI-35 (Mermaid-Richtung) ergänzen; betroffene Projektions-/Exporttests und die installierte GUI erneut ausführen.
- **Schwere:** Muss; ein PASS ist mit diesem offenen Finding nicht zulässig.

### M2 — V4-REGRESSION-GUI09 (Pflichtcheck nicht grün)

- **Quelle:** `test/gui/editor.cjs` GUI-09, ausgeführt über `scripts/gui.cjs --suite comfort`.
- **Reproduktion:** Zwei frische Läufe mit demselben VSIX enden bei 8/28. Der Test nach dem Offline-Restart wartet auf `interlis/analysisReady` für den aktuellen Editor; der Serverlog zeigt `didOpen` für `External.ili` um 13:01:56, aber im folgenden 20-Sekunden-Fenster keine entsprechende `analysisReady`-Meldung. Keine Java-Prozesse bleiben zurück.
- **Erwartung:** Entweder kommt die aktuelle Analyse innerhalb des Budgets, oder die Ursache ist als Produkt-/Harnessfehler konkret belegt.
- **Beobachtung:** Der Gesamtlauf ist nicht grün; die für V4 geforderten Einzelfälle 04/07/12/17/26 wurden separat erfolgreich ausgeführt. Der eigene historische 28/28-Lauf bei Extension `d9fa1c9` und identischem VSIX `deca8f9` ist nur Kontext, kein frischer Ersatz.
- **Korrektur:** Ursache der fehlenden/verspäteten `analysisReady`-Benachrichtigung nach Offline-Restart klären (Server oder Harness-Wartezeit), dann Comfort vollständig neu laufen lassen. Kein „nicht relevant“-Downgrade.

### Optionale Beobachtungen (kein Muss-Finding)

- Die deutsche GUI-04-Diagnose mischt deutschen Rahmen mit englischem Regeltext („class name must be unique in a topic“); das ist eine bereits in V1 dokumentierte Prosa-Grenze, keine neue V4-Verletzung.
- Die HTML-Tabelle ist im schmalen Panel sehr eng umbrochen; sie ist lesbar und ohne horizontalen Überlauf, aber eine responsive Spaltenbreite wäre eine UX-Verbesserung.
- Die GUI-35-Zentralansicht ist fit-skaliert klein und ehrlich `PARTIAL`; sie ist kein Beleg für einen vollständigen UML-Zustand.
- Das VSIX-Containerhash differiert beim Neupacken durch ZIP-Zeitstempel; alle Nutzdateien sind byte-identisch.

## 9. Urteil

**FAIL** (nicht BLOCKED: der Mermaid-Defekt ist reproduzierbar und eindeutig; der Comfort-Ausfall ist ein zusätzlicher offener Pflichtnachweis, keine fehlende Grundlage für ein Urteil).

Die V4-Arbeit ist inhaltlich weitgehend belastbar: Completion/Snippets/QuickFixes, Dokumentationsprojektion, Markdown/HTML/DOCX, GraphML und die Editor-/Export-Transporte sind mit echten Java-Prozessen und installierter GUI belegt. Die unabhängige Build-/VSIX-Prüfung ist byte-identisch zum Kandidaten.

Der Mermaid-Export verletzt jedoch **V4-06** nachweislich: Die Vererbung wird im Nutzerartefakt umgekehrt dargestellt, und der vorhandene GUI-35-Test deckt die Richtung nicht ab. Zusätzlich ist der angeforderte vollständige Comfort-Pflichtlauf zweimal an GUI-09 hängen geblieben; die V4-Einzelfälle wurden separat bestanden, der Gesamtlauf bleibt aber offen.

**Nächster erlaubter Schritt:** Mermaid-Richtung korrigieren und die Richtungsassertion in Projektion/Export/GUI ergänzen; GUI-09-Ursache klären und den Comfort-Lauf grün abschliessen; danach ein neues Kandidatenpaar und einen neuen unabhängigen V4-Review durchführen. Keine Publikation, kein Push, keine V5-Freigabe aus diesem Bericht. Der äussere Transport-/Guardabschluss dieses Prozesses ist von Codex nach Prozessende gesondert zu prüfen.
