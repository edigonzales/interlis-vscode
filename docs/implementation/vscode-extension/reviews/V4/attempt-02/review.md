# Unabhängiger Review V4 (Attempt 02) – INTERLIS VS Code

## 1. Identität

**Phase / kumulative Abnahme:** V4 – Editorhilfen (Completion/Snippets/Auto-Close/Quick Fixes) und Dokumentations-/Graph-Exporte. Die kumulative Prüfung bis V4 umfasst F01–F60 im erklärten Scope; F53/F54 (gebündelte Runtime, Plattform-/Remote-Matrix) bleiben V5 und sind hier keine V4-Fehler.

**Reviewer:** OpenCode `2.0.28`, Provider `deepseek`, API-Modell `deepseek-flash`, direkter Host `https://api.deepseek.com`.
Der Modellkatalog dieser Session (`providers=deepseek, models=[deepseek/deepseek-flash]`) ordnet `deepseek/deepseek-flash` dem Anzeigenamen **DeepSeek V4.1 Flash 1017** zu; `phases/V4/review-r2-preflight/model-preflight.json` belegt dieselbe Zuordnung, die offizielle Preisseite mit SHA-256 `579412351262de19f1b067420542d042dc9433f389be6d252d0f4c41b82f515b` und die Direktbasis. Das Sessionprofil `opencode.json` setzt `baseURL: https://api.deepseek.com`. Kein OpenRouter-/Go-/Zen-/Proxyfallback; keine Credentialdatei gelesen oder ausgegeben. Die äussere Transport-/Guardprüfung ist **nicht** Teil dieses Berichts und bleibt Codex nach Prozessende vorbehalten.

| Identität | Wert |
|---|---|
| AssignmentBase | Core `20b0029d824b3602d9a304320bf0feae4c35c1f9`, Extension `73badd9807f407aea048d397af5549fe907a1501` |
| PhaseBase | Core `a0272965c4691320ca316d519581d4db4cefc930`, Extension `26743af31198ea0945093318742b8c83c741ce16` |
| Candidate / tatsächlicher HEAD | Core `6983baf95c47a7e20dbb41a2e50500185f578c37`, Extension `36b87bc798eaa53cbe3f5b9f89ac58b92ea0eafc` |
| Tracked Zustand vorher/nachher | Core sauber; Extension tracked sauber. Einzige untracked Datei: `opencode.json` (Review-Runner-Konfiguration, kein Produktfile). |
| Unabhängig gebautes VSIX | `5fb846de1879c09edcad5513af31b422519b8c7cdf928d9461be2af81e7e034e`; 75/75 entpackte Einträge byte-identisch zum bewahrten Kandidaten-VSIX `69c3819ffbc01d321a5a78ab6168be17a795f73456a10498bb8e05544ea6a1ee`. Containerhash differiert nur durch ZIP-Zeitstempel. |
| Installierte Extension | `edigonzales.interlis-vscode` `0.0.1`, Bundle `f631446e9cb7bf3bce987d36509eb7d560ed7a022b81a8431c5fe9937a1110e9` in beiden GUI-Suiten |
| Server/Artefakte | refreshed editorBundle aus Core `6983baf95c47a7e20dbb41a2e50500185f578c37`: 12 Server-JARs und 47 Renderer-/Schema-/Typdateien exakt wie Lock; u. a. `interlis-lsp` `c143012d70ca0530d3181554fd3db75872653065a21b55ddd3965c2237ba1d8d`, `interlis-documentation` `1e4d4c4d0fbdb6df6c7592f77939f5e618449cc058f4a0d7e8271d74728d19fa`, `diagram-document-1.0.schema.json` `105e7eeb24f6ef682e04695ecbbc127a51805178c6ee1a4310cb7ca1426fc779`, `diagram-ui.tgz` `2dc6e90f572fde2cf5acb48b3859e0b2cf86255f56a43e279603c652b7c403f7` |
| Umgebung | macOS arm64, VS Code `1.140.0`, ExTester `8.28.1`, ChromeDriver `150.0.7871.250`, Temurin JDK `25.0.3` (Entwicklerruntime; V4 bündelt keine Runtime) |

Alle 60 im Request gelisteten Artefakte sowie alle 49 Implementierungs-/Vorlauf-/Preflightbelege des Requests sind vorhanden und haben die dort angegebenen SHA-256-Werte. Das frisch aus dem detached Core gebaute `editorBundle` (59 Dateien) ist byte-identisch zu den vorgefundenen `artifacts/`, und das frisch gepackte VSIX enthält exakt dieselben 75 Nutzdateien wie der archivierte Kandidat.

## 2. Eigene Ziel-, Code- und Architekturprüfung

**Relevanter Diff.** Core `a0272965c4691320ca316d519581d4db4cefc930`..`6983baf95c47a7e20dbb41a2e50500185f578c37`: 43 Dateien (+4100/−19) – neues Modul `interlis-documentation` (Projektor, Labels, vier Renderer, Tests), LSP-Transport `interlis/export` und `interlis/editorAssist`, Completion/QuickFix/Auto-Close-Queries, Editorprotokoll, Mermaid-Korrektur, Dokumentation. Der Reparaturcommit `6983baf` gegenüber dem früheren Kandidaten `668caa9a975ffac41a56880c9349a70ee3fdc788` umfasst nur 5 Dateien: Mermaid-Renderer + Richtungsassertion sowie `RepositoryHostCoordinator` + Latch-Test + Statusdoku. Extension `26743af31198ea0945093318742b8c83c741ce16`..`36b87bc798eaa53cbe3f5b9f89ac58b92ea0eafc`: 32 Dateien – Host-/Editor-/Exportpfade, Manifest/Keybindings, Fixtures, GUI-Harness und Berichte; der letzte Commit `36b87bc` ändert ausschliesslich `STATUS.md` und `V4.md`.

- **Eine Sprachautorität:** Completion, Blockabschluss und Quick Fixes entstehen in Java aus `AnalysisSnapshot`/Syntax (`EditorAssistanceService`, `EditorCompletions`, `MetaAttributeCatalog`). Die Extension besitzt keinen `.ili`-Parser, keine Symboltabelle und keine Regex-Sprachlogik; sie führt nur native TextEdits, Snippets, Cursor- und Dialogaktionen aus. Ich habe keinen TS-Semantikpfad gefunden.
- **Genau ein Enter-Pfad:** Bei verhandeltem `editorAssist` liefert der Server keinen `documentOnTypeFormattingProvider`; der Client schaltet dann auf den keybinding-/capabilitygebundenen Customrequest. Ohne Verhandlung bleibt Standard-onType aktiv und der Customrequest wird abgewiesen (Java-Test und realer stdio-Test). Keine doppelte Einfügung, Versions-/Instanzprüfung im Host.
- **Keine Altprojektabhängigkeit:** `npm run verify:no-legacy-dependencies` prüft Lock, installierten Gesamtgraph und Produktbundle; kein `@ilic/*`, kein `interlis-language-tools`, kein `file:`/`workspace:`/Git-Link, kein `ilic.wasm`. Herkunftshinweise bleiben reine Provenienz.
- **Dokumentprojektion:** `interlis-documentation` hängt nur von neutralem Modell und `interlis-projection` ab; kein LSP, kein VS Code, kein Compiler in `main` (nur `testImplementation`). Projektor arbeitet unveränderlich auf `CompiledSchema`, begrenzt Einträge/Text und stellt rekursive Strukturen als Referenzen dar. DOCX ist echtes OOXML über JDK-ZIP; HTML/Markdown escapen Modelltext; GraphML kommt aus `DiagramDocument`, nicht aus einem zweiten AST-Visitor.
- **Exportgrenze:** `interlis/export` prüft Protokoll, Format, Dokumentversion, Modellauswahl, Source-Revisionen und vollständige Kompilation; der Host prüft Quelle/Server/Generation erneut, verwirft Veraltetes und schreibt über temporäre Datei mit abschliessender Frischeprüfung. Kein Schreiben in Repositories oder fremde Quellen.
- **Quellen-/Readonlygrenzen:** Export verlangt eine lokale editierbare Quelle; fremde Importe bleiben readonly. Der GUI-Lauf GUI-09 öffnet nach Offline-Neustarts jeweils neue `interlis-source:`-Handles mit denselben Bytes.
- **Sicherheit:** HTML-Vorschau ist skriptlos, CSP `default-src 'none'`, Modelltext escaped; kein CDN, keine WebSockets, keine Command-/URL-Ausführung aus Modelltext. Template-URLs sind HTTPS (HTTP nur Loopback), Redirects werden erneut geprüft, 1 MB/10 s begrenzt, Inhalt literal geöffnet.
- **Beide Pflichtbefunde aus Attempt 01:**
  - **Mermaid:** `DiagramEdge.INHERITANCE` hat `source=Subtyp`, `target=Basis`; der Renderer gibt jetzt `source --|> target` aus. Frische GUI-35-Datei: `N5 --|> N4` (Child→Base), PlantUML `N4 <|-- N5`, GraphML `Child→Base`. Meine dreistufige Gegenprobe bestätigt `B --|> A` und `C --|> B` in Mermaid, `A <|-- B`/`B <|-- C` in PlantUML und `C→B`, `B→A` in GraphML.
  - **GUI-09/Restart:** `RepositoryHostCoordinator.reconfigure` verwirft identische `options`+`cache` ohne den laufenden Loader zu canceln; der Latch-Test war vor der Reparatur rot und ist grün. Mein unabhängiger stdio-Gegenfall hielt `/ilimodels.xml` 2,2 s an, sandte zwei identische `didChangeConfiguration`-Notifications und erhielt dennoch `analysisReady` für die aktuelle Dokumentversion, F12 in das importierte Modell und einen erfolgreichen Current-Compile.

**Keine gefundene Muss-Verletzung** in diesen Verträgen. Die zuvor fehlende Mermaid-Richtungsassertion ist jetzt in `DiagramProjectionTest` und GUI-35 vorhanden.

## 3. Jede fällige Muss-AC

| AC-ID | erfüllt / verletzt / nicht prüfbar | eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|
| V4-01 | **erfüllt** | Java `EditorCompletionTest` (6), `EditorTemplateContractTest` (3), `P03CompletionScopeContract` u. a. in 66 Compiler-Tests, 0 Fehler/Skips; GUI-29 frisch: MODEL/CLASS/DOMAIN/UNIT/VIEW TOPIC, Header-Stops, qualifizierte 2.3/2.4-Segmentersetzung | – |
| V4-02 | **erfüllt** | GUI-29/30 frisch 7/7; `EditorAssistProtocolTest` exakter Caret/Stale-Version; CP2-AUTOCLOSE: mehrzeiliger ABSTRACT-Kopf mit Kommentar+Emoji → genau ein `END Wide;`, Caret Ln 7 Col 7, Kommentar-Negativfall ohne END, Disk unverändert | – |
| V4-03 | **erfüllt** | GUI-31 frisch: END-Name-, Semikolon- und Import-Fix je mit einem Undo; `EditorAssistanceTest`/`EditorCompletionTest` verlangen vollständige Bindung/Analyse für Importlöschung; LSP liefert ausschliesslich versionierte `documentChanges` | – |
| V4-04 | **erfüllt** | `interlis-documentation:test` 8/8 (Typen, Origins, Inheritance-Modi, Constraints, rekursive Referenzen, Budgets, Escaping); CP2-CATALOGUE aus dirty Buffer: `Deep.Data.Gamma`, keine stale `C`, rekursives `Node`, Emoji, begrenzt | – |
| V4-05 | **erfüllt** | GUI-33/34 frisch; 8 echte MD/HTML-Dateien in vier Sprachen, Headeroverride, ABSTRACT, keine Rohskripte; DOCX mit 5 wohlgeformten OOXML-Teilen und 4 Tabellen; eigener Artefaktcheck | – |
| V4-06 | **erfüllt** | GUI-35 frisch; Mermaid `N5 --|> N4`, PlantUML `N4 <|-- N5`, GraphML `Child→Base`; CP2 dreistufig konsistent; GraphML wohlgeformt (11 Knoten, 9 Kanten, 13 Keys); keine Fremd-/Netzrenderer | – |
| V4-07 | **erfüllt** | installierte GUI29–35 **7/7** und Comfort **28/28** frisch, darunter GUI-04/07/09/12/17/26; erwartete Negativcanary Exit 1; 6 echte Java-Starts, keiner verbleibt | – |
| V4-08 | **erfüllt** | 196 frische Java-Tests (66 Compiler, 8 Doku, 75 LSP, 24 Bridge, 22 Projektion, 1 CLI), 0 Fehler/Skips; TS Build/Dependency/10 Unit/1 echter stdio; `pythonFreeCheck` PASS 1685 Inputs; keine neuen XFAILs/Disabled; Testauswahl begründet | – |
| V4-09 | **erfüllt** | Unabhängige Code-/Ziel-/Artefaktprüfung; neue Wire-Race- und vier native GUI-Gegenproben; 23 Bilder tatsächlich gesichtet; identische Produktpaar-SHAs und Nutzdateihashes | – |

## 4. Featureparität

Für V4 mit realem Benutzerpfad belegt:

- **F11/F15/F16:** kontextabhängige Completion, qualifizierte Segmentersetzung, 2.3/2.4-, EXTENDS-, LIST/BAG-, FORMAT-, UNIT- und Import-Slots, Metaattributname/-wert – Java-Tests plus GUI-29; keine zweite Client-Semantik.
- **F12–F14:** MODEL/TOPIC/CLASS/STRUCTURE/ASSOCIATION/VIEW/GRAPHIC/DOMAIN/UNIT/Role-Vorlagen, gespiegelte Namen, Tab/Enter/Endplatzhalter, Auto-END nur nach vollständigem Kopf – GUI-29/30 und CP2-AUTOCLOSE.
- **F18:** Semikolon-, END-Namen- und beweisbar unbenutzter Import-Fix, versionsgebunden und mit Undo – GUI-31; unsichere Importlöschung bei unvollständiger Analyse durch Java-Test ausgeschlossen.
- **F47–F52:** `CompiledSchema`-Katalog, DE/FR/IT/EN-Labels, Headeroverrides, drei Inheritance-Modi, rekursive Strukturen, Markdown/HTML/DOCX, GraphML/Mermaid/PlantUML, sichere Preview/Save/Cancel.
- **F57/F58/F60:** escaping/CSP/Grössen-/Zeitlimits, Cancellation und echte installierte GUI. F53/F54 bleiben ausdrücklich V5.

**Kumulativ bis V4:** Die in V0–V3 abgenommenen F01–F10 und F19–F46 werden durch den V4-Diff nicht neu implementiert; die fälligen Regressionen GUI-04/07/12/17/26 und der vollständige Comfort-Lauf GUI-01–28 wurden auf dem Kandidaten frisch bestanden. Es gibt keine neue Sprach-/Normänderung.

## 5. Risikobasierte Tests

| Gate/Case | fällig warum / nicht fällig warum | ausgeführtes Kommando und cwd | Exit / Tests / Fehler / Skips | eigener Lauf oder geprüftes Artefakt | Rohbeleg |
|---|---|---|---|---|---|
| T0 Build/Artefakt | neue Java-Module, LSP-Verträge, Lock, VSIX | `npm ci --ignore-scripts`; `npm run build`; `node scripts/stage-core.cjs --core-dir /Users/stefan/sources/interlis-vscode-evidence/reviews/V4-r2/core` (Scratch); `npm run package:vsix -- --target darwin-arm64` (extension/core) | 0; Bundle 59/59 byte-identisch, Lock 12+47, Request 60/60, VSIX 75/75 inhaltsgleich | eigener Lauf auf exaktem Paar | `logs/npm-ci.log`, `logs/editorBundle.log`, `logs/stage-scratch.log`, `logs/package.log`, `own/artifact-verification.json` |
| T1 Java/Queries/Doku | neue Editorpläne, Dokumentprojektion, Mermaid-Fix | exakte Argv in `verdict.json` / `logs/java-tests.log` (core) | 0; 66/66, 8/8, 75/75, 24/24, 22/22, 1/1; 0 Fehler/Skips | eigener Lauf | `logs/java-tests.log`, JUnit-XML im Core |
| T1 Extension | neue Host-/Editor-/Exportpfade | `npm run build`, `verify:no-legacy-dependencies`, `test:unit`, `test:protocol` (extension) | 0; 10/10 Unit, 1/1 echter stdio (pid 21497, Exit 0) | eigener Lauf | `logs/build.log`, `logs/deps.log`, `logs/unit.log`, `logs/protocol.log` |
| T2 LSP-Transport | EditorAssist/Export/Version/Cancel | im Java-Compiler-/LSP-Test und Extension-stdio | 0; sechs Formate, Caret/Stale-Version, versionierte CodeActions | eigener Lauf | `logs/java-tests.log`, `logs/protocol.log` |
| T3 Artefakt/Safety | MD/HTML/DOCX/GraphML/Mermaid/PlantUML | eigener Node-Parser + `unzip` auf frische GUI-Dateien | XML/DOCX/OOXML/GraphML gültig; MD/HTML vier Sprachen, rekursiv, escaped; DOCX 5 Teile/4 Tabellen | eigener Lauf | `own/artifact-inspection-authoring.json`, `own/counterprobe-artifact-inspection.json` |
| T4 GUI-29–35 | V4-Pflicht | `node scripts/gui.cjs --suite authoring --cache /Users/stefan/sources/interlis-vscode-evidence/gui-preflight/storage` | **0; 7/7** | eigener Lauf | `own/gui-authoring/` (Run `2026-11-02T13-07-34-252Z`) |
| T4 GUI-01–28 | V4-Regression/Pflichtcomfort | `node scripts/gui.cjs --suite comfort --cache /Users/stefan/sources/interlis-vscode-evidence/gui-preflight/storage` | **0; 28/28**; 6 Java-Starts, 0 verbleibend | eigener Lauf | `own/gui-comfort/` (Run `2026-11-02T13-10-08-926Z`) |
| T4 Negativcanary | Harness muss scheitern | `node scripts/gui.cjs --suite smoke --cache /Users/stefan/sources/interlis-vscode-evidence/gui-preflight/storage --canary missing-status` | **1 erwartet**; GUI-01 Timeout an unmöglichem Status, GUI-02/03 bestanden | eigener Lauf | `own/gui-canary/` |
| T6 breite Compiler-/Korpus-/Safari-/Plattformmatrix | **nicht fällig:** keine Parser-/Binder-/Normänderung; Mermaid ist reine Textdarstellung, Repository-Reparatur ist LSP-Host. Runtime/Plattform/Remote ist V5 und gesperrt. | – | – | – | – |
| Pythonfreiheit | bestehender Core-Vertrag | `./gradlew pythonFreeCheck` (core) | 0; `PYTHON_FREE_SOURCE_PASS 1685 inputs` | eigener Lauf | `logs/python-free.log` |

Keine Pythonaufrufe; verwendet wurden Node, Gradle, POSIX-Shell, `unzip` und `sax`. Keine fällige Prüfung wurde nachträglich als „nicht relevant“ entfernt.

## 6. Echte GUI und Sichtprüfung

Installiert wurde in isolierten Profilen mein eigenes, unabhängig gepacktes VSIX mit `edigonzales.interlis-vscode` 0.0.1; der reale Java-LSP lief aus dem Bundle mit identischen Server-/Rendererhashes. Bedienung über Explorer, Command Palette, echte Tastatur-/Pointerereignisse und native Save-Dialoge; keine Controller-/Eval-Ersatzaktion.

Tatsächlich mit dem Bildwerkzeug geöffnet und in `image-read-inventory.json` mit SHA-256 inventarisiert (23 Bilder, inklusive explizit gemappter byte-identischer Kopien):

- `GUI-29-model.png`: MODEL Demo (fr), VERSION-Header, gespiegeltes END, Body-Caret, keine Abschneidung.
- `GUI-30-Auto.png`: CLASS Auto (ABSTRACT), separater Body, END Auto;, Status Ln 5 Col 3.
- `GUI-31-import-fixed.png`: IMPORTS Spare entfernt, übrige Quelle intakt, Problems leer.
- `GUI-33-html-tables.png`: italienische Labels, enger aber nicht abgeschnittener Tabellenumbruch, `<script>` bleibt Text, ABSTRACT sichtbar, Save-/Generating-Notifications.
- `GUI-34-saved.png`: DOCX-Speichertoast, Quelle unverändert.
- `GUI-35-central-uml.png`: ehrlicher `Partial diagram — check Problems`-Zustand mit echter Sprotty-Canvas und Toolbar; **kein** Beleg für einen vollständigen UML-Zustand.
- `GUI-04-german.png`: deutscher Rahmen mit Code `ILI-SEM-0010`, echter Range und aufklappbarer RelatedLocation; Regeltext teilweise englisch (bestehende V1-Grenze).
- `GUI-07-declaration.png`: Rename in Deklaration und END `RenamedBuilding`, Problems leer.
- `GUI-09-offline-repeat-2.png`: dritter Offline-Neustart, exakte read-only `RemoteMiddle.ili`-Bytes, INTERLIS Ready.
- `GUI-12-current.png`, `GUI-13-before.png`, `GUI-13-node-moved.png`, `GUI-14-handle-before.png`, `GUI-14-route-after.png`, `GUI-17-held.png`, `GUI-17-current.png`: echte Sprotty-Ansicht; Pointer-Drag bewegt Knoten/Container, ein Routinghandle biegt die Kante sichtbar um, Endpunkte/Quelltext bleiben unverändert; gehaltene Layoutantwort als „Updating diagram…“, danach aktuelle `newAttribute`-Ansicht mit erhaltenem stabilem Knoten.
- `GUI-26-files-saved.png`: `Export saved: GUI-26-PNG-VISIBLE.png`, Filter/Toolbar sichtbar, Quelltext mit Script-Metazeichen unverändert.
- `CP2-AUTOCLOSE-abstract.png` / `-comment-negative.png`: genau ein END am mehrzeiligen ABSTRACT-Kopf mit Kommentar+Emoji, Caret Ln 7 Col 7; Kommentarzeile erzeugt kein END.
- `CP2-CATALOGUE-dirty.png`: dirty `Gamma`, rekursives `Node`, Emoji-Kommentar, Markdown/HTML-Speichertoasts.
- `CP2-CONFIG-RACE.png`: Race.ili/Dep.ili nach drei Settings-Speicherungen, Ready; `CP2-INHERITANCE.png`: A←B←C plus GraphML-Speichertoast.

**Quell-/Bufferunverändertheit:** GUI-13/31/35 und CP2 prüfen Editor- und Disk-Inhalt nach den Aktionen; Layout-/Exportaktionen ändern nur View bzw. gewählte Zieldateien. Die DOCX-/MD-/HTML-/Graph-Dateien stammen aus erfolgreichem CompileCurrent der vollständigen Quelle, nicht aus einem Defaultlayout.

**Exporte/Dialoge/Cancel:** GUI-26 speichert echte Full/Visible-SVG/PNG mit PNG-IHDR/Pixelvergleich und Cancel ohne Datei; GUI-33/34 speichern 8 MD/HTML-Dateien und echtes DOCX; GUI-35 speichert drei echte Graphdateien. Die GraphML-Endpunkte und die Mermaid-/PlantUML-Richtung sind konsistent.

**Plattform/Remote:** V4 beansprucht nur macOS arm64 Entwicklungs-GUI; Linux/Windows/Remote und gebündelte Runtime bleiben V5.

## 7. Neue Gegenproben

1. **CP2-AUTOCLOSE (native GUI).** Hypothese: Ein mehrzeiliger ABSTRACT-Kopf mit Kommentar und Emoji wird nach nativem Enter genau einmal geschlossen; der Body-Caret liegt zwei Spalten innerhalb der Blockeinrückung; eine Kommentarzeile erzeugt kein END; Disk bleibt unverändert. Ergebnis: **PASS** (ein `END Wide;`, Ln 7 Col 7, Emoji intakt, Kommentar-Negativfall ohne END, Disk-Hash unverändert). Falsifizierbar: doppeltes/fehlendes END oder falsche Caretzeile.
2. **CP2-INHERITANCE (native GUI, drei Ebenen).** Hypothese: `A ← B ← C` erscheint in drei unabhängigen Formaten richtungsgleich. Ergebnis: **PASS**; Mermaid `B --|> A`, `C --|> B`; PlantUML `A <|-- B`, `B <|-- C`; GraphML `C→B`, `B→A`. Falsifizierbar: eine umgedrehte Kante in irgendeinem Format.
3. **CP2-CATALOGUE (native GUI, dirty aktueller Snapshot).** Hypothese: Ein ungespeicherter Klassen-Rename und eine rekursive Struktur erscheinen im Markdown/HTML-Katalog, ohne stale Disk-Klasse, mit Emoji und begrenzter Grösse; Buffer/Disk bleiben unverändert. Ergebnis: **PASS** (`Deep.Data.Gamma`, kein `Deep.Data.C`, `BAG {0..\*} OF Deep.Data.Node`, Emoji, 2 535 Bytes, Buffer/Disk identisch). Falsifizierbar: Export aus Disk oder Endlosrekursion.
4. **CP2-CONFIG-RACE (native GUI).** Hypothese: Drei echte Settings-Speicherungen mit anschliessender F12 in ein importiertes Modell liefern stets aktuelle Analyse und exakte Dep-Bytes. Ergebnis: **PASS**. Falsifizierbar: stale/leere Definition nach Konfigurationswechsel.
5. **CP2-WIRE-RACE (echter Java-stdio-Prozess).** Hypothese: Zwei identische `didChangeConfiguration`-Notifications während eines absichtlich 2,2 s angehaltenen `/ilimodels.xml` canceln die einzige laufende Repository-Analyse nicht. Ergebnis: **PASS**; `analysisReady` für Dokumentversion 1, Definition nach `Dep.ili`, Current-Compile `succeeded`. Falsifizierbar: Timeout ohne akzeptierte Analyse.
6. **Kontrollierte Gegenläufe meiner Harness-Assertions.** Drei frühe Gegenprobenläufe scheiterten ausschliesslich an meinen eigenen Orakeln (Emoji-Spaltenberechnung, Markdown-Escaping `0..\*`, abschliessender Zeilenumbruch), nicht am Produkt. Die Fehlläufe bleiben unter `own/cp2-fail-1..3` erhalten; der finale Lauf ist `4/4 PASS`. Das ist bewusst als Harness-Iteration offengelegt und kein Produktbefund.

## 8. Findings / Blocker

**Keine offenen Muss-Findings.** Beide Pflichtbefunde aus Attempt 01 sind mit Code, gezielten Tests und frischen Artefakten geschlossen.

Optionale Beobachtungen (keine Abnahmeauswirkung):

- Der Comfort-Lauf protokollierte 4 von 6 Java-Starts mit Server-exit-Zeile mit `code=0`; zwei Starts endeten beim Window-/Harness-Teardown ohne Exit-Logzeile. `remaining=[]` und der Harness-Check beweisen, dass keine Prozesse verblieben. Kein V4-AC-Bezug; bei V5-Restart/Leakprüfung weiter beobachten.
- Die deutsche GUI-04-Diagnose mischt deutschen Rahmen mit englischem Regeltext (bereits dokumentierte V1-Prosa-Grenze).
- HTML-Tabellen brechen im schmalen Panel sehr eng um; lesbar und ohne horizontalen Überlauf, aber UX-verbesserbar.
- Die GUI-35-Zentralansicht ist fit-skaliert klein und ehrlich `PARTIAL`; die Exportdateien selbst stammen aus vollständiger Kompilationsprojektion.
- `npm audit --omit=dev` meldet 0 Runtime-Schwachstellen; die 7 moderaten `npm ci`-Hinweise betreffen ausschliesslich Dev-/Testabhängigkeiten.

**Fehlende Pflichtnachweise:** keine. **Blocker:** keine.

## 9. Urteil

**PASS**

Alle neun V4-Muss-ACs sind erfüllt. Die beiden im unabhängigen Attempt-01 beanstandeten Punkte sind nachweislich behoben: Mermaid exportiert die Vererbung jetzt richtungsgleich zu PlantUML/GraphML, und die identische Repository-Konfiguration während laufender Analyse cancelt diese nicht mehr. Der vollständige Comfort-Pflichtlauf ist mit drei Offline-Neustarts grün; Authoring 7/7, Comfort 28/28, Negativcanary wie erwartet rot, eigene Wire- und GUI-Gegenproben grün. Produktpaar, Lock, Bundle, VSIX-Nutzdateien und installierte Hashes stimmen überein.

**Nächster erlaubter Schritt:** Codex darf nach positiver äusserer Transport-/Guardprüfung und unveränderten tracked Trees die V5-Phase beginnen. Dieser Bericht behauptet nicht den Abschluss des äusseren OpenCode-/Guard-Prozesses; dessen Exit, Manifest und Artefaktidentitäten sind von Codex nach Prozessende gesondert zu prüfen.
