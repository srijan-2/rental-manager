import { Building } from '../types/building';
import { RentalUnit } from '../types/unit';
export function formatUnitLabel(unit: RentalUnit, building?: Building): string {
  return `${building?.name ?? 'Unknown building'} · ${unit.unitNumber}${unit.archivedAt ? ' (archived)' : ''}`;
}
