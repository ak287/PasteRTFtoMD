export type MarkdownFlavor = 'gfm' | 'commonmark';

export interface RichPasteConversionConfig {
  flavor: MarkdownFlavor;
  preserveLineBreaks: boolean;
  enableTables: boolean;
}

export interface RichPasteConfig {
  enabled: boolean;
  languages: string[];
  mimePriority: string[];
  conversion: RichPasteConversionConfig;
}
