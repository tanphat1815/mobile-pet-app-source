/**
 * Adventure dev exposes — Step 12c e2e
 *
 * Side-effect module for __DEV__ e2e testing.
 */

import { useAdventureStore } from '../stores/AdventureStore';
import {
  LOCATIONS,
  ENCOUNTER_EVENTS,
  canStartAdventure,
  generateEncounter,
  generateReward,
  computeXpEarned,
} from './adventure';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  // Catalog reads
  (globalThis as any).__ADV_LOCATION_COUNT__ = Object.keys(LOCATIONS).length;
  (globalThis as any).__ADV_LOCATION_IDS__ = Object.keys(LOCATIONS);
  (globalThis as any).__ADV_ENCOUNTER_COUNT__ = Object.keys(ENCOUNTER_EVENTS).length;

  // Store actions
  (globalThis as any).__ADV_START_ADVENTURE__ = (locationId: string) => {
    const result = useAdventureStore.getState().startAdventure(locationId, { level: 20, energy: 100 });
    return result;
  };
  (globalThis as any).__ADV_COMPLETE_ADVENTURE__ = () => {
    const result = useAdventureStore.getState().completeAdventure({ level: 20, energy: 100 });
    return result;
  };
  (globalThis as any).__ADV_CANCEL_ADVENTURE__ = () => {
    useAdventureStore.getState().cancelAdventure();
  };
  (globalThis as any).__ADV_GENERATE_ENCOUNTER__ = () => {
    useAdventureStore.getState().generateEncounterEvent();
    const adv = useAdventureStore.getState().currentAdventure;
    return adv?.encounters[adv.encounters.length - 1] ?? null;
  };
  (globalThis as any).__ADV_GENERATE_REWARD__ = () => {
    useAdventureStore.getState().generateRewardEvent();
    const adv = useAdventureStore.getState().currentAdventure;
    return adv?.rewards[adv.rewards.length - 1] ?? null;
  };
  (globalThis as any).__ADV_GET_HISTORY_LEN__ = () => useAdventureStore.getState().history.length;

  // Helpers
  (globalThis as any).__ADV_CAN_START__ = (locationId: string) => {
    const check = canStartAdventure(locationId, { level: 20, energy: 100 }, 'sunny', null, ['park', 'beach', 'forest', 'city', 'mountain']);
    return check;
  };

  // Mirror to window
  if (typeof window !== 'undefined') {
    const w = window as any;
    w.__ADV_LOCATION_COUNT__ = (globalThis as any).__ADV_LOCATION_COUNT__;
    w.__ADV_LOCATION_IDS__ = (globalThis as any).__ADV_LOCATION_IDS__;
    w.__ADV_ENCOUNTER_COUNT__ = (globalThis as any).__ADV_ENCOUNTER_COUNT__;
    w.__ADV_START_ADVENTURE__ = (globalThis as any).__ADV_START_ADVENTURE__;
    w.__ADV_COMPLETE_ADVENTURE__ = (globalThis as any).__ADV_COMPLETE_ADVENTURE__;
    w.__ADV_CANCEL_ADVENTURE__ = (globalThis as any).__ADV_CANCEL_ADVENTURE__;
    w.__ADV_GENERATE_ENCOUNTER__ = (globalThis as any).__ADV_GENERATE_ENCOUNTER__;
    w.__ADV_GENERATE_REWARD__ = (globalThis as any).__ADV_GENERATE_REWARD__;
    w.__ADV_GET_HISTORY_LEN__ = (globalThis as any).__ADV_GET_HISTORY_LEN__;
    w.__ADV_CAN_START__ = (globalThis as any).__ADV_CAN_START__;
  }
}
