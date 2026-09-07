/**
 * App Theme Registry
 *
 * Port toàn bộ 12 themes từ desktop (`desktop-pet-app-source/src/renderer/themes/app-themes.js`)
 * sang cấu trúc typed phù hợp React Native + Reanimated. Mỗi theme có:
 *   - tokens: color tokens (bg, surface, text, accent, border, ...)
 *   - decorations: particle kind + corner emojis + hat flag
 *
 * Theme IDs:
 *   - Core:    auto, light, dark, dev
 *   - Seasonal: christmas, halloween, birthday, new_year, tet, valentine
 *   - Premium: cyberpunk (1000), pastel (300), monochrome (500)
 *
 * Step 2 (Seasonal + Premium themes parity) — xem docs/steps/step-02-seasonal-premium-themes.md.
 */

import type { Theme } from './theme';

// ============================================================================
// Types
// ============================================================================

export type ThemeId =
  | 'auto'
  | 'light'
  | 'dark'
  | 'dev'
  | 'christmas'
  | 'halloween'
  | 'birthday'
  | 'new_year'
  | 'tet'
  | 'valentine'
  | 'cyberpunk'
  | 'pastel'
  | 'monochrome';

export type ParticleKind =
  | 'none'
  | 'snowflakes'
  | 'ghost'
  | 'confetti'
  | 'fireworks'
  | 'matrix'
  | 'hearts';

export interface AppThemeMeta {
  id: ThemeId;
  name: string;
  icon: string;
  price: number; // 0 = free
  isCore?: boolean;
  isSeasonal?: boolean;
  isPersonal?: boolean;
  isPremium?: boolean;
  eventId?: string;
  description: string;
}

export interface AppThemeDecorations {
  particles: ParticleKind;
  corners?: [string, string, string, string];
  hat?: boolean;
}

export interface AppTheme extends AppThemeMeta {
  /** Mapped sang `theme.ts` Theme shape (bg/surface/text/accent/...). */
  tokens: Theme['colors'];
  decorations: AppThemeDecorations;
}

// ============================================================================
// Helpers — derive theme.ts colors từ desktop CSS variable hex
// ============================================================================

/**
 * Helper tạo tokens từ palette hex (port từ desktop `--bg-primary`, `--text-primary`, ...).
 * Một số field không có trong desktop (stat colors) sẽ fallback về default.
 */
function makeTokens(palette: {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
}): Theme['colors'] {
  return {
    accent: palette.accent,
    accentMuted: palette.accentSoft,
    success: palette.success ?? '#34C759',
    danger: palette.danger ?? '#FF3B30',
    warning: palette.warning ?? '#FF9500',
    info: palette.info ?? '#5856D6',
    bg: palette.bgPrimary,
    surface: palette.bgElevated,
    surface2: palette.bgSecondary,
    surfaceElevated: palette.bgElevated,
    surfaceMuted: palette.bgTertiary,
    text: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textTertiary,
    textInverse: palette.textOnAccent,
    border: palette.border,
    borderStrong: palette.borderStrong,
    separator: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    scrim: 'rgba(0, 0, 0, 0.2)',
    statHappiness: palette.warning ?? '#FF9500',
    statHunger: palette.success ?? '#34C759',
    statEnergy: palette.info ?? '#5856D6',
    statHealth: palette.danger ?? '#FF2D55',
  };
}

// ============================================================================
// Theme Definitions — port từ desktop app-themes.js
// ============================================================================

export const APP_THEMES: Record<ThemeId, AppTheme> = {
  // ── Core ──────────────────────────────────────────────────────────────
  light: {
    id: 'light',
    name: 'Sáng (Cozy Cream)',
    icon: '☀️',
    price: 0,
    isCore: true,
    description: 'Giao diện sáng ấm áp, phong cách Creamy & Bento Canvas',
    tokens: makeTokens({
      bgPrimary: '#FAF7F2',
      bgSecondary: '#FFFDF9',
      bgTertiary: '#F2EDE4',
      bgElevated: '#FFFFFF',
      textPrimary: '#1E2024',
      textSecondary: '#686E78',
      textTertiary: '#989EA8',
      textOnAccent: '#FFFFFF',
      accent: '#007AFF',
      accentHover: '#0062D6',
      accentSoft: 'rgba(0, 122, 255, 0.08)',
      border: '#EAE4D9',
      borderStrong: '#D8D0C2',
    }),
    decorations: { particles: 'none' },
  },

  dark: {
    id: 'dark',
    name: 'Tối (Dark)',
    icon: '🌙',
    price: 0,
    isCore: true,
    description: 'Theme tối dịu mắt ban đêm',
    tokens: makeTokens({
      bgPrimary: '#1C1C1E',
      bgSecondary: '#2C2C2E',
      bgTertiary: '#3A3A3C',
      bgElevated: '#2C2C2E',
      textPrimary: '#F2F2F7',
      textSecondary: '#AEAEB2',
      textTertiary: '#8E8E93',
      textOnAccent: '#FFFFFF',
      accent: '#0A84FF',
      accentHover: '#409CFF',
      accentSoft: 'rgba(10, 132, 255, 0.15)',
      border: '#38383A',
      borderStrong: '#48484A',
    }),
    decorations: { particles: 'none' },
  },

  auto: {
    id: 'auto',
    name: 'Theo hệ thống OS',
    icon: '🌓',
    price: 0,
    isCore: true,
    description: 'Tự động chuyển đổi Sáng/Tối theo giao diện OS',
    tokens: makeTokens({
      // auto tokens resolved dynamically trong useTheme hook
      bgPrimary: '#FAF7F2',
      bgSecondary: '#FFFDF9',
      bgTertiary: '#F2EDE4',
      bgElevated: '#FFFFFF',
      textPrimary: '#1E2024',
      textSecondary: '#686E78',
      textTertiary: '#989EA8',
      textOnAccent: '#FFFFFF',
      accent: '#007AFF',
      accentHover: '#0062D6',
      accentSoft: 'rgba(0, 122, 255, 0.08)',
      border: '#EAE4D9',
      borderStrong: '#D8D0C2',
    }),
    decorations: { particles: 'none' },
  },

  dev: {
    id: 'dev',
    name: 'Developer Terminal',
    icon: '💻',
    price: 0,
    isCore: true,
    description: 'Giao diện phong cách terminal cho Lập trình viên',
    tokens: makeTokens({
      bgPrimary: '#0D1117',
      bgSecondary: '#161B22',
      bgTertiary: '#21262D',
      bgElevated: '#161B22',
      textPrimary: '#58A6FF',
      textSecondary: '#79B8FF',
      textTertiary: '#8B949E',
      textOnAccent: '#0D1117',
      accent: '#3FB950',
      accentHover: '#56D364',
      accentSoft: 'rgba(63, 185, 80, 0.15)',
      border: '#30363D',
      borderStrong: '#484F58',
    }),
    decorations: { particles: 'matrix', corners: ['💻', '⚡', '🐛', '🔧'] },
  },

  // ── Seasonal ──────────────────────────────────────────────────────────
  christmas: {
    id: 'christmas',
    name: 'Giáng Sinh',
    icon: '🎄',
    price: 0,
    isSeasonal: true,
    eventId: 'christmas',
    description: 'Không khí lễ hội Giáng Sinh đỏ rực rỡ và tuyết rơi',
    tokens: makeTokens({
      bgPrimary: '#1E0A0A',
      bgSecondary: '#2D1212',
      bgTertiary: '#401A1A',
      bgElevated: '#2D1212',
      textPrimary: '#FFFFFF',
      textSecondary: '#FFC1C1',
      textTertiary: '#FFA0A0',
      textOnAccent: '#FFFFFF',
      accent: '#D42426',
      accentHover: '#E5393B',
      accentSoft: 'rgba(212, 36, 38, 0.2)',
      border: '#4A2020',
      borderStrong: '#6B2C2C',
      success: '#165B33',
    }),
    decorations: {
      particles: 'snowflakes',
      corners: ['🎅', '🎄', '🎁', '⛄'],
      hat: true,
    },
  },

  halloween: {
    id: 'halloween',
    name: 'Halloween Spooky',
    icon: '🎃',
    price: 0,
    isSeasonal: true,
    eventId: 'halloween',
    description: 'Sắc cam huyền bí và sương mù đêm Halloween',
    tokens: makeTokens({
      bgPrimary: '#140D1C',
      bgSecondary: '#22162E',
      bgTertiary: '#322144',
      bgElevated: '#22162E',
      textPrimary: '#FF9F1C',
      textSecondary: '#FFBF69',
      textTertiary: '#CB997E',
      textOnAccent: '#140D1C',
      accent: '#FF6B00',
      accentHover: '#FF8533',
      accentSoft: 'rgba(255, 107, 0, 0.2)',
      border: '#3B2354',
      borderStrong: '#533276',
    }),
    decorations: {
      particles: 'ghost',
      corners: ['🎃', '👻', '🦇', '🕷️'],
      hat: true,
    },
  },

  birthday: {
    id: 'birthday',
    name: 'Sinh Nhật Rực Rỡ',
    icon: '🎂',
    price: 0,
    isPersonal: true,
    description: 'Tiệc sinh nhật bóng bay & hoa pháo rực rỡ',
    tokens: makeTokens({
      bgPrimary: '#FFF0F5',
      bgSecondary: '#FFE4E1',
      bgTertiary: '#FFD1DC',
      bgElevated: '#FFFFFF',
      textPrimary: '#D81B60',
      textSecondary: '#E91E63',
      textTertiary: '#F48FB1',
      textOnAccent: '#FFFFFF',
      accent: '#FF1493',
      accentHover: '#FF69B4',
      accentSoft: 'rgba(255, 20, 147, 0.15)',
      border: '#FFB6C1',
      borderStrong: '#FF69B4',
    }),
    decorations: {
      particles: 'confetti',
      corners: ['🎂', '🎈', '🎉', '🎁'],
      hat: true,
    },
  },

  new_year: {
    id: 'new_year',
    name: 'Năm Mới Pháo Hoa',
    icon: '🎆',
    price: 0,
    isSeasonal: true,
    eventId: 'new_year',
    description: 'Chào đón năm mới với sắc xanh đêm và ánh pháo hoa',
    tokens: makeTokens({
      bgPrimary: '#0A0E27',
      bgSecondary: '#161B40',
      bgTertiary: '#242B59',
      bgElevated: '#161B40',
      textPrimary: '#FFD700',
      textSecondary: '#FFC107',
      textTertiary: '#FFAB00',
      textOnAccent: '#0A0E27',
      accent: '#FFD700',
      accentHover: '#FFE033',
      accentSoft: 'rgba(255, 215, 0, 0.2)',
      border: '#293269',
      borderStrong: '#3D4A94',
    }),
    decorations: {
      particles: 'fireworks',
      corners: ['🎆', '🥂', '✨', '🎊'],
      hat: true,
    },
  },

  tet: {
    id: 'tet',
    name: 'Tết Nguyên Đán',
    icon: '🧧',
    price: 0,
    isSeasonal: true,
    eventId: 'tet',
    description: 'Sắc xuân rực rỡ với sắc đỏ may mắn và hoa mai vàng',
    tokens: makeTokens({
      bgPrimary: '#2A0808',
      bgSecondary: '#3D0D0D',
      bgTertiary: '#541313',
      bgElevated: '#3D0D0D',
      textPrimary: '#FFD700',
      textSecondary: '#FFE066',
      textTertiary: '#FFC107',
      textOnAccent: '#2A0808',
      accent: '#DC143C',
      accentHover: '#E63946',
      accentSoft: 'rgba(220, 20, 60, 0.25)',
      border: '#5E1818',
      borderStrong: '#802020',
    }),
    decorations: {
      particles: 'fireworks',
      corners: ['🧧', '🌸', '🐉', '🎊'],
      hat: true,
    },
  },

  valentine: {
    id: 'valentine',
    name: 'Valentine Ngọt Ngào',
    icon: '💝',
    price: 0,
    isSeasonal: true,
    eventId: 'valentine',
    description: 'Sắc hồng lãng mạn cho mùa yêu thương',
    tokens: makeTokens({
      bgPrimary: '#1F0B18',
      bgSecondary: '#331227',
      bgTertiary: '#481937',
      bgElevated: '#331227',
      textPrimary: '#FF69B4',
      textSecondary: '#FF8DA1',
      textTertiary: '#FFB6C1',
      textOnAccent: '#FFFFFF',
      accent: '#FF1493',
      accentHover: '#FF40A6',
      accentSoft: 'rgba(255, 20, 147, 0.2)',
      border: '#591E44',
      borderStrong: '#7A295D',
    }),
    decorations: {
      particles: 'hearts',
      corners: ['💖', '💝', '🌹', '💕'],
      hat: true,
    },
  },

  // ── Premium ────────────────────────────────────────────────────────────
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: '🤖',
    price: 1000,
    isPremium: true,
    description: 'Giao diện Neon huỳnh quang độc đáo đậm chất viễn tưởng',
    tokens: makeTokens({
      bgPrimary: '#0A0014',
      bgSecondary: '#17002B',
      bgTertiary: '#260042',
      bgElevated: '#17002B',
      textPrimary: '#00FFFF',
      textSecondary: '#FF007F',
      textTertiary: '#7F00FF',
      textOnAccent: '#0A0014',
      accent: '#00FFFF',
      accentHover: '#33FFFF',
      accentSoft: 'rgba(0, 255, 255, 0.2)',
      border: '#380066',
      borderStrong: '#520099',
    }),
    decorations: {
      particles: 'matrix',
      corners: ['🤖', '⚡', '🔮', '💾'],
    },
  },

  pastel: {
    id: 'pastel',
    name: 'Pastel Mộng Mơ',
    icon: '🌸',
    price: 300,
    isPremium: true,
    description: 'Tông màu kem nhã nhặn, êm dịu thư giãn',
    tokens: makeTokens({
      bgPrimary: '#FAF4FF',
      bgSecondary: '#F2E8FF',
      bgTertiary: '#E6D4FF',
      bgElevated: '#FFFFFF',
      textPrimary: '#5B4B6E',
      textSecondary: '#7A6890',
      textTertiary: '#9B8BB0',
      textOnAccent: '#FFFFFF',
      accent: '#B388FF',
      accentHover: '#9C64FF',
      accentSoft: 'rgba(179, 136, 255, 0.2)',
      border: '#E0CCFF',
      borderStrong: '#C8A8FF',
    }),
    decorations: {
      particles: 'confetti',
      corners: ['🌸', '🌷', '🦄', '🍰'],
    },
  },

  monochrome: {
    id: 'monochrome',
    name: 'Đơn Sắc Classic',
    icon: '⚫',
    price: 500,
    isPremium: true,
    description: 'Phong cách tối giản trắng đen sang trọng',
    tokens: makeTokens({
      bgPrimary: '#121212',
      bgSecondary: '#1E1E1E',
      bgTertiary: '#2D2D2D',
      bgElevated: '#1E1E1E',
      textPrimary: '#FFFFFF',
      textSecondary: '#B0B0B0',
      textTertiary: '#757575',
      textOnAccent: '#000000',
      accent: '#FFFFFF',
      accentHover: '#E0E0E0',
      accentSoft: 'rgba(255, 255, 255, 0.15)',
      border: '#333333',
      borderStrong: '#555555',
    }),
    decorations: { particles: 'none' },
  },
};

// ============================================================================
// Helpers — list + lookup
// ============================================================================

export const ALL_THEME_IDS: ThemeId[] = Object.keys(APP_THEMES) as ThemeId[];

/** Seasonal/premium themes mà user đã unlock (wallet check giả lập). */
export function isThemeUnlocked(id: ThemeId, coinsBalance: number): boolean {
  const t = APP_THEMES[id];
  if (!t) return false;
  if (t.price === 0) return true;
  return coinsBalance >= t.price;
}

/** Group themes theo category để render trong Settings UI. */
export const THEMES_BY_GROUP: Array<{
  group: 'Core' | 'Seasonal' | 'Premium';
  themes: ThemeId[];
}> = [
  { group: 'Core', themes: ['auto', 'light', 'dark', 'dev'] },
  {
    group: 'Seasonal',
    themes: ['christmas', 'halloween', 'birthday', 'new_year', 'tet', 'valentine'],
  },
  { group: 'Premium', themes: ['cyberpunk', 'pastel', 'monochrome'] },
];

/** Resolve effective ThemeId — auto → light/dark theo system color scheme. */
export function resolveThemeId(
  selected: ThemeId,
  systemColorScheme: 'light' | 'dark' | null | undefined
): Exclude<ThemeId, 'auto'> {
  if (selected === 'auto') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }
  return selected as Exclude<ThemeId, 'auto'>;
}

/** Lookup theme metadata cho picker UI. */
export function getThemeMeta(id: ThemeId): AppThemeMeta {
  const t = APP_THEMES[id];
  return {
    id: t.id,
    name: t.name,
    icon: t.icon,
    price: t.price,
    isCore: t.isCore,
    isSeasonal: t.isSeasonal,
    isPersonal: t.isPersonal,
    isPremium: t.isPremium,
    eventId: t.eventId,
    description: t.description,
  };
}
