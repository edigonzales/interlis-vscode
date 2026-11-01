# Unabhängiger Review V1 – INTERLIS VS Code

## 1. Identität

**Phase:** V1 (keine kumulative V5-Abnahme).
**OpenCode:** `opencode v2.0.28` (`/var/folders/.../interlis-without-python-kT3fTd/bin/opencode`). **Provider:** `deepseek`. **API-Modell:** `deepseek-flash`. **API-Host:** `https://api.deepseek.com`. **Aliasnachweis:** Die offizielle DeepSeek-Preisseite wurde in dieser Session abgerufen; sie nennt `deepseek-flash` als Modellnamen und `DeepSeek-V4.1-Flash-1017` als Modellversion. `opencode models` listet `deepseek/deepseek-flash`; die Reviewkonfiguration setzt für Provider `deepseek` ausschliesslich `baseURL: https://api.deepseek.com`. Es waren keine Proxy-/OPENAI-/DEEPSEEK-Base-URL-Umgebungsvariablen gesetzt. Die Modellselbstauskunft wurde nicht als Identitätsbeleg verwendet. Keine Credentials gelesen oder ausgegeben.

| Repository | assignmentBase | phaseBase | candidate | tatsächlicher HEAD |
|---|---|---|---|---|
| Core | `20b0029d824b3602d9a304320bf0feae4c35c1f9` | `76df3815973597280845a9bb575fa399e9773ccc` | `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9` | `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9` |
| Extension | `73badd9807f407aea048d397af5549fe907a1501` | `31806bfbe98489d4d11f9bf87794cf6937f5d9de` | `d237d92fbe22f6fb41d7d6f3f0965c0d080e30e9` | `d237d92fbe22f6fb41d7d6f3f0965c0d080e30e9` |

Beide Worktrees wurden detached an genau diesen Paar-SHAs geprüft. **Tracked Zustand vorher/nachher:** Core sauber; Extension sauber. Einzige untracked Datei in Extension ist `opencode.json` (Review-Harness-Konfiguration); Build-/Testausgaben liegen in ignorierten `build/`- und `artifacts/`-Pfaden. Keine Produktdatei geändert, kein Commit/Push/Release.

**Artefakte:** VSIX `build/packages/interlis-vscode-darwin-arm64.vsix`, SHA-256 `07071ebe6ebee9c803ce53bc367dd7b0fc51d095a028c01f7cef3fc8a30e7049`; installiertes Clientbundle `out/extension.cjs`, SHA-256 `73062160f6373d659bfae7187489921c8bcde2a7178c60b8bd27ecf464aee3be` (identisch mit frischem `npm run build`); alle elf Server-JARs stimmen mit `release/editor-artifacts.lock.json` überein. Der Lock nennt Core `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9`. Umgebung: macOS 24.6.0 arm64, VS Code 1.140.0, ExTester 8.28.1, ChromeDriver 150.0.7871.250, Java Temurin 25.0.3, Node 22.13.0/npm 10.9.2. Keine Linux-/Windows-/Remote-/Runtimebündelungsbehauptung für V1.

## 2. Eigene Ziel-, Code- und Architekturprüfung

Gelesen wurden der vollständige V1-Diff (Core 186 Dateien, Extension 20 Dateien), die Implementierungsberichte V0/V1/STATUS, die verbindlichen Pläne, die Java-LSP-/Repository-/Workspace-Klassen und die Testquellen. Relevante Änderungen:

- **Core:** `LspDiagnosticMapper`, `LspCompileMapper`, `ExternalSourceRegistry`, `RepositoryHostCoordinator`, `RepositorySettings`, `CoalescingSourceLoader`, `CompileModelParams`/`CompileReport`, Erweiterungen an `InterlisTextDocumentService`, `AnalysisScheduler`, `InterlisLanguageServer`, `LspConfiguration`, sowie Repository-Cache/Suche/Closure und Workspace-Konfiguration.
- **Extension:** Allowlist-Übertragung in `src/host/configuration.ts`, readonly Content-Provider und versionierter Compile-Command in `src/extension.ts`, deklarative Settings, Fixtures, Protokoll-/GUI-Tests.

**Eine Sprachautorität:** Die neue Extension enthält keinen `.ili`-Parser, keinen Regex-Symbolindex und keine TS-Typ-/Import-/Rename-Engine. `src/` beschränkt sich auf Host/Launcher/Client/Content-Provider; alle Semantik läuft über den Java-LSP. Die Abhängigkeitsprüfung über Lockfile, installierten `npm ls`-Graph und Produktbundle ist ohne `@ilic`, `interlis-language-tools` oder `ilic.wasm` erfolgreich. Die einzigen übernommenen Testmodelle sind mit Herkunft, Commit, Lizenz und SHA-256 in `docs/provenance/source-adoptions.md` dokumentiert; es sind Testeingaben, keine Compilerquellen oder Paketlinks.

**Repository-/Quellgrenzen:** Repositoryauflösung, Versionketten, Pins, Cache und Offline-Verhalten liegen in Java (`HostRepositories`, `RepositoryClosureService`, `HttpSourceLoader`). Die Extension implementiert keine eigene Suche/Versionauswahl. Der Cachepfad kommt als absoluter `globalStorage`-Pfad an; der Server verwendet ihn über `RepositoryCacheConfiguration`. Dirty-Buffer werden über Workspace-Updates vor Diskquellen und Repositoryquellen priorisiert; Apply ist revisions- und konfigurationsgebunden. Externe Quellen erhalten sessiongebundene `interlis-source:`-Handles; `didOpen` akzeptiert nur inhaltsgleiche Registrierungen, `didChange` wird abgewiesen, `editable` ist herkunftsgebunden falsch, `formatting` und `codeAction` liefern für externe Quellen keine Änderungen.

**Versions-/Frischegrenzen:** LSP-Dokumentversion, Core-SourceRevision, Snapshot-ID und Server-Instanz bleiben getrennt. `compile current` verlangt eine versionierte offene Dokument-ID und prüft die Version vor sowie nach dem Lauf; Workspace-Compile ist ein eigener Modus. Veraltete Repositoryantworten werden über Generation/Revision und `STALE`/`ContentModified` abgewiesen. Der Compile-Report enthält typisierte Zusammenfassung und Diagnosen aus `requestDiagnostics()`, nicht die komplette IDE-Analyse.

**V1-Abgrenzung:** V1 implementiert bewusst **kein** interaktives UML, keinen Diagrammrenderer und keine Dokumentationsexporte. Diese bleiben V2–V4. Es wurde keine zweite Rendererquelle angelegt. Die V1-GUIprüfung umfasst daher Editor-/Repositorypfade, nicht Node-/Kantendrag oder SVG/PNG.

## 3. Jede fällige Muss-AC

| AC-ID | Urteil | Eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|
| V1-01 | **erfüllt** | `LspDiagnosticMapper` und `DiagnosticMessageFormatter` bilden Code, Severity, UTF-16-Range, Version, echte RelatedInformation und DE/EN-Prosa ab; globale Diagnosen werden über den Operationskanal ausgegeben. GUI-04 zeigte deutsche und englische Meldung mit identischem `ILI-SEM-0010` und identischer Zeile, RelatedInformation sprang auf die echte zweite Deklaration (Zeile 5). GUI-Assertion verbietet `diagnostic.` und ESC. | Optional: einzelne `ILI-SEM-0010`-Regeltexte erscheinen im DE-Satz noch englisch (z. B. „class name must be unique in a topic“). Lesbarkeit/Code/Range sind dadurch nicht verletzt. |
| V1-02 | **erfüllt** | `RepositoryEditorTest.localDirtySourcesWinAndCurrentCompileExcludesBrokenNeighbour`, `transitiveSourcesRemainReadonlyAfterOpenAndPersistOfflineAcrossServerInstances`, `offlineMissRetainsSpecificDiagnosticAndInvalidConfigurationIsAtomic`; GUI-05 (Dirtybuffer-Hover/Definition), GUI-09 (transitive Repositories, Offline, Mehrdeutigkeit), eigene CP-01 (ungespeicherter Import schlägt geschlossene Diskquelle; unbenutztes defektes Nachbarmodell blockiert Root nicht). | — |
| V1-03 | **erfüllt** | `RepositoryEditorTest` prüft `interlis-source:`-URI, inhaltsidentischen Text, Readonly nach `didOpen`, abgewiesene Formatierung/Rename und unveränderte Quelle nach Tippversuch. GUI-10 und eigene CP-02: Tippen ändert nichts, Editor bleibt nicht dirty, F2 öffnet keine Rename-Box, Hover funktioniert weiter. | — |
| V1-04 | **erfüllt** | `P3ProjectRenameTest` (20 Fälle inkl. geschlossener Deklaration, ungespeicherter Referenz, Hardlink-/Alias-/Versionskonflikte), `P3CompletionProtocolTest`, `P3DocumentSynchronizationTest`; GUI-05 (Hover/F12 auf qualifizierten Segmenten), GUI-06 (geschlossene Quelle), GUI-07 (Rename/Undo), GUI-11 (Completion ersetzt nur das gewählte Segment), CP-01 (F12 in Dirty-Import). | — |
| V1-05 | **erfüllt** | Hierarchischer `documentSymbol`-Baum im Java-Adapter; Standard-LSP für Folding/SemanticTokens/Formatting; `P3PresentationConfigurationTest` (Formatierung/Indent), `P3DocumentSynchronizationTest` (CRLF/Emoji/Unicode), `RepositoryEditorTest.outlineUsesSemanticOwnersAndLocalizedRelatedDiagnosticsUseExactCrlfRanges`; GUI-11 zeigt Outline `Survey → Data → Building → height`, Fold/Unfold, Light-Theme und semantische Färbung. | — |
| V1-06 | **erfüllt** | `compileModel` mit `current`/`workspace`, Versionsprüfung, `BySource`/`ByName`-Roots und `CompileReport`; `LspProcessTest.customCompileAndReadonlySourceUseTheRealStdioLauncher`; GUI-08: gültiger Root kompiliert erfolgreich, während ein defektes Nachbarmodell in Problems bleibt; derselbe Defekt als gewählter Root wird abgelehnt; eigene CP-01 wiederholt dies mit Dirty-Import. `interlis.compile` bleibt expliziter Workspace-Modus. | — |
| V1-07 | **erfüllt** | `RepositoryEditorTest.offlineMiss...` prüft atomare Verwerfung einer ungültigen Konfiguration; `CoalescingSourceLoaderTest` (5 Fälle) prüft Koaleszenz, isolierte Cancellation, Offline-Cacheport und Queue-Grenzen; `P3AnalysisSchedulingTest`, `P3DocumentSynchronizationTest`, `P3ProjectRenameTest` decken Watcher/Alias-/Revisionspfade ab. Extension behandelt Folderwechsel durch kontrollierten Stop/Start mit normalem Client-Re-Sync; Multi-root-GUI ist erst V5 (GUI-39), der Code-/Restartpfad wurde hier gelesen. | Kein Mussfinding; Multi-root nicht in dieser Phase als GUI-Szenario gefordert. |
| V1-08 | **erfüllt** | Eigener installierter GUI-Lauf `editor` mit echtem Java-LSP: GUI-01–GUI-11, 11/11 bestanden, drei Java-Starts, keine verbleibenden PIDs, Exit 0. Rohbelege und Bilder unten. | — |
| V1-09 | **erfüllt** | Eigene frische Läufe: LSP 65/65, Repository 64/64, Workspace 23/23, Model 23/23, Compiler 766/766, Unit 5/5, Protokoll 1/1, Extension-Host 3 Prüfgruppen, Dependencygraph, GUI 11/11. Bestehende Synchronisations-, Pfad-, Hardlink- und Closed-Rename-Regressionen sind in den 65 LSP-Tests enthalten; Parser-/Normcode blieb unverändert (Diffprüfung), daher kein pauschaler Korpus-/`releaseCheckP3`-Lauf. | Portable Belegdatei ist mit `cf585ec`, `dirty:true` protokolliert; Model/Compiler/WASM haben seither nachweislich keinen Source-Diff. Für V1 wird daraus kein Produktanspruch abgeleitet; für V5 ist ein sauberer Lauf erforderlich. |
| V1-10 | **erfüllt (inhaltlich)** | Eigene neue Workspace-/Dirty-/Repository-Gegenprobe (CP-01/CP-02, zwei Fälle, 2/2, eigener lokaler HTTP-Repositoryserver, eigene Fixtures) plus eigene installierte GUI-Prüfung und Bildsichtung. Ergebnis dieses Reviews: PASS. | Der äussere OpenCode-/Guard-Prozessabschluss ist nicht Teil dieser laufenden Session; Codex muss ihn nach Prozessende separat prüfen. |

## 4. Featureparität

Im V1-Scope tatsächlich berührt und belegt:

- **F01/F10:** `.ili`/`.ILI`-Sprache und Formatierung; GUI-01/GUI-03, unveränderte TextMate-Ressourcen.
- **F02/F09:** SemanticTokens/Folding/Outline über Standard-LSP; GUI-11, hierarchischer Java-Outline-Baum.
- **F03/F08:** DE/EN-Diagnostik mit Code/Severity/RelatedInformation und Hover; GUI-04/GUI-05.
- **F04/F05/F06/F07:** Compile-current, Definition, References, PrepareRename/Rename; GUI-05/06/07/08 und LSP-/Rename-Tests.
- **F17:** Vorlage aus V0 bleibt ohne Netz verfügbar; nicht erneut als neue V1-Funktion behauptet.
- **F19/F20/F21/F22:** lokale/geschlossene Quellen vor Repository, transitive Imports/Cache/Offline, Watcher/Folderwechsel, Neustart ohne Buffer-Verlust; GUI-06/09, GUI-03 und Java-Tests.

Bewusst **nicht** in V1 behauptet: F11–F16 und F18 in vollem Umfang (Completion-/Snippet-/AutoClose-/QuickFix-Verträge folgen V4), F23–F46 (UML folgt V2/V3), F47–F52 (Dokumentation folgt V4), F53–F55 (gebündelte Runtime/Plattformen folgen V5). V1 liefert keine semantische Diagrammbearbeitung und keine Publikation.

## 5. Risikobasierte Tests

| Gate/Case | Fällig / nicht fällig | Kommando und cwd | Ergebnis |
|---|---|---|---|
| T0 Dependency-/Artefaktprüfung | fällig (neue Paket-/Bundleflächen) | `npm run verify:no-legacy-dependencies` in Extension | Exit 0; Lock, vollständiger installierter Graph und Bundle ohne Altprojekt |
| Vorbereitung | fällig | `npm ci --ignore-scripts`; `npm run stage:core -- --core-dir <core-worktree>` | Exit 0; 11 JARs aus Core `3b60e6c…`; Lock-Hashes alle gleich |
| Build | fällig | `npm run build` | Exit 0; Bundle `730621…` identisch mit installiertem VSIX-Bundle |
| TS-Unit/Manifest | fällig | `npm run test:unit` | 5/5, keine Skips |
| T2 echter stdio-Transport | fällig | `npm run test:protocol` | 1/1; echter Java-Prozess, `interlis/compile`, `interlis/source`, unbekannter Handle abgewiesen, Shutdown/Exit 0 |
| LSP-Java | fällig (LSP-/Config-/Editoränderungen) | `./gradlew :interlis-lsp:test --no-daemon` in Core | 65/65, 0 Skips, 0 Fehler |
| Repository/Workspace | fällig (Resolver-/Cache-/Workspaceänderungen) | `./gradlew :interlis-repository:test :interlis-workspace:test --rerun-tasks --no-daemon` | 64/64 und 23/23, 0 Skips |
| Model/Compiler | zusätzlich sinnvoll (Formatter/Diagnostic-/Lifecycle-Diff) | `./gradlew :interlis-model:test :interlis-compiler:test --rerun-tasks --no-daemon` | 23/23 und 766/766, 0 Skips; kein Parser-/Normbruch |
| Extension-Host | fällig | `npm run test:extension-host` mit gepinntem VS Code | 3 Prüfgruppen: Aktivierung/Commands, echte Definition, ungespeicherte Vorlage; Exit 0 |
| T4 installierte GUI | fällig (GUI-01..11) | `npm run test:gui -- --suite editor --vsix … --cache …` | 11/11, Exit 0, 3 echte Java-Starts, 0 verbleibende PIDs |
| Negativcanary | fällig | `npm run test:gui -- --suite smoke … --canary missing-status` | erwarteter Exit 1; GUI-01 scheitert an der absichtlich unmöglichen sichtbaren Erwartung, GUI-02/03 bestehen |
| Eigene GUI-Gegenprobe | fällig ab V1 | eigener Runner in `extension/build/reviewer-counterprobe` | 2/2, Exit 0, ein echter Java-Start, 0 verbleibende PIDs |

**Nicht fällig und begründet:** vollständiger Compiler-/Norm-Korpus (kein Parser-/Norm-Diff; die 766 Compiler-Unit-Tests und 23 Modelltests liefen zusätzlich), Browser-/Safari-/Diagrammprüfungen (keine Diagrammänderung, V2 noch nicht begonnen), Cross-Platform-/Remote-/Runtimeprüfungen (V5). Ein pauschaler `releaseCheckP3` war nicht erforderlich. Die Auswahl ist aus dem tatsächlichen Diff begründet und nicht nachträglich zum Grünwerden verkürzt.

## 6. Echte GUI und Sichtprüfung

Eigener Lauf: `extension/build/reports/gui/editor/2026-11-01T18-13-25-681Z/` mit `manifest.json`, `cases.json`, 34 PNGs und Workbench-Logs. Der Lauf installierte das bezeichnete VSIX in einem isolierten Profil, prüfte installierte ID/Version, alle Serverhashes und das Clientbundle und startete den echten Java-LSP.

Tatsächlich angesehene Bilder (Read der Bilddateien in dieser Session):

- `GUI-01-ready.png`: echte Workbench, Explorer mit `.ili`, Status „INTERLIS: Ready“.
- `GUI-02-error.png`: sichtbare Problems-Zeile mit lesbarer Meldung, Code `ILI-SEM-0001`, Zeile 8.
- `GUI-03-restarted.png`: Dirty-Markierung blieb nach Stop/Restart erhalten, Korrektur beseitigte den Fehler.
- `GUI-04-german.png` / `GUI-04-related.png`: deutsche Meldung, Code, Severity, RelatedInformation und Sprung auf die zweite Deklaration (Zeile 5); englische Fassung über `GUI-04-messages.json` bestätigt. Visuell fiel die teilweise englische Regelphrase im deutschen Satz auf (siehe optionale Beobachtung).
- `GUI-05-hover.png`: Hover aus dem Dirtybuffer zeigt `DOMAIN CurrentHeight: NUMERIC`.
- `GUI-06-references.png`: Referenzbaum enthält die geschlossene `Base.ili`.
- `GUI-07-reference.png` / `GUI-07-undone.png`: projektweite Umbenennung in Deklaration/END/Verwendung und vollständige Undo-Wiederherstellung.
- `GUI-08-valid-root.png`: Root-Compile erfolgreich, während `Broken.ili` mit Fehler sichtbar bleibt.
- `GUI-09-online-middle.png`, `GUI-09-online-leaf.png`, `GUI-09-offline.png`, `GUI-09-offline-miss.png`, `GUI-09-ambiguity.png`: transitive Remote-Navigation, exakter Remote-Text, Offline-Navigation ohne neue HTTP-Anfrage, konkreter Offline-Fehler, sichtbare Mehrdeutigkeit ohne stille Auswahl.
- `GUI-10-blocked-input.png`, `GUI-10-hover.png`: Readonly-Editor verweigert Tippen, Hover funktioniert weiter.
- `GUI-11-outline.png`, `GUI-11-light.png`, `GUI-11-completion.png`: echte verschachtelte Outline, tatsächlich helles Workbench-Theme, qualifizierte Completion `Base.Count` ohne zusätzliche Textänderung.
- Eigene Gegenprobe: `CP-01-dirty-import-navigation.png`, `CP-01-current-root-succeeds.png`, `CP-01-broken-root-rejected.png`, `CP-02-readonly-typing.png`, `CP-02-readonly-no-rename.png`.
- `failure-own .png` aus einem verworfenen Gegenprobenlauf: zeigt korrekt die `MODEL`-Zeile, nachdem der erste Entwurf versehentlich das Modellsegment statt des Domainsegments anvisiert hatte; kein Produktfehler, sondern Reviewer-Iteration.

**Node-/Kantenbewegung, Routing, SVG/PNG:** In V1 nicht vorhanden und nicht behauptet. Die GUIprüfung belegt ausschliesslich Editor-/Repositoryverhalten; UML-Interaktion ist V2, Exporte V3.

**Dialog/Cancel/Plattform:** In V1 kein Dateiexport-/Runtimepfad fällig. macOS arm64 wurde real geprüft; Linux/Windows/Remote bleiben V5 und werden hier nicht behauptet.

## 7. Neue Gegenproben

**CP-01 – Dirty-Import vor geschlossener Diskquelle + unabhängiger Root:**

- **Hypothese:** Ein ungespeicherter Importbuffer muss die geschlossene Diskdatei semantisch verdrängen, und ein unbenutztes defektes Nachbarmodell darf „Compile Current Model“ nicht ablehnen.
- **Eigene Fixtures:** `ZBase.ili`, `ZRoot.ili`, `ZBroken.ili` unter `evidence/counterprobe/fixtures/` (eigene Modelle/Names, nicht die Codex-Fixtures).
- **Aktionen:** `ZBroken` im Buffer auf `10..0` ändern; `ZBase.ZMeasure` im Buffer zu `ZLiveMeasure` umbenennen; `ZRoot` im Buffer auf `ZBase.ZLiveMeasure` zeigen; F12 auf das Domainsegment; „Compile Current Model“ für `ZRoot`; danach `ZBroken` als Root kompilieren; Buffer wiederherstellen.
- **Erwartet/beobachtet:** F12 landet auf der Dirty-Deklaration in `ZBase.ili` Zeile 5; `ZBase.ili` auf Disk enthält weiterhin `ZMeasure`; `ZRoot` kompiliert erfolgreich, während `ZBroken` in Problems bleibt; `ZBroken` als Root wird abgelehnt; Diskdateien bleiben unverändert. Exit 0, 2/2.
- **Falsifizierbarkeit:** Der Fall wäre rot, wenn der Server die Diskdatei verwendet (F12 würde die alte Deklaration nicht finden), wenn das Nachbarmodell den Root-Commit ablehnt oder wenn ein Tippen/Compile die Diskdatei verändert.

**CP-02 – Readonly-Repositoryquelle nach Navigation und Öffnen:**

- **Eigene Fixtures:** `ZExternal.ili` plus eigener lokaler HTTP-Server mit `ZRemoteTop.ili`, `ZRemoteLeaf7/8` und `ZRemoteLeaf`-Pin auf Version 8.
- **Aktionen:** F12 durch den Import, `interlis-source:`-Tab öffnen, Text tippen, F2 auf einem Symbol, Hover.
- **Erwartet/beobachtet:** exakter Remote-Text, URI beginnt mit `interlis-source:`, Tippen ändert nichts, Editor bleibt nicht dirty, keine Rename-Box, Serveranfragen betreffen `ZRemoteTop.ili`/`ZRemoteLeaf8.ili` (nicht Leaf 7). Exit 0.
- **Falsifizierbarkeit:** Tippen würde den Text oder Dirtyzustand ändern; eine Rename-Box würde erscheinen; der Server würde die ungepinnte Version laden.

**Bewusst fehlschlagende Harnessprobe:** `--canary missing-status` endete mit Exit 1 und GUI-01-Fehler „Negative canary: impossible visible status was not present“, während GUI-02/03 bestanden. Damit ist der Harness nicht auf bloßes „0 Tests/0 Fehler“ geeicht.

**Verworfene Reviewer-Interaktionen (ehrlich protokolliert):** Der erste Gegenproben-Entwurf nutzte einen zu langen `/var/folders`-Storagepfad (ExTester-Abbruch vor der Workbench), traf beim F12 zunächst das `ZBase`-Modellsegment statt des Domainsegments und verwendete anschliessend eine Problems-Abfrage, während das OUTPUT-Panel aktiv war. Diese drei Fehlschläge sind Reviewer-Harnessfehler, keine Produktfindings; die finalen Aktionen und Orakel sind oben dokumentiert, die Fehlversuchsordner unter `evidence/counterprobe/gui/` bleiben erhalten.

## 8. Findings / Blocker

**Offene Muss-Findings:** keine.

**Optionale Beobachtungen (nicht abnahmeblockierend):**

1. Einige deutsche `ILI-SEM-0010`-Sätze enthalten noch eine englische Regelphrase (z. B. „class name must be unique in a topic“). Code, Severity und RelatedInformation sind korrekt; eine spätere vollständige Regelübersetzung wäre eine Qualitätsverbesserung.
2. Wiederholte F12-Navigation nach Settings-/Restartwechseln erzeugt mehrere gleichnamige `interlis-source`-Tabs. Das ist ein UX-/Tab-Management-Thema, kein Verletzen der Readonly-/Revisionsgrenzen; für V3 (Panel-/Zustandslebensdauer) sinnvoll zu beobachten.
3. Die portable Belegdatei `V1-shared-sentinels/portable.json` ist mit `cf585ec` und `dirty:true` protokolliert. Da Model/Compiler/WASM seit `cf585ec` nachweislich keinen Source-Diff haben und dieser Review Model 23/23 sowie Compiler 766/766 frisch ausführte, ist daraus kein V1-Mussfinding; V5 sollte den portablen Lauf sauber wiederholen.
4. Der GUI-Lauf protokolliert drei Java-Starts, aber nur zwei Exit-Zeilen im Manifest (die dritte Exitzeile entstand nach dem Log-Snapshot). Die PID-Prüfung bestätigt keine verbleibenden Prozesse; die Harness-Logreihenfolge ist eine Beobachtung, kein Serverleck.

**Fehlende Pflichtnachweise:** keine. Alle in `request.json` geforderten Checks und GUI-Cases wurden ausgeführt; die nicht geforderten Bereiche sind oben begründet.

## 9. Urteil

**PASS** für das geprüfte Produktpaar Core `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9` / Extension `d237d92fbe22f6fb41d7d6f3f0965c0d080e30e9` auf inhaltlicher Ebene.

Alle V1-Muss-ACs sind erfüllt; die eigenen Gegenproben und die installierte GUI bestätigen Dirtybuffer-Priorität, echte RelatedInformation, hierarchische Outline, Current-/Workspace-Compile-Trennung, transitive/offline Repositoryauflösung und Readonly-Quellen. Es gibt keine offenen Muss-Findings. Nächster erlaubter Schritt nach diesem inhaltlichen PASS: V2, **aber erst nachdem Codex den äusseren OpenCode-/Guard-Prozessabschluss, die Transportidentität und die unveränderten Worktree-Hashes nach Prozessende geprüft hat**. Der Abschluss des äusseren Prozesses wird in dieser laufenden Session nicht behauptet.
