import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { RichPasteConversionConfig } from './config';

export interface ConversionInput {
  mimeType: string;
  content: string;
  plainTextFallback?: string;
}

const WINDOWS_1252_MAP: Record<number, string> = {
  0x80: '€',
  0x82: '‚',
  0x83: 'ƒ',
  0x84: '„',
  0x85: '…',
  0x86: '†',
  0x87: '‡',
  0x88: 'ˆ',
  0x89: '‰',
  0x8a: 'Š',
  0x8b: '‹',
  0x8c: 'Œ',
  0x8e: 'Ž',
  0x91: '‘',
  0x92: '’',
  0x93: '“',
  0x94: '”',
  0x95: '•',
  0x96: '–',
  0x97: '—',
  0x98: '˜',
  0x99: '™',
  0x9a: 'š',
  0x9b: '›',
  0x9c: 'œ',
  0x9e: 'ž',
  0x9f: 'Ÿ'
};

export function convertToMarkdown(
  input: ConversionInput,
  options: RichPasteConversionConfig
): string | undefined {
  const mime = input.mimeType.toLowerCase();

  if (mime === 'text/html') {
    return convertHtmlToMarkdown(input.content, options);
  }

  if (mime === 'text/rtf') {
    const converted = convertRtfToMarkdown(input.content, options);
    if (converted.length > 0) {
      return converted;
    }

    if (input.plainTextFallback) {
      return convertPlainTextToMarkdown(input.plainTextFallback, options);
    }

    return undefined;
  }

  if (mime === 'text/plain') {
    return convertPlainTextToMarkdown(input.content, options);
  }

  return undefined;
}

export function convertHtmlToMarkdown(html: string, options: RichPasteConversionConfig): string {
  const sanitized = sanitizeHtml(html);
  const normalized = normalizeHtml(sanitized);

  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**'
  });

  if (options.flavor === 'gfm' && options.enableTables) {
    turndown.use(gfm);
  }

  if (options.preserveLineBreaks) {
    turndown.addRule('preserve-br', {
      filter: 'br',
      replacement: () => '  \n'
    });
  }

  const markdown = turndown.turndown(normalized);
  return postProcessMarkdown(markdown, options.preserveLineBreaks);
}

export function convertRtfToMarkdown(rtf: string, options: RichPasteConversionConfig): string {
  const text = rtfToPlainText(rtf);
  if (text.length === 0) {
    return '';
  }

  return convertPlainTextToMarkdown(text, options);
}

function convertPlainTextToMarkdown(text: string, options: RichPasteConversionConfig): string {
  return postProcessMarkdown(text, options.preserveLineBreaks);
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<!--StartFragment-->|<!--EndFragment-->/gi, '')
    .replace(/<\s*(script|style|meta|link|iframe|object)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|meta|link|iframe|object)[^>]*\/?\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
}

function normalizeHtml(html: string): string {
  return html
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\sstyle\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\sclass\s*=\s*(['"])Mso[\s\S]*?\1/gi, '');
}

function postProcessMarkdown(markdown: string, preserveLineBreaks: boolean): string {
  let output = markdown.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ');
  output = output.replace(/[ \t]+\n/g, '\n');
  output = output.replace(/\n{3,}/g, '\n\n');

  if (!preserveLineBreaks) {
    output = output.replace(/  \n/g, '\n');
  }

  return output.trim();
}

function rtfToPlainText(rtf: string): string {
  let output = rtf
    .replace(/\\'([0-9a-fA-F]{2})/g, (_match, hex: string) => decodeWindows1252(hex))
    .replace(/\\par[d]?\b/g, '\n')
    .replace(/\\line\b/g, '\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\\u(-?\d+)\??/g, (_match, codePoint: string) => decodeUnicode(codePoint))
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  output = output.replace(/[ \t]+\n/g, '\n');
  return output.trim();
}

function decodeUnicode(rawCodePoint: string): string {
  const parsed = Number.parseInt(rawCodePoint, 10);
  if (Number.isNaN(parsed)) {
    return '';
  }

  const normalized = parsed < 0 ? parsed + 65536 : parsed;
  try {
    return String.fromCodePoint(normalized);
  } catch {
    return '';
  }
}

function decodeWindows1252(hex: string): string {
  const value = Number.parseInt(hex, 16);
  if (Number.isNaN(value)) {
    return '';
  }

  if (value >= 0x80 && value <= 0x9f) {
    return WINDOWS_1252_MAP[value] ?? '';
  }

  return String.fromCharCode(value);
}
