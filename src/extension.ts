import * as vscode from 'vscode';
import { affectsRichPasteConfiguration, getRichPasteConfig } from './config';
import { RICH_PASTE_KIND, RichPasteEditProvider } from './pasteProvider';

let pasteProviderRegistration: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const provider = new RichPasteEditProvider();

  const registerProvider = (): void => {
    pasteProviderRegistration?.dispose();

    const config = getRichPasteConfig();
    const selector: vscode.DocumentSelector =
      config.languages.length > 0
        ? config.languages.map((language) => ({ language }))
        : [{ language: 'markdown' }];

    const metadata: vscode.DocumentPasteProviderMetadata = {
      providedPasteEditKinds: [RICH_PASTE_KIND],
      pasteMimeTypes: config.mimePriority
    };

    pasteProviderRegistration = vscode.languages.registerDocumentPasteEditProvider(
      selector,
      provider,
      metadata
    );
  };

  registerProvider();

  context.subscriptions.push({
    dispose: () => {
      pasteProviderRegistration?.dispose();
      pasteProviderRegistration = undefined;
    }
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (affectsRichPasteConfiguration(event)) {
        registerProvider();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('richPaste.pasteAsMarkdown', async () => {
      await executePasteAsMarkdown();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('richPaste.showClipboardDebugInfo', async () => {
      return showClipboardDebugInfo();
    })
  );
}

export function deactivate(): void {
  pasteProviderRegistration?.dispose();
  pasteProviderRegistration = undefined;
}

async function executePasteAsMarkdown(): Promise<void> {
  const attempts: unknown[] = [
    { kind: RICH_PASTE_KIND },
    { kind: RICH_PASTE_KIND.value },
    RICH_PASTE_KIND.value
  ];

  for (const argument of attempts) {
    try {
      await vscode.commands.executeCommand('editor.action.pasteAs', argument);
      return;
    } catch {
      // Try next invocation shape.
    }
  }

  await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
}

interface ClipboardDebugInfo {
  plainTextChars: number;
  plainTextPreview: string;
  activeLanguageId?: string;
  config: ReturnType<typeof getRichPasteConfig>;
}

async function showClipboardDebugInfo(): Promise<ClipboardDebugInfo> {
  const plainText = await vscode.env.clipboard.readText();
  const activeLanguageId = vscode.window.activeTextEditor?.document.languageId;
  const config = getRichPasteConfig();

  const info: ClipboardDebugInfo = {
    plainTextChars: plainText.length,
    plainTextPreview: plainText.replace(/\s+/g, ' ').slice(0, 120),
    activeLanguageId,
    config
  };

  void vscode.window.showInformationMessage(
    `Rich Paste debug: plain text length ${info.plainTextChars}.`
  );

  return info;
}
