/**
 * PetSpriteDebugProvider
 *
 * Mount ngay tại root App. Subscribe PetStore changes và expose
 * `window.__PET_FSM_DEBUG__` ngay cả khi pet chưa load → e2e tests có thể
 * inspect FSM state stable.
 *
 * Step 3 — xem docs/steps/step-03-animated-pet-sprite.md.
 */

import { useEffect, useRef } from 'react';
import { usePetStore } from '../../stores/PetStore';
import {
  resolvePetAnimationWithFallback,
} from '../../api/petFSM';
import type { Pet } from '../../api/petTypes';

interface DebugSnapshot {
  animKey: string;
  species: string;
  mood: string;
  hunger: number;
  happiness: number;
  energy: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __PET_FSM_DEBUG__: DebugSnapshot | undefined;
  // eslint-disable-next-line no-var
  var __MOBILE_PET__: any;
}

function buildSnapshot(pet: Pet | null, action?: string): DebugSnapshot {
  if (!pet) {
    return {
      animKey: 'idle',
      species: 'none',
      mood: 'none',
      hunger: 0,
      happiness: 0,
      energy: 0,
    };
  }
  const animKey = resolvePetAnimationWithFallback(
    pet,
    () => true,
    action as any
  );
  return {
    animKey,
    species: pet.species,
    mood: pet.mood,
    hunger: pet.stats.hunger,
    happiness: pet.stats.happiness,
    energy: pet.stats.energy,
  };
}

export function PetSpriteDebugProvider(): null {
  const pet = usePetStore((s) => s.pet);
  // Avoid re-publishing on every keystroke — only when pet actually changes
  const lastSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !(globalThis as any).__DEV__) return;
    const snapshot = buildSnapshot(pet);
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSnapshotRef.current) return;
    lastSnapshotRef.current = serialized;
    (globalThis as any).__PET_FSM_DEBUG__ = snapshot;
    if (typeof window !== 'undefined') {
      (window as any).__PET_FSM_DEBUG__ = snapshot;
    }
  }, [pet]);

  // Set up MOBILE_PET helpers once
  useEffect(() => {
    if (typeof globalThis === 'undefined' || !(globalThis as any).__DEV__) return;
    const existing = (globalThis as any).__MOBILE_PET__ || {};
    (globalThis as any).__MOBILE_PET__ = {
      ...existing,
      setPetMood: (mood: Pet['mood']) => {
        usePetStore.setState((s) => ({
          pet: s.pet ? { ...s.pet, mood } : null,
        }));
      },
      setPetStats: (stats: Partial<Pet['stats']>) => {
        usePetStore.setState((s) => ({
          pet: s.pet
            ? { ...s.pet, stats: { ...s.pet.stats, ...stats } }
            : null,
        }));
      },
      setPetSpecies: (species: Pet['species']) => {
        usePetStore.setState((s) => ({
          pet: s.pet ? { ...s.pet, species } : null,
        }));
      },
      setPetName: (name: string) => {
        usePetStore.setState((s) => ({
          pet: s.pet ? { ...s.pet, name } : null,
        }));
      },
      // Auto-create a fake pet cho e2e (nếu chưa có pet object)
      ensurePet: () => {
        const current = usePetStore.getState().pet;
        if (current) return current;
        const fakePet: Pet = {
          id: 'fake',
          ownerId: 'fake',
          name: 'TestPet',
          species: 'cat',
          mood: 'idle',
          stats: { hunger: 50, happiness: 50, energy: 50, xp: 0, level: 1, cleanliness: 50, health: 80 },
          updatedAt: Date.now(),
          emoji: '🐱',
        };
        usePetStore.setState({ pet: fakePet });
        return fakePet;
      },
    };
    if (typeof window !== 'undefined') {
      (window as any).__MOBILE_PET__ = (globalThis as any).__MOBILE_PET__;
    }
  }, []);

  return null;
}
