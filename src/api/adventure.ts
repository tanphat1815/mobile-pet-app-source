/**
 * Adventure API — Step 12c
 *
 * Ported from desktop src/core/adventure/locations.js (Step 53).
 *
 * Defines:
 *  - 5 locations (park / beach / forest / city / mountain)
 *  - Encounter events per location
 *  - Reward item pools per rarity
 *  - Pure helpers: canStart, generateEncounter, generateReward, formatDuration
 */

import { storage } from './storage';

// ============================================================================
// Types
// ============================================================================

export type Rarity = 'common' | 'uncommon' | 'rare';
export type AdventureStatus = 'idle' | 'active' | 'completed';

export interface Location {
  id: string;
  displayName: string;
  emoji: string;
  description: string;
  duration: number;       // minutes
  energyCost: number;     // ⚡ points deducted
  rewards: {
    common: string[];
    uncommon: string[];
    rare: string[];
  };
  encounters: string[];    // encounter event keys
  weatherRequirement: string | null;
  backgroundClass: string; // CSS class name for background
  minLevel: number;
  unlockCondition?: {
    description: string;
    minInteractions?: number;
    requiredItems?: Record<string, number>;
  };
}

export interface EncounterEvent {
  name: string;
  icon: string;
  xp: number;
  moodBonus: number;
  msg: string;
}

export interface AdventureReward {
  itemId: string;
  rarity: Rarity;
  at: number;
}

export interface AdventureEncounter {
  key: string;
  name: string;
  icon: string;
  msg: string;
  xp: number;
  moodBonus: number;
  at: number;
}

export interface AdventureSession {
  locationId: string;
  locationName: string;
  locationEmoji: string;
  startedAt: number;
  endsAt: number;
  durationMinutes: number;
  energyCost: number;
  rewards: AdventureReward[];
  encounters: AdventureEncounter[];
  status: AdventureStatus;
}

export interface AdventureHistoryEntry {
  locationId: string;
  locationName: string;
  locationEmoji: string;
  startedAt: number;
  endedAt: number;
  rewards: AdventureReward[];
  encounters: AdventureEncounter[];
  xpEarned: number;
  success: boolean;
}

// ============================================================================
// Locations
// ============================================================================

export const LOCATIONS: Record<string, Location> = {
  park: {
    id: 'park',
    displayName: 'Công viên',
    emoji: '🌳',
    description: 'Công viên yên tĩnh với hàng cây xanh mát và thảm cỏ êm dịu.',
    duration: 15,
    energyCost: 20,
    rewards: {
      common: ['yarn', 'feather', 'apple'],
      uncommon: ['ball', 'milk', 'cheese'],
      rare: ['special_seed', 'lucky_collar'],
    },
    encounters: ['butterfly', 'bird', 'other_pets', 'sunshine'],
    weatherRequirement: null,
    backgroundClass: 'bg-park',
    minLevel: 1,
  },
  beach: {
    id: 'beach',
    displayName: 'Bãi biển',
    emoji: '🏖️',
    description: 'Bãi biển cát trắng nắng vàng, gió biển mát lành và sóng vỗ rì rào.',
    duration: 20,
    energyCost: 25,
    rewards: {
      common: ['fish', 'shell', 'water'],
      uncommon: ['sushi', 'coconut', 'crab_snack'],
      rare: ['pearl', 'ocean_crown'],
    },
    encounters: ['crab', 'seagull', 'fish_jump', 'other_pets'],
    weatherRequirement: 'sunny',
    backgroundClass: 'bg-beach',
    minLevel: 3,
  },
  forest: {
    id: 'forest',
    displayName: 'Khu rừng',
    emoji: '🌲',
    description: 'Khu rừng già huyền bí với nhiều loại thảo dược và sinh vật quý hiếm.',
    duration: 30,
    energyCost: 35,
    rewards: {
      common: ['stick', 'leaf', 'berries'],
      uncommon: ['mushroom', 'flower', 'honey'],
      rare: ['rare_herb', 'crystal', 'ancient_seed'],
    },
    encounters: ['deer', 'rabbit', 'mystery_pet', 'glow_firefly'],
    weatherRequirement: null,
    backgroundClass: 'bg-forest',
    minLevel: 6,
  },
  city: {
    id: 'city',
    displayName: 'Thành phố',
    emoji: '🏙️',
    description: 'Phố phường sôi động, cửa hiệu sầm uất và nhiều bạn thú cưng giao lưu.',
    duration: 25,
    energyCost: 30,
    rewards: {
      common: ['coin', 'paper_bag', 'donut'],
      uncommon: ['gem', 'trinket', 'coffee'],
      rare: ['legendary_token', 'golden_sunglasses'],
    },
    encounters: ['street_cat', 'street_dog', 'friendly_stranger', 'other_pets'],
    weatherRequirement: null,
    backgroundClass: 'bg-city',
    minLevel: 10,
  },
  mountain: {
    id: 'mountain',
    displayName: 'Núi tuyết',
    emoji: '⛰️',
    description: 'Đỉnh núi hùng vĩ phủ tuyết trắng, chứa đựng nhiều kho báu băng giá.',
    duration: 45,
    energyCost: 50,
    rewards: {
      common: ['stone', 'ice_shard', 'snowball'],
      uncommon: ['ore', 'ice_crystal', 'warm_soup'],
      rare: ['dragon_scale', 'frost_gem', 'ice_wings'],
    },
    encounters: ['eagle', 'mountain_goat', 'snow_spirit', 'mystery_pet'],
    weatherRequirement: null,
    backgroundClass: 'bg-mountain',
    minLevel: 15,
  },
};

// ============================================================================
// Encounter Events
// ============================================================================

export const ENCOUNTER_EVENTS: Record<string, EncounterEvent> = {
  butterfly: { name: 'Bướm hoa xinh xắn', icon: '🦋', xp: 5, moodBonus: 10, msg: 'Pet vui vẻ đuổi theo một chú bướm đầy màu sắc!' },
  bird: { name: 'Chim hót líu lo', icon: '🐦', xp: 5, moodBonus: 8, msg: 'Một chú chim nhỏ đậu xuống hót vang lời chào thân thiện.' },
  sunshine: { name: 'Tia nắng ấm áp', icon: '☀️', xp: 4, moodBonus: 12, msg: 'Ánh nắng ấm áp xua tan mệt mỏi, pet cảm thấy thật dễ chịu.' },
  crab: { name: 'Cua nhỏ đi ngang', icon: '🦀', xp: 6, moodBonus: 6, msg: 'Một chú cua bò ngang qua bãi cát làm pet tò mò theo dõi.' },
  seagull: { name: 'Hải âu bay lượn', icon: '🕊️', xp: 5, moodBonus: 8, msg: 'Đàn hải âu chao lượn trên nền trời biển bao la.' },
  fish_jump: { name: 'Cá nhảy mặt nước', icon: '🐟', xp: 8, moodBonus: 10, msg: 'Một chú cá nhảy vọt lên khỏi mặt nước làm pet thích thú reo vui!' },
  deer: { name: 'Hươu sao thân thiện', icon: '🦌', xp: 12, moodBonus: 15, msg: 'Gặp gỡ một chú hươu sao hiền lành trong bụi cây rậm rạp.' },
  rabbit: { name: 'Thỏ rừng tinh nghịch', icon: '🐇', xp: 10, moodBonus: 12, msg: 'Thỏ rừng nhảy nhót rủ pet cùng chạy nhảy thi tài.' },
  glow_firefly: { name: 'Đom đóm phát sáng', icon: '✨', xp: 10, moodBonus: 14, msg: 'Bầy đom đóm lấp lánh như những vì sao đêm thắp sáng lối đi.' },
  street_cat: { name: 'Mèo đường phố', icon: '🐱', xp: 8, moodBonus: 10, msg: 'Mèo đường phố chào hỏi và chia sẻ vài mẹo đi dạo phố.' },
  street_dog: { name: 'Cún con vẫy đuôi', icon: '🐶', xp: 8, moodBonus: 10, msg: 'Cún con thân thiện đến vẫy đuôi làm quen.' },
  friendly_stranger: { name: 'Người qua đường tốt bụng', icon: '🧑', xp: 15, moodBonus: 20, msg: 'Người dân địa phương vuốt ve khen ngợi sự đáng yêu của pet!' },
  eagle: { name: 'Đại bàng dũng mãnh', icon: '🦅', xp: 15, moodBonus: 12, msg: 'Đại bàng sải cánh trên bầu trời đỉnh núi cao vời vợi.' },
  mountain_goat: { name: 'Dê núi leo vách', icon: '🐐', xp: 12, moodBonus: 10, msg: 'Dê núi thoăn thoắt leo vách đá biểu diễn kỹ năng leo trèo.' },
  snow_spirit: { name: 'Tinh linh tuyết', icon: '❄️', xp: 20, moodBonus: 25, msg: 'Tinh linh tuyết ban phước lành may mắn và năng lượng dồi dào!' },
  mystery_pet: { name: 'Thú cưng bí ẩn', icon: '🌟', xp: 25, moodBonus: 25, msg: 'Gặp gỡ một vị thần thú cưng ẩn danh ban tặng kho báu quý giá!' },
  other_pets: { name: 'Gặp gỡ bạn bè', icon: '🐾', xp: 20, moodBonus: 20, msg: 'Bắt gặp thú cưng của một người bạn đang cùng dạo chơi!' },
};

// ============================================================================
// Pet Stats (for canStart validation)
// ============================================================================

export interface PetStats {
  level?: number;
  energy?: number;
}

// ============================================================================
// Helpers
// ============================================================================

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}p` : `${h} giờ`;
}

export function getLocationById(id: string): Location | null {
  return LOCATIONS[id] ?? null;
}

export function getEncounterEvent(key: string): EncounterEvent | null {
  return ENCOUNTER_EVENTS[key] ?? null;
}

export interface CanStartResult {
  ok: boolean;
  reason?: string;
}

export function canStartAdventure(
  locationId: string,
  petStats: PetStats,
  currentWeather: string,
  currentAdventure: AdventureSession | null,
  unlockedLocations: string[]
): CanStartResult {
  const location = LOCATIONS[locationId];
  if (!location) return { ok: false, reason: 'Địa điểm không tồn tại' };

  if (!unlockedLocations.includes(locationId)) {
    return { ok: false, reason: 'Chưa mở khóa địa điểm này' };
  }

  if (currentAdventure && currentAdventure.status === 'active') {
    return { ok: false, reason: 'Pet đang trong một chuyến thám hiểm khác' };
  }

  const level = petStats.level ?? 1;
  if (level < location.minLevel) {
    return { ok: false, reason: `Yêu cầu Pet đạt cấp độ Level ${location.minLevel}` };
  }

  if (location.weatherRequirement && location.weatherRequirement !== currentWeather) {
    return { ok: false, reason: `Yêu cầu thời tiết: ${location.weatherRequirement}` };
  }

  const energy = petStats.energy ?? 100;
  if (energy < location.energyCost) {
    return {
      ok: false,
      reason: `Không đủ thể lực (Cần ${location.energyCost}⚡, hiện có ${Math.round(energy)}⚡)`,
    };
  }

  return { ok: true };
}

export function generateEncounter(locationId: string): AdventureEncounter | null {
  const location = LOCATIONS[locationId];
  if (!location || !location.encounters.length) return null;

  const pool = location.encounters;
  const key = pool[Math.floor(Math.random() * pool.length)];
  const info = ENCOUNTER_EVENTS[key] ?? {
    name: key,
    icon: '✨',
    xp: 5,
    moodBonus: 5,
    msg: 'Một khoảnh khắc thú vị trên đường đi dạo!',
  };

  return {
    key,
    name: info.name,
    icon: info.icon,
    msg: info.msg,
    xp: info.xp,
    moodBonus: info.moodBonus,
    at: Date.now(),
  };
}

export function generateReward(locationId: string): AdventureReward {
  const location = LOCATIONS[locationId] ?? LOCATIONS.park;
  const rand = Math.random();
  let rarity: Rarity = 'common';
  if (rand > 0.90 && location.rewards.rare?.length) {
    rarity = 'rare';
  } else if (rand > 0.60 && location.rewards.uncommon?.length) {
    rarity = 'uncommon';
  }

  const pool = location.rewards[rarity] ?? location.rewards.common ?? ['apple'];
  const itemId = pool[Math.floor(Math.random() * pool.length)];
  return { itemId, rarity, at: Date.now() };
}

export function computeXpEarned(
  baseExp: number,
  rewardsCount: number,
  encountersCount: number
): number {
  return baseExp + rewardsCount * 5 + encountersCount * 3;
}

export function rarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'rare':    return '#FF6B6B';
    case 'uncommon': return '#4ECDC4';
    case 'common':  default: return '#9CA3AF';
  }
}

export function rarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case 'rare':     return 'Hiếm';
    case 'uncommon': return 'Không phổ biến';
    case 'common':   return 'Phổ biến';
  }
}

// ============================================================================
// Storage keys
// ============================================================================

export const ADVENTURE_STORAGE_KEYS = {
  Current: 'adventure.current',
  History: 'adventure.history',
  UnlockedLocations: 'adventure.unlocked_locations',
  TotalAdventures: 'adventure.total',
} as const;
