export type WritingMode = 'vertical-rl' | 'horizontal-tb';
export type TextOrientation = 'upright' | 'mixed';
export type PaperFormat = 'A4' | 'B5' | 'Letter';
export type PaperStyle =
  | 'plain'
  | 'xuan'
  | 'hanji'
  | 'wongozhi'
  | 'wongozhi-brick'
  | 'classical-vertical'
  | 'classical-vertical-slate'
  | 'tianzige'
  | 'mizige'
  | 'jiugongge'
  | 'huigongge'
  | 'classical-horizontal'
  | 'quadretti-5mm'
  | 'quadretti-10mm';

export type FontCategory = 'print' | 'cursive';
export type FontLanguage = 'zh' | 'ko' | 'both';

export interface FontDefinition {
  id: string;
  name: string;
  nativeName: string;
  language: FontLanguage;
  category: FontCategory; // 'print' = stampatello, 'cursive' = corsivo / calligrafia / brush
  cssFamily: string;
  className: string;
  sampleTextZh: string;
  sampleTextKo: string;
}

export type BlockType =
  | 'heading1'
  | 'heading2'
  | 'paragraph'
  | 'poem-stanza'
  | 'table'
  | 'list'
  | 'seal-group'
  | 'divider'
  | 'image';

export interface TableCell {
  id: string;
  content: string;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
  background?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

export interface TableBlockData {
  rows: number;
  cols: number;
  headers: boolean;
  cells: TableCell[][];
  bordered: boolean;
  compact: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface ListItemData {
  id: string;
  text: string;
  checked?: boolean;
}

export type ListNumberingType =
  // Numeri Arabi (Standard coreano e moderno)
  | 'arabic-dot'
  | 'arabic-paren'
  | 'arabic-parentheses'
  | 'circled-numbers'
  // Alfabeto Coreano · Hangul (한글)
  | 'korean-gana'
  | 'korean-gana-paren'
  | 'korean-gana-parentheses'
  | 'korean-jamo'
  | 'korean-jamo-paren'
  | 'korean-jamo-parentheses'
  | 'korean-circled-gana'
  | 'korean-circled'
  // Alfabeto Latino (A, B, C...)
  | 'alpha-upper'
  | 'alpha-lower'
  | 'alpha-upper-paren'
  | 'alpha-lower-paren'
  | 'alpha-lower-parentheses'
  // Simboli e Punti Elenco
  | 'bullet'
  | 'diamond'
  | 'square'
  | 'dash'
  | 'checkbox'
  // Numeri Cinesi Tradizionali (Hanja / Hanzi)
  | 'chinese-num'
  | 'chinese-parentheses';

export interface ListBlockData {
  style: ListNumberingType;
  items: ListItemData[];
}

export interface SealData {
  id: string;
  text: string; // 1 to 4 characters (e.g. 李白之印, 清心)
  shape: 'square' | 'round' | 'oval';
  style: 'yin' | 'yang'; // yin = white text on red; yang = red text on clear
  color: string;
  size: number; // in pixels, e.g. 56, 72, 88
  borderStyle: 'solid' | 'rough' | 'double';
  rotation: number; // slight authentic tilt (-4 to 4 deg)
}

export interface ImageData {
  url: string; // Base64 or URL
  alt?: string;
  caption?: string; // Didascalia
  widthPercent: number; // 15 to 100 (%)
  alignment: 'center' | 'left' | 'right' | 'float-left' | 'float-right' | 'side-by-side'; // Posizionamento reale rispetto al testo
  sideText?: string; // Compatibilità legacy: DocumentBlock.content è il campo primario
  borderStyle?: 'none' | 'thin' | 'traditional';
  aspectRatio?: 'auto' | '1/1' | '4/3' | '16/9' | '3/4';
}

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string; // HTML string or rich text for paragraph/headings
  fontFamily?: string;
  fontSize?: number; // in pt/px
  color?: string;
  backgroundColor?: string;
  fontWeight?: 'normal' | 'semibold' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number; // em
  lineHeight?: number;
  hasEmphasisDots?: boolean;
  tableData?: TableBlockData;
  listData?: ListBlockData;
  seals?: SealData[];
  dividerStyle?: 'single' | 'double' | 'cloud' | 'dotted';
  imageData?: ImageData;
}

export interface DocumentPage {
  id: string;
  pageNumber: number;
  blocks: DocumentBlock[];
}

export interface CJKDocument {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  writingMode: WritingMode;
  textOrientation: TextOrientation;
  paperFormat: PaperFormat;
  paperStyle: PaperStyle;
  defaultFontFamily: string;
  defaultFontSize: number;
  lineSpacing: number; // 1.4 to 2.5
  characterSpacing: number; // em
  primaryColor: string;
  marginMm: number; // 15, 20, 25
  gridOpacity?: number; // 0.1 to 1.0 (opacity of manuscript lines/grid)
  autoGridAlign?: boolean; // true = auto snap to grid; false = free manual spacing
  showPageNumbers: boolean;
  headerText?: string;
  footerText?: string;
  pages: DocumentPage[];
}
