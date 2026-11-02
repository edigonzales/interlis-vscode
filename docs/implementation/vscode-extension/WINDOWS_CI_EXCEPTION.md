# Verbindliche Nutzer-Ausnahme für V5 unter Windows

Am 02.11.2026 gestattete der Nutzer ausdrücklich:

> Wenn die Windows-WM viel zu langsam ist, können wir die Windows-Tests auch auf GH Action auslagern aber halt ohne GUI-Tests.

Nach mehr als drei Minuten blieb die eigens angelegte x86-64-UTM-VM in
`starting`, ohne sichtbare Firmware-/Windowsausgabe. Der Nutzer bestätigte:

> Das dünkt mich enorm langsam. Da passiert nix in UTM.

Damit wird für V5 der Windows-GUIteil durch echte Windows-x64-Prüfungen in
GitHub Actions ersetzt: Paket-/Runtimeinventar, Installation des konkreten VSIX,
echter gebündelter Java-LSP über stdio, native Extension-Host-/APItests,
Artefakte und negative Paket-/Versionsprüfungen. Windows-GUI bleibt ausdrücklich
ungeprüft und erhält kein fiktives PASS. Die übrigen macOS-/Linux-GUI- und
Linux-Remoteanforderungen bleiben verbindlich. Diese Nutzeranweisung hat Vorrang
vor den unveränderten ursprünglichen Windows-GUIzeilen in Plan/Matrix.

Für diese CI-Prüfung sind ausschliesslich notwendige Testbranches/Workflowläufe
vorgesehen. Kein Merge, Tag, Marketplace-/npm-/Open-VSX-Release. Der finale
unabhängige V5-Reviewer muss die Ausnahme und tatsächlichen Windowsbelege nennen.

Vorbereitete eigene VM/Medien und deren fehlgeschlagener Start bleiben als
Vorlaufbelege extern unter interlis-vscode-evidence/phases/V5/windows-host.
