# Verbindlicher angepasster V5-Plattformumfang

Der Nutzer änderte am 02.11.2026 den Auftrag ausdrücklich:

> Ich würde das dahingehend anpassen, dass wir bei den Plattformtests nur macOS machen und für Linux und Windows uns auf nicht langdauernde Tests (eventuell nur smoke-tests) in einer gh action beschränken.

Aktueller verbindlicher Umfang:

- macOS arm64: native vollständige neue GUI-/Robustheitsprüfung, einschliesslich
  lokaler Multi-root-Semantik; bestehende Runtime-/LSP-/UI-/Exportgates nach Wirkung.
- Linux x64 und Windows x64: kurze GitHub-Actions-Smokes mit dem konkreten VSIX,
  seiner Runtime-/Dateiinventur, tatsächlichem CLI-Installationspfad und echtem
  Java-LSP über stdio. Keine vollständigen Compilerkorpora oder langdauernden Tests.
- Linux-/Windows-GUI sowie der zusätzliche aufwendige Remote-/Container-GUIlauf
  sind keine Abnahmepflicht mehr. Sie bleiben ausdrücklich ungeprüft; es gibt
  dafür kein fiktives PASS und keine aus Archivbuilds abgeleitete GUIbehauptung.

Diese jüngste Nutzeranweisung ersetzt die ursprüngliche Plattform-/Remotematrix
und die frühere ausschliessliche Windows-Ausnahme. Alle übrigen fachlichen Ziele
bleiben bestehen. Der unabhängige V5-Reviewer muss den angepassten Umfang bei der
kumulativen Kriterien-/F01–F60-Prüfung nennen. Notwendige isolierte CI-Testbranches
und Workflowläufe sind Teil dieses CI-Auftrags; kein Merge, Tag oder Produktrelease.
