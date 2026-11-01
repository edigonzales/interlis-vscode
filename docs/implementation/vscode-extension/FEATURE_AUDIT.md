# INTERLIS VS Code – Quellenanalyse und verbindlicher Feature-Backlog

**Version 1.0 · 1. November 2026.** Ergänzung zu [EXECUTION_PLAN.md](EXECUTION_PLAN.md). Die dortigen Phasen und Abnahmekriterien steuern die Umsetzung. Diese Datei verhindert, dass „Feature-Parität“ nur eine pauschale Behauptung bleibt.

## 1. Aussagekraft und Quellenstände

Untersucht wurden Repositoryquellen, Manifeste, konkrete Implementierungen, vorhandene Testquellen, Berichte und Releaseinformationen. **Bei dieser Spezifikation wurden keine der alten Extensions installiert und keine neuen GUI-Tests ausgeführt.** Eine Quellenimplementierung ist nicht mit einem erfolgreichen Produkttest gleichzusetzen. Die späteren GUI-Gates sind deshalb ausdrücklich verpflichtend.

| Kürzel | Referenz | Geprüfter Stand / Bedeutung |
|---|---|---|
| J | `edigonzales/interlis-java` | `b8051493a8b93e0be4b12735785803d068df6f80`, `main`, Merge vom 01.11.2026 07:25:08 UTC. Aktueller erreichbarer Java-Compilerstack. |
| A | `edigonzales/interlis-lsp` | `65864b3cd74e7cd8a2ff8e066331e717cebc517e`; Extension `edigonzales.interlis-editor` 0.0.32. Älterer Java-/ili2c-/GLSP-Ansatz. |
| B | `edigonzales/interlis-language-tools` | `f27801bfebf0fdac82a19e016f4c347ae2b6f8fb`; Extension/Pakete 0.1.2. C++/WASM-/TypeScript-Ansatz. **Nur Referenz und erlaubte Quellübernahme, niemals Abhängigkeit des neuen Produkts.** |
| G | `geowerkstatt/vsc_interlis2_extension` | untersuchter Quellstand `64667fee3e0350a4d6de66ca54f9d3773c53dc39`; Manifest 1.0.2. |
| G-stable | Geowerkstatt GitHub Releases | `v1.0.1-74`, veröffentlicht 13.10.2026; stabile 1.0-Funktionen entsprechen funktional 0.6.0 vom 29.09.2026. |
| G-preview | Geowerkstatt GitHub Releases | `v1.0.2-78`, veröffentlicht 28.10.2026, **prerelease=true**. Enthält die im Changelog noch unter `vNext` aufgeführten Diagrammverbesserungen. |

Die Kopfstände sind Recherchepins, **keine Reset-Anweisung**. In V0 werden tatsächliche lokale HEADs, Branches und zwischenzeitliche Änderungen erneut geprüft. `interlis-guru` war bei der Recherche über den GitHub-Connector nicht erreichbar; nicht auf Verdacht ein anderes Repository als neue Compilerimplementierung einsetzen. Ein lokal umbenanntes Repository ist anhand Inhalt, Remote und Git-Historie zu identifizieren.

## 2. Letzte Änderungen im Java-Compilerrepository

### 2.1 Der neue Merge ist eine reale veränderte Ausgangslage

Der Merge `b8051493...` trägt den Titel „Compiler-CLI modernisieren: interlis-compiler und auftragsbezogene DE/EN-Diagnostik (#1)“. Er enthält unter anderem:

- Modul/Distribution `interlis-compiler-cli` / `interlis-compiler`, ohne frühere ili2c-Bedienemulation;
- auftragsbezogene Diagnosen zusätzlich zur vollständigen Analysesicht;
- lesbare DE-/EN-Nachrichten und wirkliche verwandte Quellstellen;
- Behandlung beschädigter expliziter Quellen ohne erkanntes Modell;
- Escaping von Bidi-/Steuerzeichen;
- SDK-/Archiv-/Launcherprüfungen, einschliesslich Windows-Unicodeargumenten und Shellmetazeichen;
- Anpassung der Korpusprüfer an die lesbare CLI-Ausgabe;
- archivierte unabhängige CLI1–CLI3-Abnahmen.

Das ist kein Auftrag, CLI1–CLI3 erneut umzusetzen. Der neue LSP/Extension-Auftrag darf weder Legacylauncher wieder einführen noch `interlis-compiler` zum internen Sprachserver machen. `interlis-compiler` ist ein eigenständiges Benutzerwerkzeug; der LSP benutzt die Java-API.

### 2.2 Konkrete Lücken zwischen Compilerfähigkeit und LSP-Verbraucher

| Arbeitsort im Java-Repo | Tatsächlicher Befund | Konsequenz |
|---|---|---|
| `interlis-lsp/.../InterlisLanguageServer.java#initialize` | Advertisiert Hover, Definition, Completion, References, Rename/PrepareRename, Formatting, CodeAction, DocumentSymbol, Folding und SemanticTokens. | Kein neuer Language Server; vorhandene Funktionen qualifizieren und ergänzen. |
| `InterlisTextDocumentService#publish` / `#message` | Nachrichten werden noch aus `messageKey` und Argumentdarstellungen gebaut; primär nur offene Dokumente werden publiziert. | Gemeinsamen `DiagnosticMessageFormatter` nutzen; RelatedInformation, sprachabhängige Texte und bewusstes Verhalten für globale/geschlossene Quellen ergänzen. Kein CLI-ANSI in LSP. |
| `InterlisTextDocumentService#codeActionNow` | Im betrachteten Stand eine Formatierungsaktion, nicht die ganze Quick-Fix-Auswahl von B. | Fehlendes Semikolon, falscher END-Name und sicher unbenutzte Imports sind neue gezielte Core-/LSP-Arbeit. |
| `#documentSymbolNow` | Erstellt einzelne DocumentSymbols ohne aufgebauten Kinderbaum. | Outline wirklich MODEL → TOPIC → CLASS → Member verschachteln. |
| `LspConfiguration` | Striktes Decoderprofil für warningPolicy, allowedLanguages, resolutionPolicy, cacheLimits, analysisBudget. | Nicht alle neuen VS-Code-Settings blind hinschicken; sprach-/repositorybezogene Protokollkonfiguration explizit erweitern. |
| `ProjectSourceLoader` / `InterlisWorkspaceService` | Lokale Workspace-Entdeckung und Watcher, echte Pfad-/Hardlink-/Symlinkbehandlung, begrenztes IO. Kein vollständiger externer Repositoryhost im betrachteten Adapter. | Bestehendes `interlis-repository` anbinden; nicht in TypeScript einen zweiten Crawler entwickeln. |
| `InterlisWorkspaceService#executeCommand` | `interlis.compile` akzeptiert keine Argumente und kompiliert Workspace; `interlis.diagram` nimmt uri/snapshotId/symbolIds. | „Aktuelles Modell prüfen“ braucht explizite Root-/Versionsparameter; Workspaceprüfung getrennt halten. |
| `InterlisTextDocumentService#diagramNow` | Liefert JSON-String, benutzt immer `DiagramOptions.defaults`. | Versionierter typisierter Diagrammrequest mit vollständigen Optionen und Frischevertrag. |
| `interlis-compiler/.../query/LanguageQueries.java` | Reine Snapshotabfragen `symbolAt`, `definition`, `hover`, `complete`, `references`, `prepareRename`, `planRename`. | Wiederverwenden; zusätzliche Editorhilfen als reine Core-Abfragen, keine parallele TS-Semantik. |
| `docs/p3/DIAGRAM_ADAPTER.md` und `diagram-adapter.ts` | Neutraler Java-Diagrammvertrag; Renderer aus B bereits gepinnt übernommen; Provenienz/Schema-/Navigationschecks vorhanden. | Ausgangspunkt für kontrollierte Übernahme, nicht nochmals ungeprüft die ganze Extension kopieren. |
| derzeitiger gepinnter Diagrammrenderer | SVG-/ELK-Erzeugung und Sprotty-Modell vorhanden; daraus folgt **noch kein** vollständig interaktiver Sprotty-Webview. Aggregations-/Kompositionsdiamanten sind dokumentiert unvollständig. | Echte Sprotty-Views/Interaktionen und korrekte Endmarker implementieren; Typenimport oder statisches SVG allein ist keine UML-Parität. |

Die bisherigen P3-/CLI-Berichte sind historische Nachweise ihres jeweiligen Produkt-SHAs. Sie beweisen nicht die neue Extension. Der Farbausgabeauftrag ist im gelesenen Main-Merge nicht als erledigte Implementierung belegt; seine eventuell neueren Änderungen in V0 respektieren, aber weder erneut ausführen noch in den LSP übertragen.

## 3. Quellenleseschlüssel

Die folgenden Kürzel referenzieren konkrete Dateien am jeweiligen oben genannten Pin. `Q` bedeutet in Code/Manifest gesehen, `D` bedeutet dokumentiert, `T` bezeichnet vorhandene Testquelle, **nicht** hier ausgeführten Test.

- **A1:** `client/package.json`, `client/README.md`, `README.md` – Beiträge, Befehle, Einstellungen, Packaging.
- **A2:** `client/src/extension.ts`, `src/main/java/ch/so/agi/lsp/interlis/text/` – Eingabehilfen, Compiler-/Exportkommandos und Sprachfunktionen.
- **A3:** `client/src/diagram/{diagramEditor,glspWebview,sourceNavigation,textNavigation,svgExport,viewportPersistence}.ts` – GLSP-Lifecycle, Navigation, Layout-/Viewport-/SVG-Verhalten.
- **A4:** `src/main/java/ch/so/agi/lsp/interlis/diagram/`, `export/{docx,html}/` – fachliche Graphen und Dokumentausgaben.
- **B1:** `apps/vscode-extension/package.json`, `docs/capability-matrix.md` – verfügbare Beiträge, bewusste Plattformgrenzen.
- **B2:** `docs/completion-und-snippets.md`, `docs/live-diagnostik-und-dirty-navigation.md` – genaue Bedienverträge und dokumentierte Einschränkungen.
- **B3:** `packages/diagram/src/{index,libavoid-router}.ts`, `apps/vscode-extension/src/diagram-view.ts` – ELK-Layout, Exporte, Zustands-/Viewportlogik.
- **B4:** `packages/docx/`, `docs/model-repositories.md`, `docs/testing.md`, `apps/vscode-extension/test/extension-host/` – Dokumente, Auflösung, vorhandene Tests.
- **G1:** `CHANGELOG.md`, `package.json`, GitHub Releases – stabile und Vorab-Funktionen unterscheiden.
- **G2:** `src/assets/{cytoscapeGraph,cytoscapeRenderer,filterTree,cytoscapeExport,scrollbars,webview}.ts`, `src/diagramPanel.ts` – konkrete interaktive Graph-UX.
- **G3:** C#-Handler unter `language-server/src/Geowerkstatt.Interlis.LanguageServer/Handlers/`, `Workspace/WorkspaceModelIndex.cs`, `Visitors/{GraphDocument,GraphDocumentVisitor,MarkdownDocumentationVisitor}.cs` – fachliche Quelle, Imports, Navigation und Dokumentation.
- **J1:** die oben genannten Java-LSP-Dateien, zugehörige `P3*`-/`Lsp*`-Tests.
- **J2:** `interlis-projection`, `interlis-wasm-teavm/src/main/typescript/{diagram-adapter,compiler-client}.ts`, `docs/p3/DIAGRAM_ADAPTER.md`.
- **J3:** `interlis-model/.../DiagnosticMessageFormatter.java`, `interlis-compiler/.../RequestDiagnosticSelector.java`, `interlis-compiler-cli` und CLI-Modernisierungsberichte.

## 4. Verbindliche Paritätsmatrix

**Legende:** „Ja“ meint Quellen-/Dokumentbeleg, nicht eigene Laufzeitabnahme. „Teil“ nennt eine wesentliche Einschränkung. „Nicht belegt“ darf nicht als erwiesene Abwesenheit jeder denkbaren Implementierung gelesen werden. Zielphasen V0–V5 stehen im Plan. Alle mit V0–V5 markierten Funktionen sind beauftragt; ausdrücklich abgegrenzte Dinge stehen in §6.

### 4.1 Editor, Analyse und Auflösung

| ID | Benutzerfähigkeit | A / B / G – Quellenbefund | Java-Ausgangspunkt | Ziel / Besitzer / Prüffokus |
|---|---|---|---|---|
| F01 | `.ili`/`.ILI`, TextMate, Kommentare, Kardinalitäten, Metaattribute | A1/A2, B1, G1: Ja; Metaattribute separat färbbar bei A. | Kein neuer Client. | V0; Extension. Sprach-ID `interlis`, eigene Commands; fremde Extensions nicht automatisch deaktivieren. |
| F02 | Native Semantic Tokens und Folding | J1 implementiert; alte Referenzen nicht überall gleich vollständig belegt. | Ja. | V1; LSP → VS Code. Semantische Farben überschreiben nicht irreführend Metaattribute. |
| F03 | Verständliche Live-Diagnostik mit RelatedInformation | A: zusätzliche Liveanalyse; B: konservativer Liveworker; G: laufende Kompilation. | Analyse vorhanden, LSP-Text noch technisch. | V1; Java. DE/EN, Versionen, Löschen alter Problems, globale Meldungen separat. |
| F04 | Aktuelles Modell manuell prüfen, Output/Abbruch | A1/B1: Ja. | Workspacecommand vorhanden, rootspezifischer Aufruf fehlt. | V1; getypter LSP-Request, aktueller Puffer statt Zwangsspeichern. |
| F05 | Definition/qualifizierte Pfadsegmente | A2/B2/G3: Ja. | `LanguageQueries.definition`. | V1; lokale, geschlossene und externe Quelle; Unicode. |
| F06 | Workspaceweite Referenzen | A2/B2/G3: Ja, B-Dirty-Index eingeschränkt. | Implementiert mit Vollständigkeitsprüfung. | V1; einschliesslich geschlossener `.ili`, keine Teilmenge als vollständig behaupten. |
| F07 | PrepareRename/Rename, END-Namen, Imports, EXTENDED/View-Verweise | A2/B2/G3; G ausdrücklich mit EXTENDED/impliziten View-Basen. | Kernplaner und Projektdateiprüfung vorhanden; Sonderfälle abgleichen. | V1/V4; Java, atomare Planung, readonly und Versionskonflikte. |
| F08 | Hover: Art, qualifizierter Name, Typ, Dokumentation | A2/B2/G3: Ja; G mit klickbaren Namenssegmenten. | HoverInfo vorhanden. | V1; Standard-Markdown, sichere Links; keine freigegebenen beliebigen `command:`-URIs. |
| F09 | Hierarchische Outline/Breadcrumbs | A/B/G vorhanden. | Der betrachtete DocumentSymbol-Adapter ist flach. | V1; echte children, nicht durch Extension rekonstruiert. |
| F10 | Whole-document Formatting, Kommentare und CRLF | A/B/G: Ja. | Gemeinsamer Formatter vorhanden. | V0/V1; LSP, Undo im Editor. |
| F11 | Kontextabhängige Completion, qualifizierte Ersetzung | A2/B2; G1 belegt statische Snippets, keine gleiche semantische Breite behaupten. | Semantische Completion; fehlende Slots nachweisen. | V1/V4; Java. Nur das aktuelle Namenssegment ersetzen. |
| F12 | Snippets MODEL/TOPIC/CLASS/STRUCTURE/ASSOCIATION/VIEW/GRAPHIC/DOMAIN/UNIT/Role | A2/B2/G1 unterschiedlich breit. | Keine vollständige Client-Snippet-UX. | V0 einfache Vorlagen, V4 vollständige Slots/Placeholder. |
| F13 | Gespiegelte Namen, Enter/Tab/Endplatzhalter, Cursorbewegung | A1/B2 ausdrücklich. | Neue Extension erforderlich. | V4; statische Vorlagen/Interaktion im Client, Kontext im Java-Kern. |
| F14 | Automatisches END auf Enter, mehrzeilige Köpfe, kein doppeltes END | A2/B2; B beschreibt VIEW TOPIC-Sonderfall. | Nicht in gleichem Umfang belegt. | V4; reine Core-Planung + onTypeFormatting, keine regexbasierte TS-Sprachanalyse. |
| F15 | 2.3/2.4-, EXTENDS-, LIST/BAG-, FORMAT-, UNIT- und Import-Slots | A2/B2. | `CompletionQueries` und Coreversionen vorhanden. | V4; positive/negative Slotgoldens, nicht ungeprüft B-Sprachregeln übernehmen. |
| F16 | Metaattributname/-wert-Completion | A/B dokumentiert. | Im neuen LSP nicht voll belegt. | V4; gemeinsamer deklarativer Java-Katalog mit Herkunft, keine zweite Typengine. |
| F17 | Neue Datei aus Vorlage | A1/B1. | Clientfunktion. | V0; eingebettete neutrale Vorlage + optionale bewusst gewählte HTTPS-Vorlage, nie stiller Remote-Upload. |
| F18 | Quick Fix: Semikolon, END-Name, unbenutzter Import | B2 ausdrücklich; Live-Scanner hat bekannte Grenzen. | Bisher im Wesentlichen Format-CodeAction. | V4; Core beweist Änderung, nur aktueller Snapshot, Preview/Undo. |
| F19 | Workspacequelle vor Repository; Dirty vor Disk | A/B/G. | Lokaler Projektloader und Workspace vorhanden. | V1; RepositoryClosureService verbinden, keine stillschweigende Mehrdeutigkeitswahl. |
| F20 | Transitive Imports, Cache/Offline, Repositorynavigation | A/B/G: Ja. | Kernresolver vorhanden, LSP-Integration unvollständig. | V1; externe schreibgeschützte Quellen, Inhalt/Position an identischen Digest gebunden. |
| F21 | Dateiwatcher, geschlossene Modelle, Multi-root | A/B/G unterschiedlich; G zeigt geschlossene Dateien ausdrücklich. | Bereits Pfadidentitäten/Watcher/Sicherheitsprüfungen. | V1/V5; ein gemeinsamer Modellraum pro Fenster; Folderwechsel, Symlinks, löscht keine Dirtybuffers. |
| F22 | Neustart/Abbruch/Status ohne Popupflut | A3/B2/B3 Wiederherstellung und Stalezustände. | Scheduler/Cancellation vorhanden. | V0/V5; kontrollierter Neustart, Re-Sync, echte GUI. |

### 4.2 UML – Schwerpunkt und früh zu liefern

| ID | Benutzerfähigkeit | Quellenbefund | Verbindliches Ziel |
|---|---|---|---|
| F23 | Verschachtelte MODEL-/TOPIC-Rahmen | A3/B3/G2 | V2; Sprotty-Containerviews; getrennte Identitäten bei gleichen Labels. |
| F24 | Classes, Structures, Associations, Domains, Views, Constraints | A4/B3/G2 unterschiedlich breit | V2; Java `DiagramDocument` als Autorität; zusätzliche Core-Kinds nicht verlieren. |
| F25 | Attribute, Typen, Kardinalitäten, Enumeration/Inline-Enumeration | A/B/G | V2; exakte Labels, keine AST-Klassennamen oder gerundete Zahlen. |
| F26 | OWN/NONE/OWN_AND_INHERITED, abstrakte Typen abschwächen | A1/B1; G hat eigene Filter/Abstractnotation | V3; Herkunft geerbter Mitglieder erhalten; NONE-Vertrag eindeutig testen. |
| F27 | Vererbungs-, Rollen-, Referenz-/Struktur-, View-/Importkanten | A4/B3/G2 | V2; keine n-äre Assoziation als einzelne Binärkante verfälschen. |
| F28 | Rollenbezeichnungen und Kardinalität an beiden Enden; Aggregation/Komposition | A/G; J dokumentiert fehlende Diamanten im bisherigen Renderer | V2; leere/gefüllte Diamanten am semantisch richtigen Ende, N-är und Self-Loop. |
| F29 | Echte Knoten-/Containerbewegung mit Maus | A GLSP; G Cytoscape; B-ELK/SVG allein belegt keine gleiche Direktmanipulation | V2; echte Sprotty-Moveaktionen, kein statisches SVG als Ersatz. |
| F30 | Kantenführung/Biegung verändern | G explizit; Sprotty besitzt Routinghandles | V2 Polyline/orthogonal, V3 vollständige Modi; Endpunkte unveränderlich, nur Layout. |
| F31 | Layout zurücksetzen und „Settle“ aus aktuellem Stand | G2 | V3; vorhandene Anordnung respektieren, kein stiller Vollreset. |
| F32 | ORTHOGONAL/POLYLINE/SPLINES; NodePlacement | A/B Settings; A beschreibt Splinegrenze | V3; echte Kurven für SPLINES; bestehende ELK-Auswahl, kein irreführender Menüeintrag. |
| F33 | Filterbaum nach Art, Attributen/Constraints/Kanten | G2 | V3; Gruppenzustände/indeterminate, Filter ohne vollständige Reanalyse. |
| F34 | Imports, direkte/indirekte Referenzen, Topic-/Modellrahmen | G2; J hat scopes/neighbourhood | V3; fachlicher Scope Java, reine Sichtbarkeit UI. |
| F35 | All/None/Reset, leere Ansicht, externe Stubs ohne letzte Kante ausblenden | G-preview | V3; explizites „durch Filter leer“, keine endlose Ladeanzeige. |
| F36 | Pan/Zoom/Fit, Scrollbalken, Tastatur | A/B Viewport; G-preview scrollbars/arrow keys | V2 Basis, V3 volle UX; Fokus und Grenzen, kein Springen beim Update. |
| F37 | An Datei angeheftet, optional aktiver Datei folgen | G gepinnt; A/B Custom Editor | V2; default angeheftet, Follow explizit, eigener Zustand je Ansicht. |
| F38 | Liveupdate ohne Layoutverlust, letzte gültige Ansicht als stale | B3/A3; G aktualisiert kompilierten Graph | V2/V3; aktuelle Revisionen, neue/entfernte Knoten, kein alter Sprunganker. |
| F39 | Diagramm → Source (Knoten, Member, Associationkante) | A3/B3/G2 | V2; genaue Range und externe Quelle; veraltete Navigation ablehnen/erneuern. |
| F40 | Source → Diagrammauswahl | A3 textNavigation; J Adapter elementsForSymbol | V3; UI-Synchronisation, **keine** semantische Diagrammbearbeitung. |
| F41 | Full-/Visible-SVG, eigener aktueller Layoutstand | A1/B1; G SVG | V3; Viewbox, Clipping, sichtbare Filter, IDs/Namespaces, exportiert kein altes Defaultlayout. |
| F42 | PNG-Export | G-preview | V3; tatsächlich gerastertes Bild, keine umbenannte SVG; begrenzte Pixelmenge. |
| F43 | Inkscape-kompatible SVG-Verbindungen/semantische Gruppen | A3/B3 | V3; native SVG-Gruppen/IDs und Connectionreferenzen; keine semantische Roundtrip-Zusage. |
| F44 | Kantenkreuzungen PLAIN/GAPS und lesbare Labels | B1/B3 | V3; Gaps nur Sichtdarstellung, Geometrie-/Exportgleichheit. |
| F45 | Undo/Redo eigener Anordnung; Layout persistieren | Teilweise Zustandsvorarbeiten in A/B, nicht überall gleiche UX belegt | V3 explizite neue Qualitätsanforderung; getrennt vom Text-Undo. |
| F46 | Licht/Dunkel/High Contrast, Tastatur und Fehlzustände | A/B Themes, G Webview | V3/V5; semantische Marker nicht nur Farbe; gute Lesbarkeit und keine abgeschnittenen Controls. |

### 4.3 Dokumentation, Exporte und Produkt

| ID | Benutzerfähigkeit | Quellenbefund | Verbindliches Ziel |
|---|---|---|---|
| F47 | Markdown-Objektkatalog | G3 | V4; reine Java-Dokumentprojektion, Vorschau und Speichern. |
| F48 | Dokumentationslabels DE/FR/IT/EN und Headeroverrides | G1/G3 | V4; nur Beschriftungen übersetzen, keine Modellidentifikatoren. |
| F49 | Geerbte Attribute separat/inline/abstract-only; verschachtelte Strukturen | G1/G3, A4/B4 ähnliche Kataloge | V4; rekursive Strukturen mit Referenz statt Endlosschleife, Typ-/Constraintinformationen. |
| F50 | HTML-Dokumentation | A1/A4 | V4; lokaler sicherer Preview/Export, keine externen Skripte/CDN. |
| F51 | DOCX-Objektkatalog | A1/A4/B4 | V4; gültiger OOXML-Export, Tabellen/Abschnitte, kein Text mit `.docx`-Endung. |
| F52 | Mermaid-/PlantUML-Text und GraphML | A1/A4; J Mermaid/PlantUML vorhanden | V4; bestehende Core-Renderer + eigener GraphML-Adapter. Separate historische Previewengines werden nicht parallel aufgebaut, siehe §6. |
| F53 | Offline nach Installation, eigener Server/JRE | A1; B javafrei | V5; lokaler Server + passende gebündelte Java-25-Runtime, kein Compiler-Download beim Modellöffnen. |
| F54 | Desktop und Remote-Workspace | A Desktop; B Desktop/Web; J Java-stdio | V5; Desktop + ein echter Linux-Remote/Containerpfad, Prozesse im Workspacehost. |
| F55 | VSIX-Installation, alle lokalen Ressourcen, Updates/Neustart | A/B/G | V0 installiertes VSIX-Smoke, V5 isolierte saubere Installation/Plattformprüfung. |
| F56 | Konflikt mit vorhandener INTERLIS-Extension | B dokumentiert keine automatische Deaktivierung | V0/V5; neue Identität, Hinweis statt fremde Extension zu löschen, keine alten Command-Aliase. |
| F57 | Sichere Modelle/Kommentare/Farben/URLs | G1, J safeText, B Rendererescaping | V1–V5; CSP, erlaubte Schemes, keine Quelle als HTML/JS/Command ausführen. |
| F58 | Ressourcen-/Queue-/Layoutlimits, Cancellation | J/B | V1–V5; ehrliche Teilansichten, kontrollierter Abbruch, keine unbeschränkten Queues. |
| F59 | Keine Altprojektabhängigkeit | ausdrücklicher Nutzerauftrag | V0–V5; keine @ilic-Pakete, Git-/file-/workspace-Links, dynamic fetches, Runtime-Wrapper oder kopierte zweite Sprachengine. |
| F60 | Echte GUI- und unabhängige Abnahme | ausdrücklicher Nutzerauftrag | Jede UI-Phase und V5; realer VS-Code-Workbench/Webview, nicht nur `vscode.execute...`-API. |

## 5. Bewusste Quellübernahme statt Copy/Paste-Architektur

| Bereich | Entscheidung | Begründung / Behandlung |
|---|---|---|
| A/B TextMate, Sprachkonfiguration, neutrale Snippets | **Kontrolliert übernehmen und anpassen** | Lizenz/Commit/Dateihash protokollieren, neue IDs, keine globalen Editorpräferenzen. |
| A `extension.ts` / kompletter GLSP-Client | **Nicht übernehmen** | Zu viele verknüpfte Workflows und eigener Transport; nur einzelne isolierte UI-Ideen/Helper. |
| A Java-Parser, ili2c-Kompilierung, eigene Live-Symboltabellen | **Nicht übernehmen** | Neue Java-Engine ist einzige Sprachautorität. |
| B language-service, language-server, EditorSnapshot-Scanner, compiler-wasm | **Nicht übernehmen und nicht abhängig machen** | Doppelte Semantik; dokumentierte Grenzen bei Blockkommentaren und Dirty-Rename nicht reproduzieren. |
| J vorhandener gepinnter Diagrammcode aus B | **In eigenen neutralen Diagrammbaustein überführen** | Vorhandene Layout-/Export-/Geometriearbeit nutzen; fremde Typverträge beseitigen, echte Sprotty-Views ergänzen. |
| B Viewport-/SVG-/Routing-/Exportalgorithmen | **Einzeln übernehmen oder neu schreiben** | Nur reine Darstellung; neue Eigentümerschaft, Lizenz, Tests und keine Imports aus B. |
| G Filter-/Interaktionskonzepte | **Nach Benutzerverhalten neu umsetzen** | Architektur bleibt ELK/Sprotty. Kein paralleler Cytoscape-/fCoSE-Produktpfad. Direkte Codeübernahme nur sinnvoll bei unabhängigen Helfern mit Lizenzbeleg. |
| A/G Dokumentationsvisitor | **Verhalten als Referenz, Java-Projektion neu** | Kein fremder AST als Geschäftsmodell; `CompiledSchema`/Semantik nutzen. |
| Alte Tests und Fixtures | **Gezielt als Regression übernehmen** | Erwartung gegen neue Norm-/API-Verträge prüfen; alte Compilerakzeptanz ist nicht automatisch normativ richtig. |

Alle übernommenen Dateien erhalten eine Eintragung in einer kleinen `docs/provenance/source-adoptions.md`: Ursprung, vollständiger Commit, Pfad/Hash, Lizenz, neuer Pfad, beibehalten/geändert/neu, wichtigste Tests. Keine Pflicht, ehemalige npm-Namen aus historischen Lizenzhinweisen zu tilgen. Keine Git-Submodule oder Builddownload der Altprojekte. **Nach der einmaligen Übernahme müssen Build und Tests ohne deren Checkout funktionieren.**

## 6. Ehrliche Grenzen der Parität

In diesem Auftrag nicht enthalten: INTERLIS 1; eigenständiger Browser-LSP für VS Code Web; Theia-/Monaco-Hostqualifikation; OPFS/PWA/Git-Funktionen einer Web-IDE; XTF-Datenvalidierung; Datenbankwerkzeuge; grafisches Erzeugen/Löschen/Umbenennen von INTERLIS-Elementen; semantisches Umhängen einer Assoziation.

Die alte GLSP-WebSocket-Schnittstelle, frühere Extension-/Command-IDs und ili2c-Bedienprofile sind Implementierungs-/Kompatibilitätsdetails, keine zu erhaltenden Nutzerfähigkeiten. Keine eigenen Mermaid- und PlantUML-Livepreview-Server neben dem neuen interaktiven UML-Editor: deren **Textausgaben bleiben**, die interaktive Standardansicht ist Sprotty. Das ist eine ausdrücklich benannte Bündelung der Previewoberfläche, keine Behauptung byte-/pixelgleicher alter Previewparität.

Farbe/Notation `geow.uml.color`: Falls vorhandene Metadaten in der neuen Diagrammprojektion verfügbar sind, als explizite, sichere Präsentationsoption behandeln; keine Geowerkstatt-Sprachsemantik einführen. Zulässig sind nur validierte Farbliterale, niemals CSS-/HTML-Strings. Die Baseline wird in V0 festgehalten.

Parität wird nur für die genannten Funktionen und tatsächlich geprüften Plattformen bestätigt. Nicht belegte Features werden nicht aufgrund eines README-Häkchens freigegeben.

## 7. Primärquellen

1. [Java-Merge b8051493](https://github.com/edigonzales/interlis-java/commit/b8051493a8b93e0be4b12735785803d068df6f80).
2. [Java CLI-Modernisierungsstatus](https://github.com/edigonzales/interlis-java/blob/b8051493a8b93e0be4b12735785803d068df6f80/docs/implementation/compiler-cli-modernization/STATUS.md).
3. [Java LSP TextDocumentService](https://github.com/edigonzales/interlis-java/blob/b8051493a8b93e0be4b12735785803d068df6f80/interlis-lsp/src/main/java/guru/interlis/lsp/InterlisTextDocumentService.java).
4. [Java WorkspaceService](https://github.com/edigonzales/interlis-java/blob/b8051493a8b93e0be4b12735785803d068df6f80/interlis-lsp/src/main/java/guru/interlis/lsp/InterlisWorkspaceService.java).
5. [LanguageQueries](https://github.com/edigonzales/interlis-java/blob/b8051493a8b93e0be4b12735785803d068df6f80/interlis-compiler/src/main/java/guru/interlis/compiler/query/LanguageQueries.java).
6. [Vorhandener Java-Diagrammadapter](https://github.com/edigonzales/interlis-java/blob/b8051493a8b93e0be4b12735785803d068df6f80/docs/p3/DIAGRAM_ADAPTER.md).
7. [A Manifest](https://github.com/edigonzales/interlis-lsp/blob/65864b3cd74e7cd8a2ff8e066331e717cebc517e/client/package.json), [A Architektur/Features](https://github.com/edigonzales/interlis-lsp/blob/65864b3cd74e7cd8a2ff8e066331e717cebc517e/README.md).
8. [B Manifest](https://github.com/edigonzales/interlis-language-tools/blob/f27801bfebf0fdac82a19e016f4c347ae2b6f8fb/apps/vscode-extension/package.json), [B Capability-Matrix](https://github.com/edigonzales/interlis-language-tools/blob/f27801bfebf0fdac82a19e016f4c347ae2b6f8fb/docs/capability-matrix.md).
9. [B Completion/Auto-Close](https://github.com/edigonzales/interlis-language-tools/blob/f27801bfebf0fdac82a19e016f4c347ae2b6f8fb/docs/completion-und-snippets.md), [B Live-Grenzen](https://github.com/edigonzales/interlis-language-tools/blob/f27801bfebf0fdac82a19e016f4c347ae2b6f8fb/docs/live-diagnostik-und-dirty-navigation.md).
10. [B Diagrammcode](https://github.com/edigonzales/interlis-language-tools/blob/f27801bfebf0fdac82a19e016f4c347ae2b6f8fb/packages/diagram/src/index.ts).
11. [Geowerkstatt Changelog](https://github.com/geowerkstatt/vsc_interlis2_extension/blob/64667fee3e0350a4d6de66ca54f9d3773c53dc39/CHANGELOG.md), [Prerelease 1.0.2-78](https://github.com/geowerkstatt/vsc_interlis2_extension/releases/tag/v1.0.2-78), [stable 1.0.1-74](https://github.com/geowerkstatt/vsc_interlis2_extension/releases/tag/v1.0.1-74).
12. [Geowerkstatt Graph-Interaktion](https://github.com/geowerkstatt/vsc_interlis2_extension/blob/64667fee3e0350a4d6de66ca54f9d3773c53dc39/src/assets/cytoscapeRenderer.ts), [Filterbaum](https://github.com/geowerkstatt/vsc_interlis2_extension/blob/64667fee3e0350a4d6de66ca54f9d3773c53dc39/src/assets/filterTree.ts).
13. [Sprotty Routing-Modell](https://github.com/eclipse-sprotty/sprotty/blob/main/packages/sprotty/src/features/routing/model.ts), [Sprotty Datenmodell](https://sprotty.org/docs/learn/data-model/). Konkrete Paket-APIs am in V0 gepinnten Stand prüfen.
14. [VS Code LSP-Anleitung](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide), [Webviews](https://code.visualstudio.com/api/extension-guides/webview), [Remote](https://code.visualstudio.com/api/advanced-topics/remote-extensions).
15. [VS Code Extension-Host-Tests](https://code.visualstudio.com/api/working-with-extensions/testing-extension), [ExTester – echte UI-Tests](https://github.com/redhat-developer/vscode-extension-tester).
16. [OpenCode 2 CLI](https://dev.opencode.ai/v2/docs/cli/commands/), [DeepSeek Modellzuordnung](https://api-docs.deepseek.com/quick_start/pricing/).

Zusätzliches Verfahrensvorbild: die drei vom Nutzer angehängten Kartenkatalog-Cleanup-Markdowns. Übernommen werden Rollen, Kriterien, Commitbindung und unabhängige Gegenproben. Nicht übernommen werden Quarkus-/Python-/Docker-Cleanup-Arbeiten, pauschale Volltests oder die manuelle GUI-Handoff-Pflicht; der neue Auftrag verwendet den vereinbarten autonomen OpenCode-CLI-Weg.
