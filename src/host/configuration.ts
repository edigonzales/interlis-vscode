import * as vscode from 'vscode';

/** Explicit allowlist: UI/launcher preferences never reach the strict Java decoder. */
export function languageSettings(context: vscode.ExtensionContext): Record<string, unknown> {
  const config = vscode.workspace.getConfiguration('interlisGuru');
  const settings: Record<string, unknown> = {
    diagnosticLanguage: config.get('diagnostics.language', 'auto'),
    repositories: config.get('repositories', ['https://models.interlis.ch/']),
    offline: config.get('offline', false),
    cacheDirectory: vscode.Uri.joinPath(context.globalStorageUri, 'repository-cache').fsPath,
    modelPins: config.get('modelPins', []),
    sourcePins: config.get('sourcePins', []),
    resolutionLock: config.get('resolutionLock', '')
  };
  for (const name of ['warningPolicy', 'allowedLanguages', 'resolutionPolicy', 'analysisBudget', 'cacheLimits']) {
    const value = config.get(name);
    if (value !== undefined) settings[name] = value;
  }
  return settings;
}
