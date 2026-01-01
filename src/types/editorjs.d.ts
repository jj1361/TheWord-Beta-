/**
 * Type declarations for Editor.js plugins
 */

declare module '@editorjs/header' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';

  interface HeaderConfig {
    placeholder?: string;
    levels?: number[];
    defaultLevel?: number;
  }

  export default class Header implements BlockTool {
    constructor(config: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): { text: string; level: number };
    static get toolbox(): { title: string; icon: string };
  }
}

declare module '@editorjs/list' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';

  interface ListConfig {
    defaultStyle?: 'ordered' | 'unordered';
  }

  export default class List implements BlockTool {
    constructor(config: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): { style: string; items: string[] };
    static get toolbox(): { title: string; icon: string };
  }
}

declare module '@editorjs/checklist' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';

  export default class Checklist implements BlockTool {
    constructor(config: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): { items: Array<{ text: string; checked: boolean }> };
    static get toolbox(): { title: string; icon: string };
  }
}

declare module '@editorjs/quote' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';

  interface QuoteConfig {
    quotePlaceholder?: string;
    captionPlaceholder?: string;
  }

  export default class Quote implements BlockTool {
    constructor(config: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): { text: string; caption: string; alignment: string };
    static get toolbox(): { title: string; icon: string };
  }
}

declare module '@editorjs/code' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';

  export default class Code implements BlockTool {
    constructor(config: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): { code: string };
    static get toolbox(): { title: string; icon: string };
  }
}

declare module '@editorjs/marker' {
  import { InlineTool, InlineToolConstructorOptions } from '@editorjs/editorjs';

  export default class Marker implements InlineTool {
    constructor(config: InlineToolConstructorOptions);
    render(): HTMLElement;
    surround(range: Range): void;
    checkState(): boolean;
    static get isInline(): boolean;
  }
}

declare module '@editorjs/inline-code' {
  import { InlineTool, InlineToolConstructorOptions } from '@editorjs/editorjs';

  export default class InlineCode implements InlineTool {
    constructor(config: InlineToolConstructorOptions);
    render(): HTMLElement;
    surround(range: Range): void;
    checkState(): boolean;
    static get isInline(): boolean;
  }
}

declare module '@editorjs/underline' {
  import { InlineTool, InlineToolConstructorOptions } from '@editorjs/editorjs';

  export default class Underline implements InlineTool {
    constructor(config: InlineToolConstructorOptions);
    render(): HTMLElement;
    surround(range: Range): void;
    checkState(): boolean;
    static get isInline(): boolean;
  }
}
