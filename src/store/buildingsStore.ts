import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Building } from '../types/building';
interface BuildingsState {
  buildings: Building[];
  addBuilding: (name: string) => Building;
  updateBuilding: (id: string, name: string) => Building;
  deleteBuilding: (id: string) => void;
  getBuildingById: (id: string) => Building | undefined;
}
export const useBuildingsStore = create<BuildingsState>()(
  persist(
    (set, get) => ({
      buildings: [],
      addBuilding: (rawName) => {
        const name = rawName.trim();
        if (!name) throw new Error('Building name is required');
        if (get().buildings.some((b) => b.name.toLowerCase() === name.toLowerCase()))
          throw new Error('A building with this name already exists');
        const building = { id: `building-${Date.now()}`, name };
        set((state) => ({ buildings: [...state.buildings, building] }));
        return building;
      },
      updateBuilding: (id, rawName) => {
        const name = rawName.trim();
        if (!name) throw new Error('Building name is required');
        if (get().buildings.some((b) => b.id !== id && b.name.toLowerCase() === name.toLowerCase()))
          throw new Error('A building with this name already exists');
        const building = get().buildings.find((b) => b.id === id);
        if (!building) throw new Error('Building was not found');
        set((state) => ({
          buildings: state.buildings.map((item) => (item.id === id ? { ...item, name } : item)),
        }));
        return { ...building, name };
      },
      deleteBuilding: (id) =>
        set((state) => ({ buildings: state.buildings.filter((b) => b.id !== id) })),
      getBuildingById: (id) => get().buildings.find((b) => b.id === id),
    }),
    {
      name: 'rm-buildings',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState, version) => (version < 2 ? { buildings: [] } : persistedState),
    }
  )
);
