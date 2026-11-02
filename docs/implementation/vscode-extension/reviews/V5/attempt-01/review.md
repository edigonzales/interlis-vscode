# Unabhängiger Review V5 – INTERLIS VS Code

## 1. Identität

**Phase / kumulative Abnahme:** V5, kumulativ V0–V5 mit allen 56 Muss-ACs und F01–F60. Kein vorgegebenes Urteil; die Bewertung unten ist aus den tatsächlich gelesenen Quellen, dem Diff, den eigenen Läufen und den Bildsichtungen abgeleitet.

**OpenCode / Provider / API-Modell / API-Host / Aliasnachweis:**

- OpenCode `v2.0.28` (`transport.json`, `opencode.jsonl`).
- Provider `deepseek`, API-Modell `deepseek-flash`, direkter Host `https://api.deepseek.com`.
- Alias-/Modellnachweis: `/Users/stefan/sources/interlis-vscode-evidence/phases/V5/review-preflight/model-identity.json`, SHA-256 `d7e995e8fbb7ae0b6d2cfba66300e4ae01c629f1939ecce0451a542c82464fe6`: OpenCode 2.0.28, Provider `deepseek`, Modell `deepseek-flash`, Modellversion `DeepSeek-V4.1-Flash-1017`, offizielle Zuordnung über `api-docs.deepseek.com`. Kein OpenRouter/Go/Zen/Proxy-Fallback; keine Selbstauskunft des Modells als Identitätsbeweis, keine Credentials gelesen oder ausgegeben.
- Die Preflight-Dateien `run-help.txt` (`7a1382...`) und `models-all.txt` (`93b864...`) wurden mit den im Request genannten Hashes verifiziert.

**Core:**

- assignmentBase: `20b0029d824b3602d9a304320bf0feae4c35c1f9`
- phaseBase: `6983baf95c47a7e20dbb41a2e50500185f578c37`
- candidate: `6983baf95c47a7e20dbb41a2e50500185f578c37`
- tatsächlicher HEAD im detached Worktree: `6983baf95c47a7e20dbb41a2e50500185f578c37`
- `git status --porcelain=v1`: leer; Core-PhaseBase = Candidate, im V5-Phasendiff keine Core-Änderung.

**Extension:**

- assignmentBase: `73badd9807f407aea048d397af5549fe907a1501`
- phaseBase: `b19ac4306347f39da994db549137165448fb23cb`
- candidate: `3a888507b11c5ecefb03e4fe34aa11499894039c`
- tatsächlicher HEAD: `3a888507b11c5ecefb03e4fe34aa11499894039c`
- Tracked Zustand vorher/nachher: sauber. Einzige ungetrackte Datei ist `opencode.json`, die vom Review-Transport (`scripts/review.cjs`) erzeugte, nicht zum Produkt gehörende Review-Konfiguration. Keine Produktdatei wurde geändert.

**Artefakte / Umgebung:**

- Autorgepacktes macOS-VSIX: `/Users/stefan/sources/interlis-vscode-evidence/qualification/V5-final-r1/interlis-vscode-darwin-arm64-cf8f200243ed568c5eb05f0e2be9281e043e1c9c21335433c3e7b73d6f6dc7aa.vsix`, SHA-256 `cf8f2002...` (wie im Request).
- Linux-VSIX: `.../platform-packages/packages/interlis-vscode-linux-x64.vsix`, SHA-256 `833aab19...`.
- Windows-VSIX: `.../platform-packages/packages/interlis-vscode-win32-x64.vsix`, SHA-256 `37ad2202...`.
- Editorlock `release/editor-artifacts.lock.json`: `2a91b62f...`, Runtime-Lock `0a86e53c...`, Runtime-Sources `1bfcb221...` (alle wie im Request).
- Eigener Neuaufbau: VSIX `9f5b6f4f...`; Inhalt nach `diff -r` byte-identisch zum Autorartefakt (344 Dateien, 206.552.971 Bytes, 7 ausführbare Runtime-Dateien). Der Containerhash unterscheidet sich erwartbar nur durch ZIP-Metadaten, nicht durch Produktinhalt.
- VS Code `1.140.0`, ExTester `8.28.1`, ChromeDriver `150.0.7871.250`, macOS arm64, Entwicklungs-JDK Temurin `25.0.3`; gebündelte Runtime `25.0.5+8-LTS`.

## 2. Eigene Ziel-, Code- und Architekturprüfung

**Relevanter kumulativer und V5-spezifischer Diff:**

- Kumulativ assignmentBase→candidate: Core 299 Dateien, Extension 192 Dateien (V0–V4). V5-Phasendiff: Extension 54 Dateien, Core 0 Dateien.
- V5-schwerpunktmäßig gelesen: `src/host/runtime.ts`, `src/host/launch.ts`, `src/extension.ts`, `src/diagram.ts`, `package.json`, `release/*.lock.json`, `scripts/stage-runtime.cjs`, `scripts/package.cjs`, `scripts/ci/smoke.cjs`, `scripts/ci/build-smokes.cjs`, `.github/workflows/platform-smoke.yml`, `scripts/gui*.cjs`, `test/gui/{comfort,authoring,resilience,distribution,workbench}.cjs`, `docs/implementation/vscode-extension/{PLATFORM_TEST_SCOPE,FEATURE_EVIDENCE,STATUS}.md` und `implementation/V5.md`.
- Zusätzlich geprüft: `docs/provenance/source-adoptions.md`, `licenses/`, `artifacts/renderer-provenance.json`, Schemas `diagram-document-1.0`/`diagram-options-1.0`, `release/editor-artifacts.lock.json`.

**Keine zweite Semantik / keine Altprojektabhängigkeit / eine Rendererquelle:**

- `verify-dependencies.cjs` prüft Lockfile, installierten vollen Graph und `out/extension.cjs`; es gibt keinen `@ilic/*`-Eintrag, keinen `interlis-language-tools`-Eintrag, keinen `file:`-/`workspace:`-/Git-Link und kein `ilic.wasm` im Bundle. Eigener Lauf: Exit 0.
- Die Extension ist dünn: Sprachlogik bleibt im Java-LSP; TypeScript enthält Host-, Protokoll-, Webview- und Snippet-/Editorinteraktion, keinen ILI-Parser und keine Symbol-/Typ-/Rename-Engine.
- Der neutrale Renderer liegt in `CORE/frontend/diagram-ui`; die Extension konsumiert nur die gepackten Artefakte. `renderer-provenance.json` dokumentiert Herkunft, MIT-/EPL-Texte und die Ablösung der alten Vendor-Typen. Keine aktive zweite Rendererquelle im Extensionpaket.
- Die Symbol-/Diagrammbeziehungen kommen aus `DiagramDocument` des Java-Projektors; der Webview berechnet keine fachlichen Beziehungen aus Labels.

**Quellen-, Versions- und Readonlygrenzen:**

- `verifyBundledRuntime` prüft Zielplattform, Lockdigest, Dateiliste, SHA-256, Symlink-Ausbruch und Unixmodi; `resolveLaunchPlan` prüft zusätzlich Serverinventar, Main-Class, Protokollversion und Java 25, bevor Java startet.
- V5-Diff ergänzt `cancelledVersion`, den expliziten `diagram.cancel`, die Stale-Markierung nach Stop/Crash und die Trennung von maschinenbezogenen Executable-Overrides gegen Workspace-Einstellungen.
- Readonly-Repositoryquellen, `interlis-source:`-Handles, UTF-16-Positionen, LSP-Dokumentversion vs. Core-Revision und Snapshot-/Server-Instance-Identitäten bleiben aus V1–V4 erhalten; die V5-GUI- und Transportbelege decken sie ab.

**Sicherheit / Distribution:**

- Webview-CSP: `default-src 'none'`, Nonce, lokale `cspSource`, `worker-src blob:`, keine CDN-/Netzressourcen; Nachrichten sind über `protocolVersion`, `channel`, `generation` und eine Schlüssel-Whitelist begrenzt.
- Eigenes VSIX-Inventar: 344 Einträge, keine `test/`-/`build/`-/`node_modules`-/Sourcemap-/`.env`-/Schlüsseldateien; genau eine Zielruntime; Lizenzen und Vendor-Notices vorhanden.
- Kein Secret-Muster im extrahierten Paket gefunden (Private-Key-, `sk-`, `ghp_`, `DEEPSEEK_API_KEY`-Muster). Keine alte Extension-ID. Historische Herkunftsangaben (Upstream-Repository/-Commit in `artifacts/renderer-provenance.json`) sind ausdrücklich erlaubt und keine Abhängigkeit; `verify-dependencies` prüft den aktiven Graph und das Bundle, nicht die Provenienztexte.
- `PLATFORM_TEST_SCOPE.md` ist die verbindliche jüngste Nutzeranpassung: vollständige macOS-GUI, kurze native Linux-/Windows-CI-Smokes, **kein** Linux-/Windows-GUI- und **kein** Remote-GUI-PASS. Diese Grenze wird unten nicht als erfüllt behauptet.

## 3. Jede fällige Muss-AC

Legende: „erfüllt“ = durch eigenen Lauf oder durch verifizierte unveränderte Rohbelege desselben Produktpaars belegt; „Anpassung“ = durch die ausdrückliche Nutzerentscheidung in `PLATFORM_TEST_SCOPE.md` im Umfang reduziert, ohne fiktives PASS.

| AC-ID | Status | Eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|
| V0-01 | erfüllt | Beide detached SHAs, assignmentBase/phaseBase/candidate und kumulativer Diff gelesen; Core-/Extension-HEAD sauber; Prior-V0-Review `reviews/V0/attempt-02`; keine erneute CLI-Implementierung. | – |
| V0-02 | erfüllt | `package.json`-Identität `edigonzales.interlis-vscode`, `interlisGuru.*`, Sprache/Snippets/Template; `verify-dependencies` Exit 0; VSIX-Inventar ohne Altbackend. | – |
| V0-03 | erfüllt | Eigener `test:protocol`-Lauf 1/1 mit echtem Java-stdio (Initialize, Diagnose, Shutdown, Exit 0); eigene GUI-Installation startet gebündeltes Java; Negativfall fehlender Server wird abgelehnt. | – |
| V0-04 | erfüllt | Eigener installierter GUI-Lauf `comfort` 28/28 mit gültigem/ungültigem Modell, Problems, F12 und Formatierung; Installation aus VSIX ohne Core-Checkout. | – |
| V0-05 | erfüllt | Eigener ExTester-/Selenium-GUI-Lauf mit echter Workbench und Webview; keine API-Probe als GUI-Ersatz; eigene Counterprobes. | – |
| V0-06 | erfüllt | `FEATURE_AUDIT.md`, `FEATURE_EVIDENCE.md`, `source-adoptions.md`, Versionspins/Locks und risikobasierte Gatezuordnung gelesen; keine V1-Implementierung in V0 behauptet. | – |
| V0-07 | erfüllt | Prior unabhängiger V0-PASS plus aktuelle Identitäts-/Rohbelegprüfung; eigener GUI-/Negativpfad in dieser V5-Session. | Äußerer Prozessabschluss bleibt Codex-Prüfung. |
| V1-01 | erfüllt | Eigene GUI-02/04 in `comfort` 28/28: DE/EN, Codes, Severity, echte RelatedLocation, kein messageKey/ANSI; Autor-Rohbelege gleiches Paar. | – |
| V1-02 | erfüllt | Eigene GUI-09 in `comfort` 28/28: transitiver Cache, Offline-Restarts, keine Offline-HTTP-Anfrage, Mehrdeutigkeit; `repository-stats.json` und Case-Assertions. | – |
| V1-03 | erfüllt | Eigene GUI-10: externe Quelle per F12, readonly `interlis-source:`, Tippen/Rename ohne Wirkung, Hover weiterhin möglich. | – |
| V1-04 | erfüllt | Eigene GUI-03/05/06/07: Definition, qualifizierte Segmente, Referenzen inkl. geschlossener Quelle, PrepareRename/Rename/Undo. | – |
| V1-05 | erfüllt | Eigene GUI-11: hierarchische Outline, Folding, Semantic Tokens, Formatierung; CRLF/Unicode-Fälle in Fixture und Case. | – |
| V1-06 | erfüllt | Eigene GUI-08: Compile Current mit Dirty-Root trotz defektem Nachbarn; Compile Workspace separat; Buffer bleibt erhalten. | – |
| V1-07 | erfüllt | GUI-09/39/41: Restart, Multi-root-Add/Remove/Re-Add, Cancellation, begrenzte Ressourcen; ungültige Konfiguration verwirft nicht die letzte gültige. | – |
| V1-08 | erfüllt | Eigene GUI-04..11 im selben 28/28-Lauf mit echtem Java-Server, kein Fake-LSP. | – |
| V1-09 | erfüllt | Autor Java 196 (66 Compiler, 8 Documentation, 75 LSP, 24 WASM, 22 Projection, 1 CLI); eigene Unit 13/13, Protocol 1/1; Synchronisations-/Closed-Rename-Regressionen in Autor-XML ohne Fail/Skip. | – |
| V1-10 | erfüllt | Eigene GUI- und Repository-/Dirty-Gegenprobe in dieser Session; unveränderte Trees; PASS auf identischem Paar. | – |
| V2-01 | erfüllt | Neutrale Quelle in CORE/frontend/diagram-ui, Provenienz/Lizenz, keine B-/@ilic-Imports; Extension und Core-Browser konsumieren dieselbe Quelle. | – |
| V2-02 | erfüllt | Eigener stdio-Test: typisierter `DiagramDocument`-Antwortvertrag mit Optionen, Root/Snapshot/Source/Clientversionen, Completeness; eigener GUI-Lauf. | – |
| V2-03 | erfüllt | GUI-12 in eigenem 28/28: MODEL/TOPIC/CLASS/STRUCTURE/DOMAIN/VIEW/ASSOCIATION, Member/Enums/Constraints, keine Label-Kollision. | – |
| V2-04 | erfüllt | GUI-16: n-äre Rollen/Attribute, Self-/Parallelkanten, Kardinalität/Diamanten an beiden Enden; Autor-JSON `GUI-16-end-labels.json`. | – |
| V2-05 | erfüllt | GUI-13/14 in eigenem 28/28: echter Pointer-Drag, Container bewegt Kinder, Routenhandle ändert nur Route; Sourcehash/Buffer unverändert. | – |
| V2-06 | erfüllt | GUI-15: Knoten/Member/Association → exakte UTF-16-Range, readonly Import, CRLF/Emoji; keine falsche Navigation nach Drag. | – |
| V2-07 | erfüllt | GUI-17/18: Pinning/Follow, verspätete Antwort, Partial/Stale/Error, getrennte Panels; eigene Probe 2 zusätzlich Cancel/Stale. | – |
| V2-08 | erfüllt | Eigene GUI-12..18 im 28/28-Lauf mit echten Maus-/Tastaturaktionen und Screenshots vor/nach Drag und Route. | – |
| V2-09 | erfüllt | Shared-UI 8/8 (inkl. 3 echte Browserfälle), Autor-Projektion 22, eigene GUI/Transport; keine zweite Rendererkopie. | – |
| V2-10 | erfüllt | Eigene N-är-/Stale-/Drag-Gegenprobe und Lizenz-/Dependencyprüfung; identisches Paar. | – |
| V3-01 | erfüllt | GUI-19/20/21 in eigenem 28/28: Filter F26/F33–35, All/None/Reset, Imports, Stubs, keine Compileranalyse pro Klick. | – |
| V3-02 | erfüllt | GUI-22: Settle erhält Pin/Position, Reset setzt bewusst zurück; eigene Probe 2 prüft Pin über Cancel/Refresh. | – |
| V3-03 | erfüllt | GUI-22/27: ORTHOGONAL/POLYLINE/SPLINES, NodePlacement, echte Bézier-`C`-Pfade; Endpunkte unverändert. | – |
| V3-04 | erfüllt | GUI-24: Layout-Undo/Redo, Container-/Kantenbewegung; Self-/Parallelkanten und asymmetrische Kardinalitäten in GUI-16. | – |
| V3-05 | erfüllt | GUI-23: Wheel/Zoom/Scrollbar/Pfeiltasten/Fit, HiDPI-/Fokusprüfung; Editorpfeile getrennt. | – |
| V3-06 | erfüllt | GUI-25: Source→Diagramm-Highlight und Diagramm→Source ohne Rückkopplung; keine semantische Schreibzusage. | – |
| V3-07 | erfüllt | GUI-24/41: Panelzustand über Hide/Show/Reload, 20 Zyklen, sichere Identitätsgrenzen; Quelle unverändert. | – |
| V3-08 | erfüllt | GUI-26 in eigenem 28/28 und Autor: FULL/VISIBLE SVG/PNG, echte Dateien, PNG-IHDR, Pixelgleichheit, Filter/View berücksichtigt, Cancel schreibt nichts. | – |
| V3-09 | erfüllt | GUI-27: Inkscape-Namespace/Connection-Referenzen für gerade Routen, statische Spline-Referenzen, GAPS/PLAIN, keine Skripte. | – |
| V3-10 | erfüllt | GUI-28: Light/Dark/High Contrast, Tastatur, Empty/Stale/Error, sichere Labels/Kommentare; eigenes Bild gelesen. | – |
| V3-11 | erfüllt | Eigene GUI-19..28 im 28/28-Lauf plus UML-Smoke 12–18; Export-/UI-Tests nach Auswirkung. | – |
| V3-12 | erfüllt | Eigene GUI-Bedienung, neue Filter/Export-/Layout-Kombination in Probe 1/2, Sourcehash/Bufferfreiheit geprüft. | – |
| V4-01 | erfüllt | Autor-GUI-29/31 und Java-EditorCompletion/VersionScope; belegte Slots 2.3/2.4, Metaattribute, segmentgenaue Ersetzung. | – |
| V4-02 | erfüllt | Autor-GUI-29/30: MODEL/CLASS/DOMAIN/UNIT/VIEW-TOPIC, Spiegelung, Enter/Tab, Cursor; Kommentare/Strings/Werte/existing END ohne falsche Blöcke. | – |
| V4-03 | erfüllt | Autor-GUI-31: END-Name, Semikolon, unbenutzter Import, jeweils Undo; unvollständige Analyse verweigert den Importfix. | – |
| V4-04 | erfüllt | Autor-GUI-33 und Java-Documentation 8: CompiledSchema-Projektion, Vererbung, Struktur/Typ/Rollen/Constraints, bounded Rekursion. | – |
| V4-05 | erfüllt | Autor-GUI-33/34: DE/EN/FR/IT, Headeroverride, `«ABSTRACT»`, valides MD/HTML/DOCX; eigene Artefaktprüfung. | – |
| V4-06 | erfüllt | Autor-GUI-35: Mermaid/PlantUML/GraphML aus derselben Projektion; GraphML-IDs/Endpunkte, keine Fremdrenderer. | – |
| V4-07 | erfüllt | Autor-Rohbelege GUI-29..35 in `authoring` 7/7, gleiches Paar/VSIX; eigene Bild- und Dateiprüfung (DOCX/OOXML, HTML, GraphML, Mermaid). | – |
| V4-08 | erfüllt | Eigene Unit/Protocol/Java-Sentinels; Autor Java 196 ohne Fail/Skip; Normprofile/XFAILs unverändert (kein Core-Diff in V5). | – |
| V4-09 | erfüllt | Prior unabhängiger V4-PASS plus aktuelle F01–F60-/Artefaktprüfung; kein fehlendes V4-GUI gemeldet. | – |
| V5-01 | erfüllt | Eigenes VSIX-Inventar 344 Dateien, genau eine Runtime, keine Altbackend-/Test-/Secret-Dateien; Offline-GUI-36 und eigener Installations-/Startlauf. | – |
| V5-02 | erfüllt (Anpassung) | macOS arm64 vollständige native GUI 42/42; Linux x64 und Windows x64 echte native CLI-/Runtime-/stdio-/Rejection-Smokes in Actions-Run 41500206767, 3/3 Jobs success. Kein Linux/Windows-GUI-PASS behauptet. | Anpassung laut `PLATFORM_TEST_SCOPE.md`. |
| V5-03 | erfüllt (Anpassung) | Lokaler Multi-root GUI-39 (Add/Remove/Re-Add, zweiter Ordner, F12) in Autor-Rohbeleg; Remote-GUI ausdrücklich nicht verlangt/ungeprüft. | Kein Remote-PASS; Grenze sichtbar. |
| V5-04 | erfüllt | GUI-37 (Restricted/Trust, bösartige Settings), GUI-38 (Crash/Protokoll-/Runtimefehler), GUI-40 (Cancel), GUI-39 (Multi-root), GUI-41 (20 Zyklen); eigene Probes 1/2 und Negativprobe. | – |
| V5-05 | erfüllt | F01–F60 unten einzeln zugeordnet; Scope-Ausschlüsse (Remote-GUI, Linux/Windows-GUI, INTERLIS 1, Web-LSP, semantisches Editieren) bleiben sichtbar. | F54 Remote-Teil bewusst ungeprüft. |
| V5-06 | erfüllt | Eigene GUI 28/28, Autor 42/42, Java 196, Shared-UI 8/8 (3 Browser), Extension-Host 3, eigener stdio/Unit/Negativ; keine pauschale Fremdsuite. | – |
| V5-07 | erfüllt | README/Development/Provenienz/Locks/F5-Launch geprüft; eigene Reproduktion mit identischem Editor-/Runtime-Lock, VSIX-Inhalt bytegleich; keine alte ID, kein Siblinglink. | STATUS/V5 absichtlich OPEN bis Archivcommit. |
| V5-08 | erfüllt | Kumulative Prüfung aller 56 ACs, zwei neue GUI-Gegenproben, echte Paket-/Protokoll-Negativprobe, beide tracked Trees sauber. | Äußerer Transport-/Guardabschluss ist Codex-Prüfung; hier nicht behauptet. |

## 4. Featureparität F01–F60

Die folgende Zuordnung ist am aktuellen Paar geprüft. „Beleg“ nennt den konkreten Benutzerpfad/Test; „Grenze“ nennt bewusste, nicht als PASS ausgegebene Ausschlüsse.

| ID | Beleg / Status | Grenze |
|---|---|---|
| F01 | Installierte Sprache/TextMate/Snippets, GUI-01/11/31; eigene VSIX-Installation. | – |
| F02 | GUI-11/28: Folding/Semantic Tokens/Themes über Java-LSP. | – |
| F03 | GUI-02/04: Live-Diagnostik, DE/EN, RelatedLocation, kein messageKey/ANSI. | – |
| F04 | GUI-08: Compile Current mit Dirty-Root, getrennter Workspacecompile. | – |
| F05 | GUI-03/05/09/39: F12, qualifizierte Segmente, readonly/Remote-Ordner. | – |
| F06 | GUI-06: semantische Referenzen inkl. geschlossener Quelle. | – |
| F07 | GUI-07: Projekt-Rename/Undo, END/qualifizierte Verwendungen. | – |
| F08 | GUI-05/10: Hover aus Dirty-Buffer/readonly Import, sichere Markdownlinks. | – |
| F09 | GUI-11: hierarchische Java-DocumentSymbols. | – |
| F10 | GUI-03: Format/Undo/Redo, Kommentare/CRLF. | – |
| F11 | GUI-11/29: segmentgenaue Completion. | – |
| F12 | GUI-29: MODEL/TOPIC/CLASS/STRUCTURE/ASSOCIATION/VIEW/DOMAIN/UNIT/Rollen-Slots. | – |
| F13 | GUI-29/30: Spiegelung, Enter/Tab, Cursor/Endplatzhalter. | – |
| F14 | GUI-30: Auto-Close nur nach echtem Kopf; Negativfälle. | – |
| F15 | GUI-29/31: 2.3/2.4, EXTENDS, LIST/BAG, FORMAT/UNIT/IMPORTS. | – |
| F16 | GUI-31: Java-Metaattributkatalog, keine zweite Typengine. | – |
| F17 | GUI-32: Built-in/lokal/HTTPS-Template, Cancel/Fehler. | – |
| F18 | GUI-31: drei sichere QuickFixes, revisionsgebunden, Undo. | – |
| F19 | GUI-05/08/09: Dirty > Disk > Repository. | – |
| F20 | GUI-09/10: transitive Imports, Cache/Offline, readonly. | – |
| F21 | GUI-06/07/39: geschlossene Dateien, Multi-root, gemeinsamer Modellraum. | – |
| F22 | GUI-03/38/40: Restart/Crash/Cancel/Status. | – |
| F23 | GUI-12/13/18: echte MODEL-/TOPIC-Container. | – |
| F24 | GUI-12/16/19: Classes/Structures/Associations/Domains/Views/Constraints. | – |
| F25 | GUI-16/21: exakte Typ-/Kardinalitäts-/Enumlabels. | – |
| F26 | GUI-21: OWN/NONE/OWN_AND_INHERITED, abstrakte Notation. | – |
| F27 | GUI-12/16/20: Vererbung, Rollen, Referenzen, View-/Importkanten. | – |
| F28 | GUI-14/16: Rollen/Kardinalität/Diamanten am richtigen Ende. | – |
| F29 | GUI-13 und eigene Probe 1: echter Pointer-Drag, Source unverändert. | – |
| F30 | GUI-14 und eigene Probe 2: Routenhandle, keine Endpunktänderung. | – |
| F31 | GUI-22/24: Settle/Reset/Pins, Layout-Undo. | – |
| F32 | GUI-22/27: drei Routen, NodePlacement, Bézier. | – |
| F33 | GUI-19/21: Filter für Kinds/Compartments/Kanten. | – |
| F34 | GUI-20/25: direkte/indirekte Imports, Nachbarschaft. | – |
| F35 | GUI-19/20: All/None/Reset, Leerzustand, Stub-Regel. | – |
| F36 | GUI-23: Pan/Zoom/Fit/Scrollbar/Tastatur. | – |
| F37 | GUI-18/41: Pinning, Follow-Schalter, gleiche Basenames getrennt. | – |
| F38 | GUI-17/24/38/40: Liveupdate, Stale, Snapshot-/Generationen. | – |
| F39 | GUI-15/10: Knoten/Member/Association→Source, readonly. | – |
| F40 | GUI-25: Source→Diagramm, Java-Symbol, keine bidirektionale Semantik. | – |
| F41 | GUI-26/27/36: echte FULL/VISIBLE-SVG aus aktuellem Layout. | – |
| F42 | GUI-26: echtes PNG, Dimensionen/Pixel, keine umbenannte SVG. | – |
| F43 | GUI-27: Inkscape-Gruppen/Connections, statische Splines. | – |
| F44 | GUI-22/27: PLAIN/GAPS, Geometrie/Export konsistent. | – |
| F45 | GUI-24/41: Layout-Undo/Redo, Persistenz, Reload. | – |
| F46 | GUI-28/38/40: Themes, Tastatur/Fokus, Stale/Error. | – |
| F47 | GUI-33: Markdown-Katalog, Preview/Save. | – |
| F48 | GUI-33: DE/FR/IT/EN-Labels, Headeroverride, IDs unverändert. | – |
| F49 | GUI-33/34: Vererbungsmodi, rekursive Struktur, Typ/Constraint. | – |
| F50 | GUI-33: inertes HTML, keine aktiven Ressourcen, schmale Vorschau. | – |
| F51 | GUI-34: echtes DOCX mit OOXML-Teilen/Tabellen/Styles, Cancel. | – |
| F52 | GUI-35: Mermaid/PlantUML/GraphML, Vererbungsrichtung/IDs/Rollen. | – |
| F53 | GUI-36: gebündelte Runtime, Offline, leerer Produkt-PATH, Quellsperre. | – |
| F54 | macOS Desktop GUI 42/42; Linux/Windows native CLI-/Runtime-/stdio-Smokes. | Remote-GUI und Linux/Windows-GUI ausdrücklich ungeprüft. |
| F55 | GUI-01/36/42: VSIX-Installation, Unicode-Pfade, Hashes, Restart. | – |
| F56 | GUI-37 und `extension.ts`: Konfliktwarnung, keine Deaktivierung fremder Extensions. | – |
| F57 | GUI-10/28/33/37: readonly, CSP, inertes HTML/Labels, Trustpfade. | – |
| F58 | GUI-17/38/40/41: obsolete Antworten, Cancel, 20 Zyklen, Budgets. | – |
| F59 | `verify-dependencies`, Lock-/Bundle-Inventur, GUI-36 ohne Altprojekt. | – |
| F60 | 42 native Fälle plus eigene neue GUI-/Negativproben; äußere Prozessprüfung separat. | Kein Marketplace-/Remote-GUI-PASS. |

## 5. Risikobasierte Tests

| Gate/Case | Fällig warum / nicht fällig warum | Ausgeführtes Kommando und cwd | Exit / Tests / Fehler / Skips | Eigener Lauf oder geprüftes Artefakt | Rohbeleg |
|---|---|---|---|---|---|
| T0 Dependency/Lizenz/Inventur | V5 ändert Distribution/Locks/Paket | `npm run verify:no-legacy-dependencies`, EXT | 0; Lock+Graph+Bundle geprüft | eigener Lauf | eigener Terminal-Lauf; Autor `qualification/V5-final-r1/dependencies.log` |
| T0 Build/Stage | Runtime-/VSIX-Paket | `npm ci --ignore-scripts`; `node scripts/stage-core.cjs --core-dir .../core`; `node scripts/stage-runtime.cjs --target darwin-arm64 --cache ...`; `node scripts/package.cjs --target darwin-arm64` | 0/0/0/0; Editorlock unverändert `2a91...`, Runtime-Lock unverändert `0a86...`; VSIX 344 Dateien | eigener Lauf, EXT | eigene Terminalausgabe; `build/packages/*.inventory.json` |
| T0 Content-Gleichheit | Containerhash kann durch ZIP-Metadaten variieren | `diff -r author rebuilt` | 0; 344 Dateien/206.552.971 Bytes/7 Executable-mode-Dateien identisch | eigener Lauf | `build/vsix-compare` |
| T1 Extension-Unit | Manifest/Launch/Runtime/Diagramm-State | `node --test test/unit/*.test.cjs`, EXT | 0; 13/13 | eigener Lauf | Terminal |
| T2 echter Java-stdio | Protokoll/Diagramm/Export/EditorAssist/Readonly | `env -u INTERLIS_JAVA node --test test/protocol.test.cjs`, EXT | 0; 1/1; gebündeltes Java; Shutdown Exit 0 | eigener Lauf | Terminal; Autor `extension-unit-and-stdio.log` |
| T2 Extension-Host | registrierte Provider/Commands/Dirty-Restart | Autor `scripts/extension-host.cjs` | 0; 3 Checks; Extension-Host Exit 0 | geprüftes Autorartefakt gleiches Paar | `qualification/V5-final-r1/extension-host.log` |
| T1 Java-Fachgates | Projektion/Dokumentation/LSP/Editor/CLI | Autor Gradle-Task | 0; 196 Tests (66+8+75+24+22+1), keine Fail/Skip | geprüftes Autorartefakt | `java-editor-lsp-projections.log`, `java-results/` |
| T3 gemeinsamer Renderer | UI/Worker/Export/Browser | Autor `npm test` in `core/frontend/diagram-ui` | 0; 8/8, davon 3 echte Browserfälle | geprüftes Autorartefakt; `evidence-count-correction.json` klärt die irreführende 11 | `shared-diagram-ui.log` |
| T4 eigene native GUI | Installation, Editor, Drag, Route, Filter, Export, Restart | `node scripts/gui.cjs --suite comfort --vsix build/packages/... --cache ...` | 0; 28/28; 6 echte Java-Starts, 0 verbleibend | eigener Lauf | `extension/build/reports/gui/comfort/2026-11-02T18-41-46-465Z/` |
| T4 eigene Counterprobes | zwei neue Cross-Feature-Fälle | `node build/review-probes/run.cjs --vsix ... --cache ...` | 0; 2/2; 2 Java-Starts, 0 verbleibend | eigener Lauf | `evidence/counterprobes/2026-11-02T18-55-12-106Z/` |
| T5 eigene Negativprobe | Paket-/Runtime-/Lock-/Protokollfehler | `node build/review-probes/negative.cjs` | 0; 7 Checks; Protocol 999 abgelehnt; Stockbytes wiederhergestellt | eigener Lauf | `evidence/counterprobes/2026-11-02T18-54-07-082Z-negative/result.json` |
| T4 Autor-GUI 42 | alle 42 Szenarien am selben Paar/VSIX | Autor `qualify-macos.cjs` | 0; 42/42; Negativcanary erwartet Exit 1; 0 verbleibende Java-PIDs | geprüfte Rohbelege | `qualification/V5-final-r1/result.json`, `build/reports/gui/**` |
| T5 native CI | macOS-Plattform + kurze Linux/Windows-Smokes | Actions-Run 41500206767 | 3/3 Jobs success; Linux 57,7 s, Windows 37,3 s; CLI installiert, stdio, missing-JAR rejected; `guiTested=false` | geprüfte heruntergeladene Artefakte | `phases/V5/ci-final-3a88850/{run,jobs,validation}.json`, Smoke-Resultate |
| T4 Distribution/Resilience | Trust/Offline/Crash/Cancel/Multi-root/20 Zyklen | Autor `gui-resilience`/`gui-distribution` | 0; 5/5 + 2/2; Resourcen 20 Samples, 208.011.264 Bytes < 268.435.456 Budget | geprüfte Rohbelege und Bilder | `build/reports/gui/{resilience,distribution}/...`, `GUI-41-resources.json` |
| T6 breite Compiler-/Browser-/Safari-Matrix | **nicht fällig**: Core in V5 unverändert; Renderer/Projektion nicht neu geschnitten; V4-akzeptierte Semantik unverändert | – | – | – | `PLATFORM_TEST_SCOPE.md`, V5-Diff 0 Core-Dateien |

**Hinweis zum Build:** Ein `node scripts/build.cjs` vor `stage:core` scheitert erwartbar an fehlenden generierten `artifacts/types/editor-protocol`-Deklarationen. Nach der im Auftrag vorgegebenen Reihenfolge `stage:core` → `stage:runtime` → `package`/Build war der Lauf grün. Das ist kein Produktfinding, sondern eine reproduzierbare Buildvoraussetzung; die Locks blieben dabei bytegleich.

**Nicht fällig, mit Begründung:**

- Kein erneuter voller Compilerkorpus/Benchmark/Safari-/Release-Gesamtlauf: Core in V5 unverändert, Extensionänderung betrifft Distribution/Runtime/GUI-Harness/Cancel.
- Kein Linux-/Windows-/Remote-GUI: ausdrückliche Nutzeränderung in `PLATFORM_TEST_SCOPE.md`; die dort genannten nativen CLI-/Runtime-/stdio-Smokes wurden tatsächlich ausgeführt und sind keine GUI-Behauptung.

## 6. Echte GUI und Sichtprüfung

**Eigene native GUI-Läufe:**

- `comfort` 28/28 auf dem selbst gebauten VSIX (`9f5b...`), 3 Minuten, echte VS-Code-Workbench, echter gebündelter Java-LSP, 6 Serverstarts, 0 verbleibende Java-PIDs. Abgedeckt: Installation, Sprache, Diagnose/Korrektur, Hover/F12, Referenzen, Rename/Undo, Compile Current, Repository/Offline, Readonly, Outline/Folding/Completion/Tokens, Custom-Editor, Node-/Container-Drag, Routenhandle, Navigation, N-är/Self, Stale/Partial, Panels, Filter, Settle/Reset/Routing, Viewport, Undo/Persistenz, Quellauswahl, SVG/PNG/Cancel, Inkscape/GAPS/Splines, Themes/Sicherheit.
- Eigene Counterprobes 2/2: siehe §7.
- Eigene Negativprobe: siehe §7.

**Tatsächlich angesehene Bilder (vollständige Liste mit Hashes in `image-read-inventory.json`):**

- Autor `comfort`: `GUI-01-ready.png`, `GUI-13-before.png`, `GUI-13-node-moved.png`, `GUI-14-handle-before.png`, `GUI-14-route-after.png`, `GUI-19-empty.png`, `GUI-16-entity.png`.
- Autor `resilience`: `GUI-37-restricted.png`, `GUI-40-cancelled.png`.
- Autor `authoring`: `GUI-33-html-preview.png`, `GUI-34-saved.png`.
- Autor `distribution`: `GUI-36-offline-diagram.png`.
- Eigener `comfort`-Lauf: `GUI-13-before.png`, `GUI-13-node-moved.png`, `GUI-14-handle-before.png`, `GUI-14-route-after.png`, `GUI-26-full-decoded.png`.
- Eigene Counterprobes: `PROBE-1-drag-before.png`, `PROBE-1-drag-after.png`, `PROBE-1-filtered.png`, `PROBE-2-stale.png`, `PROBE-2-recovered.png`, `PROBE-2-filtered.png`.

**Visuelle Feststellungen:**

- GUI-01: richtige Datei, Sprache INTERLIS, Status „Ready“, keine falsche Extension-ID, keine Probleme.
- GUI-13/14 (Autor und eigener Lauf): Werkbank mit Quelle und UML nebeneinander, Werkzeugleiste sichtbar; nach Drag sind Knoten/Kanten sichtbar verändert; nach Routenhandle ist nur die gewählte blaue Kante anders geführt. Die Fit-All-Ansichten sind klein, aber nicht abgeschnitten; Geometrie-/Routen-JSON belegt die Änderung exakt.
- GUI-19: None zeigt den erklärten Leerzustand „No visible elements – change or reset filters“, Filter bleiben erreichbar; kein endloser Spinner.
- GUI-26: echtes exportiertes FULL-SVG wird im Browser mit 3136×794 dekodiert, sichtbare Labels/Kanten, keine externen Skripte; PNG 3136×794, Pixelvergleich 0 Unterschiede.
- GUI-33/34: HTML-Vorschau mit echtem Katalog, Snapshot, überschriebenem Titel, inertem `<script>`-Text; DOCX-Speichertoast; kein ausgeführtes Skript.
- GUI-36: Offline-Installation zeigt ein lesbares UML mit Building/Height/Domain, Status aktuell, keine Netzressourcen.
- GUI-37: echter Restricted-Mode-Banner, Status „Trust required“, kein Java/Diagramm vor Trust.
- GUI-40 und eigene PROBE-2: „Diagram update cancelled – Refresh to continue“, STALE, keine stillschweigende Aktualisierung; nach Refresh wieder benutzbar.
- PROBE-1/PROBE-2: Status „Partial diagram – check Problems“ ist hier korrekt, weil der Probe-Workspace absichtlich zusätzlich ein defektes unbeteiligtes Modell (`External.ili`) enthält. Das ist eine ehrliche Teilansicht, kein Produktfehler.

**Node-/Rougebewegung und Source-/Bufferunverändertheit:**

- Autor `GUI-13-geometry.json`: A `translate(880,229.58)` → `translate(1121.35,339.29)`; Topic `translate(20,40)` → `translate(195.53,127.76)`; Kind bewegt sich mit; `unchanged()` prüft Text, Dirty-Zustand und Disk-Hash.
- Autor `GUI-14-route.json`: Routen-`d` vor/nach unterschiedlich, `edgeIdentity` (source/target) unverändert; andere Kanten unverändert.
- Eigene Probe 1: A `translate(830,154.33)` → `translate(1216.28,329.92)`; Comfort-Diskhash vor/nach `5f6e3c6b...` identisch.
- Eigene Probe 2: C12 `translate(20,792)` → `translate(303.68,913.58)`; Large-Diskhash vor/nach `57d7840d...` identisch; Buffer/Dirty-Zustand unverändert.
- Alle Probe-Exporte: `PROBE-1-filtered.svg` ohne Overview, mit A; `PROBE-2-filtered.svg` mit C12, ohne TEXT; keine `<script>`/`foreignObject`-Abhängigkeit.

**Dialog-/Cancel-/Plattformidentität:**

- Native Save-Dialoge in GUI-26/27/33/34/35 und in den eigenen Probes tatsächlich bedient; Cancel schreibt keine Datei.
- macOS arm64: volle GUI; Linux-/Windows-GUI ausdrücklich nicht behauptet. Linux/Windows-CI: echte native CLI-Installation, gebündelte Runtime, stdio und missing-JAR-Rejection; `guiTested=false`.
- Remote-/Dev-Container-GUI: gemäß Nutzerentscheidung nicht geprüft; keine erfundene Authority-/Remote-Behauptung.

## 7. Neue Gegenproben

**PROBE-1 – Dirty-Buffer + Drag/Filter/Export + Restart**

- Hypothese: Ein echter nativer Drag, ein Filter, ein FULL-SVG-Export, eine ungespeicherte Quelländerung und ein Serverrestart dürfen weder die Diskquelle noch den Dirty-Buffer verfälschen; der neue Stand muss nach Restart wieder sichtbar sein.
- Aktionen: Comfort.ili öffnen, Diagramm, Fit, Pointer-Drag auf A, VIEW-Filter aus, FULL-SVG über nativen Save-Dialog, natives Tippen von `added:TEXT*8;` in CLASS C, warten auf Analyse, Serverrestart, Diagramm erneut prüfen, Buffer/Disk vergleichen.
- Erwartet vs. tatsächlich: erwartet Geometrieänderung, Export ohne Overview, `added` im Diagramm, Diskhash unverändert, Buffer nach Restart unverändert, Export weiter gültig. Tatsächlich alles erfüllt; Run Exit 0.
- Belege: `evidence/counterprobes/2026-11-02T18-55-12-106Z/{manifest,cases,PROBE-1-geometry}.json`, Bilder `PROBE-1-*`, Export `PROBE-1-filtered.svg`.
- Falsifizierbarkeit: Ein Produkt, das beim Drag schreibt oder beim Restart den Dirtytext verliert, hätte die Hash-/Buffer-Assertions oder den Diagrammtest nicht bestanden.

**PROBE-2 – Stale/Cancel, Pin, Filter/Export, Source-Integrität**

- Hypothese: Ein bewusst gehaltener echter ELK-Response darf nach nativem Cancel nicht übernommen werden; die Ansicht bleibt STALE, ein Refresh muss mit erhaltener Pin-Position funktionieren, und ein Filterexport darf die Quelle nicht verändern.
- Aktionen: neues 24-Klassen-Modell `Large.ili`, Fit, Drag/Pin von C12, einen echten ELK-Response testseitig halten, Refresh, Cancel, gehaltenen Response freigeben, STALE prüfen, Refresh, Pin-Position prüfen, Typenfilter aus, FULL-SVG, Buffer/Disk vergleichen.
- Erwartet vs. tatsächlich: STALE bleibt nach Freigabe, Pin-Position `translate(303.68,913.58)` bleibt, Export ohne TEXT, Buffer/Disk unverändert. Alles erfüllt; Run Exit 0.
- Belege: gleicher Run, `PROBE-2-geometry.json`, `PROBE-2-stale.png`, `PROBE-2-recovered.png`, `PROBE-2-filtered.svg`.
- Falsifizierbarkeit: Eine übernommene alte Antwort würde den STALE-Status verlassen; ein Layoutverlust würde die Pin-Assertion brechen; ein Quellschreibeffekt würde den Diskhash ändern.

**Eigene negative Paket-/Protokollprobe**

- Auf einer separaten Extraktion des selbst gebauten VSIX: Stock-Extraktion akzeptiert; manipulierte `bin/java` abgelehnt; fehlendes LSP-JAR abgelehnt; fremdes `distribution.json`-Target abgelehnt; falscher Lock-Hash abgelehnt; Stockbytes danach wieder akzeptiert.
- Echter Java-Prozess mit Protokoll 999: Initialize liefert `protocolVersion=999`; die Extension-Bedingung `protocolVersion !== 1` erzeugt die erwartete Meldung „The Java server does not support editor protocol version 1…“; Exit 0; Stockbytes wiederhergestellt.
- Beleg: `evidence/counterprobes/2026-11-02T18-54-07-082Z-negative/result.json` (7 Checks, Status passed).
- Zusätzlich vorhanden und verifiziert: Autor-Negativcanary `gui-missing-server-negative` (Exit 1, 0 Java-Starts, exakte JAR-Wiederherstellung) und Autor-Protokollfixture.

## 8. Findings / Blocker

**Offene Muss-Findings:** keine.

**Optionale Beobachtungen (nicht abnahmebegrenzend):**

1. `qualification/V5-final-r1/evidence-count-correction.json` korrigiert die Request-Zusammenfassung „sharedUiAndBrowser=11“ auf tatsächlich 8 Tests (davon 3 Browserfälle). Der Rohlog ist maßgeblich; alle 8 bestanden, keine Skips. Kein fehlender Test wird aus der fehlerhaften Zusammenfassung abgeleitet.
2. Der Autorpaket-Hash `cf8f...` und der eigene Rebuild `9f5b...` unterscheiden sich im ZIP-Container, aber `diff -r` über 344 Dateien/206.552.971 Bytes ist leer; die Produktbytes und Modi sind identisch. Das ist erwartbare ZIP-Metadatenvarianz, kein Inhaltsfinding.
3. `STATUS.md`/`implementation/V5.md` stehen absichtlich noch auf V5 OPEN. Nach diesem inhaltlichen PASS ist ein reiner Archiv-Dokucommit mit dem Bericht an die geprüften SHAs vorgesehen; das ist Chronologie, kein fehlender Produktbeleg.
4. Die Fit-All-Screenshots der Autorenläufe sind klein; die entscheidenden Drag-/Routenfälle sind zusätzlich durch Geometrie-/Routen-JSON und eigene, besser lesbare Läufe belegt. Keine abgeschnittenen Controls oder unlesbaren Pflichtlabels wurden festgestellt.
5. Die eigenen Counterprobes liefen bewusst in einem Workspace mit einem zusätzlichen defekten unbeteiligten Modell und zeigen deshalb „Partial diagram – check Problems“. Das ist korrekte, ehrliche Teilstatusanzeige; der eigentliche Comfort-Lauf ist ohne diese Störung „FRESH“.

**Fehlende Pflichtnachweise:** keine innerhalb des verbindlich angepassten Umfangs. Linux-/Windows-GUI und Remote-GUI sind ausdrücklich keine Abnahmepflicht und werden nicht als PASS behauptet.

**Äußerer Prozessabschluss:** Der Reviewer kann den endgültigen OpenCode-/Guardexit seines noch laufenden Prozesses nicht selbst feststellen. Der inhaltliche PASS ist daher zusammen mit dem von Codex zu prüfenden Transport-/Guardabschluss, den unveränderten tracked Trees nach Prozessende und der Artefaktidentität die operative Freigabe. Kein Push, Merge, Tag oder Release wurde ausgeführt.

## 9. Urteil

**PASS** für den inhaltlichen, kumulativen V5-Produktumfang auf dem bezeichneten Paar:

- Core `6983baf95c47a7e20dbb41a2e50500185f578c37`
- Extension `3a888507b11c5ecefb03e4fe34aa11499894039c`

Alle 56 Muss-ACs sind im verbindlich angepassten Plattformumfang erfüllt; alle fälligen eigenen und verifizierten Tests/GUIpfade sind belegt; zwei neue Cross-Feature-GUIproben und eine echte negative Paket-/Protokollprobe bestanden; keine offenen Muss-Findings. Die nächste erlaubte Handlung ist der äußere Transport-/Guardabschluss und danach der reine Archiv-Dokucommit; keine Publikation.
