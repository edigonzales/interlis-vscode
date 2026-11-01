# INTERLIS VS Code – Architektur, Implementierung und unabhängige Abnahme

**Verbindlicher Folgeauftrag · Version 1.0 · 1. November 2026**  
**Implementierung:** Codex, Agent A. **Prüfung:** separater OpenCode-2.x-Agent B mit **DeepSeek-V4.1-Flash-1017 über die direkte DeepSeek API**.  
**Ziel:** eine produktiv brauchbare Desktop-Extension auf dem vorhandenen Java-INTERLIS-Stack, möglichst schnelle funktionale Parität der drei Referenzextensions, besonders beim tatsächlich interaktiven UML-Diagramm.

Ergänzende verbindliche Dateien: [FEATURE_AUDIT.md](FEATURE_AUDIT.md), [GUI_TEST_MATRIX.md](GUI_TEST_MATRIX.md), [CODEX_STARTPROMPT.md](CODEX_STARTPROMPT.md), [OPENCODE_REVIEW_PROMPT.md](OPENCODE_REVIEW_PROMPT.md).

## 0. Auftrag, Reihenfolge und unumstössliche Grenzen

### 0.1 Produktentscheidungen

1. **Eine Sprachimplementierung:** `interlis-compiler`, `interlis-workspace`, `interlis-repository` und die bestehenden Java-Projektionen bestimmen INTERLIS-Semantik. `interlis-lsp` ist deren Host-/Protokolladapter. Die VS-Code-Extension besitzt weder zweiten Parser noch Symbol-/Typ-/Import-/Rename-Engine.
2. **Neues Extensionprojekt:** lokales, eigenständiges Repository `interlis-vscode` neben dem bestehenden Java-Repo. Arbeitsname/Extension-ID `edigonzales.interlis-vscode`, Anzeigename „INTERLIS“, Command-/Setting-Namespace `interlisGuru`. Keine Kompatibilität zu alten Extension-IDs oder alten Commands erforderlich. Eine entfernte Repositoryanlage oder Veröffentlichung ist nicht beauftragt.
3. **Keine Abhängigkeit von `interlis-language-tools`:** weder zur Laufzeit noch beim Build, bei Tests, über type-only imports, `file:`, `workspace:`, Git-URLs, Submodule, Downloadscripts oder ein Wrapperpaket. Geeignete Quellteile dürfen nach Lizenz-/Herkunftskontrolle übernommen und eigenständig weiterentwickelt oder neu geschrieben werden. Kein `@ilic/*` im aktiven neuen Paketgraphen. Historische Herkunftsangaben bleiben erlaubt und nötig.
4. **UML mit ELK + echtem Sprotty:** ein gemeinsam genutzter, lokal ausgelieferter Diagrammbaustein; kein zusätzlicher GLSP-Server, kein eigener WebSocket, keine parallele Cytoscape-Engine. Die Entscheidung ist getroffen, nicht in jeder Phase erneut zu evaluieren. Ein Sprotty-kompatibles JSON oder ein statisches SVG allein erfüllt sie nicht.
5. **Grafisch interaktiv, fachlich zunächst read-only:** Knoten/Container bewegen, Kantenführung verändern, Filter, Navigation, Layout-Undo/-Redo und Export sind Pflicht. Diese Aktionen ändern **niemals** `.ili` oder dessen Editorbuffer. Semantisches Diagramm→Quelltext-Editing ist spätere Erweiterung; Schnittstellen werden dafür nicht verbaut, aber keine leeren Schreibdienste implementiert.
6. **Wirkliche GUI-Tests:** Extension-API-/LSP-/Unit-Tests sind nötig, ersetzen aber nicht Tastatur-/Mausaktionen in einer echten installierten VS-Code-Workbench und ihrem Webview. GUI-Prüfungen beginnen bereits V0.
7. **Phasengates:** V0 → V1 → V2 → V3 → V4 → V5. Eine Folgephase startet ausschliesslich nach eigenständigem `PASS` des Reviewers auf das aktuelle Produktpaar. Bei FAIL Nacharbeit derselben Phase; bei BLOCKED keine Freigabe. Codex orchestriert die Reviews und setzt nach PASS **autonom** fort.
8. **Risikobasierte Testauswahl:** nicht jedes Mal sämtliche Compiler-/WASM-/Safari-/Corpus-/Release-Tests starten. Die in §10 definierte Wirkungsmatrix ist bindend. Der Reviewer prüft auch die Begründung der nicht fälligen Tests. Eine fehlgeschlagene Pflichtprüfung darf nicht nachträglich „nicht relevant“ werden.
9. **Kein Python:** neue Produkt-, Build-, Test- und Agentenhilfen ausschliesslich mit vorhandenen Java-/Gradle-/Node-/Shellwerkzeugen. Bestehenden Pythonfreiheitsschutz des Java-Projekts erhalten. Nicht die Pythonbefehle aus dem angehängten Kartenkatalogbeispiel übernehmen.
10. **Keine unbeauftragte Publikation:** lokale Commits erlaubt; kein Push, Merge, Tag, Marketplace-/Open-VSX-/npm-Release oder Workflow-Dispatch ohne ausdrückliche Nutzerfreigabe. Bestehende veröffentlichende Workflows vor Nutzung prüfen.

### 0.2 Umfang und Nicht-Ziele

Beauftragt sind die 60 Fähigkeiten F01–F60 im Audit, soweit mit V0–V5 versehen, und die **56 Abnahmekriterien** dieses Plans. Desktopsprachfunktionen, Repositoryintegration, UML und Dokumentationsexporte werden innerhalb dieses Auftrags geliefert, nicht bloss als spätere TODOs notiert. Die ausdrücklichen Abgrenzungen des Audits gelten: kein INTERLIS 1, keine neue Validator-/DB-Anwendung, kein VS-Code-Web-LSP, keine Theia-/Monaco-Hostzertifizierung, kein grafisches semantisches Editieren. Separate historische Mermaid-/PlantUML-Livepreviewengines entfallen zugunsten einer interaktiven Standardansicht; ihre Textausgaben bleiben.

Keine Umbenennung von `interlis-compiler`, kein Rückbau der CLI-Modernisierung, kein Wiederauferstehen der ili2c-Bedienkompatibilität. Keine neuen XFAILs, keine stillen Normprofiländerungen. Bei einem realen Compilerdefekt kleinen RED-Fall anlegen und gesondert dokumentieren; eine nötige Semantikkorrektur erweitert die fälligen Compilerprüfungen, nicht den Anspruch der Extension auf eine eigene Sprachlogik.

### 0.3 Verhältnis zur Vorlage

Die mitgelieferten Kartenkatalog-Markdowns sind **Verfahrensvorbild**, nicht fachliche Anforderungen dieses Projekts. Übernommen werden klare Rollen, einzelne Muss-ACs, saubere Kandidatencommits, unabhängige Ziel-/Codeprüfung und eigene Gegenproben. Bewusst anders: autonome OpenCode-CLI-Orchestrierung statt manueller GUI-Handoff nach jeder Phase; zwei Produktrepos statt eines; Tests nach Auswirkungsbereich statt pauschaler Volltests. Kein Quarkus-/Lucene-/Docker-Cleanup und keine dortigen Pythonharnesses übernehmen.

## 1. Baseline und aktuelle Änderungen

Die vollständige Quellenanalyse steht im Audit. Recherchierter Java-HEAD: `b8051493a8b93e0be4b12735785803d068df6f80`. Das ist der Merge von CLI1–CLI3, nicht die frühere `a996ef0...`-Baseline. Der neue Stand enthält `interlis-compiler-cli`, `interlis-compiler`, `requestDiagnostics()`, DE/EN-Formatter, RelatedLocations und Windows-/SDK-Korrekturen.

**Wichtige noch offene LSP-Verbraucherlücken:** technische Diagnosetexte; flache DocumentSymbols; CodeAction bisher vor allem Formatierung; externe Repositoryintegration nicht entsprechend dem Core angeschlossen; diagram-Request nur mit Defaults; Compilecommand bisher Workspace ohne Rootparameter. Vorhandene hochqualitative Synchronisations-/Cancellation-/Rename-/Pfadidentitätstests dürfen nicht durch eine vereinfachte Neufassung verloren gehen.

Der Agent liest vor Beginn tatsächliches `git status`, HEAD, Branch, Remotes und relevante Änderungen seit der Recherche. Keine Resets auf diese Pins, keine fremden Änderungen verwerfen oder ungefragt committen. Falls zwischenzeitlich Farbausgabe oder andere LSP-Verbesserungen gemergt sind, diese als aktuelle Baseline übernehmen. ANSI-Terminaldarstellung bleibt vom LSP-Protokoll getrennt; stdout des Servers enthält ausschliesslich JSON-RPC.

Die Quellaufnahme in V0 ist klein und zielgerichtet: aktuelle Module, relevante APIs, Build-/Artefaktpfade, Extensionfeatures, GUI-Lauffähigkeit. Kein erneuter Vollinventar-/Normevidenz-Marathon.

## 2. Repository- und Paketarchitektur

### 2.1 Zwei Repos, ein geprüfter Produktstand

Im Folgenden sind `CORE_DIR` und `EXT_DIR` **ermittelte absolute lokale Pfade**, keine festen `/Users/...`-Pfade. CORE ist das bestehende Java-Repo; EXT das neue oder bereits angelegte `interlis-vscode`. Bereits existierende Inhalte vor einer Initialisierung prüfen. Ein neues lokales `git init` ist erlaubt, ein neuer entfernter GitHub-Repo nicht automatisch.

```text
CORE_DIR/
  interlis-model/                 # vorhandene semantische Werte/Diagnosen
  interlis-compiler/              # vorhandene Syntax/Semantik/Queries/Formatter
  interlis-workspace/             # vorhandene Revisionen/Analysezustände
  interlis-repository/            # vorhandene Modellbeschaffung/Locks/Cache
  interlis-projection/            # vorhandenes neutrales DiagramDocument
  interlis-lsp/                   # erweitertes echtes Java-stdio-LSP
  interlis-documentation/         # NEU erst V4: tatsächlich implementierte Dokumentprojektion
  frontend/diagram-ui/            # NEU V2: EIN eigener neutraler TS-Diagrammbaustein
  interlis-wasm-teavm/...          # konsumiert denselben Diagrammbaustein statt zweiter Kopie

EXT_DIR/
  package.json                   # Extension manifest, eigene ID und scripts
  package-lock.json              # eigener reproduzierbarer Dependencylock
  src/
    extension.ts
    host/                        # Start, Settings, URI-/Readonlydarstellung, Status
    protocol/                    # getypte LSP-Erweiterungsclient-Adapter
    commands/                    # Benutzerbefehle, Dialoge, sichere Ausgaben
    diagram/                     # VS-Code-CustomEditor-/Webview-Lifecycle, keine Semantik
    editor/                      # generische Snippet-UI, keine ILI-Parser
  webview/                       # dünner Host für @interlis/diagram-ui
  resources/{syntaxes,snippets,themes}/
  test/{unit,extension-host,gui,fixtures}/
  scripts/                       # kleine Node-Runner für Build, Staging, GUI und Review
  release/{editor-artifacts.lock.json,runtimes.lock.json}
  docs/implementation/vscode-extension/  # diese fünf Dateien + knapper Status/Berichte
```

**Warum der neutrale Renderer im Core-Repo liegt:** Dort existieren bereits DiagramDocument, Adapter, gepinnter Renderer und Browserverbraucher. V2 führt diese in **einer** eigenen Quelle `frontend/diagram-ui` zusammen. Extension und bestehender Browserpfad konsumieren dieselbe Implementierung. Das Core-Java darf nicht von VS Code abhängen; das TS-Paket ist ein eigenständiger Buildbaustein und importiert weder VS-Code-API noch Compiler-/WASM-Laufzeit. Eine zusätzliche Rendererquellkopie im Extensionrepo ist verboten.

`@interlis/diagram-ui` ist ein **neues eigenes Paket**, kein Alias für `@ilic/diagram`. Eigenes `DiagramDocument`-DTO als Eingabe, ELK/Sprotty als reguläre Drittbibliotheken, keine `SemanticSnapshot`-Typen aus B. Bestehende reine Layout-/Exportfunktionen kontrolliert kopieren/verschieben und adaptieren; neue Sprotty-Interaktion in dieser Quelle implementieren. Herkunft/Lizenzen erhalten. Alte aktive Vendorpfade nach vollständigem Consumerwechsel entfernen; historische Pins/Reviewberichte nicht umschreiben. Ein aktiver neuer Manifest-/Pinvertrag dokumentiert die neue Eigentümerschaft.

### 2.2 Artefaktgrenze statt Quellcode-Verflechtung

EXT verwendet eine feste **Editor-Artefaktkombination** aus CORE: Java-LSP-Distribution, gemeinsame Protokoll-/Diagrammschemas und eigenes Diagramm-UI-Paket als `.tgz`. Neue Core-Gradle-Aufgabe `editorBundle` darf diese aus vorhandenen `installDist`-/Paketaufgaben zusammenstellen; kein zweites Compilerbuildsystem. Ein separates JAR allein ist nur ausreichend, wenn sämtliche Runtimeabhängigkeiten korrekt gebündelt sind. Mit der tatsächlichen entpackten Distribution testen.

`release/editor-artifacts.lock.json` enthält mindestens Schema-/Protokollversion, Core-Commit, Artefaktnamen, SHA-256 und Versionsinformationen. Das UI-Paket stammt aus **demselben** bezeichneten Core-Stand. Kein `latest`, kein unkontrollierter Siblinglink, keine Behauptung bereits veröffentlichter npm-Pakete. Für lokale Entwicklung erzeugt `npm run stage:core -- --core-dir <CORE_DIR>` das Bundle aus einem ausdrücklich angegebenen Checkout. Für die saubere Abnahme wird exakt der gelockte Commit gebaut oder ein bereits vorhandenes identisches lokales Archiv verifiziert. Der Installationsanwender benötigt diesen Checkout nicht.

Reihenfolge bei Änderungen in beiden Repos: Coreänderung testen/committen → Core-Artefakte erzeugen/hashen → EXT-Lock anpassen → Extensionänderung testen/committen → gemeinsam prüfen. Ein Review referenziert **beide vollständigen SHAs**. Kein schwimmendes `main` des Core neben einem gepinnten Extension-SHA.


### 2.3 Versionen, Abhängigkeiten und Laufzeiten

Java 25 ohne Preview und bestehender Gradlewrapper bleiben. Vorhandene Node-/TypeScript-/ELK-/Sprotty-Toolchains prüfen und kompatible Versionen in V0 pinnen; die Recherche sah u.a. ELK 0.11.0 und Sprotty-Protokoll 1.4.0. Keine ungeprüfte aktuelle Version hineinschreiben. Ein nötiges Dependencyupdate muss begründet und auf seine direkt betroffenen Verbraucher getestet werden.

Erste Entwicklerschleife darf ein explizites Java 25 verwenden; V5 liefert passende **gebündelte Runtime** in zielplattformspezifischen VSIXen. Pflichtziele: macOS arm64, Linux x64, Windows x64. Zusätzliche darwin-x64/linux-arm64 nur nach tatsächlichen Plattformtests als unterstützt ausweisen; keine universelle Behauptung aus Cross-Packaging. Remote nutzt Runtime/Server des Workspacehosts, nicht Java auf dem lokalen Mac. Kein Native-Image-Projekt im Rahmen dieses Auftrags.

### 2.4 Verbindliche Modulgrenzen

| Aufgabe | Besitzer | Darf nicht passieren |
|---|---|---|
| Syntax, Scopes, Typen, Referenzen, Rename-/Quick-Fix-Planung | Java-Compilerqueries | TS-Parser/Regex-Symbolindex |
| Dokumentstände, Wiederverwendung, Dependencyfrische | Workspace + LSP-Session | Client rekonstruiert semantischen Cache |
| Repositoryauflösung/Versionsauswahl/Digests/Offline | Repository + Java-Hostadapter | Extension lädt Imports selbst und errät Semantik |
| LSP-Mapping, Capabilityverhandlung, IO-/Cancellationkoordination | `interlis-lsp` | Fachregeln in Protokollhandlern |
| Diagrammknoten, Rollen, Vererbung, Assoziationssemantik | `interlis-projection` | Sprotty erschliesst Beziehungen aus Labels |
| Layout, Kantenrouten, Filteranzeige, Selektion, SVG/PNG | `frontend/diagram-ui` | Layout verändert Core-Snapshot oder `.ili` |
| Dateidialoge, Serverstart, Themes, Status, native Edit-/Undoausführung | Extension | Shellkommandos aus Workspace-/Webviewtexten |
| Objektkataloginhalt und Typdarstellung | Java-Dokumentprojektion | Client liest ILI/AST für Dokumentation |
| Statische Vorlagen/Grammarfärbung | Extensionressourcen | TextMate als fachlicher Validator |

## 3. Standard-LSP und gezielte Erweiterungen

### 3.1 Standardfunktionen zuerst

Alle bestehenden LanguageQueries über Standard-LSP bereitstellen und wirklich benutzen: incremental didOpen/didChange/didSave/didClose, publishDiagnostics mit Version, completion, hover, definition, references, prepareRename/rename, documentSymbol, formatting, foldingRange, semanticTokens/full, codeAction. Neu benötigtes onTypeFormatting für syntaktisch abgesicherte Blockenden nutzt ebenfalls Standard-LSP. Nicht für jede Taste ein neues Customprotocol.

`LanguageClient` muss vorhandene Fähigkeiten übernehmen; die Extension registriert nicht zusätzlich einen konkurrierenden Definition-/Rename-/Diagnosticprovider. Gespeicherte oder fremde Analyseergebnisse dürfen neue Puffer nicht überschreiben. LSP-Positionsvertrag bleibt UTF-16.

Ein gemeinsamer Modellraum pro VS-Code-Fenster ist die erste Multi-root-Semantik: Workspacefolders bilden gemeinsam den lokalen Modellbestand. Repository-/Compilerkonfiguration ist für diesen Modellraum eindeutig (`window`-scope). Keine stille Auswahl widersprüchlicher Folderkonfiguration. UI-Einstellungen (Layout/Filter) dürfen pro Ansicht gelten. Unterschiedliche gleichnamige Modelle nicht einfach nach URI sortiert auswählen. Multi-root-Hinzufügen/-Entfernen entweder korrekt durch `didChangeWorkspaceFolders` unterstützen und advertisen oder den einen Server mit kontrolliertem Re-Sync neu starten; keine ignorierte Meldung als Unterstützung ausgeben.

### 3.2 Capability- und Datenvertrag

Neue Wireverträge versionieren, z.B. `experimental.interlis = { protocolVersion: 1, diagramSchemaVersion: "1.0", compile: true, diagram: true, sourceContent: true, navigation: true, documentation: ... , semanticEditing: false }`. Pro Phase nur implementierte Fähigkeiten auf true setzen. Vor dem ersten diagram request Versionen prüfen; inkompatible Kombination → verständlicher Status, keine ClassCast-/JSONfehler und kein stilles Altbackend.

Vorgeschlagene Java-Transportschnittstelle `InterlisLanguageServerApi extends LanguageServer` besitzt die nachfolgenden `@JsonRequest`-Methoden. `InterlisLanguageServer` implementiert sie, der tatsächliche LSP4J-Launcher exportiert sie. Vorhandene Command-IDs `interlis.compile`/`interlis.diagram` dürfen als schlanke Delegation für bestehende Coretests erhalten bleiben, solange das keine ili2c-Bedienemulation ist. Neue Extension benutzt **einen** kanonischen Vertrag, nicht zwei gleichzeitig. Jede neue Methode benötigt einen echten stdio-Prozesstest; direkter Methodenaufruf beweist die Wire-Registrierung nicht.

| Wiremethode / vorgeschlagene Java-Methode | Anfrage und Ergebnis | Regeln |
|---|---|---|
| `interlis/compile` / `compileModel(CompileModelParams)` | `textDocument {uri,version}`, Rootauswahl, optional workDoneToken → typisierter CompileReport | Aktueller Puffer, explizite Roots; `compile workspace` ist eigener bewusster Modus. Nie implizit alle Repoquellen als Roots. |
| `interlis/diagram` / `diagram(DiagramRequest)` | `textDocument`, optional erwarteter snapshotId, vollständige DiagramOptions → DiagramResponse | Typisiertes JSON-Objekt, kein doppelt serialisierter JSON-String; Optionen zum Core delegieren. |
| `interlis/source` / `sourceContent(SourceContentParams)` | vom Server ausgegebener Sourcehandle + erwartete Revision → Text, origin, readonly, digest | Keine beliebige URL als Downloadauftrag; derselbe Inhalt, für den Range berechnet wurde. |
| `interlis/navigation` / `navigate(DiagramNavigationParams)` | `elementToSource` oder `positionToElements` mit revisionsgebundenem Auswahlkontext | Java liefert Range/Symbolzuordnung; keine Namens-/Offsetsuche in TS. |
| `interlis/export` / `exportArtifact(ExportArtifactParams)` | Format, Root/Snapshot, Dokumentoptionen → begrenztes Text-/Binärartefakt | Java erzeugt fachliche Texte/Dokumente; SVG/PNG des aktuellen Layouts erzeugt UI. |

Benachrichtigung `interlis/analysisReady`: angenommenes `serverInstanceId`, Workspacegeneration, betroffene Dokument-URIs mit **LSP-Dokumentversionen** und SnapshotId. Keine komplette AST-Kopie; dient dem gezielten Diagrammrefresh. Der Client reagiert nur auf neue passende Sessiongenerationen. Fortschritt/Abbruch bevorzugt Standard-LSP (`$/progress`, `$/cancelRequest`).

`DiagramResponse` enthält mindestens `schemaVersion`, `serverInstanceId`, `snapshotId`, `workspaceRevision`, dokumentierte `clientDocumentVersions`, `sourceRevisions`, `completeness`, `notices` und das unveränderte `DiagramDocument`. Wo SourceRevision/WorkspaceRevision als 64-bit Zahl vorliegen, auf der Wireebene verlustfrei als String übertragen. **LSP-DocumentVersion ist nicht Core-SourceRevision.** SnapshotIDs niemals lexikografisch als Zeitstempel vergleichen.

Wenn bereits ein gleichwertiger neuer Vertrag vorhanden ist, ihn konsistent übernehmen statt dieselbe Funktion doppelt zu implementieren. Neue Felder und Methodennamen sind **Sollentwurf**, keine Behauptung bestehender Klassen.

### 3.3 Frische, Abbruch und geschützte Quellen

Ein Resultat gehört zu Serverinstanz, Workspacegeneration, Rootauswahl, Konfiguration und Sourceversionen. Eine reine Dokumentversion reicht bei geänderter Importdatei nicht. Alte LSP-/Layout-/Exportantworten nach Edit, Konfigurationswechsel, Close oder Restart verwerfen. Ein alter Graph darf sichtbar bleiben, muss aber `STALE` tragen; seine Navigation/Exporte nicht als aktuell ausgeben.

Readonly-Repositorymodelle bleiben readonly, auch wenn VS Code deren virtuelle Datei öffnet und `didOpen` sendet. Der Server behält Herkunft/Editierbarkeit unabhängig davon in einer Quellenregistrierung. Keine Regel `open document == editable`. Definitionen auf externe Modelle über ein readonly URI-Schema wie `interlis-source:` und einen VS-Code-`TextDocumentContentProvider` anzeigen; LSP-/Original-SourceId-Mapping ist explizit und versioniert. Kein provisorisches Schreiben in Nutzerworkspace.

Rename/QuickFix liefern nur vollständige versionierte Edits. Offene Dateien erhalten die aktuelle LSP-Version; geschlossene Dateien werden vor der Antwort wie bisher gegen Inhalt/Identität geprüft. Fehlende/readonly/unklare Ziele → kein Teilrename. Standard-LSP kann nach Rückgabe keine absolute Dateisystemtransaktion über beliebig extern veränderte geschlossene Dateien garantieren; keine stärkere Garantie behaupten. Bekannte Versions-/Hashkonflikte fail-closed behandeln und keine versteckte eigene Dateischreiblogik im Client.

## 4. Java-Arbeiten auf Klassen-/Methodenebene

Die folgenden Verantwortungszuschnitte sind verbindlich; vorhandene gleichwertige Helfer dürfen mit dokumentiertem Mapping weitergenutzt werden. Keine mechanische Anlage leerer Klassen. Produktions- und Testnamen sind fachlich, nicht V0/V1/P3 benannt. Bestehende historische Klassen nicht nebenbei global umbenennen. Methodensignaturen beschreiben den Sollvertrag; Namen wie `RootSelection` oder `ExpectedWorkspaceRevision` sind dabei nicht die Aufforderung, interne Compilerklassen öffentlich zu machen. Für öffentliche Grenzen vorhandene `List<ModelSelector>`-/WorkspaceRevision-/Captureverträge nutzen oder kleine transportneutrale Werte ergänzen. Keine Imports aus `compiler.internal` durch neue Host-/UI-Module.

### 4.1 Server-/Workspaceintegration

**`InterlisLanguageServer` (bestehend)**
- `initialize(InitializeParams)`: Clientcapabilities, Locale und Schemaunterstützung aufnehmen; implementierte Standard-/Customfähigkeiten ausweisen; vorhandene Start-/Shutdownregeln erhalten.
- `connect(LanguageClient)`: Diagnose-, Log-, Progress- und AnalysisReady-Sinks anbinden; keine ANSItexte.
- Customrequestmethoden an kleine Fachadapter delegieren, nicht weiter den gesamten Dienst vergrössern.
- `shutdown()`/`exit()`: alle Sessions, Repositoryfetches, IO-/Analysequeues beenden; stdout nicht mit Logs beschädigen.

**`LspConfiguration` (bestehend, erweitern)**
- `read(settings, previous)` weiterhin streng; ergänzen: diagnosticLanguage (`auto|de|en`), Repositorylisten/Offline-/Cache-/Pinprofile und sichere Herkunfts-/Ressourcenoptionen.
- UI-Felder wie Farbe, Zoom, Toolbarposition oder NodePlacement werden nicht an `WorkspaceConfiguration` weitergereicht.
- Ungültige Änderung atomar verwerfen, bisherige Konfiguration behalten, genau eine verständliche Meldung. Relevante erfolgreiche Änderung invalidiert zustandsabhängige Analyse, nicht alle UIzustände.

**`LspDiagnosticMapper` (neu, kleiner Adapter)**
- `toLsp(Diagnostic, SourceText, DiagnosticLanguage, SourceUriMapper)` bildet Code, Severity, echte Range, RelatedInformation, sichere Nachricht und ggf. Tags ab.
- `partition(AnalysisSnapshot, PublicationScope)` trennt Dateidiagnosen von globalen Meldungen; keine globale Reduktion von `AnalysisSnapshot.diagnostics()` auf CLI-Roots.
- `publishCurrent(...)` nutzt Versionen; keine Problems an falschen alten SourceRevisionen. Bei geschlossenem relevanten Import entweder dessen echte readonly URI veröffentlichen oder den Importbefund mit relatedInformation an der tatsächlichen IMPORTS-Stelle ergänzen. Keine erfundene Zeile 0 als tatsächliche Quellposition.
- Den vorhandenen `DiagnosticMessageFormatter` wiederverwenden. Neue Hinttexte nur aus belegten Daten, kein fachlicher Rat aus Namensheuristiken.

**`RepositoryHostCoordinator` (neu innerhalb LSP-Host)**
- `resolve(WorkspaceCapture, RootSelection, RepositorySettings, CancellationToken)`: bestehenden `RepositoryClosureService`/Resolver/ContentStore benutzen; Disk-/HTTP-Arbeit auf begrenzter IO-Queue, nicht im Dokumentnotifikationspfad.
- `applyIfCurrent(PreparedRepositoryUpdate, ExpectedWorkspaceRevision)`: wie vorhandene atomare Workspaceupdates; veraltete Fetchantwort verwerfen, nie Dirtytext überschreiben.
- `reconfigure(settings)`/`cancelPending()`/`close()`: saubere Lebensdauer. Identische laufende Abhängigkeitensuche zusammenführen; keine ausufernde Retryschleife.
- Repositoryauthdaten nicht in LSPausgaben, URIanzeigen oder Logs; TLS nicht abschalten. Offlinefall ohne Netzwerk. Lokaler HTTP-Fixture-Server für Tests, kein echter öffentlicher Repositoryserver als deterministisches Testorakel.

**`SourceUriMapper` + `ExternalSourceRegistry` (klein, neu bzw. vorhandene Identitätslogik erweitern)**
- `toClientUri(SourceId, SourceRevision)`/`toSourceId(DocumentUri)` besitzen eine bijektive sessionbezogene Zuordnung; Dateipfade, logische URIs, Hardlinks und symlinks nicht per Stringtrick normalisieren.
- `registerResolvedSource(source, origin, digest, editable=false)` hält Quelle unveränderlich; `read(handle, expectedRevision)` liefert genau diesen Inhalt.
- `editable(source)` ist herkunftsgebunden, nicht davon abhängig, ob die Datei geöffnet ist. Tombstones/restart löschen veraltete Handles; limitierter Speicher.

**`InterlisTextDocumentService` und `InterlisWorkspaceService` (bestehend)**
- `publish`/`message` durch Mapper ersetzen; nicht wieder CLI-Ausgabe parsen.
- `documentSymbolNow` echte Containerkinder aufbauen; SourceRange/selectionRange korrekt unterscheiden.
- `hoverNow`: gemeinsame Dokumentation und qualifizierte Segmente nutzen, sichere Standard-Markdownlinks.
- `compileWorkspace` und neues rootspezifisches `compileModel`: vorhandenes Gate und aktuelle Puffer verwenden, Summary/Diagnosen passend zum Auftrag. Workspace-/IDEgesamtsicht nicht mit CLI-Auftrag verwechseln.
- `initializeProject`/Watcher/Multi-root: bestehende Pfadidentität erhalten, neu konfigurierte Workspacefolder kontrolliert übernehmen. Keine doppelte Dateiwatcher-Nachladung über Client und Server.

### 4.2 Diagrammdienst

**`LspDiagramService` (neu, aus bestehendem Diagrammpfad extrahieren)**
- `request(DiagramRequest, CancellationToken): CompletableFuture<DiagramResponse>` wartet auf aktuelle akzeptierte Analyse, validiert Optionen/Scope/Root, delegiert `DiagramProjectors.create().project(...)`.
- `selectSymbols(snapshot, requestedSelection)` nutzt existente IDs/Queries, keine Typ-/Namensauflösung duplizieren.
- `resolveNavigation(...)` und `elementsAtPosition(...)` verwenden SymbolRef/SourceAnchor plus aktuellen Revisionenkontext; stale liefert `ContentModified` oder explizit `STALE`, keinen falschen Sprung.
- `onAnalysisAccepted(...)` signalisiert Bedarf zur Aktualisierung, ohne jedes Mal ein Diagramm ohne abonnierte Ansicht zu berechnen.
- Parse-/Analysefehler können eine ehrlich partielle Projektion liefern; ein letztes gültiges Diagramm wird nicht als aktuelle Vollständigkeit ausgegeben.

**`DiagramOptionsDecoder` (neu oder vorhandenen Bridge-Decoder wiederverwenden)**
- `decode(dto, snapshot)` für visibleKinds, scope, inheritedMembers, showTypes, showConstraints, imports, labelPolicy/translationModel, neighbourhoodDepth, associationPresentation und Budget.
- Exakte enums/Versionen, keine still ignorierten Felder. Layoutoptionen gehören nicht hinein.

**`DiagramDocument` / Projektor (bestehend)**
- Unveränderlichen Vertrag erhalten. Fehlen stabile UIkeys, tatsächliche Sourceanchors oder referenzierbare Endinformationen, minimale additive Felder mit Schemaversion/Tests ergänzen.
- Ein n-ärer Associationknoten besitzt seine Attribute und jede Rolle; keine verlustbehaftete Binärvereinfachung. Diamondmarker hängen von der semantischen Aggregation des jeweiligen Endes ab, nicht von der grafischen Richtung.
- Fachliche Sichtauswahl (`NEIGHBOURHOOD`, importierte Modelle, Übersetzungslabels) im Projektor; clientseitiges Aus-/Einblenden vorhandener Elemente bleibt erlaubt.

### 4.3 Editorhilfen – V4, ohne zweite Sprache

**Bestehendes `LanguageQueries`/`CompletionQueries` erweitern, falls nötig.**
- Completion für die im Audit F11–F16 genannten Slots, bekannte Metaattribute, Header/Modifier und exakte Namenssegment-Ersetzung. Reale Syntax-/Recoveryknoten verwenden. Unvollständige Kommentare/Strings nicht als Deklarationen behandeln.
- Transportneutrale zusätzliche Resultate wie `EditorEditPlan`, `CompletionTemplate` oder `AutoClosePlan` sind erlaubt; `CompletionItem` bleibt im LSPadapter.

**`EditorAssistanceService` (neue reine Corefunktion, wenn keine entsprechende existiert)**
- `planBlockClose(AnalysisSnapshot, SourceRange cursor, EditorIndentOptions, CancellationToken): QueryResult<EditorEditPlan>`: nur nach echtem Enter und syntaktisch erkanntem vollständigem Kopf; MODEL-Punkt/sonst Semikolon, bereits bestehendes END nicht duplizieren.
- `quickFixes(snapshot, range, diagnosticIds, token): List<EditorEditPlan>`: mindestens END-Name, fehlendes Semikolon und **beweisbar** unbenutzter Import. Inkomplette Referenzabdeckung ist keine Erlaubnis, einen Import zu löschen.
- `completionTemplates(snapshot, query, token)` liefert IDs/Text/Placeholderdaten für den richtigen Slot; keine Editor-API im Core. Beliebige heute ungültige Vorlagen aus A/B nicht ungeprüft übernehmen.

LSP `onTypeFormatting`/`codeAction`/Completion konvertieren die Pläne in normale TextEdits/WorkspaceEdits/Snippets, mit aktuellem Versionsbezug. Standard-onTypeFormatting besitzt keinen ausdrücklichen Cursor-/Snippetselektionsvertrag: die tatsächliche Cursorposition nach Auto-Close ist deshalb durch GUI-30 zu prüfen, nicht anzunehmen. Falls die verlangte VIEW-TOPIC-/Bodycursorführung mit normalen TextEdits nachweislich nicht erreichbar ist, ist genau eine kleine capabilityverhandelte Erweiterung `interlis/editorAssist` zulässig. Sie liefert denselben Java-EditorEditPlan mit erwarteter Dokumentversion, optionalem Snippet und Caret-Ziel; der Client übernimmt nur die generische native Snippetanwendung. Pro Client/Geste **entweder** dieser Pfad **oder** onTypeFormatting, nie doppelte Einfügung und nie TS-Syntaxentscheidung. Gleiches Ergebnis und Ablehnung veralteter Versionen im realen Prozess und GUI prüfen. Nur fachlich abgesicherte kleine Operationen, keine generische Refactoringplattform. Tests müssen zeigen, dass eingefügte Vorlagen unter der jeweiligen INTERLIS-Version gültig sind.

### 4.4 Dokumentationsprojektion – V4

Neues tatsächlich implementiertes Modul `interlis-documentation`, abhängig von neutralem Modell/Compiler-API, nicht von LSP/VS Code. Der Compiler hängt nicht davon ab. Word-/HTMLformatierung darf den portablen Sprachkern nicht mit JVM-spezifischen Bibliotheken belasten.

- `DocumentationOptions`: Rootauswahl, DE/FR/IT/EN-Labels, `SEPARATE|INLINE|INLINE_ABSTRACT_ONLY`, Headeroverrides, Ressourcenlimit. Identifikatoren und Modelldokumentation niemals automatisch übersetzen.
- `DocumentationProjector.project(CompiledSchema, DocumentationOptions, CancellationToken): DocumentationDocument`: immutable Abschnitte, Klassen, Attribute, Rollen, Domains, exakte Typ-/Kardinalitätslabels, Herkunft, Constraints und Dokumentationskommentare. Zyklische Strukturen als referenzierte Abschnitte statt unendlicher Inlineexpansion.
- `MarkdownDocumentationRenderer.render(document): String` und `HtmlDocumentationRenderer.render(document): String`: Tabellen, Links und Texte zielgerecht escapen, XSS-/Zeilen-/Trennzeichenfälle; kein raw Modelltext als HTML.
- `DocxDocumentationRenderer.render(document): byte[]`: funktionierendes OOXML mit Tabellen/Styles/Beziehungen. Geeignete gepinnte Bibliothek oder sauber geprüfte übernommene OOXML-Routinen, kein provisorischer Text-ZIP. Verfügbarkeit/Grösse/Schriftreferenzen ohne ausgelieferte Fremdfontdateien berücksichtigen.
- `GraphMlRenderer.render(DiagramDocument): String`: gültiges XML, stabile IDs/Referenzen, Knoten/Rollen/Container/Attribute aus dem vorhandenen Diagramm, kein zweiter Semantikvisitor über AST. Geometrieexport nur falls explizit mit Layout übergeben; nicht still andere Anordnung behaupten.
- `LspExportService.export(request, token)`: vorhandene Mermaid-/PlantUMLrenderer weiterverwenden; Root-/Snapshot-/Budgetprüfung; Ergebnis typisiert `{mediaType,encoding,content,fileNameSuggestion,sourceSnapshot}`. Grössenlimit kontrolliert; kein unbeschränktes Base64-/Bytearray über JSON-RPC.

Markdown/HTML/DOCX standardmässig aus vollständigem aktuellen `CompiledSchema`. Bei fehlerhaftem Modell verständlich ablehnen; eine partielle Vorschau nur mit ausdrücklichem Teilstatus, niemals als vollständiger Objektkatalog. UI-SVG/PNG aus der aktuellen Ansicht dagegen im Diagrammrenderer.

## 5. Extension-/UI-Arbeiten auf Klassen-/Methodenebene

### 5.1 Dünner VS-Code-Host

**`ExtensionController` / `extension.ts`**
- `activate(context)` registriert Sprache/Commands/Readonlyprovider und startet genau den zum Fenster gehörenden Client, wenn Workspace vertrauenswürdig ist.
- `dispose()` beendet Client, Status, Watcher, Panels und ausstehende Requests. Keine globalen Singletonzustände zwischen Testfenstern.
- Einfache Registrierungen dürfen Funktionen bleiben; kein DI-/Pluginframework allein für die Extension.

**`ServerController`**
- `resolveLaunchPlan(settings, platform, artifactManifest): LaunchPlan` prüft Runtime-/Bundlehash und Architektur, Java25, echte Dateien und unterstütztes Protokoll.
- `start(context): Promise<LanguageClient>` startet `guru.interlis.lsp.Main`/Distribution mit Argumentarray und `shell:false`, getrennten Protokoll-/Logstreams. Keine `.ili`-Pfade als Shellbefehl. Serverbundle und gebündelte Runtime sind Default; expliziter Developeroverride wird im Status offengelegt.
- `restart(reason)` ist begrenzt, verwirft Sessions/Anker, synchronisiert offene Puffer über normalen LanguageClient erneut; kein Neustartloop und kein Verlust ungespeicherter Änderungen.
- `stop()` wartet auf Shutdown/Exit und räumt nur eigene Kindprozesse auf. Nicht alle Java-/VSCodeprozesse des Nutzers beenden.

**`ConfigurationBridge`**
- `readHostSettings(scope)` trennt Laufzeit-/Sicherheitsoptionen von Sprach-/Repositoryeinstellungen und von Diagrammstyles.
- `toInitializationOptions(settings)`/`sendConfigurationChange(settings)` liefern nur erlaubte Felder; keine ganze `interlisGuru`-Config an den strikten Java-Decoder.
- `requiresRestart(before, after)` unterscheidet Prozesswechsel von Repository-Reanalyse und reinem UI-Redraw.
- `onWorkspaceTrustChanged()` startet/stoppt gefährdungsrelevante Funktionen; untrusted: Syntaxfärbung/statistische Vorlagen erlaubt, keine beliebigen JAR-/javaPath-/URL-Aufrufe.

**`InterlisProtocolClient`**
- `capabilities()`/`ensureCompatible()` verifizieren Versionen nach Initialize.
- `compile(params, token)`, `diagram(params, token)`, `source(params, token)`, `navigate(params, token)`, `exportArtifact(params, token)` sind dünne typisierte Requests; Fehler werden als Fehler propagiert, nicht als leere erfolgreiche Graphen.
- `onAnalysisReady(listener)` bindet einen Subscriber pro Bedarf; kein periodischer Vollcompile.

**`ReadonlySourceProvider`**
- `provideTextDocumentContent(uri, token)` ruft nur den vom Server autorisierten Sourcehandle ab; Inhalt und Range stammen aus derselben Revision.
- `invalidateSession(serverInstanceId)` beendet alte Handles; unbekannte URIs nicht auf Dateisystem oder HTTP umdeuten.
- Eigene Source-URI ist readonly; kein `FileSystemProvider` mit Schreibmethoden als scheinbare Abkürzung.

**`CompilerCommandController` / `TemplateCommandController` / `DocumentationCommandController`**
- `compileActiveModel()` verwendet aktiven Textbuffer und gezielt gewähltes Modell bei mehreren MODEL-Deklarationen, aktuelle Version, Progress/Cancellation, passende Summary im Output.
- `compileWorkspace()` ist separat benannt, kein versteckter Standard.
- `createFromTemplate()` öffnet neutrale eingebettete Vorlage als ungespeichertes Dokument; optionale HTTPS-Vorlage bewusst konfigurieren, Maximalgrösse/Timeout/Trust/Contentfehler beachten. Keine Tokenexpansion als JS.
- `previewDocumentation(format)`/`saveDocumentation(format)` fragen den Server, zeigen Herkunft/aktuellen Snapshot, nutzen sichere lokale Preview und VS-Code-Dateidialog. Exportabbruch schreibt keine leere Zieldatei; Fehler hinterlassen keinen Erfolgstoast.
- Für SVG/PNG an `DiagramPanelController.exportCurrentView` delegieren, nicht über erneuten Compile-/Defaultlayoutpfad.

**`SnippetInteractionController`**
- `registerKeybindings()`/`onAcceptedTemplate(templateId, documentVersion)`/`nextPlaceholder()`/`leaveSnippetAndMove(command)` kapseln ausschliesslich VS-Code-Snippetbedienung.
- Statische Vorlagentexte dürfen in Ressourcen liegen; semantische Slotentscheidung kommt über Completion. Keine `CLASS|TOPIC`-Regex als zweiter Strukturparser.
- Enter akzeptiert zuerst sichtbare Suggestion, danach einen aktiven nichtfinalen Placeholder; im Body wieder normaler Zeilenumbruch. Nur `editorLangId == interlis` und passende Snippetkontexte, nicht globale Tastenbelegung.

### 5.2 Ein echter Diagramm-Custom-Editor

**`DiagramEditorProvider implements vscode.CustomTextEditorProvider`**
- `resolveCustomTextEditor(document, panel, token)` verbindet exakt dieses TextDocument mit einer `DiagramPanelController`-Instanz; `.ili`-Customeditor hat `priority: option`, ersetzt nicht ungefragt Textansicht.
- Quelltext bleibt Source of Truth; die Implementierung verwendet den Customeditor für Navigation/Lifecycle, **nicht** zum Schreiben beim Drag.
- Registrierter Command „Show Diagram for This File“ öffnet daneben; `autoOpenBeside` explizit konfigurierbar, Default false. Kein Output-/Diagramm-Fokusdiebstahl.

**`DiagramPanelController`**
- `initialize()` installiert CSP, lokale Ressourcen und einen Handshake. Keine grossen Rawquellen über HTMLtemplate.
- `requestRefresh(reason, expectedVersion)` fragt den Java-Diagrammdienst mit Root/Options an; monotoner eigener Requestzähler plus Server-/Versionsvektor.
- `acceptResponse(response, requestId)` verwirft obsolete/inkompatible Antwort; keine alten SnapshotIDs mit neuen UIaktionen verbinden.
- `applyViewSettings(settings)` ändert Sicht/Layout lokal; wenn benötigte semantische Daten fehlen, gezielte Projektoranfrage statt JS-Neuberechnung fachlicher Beziehungen.
- `handleMessage(message)` validiert diskriminierte Typen, Panelnonce, Grösse, IDs und Requestbezug. Nur erlaubte Aktionen; kein beliebiger `executeCommand`, Pfad, Shell oder URL aus Webview.
- `revealSource(elementId)` und `selectFromEditor(position)` über Java-Navigation; exakte aktuelle Range, readonly Quellen unterstützt.
- `exportCurrentView(scope, format)` konserviert tatsächlich sichtbare Filter, Routen, Viewport und Snapshot; sicherer Dateidialog/Cancel.
- `dispose()` entfernt Listener und pending Layouts, löscht nicht alle anderen Panels. Eine Antwort nach Close darf kein Panel wieder öffnen.

**`DiagramSession` (reiner UI-Zustand)**
- `status: EMPTY | LOADING | FRESH | PARTIAL | STALE | ERROR` sowie ausdrücklicher Grund.
- `accept(document, freshness)` hält neutralen Coregraph unverändert und getrennt vom Viewmodel.
- `invalidate(reason)` markiert alten Graph stale; `close()` gibt Speicher frei.
- Mehrere Panels derselben Quelle haben eigene Filter/Layout/Viewport; Serveranalyse darf geteilt werden.

### 5.3 Eigener neutraler Diagrammbaustein `@interlis/diagram-ui`

Die folgenden Dateien liegen ausschliesslich in `CORE_DIR/frontend/diagram-ui`. Sie dürfen keine `vscode`-, `@ilic/*`-, WASM-Compiler- oder Language-Service-Imports enthalten. Ein kleiner typsicherer Adapter am Host liefert callbacks.

**`DiagramDocumentValidator`**
- `validate(raw): DiagramDocument` kontrolliert Schema, Snapshot-/Sourcebezug, eindeutige IDs, existierende Parent-/Endknoten, Zyklen, finite Zahlen und Budgets.
- Keine still entfernten unbekannten Kanten oder „Reparatur“ falscher Fachwerte. Unbekanntes Schema → expliziter inkompatibler Zustand.

**`DiagramViewModelBuilder`**
- `build(document, viewState): SModelRoot` bildet neutrale Container/Nodes/Compartments/Members/Edges auf Sprotty-Modelle ab.
- `diff(previous, next): ViewPatch` erhält identifizierbare bestehende UIelemente; kein vollständiger DOM-Neubau bei jeder Selektionsänderung.
- N-äre Associationen, mehrere gleiche einfache Namen, geerbte Darstellungen und externe Stubs sind getrennte Identitäten. Keine in Labels versteckte Lookupsemantik.

**`InterlisNode` / `InterlisNodeView` / `InterlisContainerView` / `InterlisEdgeView`**
- Node-/Containermodelle aktivieren nur benötigte Sprottyfeatures: Selektion, Bewegung, Hover; keine semantischen Delete-/Edit-/Reconnectfeatures.
- `render(model, context): VNode` zeichnet Namen/Stereotype/Members/Constraints/Enumwerte, Model-/Topicrahmen und richtige UMLmarker.
- `renderEnds(edge)` zeichnet an **beiden** Enden Rollenname/Kardinalität/Aggregation aus den DTO-Feldern. Quell-/Zielseite nach Spiegelung/Dragging nicht vertauschen.
- Textmessung und Layoutgrössen stammen aus denselben Fonts/Zeilenumbruchregeln wie die tatsächliche Ansicht. Keine abgeschnittenen langen Namen. Keine mitgeteilten Fontdateien einbetten, deren Weitergabe nicht geklärt ist.

**`ElkLayoutService`**
- `layout(document, constraints, settings, signal): Promise<LayoutResult>` arbeitet im Webworker, nicht im Extension-Host oder GUI-Thread.
- `resetLayout(...)` erzeugt ausdrückliches frisches Layout; `settleLayout(...)` benutzt bisherige Positionen/Pinconstraints und verbessert nur Layout, ohne manuelle Routen blind zu löschen.
- `cancel(requestId)` verhindert spätere Übernahme; ein nicht unterbrechbarer Worker darf kontrolliert ersetzt werden. Worker/Queue begrenzen.
- ORTHOGONAL, POLYLINE, SPLINES; ELK-NodePlacement-Optionen aus B übernehmen soweit echte aktuelle API unterstützt. SPLINES mit wirklichen Bézierkurven, nicht bloss Segmenten unter anderem Namen.

**`LayoutState` / `LayoutStateReconciler`**
- getrennt vom DiagramDocument: Knotentransformationen, manuelle Routen, Pinstatus, Filter, Viewport, Auswahl und begrenzte Undo-Historie.
- `reconcile(previousView, nextDocument)` übernimmt Zustände nur bei eindeutig fortbestehender Identität; entfernt verwaiste Einträge; neue Knoten begrenzt anordnen.
- Snapshotgebundene SymbolRefs nicht als über Sitzungen garantierte IDs behandeln. Einen tatsächlich stabilen Core-/Presentationkey verwenden oder explizit den Zustand verwerfen. Keine fuzzy Zuordnung anhand ähnlicher Namen/Offsets. Nach Rename darf Layout teilweise neu entstehen; niemals eine fremde Klasse an die alte Position binden.

**`MoveElementsCommand` / `SetRouteCommand` / `ViewCommandStack`**
- `execute()`/`undo()`/`redo()` ändern nur LayoutState. Eine Dragbewegung ergibt einen Historyeintrag, nicht Hunderte pro mousemove.
- Routehandling über echte Sprotty-Routinghandles; Polylineknoten hinzufügen/verschieben/entfernen, orthogonale Segmente geeignet verschieben; Splinecontrols korrekt.
- `sourceId`/`targetId`, fachliche Rollen/Kardinalitäten/Labeltexte bleiben unverändert. Reconnect-/Create-/Delete-/Texteditaktionen werden nicht installiert oder ausdrücklich abgewiesen.
- Containerbewegung transformiert Kinder genau einmal; Self-Loops, parallele Kanten und Aussenkanten bleiben verbunden. Drag darf nicht gleichzeitig Navigation auslösen.

**`DiagramFilterController`**
- `setFilter(path, value)`, `setAll(value)`, `reset()`, `visibleGraph(document)`; Filterbaum mit indeterminate-Zustand.
- Klassen/Strukturen/Views/Associationen/Domains, Member-/Constraint-/Typ-/Kardinalitätscompartments, Kanten, importierte direkte/indirekte Elemente, Modell-/Topicrahmen.
- Ausgeblendete Elemente behalten ihre Layoutdaten; keine semantische Mutation. Isolierte externe Stubs nach letzter sichtbarer Verbindung ausblenden. Reiner „None“-Zustand zeigt „Durch Filter ausgeblendet“ mit erreichbarer Filteraktion.

**`ViewportController` / `DiagramSelectionController`**
- `zoomAt(point, factor)`, `pan(delta)`, `fit(scope)`, `restore(state)`; Scrollbalken und Pfeiltasten; Zoom-/Boundarylimits und HiDPI berücksichtigen.
- `selectElements(ids, origin)`/`onSourceSelection` verhindern Rückkopplungsschleifen; Auswahl nach gleicher Quelle/Version validieren.
- Default: Datei angeheftet. Follow-editor ist ein ausdrücklicher Schalter; Wechsel auf readonly Importdatei oder Nicht-ILI aktiviert keinen überraschenden anderen Diagrammroot.

**`DiagramExportService`**
- `exportSvg(renderedView, scope): ExportArtifact` serialisiert reale Knoten-/Kanten-/Routen-/Labelgeometrie samt Filter und Styles. `FULL` meint komplette **aktuell gefilterte** Ansicht; `VISIBLE` zusätzlich Viewportclip. Ein zusätzlicher „ungefiltert“ Export ist ausdrücklich benannt, nicht still der Default.
- `exportPng(renderedView, scope, scale): Promise<ExportArtifact>` rasterisiert dieselbe sichere SVG/Canvasansicht, Pixel-/Speicherlimits; PNG-Signatur/Abmessungen testen.
- Sprechende/stabile SVGgruppen-/Marker-IDs ohne Kollision, korrekte viewBox und Namespaces; Inkscape-Modus mit tatsächlichen Connectionreferenzen, soweit aus bestehender Arbeit übernommen. SVGs ohne HTML-`foreignObject`-Abhängigkeit für normale Texte anstreben.
- GAPS/PLAIN bei Kreuzungen sind reine Darstellung. Exportpositionen/Manuellrouten stimmen mit Bildschirm überein. Keine erneute ELK-Ausführung nur für Export.
- Keine externen Bild-/Font-/Scriptreferenzen, keine DTD, kein `javascript:`. Eingabetexte bleiben escaped. Quellen fehlen/stale → explizite Bestätigung/Markierung oder Abbruch; kein still „frisch“.

**`ViewStateStore` (Hostadapter, nicht Semantik)**
- `load(key)`, `save(key,state)`, `remove(key)`, `migrate(versionedState)`; Primärablage VS-Code-workspaceState/globalStorage, bei portablem Host injizierter Store.
- Schlüssel beinhaltet Workspaceidentität + Rootquelle/Modell + Schemaversion. Gespeicherte Zustände validieren, Grösse begrenzen, keine Quelltexte/Secrets. `.ili` nie als Layoutcontainer verwenden. Optionale versionierte Sidecar-Datei ist spätere Erweiterung, kein Muss.

### 5.4 Zukunft für bidirektionales Modellieren offenhalten

Vier Ebenen strikt getrennt: **fachlicher Snapshot → DiagramDocument → LayoutState → gerenderte Ansicht**. Transport und UIcallbacks sind getrennt von konkreter Sprottybibliothek. Eine spätere Modellaktion würde als typisierter Intent einen Java-`SemanticEditPlanner` anfragen und erst nach dessen versioniertem WorkspaceEdit den Text ändern. Dies ist hier **nur Architekturregel**: keinen leeren `SemanticEditPlanner`, keine offenen Schreibendpoints, kein Fake-Button „Create Class“ anlegen.

Navigation Source↔Diagramm ist bereits beauftragt und ist nicht mit bidirektionaler semantischer Bearbeitung zu verwechseln. Layout-Undo gehört nicht in den Quelltext-Undo-Stack. Zukünftige fachliche Edits erhalten einen eigenen Berechtigungs-/Validierungs-/Undo-Vertrag.

## 6. Darstellung, Sicherheit und Betriebsverhalten

- **Webview:** lokale Assets über `asWebviewUri`, kleine `localResourceRoots`, restriktive CSP, Nonce für erlaubte Scripts, kein `unsafe-eval` ohne konkret begründeten unvermeidbaren Laufzeitbedarf. Keine CDNzugriffe, keine WebSocketports. Sprotty/ELK und optional übernommenes libavoid-WASM lokal paketieren; nur wirklich benötigte Runtime.
- **Nachrichten:** diskriminierte Envelopes `{protocolVersion,panelId,requestId,type,payload}`; nur Whitelisttypen. Unknown/stale/überdimensioniert → kontrollierte Ablehnung. Kein `JSON.parse` und anschliessend beliebige Commandausführung.
- **Export/Speichern:** Nutzerdateidialog, bewusstes Überschreiben und echtes Cancel; atomar soweit Hostfilesystem unterstützt. Fehler bei Write/Flush sind kein Erfolg. Keine automatischen Writes in Repositorycache oder ausserhalb gewählter Ziele.
- **Workspace Trust:** konservativ keine Java-/Template-/Netzwerkaktivierung im untrusted Projekt; reine Grammarfärbung weiterhin. Externe Runtime-/JARpfade nur aus vertrauenswürdiger Konfiguration. Benötigte Berechtigungen sauber erklären, nicht globale Sicherheit abschalten.
- **Remote:** `extensionKind: ["workspace"]`; Server läuft im Workspacehost. URI-/Sourceprovider und `workspace.fs` verwenden, wo die VS-Code-Seite Zugriff braucht. Webviewressourcen nicht durch lokale `file://`-Links ersetzen.
- **UIzustände:** EMPTY, LOADING, FRESH, PARTIAL, STALE, ERROR klar unterscheidbar. Kein Erfolg bei fehlender semantischer Projektion. Abstrakte/externe Typen visuell und textlich, nicht nur farblich kennzeichnen.
- **Performance:** Layout im Worker, Debounce/zusammengeführte Refreshes, bounded pending requests, cancellation und obsolete-result-drop. Vorschlagsziele für V0-Kalibrierung: normale Fixture 40 Knoten/70 Kanten, grosse Fixture 500/1000; UI bleibt während Layout bedienbar. Konkrete Ressourcen-/Timeoutbudgets in V0 festlegen und danach nicht zum Grünwerden erhöhen. Keine erfundenen Ist-Laufzeiten.
- **Sprachen:** IDEdiagnostik DE/EN (`auto` aus Clientlocale, Fallback EN). Dokumentationslabels DE/FR/IT/EN für Parität. Modellidentifikatoren und Quellen werden niemals maschinell übersetzt.
- **Keine versteckten Defaults:** autoOpen und autoShowOutput default false; Format-on-type nur für INTERLIS und bewusst konfigurierbar. Keine globale Änderung `editor.fontLigatures`, kein globales Themewechseln.

## 7. Phasen und Abnahmekriterien

Jede Phase ist eine benutzbare Lieferung. V0 enthält bereits einen echten Editor-/GUIpfad, nicht nur Berichte. V2/V3 liefern UML **vor** den zusätzlichen Dokumentationsexporten. Phasenkennungen dürfen in Prozessberichten/ACs stehen, nicht in neuen Produktionsklassen oder Testklassennamen.

### V0 – Arbeitsfähige vertikale Integration und Testfundament

**Ziel:** eine installierbare erste VSIX startet den realen aktuellen Java-LSP, öffnet ein INTERLIS-Modell und zeigt dessen Funktionen. Autonomer Reviewer und echte GUIautomation funktionieren vor grosser Implementierung.

Arbeiten: aktuellen Stand/Artefakte prüfen; neues lokales Extensionrepo konfigurieren; minimale Manifest-/Sprach-/Template-/Serverstartintegration; eigene Artefaktlocks; ein echter VS-Code-GUI-Smoke mit ungültigem und gültigem Modell; OpenCode-Preflight und erste Reviewrunde. Aktuelle LSP-Nachrichten dürfen in dieser Phase noch der Baseline entsprechen; nicht als bereits verständliche Diagnoseparität markieren. Strukturell fehlerhafte Baseline/Toolchain konkret blockieren, nicht UItests durch Unitmocks ersetzen.

| AC | Verbindliche Bedingung |
|---|---|
| V0-01 | Aktuelle vollständige Core-/Extensionbasis, Änderungen seit b8051493, Scope und neue Eigentümerschaft sind nachvollziehbar erfasst; fremde Änderungen erhalten; keine Reimplementierung alter CLI-Aufträge. |
| V0-02 | Neue Identität/Commands/Settings, Sprache, einfache Snippets und eingebettete Vorlage funktionieren; keine Altbackend- oder @ilic-Abhängigkeit im neuen Paketgraphen. |
| V0-03 | Echtes Java-LSP startet aus bezeichnetem Artefakt, stdio bleibt protokollrein, Shutdown und fehlende/falsche Java-/Bundlekonfiguration sind geprüft. |
| V0-04 | Installation des erzeugten VSIX in isoliertem Profil ohne Source-Checkoutabhängigkeit; echter GUItest öffnet gültiges/ungültiges Modell, zeigt Problems und F12/Formatting-Basisfunktion. |
| V0-05 | Native GUI-Harness/Artefakte und Reviewerzugriff sind funktionsfähig; keine Direkt-APIprobe wird als Maus-/Tastatur-GUItest gezählt. |
| V0-06 | Feature-Audit/Paritätsdelta, Sourceadoption-/Lizenzplan, konkrete Versionspins und risikobasierte Gatezuordnung sind kurz festgelegt; nächste Phase nicht implementiert. |
| V0-07 | Unabhängiger OpenCode-Review auf beiden SHAs, mindestens eigene neue Start-/GUIgegenprobe, tatsächliches Prozessende und PASS. |

**Pflichtgate:** T0, vorhandene LSP-Initialize/Process-/Shutdowntests, neue TSunit-/Manifesttests, T4 `GUI-01..03`; kein globales `releaseCheckP3`. Die verwendeten GUI-/Build-Tasks ab V0 tatsächlich implementieren und dokumentieren.

### V1 – Vollwertige Java-LSP-Editorbasis und Modellauflösung

**Ziel:** normaler Modellieralltag funktioniert, bevor die Diagrammoberfläche ausgebaut wird.

Arbeiten: Java-Diagnosemapper, hierarchische Outline, RepositoryHostCoordinator/readonly Quellen, robuste ConfigurationBridge, Compile-current vs Workspace, Standardfeatures integrieren. Vorhandenen Core-Rename nicht durch TS ersetzen. Mögliche fehlende Besonderheiten bei EXTENDED/Views als gezielte Queries verbessern; schwierige Komfort-Snippetfälle verbleiben geplant V4.

| AC | Verbindliche Bedingung |
|---|---|
| V1-01 | Lesbare DE/EN-Diagnostics mit Codes, Severity, Version, echten RelatedInformation; kein technischer messageKey-/ANSI-Dump; globale Fehler verschwinden nicht still. |
| V1-02 | Dirtybuffer vor Disk, lokale/geschlossene Workspacequellen vor externen Repositories; transitive Imports, Mehrdeutigkeit, Offline/Cache und Ausfallfälle sind echt geprüft. |
| V1-03 | Externe Quellen sind korrekt navigierbar und readonly, auch nach didOpen; keine fremden Dateien durch Rename oder CodeAction änderbar. |
| V1-04 | Completion/Hover/Definition/References/PrepareRename/Rename nutzen den gemeinsamen aktuellen Snapshot; qualifizierte Segmente, geschlossene Quellen und Versionskonflikte sind abgedeckt. |
| V1-05 | Hierarchische Outline, Folding, SemanticTokens und Formatting werden über Standard-LSP geliefert; Kommentare, CRLF und Unicode bleiben korrekt. |
| V1-06 | Compile-current benutzt Root und ungespeicherte Version, Compile-workspace ist explizit; Root-/Auftragsdiagnosen und komplette IDEanalyse werden nicht verwechselt. |
| V1-07 | Workspace-/Repositorykonfiguration, Watcher, Multi-root und Cancellation bleiben begrenzt/revisionssicher; ungültige Konfiguration verwirft nicht die letzte gültige. |
| V1-08 | GUI-04..11 bestehen mit echtem Server: Problems, RelatedLocation, Hover, F12, Referenzen, Rename, Importfehler/Readonly, Outline; kein Fake-LSP. |
| V1-09 | Relevante Java-/Transport-/Extensiontests frisch; bisherige Synchronisations-/Pfad-/Closed-Rename-Regressionen erhalten; Testauswahl anhand Diff begründet. |
| V1-10 | Unabhängiger Reviewer bestätigt alle V1-Ziele und führt eigene neue Workspace-/Dirty-/Repositorygegenprobe sowie GUIprüfung aus; gültiges PASS für Produktpaar. |

### V2 – Neutraler eigener Diagrammbaustein und erste echte UML-Interaktion

**Ziel:** Nutzer kann im neuen VS Code ein fachlich korrektes UML öffnen, darin Knoten bewegen und Kanten biegen. Keine bloss statische Vorschau.

Arbeiten: vorhandenen Diagrammcode kontrolliert in `frontend/diagram-ui` übernehmen; abhängige B-Typen beseitigen; Core-Browserconsumer auf dieselbe eigene Quelle umstellen; typisierten Diagramm-/Navigationvertrag; echte Sprotty-Views, ELK-worker, Zustands-/Versionslogik und Customeditor. Polyline/orthogonale Bewegung schon jetzt, übriger Layoutkomfort in V3.

| AC | Verbindliche Bedingung |
|---|---|
| V2-01 | Ein eigener neutraler Renderer mit Provenienz/Lizenzen; keine Build-/Type-/Runtime-Abhängigkeit von B oder @ilic; Extension und bestehender Core-Browser benutzen dieselbe Quelle. |
| V2-02 | Realer stdio-Diagrammrequest liefert typisierten versionierten DiagramDocument-Vertrag mit Optionen, Root-/Snapshot-/Source-/Clientversionen und tatsächlicher Completeness. |
| V2-03 | MODEL-/TOPICcontainer, Classes/Structures/Domains/Views/Associations samt Membern/Enums/Constraints werden fachlich korrekt und ohne Namenskollisionen gezeichnet. |
| V2-04 | N-äre, Self-/Parallelassociationen und Attribute bleiben erhalten; Rollen, Kardinalitäten und Aggregations-/Kompositionsmarker stehen am richtigen Ende. |
| V2-05 | Mausdrag bewegt Knoten/Container wirklich; Kantenhandles ändern Routen; keine `.ili`-/Buffer-/semantischen Endpunktänderung. |
| V2-06 | Diagramm→Quelle für Knoten, Member und Association; readonly Importnavigation; veraltete Antwort/Range liefert keinen falschen Sprung. |
| V2-07 | Anheften/Folgen, Liveupdate, Partial/Stale/Error und Panel-Lifecycle funktionieren; Nicht-ILI-Fokus oder verspätetes Layout übernimmt nicht die falsche Quelle. |
| V2-08 | GUI-12..18 bestehen auf echtem Modell → Java-LSP → Customeditor → Sprotty, mit Maus-/Tastaturaktionen und Screenshots vor/nach Drag und Route. |
| V2-09 | Diagramm-/Schema-/Adaptertests und betroffener bestehender Browserconsumer frisch erfolgreich; keine zweite Rendererkopie und keine verlorene semantische Information. |
| V2-10 | Eigener unabhängiger GUI-/N-är-/Stale-Gegenfall des Reviewers, Lizenz-/Dependencyprüfung und PASS auf identischem Core-/Extensionpaar. |

### V3 – UML-Featureparität, Zustandsstabilität und Grafikexport

**Ziel:** die interaktive Diagrammbedienung aus A/B und Geowerkstatt einschliesslich Previewkomfort ist praktisch vorhanden.

Arbeiten: vollständiger Filterbaum; Reset/Settle/Pin/History; drei Routingmodi; Viewport/Tastatur/Scrollbars; Source→Diagramm; persistenter Zustand; Full/Visible-SVG/PNG; Inkscape-/Gapfunktionen; sichere lokale Assets; Light/Dark/HighContrast.

| AC | Verbindliche Bedingung |
|---|---|
| V3-01 | Filter F26/F33–35 inkl. direkte/indirekte Imports, All/None/Reset und externer Stubregel funktionieren; keine unnötige volle Compileranalyse pro Klick. |
| V3-02 | Reset und Settle haben unterschiedliche belegte Wirkung; manuelle Positionen/Pins und Routen bleiben bis zu bewusstem Reset erhalten. |
| V3-03 | ORTHOGONAL/POLYLINE/SPLINES und NodePlacement arbeiten wirklich; Splinekurven sind Bézierkurven, Kantenendpunkte fachlich unverändert. |
| V3-04 | Layout-Undo/Redo, Container-/Kantenbewegung, Self-Loops, parallele Kanten und asymmetrische Kardinalitäten bleiben korrekt. |
| V3-05 | Pan/Zoom/Fit/Scrollbars/Tastatur funktionieren bei HiDPI und geänderter Panelgrösse; Auswahl-/Drag-/Navigationsgesten sind unterscheidbar. |
| V3-06 | Text→Diagrammselektion und Diagramm→Text ohne Rückkopplung, mit exakter Identität/Revision; keine behauptete semantische Bidirektionalität. |
| V3-07 | Panelzustand über Hide/Show/Reload und Liveedits erhalten; entfernte/umbenannte Elemente werden sicher abgeglichen, Speicher bleibt begrenzt. |
| V3-08 | Full-/Visible-SVG und PNG spiegeln den aktuellen gefilterten/manuell angeordneten View; Signatur/XML/Viewbox/Pixel/Clipping und tatsächliche Dateien geprüft. |
| V3-09 | Inkscape-kompatible SVGgruppen/Verbindungen, GAPS/PLAIN und UMLmarker bleiben in Exporten korrekt; keine externen aktiven Ressourcen. |
| V3-10 | Light/Dark/HighContrast, Empty/Loading/Stale/Error und sichere Modell-/Kommentar-/Metadatenanzeige sind visuell geprüft; kein XSS oder Layoutverlust. |
| V3-11 | GUI-19..28 plus UML-Smokeregression aus V2 bestehen; UI-/Worker-/Export-Unit-/Browserprüfungen nach Änderungsauswirkung, keine unnötige volle Compilerplattformmatrix. |
| V3-12 | Reviewer bedient selbst die GUI, erfindet mindestens eine neue Layout-/Export-/Filterkombination und prüft Sourcehash/Bufferfreiheit; PASS auf Produktpaar. |

### V4 – Dokumentationsexporte und restliche Editorparität

**Ziel:** verbleibende produktive Komfortfunktionen liefern, ohne eine zweite Sprachengine einzubauen.

Arbeiten: Java-Dokumentprojektion und Markdown/HTML/DOCX/GraphML; Mermaid/PlantUML-Textintegration; mehrsprachige Label-/Vererbungsoptionen; vollständige Completion-/Snippet-/AutoClose-/QuickFix-Verträge aus Audit. Getypte Export-/Editorpläne, Preview-/Save-/Cancel-UX, sichere Eingabe.

| AC | Verbindliche Bedingung |
|---|---|
| V4-01 | Completion F11/F15/F16 deckt belegte Slots versions-/scopesicher ab; nur passende Ziele/Metaattribute; keine zweite Clientsemantik. |
| V4-02 | Snippets/gespiegelte Namen/Enter-/Tab-/Cursorverträge F12–14 funktionieren in echtem Editor; Kommentare/Strings/Wertzuweisungen und vorhandenes END erzeugen keine falschen Blockenden. |
| V4-03 | Mindestens die drei sicheren QuickFixarten funktionieren mit aktuellen Versionen und Undo; unvollständige Analyse erlaubt keinen unsicheren Importlöschfix. |
| V4-04 | DocumentationProjector liefert aktuelle vollständige Inhalte, Vererbungsoptionen, Struktur-/Typ-/Rollen-/Constraint-/Dokumentationsdaten; keine ASTtextlecks/Endlosrekursion. |
| V4-05 | Markdown-/HTML-/DOCX-Exports sind valide und inhaltlich geprüft; DE/FR/IT/EN-Labels/Headeroverrides und Abstractnotation; IDs unverändert. |
| V4-06 | Mermaid-/PlantUML-Text und GraphML funktionieren aus derselben Projektion; keine zusätzlichen fremden Compiler/Netzrenderer. |
| V4-07 | GUI-29..35 bestehen: Suggestions/Placeholders/AutoClose/QuickFix, Vorlagen, Markdown/HTMLpreview, echte gespeicherte Dokument-/Graphdateien und Cancel. |
| V4-08 | Neue Java-/LSP-/TS-/Export-/GUItests nach Auswirkung frisch; gezielte Compiler-Sentinels bei Queryänderung; bestehende Normprofile/XFAILs unverändert. |
| V4-09 | Reviewer prüft Quelle/Ziel-Parität F01–F60 bis hier, erfindet neuen Snippet-/QuickFix-/Dokumentgegenfall und führt GUI-/Artefaktprüfung aus; PASS. |

### V5 – Installiertes Gesamtprodukt, Plattformen und Abschluss

**Ziel:** eine installierbare, eigenständige Extension mit reproduzierbarem LSP-/UIbundle und belegter Featureparität, nicht nur ein Dev-Host-Prototyp.

Arbeiten: zielplattformspezifische VSIXe mit Runtime, Remote-/Trust-/Restart-/Leaktests; aktuelle Bedien-/Entwicklungs-/Testdoku; finale Featurematrix; echte GUI-Suite auf primärer Plattform und definierte Crossplatform-Smokematrix; Prüfung der sauberen Distribution ohne alte Repos. Keine Marketplaceveröffentlichung.

| AC | Verbindliche Bedingung |
|---|---|
| V5-01 | Sauber gebautes VSIX enthält genau eigene Extension/UI/LSP/Runtime/Assets/Lizenzen, keine Altbackends/Testharnesses/Secrets; Start ohne weitere Compiler-/B-Repos und ohne Installationsnetzwerk. |
| V5-02 | macOS arm64, Linux x64 und Windows x64 sind durch reale Installations-/Start-/GUI-Smoketests des jeweils angegebenen Artefakts nachgewiesen; nicht nur Crossbuild. |
| V5-03 | Mindestens ein echter Linux-Remote-/Dev-Container-Workflow mit VS-Code-Client funktioniert; Server am Workspacehost, URI/Exports/Readonly korrekt. Nicht getestete Plattformen klar abgegrenzt. |
| V5-04 | Trust, missing runtime/bundle, Protokollmismatch, Serverrestart/Crash, Cancel, Multi-root, schnelle Edits und Panelcleanup sind mit GUI-/Prozessbelegen ohne Datenverlust geprüft. |
| V5-05 | Alle verpflichtenden F01–F60 innerhalb ihres erklärten Scopes sind mit realen Tests/Code/GUIbelegen verknüpft; bewusste Ausschlüsse unverändert sichtbar, kein leises Downgrading. |
| V5-06 | Finaler aktueller Produktpaarstand besteht gesamte Extension-/LSP-/Diagramm-/Export-/GUI-Suite; Coreweiterungen nach §10, kein pauschaler Zwang zum sachfremden Full-Corpus-/Safari-Gesamtlauf. |
| V5-07 | README/Architektur/Protokoll/Build-/Nutzer-/Testanleitung, Sourceadoption/Lizenzen und Artefaktlocks sind konsistent; lokaler F5-/VSIXweg reproduzierbar, keine alte ID oder unkontrollierter Siblinglink. |
| V5-08 | Unabhängige kumulative Prüfung aller 56 ACs, eigene neue GUI- und negative Paket-/Protokollgegenprobe, saubere beide SHAs, vollständiger Prozessabschluss und PASS; kein Push/Release. |

## 8. Konfiguration, Commands und Testbarkeit

### 8.1 Kleine explizite Konfigurationsoberfläche

Beabsichtigte Settings (vor Implementierung anhand der tatsächlichen APIs ausprägen):

| Bereich | Settings / Default | Wirkung |
|---|---|---|
| Host | `interlisGuru.server.javaPath` / `server.bundlePath` leer | Gebündelte passende Runtime/Server; Overrides nur bewusst für Entwicklung, sicherheitsrelevant. |
| Sprache | `interlisGuru.diagnostics.language = auto` | DE/EN anhand VS-Code-UI, andere Sprachen Fallback EN; keine Prozesslocale-Mutation. |
| Modelle | `interlisGuru.repositories = ["https://models.interlis.ch/"]`, `offline = false` | Strukturierte Liste, Workspace zuerst; kein implizites Legacy `%JAR_DIR`. Externe Downloads transparent. |
| Cache | unter ExtensionglobalStorage im Workspacehost | Quell-/Indexcache mit Digest, keine Veränderung des Modellworkspace. |
| Ansicht | `diagram.autoOpenBeside = false`, `diagram.followEditor = false` | Kein Fokusdiebstahl; aktive Datei ausdrücklich öffnen oder Follow aktivieren. |
| UML | Attributmodus `OWN`, Rollen-/Kardinalitäts-/Enum-/Constraintanzeige | An vorhandene F26/F33-Verträge anschliessen, keine neuen Sprachregeln. |
| Layout | `edgeRouting = ORTHOGONAL`, geeignete belegte ELK-NodePlacementvorgabe | Layout-only; Änderung muss keine neue Compileranalyse auslösen. |
| Export | `rendering.target = STANDARD|INKSCAPE`, `edgeCrossings = GAPS|PLAIN` | Anzeige/Export, nicht kanonischer Graph. |
| Dokument | `documentation.language = auto`, inheritance und Headeroverrides | DE/FR/IT/ENlabels, Fallback EN; Modelltexte nicht übersetzen. |

Die konkrete Speicherung der Runtime-/Bundleartefakte ist kein frei editierbarer Workspacepfad im untrusted Modus. Repositories mit credentials werden weder in Status noch als URLs in Fehlermeldungen unredigiert ausgegeben. Proxy/TLS-/Dateigrössenregeln des bestehenden Hosts erhalten.

Commands benutzen ausschliesslich `interlisGuru.*`: `compileCurrent`, `compileWorkspace`, `restartServer`, `newFromTemplate`, `showDiagram`, `diagram.refresh`, `diagram.resetLayout`, `diagram.settle`, `diagram.export`, `documentation.preview`, `documentation.export`, `exportGraph`. Interne Navigation-/Snippetcommands nicht unnötig in der Palette. Exportformat und Scope per QuickPick/Toolbar; die genaue UX kann vereinheitlicht werden, solange Feature-/GUIverträge erfüllt bleiben.

### 8.2 Neue ausführbare Testeinstiege

EXT soll wenige fachliche npm-scripts bereitstellen, **nicht** ein Script je Projektphase:

```sh
npm ci
npm run build
npm run test:unit
npm run test:protocol
npm run test:extension-host
npm run test:gui -- --suite smoke
npm run test:gui -- --suite editor
npm run test:gui -- --suite uml-basic
npm run test:gui -- --suite uml-interaction
npm run test:gui -- --suite exports
npm run test:gui -- --suite resilience
npm run package:vsix -- --target <tatsaechliche-plattform>
npm run test:installed -- --vsix <tatsaechliches-archiv>
npm run verify:no-legacy-dependencies
```

Diese Namen sind **zu implementierende** Produkt-/Testverträge, keine bereits erfolgreich ausgeführten Kommandos. CLI-Parameter mit Schema prüfen; unbekannte Suite/fehlende Fixture muss ungleich 0 enden. V0 dokumentiert die konkrete ausführbare Auswahl und die gebauten Versionen. Keine `--passWithNoTests` für Pflichtsuiten.

CORE verwendet vorhandene Gradletasks wie `:interlis-lsp:test`, `:interlis-projection:test`, `:interlis-compiler:test`, `:interlis-repository:test`, `:interlis-workspace:test`, `pythonFreeCheck`, relevante Diagrammadapter-/Browsertests. Reale Taskexistenz in V0 prüfen. Vorgeschlagen neu: `editorBundle` und ein Wrapper für Unit/Browserprüfungen von `frontend/diagram-ui`; keine Attrappen. Bestehende Kern-Releasegates bleiben erhalten, aber werden für diesen Auftrag nicht reflexartig bei jedem UIchange ausgeführt.

## 9. Echte GUI-Prüfung und Artefakte

### 9.1 Drei Prüfarten ausdrücklich unterscheiden

1. **Unit/DTO/Renderer-Test:** Node/JUnit/DOMfixture, schnell und präzise, aber keine Editor-GUI.
2. **Extension-Host-Integration:** `@vscode/test-electron` mit realen VS-Code-APIs und Serverprozess. Prüft registrierte Provider, Edits, Dokumentversionen und Kommandos. Ein `vscode.executeDefinitionProvider` ist wertvoll, aber kein F12-Maustest.
3. **GUI-End-to-End:** echte paketierte/installierte Extension, echter Java-LSP und VS-Code-Electron-Workbench; Maus-/Tastatureingaben über WebDriver und die sichtbare Webview. Diese Stufe ist hier Pflicht.

Vorgesehener GUI-Harness: `vscode-extension-tester`/ExTester mit Selenium und eigenen PageObjects. In V0 kompatible VS-Code-/ChromeDriver-/ExTesterstände pinnen und gegen tatsächliche lokale Plattform erproben. Der primäre Weg darf nicht durch eine Mock-Workbench ersetzt werden. Ein anderer echter Workbench-GUIharness ist nur bei nachgewiesenem technischen Hindernis und identischen Nachweisen zulässig; nicht parallel mehrere pflegen. Für den neutralen Renderer ergänzend Playwright im echten Browser (kein Ersatz für VS Code).

### 9.2 Verbindliche GUI-Beweisregeln

- Tests installieren das tatsächlich erzeugte VSIX in einem **isolierten** user-data-/extensions-Verzeichnis. Keine Produktionsprofile, keine Änderung der normalen Nutzereinstellungen oder Deaktivierung seiner installierten Extensions.
- Workbenchbefehle über Palette/Menü/Shortcuts; Text über Editorinteraktion; Diagrammdrag mit echten pointer actions. `page.evaluate(() => controller.move(...))` ist kein zulässiger Dragtest. Read-only DOM-/BoundingBoxmessung als Orakel ist erlaubt.
- Der Webview ist ein echter VS-Codeframe. Sein Produktionscode darf nicht für Tests durch eine alternative HTMLansicht ersetzt werden. Selektoren sind Accessibilityrollen oder stabile eigene `data-testid`-/`data-element-id`-Attribute.
- Vor/Nach relevanten Aktionen echte Screenshots; für Routen-/Filter-/Exportfälle zusätzlich Koordinaten/DOMdaten und tatsächliche gespeicherte Artefakte. Screenshot allein ohne Assertion genügt nicht; Assertion allein ohne sichtbaren GUIablauf ist keine GUIabnahme.
- UI-Screenshots auf Beschriftung, Überlappung, Clipping, leere Ansichten und Marker prüfen. Der Reviewer öffnet mindestens die relevanten Bilder mit einem verfügbaren Bildwerkzeug; behauptet keine visuelle Prüfung aus Dateinamen.
- Tests ohne Display: unter Linux ist Xvfb als echte gerenderte Electron-GUI zulässig. Ein JSdom-/Mocktest ist nicht gleichwertig. Auf macOS darf gesperrter/fehlender GUIzugriff als BLOCKED gemeldet werden, nicht als PASS.
- Datei-Dialoge wirklich bedienen. Wo Native-OS-Dialoge nicht zuverlässig automatisierbar sind, im **isolierten Testprofil** die von der gepinnten VS-Code-Version unterstützte einfache Dialogdarstellung verwenden; derselbe Produktionscommand und dieselbe Speicherfunktion bleiben. Keine Test-only Direktwrite-Commandabkürzung.
- `--disable-extensions` darf nicht die zu prüfende installierte Extension abschalten. Tests prüfen Publisher/ID/Version/Bundlehash im laufenden Host und zählen gestartete Java-LSP-Prozesse.
- Kein beliebiges Sleep als Erfolgskriterium: auf sichtbaren Zustand/Snapshot/Notifications begrenzt warten. Zeitüberschreitungen, Browserconsolefehler, unhandled rejection und Serverexit werden ausgewertet.
- Pro GUI-Suite Negativcanary: fehlender Server, erwarteter nicht vorhandener Knoten oder unterdrückte Exportdatei muss den Harness tatsächlich scheitern lassen. Canary separat als erwarteten Fehlschlag protokollieren; keine Mutationen des Produktkandidaten.

### 9.3 Belegformat

Unter ignoriertem `build/reports/gui/<suite>/<run-id>/` bzw. `artifacts/gui/` liegen: produktpaarbezogenes Manifest, JUnit/JSONresultat, Runner-/Workbench-/Serverlogs, Screenshots, Exportdateien und optional Video. Manifest: Core-/ExtensionSHA, VSIX-/Bundlehash, Plattform/Architektur, VS-Code-/Driver-/JDKversion, Suite-/Fall-IDs, tatsächlicher Prozessstart, Start-/Endzeit, Exitstatus. Keine Referenz auf alte `main`-Artefakte ohne Digest.

Die vollständigen **42 GUI-Szenarien** mit Schritten, Orakeln und Phase stehen in [GUI_TEST_MATRIX.md](GUI_TEST_MATRIX.md). Nur jeweils fällige Szenarien ausführen; V5 primärplattformseitig alle, auf weiteren Pflichtplattformen definierter Smoke. Der unabhängige Reviewer führt seine risikorelevanten GUI-Szenarien **selbst** aus und prüft übrige fällige identische Kandidatenartefakte; er erfindet mindestens eine neue GUIvariante.

## 10. Risikobasierte Gates – keine Testexplosion

### 10.1 Gatekatalog

| Gate | Inhalt | Keine Ersatzbehauptung |
|---|---|---|
| T0 | Diff-/Abhängigkeits-/Lizenz-/API-/Schema-/Lock-/Dokuanalyse | Ein `grep` allein beweist keinen geschlossenen Dependencygraph. |
| T1 | Betroffene Javaunit-/Contracttests und gezielte fachliche Sentinels | Keine alte Testzahl als neuer Lauf. |
| T2 | Echter Java-LSP-stdio-Transport, Konfiguration, Cancel, Restart | Direkter Methodenaufruf ist kein Prozesstest. |
| T3 | TSunit-, Layout-/SVG-/Diagramm-/Safetytests; Browserrenderer | Kein Ersatz für installierte Workbench. |
| T4 | Extension-Host-Integration und **echte GUI** nach Matrix | `vscode.execute...` allein zählt nicht als GUI. |
| T5 | VSIX-/Runtime-/Bundle-/Offline-/Plattform-/Remotetest | Crossbuild ist kein Laufzeittest. |
| T6 | Zusätzliche gemeinsame Core-/WASM-/Browser-/Conformanceprüfungen bei echter Betroffenheit | Unveränderte CLItextfarbe löst nicht automatisch ganze Korpussuite aus. |

### 10.2 Auswirkungsregeln für beide Agenten

| Geänderte Verantwortung | Mindestprüfungen | Was normalerweise nicht fällig ist |
|---|---|---|
| Reiner Command-/Dialog-/Webview-Style | TSunit, zugehörige GUI, kurzer Sprachserver-Smoke | volle Sprachconformance, sechs Laufzeiten, 347-Closure-Corpus |
| Layout/Export/Diagramm-UI | alle betroffenen Geometrie-/Exporttests, eigener Browserconsumer-Smoke, UML-GUI | komplette Compiler-Typ-/Normmatrix ohne Änderung |
| DiagramDocument/Projektor/Schema | `interlis-projection`-Tests, LSPdiagram-Transport, eigener UIadapter, berührte WASM-/Browserprojektion | unrelated DB-/Transfer-/Compilerbenchmark |
| LSP-Diagnosemapper/Config | LSPunit/Transport + GUI Problems/Settings + Diagnoseformatter-Tests | alle realen Modelle auf allen Backends |
| Repository-/Workspacebindung | Resolver-/Workspace-/LSP-Watcher-/Dirty-/Rename-Tests, GUI Import/Offline | nicht betroffene Export-/DOCX-Komplettsuite |
| Corequeries für Completion/QuickFix | betroffene Query-/Recovery-/Versions-/Rename-/Formattertests, LSP und Editor-GUI | pauschaler vollständiger Browsercorpustest, sofern Parser/Schema unverändert |
| Parser/Binder/Typregeln oder shared IR tatsächlich geändert | volle betroffene Compilerregression, vollständige ausgewählte Conformance, relevante portable/browserparität und reale Sentinelclosures | nichts davon nachträglich abwählen, um PASS zu erhalten |
| Build/Artifact/Runtime/Packaging | frischer sauberer Build, echte entpackte/ installierte Prozesse, Plattformsmokes, Negativinventur | fachlich unveränderte ganze Semantikmatrix bei reinem Paketinventar |
| Gemeinsamer Renderer durch V2 ersetzt | vollständige Renderer-/Adapterregression, repräsentative echte Java/WASM-Diagramme in bestehenden Browserhosts inkl. Safari soweit dessen Consumer geändert | nicht jeder Compiler-Corpusfall auf jedem Browser, sofern Semantik unverändert |

**Vor der Umsetzung je Phase** eine kurze Testauswahltabelle: geänderte Module/Verträge → zwingende Gates → bewusst nicht fällige Gates mit Begründung. Der Reviewer kann fehlende notwendige Checks ergänzen, darf Muss-GUIgates nicht streichen. Keine automatische Bedingung „alle Tests immer“ und kein Ziel „möglichst wenig Tests“; Ziel ist genau ausreichende Fehlerabdeckung.

Bei kleinen Nacharbeiten in derselben Phase nur Findingbezogenes plus betroffene Regression wiederholen. Der Kandidat bleibt trotzdem neu prüfpflichtig. Wiederverwendung alter Logs ist nur dann zulässig, wenn es um **unveränderte nicht fällige** Bereiche geht und dies als historischer Kontext, nicht frischer Lauf, bezeichnet wird. Alle verlangten Reviewgegenproben frisch. Buildcache erlaubt; ausgeführte Tests und Cachetreffer getrennt ausweisen. Bei nötigem Frischlauf gezielt `--rerun-tasks` auf passenden Testtasks statt routinemässig komplettes `clean`.

### 10.3 Fällige Phasengates

| Phase | Zwingender Fokus | Breite Regression |
|---|---|---|
| V0 | T0, LSPstart/stop, Hostbasis, GUI-01..03 | keine volle Coreabnahme |
| V1 | T1 betroffene Resolver/Workspace/Queries/Diagnostics; gesamte LSPtests; T2; T4 GUI-01..11 | Parser-/IRänderungen erweitern T6, sonst Sentinels |
| V2 | T1 Projektion, T2 Diagramm, T3 eigener Renderer/Schema, T4 GUI-12..18 und Editor-Smoke | gemeinsamer bisheriger Browseradapter nach Consumerwechsel gezielt; keine Testverluste |
| V3 | T3 UI/Geometry/Export vollständig; T4 GUI-12..28, Sprach-Smoke | T1/T6 nur bei tatsächlicher Javaänderung |
| V4 | T1 Editorhilfe/Dokumentation, T2 Exporte/CodeActions, T3 Artefakte, T4 GUI-29..35 + UML-/Editor-Smoke | Corequeries entsprechend Auswirkung, nicht ganze Deploymentmatrix |
| V5 | komplette neue Extension-/LSP-/UI-/Exporttests; GUI-01..42 auf Primärplattform; T5 Pflichtplattform-/Remotesmokes | T6 nach kumulativem Diff V0..V5; vollständige fachliche Gesamtabnahme dieses neuen Produktumfangs, nicht automatisch gesamtes Javauniversum |

## 11. Autonomer Codex-/OpenCode-Prozess

### 11.1 Rollen und echte Freigabe

Agent A implementiert und orchestriert. Agent B liest unabhängig Anforderungen, Code und Tests, führt notwendige Checks sowie eigene Gegenfälle aus und bewertet **Zielerreichung und Codequalität**. A darf B nicht durch Selbstreview ersetzen und nicht dessen Bericht bearbeiten. Ein „Tests grün“ ohne vollständige ACprüfung ist kein PASS.

Reviewurteile ausschliesslich `PASS`, `FAIL`, `BLOCKED`. Operative Stati zusätzlich `PLANNED`, `IN_PROGRESS`, `AWAITING_REVIEW`. Nur PASS auf den **aktuellen** SHAs gibt die Folgephase frei. BLOCKED mit Ursache `INFRA`, `REVIEW_TRANSPORT`, `MODEL_IDENTITY`, `MISSING_EVIDENCE` oder echter `SCOPE_DECISION`; das ist kein abgeschlossener Abschnitt.

Alle sechs Phasen sind beauftragt. Anders als in der angehängten Vorlage ist **kein manueller Nutzerstopp nach jedem PASS** vorgesehen. Bei einem echten unlösbaren Blocker konkrete Evidenz und nächste notwendige Handlung berichten, keine Fortschrittsbehauptung. Routinedetails selbst entscheiden; keine unnötigen Rückfragen zum bereits beschlossenen Renderer/Altprojektverbot.

### 11.2 Produktpaar und Commitregeln

Pro Phase `phaseBase = {coreSha,extensionSha}` zu Beginn festhalten; bleibt über alle FAIL-/Nacharbeitsversuche der Phase konstant. Dazu unveränderliche `assignmentBase`. Für ein neues EXT-Repo die erste lokale Bootstraprevision als echte Basis committen; keinen fiktiven All-zero-SHA benutzen.

Vor Review: beide tracked Trees sauber, Code/Tests/kurzer Implementierungsbericht committed. `candidate = {coreSha,extensionSha}` danach ermitteln. Kein eigener Commit-SHA im selben Commitinhalt. Hat sich Core in einer Phase nicht geändert, bleibt sein SHA gleich, aber die kombinierten neuen Artefakte müssen weiterhin zum Lock passen.

Reviewworktrees beider Repos werden detached genau an diesem Paar angelegt. Keine produktiven Quellen/Tests/Locks/ACs während des Reviews ändern. Buildausgaben und eigene Counterprobes nur untracked/ignored oder in zusätzlicher Scratchkopie. Nach einem gültigen PASS unveränderten Bericht und Status als reinen Dokucommit ablegen; der Bericht bleibt an die geprüften Produkt-SHAs gebunden. Jede Produkt-/Test-/Build-/Schemas-/Kriterienänderung erfordert neuen Kandidatenreview.

### 11.3 OpenCode-2- und DeepSeek-Preflight

Vor grösserer Arbeit V0 ausführen:

- tatsächlichen OpenCode-2.x-CLI-Pfad und `--version`, `run --help`, `auth --help`, `models --help` prüfen; keine V1-CLI oder ungeprüften Flags verwenden;
- vorhandene funktionierende GUI-/CLI-Anmeldung verwenden; **keine** Pflicht, den Key neu als `DEEPSEEK_API_KEY` zu setzen; keine Credentialdateien/SQLite-Inhalte/Token ausgeben;
- Ziel: `deepseek/deepseek-flash`, API-Modell `deepseek-flash`, direkter Host `api.deepseek.com`; anhand tatsächlichem Profil und offizieller Zuordnung DeepSeek-V4.1-Flash-1017 bestätigen;
- die dokumentierte Aliaszuordnung am 01.11.2026 ist kein unveränderlicher API-Snapshot. Wenn sie inzwischen ein anderes Modell bezeichnet, nicht still ersetzen, sondern blockieren;
- kein OpenRouter, Go/Zen, LiteLLM oder fremder Proxyfallback; Modellselbstauskunft ist kein Identitätsbeleg;
- separate frische Session und privater Server via belegtem `--standalone` bevorzugt; kein `--continue` einer Implementierungssession;
- Zugriff auf beide Reviewworktrees, Build-/Testordner, realen GUIharness und Bilder projektbezogen erlauben. Reviewer darf nicht Produktdateien editieren oder publizieren. Fehlende Rechte früh erkennen, nicht sämtliche Hostsicherheitsregeln abschalten.

Eine harmlose echte Bereitschaftsprobe prüft Dateilesen, lokalen Testprozess und Reportausgabe. Sie zählt nicht als Phasenreview. Existierende OpenCode-/Reviewwrapper wiederverwenden, sofern sie diese Anforderungen wirklich erfüllen; kein neues generisches Agentenframework.

### 11.4 Konkreter Reviewstart mit zwei Worktrees

Beispiel nach tatsächlichem Help-/Pfadcheck (nicht hier ausgeführter Lauf):

```sh
REVIEW_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/interlis-vscode-review.XXXXXX")
git -C "$CORE_DIR" worktree add --detach "$REVIEW_ROOT/core" "$CORE_CANDIDATE_SHA"
git -C "$EXT_DIR"  worktree add --detach "$REVIEW_ROOT/extension" "$EXT_CANDIDATE_SHA"
REVIEW_DIR="$REVIEW_ROOT/evidence"
mkdir -p "$REVIEW_DIR"
# request.json jetzt mit echten absoluten Pfaden/SHAs und fälligen Checks erzeugen.
# Keine vorab ausgefüllten PASS-Ergebnisse.
```

Auf der bisherigen macOS-Umgebung den bestehenden `CORE/tools/verification/without-python.cjs` weiterverwenden. **Wichtiger Codebefund:** der Guard setzt CWD auf sein Core-Root, schreibt dort `build/reports/python-free/environment.json` und ist macOS-spezifisch. Ein vorheriges `cd` in EXT reicht deshalb nicht. Belegter Aufruf muss den Extension-CWD **innerhalb** des geerbten Guards setzen, z.B.:

```sh
node "$REVIEW_ROOT/core/tools/verification/without-python.cjs" \
  /bin/sh -c 'cd "$1" || exit 1; shift; exec "$@"' interlis-review \
  "$REVIEW_ROOT/extension" "$OPENCODE_BIN" run \
  --standalone --model deepseek/deepseek-flash --format json \
  --file docs/implementation/vscode-extension/EXECUTION_PLAN.md \
  --file docs/implementation/vscode-extension/FEATURE_AUDIT.md \
  --file docs/implementation/vscode-extension/GUI_TEST_MATRIX.md \
  --file docs/implementation/vscode-extension/OPENCODE_REVIEW_PROMPT.md \
  --file "$REVIEW_DIR/request.json" \
  "Pruefe die beauftragte Phase unabhaengig an beiden Worktrees. Fuehre die faelligen Tests und eigene GUI-Gegenproben aus. Schreibe review.md und verdict.json ins angegebene Evidence-Verzeichnis." \
  >"$REVIEW_DIR/opencode.jsonl" 2>"$REVIEW_DIR/opencode.stderr.log"
REVIEW_PROCESS_EXIT=$?
```

Ein äusseres Script mit `set -e` muss den Status auch im Fehlerfall sichern. Bei Pipes den tatsächlichen OpenCode-/Guardexit, nicht `tee`, prüfen. Keine Hintergrundausführung ohne anschliessendes Wait/Join/Drain. Der eigene private OpenCode-Server und seine Kindprozesse erben dieselbe Isolation. Bei anderem Betriebssystem nicht den macOS-Guard als plattformneutral ausgeben; passende überprüfte Isolation verwenden oder die nicht belegte Schutzstufe ausdrücklich blockieren. Kein fremder laufender GUI-Server wird umkonfiguriert.

Der aktuelle Guard verändert PATH; absolute Node-/OpenCodepfade und erforderliche Runtimewerkzeuge prüfen. Seine autorisierten Negativprobes sind die einzige Pythonaufrufausnahme; A/B benutzen sonst kein Python, auch nicht „nur für JSON/ZIP“. Der Guard schützt Interpreterfreiheit, **nicht automatisch sämtliche Reviewdateien**: Schreibgrenzen und nachträglicher Git-/Hashcheck sind zusätzlich erforderlich.

### 11.5 Request-/Verdictschema

Kleine Dateien genügen. Kein weiterer Auditdatenbank-/Ticketgenerator. `request.json` mindestens:

```json
{
  "schemaVersion": 1,
  "phase": "V2",
  "assignmentBase": {"coreSha": "<vollstaendig>", "extensionSha": "<vollstaendig>"},
  "phaseBase": {"coreSha": "<vollstaendig>", "extensionSha": "<vollstaendig>"},
  "candidate": {"coreSha": "<vollstaendig>", "extensionSha": "<vollstaendig>"},
  "worktrees": {"core": "<absolut>", "extension": "<absolut>"},
  "evidenceDirectory": "<absolut>",
  "plan": "docs/implementation/vscode-extension/EXECUTION_PLAN.md",
  "implementationReport": "docs/implementation/vscode-extension/implementation/V2.md",
  "criteria": ["V2-01", "...exakte-vollstaendige-Liste..."],
  "requiredChecks": [{"id": "<check>", "cwd": "core|extension", "argv": ["<echtes Kommando>"], "reason": "<Auswirkung>"}],
  "requiredGuiCases": ["GUI-12", "..."],
  "notRequiredChecks": [{"id": "<nicht-faellig>", "reason": "<belegt unveraendert>"}],
  "artifacts": [{"path": "<absolut>", "sha256": "<tatsaechlich>", "kind": "vsix|server|renderer|runtime"}]
}
```

Reviewer erzeugt erst nach eigenen Prüfungen `verdict.json` mit denselben Identitäten, `verdict`, `reviewer {openCodeVersion,provider,model,apiHost,modelMappingEvidence}`, einer Zeile je AC (`fulfilled|violated|unverified`, eigene evidence paths), `executedChecks`, `guiEvidence`, `counterprobes`, `openMandatoryFindings`, `missingRequiredChecks`, `report: "review.md"`. Platzhalter aus Beispielen sind unzulässig in tatsächlichen Nachweisen.

Reviewabschluss-ACs besitzen zwei klar getrennte Nachweise: Der Reviewer bestätigt seine eigene inhaltliche Ziel-/Code-/Testprüfung; Codex kontrolliert nach dessen Ende ausschliesslich den äusseren Transport-/Guardabschluss und die Artefaktidentitäten. Der Reviewer muss nicht behaupten, den Exit seines noch laufenden Prozesses bereits zu kennen. Sein inhaltliches PASS ist erst zusammen mit der äusseren Abschlussprüfung eine operative Phasenfreigabe; Codex darf dadurch kein fehlendes fachliches PASS ersetzen.

Codex akzeptiert PASS nur wenn alle Bedingungen erfüllt sind: tatsächlicher Prozess beendet; Transport-/Guardexit erfolgreich und Manifest nicht running; beide HEADs korrekt und tracked Trees unverändert; wirksamer Provider/API richtig; Bericht/JSON vorhanden und konsistent; alle ACs erfüllt; alle fälligen Checks/GUIcases nachgewiesen; mindestens eigene Gegenprobe; keine offenen Muss-Findings. Ein HTTP200, Exit0 oder das Wort PASS im JSONL allein reicht nicht.

Bei Transportfehler maximal zwei saubere Wiederholungen desselben unveränderten Kandidaten; danach BLOCKED mit Log. Bei fachlichem FAIL erst konkrete Korrektur, neuer Commit und neuer unabhängiger Review; kein Wiederholen bis zufällig PASS erscheint. Alle FAIL-/BLOCKED-Berichte unverändert erhalten.

## 12. Berichte, Fortsetzung und Definition of Done

Eine aktive Übersicht `docs/implementation/vscode-extension/STATUS.md`, ein kurzer Implementierungsbericht pro Phase und unveränderte Reviewberichte je Versuch genügen. Keine tausenden neuen Evidenzdateien im Git; grosse Logs/Screenshots/VSIXe als lokale Build-/CIartefakte mit Digest und erreichbarem Pfad, kleine repräsentative Bilder nach Bedarf in Reviewdoku. Ein frischer Checkout muss die Pflichtbelege neu erzeugen können.

Implementierungsbericht: Auftrag/Phase; Basispaar; geänderte Verantwortung/Dateien; konkrete ACmatrix; Feature-IDs; neue/übernommene Klassen; Testauswahl mit Begründung; echte Kommandos/Exits/Testzahlen/Skips; GUI-/Artefaktbelege; offene Risiken; nächster erlaubter Schritt. Kein künstliches „100%“ aus Anzahl Markdownzeilen.

Finale Done-Bedingungen:

- V0–V5 nacheinander mit unabhängigem PASS an ihren Produktpaaren, V5 kumulativ alle **56 ACs**;
- F01–F60 mit klarer Herkunft, eigenem Besitzer und realem Nachweis innerhalb des benannten Scopes;
- installierbares eigenes VSIX, eigener Java-LSP, ein eigener Sprotty-/ELKrenderer; Build und Laufzeit ohne `interlis-language-tools`-/@ilic-Abhängigkeit;
- UML tatsächlich bedienbar, Exporte entsprechen aktueller Ansicht; Quelltext/Buffer bei Layoutaktionen unverändert;
- normale Sprachfunktionen mit aktueller Java-Semantik, verständliche Diagnostik, Imports und sichere Edits;
- notwendige Unit-/Transport-/GUI-/Distributionstests wirklich ausgeführt, überflüssige Volltests nicht routinemässig erzwungen;
- vorherige Core-/CLI-/Norm-/Pythonfreiheitsverträge erhalten, keine versteckte neue Sprachakzeptanz;
- tatsächliche Plattformgrenzen und bewusste Preview-/Web-/Semantic-Editing-Abgrenzungen ehrlich dokumentiert;
- keine fremden Nutzerdateien/Settings/Credentials verändert und keine unbeauftragte Veröffentlichung.

**Erfolgsmass:** täglich nutzbare, in echten GUIs nachgewiesene Modellier- und UMLfunktionen auf einer einzigen Java-Sprachbasis. Nicht Zahl neuer Klassen, Zahl gestarteter Tests oder Menge erzeugter Reviewdateien.
