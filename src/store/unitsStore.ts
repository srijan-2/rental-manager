import { create } from 'zustand';
import { MOCK_UNITS } from '../data/mockUnits';
import { RentalUnit } from '../types/unit';

interface UnitsState {
  units: RentalUnit[];
  addUnit: (unit: RentalUnit) => void;
  updateUnit: (unitId: string, updates: Partial<RentalUnit>) => void;
  deleteUnit: (unitId: string) => void;
}

export const useUnitsStore = create<UnitsState>((set) => ({
  units: MOCK_UNITS,
  addUnit: (unit) =>
    set((state) => ({
      units: [unit, ...state.units],
    })),
  updateUnit: (unitId, updates) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId ? { ...unit, ...updates } : unit
      ),
    })),
  deleteUnit: (unitId) =>
    set((state) => ({
      units: state.units.filter((unit) => unit.id !== unitId),
    })),
}));
