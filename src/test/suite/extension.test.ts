import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface ExtensionManifest {
  publisher: string;
  name: string;
}

function getExtensionIdentifier(): string {
  const manifestPath = path.resolve(__dirname, '../../../package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ExtensionManifest;
  return `${manifest.publisher}.${manifest.name}`;
}

describe('Extension Test Suite', () => {
  it('registers commands on activation', async () => {
    const extensionId = getExtensionIdentifier();
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, 'Extension should be discoverable by VS Code test host');

    await extension?.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('richPaste.pasteAsMarkdown'));
    assert.ok(commands.includes('richPaste.showClipboardDebugInfo'));
  });

  it('returns clipboard debug info payload', async () => {
    const document = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '# Rich Paste\n'
    });

    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<{
      plainTextChars: number;
      config: { enabled: boolean };
    }>('richPaste.showClipboardDebugInfo');

    assert.ok(result);
    assert.strictEqual(typeof result?.plainTextChars, 'number');
    assert.strictEqual(typeof result?.config.enabled, 'boolean');
  });
});
