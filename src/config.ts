import * as vscode from 'vscode';
import type { MarkdownFlavor, RichPasteConfig } from './config-types';
export type { MarkdownFlavor, RichPasteConversionConfig, RichPasteConfig } from './config-types';

const ROOT = 'richPaste';

const DEFAULTS = {
  enabled: true,
  languages: ['markdown'],
  mimePriority: ['text/html', 'text/rtf', 'text/plain'],
  conversion: {
    flavor: 'gfm' as MarkdownFlavor,
    preserveLineBreaks: false,
    enableTables: true
  }
};

function readStringArray(
  config: vscode.WorkspaceConfiguration,
  key: string,
  fallback: readonly string[]
): string[] {
  const value = config.get<unknown>(key);
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized = value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim().toLowerCase());

  return normalized.length > 0 ? normalized : [...fallback];
}

function readFlavor(config: vscode.WorkspaceConfiguration): MarkdownFlavor {
  const value = config.get<string>('conversion.flavor', DEFAULTS.conversion.flavor);
  return value === 'commonmark' ? 'commonmark' : 'gfm';
}

export function getRichPasteConfig(): RichPasteConfig {
  const config = vscode.workspace.getConfiguration(ROOT);

  return {
    enabled: config.get<boolean>('enabled', DEFAULTS.enabled),
    languages: readStringArray(config, 'languages', DEFAULTS.languages),
    mimePriority: readStringArray(config, 'mimePriority', DEFAULTS.mimePriority),
    conversion: {
      flavor: readFlavor(config),
      preserveLineBreaks: config.get<boolean>(
        'conversion.preserveLineBreaks',
        DEFAULTS.conversion.preserveLineBreaks
      ),
      enableTables: config.get<boolean>('conversion.enableTables', DEFAULTS.conversion.enableTables)
    }
  };
}

export function affectsRichPasteConfiguration(event: vscode.ConfigurationChangeEvent): boolean {
  return event.affectsConfiguration(ROOT);
}
