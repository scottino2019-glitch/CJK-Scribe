import { ListNumberingType, CJKDocument } from '../types/editor';

export interface ListStyleOption {
  value: ListNumberingType;
  label: string;
  sample: string;
  category: 'arabic' | 'korean' | 'alpha' | 'bullet' | 'chinese';
}

export const LIST_STYLE_CATEGORIES = [
  { id: 'arabic', name: 'Numeri Arabi (Standard Coreano & Internazionale)' },
  { id: 'korean', name: 'Alfabeto Coreano · Hangul (한글)' },
  { id: 'alpha', name: 'Lettere Alfabeto Latino (A, B, C...)' },
  { id: 'bullet', name: 'Punti Elenco & Caselle (Bulleted)' },
  { id: 'chinese', name: 'Numeri Cinesi Tradizionali (Hanja / Hanzi)' },
] as const;

export const LIST_STYLE_OPTIONS: ListStyleOption[] = [
  // 1. Numeri Arabi (In Corea e nei testi moderni si usano 1. 2. 3. / 1) 2) / (1) (2))
  {
    value: 'arabic-dot',
    label: '1. 2. 3. (Numeri arabi standard con punto)',
    sample: '1. 2. 3.',
    category: 'arabic',
  },
  {
    value: 'arabic-paren',
    label: '1) 2) 3) (Numeri arabi con parentesi singola)',
    sample: '1) 2) 3)',
    category: 'arabic',
  },
  {
    value: 'arabic-parentheses',
    label: '(1) (2) (3) (Numeri arabi tra parentesi)',
    sample: '(1) (2)',
    category: 'arabic',
  },
  {
    value: 'circled-numbers',
    label: '① ② ③ (Numeri arabi cerchiati)',
    sample: '① ② ③',
    category: 'arabic',
  },

  // 2. Alfabeto Coreano (Hangul sillabico e consonantico)
  {
    value: 'korean-gana',
    label: '가. 나. 다. (Sillabe Hangul con punto)',
    sample: '가. 나. 다.',
    category: 'korean',
  },
  {
    value: 'korean-gana-paren',
    label: '가) 나) 다) (Sillabe Hangul con parentesi)',
    sample: '가) 나) 다)',
    category: 'korean',
  },
  {
    value: 'korean-gana-parentheses',
    label: '(가) (나) (다) (Sillabe Hangul tra parentesi)',
    sample: '(가) (나)',
    category: 'korean',
  },
  {
    value: 'korean-jamo',
    label: 'ㄱ. ㄴ. ㄷ. (Consonanti Hangul Jamo)',
    sample: 'ㄱ. ㄴ. ㄷ.',
    category: 'korean',
  },
  {
    value: 'korean-jamo-paren',
    label: 'ㄱ) ㄴ) ㄷ) (Consonanti Jamo con parentesi)',
    sample: 'ㄱ) ㄴ) ㄷ)',
    category: 'korean',
  },
  {
    value: 'korean-jamo-parentheses',
    label: '(ㄱ) (ㄴ) (ㄷ) (Consonanti Jamo tra parentesi)',
    sample: '(ㄱ) (ㄴ)',
    category: 'korean',
  },
  {
    value: 'korean-circled-gana',
    label: '㉮ ㉯ ㉰ (Hangul sillabico cerchiato)',
    sample: '㉮ ㉯ ㉰',
    category: 'korean',
  },
  {
    value: 'korean-circled',
    label: '㉠ ㉡ ㉢ (Hangul consonantico cerchiato)',
    sample: '㉠ ㉡ ㉢',
    category: 'korean',
  },

  // 3. Alfabeto Latino (A, B, C... / a, b, c...)
  {
    value: 'alpha-upper',
    label: 'A. B. C. (Lettere maiuscole con punto)',
    sample: 'A. B. C.',
    category: 'alpha',
  },
  {
    value: 'alpha-lower',
    label: 'a. b. c. (Lettere minuscole con punto)',
    sample: 'a. b. c.',
    category: 'alpha',
  },
  {
    value: 'alpha-upper-paren',
    label: 'A) B) C) (Lettere maiuscole con parentesi)',
    sample: 'A) B) C)',
    category: 'alpha',
  },
  {
    value: 'alpha-lower-paren',
    label: 'a) b) c) (Lettere minuscole con parentesi)',
    sample: 'a) b) c)',
    category: 'alpha',
  },
  {
    value: 'alpha-lower-parentheses',
    label: '(a) (b) (c) (Lettere minuscole tra parentesi)',
    sample: '(a) (b)',
    category: 'alpha',
  },

  // 4. Punti Elenco & Caselle
  {
    value: 'bullet',
    label: '• (Punto elenco rotondo classico)',
    sample: '• • •',
    category: 'bullet',
  },
  {
    value: 'diamond',
    label: '◆ (Rombo tradizionale orientale)',
    sample: '◆ ◆ ◆',
    category: 'bullet',
  },
  {
    value: 'square',
    label: '■ (Quadrato pieno)',
    sample: '■ ■ ■',
    category: 'bullet',
  },
  {
    value: 'checkbox',
    label: '□ / ☑ (Casella di spunta interattiva)',
    sample: '□ ☑ □',
    category: 'bullet',
  },
  {
    value: 'dash',
    label: '— (Trattino tipografico)',
    sample: '— — —',
    category: 'bullet',
  },

  // 5. Cinese Tradizionale (Hanja / Hanzi - riservato a testi cinesi)
  {
    value: 'chinese-num',
    label: '一、 二、 三、 (Numeri Hanzi/Hanja con virgola dunhao)',
    sample: '一、 二、',
    category: 'chinese',
  },
  {
    value: 'chinese-parentheses',
    label: '（一） （二） （三） (Numeri Hanzi tra parentesi)',
    sample: '（一） （二）',
    category: 'chinese',
  },
];

const KOREAN_GANA = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
const KOREAN_JAMO = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const CIRCLED_GANA = ['㉮', '㉯', '㉰', '㉱', '㉲', '㉳', '㉴', '㉵', '㉶', '㉷', '㉸', '㉹', '㉺', '㉻'];
const CIRCLED_JAMO = ['㉠', '㉡', '㉢', '㉣', '㉤', '㉥', '㉦', '㉧', '㉨', '㉩', '㉪', '㉫', '㉬', '㉭'];
const CIRCLED_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
const CHINESE_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];

/**
 * Calcola il marker/prefisso tipografico per la voce di elenco
 */
export const renderListMarker = (
  style: ListNumberingType | string,
  index: number,
  checked?: boolean
): string => {
  const n = index + 1;
  const upper = String.fromCharCode(65 + (index % 26));
  const lower = String.fromCharCode(97 + (index % 26));

  switch (style) {
    // Numeri Arabi (Standard coreano e moderno)
    case 'arabic-dot':
      return `${n}.`;
    case 'arabic-paren':
      return `${n})`;
    case 'arabic-parentheses':
      return `(${n})`;
    case 'circled-numbers':
      return CIRCLED_NUMS[index] || `(${n})`;

    // Alfabeto Coreano (Hangul sillabico e jamo)
    case 'korean-gana':
      return `${KOREAN_GANA[index % KOREAN_GANA.length] || n}.`;
    case 'korean-gana-paren':
      return `${KOREAN_GANA[index % KOREAN_GANA.length] || n})`;
    case 'korean-gana-parentheses':
      return `(${KOREAN_GANA[index % KOREAN_GANA.length] || n})`;
    case 'korean-jamo':
      return `${KOREAN_JAMO[index % KOREAN_JAMO.length] || n}.`;
    case 'korean-jamo-paren':
      return `${KOREAN_JAMO[index % KOREAN_JAMO.length] || n})`;
    case 'korean-jamo-parentheses':
      return `(${KOREAN_JAMO[index % KOREAN_JAMO.length] || n})`;
    case 'korean-circled-gana':
      return CIRCLED_GANA[index % CIRCLED_GANA.length] || `(${KOREAN_GANA[index % KOREAN_GANA.length] || n})`;
    case 'korean-circled':
      return CIRCLED_JAMO[index % CIRCLED_JAMO.length] || `(${n})`;

    // Alfabeto Latino (A, B, C...)
    case 'alpha-upper':
      return `${upper}.`;
    case 'alpha-lower':
      return `${lower}.`;
    case 'alpha-upper-paren':
      return `${upper})`;
    case 'alpha-lower-paren':
      return `${lower})`;
    case 'alpha-lower-parentheses':
      return `(${lower})`;

    // Simboli e Punti Elenco
    case 'bullet':
      return '•';
    case 'diamond':
      return '◆';
    case 'square':
      return '■';
    case 'dash':
      return '—';
    case 'checkbox':
      return checked ? '☑' : '□';

    // Cinese Tradizionale (Hanja / Hanzi)
    case 'chinese-num':
      return `${CHINESE_NUMS[index] || n}、`;
    case 'chinese-parentheses':
      return `（${CHINESE_NUMS[index] || n}）`;

    default:
      return `${n}.`;
  }
};

/**
 * Rileva se il documento corrente ha contesto coreano (font, carta o testo in Hangul)
 */
export const isKoreanDocument = (doc?: CJKDocument | null): boolean => {
  if (!doc) return false;
  if (doc.paperStyle === 'wongozhi' || doc.paperStyle === 'wongozhi-brick') return true;

  const fontLower = (doc.defaultFontFamily || '').toLowerCase();
  if (
    fontLower.includes('kr') ||
    fontLower.includes('batang') ||
    fontLower.includes('gungsuh') ||
    fontLower.includes('nanum') ||
    fontLower.includes('myung') ||
    fontLower.includes('gowun') ||
    fontLower.includes('malgun')
  ) {
    return true;
  }

  const hangulRegex = /[\uAC00-\uD7AF\u1100-\u11FF]/;
  if (hangulRegex.test(doc.title || '') || (doc.subtitle && hangulRegex.test(doc.subtitle))) {
    return true;
  }

  if (doc.pages) {
    for (const page of doc.pages) {
      for (const b of page.blocks) {
        if (b.content && hangulRegex.test(b.content)) return true;
        if (b.listData?.items?.some((it) => hangulRegex.test(it.text))) return true;
      }
    }
  }

  return false;
};

/**
 * Restituisce lo stile predefinito raccomandato per un nuovo elenco
 * Se è coreano, usa i numeri arabi 'arabic-dot' (1. 2. 3.) o l'alfabeto Hangul 'korean-gana' (가. 나. 다.)
 */
export const getDefaultListStyle = (doc?: CJKDocument | null): ListNumberingType => {
  if (isKoreanDocument(doc)) {
    return 'arabic-dot'; // In Corea standard è 1. 2. 3.
  }
  return 'arabic-dot'; // 1. 2. 3. è universale, con possibilità immediata di scegliere
};
