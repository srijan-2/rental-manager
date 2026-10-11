import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RentalUnit, UnitNote } from '../types/unit';
import { useBuildingsStore } from './buildingsStore';
interface UnitsState {
  units: RentalUnit[];
  addUnit: (unit: RentalUnit) => void;
  updateUnit: (unitId: string, updates: Partial<RentalUnit>) => void;
  addUnitNote: (unitId: string, text: string) => void;
  updateUnitNote: (unitId: string, noteId: string, text: string) => void;
  deleteUnitNote: (unitId: string, noteId: string) => void;
  deleteUnit: (unitId: string) => void;
}
export const useUnitsStore = create<UnitsState>()(
  persist(
    (set, get) => ({
      units: [],
      addUnit: (unit) => {
        const building = useBuildingsStore.getState().getBuildingById(unit.buildingId);
        if (!building) throw new Error('Building is required');
        const unitNumber = unit.unitNumber.trim();
        if (!unitNumber) throw new Error('Unit number is required');
        if (
          get().units.some(
            (x) =>
              x.buildingId === unit.buildingId &&
              x.unitNumber.trim().toLowerCase() === unitNumber.toLowerCase()
          )
        )
          throw new Error(`${unitNumber} already exists in ${building.name}`);
        set((s) => ({ units: [{ ...unit, unitNumber }, ...s.units] }));
      },
      updateUnit: (id, updates) =>
        set((s) => ({ units: s.units.map((u) => (u.id === id ? { ...u, ...updates } : u)) })),
      addUnitNote: (unitId, text) => {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        const now = new Date().toISOString();
        set((s) => ({
          units: s.units.map((u) =>
            u.id === unitId
              ? {
                  ...u,
                  notes: [
                    ...(u.notes ?? []),
                    { id: `note-${Date.now()}`, text: trimmedText, createdAt: now },
                  ],
                }
              : u
          ),
        }));
      },
      updateUnitNote: (unitId, noteId, text) => {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        const now = new Date().toISOString();
        set((s) => ({
          units: s.units.map((u) =>
            u.id === unitId
              ? {
                  ...u,
                  notes: (u.notes ?? []).map((note) =>
                    note.id === noteId ? { ...note, text: trimmedText, updatedAt: now } : note
                  ),
                }
              : u
          ),
        }));
      },
      deleteUnitNote: (unitId, noteId) =>
        set((s) => ({
          units: s.units.map((u) =>
            u.id === unitId
              ? { ...u, notes: (u.notes ?? []).filter((note) => note.id !== noteId) }
              : u
          ),
        })),
      deleteUnit: (id) => set((s) => ({ units: s.units.filter((u) => u.id !== id) })),
    }),
    {
      name: 'rm-units',
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (state, version) => {
        if (version >= 5) return state;
        const persisted = state as Record<string, unknown> & {
          units?: Array<
            Omit<RentalUnit, 'notes'> & {
              notes?: string | UnitNote[];
            }
          >;
        };
        let units = persisted.units ?? [];
        const now = new Date().toISOString();
        if (version < 4) {
          units = units.map((unit) => {
            if (typeof unit.notes !== 'string') return unit;
            const text = unit.notes.trim();
            return {
              ...unit,
              notes: text ? [{ id: `note-${Date.now()}`, text, createdAt: now }] : [],
            };
          });
        }
        if (version < 5) {
          const legacyBalanceKey = ['prepaid', 'Electricity', 'Balance'].join('');
          units = units.map((unit) => {
            const migratedUnit = { ...unit } as Record<string, unknown>;
            delete migratedUnit[legacyBalanceKey];
            return migratedUnit as typeof unit;
          });
        }
        return { ...persisted, units };
      },
    }
  )
);
