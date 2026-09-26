import { useSyncExternalStore } from 'react';
import { store, type GameState } from '../systems/GameStore';

export function useGame(): GameState {
  return useSyncExternalStore(store.subscribe, store.get);
}
