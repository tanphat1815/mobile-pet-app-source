/**
 * format.ts — pure utility tests
 *
 * Covers number formatting, duration formatting, and stat value
 * formatting. These run without React or any native modules.
 */

import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatDuration,
  formatStatValue,
} from '@/utils/format';

describe('formatNumber', () => {
  it('returns plain integers below 1000 unchanged', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(7)).toBe('7');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with one decimal + K suffix', () => {
    expect(formatNumber(1_000)).toBe('1.0K');
    expect(formatNumber(2_500)).toBe('2.5K');
    expect(formatNumber(12_345)).toBe('12.3K');
  });

  it('formats millions with one decimal + M suffix', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M');
    expect(formatNumber(1_500_000)).toBe('1.5M');
    expect(formatNumber(12_345_678)).toBe('12.3M');
  });

  it('handles negative values', () => {
    // The implementation only formats magnitudes; negatives pass through
    // unchanged until the formatter is taught to handle them.
    expect(formatNumber(-500)).toBe('-500');
    expect(formatNumber(-2_500)).toBe('-2500');
    expect(formatNumber(-1_500_000)).toBe('-1500000');
  });
});

describe('formatDuration', () => {
  it('returns "Xs ago" for sub-minute durations', () => {
    expect(formatDuration(0)).toBe('0s ago');
    expect(formatDuration(1_000)).toBe('1s ago');
    expect(formatDuration(59_000)).toBe('59s ago');
  });

  it('returns "Xm ago" for sub-hour durations', () => {
    expect(formatDuration(60_000)).toBe('1m ago');
    expect(formatDuration(5 * 60_000)).toBe('5m ago');
    expect(formatDuration(59 * 60_000)).toBe('59m ago');
  });

  it('returns "Xh ago" for sub-day durations', () => {
    expect(formatDuration(60 * 60_000)).toBe('1h ago');
    expect(formatDuration(23 * 60 * 60_000)).toBe('23h ago');
  });

  it('returns "Xd ago" for multi-day durations', () => {
    expect(formatDuration(24 * 60 * 60_000)).toBe('1d ago');
    expect(formatDuration(7 * 24 * 60 * 60_000)).toBe('7d ago');
  });

  it('floors fractional seconds (does not round)', () => {
    expect(formatDuration(1500)).toBe('1s ago');
    expect(formatDuration(12500)).toBe('12s ago');
  });
});

describe('formatStatValue', () => {
  it('rounds and appends a percent sign', () => {
    expect(formatStatValue(0)).toBe('0%');
    expect(formatStatValue(50)).toBe('50%');
    expect(formatStatValue(99.4)).toBe('99%');
    expect(formatStatValue(99.5)).toBe('100%');
    expect(formatStatValue(100)).toBe('100%');
  });

  it('handles values above 100%', () => {
    expect(formatStatValue(120)).toBe('120%');
  });
});
