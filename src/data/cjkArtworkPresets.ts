export interface ArtworkPreset {
  id: string;
  title: string;
  cjkTitle: string;
  category: string;
  svgDataUrl: string;
}

// Crisp, authentic traditional oriental vector ink wash & brush artwork presets encoded as clean data URIs
export const CJK_ARTWORK_PRESETS: ArtworkPreset[] = [
  {
    id: 'bamboo-ink',
    title: 'Bambù Calligrafico',
    cjkTitle: '墨竹清风',
    category: 'Botanica & Natura',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#FAF6EE" rx="6"/>
        <g fill="none" stroke="#262422" stroke-linecap="round">
          <!-- Main Stalks -->
          <path d="M 120,280 Q 115,220 125,180" stroke-width="7" opacity="0.85"/>
          <path d="M 126,176 Q 135,120 140,80" stroke-width="5.5" opacity="0.8"/>
          <path d="M 141,76 Q 148,45 152,20" stroke-width="4" opacity="0.75"/>
          <!-- Second Stalk -->
          <path d="M 230,285 Q 235,230 228,190" stroke-width="8" opacity="0.9"/>
          <path d="M 227,185 Q 220,130 226,90" stroke-width="6.5" opacity="0.85"/>
          <path d="M 227,85 Q 232,50 236,25" stroke-width="4.5" opacity="0.75"/>
          <!-- Joints -->
          <ellipse cx="125" cy="178" rx="7" ry="2" fill="#262422" opacity="0.85"/>
          <ellipse cx="140" cy="78" rx="6" ry="2" fill="#262422" opacity="0.8"/>
          <ellipse cx="228" cy="188" rx="8" ry="2.5" fill="#262422" opacity="0.9"/>
          <ellipse cx="226" cy="88" rx="7" ry="2" fill="#262422" opacity="0.85"/>
        </g>
        <!-- Bamboo Leaves (Ink Strokes) -->
        <g fill="#262422" opacity="0.88">
          <path d="M 125,178 Q 90,170 65,185 Q 95,180 125,178 Z"/>
          <path d="M 125,178 Q 85,190 55,210 Q 90,195 125,178 Z"/>
          <path d="M 140,78 Q 100,65 70,80 Q 105,75 140,78 Z"/>
          <path d="M 140,78 Q 110,95 80,115 Q 115,98 140,78 Z"/>
          <path d="M 140,78 Q 155,55 180,45 Q 155,65 140,78 Z"/>
          <path d="M 152,20 Q 120,10 95,25 Q 125,20 152,20 Z"/>
          <path d="M 152,20 Q 170,12 195,15 Q 168,22 152,20 Z"/>
          <path d="M 228,188 Q 270,175 310,190 Q 268,185 228,188 Z"/>
          <path d="M 228,188 Q 265,200 295,225 Q 260,205 228,188 Z"/>
          <path d="M 226,88 Q 265,70 305,82 Q 262,80 226,88 Z"/>
          <path d="M 226,88 Q 270,95 315,110 Q 268,98 226,88 Z"/>
          <path d="M 226,88 Q 200,60 175,55 Q 205,70 226,88 Z"/>
          <path d="M 236,25 Q 275,18 310,25 Q 272,26 236,25 Z"/>
          <path d="M 236,25 Q 255,38 285,55 Q 255,42 236,25 Z"/>
        </g>
        <!-- Red Seal Stamp -->
        <rect x="330" y="230" width="36" height="36" fill="#B92B27" rx="3" opacity="0.85"/>
        <text x="348" y="254" font-family="serif" font-size="16" fill="#FFFFFF" text-anchor="middle" font-weight="bold">清竹</text>
      </svg>`
    )}`,
  },
  {
    id: 'shanshui-mountains',
    title: 'Paesaggio Shan Shui',
    cjkTitle: '远山含黛',
    category: 'Paesaggi CJK',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#FBF8F1" rx="6"/>
        <!-- Soft Sun / Moon -->
        <circle cx="90" cy="65" r="28" fill="#B92B27" opacity="0.25"/>
        <!-- Distant Mountains (Light Ink) -->
        <path d="M 20,170 Q 90,80 160,140 Q 230,70 300,120 Q 360,90 395,160 L 395,240 L 20,240 Z" fill="#9CA3AF" opacity="0.3"/>
        <!-- Mid-range Peaks (Medium Ink) -->
        <path d="M 0,200 Q 60,110 130,165 Q 185,125 240,175 Q 310,130 380,195 L 400,240 L 0,240 Z" fill="#4B5563" opacity="0.55"/>
        <!-- Forefront Mountain & Pines (Deep Ink) -->
        <path d="M 0,240 L 0,205 Q 40,165 95,210 Q 145,190 200,240 Z" fill="#1F2937" opacity="0.85"/>
        <g fill="#1F2937" opacity="0.85">
          <!-- Small Scholar Pines -->
          <path d="M 65,185 Q 50,175 40,180 Q 55,178 65,185 Z"/>
          <path d="M 65,185 Q 75,170 90,175 Q 75,180 65,185 Z"/>
          <path d="M 65,185 L 65,198 Z" stroke="#1F2937" stroke-width="2"/>
          <!-- Flying Birds Silhouette -->
          <path d="M 280,60 Q 285,55 290,60 Q 295,55 300,60 Q 295,58 290,62 Q 285,58 280,60 Z"/>
          <path d="M 305,45 Q 310,41 315,45 Q 320,41 325,45 Q 320,43 315,47 Q 310,43 305,45 Z"/>
        </g>
        <!-- Red Seal Stamp -->
        <rect x="25" y="25" width="28" height="28" fill="#B92B27" rx="2" opacity="0.85"/>
        <text x="39" y="44" font-family="serif" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="bold">远境</text>
      </svg>`
    )}`,
  },
  {
    id: 'plum-blossom',
    title: 'Ramo di Pruno in Fiore',
    cjkTitle: '寒梅傲雪',
    category: 'Botanica & Natura',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#FCF9F2" rx="6"/>
        <!-- Rugged Calligraphic Branch -->
        <path d="M 400,220 Q 300,200 240,150 Q 180,100 130,120 Q 80,140 20,90" fill="none" stroke="#2B2623" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
        <path d="M 240,150 Q 220,90 200,60 Q 185,40 160,30" fill="none" stroke="#2B2623" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>
        <path d="M 130,120 Q 110,160 85,175" fill="none" stroke="#2B2623" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <!-- Plum Petals (Vermilion & Cinnabar) -->
        <g fill="#C23B38" opacity="0.9">
          <!-- Flower 1 -->
          <circle cx="200" cy="58" r="6"/>
          <circle cx="192" cy="52" r="5.5"/>
          <circle cx="193" cy="65" r="5.5"/>
          <circle cx="208" cy="53" r="5.5"/>
          <circle cx="206" cy="64" r="5.5"/>
          <circle cx="200" cy="58" r="2.5" fill="#FDE047"/>
          <!-- Flower 2 -->
          <circle cx="158" cy="30" r="5"/>
          <circle cx="152" cy="25" r="4.5"/>
          <circle cx="153" cy="36" r="4.5"/>
          <circle cx="165" cy="27" r="4.5"/>
          <circle cx="164" cy="35" r="4.5"/>
          <circle cx="158" cy="30" r="2" fill="#FDE047"/>
          <!-- Flower 3 -->
          <circle cx="85" cy="175" r="6.5"/>
          <circle cx="76" cy="170" r="5.5"/>
          <circle cx="78" cy="183" r="5.5"/>
          <circle cx="93" cy="171" r="5.5"/>
          <circle cx="92" cy="182" r="5.5"/>
          <circle cx="85" cy="175" r="2.5" fill="#FDE047"/>
          <!-- Buds -->
          <circle cx="20" cy="90" r="4.5"/>
          <circle cx="115" cy="125" r="4"/>
          <circle cx="270" cy="165" r="4.5"/>
        </g>
        <!-- Stamp -->
        <rect x="30" y="215" width="32" height="32" fill="#B92B27" rx="3" opacity="0.85"/>
        <text x="46" y="237" font-family="serif" font-size="14" fill="#FFFFFF" text-anchor="middle" font-weight="bold">春晓</text>
      </svg>`
    )}`,
  },
  {
    id: 'lotus-pond',
    title: 'Fior di Loto all\'Inchiostro',
    cjkTitle: '水墨芙蕖',
    category: 'Botanica & Natura',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#FAF7F0" rx="6"/>
        <!-- Large Ink Wash Lotus Leaf -->
        <path d="M 60,220 Q 90,160 170,170 Q 240,175 270,230 Q 210,260 150,250 Q 90,260 60,220 Z" fill="#374151" opacity="0.6"/>
        <!-- Leaf Veins -->
        <path d="M 165,210 Q 110,195 80,220 M 165,210 Q 210,185 250,210 M 165,210 Q 150,240 145,250 M 165,210 Q 190,240 200,250" fill="none" stroke="#1F2937" stroke-width="1.5" opacity="0.7"/>
        <!-- Stalks -->
        <path d="M 165,210 Q 170,270 175,300" fill="none" stroke="#374151" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
        <path d="M 285,120 Q 280,210 270,300" fill="none" stroke="#374151" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>
        <!-- Lotus Flower (Delicate Red Ink) -->
        <g fill="#D9465F" opacity="0.85">
          <!-- Central Petal -->
          <path d="M 285,75 C 275,95 280,120 285,125 C 290,120 295,95 285,75 Z"/>
          <!-- Side Petals -->
          <path d="M 285,125 C 265,115 255,90 265,80 C 275,95 280,110 285,125 Z"/>
          <path d="M 285,125 C 305,115 315,90 305,80 C 295,95 290,110 285,125 Z"/>
          <path d="M 285,125 C 250,120 240,105 248,98 C 262,110 275,120 285,125 Z"/>
          <path d="M 285,125 C 320,120 330,105 322,98 C 308,110 295,120 285,125 Z"/>
        </g>
        <!-- Stamp -->
        <rect x="330" y="30" width="30" height="30" fill="#B92B27" rx="2" opacity="0.85"/>
        <text x="345" y="51" font-family="serif" font-size="13" fill="#FFFFFF" text-anchor="middle" font-weight="bold">莲韵</text>
      </svg>`
    )}`,
  },
];
