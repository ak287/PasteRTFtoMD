declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown';

  export interface TurndownPlugin {
    (service: TurndownService): void;
  }

  export const gfm: TurndownPlugin;
  export const tables: TurndownPlugin;
  export const strikethrough: TurndownPlugin;
}
