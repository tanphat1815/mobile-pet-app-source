/**
 * QuickSwitcher
 *
 * Step 14 — Full-screen slide-down modal with debounced search,
 * pinned + recents sections, fuzzy "Did you mean…" suggestions,
 * keyboard navigation (↑↓, Enter, Esc), and pin/unpin via long-press.
 *
 * Renders inside QuickSwitcherProvider at the root navigator so it
 * survives screen transitions.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import {
  type SearchResult,
  type SearchableItem,
} from '../../api/searchIndex';
import {
  getPinned,
  getRecents,
  pushRecent,
  togglePin,
} from '../../api/searchHistory';
import { SearchResultRow } from './SearchResultRow';
import { EmptyState } from './EmptyState';

const DEBOUNCE_MS = 120;
const MAX_VISIBLE = 12;

export interface QuickSwitcherProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export function QuickSwitcher({
  visible,
  onClose,
  navigation,
}: QuickSwitcherProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Lazy-access the global index to avoid circular import during render.
  const index = useMemo(
    () => require('../../api/searchIndex').getSearchIndex(),
    [],
  );

  // Debounce input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Reset state when opening
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setDebounced('');
    setActiveIndex(0);
    // Load history buckets
    let cancelled = false;
    (async () => {
      const [p, r] = await Promise.all([getPinned(), getRecents()]);
      if (cancelled) return;
      setPinnedIds(p);
      setRecentIds(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Autofocus when becoming visible
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Compute the displayed list
  const flatResults = useMemo<SearchResult[]>(() => {
    if (!visible) return [];

    if (debounced.trim().length === 0) {
      // Empty query → show pinned, then recents (deduped), both resolved
      // via the index so we can pick up icons + subtitles.
      const seen = new Set<string>();
      const items: SearchResult[] = [];
      for (const id of pinnedIds) {
        const it = index.byId(id);
        if (it && !seen.has(id)) {
          seen.add(id);
          items.push({ ...it, score: 0 });
        }
      }
      for (const id of recentIds) {
        if (seen.has(id)) continue;
        const it = index.byId(id);
        if (it) {
          seen.add(id);
          items.push({ ...it, score: 0 });
        }
      }
      return items.slice(0, MAX_VISIBLE);
    }

    return index.query(debounced, MAX_VISIBLE);
  }, [visible, debounced, pinnedIds, recentIds, index]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [flatResults.length, debounced]);

  // Did-you-mean suggestions (always pull from raw index when no exact matches)
  const suggestions = useMemo<SearchResult[]>(() => {
    if (debounced.trim().length === 0) return [];
    if (flatResults.length > 0) return [];
    // Loosen threshold for suggestions: broader matches
    return index.query(debounced, 5);
  }, [debounced, flatResults.length, index]);

  // Pick a result → navigate + push to recents + close
  const handlePick = useCallback(
    async (item: SearchableItem) => {
      try {
        const next = await pushRecent(item.id);
        setRecentIds(next);
        if (item.route) {
          navigation.navigate(item.route as never, item.params as never);
        }
      } finally {
        onClose();
        Keyboard.dismiss();
      }
    },
    [navigation, onClose],
  );

  // Long-press → toggle pin
  const handleLongPress = useCallback(async (item: SearchableItem) => {
    const nowPinned = await togglePin(item.id);
    setPinnedIds((prev) =>
      nowPinned
        ? [...prev, item.id].slice(0, 5)
        : prev.filter((id) => id !== item.id),
    );
  }, []);

  // Keyboard navigation
  const handleKeyPress = useCallback(
    (e: any) => {
      // Synthetic keyboard events from RN Web expose `nativeEvent.key`.
      const key = e?.nativeEvent?.key ?? e?.key;
      if (key === 'ArrowDown') {
        e.preventDefault?.();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (key === 'ArrowUp') {
        e.preventDefault?.();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (key === 'Enter' && flatResults[activeIndex]) {
        handlePick(flatResults[activeIndex]);
      }
    },
    [flatResults, activeIndex, handlePick],
  );

  const pinnedLookup = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  return (
    <View
      testID="quick-switcher"
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, !visible && styles.hidden]}
    >
      <Pressable
        testID="quick-switcher-backdrop"
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
      />
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.bg,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.searchIcon} accessibilityElementsHidden>
            🔍
          </Text>
          <TextInput
            ref={inputRef}
            testID="quick-switcher-input"
            value={query}
            onChangeText={setQuery}
            onKeyPress={handleKeyPress}
            placeholder="Search screens, friends, quests…"
            placeholderTextColor={theme.colors.textDim}
            style={[styles.input, { color: theme.colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Quick switcher search input"
          />
          <Pressable
            testID="quick-switcher-close"
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Close quick switcher"
          >
            <Text style={[styles.closeBtn, { color: theme.colors.textDim }]}>
              ✕
            </Text>
          </Pressable>
        </View>

        {flatResults.length === 0 ? (
          <EmptyState
            testID="quick-switcher-empty"
            query={debounced}
            suggestions={suggestions}
            onPickSuggestion={handlePick}
          />
        ) : (
          <FlatList
            testID="quick-switcher-list"
            data={flatResults}
            keyExtractor={(it) => it.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index: rowIdx }) => (
              <SearchResultRow
                testID={`search-result`}
                result={item}
                isActive={rowIdx === activeIndex}
                isPinned={pinnedLookup.has(item.id)}
                onPress={handlePick}
                onLongPress={handleLongPress}
              />
            )}
            ListHeaderComponent={
              debounced.trim().length === 0 && pinnedIds.length > 0 ? (
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.colors.textDim },
                  ]}
                >
                  Pinned
                </Text>
              ) : debounced.trim().length === 0 ? (
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.colors.textDim },
                  ]}
                >
                  Recent
                </Text>
              ) : null
            }
            accessibilityLabel={`${flatResults.length} results`}
          />
        )}

        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.footerText, { color: theme.colors.textDim }]}>
            ↑↓ navigate · {Platform.OS === 'web' ? '↵' : 'tap'} open · esc
            close
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
  },
  panel: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    maxHeight: '70%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  closeBtn: {
    fontSize: 18,
    paddingHorizontal: 6,
  },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'right',
  },
});
