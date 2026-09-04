/**
 * Settings Categories — Step 11
 *
 * Mobile-adapted subset of the desktop `sidebar-categories.js`.
 * Groups sections into GENERAL / PET / SOCIAL / ADVANCED. Each section
 * contains rows that can be rendered inline or in a drill-down.
 *
 * Step 11 — xem docs/steps/step-11-settings-restructure.md.
 */

export type SettingRowKind =
  | 'toggle'
  | 'value'
  | 'navigation'
  | 'destructive'
  | 'action';

export interface SettingSearchableRow {
  id: string;
  icon: string;
  label: string;
  description?: string;
  keywords?: string[]; // extra search tokens
  kind: SettingRowKind;
  sectionId: string;
}

export interface SettingSectionMeta {
  id: string;
  title: string;
  rows: SettingSearchableRow[];
}

export interface SettingGroupMeta {
  id: 'GENERAL' | 'PET' | 'SOCIAL' | 'ADVANCED';
  label: string;
  sections: SettingSectionMeta[];
}

/**
 * Flatten all rows across sections (useful for search).
 */
export function flattenRows(rows: SettingSearchableRow[]): SettingSearchableRow[] {
  const seen = new Set<string>();
  const out: SettingSearchableRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

/**
 * Build a row index keyed by lowercased tokens (label, description,
 * keywords). Used by SettingsSearch to filter results fast.
 */
export function buildSearchIndex(
  groups: SettingGroupMeta[]
): Map<string, SettingSearchableRow[]> {
  const idx = new Map<string, SettingSearchableRow[]>();
  const add = (token: string, row: SettingSearchableRow) => {
    const k = token.toLowerCase();
    const list = idx.get(k) ?? [];
    list.push(row);
    idx.set(k, list);
  };
  for (const group of groups) {
    for (const section of group.sections) {
      for (const row of section.rows) {
        add(row.label, row);
        if (row.description) add(row.description, row);
        if (row.keywords) {
          for (const kw of row.keywords) add(kw, row);
        }
      }
    }
  }
  return idx;
}

/**
 * Filter rows by query (case-insensitive). Empty query returns all
 * rows (preserving order from the original groups).
 */
export function filterRows(
  groups: SettingGroupMeta[],
  query: string
): SettingGroupMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  const tokens = q.split(/\s+/).filter(Boolean);
  const matches = (row: SettingSearchableRow): boolean => {
    const haystack = [
      row.label,
      row.description ?? '',
      ...(row.keywords ?? []),
    ]
      .join('\n')
      .toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  };
  const filteredGroups: SettingGroupMeta[] = [];
  for (const g of groups) {
    const sections: SettingSectionMeta[] = [];
    for (const s of g.sections) {
      const rows = s.rows.filter(matches);
      if (rows.length > 0) sections.push({ ...s, rows });
    }
    if (sections.length > 0) filteredGroups.push({ ...g, sections });
  }
  return filteredGroups;
}

/**
 * Returns true when the query matches a section title (so the
 * section can still be displayed even when no rows match).
 */
export function sectionMatchesTitle(
  section: SettingSectionMeta,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  return q !== '' && section.title.toLowerCase().includes(q);
}

/**
 * Count of all rows across the groups tree.
 */
export function totalRowCount(groups: SettingGroupMeta[]): number {
  return groups.reduce(
    (sum, g) => sum + g.sections.reduce((s, sec) => s + sec.rows.length, 0),
    0
  );
}

/**
 * Count rows matching a query across all groups.
 */
export function matchCount(
  groups: SettingGroupMeta[],
  query: string
): number {
  return totalRowCount(filterRows(groups, query));
}

/**
 * Default value for `expandedGroups` storage. GENERAL is open by default;
 * others are closed to reduce first-render noise.
 */
export const DEFAULT_EXPANDED_GROUPS: Record<string, boolean> = {
  GENERAL: true,
  PET: false,
  SOCIAL: false,
  ADVANCED: false,
};

export const GROUP_ORDER: SettingGroupMeta['id'][] = [
  'GENERAL',
  'PET',
  'SOCIAL',
  'ADVANCED',
];

// ============================================================================
// Dev expose (Step 11) — e2e tests
// ============================================================================
// We avoid referencing SETTINGS_GROUPS directly here to keep this file
// pure (no circular import). The host module (settingsGroups.ts) also
// installs the same exposes for window-side access.
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__SETTINGS_FILTER__ = filterRows;
  (globalThis as any).__SETTINGS_DEFAULT_EXPANDED__ = DEFAULT_EXPANDED_GROUPS;
  (globalThis as any).__SETTINGS_GROUP_ORDER__ = GROUP_ORDER;
  if (typeof window !== 'undefined') {
    (window as any).__SETTINGS_FILTER__ = (globalThis as any).__SETTINGS_FILTER__;
    (window as any).__SETTINGS_DEFAULT_EXPANDED__ = (globalThis as any).__SETTINGS_DEFAULT_EXPANDED__;
    (window as any).__SETTINGS_GROUP_ORDER__ = (globalThis as any).__SETTINGS_GROUP_ORDER__;
  }
}
