import * as vscode from 'vscode';
import { getRichPasteConfig, RichPasteConfig } from './config';
import { convertToMarkdown } from './converter';

export const RICH_PASTE_KIND = vscode.DocumentDropOrPasteEditKind.Empty.append('markdown').append(
  'richText'
);

export class RichPasteEditProvider
  implements vscode.DocumentPasteEditProvider<vscode.DocumentPasteEdit>
{
  public async provideDocumentPasteEdits(
    document: vscode.TextDocument,
    _ranges: readonly vscode.Range[],
    dataTransfer: vscode.DataTransfer,
    context: vscode.DocumentPasteEditContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.DocumentPasteEdit[] | undefined> {
    const config = getRichPasteConfig();
    if (!config.enabled || !config.languages.includes(document.languageId.toLowerCase())) {
      return undefined;
    }

    if (context.only && !RICH_PASTE_KIND.contains(context.only)) {
      return undefined;
    }

    const selectedMime = pickMimeType(config, dataTransfer);
    if (!selectedMime) {
      return undefined;
    }

    const isPasteAs = context.triggerKind === vscode.DocumentPasteTriggerKind.PasteAs;
    if (!isPasteAs && selectedMime === 'text/plain') {
      return undefined;
    }

    const item = dataTransfer.get(selectedMime);
    if (!item) {
      return undefined;
    }

    const content = await item.asString();
    if (!content.trim()) {
      return undefined;
    }

    let plainTextFallback: string | undefined;
    if (selectedMime !== 'text/plain') {
      const plainText = dataTransfer.get('text/plain');
      plainTextFallback = plainText ? await plainText.asString() : undefined;
    }

    const markdown = convertToMarkdown(
      {
        mimeType: selectedMime,
        content,
        plainTextFallback
      },
      config.conversion
    );

    if (!markdown || markdown.trim().length === 0) {
      return undefined;
    }

    const edit = new vscode.DocumentPasteEdit(
      markdown,
      'Paste Rich Text as Markdown',
      RICH_PASTE_KIND
    );
    edit.yieldTo = [vscode.DocumentDropOrPasteEditKind.Empty];
    return [edit];
  }
}

function pickMimeType(config: RichPasteConfig, dataTransfer: vscode.DataTransfer): string | undefined {
  for (const mimeType of config.mimePriority) {
    if (dataTransfer.get(mimeType)) {
      return mimeType;
    }
  }

  return undefined;
}
