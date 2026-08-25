import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',
  ON_LEAVE: 'On Leave',
  BUSY: 'Busy',
};

@Pipe({ name: 'availability', standalone: true })
export class AvailabilityPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return LABELS[value] ?? value.replace(/_/g, ' ');
  }
}
