# Paste Rich Text to Markdown

Paste rich text from web browsers into VS Code as Markdown.

## Features

- Converts `text/html` clipboard data into Markdown.
- Attempts `text/rtf` conversion when HTML is unavailable.
- Falls back to normal VS Code paste when rich conversion is not possible.
- Adds explicit command: `Rich Paste: Paste Rich Text as Markdown`.
- Includes configurable MIME priority and conversion settings.

## Commands

- `Rich Paste: Paste Rich Text as Markdown` (`richPaste.pasteAsMarkdown`)
- `Rich Paste: Show Clipboard Debug Info` (`richPaste.showClipboardDebugInfo`)

## Settings

- `richPaste.enabled`
- `richPaste.languages`
- `richPaste.mimePriority`
- `richPaste.conversion.flavor`
- `richPaste.conversion.preserveLineBreaks`
- `richPaste.conversion.enableTables`


