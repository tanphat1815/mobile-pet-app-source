/**
 * Pet Tricks dev exposes — Step 12e e2e
 *
 * Side-effect module for __DEV__ e2e testing.
 */

import {
  TRICKS,
  listAllTricks,
  listTricksByCategory,
  getTrickById,
  TRICK_CATEGORIES,
  TRICK_CATEGORY_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  PERFORM_COOLDOWN_MS,
  MAX_TREATS,
  ensureTricksStructure,
  getLearnedTricks,
  getAvailableTricks,
  getRequiredAttempts,
  learnTrick,
  practiceTrick,
  performTrick,
  parseCommand,
  type TrickDef,
  type TrickCategory,
  type LifeStage,
  type PetStatsWithTricks,
} from './tricks';
import { useTricksStore } from '../stores/TricksStore';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  // Catalog reads
  (globalThis as any).__TRICK_COUNT__ = Object.keys(TRICKS).length;
  (globalThis as any).__TRICK_IDS__ = Object.keys(TRICKS);
  (globalThis as any).__TRICK_CATEGORIES__ = TRICK_CATEGORIES;
  (globalThis as any).__TRICK_CATEGORY_LABELS__ = TRICK_CATEGORY_LABELS;
  (globalThis as any).__STAGE_LABELS__ = STAGE_LABELS;
  (globalThis as any).__PERFORM_COOLDOWN_MS__ = PERFORM_COOLDOWN_MS;
  (globalThis as any).__MAX_TREATS__ = MAX_TREATS;

  // Helpers
  (globalThis as any).__TRICK_GET_BY_ID__ = (id: string) => getTrickById(id);
  (globalThis as any).__TRICK_LIST_BY_CATEGORY__ = (cat: TrickCategory) => listTricksByCategory(cat);
  (globalThis as any).__TRICK_REQUIRED_ATTEMPTS__ = (difficulty: number) =>
    getRequiredAttempts(difficulty);

  // Store actions
  (globalThis as any).__TRICK_SET_LEVEL__ = (level: number) => {
    useTricksStore.getState().setPetStats({ level });
  };
  (globalThis as any).__TRICK_SET_STAGE__ = (stage: LifeStage) => {
    useTricksStore.getState().setStage(stage);
  };
  (globalThis as any).__TRICK_LEARN__ = (id: string) =>
    useTricksStore.getState().learnTrickAction(id);
  (globalThis as any).__TRICK_PRACTICE__ = (id: string, useTreat = false) =>
    useTricksStore.getState().practiceTrickAction(id, useTreat);
  (globalThis as any).__TRICK_PERFORM__ = (id: string) =>
    useTricksStore.getState().performTrickAction(id);
  (globalThis as any).__TRICK_COMMAND__ = (cmd: string) =>
    useTricksStore.getState().performCommandAction(cmd);
  (globalThis as any).__TRICK_CANCEL__ = () => useTricksStore.getState().cancelTraining();
  (globalThis as any).__TRICK_ADD_TREATS__ = (n: number) => useTricksStore.getState().addTreats(n);

  // Getters
  (globalThis as any).__TRICK_GET_LEARNED__ = () => useTricksStore.getState().learnedTricks;
  (globalThis as any).__TRICK_GET_AVAILABLE__ = () => useTricksStore.getState().availableTricks;
  (globalThis as any).__TRICK_GET_TREATS__ = () => useTricksStore.getState().petStats.trainingStats?.treatsUsed ?? 0;
  (globalThis as any).__TRICK_GET_TRAINING__ = () =>
    useTricksStore.getState().petStats.tricks?.training ?? null;
  (globalThis as any).__TRICK_GET_TOTAL_PERFORMED__ = () =>
    useTricksStore.getState().petStats.tricks?.totalTricksPerformed ?? 0;

  // Mirror to window
  if (typeof window !== 'undefined') {
    const w = window as any;
    w.__TRICK_COUNT__ = (globalThis as any).__TRICK_COUNT__;
    w.__TRICK_IDS__ = (globalThis as any).__TRICK_IDS__;
    w.__TRICK_CATEGORIES__ = (globalThis as any).__TRICK_CATEGORIES__;
    w.__TRICK_CATEGORY_LABELS__ = (globalThis as any).__TRICK_CATEGORY_LABELS__;
    w.__STAGE_LABELS__ = (globalThis as any).__STAGE_LABELS__;
    w.__PERFORM_COOLDOWN_MS__ = (globalThis as any).__PERFORM_COOLDOWN_MS__;
    w.__MAX_TREATS__ = (globalThis as any).__MAX_TREATS__;
    w.__TRICK_GET_BY_ID__ = (globalThis as any).__TRICK_GET_BY_ID__;
    w.__TRICK_LIST_BY_CATEGORY__ = (globalThis as any).__TRICK_LIST_BY_CATEGORY__;
    w.__TRICK_REQUIRED_ATTEMPTS__ = (globalThis as any).__TRICK_REQUIRED_ATTEMPTS__;
    w.__TRICK_SET_LEVEL__ = (globalThis as any).__TRICK_SET_LEVEL__;
    w.__TRICK_SET_STAGE__ = (globalThis as any).__TRICK_SET_STAGE__;
    w.__TRICK_LEARN__ = (globalThis as any).__TRICK_LEARN__;
    w.__TRICK_PRACTICE__ = (globalThis as any).__TRICK_PRACTICE__;
    w.__TRICK_PERFORM__ = (globalThis as any).__TRICK_PERFORM__;
    w.__TRICK_COMMAND__ = (globalThis as any).__TRICK_COMMAND__;
    w.__TRICK_CANCEL__ = (globalThis as any).__TRICK_CANCEL__;
    w.__TRICK_ADD_TREATS__ = (globalThis as any).__TRICK_ADD_TREATS__;
    w.__TRICK_GET_LEARNED__ = (globalThis as any).__TRICK_GET_LEARNED__;
    w.__TRICK_GET_AVAILABLE__ = (globalThis as any).__TRICK_GET_AVAILABLE__;
    w.__TRICK_GET_TREATS__ = (globalThis as any).__TRICK_GET_TREATS__;
    w.__TRICK_GET_TRAINING__ = (globalThis as any).__TRICK_GET_TRAINING__;
    w.__TRICK_GET_TOTAL_PERFORMED__ = (globalThis as any).__TRICK_GET_TOTAL_PERFORMED__;
  }
}
