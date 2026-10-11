import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RentalUnit } from '../types/unit';
import { useBuildingsStore } from './buildingsStore';
interface UnitsState { units: RentalUnit[]; addUnit: (unit: RentalUnit) => void; updateUnit: (unitId: string, updates: Partial<RentalUnit>) => void; deleteUnit: (unitId: string) => void; }
export const useUnitsStore = create<UnitsState>()(persist((set, get) => ({
 units: [], addUnit: (unit) => { const building = useBuildingsStore.getState().getBuildingById(unit.buildingId); if (!building) throw new Error('Building is required'); const unitNumber = unit.unitNumber.trim(); if (!unitNumber) throw new Error('Unit number is required'); if (get().units.some((x) => x.buildingId === unit.buildingId && x.unitNumber.trim().toLowerCase() === unitNumber.toLowerCase())) throw new Error(`${unitNumber} already exists in ${building.name}`); set((s) => ({ units: [{ ...unit, unitNumber }, ...s.units] })); },
 updateUnit: (id, updates) => set((s) => ({ units: s.units.map((u) => u.id === id ? { ...u, ...updates } : u) })),
 deleteUnit: (id) => set((s) => ({ units: s.units.filter((u) => u.id !== id) })),
}), { name: 'rm-units', version: 2, storage: createJSONStorage(() => AsyncStorage), migrate: (state, version) => version < 2 ? { units: [] } : state }));
