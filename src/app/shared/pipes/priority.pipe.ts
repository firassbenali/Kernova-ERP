import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

@Pipe({ name: 'priority', standalone: true })
export class PriorityPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return LABELS[value] ?? value.replace(/_/g, ' ');
  }
}
