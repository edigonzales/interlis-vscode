# F01–F60: konkrete Zuordnung zur kumulativen V5-Prüfung

Diese Tabelle ist keine vorweggenommene Freigabe. Jede Zuordnung wird anhand der
aktuellen macOS-Qualifikation, der nativen CI-Rohbelege und des unabhängigen
V5-Verdicts am konkreten Produktpaar geprüft. Frühere Phasenreviews sind in STATUS
archiviert. Die aktuelle Qualifikation schreibt Commitpaar, Befehle, Exits,
JUnitzahlen, tatsächliche GUI-Manifeste, VSIXdigest und negative Kontrollen in
`interlis-vscode-evidence/qualification/V5-final-*/result.json`. GUI-Manifeste
verweisen auf echte Aktionen, Bilder, gespeicherte Artefakte und Serverprozesse.
Die Fälle sind einzeln benannt; ein Tabellenhäkchen ersetzt keinen Lauf.

| ID | Individueller Beleg / Prüffokus |
|---|---|
| F01 | GUI01: eigene installierte ID, `.ili`/INTERLIS; GUI11/31: TextMate/Metaattribute; eigene `resources/syntaxes` und Sprachkonfiguration. |
| F02 | GUI11: Outline/Folding/Semantic Tokens; voller Java-LSP-Vertrag und GUI28-Themes. |
| F03 | GUI02/04: Livefehler, Korrektur, DE/EN und verwandte Deklaration; Java-Diagnosemapper/LSPtests. |
| F04 | GUI08: aktueller Dirty-Root gegen defekten unbenötigten Nachbarn; echter stdio-Rootcompile. |
| F05 | GUI03/05/09/39: F12, qualifizierte Segmente, gepinnte readonly Quelle und zweiter Workspaceordner. |
| F06 | GUI06: semantische Referenzliste inklusive geschlossener Quelle; Java-Query-/Vollständigkeitsverträge. |
| F07 | GUI07: projektweites Rename/Undo; Java RenameSafety/QueryOwnership und atomare Versionsedits. |
| F08 | GUI05/10: Hover aus aktuellem Buffer/readonly Import; Java-Hoververträge und inerte Markdownbehandlung. |
| F09 | GUI11: echte Java-DocumentSymbol-Kinder MODEL/TOPIC/CLASS/Member, keine TS-Rekonstruktion. |
| F10 | GUI03: native Format/Undo/Redo; FormatterContract/P3FormatterPolicy für Kommentare und CRLF. |
| F11 | GUI11/29: native Completion mit segmentgenauer Ersetzung; EditorCompletion/P3CompletionScope. |
| F12 | GUI29: echte Snippets und Slots; EditorTemplateContract plus versionierte eigene Snippetressourcen. |
| F13 | GUI29/30: native Name-Spiegelung, Enter/Tab und Cursor; EditorPartialStateContract. |
| F14 | GUI30: Enter mit exaktem Bodycaret, mehrzeilige Köpfe und negatives bestehendes END; EditorAssistance. |
| F15 | GUI29/31: 2.3/2.4 und spezifische Slots; EditorCompletion/VersionScope/UnitType/DomainRestriction. |
| F16 | GUI31: Java-Metaattributkatalog, Namen-/Wertvorschläge; keine zweite TS-Typengine. |
| F17 | GUI32: eingebaute/local/HTTPS-Auswahl, reale unsaved Vorlage und negatives Fetch/Cancel. |
| F18 | GUI31: native Fix/Undo; Java beweist Semikolon/END/unused-import und verweigert unsichere Teilbindung. |
| F19 | GUI05/08/09: Dirty/Workspace vor Disk/Repository; Repository-/Workspace-/LSP-Verträge. |
| F20 | GUI09/10: transitive gepinnte Bytes, drei Offline-Restarts, zero zusätzliche HTTP, readonly F12. |
| F21 | GUI06/07/39: geschlossene Dateien, echte Add/Remove/Re-add-Ordner und semantischer gemeinsamer Modellraum. |
| F22 | GUI03/38/40: Stop/Restart/Crash, Dirtytext, Status und tatsächliches Cancel mit nächster erfolgreicher Anfrage. |
| F23 | GUI12/13/18: echte Sprotty MODEL-/TOPICcontainer und isolierte Wurzeln, Sourcehash unverändert. |
| F24 | GUI12/16/19: Java-Kinds, Assoziationsattribute und Filter; Projektions-/Schema-/Adaptertests. |
| F25 | GUI16/21: Typ-/Rollen-/Kardinalitäts-/Enumlabels; gespeicherte Exporte und Projektionstests. |
| F26 | GUI21: OWN/NONE/OWN_AND_INHERITED und abstrakte Notation; sichtbare/serialisierte Viewsettings. |
| F27 | GUI12/16/20: Vererbung, Import, Struktur/Referenz und n-äre Beziehungen; echte Endpunkt-IDs. |
| F28 | GUI14/16: Rollen, Kardinalität, fachlich richtige Diamanten, Self-/Parallel-/n-äre Kanten. |
| F29 | GUI13: tatsächlicher Mausdrag von Knoten/Container, gemessene Geometrie und unveränderte Source. |
| F30 | GUI14/22: innerer Routinghandle per Pointer; keine semantische Endpunktänderung. |
| F31 | GUI22/24: Settle/Reset, Pins und unabhängiger View-Undo, Source unverändert. |
| F32 | GUI22/27: tatsächliche Orthogonal-/Polyline-/Béziergeometrie und NodePlacement; UI-/Geometrietests. |
| F33 | GUI19/21: einzelne Filter, Kompartimente, konsistente Kanten und Export; reine UI-Sichtbarkeit. |
| F34 | GUI20/25: direkte/indirekte Imports und Core-projizierte Nachbarschaft/Tiefe. |
| F35 | GUI19/20: All/None/Reset, erklärter Leerzustand und Wegfall referenzloser Stubs/Container. |
| F36 | GUI23: Scrollbar-/Wheel-/Keyboard-Pan/Zoom/Fit, Fokus und Koordinatenmessungen. |
| F37 | GUI18/41: standardmässiges Pinning, ausdrückliches Follow und zwei gleiche Dateinamen mit verschiedenen URIs. |
| F38 | GUI17/24/38/40: reale verzögerte Workerantwort, Liveedits, Crash-Stale und Generation-/Snapshotprüfung. |
| F39 | GUI15/10: native Knoten-/Member-/Assoziationsnavigation, genaue UTF-16-Ziele und readonly Herkunft. |
| F40 | GUI25: native Sourceauswahl → Java-Symbolabfrage → Diagrammhighlight/Umgebung. |
| F41 | GUI26/27/36: tatsächliche Full-/Visible-SVG-Dateien aus aktueller gefilterter/manuell angeordneter Ansicht. |
| F42 | GUI26: reale PNG-Decodierung, Dimensionen und Clip/Viewport-Orakel statt blosser Endung. |
| F43 | GUI27: XML-Namespaces/Connectionreferenzen, erneute Browserdarstellung und keine Spline-Roundtripzusage. |
| F44 | GUI22/27: PLAIN/GAPS, semantisch erhaltene Routen und Exportgeometrie; UI-Geometrietests. |
| F45 | GUI24/41: separater View-Undo/-Redo, Reload und URI-/Panelzustandsgrenzen, begrenzte Ressourcen. |
| F46 | GUI28/38/40: Light/Dark/High Contrast, native Tastatur/Fokus und sichtbare stale/error/cancelled-Zustände. |
| F47 | GUI33: Markdownkatalog per Preview und echtem Savedialog; reine Java-Dokumentprojektion. |
| F48 | GUI33: vier Labelsprachen und Headeroverride; Modellidentifikatoren bleiben unverändert. |
| F49 | GUI33/34: drei Inheritancemodi, verschachtelte/rekursive Strukturreferenzen, konkrete Typ-/Constraintinformationen. |
| F50 | GUI33: inertes HTML ohne aktive Ressourcen, schmale Vorschau/Scroll und tatsächliche HTMLdatei. |
| F51 | GUI34: gespeichertes DOCX mit fünf geparsten OOXMLteilen, Tabellen/Styles/Beziehungen und Cancel. |
| F52 | GUI35: Mermaid-/PlantUML-Vererbungsrichtung und GraphML-IDs/Referenzen, Rollen und Multiplizität. |
| F53 | GUI36: gebündeltes Java25, leeres Produkt-PATH, externe Netz-/Core-/Extension-src-Sperre und echter UML-/SVGpfad. |
| F54 | macOS-Desktop: GUI01–42. Linux/Windows: kurze native Actions-CLI-/Runtime-/stdio-Smokes. Remote-/zusätzliche Plattform-GUI ausdrücklich ungeprüft gemäss Nutzeränderung, kein Remote-PASS. |
| F55 | GUI01/36/42: neue VSIXinstallation, genaue Datei-/Runtimehashes, Unicodepfade und Restart; native Actions-CLIinstallation. |
| F56 | `src/extension.ts` erkennt konkurrierende Sprachbeiträge, warnt und deaktiviert nichts; GUI37 mit zusätzlicher passiver Testextension im isolierten Profil. |
| F57 | GUI10/28/33/37: readonly Handles, inerte gefährliche Labels/Kommentare/HTML, CSP und Workspacepfade ohne Ausführungsautorität. |
| F58 | GUI17/38/40/41: obsolete Antworten, echtes Cancel, mittlere Ansicht, 20 Zyklen und vorab gesetzte Prozess-/Workerbudgets. |
| F59 | `verify-dependencies.cjs`, package/lock/esbuild-Inventur, lizenzierte Sourceadoption und GUI36 ohne Core-/Altprojektzugriff. |
| F60 | Alle42 nativen Fälle plus echte fehlender-Server-Negativkontrolle; erst unabhängiges kumulatives OpenCode-V5-Verdict und äussere Prozess-/Artefakt-/Bildprüfung geben frei. |

Die geänderte Plattformpflicht und die bewusst ausgeschlossenen Produktfunktionen
stehen in [PLATFORM_TEST_SCOPE](PLATFORM_TEST_SCOPE.md) bzw.
[FEATURE_AUDIT §6](FEATURE_AUDIT.md#6-ehrliche-grenzen-der-parität).
