# Unabhängiger Review V3 – INTERLIS VS Code

## 1. Identität

**Phase / kumulative Abnahme:** V3 (UML-Parität, Zustandsstabilität, Grafikexport). Keine kumulative V5-Abnahme; V4 bleibt gesperrt.

**OpenCode / Provider / Modell / Host:** `opencode v2.0.28`, Provider `deepseek`, API-Modell `deepseek-flash`, direkter Host `https://api.deepseek.com`. Die Aliaszuordnung `deepseek/deepseek-flash` → `DeepSeek-V4.1-Flash-1017` ist in `phases/V3/model-preflight.json` (verifiziert 2026-11-02T07:06:55.800Z, `credentialInspection:false`) belegt und wurde zusätzlich an der offiziellen Seite `https://api-docs.deepseek.com/quick_start/pricing/` geprüft: MODEL `deepseek-flash`, MODEL VERSION `DeepSeek-V4.1-Flash-1017`, BASE URL `https://api.deepseek.com`. Die wirksame Reviewkonfiguration `opencode.json` im Extensionworktree setzt denselben `baseURL`; kein Proxy-/Fallbackpfad. Es wurde kein Credential gelesen.

**Core:** assignmentBase `20b0029d824b3602d9a304320bf0feae4c35c1f9`, phaseBase `7026e7f6b5834bf593d91dfee3323efb60688f3d`, candidate/tatsächlicher HEAD `a0272965c4691320ca316d519581d4db4cefc930`.

**Extension:** assignmentBase `73badd9807f407aea048d397af5549fe907a1501`, phaseBase `e1ae6e6bee3cd3e4c5c9f47b51170532ed5265d3`, candidate/tatsächlicher HEAD `dd6e4fd342dbe58a43dc648e2b2ad285db6896e2`.

**Tracked Zustand:** Beide Worktrees sind detached am Kandidaten; `git status --porcelain=v1` zeigt keine getrackte Änderung. Extension hat das bereits beim Start vorhandene untracked `opencode.json` (Review-Transportkonfiguration). Core hat nach dem ersten TeaVM-Buildversuch ein untracked `java_pid68094.hprof` (879 MB JVM-Heapdump, kein Produktbestandteil, nicht als Beleg verwendet); der getrackte Tree blieb unverändert.

**Bezeichnetes Produktpaar / Artefakte:** Der Extension-Kandidat unterscheidet sich von der selbst qualifizierten Extension `cbe0f40c22283d993a92f59df99056258cfef86d` nur in `docs/implementation/vscode-extension/STATUS.md` und `implementation/V3.md` (Doku). Ich habe aus dem Kandidaten ein VSIX gebaut (`build/packages/...`, Container-SHA256 `1cf99c6dbdcb77351e68481ce4bde9ee0f976898183fc10737d7c66d1430e51d`) und es mit dem bezeichneten Artefakt `03022a1d…` verglichen: **alle 74 extrahierten Nutzdateien byte-identisch**; ZIP-Zeitstempel unterscheiden nur den Containerhash. `out/extension.cjs` = `fb5dfce2…`, `out/diagram-webview.js` = `8ab97031…`; LSP-JAR = `812fd1bb…`; Renderer `diagram-ui.js` = `fa580419…`; `diagram-ui.tgz` = `2dc6e90f…`; Lock-`coreCommit` = `a027296…`. Alle Werte stimmen mit `request.json` und `release/editor-artifacts.lock.json` überein.

**Plattform:** macOS arm64 (`os 24.6.0`), VS Code 1.140.0, ExTester 8.28.1, ChromeDriver 150.0.7871.250, Java 25.0.3-tem, Node 22.13.0 für den Host und Node 24.22.0 für WasmGC/Browser. Keine Plattform-/Remote-Behauptung über V5 hinaus.

## 2. Eigene Ziel-, Code- und Architekturprüfung

**Umfang des V3-Diffs (Core phaseBase→candidate):** 34 Dateien, im Wesentlichen `frontend/diagram-ui` (Filter, Export, Layout/Interaktion/View-State), Java-`DiagramSelectionParams/Result` + `interlis/diagramSelect`, `LspDiagramService`, Projektor-Inline-Enums, LSP-Capability `diagramSelection`, Portable-Enum-Test und die drei Spezifikationskapitel 07/11/16. Kein Parser-/Binder-/Normänderung, keine Workspace-/Repositoryänderung in dieser Phase, keine neuen Compiler-XFAILs.

**Eine Sprachautorität:** Die Semantik bleibt in Java. Der Client sendet nur `interlis/diagram`, `interlis/diagramNavigate`, `interlis/diagramSelect`, `interlis/source` und `interlis/compile`; `DiagramSelection` entsteht über `LanguageQueries.symbolAt`, Versionen/Registry, UTF-16 und Snapshot-/Workspace-Revision. In `diagram.ts`/`diagram-webview.ts` gibt es keine Namens-, Typ- oder Importauflösung. `diagramSelect` ist ein echter `@JsonRequest`-Vertrag und wird im stdio-Prozesstest tatsächlich gesendet; ein reiner Methodenaufruf wurde nicht als Transportbeweis gezählt.

**Keine Altprojektabhängigkeit / eine Rendererquelle:** `npm run verify:no-legacy-dependencies` prüft Lock, installierten Graphen und Produktbundle; im Manifest/Lock/Bundle kein `@ilic`, kein `interlis-language-tools`, kein `ilic.wasm`, kein `file:`/`workspace:`/Git-Link. Die aktive Rendererquelle ist ausschließlich `CORE/frontend/diagram-ui`; die Extension lädt das gestagte `artifacts/diagram-ui/diagram-ui.js` über `import()`, der Browserconsumer nutzt dieselbe Quelle. Keine zweite aktive Vendorkopie.

**Fachliche und UI-Verträge:** Filter arbeiten ausschließlich auf den DTO-Kategorien und expliziten `MODEL_IMPORT`-Kanten; der Client erfindet keine Beziehungen aus Labels. Layout/Filter verändern niemals `DiagramDocument` oder `.ili`; `exportSvg` klont die aktuelle Sprotty-DOM, führt kein ELK erneut aus und setzt den Filter-/Manuellstand inklusive `viewBox` und Metadaten um. Die View-State-Persistenz speichert nur gehashte Präsentationsschlüssel, keine Quelltexte/Labels; `reconcileGeometry` übernimmt nur eindeutige exakte Identitäten. Navigation ist strikt revisionsgebunden (`ContentModified` bei alter Quelle/Serverinstanz/Snapshot); readonly `interlis-source` bleibt readonly.

**Frische/Sicherheit:** `invalidate` setzt STALE, `accept` nur bei aktueller Generation; lokale Filter auf einem invalidierten Graph machen ihn nicht FRESH (UI-Unit-Test und GUI-17). Webview-Nachrichten sind kanal-/generations-/felderbeschränkt, CSP ohne `unsafe-eval`, lokale Assets, SAX-validiertes inertes SVG, PNG-Signatur/IHDR/8192-Pixel-Grenze, atomisches tmp-Rename, echter Cancel. `connection-start`/`end`- und Marker-Referenzen in den Exporten lösen alle auf existierende IDs auf; SPLINES nutzt statische Referenzen, keine Live-Connector-Behauptung.

**Ohne Befund:** Keine versteckte Schreiblogik für Layout, keine Reconnect-/Delete-/Textedit-Features, kein GLSP-/WebSocket-/Cytoscape-Parallelpfad, keine `page.evaluate`-Zustandsmutation als GUI-Ersatz (die Pointerdrag- und Tastaturaktionen laufen über WebDriver; `executeScript` wird nur lesend bzw. für den kontrollierten echten Worker-Hold in GUI-17 verwendet).

## 3. Jede fällige Muss-AC

| AC-ID | Status | Eigener Code-/Test-/GUI-Beleg | Finding |
|---|---|---|---|
| V3-01 | **erfüllt** | `filters.ts` (Kinds/Edges/Attribute/Rollen/Typen/Kardinalitäten/Constraints/Enums/Frames/direct+indirect, All/None/Reset, Stub-Reachability); UI8 `freshness-r1`/`filter None`; GUI-19/20 mit echten Java-Modellen, `data-diagram-id` bleibt bei lokalen Filtern unverändert (eigener Probe); GUI-20 externe Stubs verschwinden mit letzter Kante und Position wird wiederhergestellt. | – |
| V3-02 | **erfüllt** | `settle`/`resetLayout` in `interactive.ts`; GUI-22 (Settle erhält Pin-Position, Reset ändert sie, alle NodePlacement-/Routingoptionen); eigener GUI-Probe (Pin + Settle + Container + Route). | – |
| V3-03 | **erfüllt** | `layout.ts` übergibt `nodePlacement` an ELK und erzeugt ORTHOGONAL/POLYLINE/SPLINES; echte kubische `C`-Pfade (GUI-22, eigener Export mit 9/17 Bézierpfaden); GUI-14 und eigener Probe zeigen unveränderte `source/target`-Endpunkte nach Routenänderung. | – |
| V3-04 | **erfüllt** | History/Undo/Redo in `interactive.ts` (40 Frames/8 MB), `MoveElementsCommand`/Routenhandles; GUI-13 (Node+Container inkl. Kinder), GUI-14 (parallele Kanten, eine Route geändert), GUI-16 (Self-Loop, ternäre Rollen, asymmetrische Kardinalitäten, keine Labelüberlappung), GUI-24 und eigener Probe (Undo/Redo exakt); Text-Undo getrennt. | – |
| V3-05 | **erfüllt** | GUI-23 (Mausrad, Scrollbar-Drag, Pfeiltasten, Zoom, Fit, Editorpfeile unabhängig), UI-Playwright mit `deviceScaleFactor:2`; `ResizeObserver` + `clientWidth/height`-basierte Viewport-/Fit-/Scrollgrenzen; GUI-18 öffnet parallele Panels, GUI-24 reloadet mit erhaltener manueller Position. | – |
| V3-06 | **erfüllt** | Java `diagramSelect`/`queries.symbolAt` (Version, Snapshot, leere/veraltete Auswahl, ContentModified), Host-Identitätsprüfung, UI-`select` ohne Rückkanal; GUI-25 (Quellcursor→Diagramm, Neighbourhood, Translation), GUI-15 (Diagramm→Quelle, exakte UTF-16-Range nach CRLF/Emoji, readonly Import), eigener Probe (Live-Snapshot + Restore). | – |
| V3-07 | **erfüllt** | `view-state.ts`/`DiagramStateStore` (SHA-256-Präsentationsschlüssel, max. 16 Einträge/8 MB, 1-MB-Validierung); GUI-24 Reload-Persistenz, GUI-17 Live-Edit/verspätete echte ELK-Antwort, UI-Unit „exact current keys/discard orphaned“; eigener Probe (Live-Edit neuer Snapshot, Undo, Diskhash unverändert). | – |
| V3-08 | **erfüllt** | GUI-26 vier echte Dateien (FULL/VISIBLE SVG+PNG), echte Browser-Decoder, Differenz 0 über 9.959.936 bzw. 434.232 RGBA-Kanäle, IHDR 3136×794 und 489×222, View-Filter im FULL-SVG abwesend, Cancel schreibt nichts; eigener Probe FULL 1891×923/Visible 489×420, ebenfalls Differenz 0, manueller Transform im SVG. | – |
| V3-09 | **erfüllt** | GUI-27 (INKSCAPE orthogonal/polyline, GAPS/PLAIN, statische Spline-Referenzen, kein `inkscape:connector-type` bei SPLINES); eigene Auflösungsprüfung: alle `connection-start/end`, Marker- und `static-start/end`-Referenzen zeigen auf existierende IDs, keine externen/aktiven Ressourcen, `script`/`foreignObject`/DOCTYPE = 0. | – |
| V3-10 | **erfüllt** | GUI-28 drei echte Themes inkl. Dark High Contrast, Tastatur-Checkbox, kein Script/foreignObject, inertes `<script>`-Kommentar; GUI-19 EMPTY mit erklärtem Text; GUI-17 STALE/PARTIAL; eigener Probe erzwingt real den ERROR-Zustand (Server gestoppt, Meldung „A matching running diagram protocol 1 server is required.“) und danach echte Erholung nach Restart (Ready, neuer Diagrammid); Light/Dark/HighContrast visuell geprüft. | – |
| V3-11 | **erfüllt** | Frisch: UI 8/8, Browser Chromium/Firefox/WebKit 3/3, Java LSP 70/70 + Projektion 22/22, Extension Unit/stdio 11/11, Dependencycheck; eigener installierter GUI-Probe 2/2. Die eigene kumulative 28/28-GUI-Suite wurde anhand unveränderter Rohbelege und byte-identischer VSIX-Nutzdateien verifiziert (nicht als frischer Lauf behauptet). Keine unnötige Compiler-/Korpusmatrix. | – |
| V3-12 | **erfüllt** | Eigene neue installierte GUI-Kombination (Live-Edit + direkte/indirekte Importfilter + Members + Node-/Container-Drag + Pin/Settle + echte Routenbiegung + Layout-Undo/Redo + FULL ORTHOGONAL/INKSCAPE SVG+PNG + VISIBLE SPLINE SVG+PNG + Cancel + ERROR/Restart); Sourcehash/Buffer/Dirty vor Layout/Filter/Export unverändert, Disk nach Live-Edit/Undo unverändert; relevante Bilder tatsächlich angesehen. | – |

## 4. Featureparität (betroffene F-IDs)

- **F23–F25, F27–F30, F36–F41, F44–F46:** durch V3 berührt und im installierten UML-Pfad belegt (Container/TOPIC, N-är/Self/Parallel, Rollen/Kardinalitäten/Diamanten, echte Pointer-Interaktion, drei Routings, Viewport/Scrollbars/Fit, Diagramm→Quelle, Quellauswahl, Full/Visible-SVG/PNG, Inkscape/GAPS, Themes).
- **F26/F33–F35:** Filterbaum, Members-Modi, direkte/indirekte Importe, All/None/Reset, externe Stubs, leerer Zustand — GUI-19/20/21 und UI8.
- **F31/F45:** Settle/Reset/Pin/History/View-Persistenz — GUI-22/24.
- **F32:** ORTHOGONAL/POLYLINE/SPLINES und NodePlacement — GUI-22, UI-Geometrie, eigener Export.
- **F42/F43:** PNG/Inkscape — GUI-26/27, eigene Datei-/Pixel-/Referenzprüfung.
- **F52 (nur betroffener Text-/GraphML-Ansatz):** V3 ändert keine Dokumentationsrenderer; V4 bleibt gesperrt.
- **F57/F58/F59/F60:** sichere Ressourcen, Cancellation/Frische, Altabhängigkeitsfreiheit, echte GUI — in V3 mitgeprüft; keine Abgrenzung aufgeweicht.

## 5. Risikobasierte Tests

| Gate/Case | Fällig / nicht fällig | Ausgeführtes Kommando, CWD | Exit / Tests | Eigener Lauf / Beleg |
|---|---|---|---|---|
| T0 Abhängigkeiten/Artefakte | fällig (Renderer-/Bundle-/Lockbezug) | `npm ci --ignore-scripts` (ext); `node scripts/stage-core.cjs --core-dir …/core`; `node scripts/build.cjs`; `diff -rq` der 74 VSIX-Nutzdateien | 0; 318 Pakete; Stage `a027296`; Build 0; 74/74 byte-identisch | eigener Lauf; `build/review-vsix`, Lock/Artefakthashes |
| T1 neue UI/Geometrie/State | fällig (geteilte Rendererquelle geändert) | `npm test` in `core/frontend/diagram-ui` | 0; 8/8, keine Skips | eigener Lauf; UI8 |
| T1 Java LSP/Projektion | fällig (DiagramSelect/Inline-Enum) | `./gradlew :interlis-lsp:test :interlis-projection:test --no-daemon` (core) | 0; LSP 70/70, Projektion 22/22, 0 Fehler/Skips | eigener Lauf; XML-Results |
| T2 echter stdio-Transport | fällig | `node --test test/unit/*.test.cjs test/protocol.test.cjs` (ext) | 0; 11/11 | eigener Lauf; `build/...`/XML |
| T3 gemeinsamer Browserconsumer | fällig | `./gradlew :interlis-wasm-teavm:uiProjectionTest -PnodeExecutable=…node24… -Dorg.gradle.jvmargs="-Xmx4g …" --no-daemon` | 0; Chromium/Firefox/WebKit 3/3 | eigener Lauf; erster Versuch mit Default-2g scheiterte an TeaVM-`BufferAllocationException` (Umgebungsspeicher), Wiederholung mit 4g grün |
| T4 installierte GUI 28 Fälle | fällig, Wiederverwendung erlaubt | eigener kumulativer Lauf `cumulative-gui-r2` mit `Core a027296 / Ext cbe0f40`; Manifest/Log/Installed-Hash/Serverprozesse geprüft | 0; 28/28; 4 Java-Starts, `remaining:[]` | verifizierter Rohbeleg, kein frischer 28er-Lauf (VSIX-Nutzdateien byte-identisch) |
| Eigene GUI-Gegenprobe | fällig (neue Kombination) | `node build/probe/run.cjs` (ext, installiertes VSIX) | 0; 2/2, 42 s; 2 Java-Starts, `remaining:[]` | eigener Lauf; `counterprobe/run-2026-11-02T07-47-14-685Z` |
| T4 Negativcanary | fällig | `node scripts/gui.cjs --suite smoke --canary missing-status --cache …` (ext) | erwarteter Exit 1; GUI-01 Timeout, GUI-02/03 bestanden; `remaining:[]` | eigener Lauf; `build/reports/gui/smoke/2026-11-02T07-43-38-107Z` |
| T0 Dependencygraph | fällig | `npm run verify:no-legacy-dependencies` (ext) | 0 | eigener Lauf; keine `@ilic`/Altpfade im Lock/Bundle |
| T6 voller Compiler-/Korpus-/Benchmark-/Safari-Lauf | nicht fällig | – | – | kein Parser/Binder/Norm-Diff; nur gezielte Projektion/LSP/Browserconsumer; keine XFAIL-/Goldenänderung |
| Plattform-/Remote-/Runtimebündelung | nicht fällig | – | – | ausdrücklich V5, nicht behauptet |

**Umgebungsanmerkungen:** Der erste Browserlauf auf dem frischen Worktree scheiterte *vor* dem Test an TeaVM `Not enough memory … 0 -> 8` mit dem Repo-Default `-Xmx2g`; nach `-Xmx4g` und `npm ci` im `interlis-wasm-teavm`-Modul liefen alle drei Browser grün. Das ist eine Speicher-/Umgebungsempfindlichkeit des Builds, kein Test-Fehlschlag des Produkts. Der dabei entstandene untracked `java_pid68094.hprof` ist kein getrackter Produktbestandteil.

## 6. Echte GUI und Sichtprüfung

**Eigene installierte Gegenprobe (frisch, Kandidaten-VSIX):** Zwei Fälle, 2/2 bestanden, 42 s, `remaining:[]`; Installation `edigonzales.interlis-vscode` 0.0.1, Bundle `fb5dfce2…`, Core/Extension-SHA wie oben. Aktionen: echte Klicks/Tastatur/Pointerdrag/Save-Dialoge, keine Controller-State-Manipulation.

**Ablauf und sichtbare Reaktion:** `Comfort.ili` öffnen → Diagramm (PARTIAL, ehrlich wegen der bewusst fehlerhaften Workspace-Fixtures) → Members OWN_AND_INHERITED, VIEW/DOMAIN/indirekte Importe ausblenden → native Drags von Klasse B und TOPIC Data → Pin/Settle → echte Routenbiegung mit unveränderten Endpunkten → Undo/Redo exakt → FULL ORTHOGONAL/INKSCAPE SVG+PNG → SPLINES/Visible SVG+PNG → Cancel ohne Datei → Live-Edit `CLASS C=probe:TEXT*4;` mit neuem Snapshot → native Undo → Server stoppen (ERROR-Meldung) → Restart (Ready, neues Diagramm). Sourcehash vor/nach Layout/Filter/Export unverändert, Dirty false; nach Live-Edit/Undo Disk unverändert.

**Tatsächlich angesehene Bilder (Auswahl, alle in `image-read-inventory.json` mit Hash):**
- `counterprobe-01-initial.png`, `-03-node-moved-pinned.png`, `-04-container-moved-settled.png`, `-05-route-redo.png`, `-06-splines-zoomed.png`, `-07-live-edit.png`, `-08-restored.png`, `-09-error.png`, `-10-recovered.png`;
- Exporte `counterprobe-full.png` (1891×923, PARTIAL-Banner, MODEL/TOPIC, A/B/C, V3Middle, Rollen/Kardinalitäten, Vererbung, Constraints, Enums, geerbte Member) und `counterprobe-visible.png` (489×420, SPLINES-Ausschnitt);
- aus dem eigenen 28er-Lauf: `GUI-19-empty`, `GUI-20-imports`, `GUI-21-inherited`, `GUI-22-pinned-settle`, `GUI-24-reloaded`, `GUI-25-source-highlight`, `GUI-26-export-view`, `GUI-27-static-splines`, `GUI-28-Dark-High-Contrast`.

**Visuelle Qualität:** Keine abgeschnittenen Knoten/Exportlabels in den geprüften Bildern; Rollen/Kardinalitäten und Endmarker lesbar; echte Kurven bei SPLINES; High-Contrast-Themes deutlich unterscheidbar; Empty-Status erklärt; ERROR-Status klar textlich, alter Graph bleibt sichtbar, aber nicht als aktuell markiert. Die Filter-/Control-Fläche ist bei geöffnetem Filterbaum in kleinen Panels eng und scrollt; das ist eine optionale UX-Beobachtung, kein AC-Verstoss. Ein Constraint-Label zeigt im Export `constraint@299 : MandatoryConstraint` (technischer Name/Java-Typ); das ist vorbestehendes V2-Projektionsverhalten, nicht Teil des V3-Diffs; als optionale Verbesserung notiert.

## 7. Neue Gegenproben

**Hypothese:** Die vorhandenen 28 Fälle beweisen nicht, dass eine *neue* Kombination aus Live-Semantik, lokalem Filter, manueller Container-/Routen-Geometrie, Pin/Settle, Layout-Undo/Redo und echten FULL/VISIBLE-Exporten unter einem echten installierten Host konsistent bleibt und den Quelltext nicht verändert.

**Neue Fixture/Aktionen:** Eigene Kombination auf `Comfort.ili` (inkl. bewusst fehlerhafter Nachbarmodelle für ehrliches PARTIAL), mit Members-/Importfiltern, Node- und Container-Drag, Pin/Settle, echtem Routenhandle, Undo/Redo, INKSCAPE/ORTHOGONAL/GAPS sowie SPLINES/Visible, Live-Texteingabe/Undo und Server-Stop/Restart. Neue Assertions: `data-diagram-id` bleibt bei lokalen Filtern konstant, wechselt nach Live-Edit, Routenendpunkte unverändert, manueller `transform` im SVG vorhanden, FULL/VISIBLE SVG und PNG pixelgleich (0 Differenz), Cancel schreibt nichts, Buffer/Dirty/Diskhash unverändert, ERROR/Recovery.

**Ergebnis:** `passed`, Exit 0, 2/2; FULL 1891×923, Differenz 0 über 6.981.572 Kanäle; VISIBLE 489×420, Differenz 0 über 821.520 Kanäle; Dateien mit SHA-256 in `counterprobe-result.json`. Der erste Zwischenversuch mit `replaceText` scheiterte an einer Fokus-/Clipboard-Randbedingung des Testtreibers (nicht am Produkt); die finale Fassung nutzt native Tastatureingabe + Undo und ist als solche belegt. Die Negativcanary (`missing-status`) scheitert wie erwartet mit Exit 1 und trennt Harness-Fehler von Produkt-PASS.

## 8. Findings / Blocker

**Offene Muss-Findings:** keine.

**Optionale Beobachtungen (nicht abnahmerelevant):**
1. Export-/Constraint-Label `constraint@299 : MandatoryConstraint` zeigt einen generierten Namen und Java-Klassennamen statt des Constraint-Ausdrucks; vorbestehend, ausserhalb des V3-Diffs.
2. Bei geöffnetem Filterbaum ist die Control-Fläche in kleinen Panels eng/scrollend; funktional und per Scrollbar erreichbar, aber UX-verbesserbar.
3. Der eigene 28er-Rohlauf protokolliert 4 Java-Starts, aber nur 2 Exit-Zeilen; `remaining:[]` und der Harness-Prozesscheck sind bestanden. Das ist eine Logging-Lücke, kein verwaister Prozess.
4. Der erste TeaVM-Browserbuild im frischen Worktree brauchte mehr als die Default-2g (siehe §5); die Wiederholung mit 4g war grün. Build-/Umgebungsempfindlichkeit, kein Produktfinding.

**Fehlende Pflichtnachweise:** keine. Der äussere OpenCode-/Guardabschluss und die Artefaktidentität nach Prozessende sind vom Auftraggeber zu prüfen; dieser Bericht behauptet keinen bereits bekannten äusseren Exit.

## 9. Urteil

**PASS** (inhaltlich) für das Produktpaar Core `a0272965c4691320ca316d519581d4db4cefc930` / Extension `dd6e4fd342dbe58a43dc648e2b2ad285db6896e2`.

Begründung: Alle zwölf V3-Muss-ACs sind durch Code, frische fällige Tests und eigene echte installierte GUI-Gegenproben belegt; die geteilte Rendererquelle, die Java-Sprachautorität, die Frische-/Readonly-/Sicherheitsgrenzen und die Exportparität sind konkret geprüft; keine offenen Muss-Findings. Nächster erlaubter Schritt nach operativem Prozessabschluss: V4 (Editorhilfen/Dokumentation); V4 bleibt bis dahin gesperrt.
