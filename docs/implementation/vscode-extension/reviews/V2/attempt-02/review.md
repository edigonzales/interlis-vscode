# Unabhängiger Review V2 – INTERLIS VS Code

## 1. Identität

- **Phase / kumulative Abnahme:** V2 (V2-01 … V2-10). Keine kumulative V5-Abnahme.
- **OpenCode / Provider / API-Modell / API-Host:** `opencode v2.0.28`; Provider `deepseek`; Modell-ID `deepseek-flash`; Host `https://api.deepseek.com` über die Provider-Konfiguration `opencode.json`. Kein HTTP(S)/ALL-Proxy und keine `OPENAI_BASE_URL`/`DEEPSEEK_BASE_URL`-Umgebungsvariable gesetzt.
- **Nachweis der Aliaszuordnung:** Die offizielle Seite <https://api-docs.deepseek.com/quick_start/pricing/> wurde in dieser Session frisch geöffnet. Sie nennt für `deepseek-flash` die Modellversion **DeepSeek-V4.1-Flash-1017** und die Base-URL `https://api.deepseek.com`. Das passt zum wirksamen Provider-/Modellprofil. Die Modellselbstauskunft allein wurde nicht als Identitätsbeleg verwendet.
- **Core:** assignmentBase `20b0029d824b3602d9a304320bf0feae4c35c1f9`; phaseBase `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9`; candidate `7026e7f6b5834bf593d91dfee3323efb60688f3d`; tatsächlicher HEAD `7026e7f6b5834bf593d91dfee3323efb60688f3d`.
- **Extension:** assignmentBase `73badd9807f407aea048d397af5549fe907a1501`; phaseBase `e576a30e4adcf6e36bfe662b402ca87034450dab`; candidate `01f353114cc7a19a9ac6dd884cb0b285ac723c9c`; tatsächlicher HEAD `01f353114cc7a19a9ac6dd884cb0b285ac723c9c`.
- **Tracked Zustand vorher/nachher:** Core vor und nach der Prüfung sauber (`git status --porcelain=v1` leer). Extension vor und nach der Prüfung nur mit dem untracked Laufzeit-/Harnessfile `?? opencode.json`; die getrackten Produkt-, Test-, Build-, Lock- und AC-Dateien blieben unverändert. Es wurde keine Produktdatei geändert und kein Commit erzeugt.
- **VSIX / Server / Schema / UI / Runtime:** Request-Artefakt `interlis-vscode-darwin-arm64.vsix` mit SHA-256 `61d73edf2768f2d6f6cfdc3e7f23cba46af6c52079a99b392b5b47ed88a21776`; frisch gepacktes VSIX `82ac537fb65c469da1049c5e1de1a8a23e13d4c0bb256c96967a0f80225c4484`. Alle **69/69** VSIX-Payloaddateien sind byte-identisch; der Wrapper-Hash unterscheidet sich nur durch ZIP-/Packaging-Metadaten. Installierter Client-Bundle-Hash `03b70c5113c3bb12225da227f28db4765995658b788f4d23719015fcfb7a62f6`; LSP-JAR `11dba44845b691080daa7308090515e103fad16d618d91ffff61f1f90caf3998`; Renderer `diagram-ui.js` `ea3b031f61e6bd36c9ea6d95f9c93f7064878322f7c43b0f7403c81b00a51c1b`, Worker `c0dc844ac1739a1e1e4f64d08a9ec4594818d5aa7e0cb26e5096b6d34b864e2b`. Alle 54 in `request.json` gelisteten Artefakte wurden vorhanden und hash-identisch geprüft.
- **VSCode / Driver / OS / Architektur:** VS Code `1.140.0`; vscode-extension-tester `8.28.1`; ChromeDriver `150.0.7871.250`; macOS `24.6.0` arm64; Java `25.0.3-tem` (ohne Preview).
- **Bildinventar:** `image-read-inventory.json` listet **29** in dieser Session tatsächlich mit dem Bildwerkzeug geöffnete Bilder mit SHA-256. Es gibt keine byte-identischen Aliase. Nicht geöffnete Bilder werden nicht als visuell geprüft behauptet.

## 2. Eigene Ziel-, Code- und Architekturprüfung

- **Relevante Änderungen/Consumers:** Der V2-Diff führt den neutralen Baustein `core/frontend/diagram-ui` ein, migriert den bestehenden Browserconsumer auf diese Quelle und entfernt die aktive alte Vendorquelle. Neu sind ausserdem der versionierte LSP-Diagramm-/Navigationsvertrag, die kompakte binäre Projektionsdarstellung, Enum-Herkunft/Anker, der VS-Code-Customeditor/Webview-Host sowie Extension-Integritäts-/Launchprüfungen.
- **Keine zweite Semantik:** `interlis-wasm-teavm/src/main/typescript/diagram-adapter.ts` ist nur noch ein Re-Export von `frontend/diagram-ui/src/adapter`. Die gemeinsame Quelle importiert nur `sprotty`, `sprotty-protocol`, `elkjs`, `inversify`, `snabbdom`, den lokalen generierten Schema-Validator und eigene Module; keine `vscode`-, `@ilic`-, Language-Service- oder Compiler-AST-Imports. Die Extension enthält keine Rendererquellkopie, sondern bezieht das geprüfte Artefakt `artifacts/diagram-ui` aus dem gelockten Core-Bundle.
- **Keine Altdependency:** `package.json`, `package-lock.json`, der installierte volle npm-Graph und `out/extension.cjs` wurden durch `verify:no-legacy-dependencies` geprüft; keine `@ilic/`-, `interlis-language-tools`- oder `ilic.wasm`-Referenz im aktiven Produktgraph. Historische Herkunftsnennungen sind nur in Provenienz-/Lizenzdokumenten vorhanden.
- **Eine Rendererquelle:** `frontend/diagram-ui` besitzt `provenance.json` mit Upstream-Commit, Originalpfaden und SHA-256 sowie MIT-/ELK-Lizenztexte. `build-browser-tools.cjs` und `editorBundle` konsumieren dieselben `dist`-Bytes; der bestehende Browser und die Extension verwenden nachweislich dieselben Dateihashes. Die alte aktive `vendor/ilic-diagram`-Quelle ist entfernt.
- **Fachliche Verträge:** `interlis/diagram` liefert ein typisiertes `DiagramResponse` mit Protokoll-/Schema-Version, Server-/Request-/Diagramm-/Snapshot-/Workspace-Identität, Client-Dokumentversionen, Source-Revisions und dem kanonischen `DiagramDocument` als JSON-Objekt. Der echte stdio-Test prüft zusätzlich explizite Nullfelder über LSP4J. `interlis/diagramNavigate` prüft Server-, Snapshot-, Dokument-/Workspace-Revisionsbindung und liefert `ContentModified` statt eines falschen Sprungs. Readonly-Importe laufen über `interlis-source:` mit Digest-/Revisionsbindung.
- **Source-/Snapshot-/Readonlygrenzen:** Der Client verwirft Antworten nach Generations-, Root-, Versions- oder Serverwechsel; die Webview navigiert nur bei `FRESH`/`PARTIAL`, nicht bei `STALE`. Ein Serverstopp lässt den alten Graphen sichtbar, verhindert aber die Navigation. Die Quelle bleibt bei allen Layout-/Routengesten unverändert. `resolveLaunchPlan` prüft jede Server-JAR-Hash und Java 25 vor dem Start; `verifyDiagramAssets` prüft Renderer, Worker, Schemas und Typen separat vor dem Customeditor.
- **Sicherheitsgrenzen:** Webview-CSP ohne `unsafe-eval`, lokale Ressourcen, Nonce, `worker-src blob:`; diskriminierte Nachrichten mit Channel-/Generation-/Whitelist-Prüfung; keine Command-/Pfad-/Shell-Ausführung aus Webviewtexten. Die Webview verwirft unbekannte Nachrichtenfelder. Die VSIX-Inventur enthält keine Tests, Skripte, Dokumentationsordner oder Secrets.

## 3. Jede fällige Muss-AC

| AC-ID | Urteil | Eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|
| V2-01 | **erfüllt** | `frontend/diagram-ui/provenance.json`, Lizenztexte, `verify:no-legacy-dependencies`, `diagram-adapter.ts`-Re-Export, gemeinsame Artefakthashes; unabhängige Grep-Prüfung auf verbotene Imports/Dependencies | keines |
| V2-02 | **erfüllt** | `DiagramProtocolTest` + `LspProcessTest` (echter stdio-Launcher), `test/protocol.test.cjs` (gepackte Distribution); typisiertes `document`-Objekt, Versionen, Identitäten, Completeness | keines |
| V2-03 | **erfüllt** | Frisches GUI-12 (MODEL/TOPIC/CLASS/STRUCTURE/DOMAIN/VIEW/ASSOCIATION, Member, Constraint, Enum-Werte) und eigener Gegenfall mit zwei gleichnamigen `Alpha`-Klassen in getrennten Topics (verschiedene Canonical-Namen/IDs) | keines |
| V2-04 | **erfüllt** | Frisches GUI-16 (ternäre Rollen, eigenes Attribut, Komposition, Self-/Parallelkanten, Endlabels); `CompactAssociationProjectionTest` (Enden, Kardinalitäten, Aggregation am semantisch richtigen Ende); eigener Gegenfall prüft ternäre Assoziation in `ENTITY` und `COMPACT_BINARY` | keines |
| V2-05 | **erfüllt** | Frisches GUI-13/14 mit echten Pointeraktionen, Geometrie-/Quelldatei-/Dirty-Orakel; eigener Gegenfall mit Knoten- und Routenhandle-Drag; Source-Buffer/-Hash/dirty unverändert; keine Source-/Target-Reconnect-Handles; native UI-Test | keines |
| V2-06 | **erfüllt** | Frisches GUI-15 (Klasse, Member, Assoziation, readonly Import nach CRLF/Emoji); eigener Gegenfall mit exakten UTF-16-Ranges für `westValue`/`eastValue`; Java-`ContentModified`- und Snapshot-/Serverprüfungen; Stale-Click wird abgewiesen | keines |
| V2-07 | **erfüllt** | Frisches GUI-17/18 (verspätete echte Workerantwort, Partial, Layoutkontinuität, Pinning/Follow, parallele Panels); eigener Gegenfall mit Serverstopp → sichtbarer `STALE`-Graph ohne Navigation, danach sauberer Neustart/Fresh; Codeprüfung Nicht-ILI-Fokus und `dispose()` | keines; visuelle Error-/Close-Zustände sind bewusst V3-10/V3-07 |
| V2-08 | **erfüllt** | Frischer installierter GUI-Lauf `18/18` auf candidate core `7026e7f` / extension `01f3531`, inkl. GUI-02/05/07/12–18, echte Maus-/Tastaturpfade, Screenshots vor/nach Drag und Route | keines |
| V2-09 | **erfüllt** | Frisch: Projektion 21/21, LSP 7/7, Diagrammadapter 6/6, Browserconsumer Chromium/Firefox/WebKit 3/3, native Sprotty-UI 1/1, Extension-Unit 7/7, echter Paket-stdio 1/1, Dependencyprüfung; keine zweite Rendererkopie; kein Semantikverlust in Tests/Bildern | keines |
| V2-10 | **erfüllt** | Unabhängiger installierter GUI-Gegenfall 1/1 (eigenes CRLF-/Emoji-Fixture, zwei gleichnamige Klassen, ternäre attributierte Assoziation, Pointer-Drag, Routenhandle, exakte Ranges, Stale/Neustart, Sourcehash); Lizenz-/Dependencyprüfung; Produktpaar unverändert | keines |

## 4. Featureparität (V2-Scope)

- **F23 (MODEL-/TOPIC-Rahmen):** gemeinsame Sprotty-Containerviews; frische GUI-12 und eigener Gegenfall zeigen beide Topic-Rahmen und getrennte Identitäten.
- **F24 (Classes/Structures/Associations/Domains/Views/Constraints):** Java-`DiagramDocument` als Autorität, GUI-12 prüft alle Kategorien; Enum-/Constraint-Daten sind sichtbar.
- **F25 (Attribute/Typen/Kardinalitäten/Enums):** Memberlabels in GUI-12/16 und eigenem Gegenfall; `State`-Enumwerte und ternäre Rollen sichtbar.
- **F27 (Vererbungs-/Rollen-/Referenz-/Struktur-/View-/Importkanten):** Kanten aus Projektion; GUI-12/16 und Browser-/Adaptertests; kompakte Binärkanten nur bei fachlich geeigneten Assoziationen.
- **F28 (Rollen/Kardinalität/Aggregation/Komposition):** Endmarker und Labels am richtigen Ende; `CompactAssociationProjectionTest` und GUI-16; Self-/Parallelkanten sichtbar.
- **F29 (Knoten-/Containerbewegung):** frische GUI-13, native UI-Test, eigener Gegenfall; echte Pointeraktionen, keine Sourceänderung.
- **F30 (Kantenführung):** frische GUI-14 und eigener Routenhandle-Gegenfall; Endpunkte unverändert, keine Reconnect-Handles.
- **F36 (Basis Pan/Zoom/Fit):** Fit/Zoom im Customeditor; volle Scrollbars-/Tastatur-UX bleibt V3.
- **F37 (Pinning/Follow):** GUI-18 und Clientcode; Default angeheftet, Follow nur explizit.
- **F38 (Liveupdate/Stale):** GUI-17 und eigener Stale-Gegenfall; alte Graphen bleiben sichtbar markiert, veraltete Antworten publizieren nicht.
- **F39 (Diagramm→Quelle):** GUI-15 und eigener exakter Range-Gegenfall inkl. readonly Import.
- **F57 (sichere Texte/URLs/CSP):** Code-/CSP-/Nachrichtenprüfung; keine externen aktiven Ressourcen, keine `javascript:`-/Command-URIs.
- **F58 (Limits/Cancellation):** Diagramm-/Mitgliedslimits, Workerabbruch, Requestgenerationen, begrenzte Published-Registry.
- **F59 (keine Altprojektabhängigkeit):** Dependency-/Bundle-/Lock-Prüfung; historische Provenienz nur dokumentarisch.
- **F60 (echte GUI-Abnahme):** frischer installierter 18/18-Lauf plus eigener neuer installierter Gegenfall; keine Controller-/JS-Eval-Ersatzaktion.
- **Bewusst noch nicht V2:** vollständiger Filterbaum (F26/F33–35), Settle/Reset/Pins/Splines (F31/32), Layout-Undo/Viewpersistenz (F45), Source→Diagramm-Komfort (F40), SVG/PNG/Inkscape (F41–44), Dokumentation/Editorhilfen (F11–22, F47–52), Plattformen/Remote (F53–55). Diese Grenzen wurden nicht als V2-erfüllt ausgegeben.

## 5. Risikobasierte Tests

| Gate/Case | Fällig / nicht fällig | Ausgeführtes Kommando und cwd | Exit / Ergebnis | Eigener Lauf oder geprüftes Artefakt | Rohbeleg |
|---|---|---|---|---|---|
| T0 Abhängigkeiten/Assets | fällig | `npm ci --ignore-scripts` in `extension`; `npm run stage:core -- --core-dir <core>`; SHA-256 über alle Request-Artefakte | 0; 0; 54/54 | eigener Lauf | `review-checks.json`, VSIX-Payloadvergleich |
| T0 Provenienz/Renderer | fällig | `node frontend/diagram-ui/prepare.cjs` in `core`; Import-/Dependency-/Lizenzprüfung | 0 | eigener Lauf | `frontend/diagram-ui/provenance.json`, `review-checks.json` |
| T1 Projektion | fällig | `./gradlew :interlis-projection:test --rerun-tasks --no-daemon` in `core` | 0; 21 Tests, 0 Fehler, 0 Skips | eigener Lauf | JUnit-XML, `review-checks.json` |
| T2 LSP-stdio | fällig | `./gradlew :interlis-lsp:test --tests '*DiagramProtocolTest' --tests '*LspProcessTest'` in `core`; `npm run test:protocol` in `extension` | 0; LSP 7 Tests 0 Fehler; Paket-stdio 1/1 | eigener Lauf | JUnit-XML, `review-checks.json` |
| T3 nativer Renderer | fällig | `node --test frontend/diagram-ui/test/interactive.test.cjs` in `core` | 0; 1/1 | eigener Lauf | `review-checks.json` |
| T3 gemeinsamer Browserconsumer | fällig | `./gradlew :interlis-wasm-teavm:diagramAdapterTest :interlis-wasm-teavm:uiProjectionTest -PnodeExecutable=<node24>` in `core` | 0; Adapter 6/6, Chromium/Firefox/WebKit 3/3 | eigener Lauf | `review-checks.json`, `final-shared-evidence` |
| T4 installierte GUI | fällig | `npm run test:gui -- --suite uml --cache <cache>` in `extension` | 0; **18/18**; 3 Java-Starts, 2 saubere Exits, 0 Rest | eigener Lauf auf candidate pair | `fresh-gui/manifest.json`, `fresh-gui/cases.json`, frische Bilder |
| T4 eigener GUI-Gegenfall | fällig | `COUNTERPROBE_EVIDENCE=<evidence> node build/reviewer-counterprobe/run.cjs` | 0; **1/1**; 2 Java-Starts, 1 sauberer Exit, 0 Rest | eigener Lauf | `counterprobe-manifest.json`, `probe-*.png`, `probe-geometry.json` |
| T4 Negativcanary | fällig | `npm run test:gui -- --suite smoke --cache <cache> --canary missing-status` | **1 erwartet**; 2 echte Smoke-Fälle bestanden, 1 absichtlicher Fehlschlag | eigener Lauf | `canary-r2.log` |
| T4 Extension-Host | nicht erneut nötig | — | — | Extension-Quell-/Testbytes unverändert gegenüber unabhängig geprüftem V2-final-r1; Unit/stdio/Dependency frisch | `review-checks.json` |
| T6 voller Compilerkorpus/Benchmark/Release | nicht fällig | — | — | kein Parser-/Binder-/Normänderung; betroffene Projektion/Browser/LSP frisch | `request.json`, Diffanalyse |
| T6 Safari-/unrelated Browserbenchmarks | nicht fällig | — | — | gemeinsame Consumer inkl. WebKit frisch; keine Safari-spezifische Consumeränderung | `review-checks.json` |
| T5 Crossplatform/Remote | nicht fällig in V2 | — | — | ausdrücklich V5 | `request.json` |

Umgebungsanmerkung: Im frischen Core-Worktree musste für die bestehende `buildBrowserTools`-Aufgabe zuerst `npm ci --ignore-scripts` in `interlis-wasm-teavm` ausgeführt werden; das ist eine reproduzierbare Testvoraussetzung, keine Produktänderung. Die getrackten Trees blieben sauber.

## 6. Echte GUI und Sichtprüfung

**Aktionen mit sichtbarer Reaktion (frischer 18/18-Lauf):** Explorer öffnen, gültiges/ungültiges Modell öffnen, Problems öffnen, F12/Formatierung/Undo/Redo und Serverneustart; Hover/Definition im Dirtybuffer; Referenzen/Rename/Compile/Offline-Import/readonly Import/Outline/Completion/Theme; „Show Diagram for This File“, Knoten- und Topic-Drag, Kantenhandle-Drag, Diagramm→Quelle, ternäre/Compact-Self-Ansicht, verspätete echte Workerantwort, Pinning/Follow und zwei getrennte Panels. Alle 18 Szenarien bestanden mit echten Maus-/Tastaturaktionen.

**Eigener installierter Gegenfall:** eigenes CRLF-/Emoji-Modell mit `West.Alpha` und `East.Alpha` (gleicher einfacher Name), `Holds` und einer ternären attributierten `Trio`-Assoziation. Geprüft wurden:
- beide Alpha-Knoten mit verschiedenen Canonical-Namen/IDs und unabhängigen Geometrien,
- ternäre Rollen `first/second/third` und Attribut `memo` in `ENTITY` **und** `COMPACT_BINARY`,
- natives Ziehen von `West.Alpha` ohne Bewegung von `East.Alpha` und ohne Source-/Buffer-/Diskänderung,
- exakte UTF-16-Selektionen für `westValue` (Zeile 8) und `eastValue` (Zeile 28) jeweils im richtigen Topic,
- echter Routenhandle-Drag mit geänderter Route, unveränderten semantischen Endpunkten und unveränderter Quelle,
- Serverstopp: alter Graph sichtbar als `STALE`, Klick auf einen Knoten bewegt den Quelleditor nicht,
- Neustart: frische Session zeigt den aktuellen Graphen, ohne die alte manuelle Geometrie stillschweigend wiederzuverwenden.

**Tatsächlich angesehene Bilder:** In dieser Session wurden 29 Bilder mit dem Bildwerkzeug geöffnet und visuell beurteilt; die vollständige Liste mit Hashes steht in `image-read-inventory.json`. Darunter: eigene `probe-01…10` (zwei Topics/gleicher Name, ternär-compact, Knoten-Drag, exakte West-/Ost-Ranges, Route vor/nach, Stale sichtbar, Stale-Klick abgewiesen, Neustart), frische `GUI-12/15/16/18`, ältere finale `GUI-13/14/16/17/18` sowie `chromium-*`/`webkit-*`-Self-Loop-Bilder und das native `interactive/route-moved.png`.

**Visuelle Qualität:** Die Diagramme zeigen lesbare Modell-/Topic-Rahmen, Klassen/Member/Typen, Assoziations- und Endlabels. Die Self-Loop-Bilder in Chromium und WebKit zeigen eine räumlich getrennte Schleife mit `parent`/`children`-Rollen und Kardinalitäten statt einer gefalteten Linie. Die frischen GUI-13/14-Bilder zeigen die bewegte Geometrie und eine sichtbar gebogene Route. Die eigenen Stale-Bilder zeigen den weiterhin sichtbaren alten Graphen mit „Server stopped …“; der Quelltext bleibt unverändert. Keine abgeschnittenen Controls oder unlesbaren überlappenden Rollenlabels wurden in den geprüften Bildern festgestellt.

**Source-/Bufferfreiheit:** GUI-13/14/16 und der eigene Gegenfall prüfen Buffertext, Dirtyzustand und Dateihash vor/nach den Layoutaktionen; alle blieben unverändert. Layout-/Routengesten ändern nur den Viewzustand.

**Export/Dialog/Plattform/Remote:** In V2 nicht fällig; SVG/PNG/Inkscape, echte Dateidialoge und Crossplatform/Remote bleiben V3/V5.

## 7. Neue Gegenproben

- **Eigener installierter GUI-Gegenfall (neu):** Hypothese: Zwei gleichnamige Klassen in verschiedenen Topics könnten im Customeditor/Webview Identitäten oder Navigationsranges vermischen; ternäre Assoziationen könnten in der Compact-Darstellung reduziert werden; ein STALE-Graph könnte weiterhin navigieren. Die neue Fixture und die neuen Assertions prüfen genau diese Punkte mit echtem Java-LSP, echter Selenium-Pointereingabe und exakten UTF-16-Ranges. Erwartet und tatsächlich beobachtet: getrennte IDs/Geometrien, erhaltene ternäre Rollen/Attribut in beiden Darstellungen, korrekte West-/Ost-Zeilen, unveränderte Quelle, abgewiesener Stale-Klick, sauberer Neustart. Exit `0`, 1/1 Fall.
- **Negativcanary:** Der Harness wurde mit einer absichtlich unmöglichen sichtbaren Statusanzeige konfrontiert. Erwartet: echter Fehlschlag, nicht stilles PASS. Tatsächlich: Exit `1`, zwei andere echte Smoke-Fälle bestanden, genau der GUI-01-Canary schlug fehl.
- **Artefakt-/Identitätsgegenprobe:** Neu gepacktes VSIX mit dem Request-VSIX verglichen: 69/69 Payloaddateien byte-identisch; Wrapper-Hashdifferenz nur durch ZIP-Metadaten. Der frische GUI-Lauf installierte das aktuelle VSIX und verifizierte Bundle-/Server-/Rendererhashes.
- **Falsifizierbarkeit:** Die Assertions würden bei einer Topic-Verwechslung (falsche Zeile), einer Endpunktänderung, einer Reduktion der ternären Assoziation, einer Source-/Dirty-Änderung oder einer Navigation aus dem STALE-Zustand tatsächlich fehlschlagen. Es wurden keine Erfolgsmeldungen, Controller-Zustände oder JS-Eval-Änderungen als Ersatz für Benutzeraktionen verwendet.

## 8. Findings / Blocker

**Offene Muss-Findings:** keine.

**Optionale Beobachtungen (nicht abnahmebestimmend):**
1. `docs/provenance/source-adoptions.md` enthält noch den Satz, die V2-Rendererübernahme sei „geplant, noch nicht ausgeführt“, obwohl `frontend/diagram-ui/provenance.json` und die gestagten Artefakte die Übernahme belegen. Das ist eine veraltete Dokumentationszeile, keine funktionale oder lizenzrechtliche Lücke; eine spätere Aktualisierung ist empfehlenswert.
2. Die visuellen Zustände `ERROR` sowie Panel-Close/Hide/Reload werden in V2 nicht als eigene GUI-Szenarien geprüft; Code und Statusmodell sind vorhanden, die expliziten Prüfungen stehen in V3-10/V3-07 an. V2-07 wurde daher nicht als vollständige Error-/Lifecycle-Ästhetikabnahme gelesen.
3. Der Wrapper-Hash des frisch gepackten VSIX unterscheidet sich vom Request-Artefakt, während alle Payloaddateien identisch sind. Für die Produktidentität wurden SHAs, Lock, Server-/Renderer-/Bundlehashes und der installierte Lauf verwendet, nicht der ZIP-Wrapper allein.

**Fehlende Pflichtnachweise:** keine. Alle in `request.json` geforderten Checks und GUI-Fälle wurden entweder in dieser Session selbst ausgeführt oder nach exakter Byte-/Hashidentität als unveränderte, bereits unabhängig geprüfte Belege herangezogen; der risikotragende Teil (frische GUI-18/18 plus eigener Gegenfall) wurde vollständig selbst ausgeführt.

## 9. Urteil

**PASS**

Begründung: Alle V2-01…V2-10 sind durch Code, echte stdio-/Prozessprüfungen, frische Projektions-/Renderer-/Browserchecks, einen frischen installierten GUI-Lauf 18/18 und einen eigenen neuen installierten GUI-Gegenfall belegt. Die Produktidentitäten stimmen; es gibt keine offenen Muss-Findings, keine Altdependency und keine zweite Rendererquelle. V3 bleibt bis zum äusseren Prozessabschluss gesperrt. Dieses inhaltliche PASS ersetzt nicht den äusseren OpenCode-/Guardabschluss und die Artefaktidentitätsprüfung durch Codex; der endgültige Prozessexit ist aus dieser laufenden Session nicht behauptet.
