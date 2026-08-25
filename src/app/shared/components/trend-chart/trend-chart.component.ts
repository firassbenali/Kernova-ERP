import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TrendPoint } from '../../../domain/models/performance.model';

interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
  count: number;
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  template: `
    <div class="trend-chart" #chartContainer>
      @if (points.length === 0) {
        <p class="trend-chart__empty">Not enough data to display a trend yet.</p>
      } @else {
        <svg [attr.viewBox]="'0 0 ' + viewBoxWidth + ' ' + viewBoxHeight" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Performance trend chart">
          <!-- background -->
          <rect class="chart-bg" x="0" y="0" [attr.width]="viewBoxWidth" [attr.height]="viewBoxHeight" rx="8"></rect>
          
          <!-- grid lines -->
          @for (g of gridLines; track g.y) {
            <line class="grid" [attr.x1]="padding.left" [attr.x2]="viewBoxWidth - padding.right"
                  [attr.y1]="g.y" [attr.y2]="g.y"></line>
            <text class="axis-label" [attr.x]="padding.left - 10" [attr.y]="g.y + 4" text-anchor="end">{{ g.value }}</text>
          }
          
          <!-- area -->
          @if (chartPoints.length > 1) {
            <polygon class="area" [attr.points]="areaPoints()"></polygon>
          }
          
          <!-- line -->
          <polyline class="line" [attr.points]="linePoints()"></polyline>
          
          <!-- points + labels -->
          @for (p of chartPoints; track p.label) {
            <circle class="dot" [attr.cx]="p.x" [attr.cy]="p.y" r="6"></circle>
            <text class="value-label" [attr.x]="p.x" [attr.y]="p.y - 16" text-anchor="middle">{{ p.value }}</text>
            <text class="axis-label" [attr.x]="p.x" [attr.y]="viewBoxHeight - 10" text-anchor="middle">{{ p.label }}</text>
          }
        </svg>
      }
    </div>
  `,
  styles: [`
    .trend-chart { width: 100%; height: 100%; min-height: 260px; }
    
    .trend-chart__empty {
      color: var(--color-text-muted);
      font-size: 14px;
      text-align: center;
      padding: 60px 0;
      margin: 0;
    }
    
    svg { width: 100%; height: 100%; display: block; }
    
    .chart-bg {
      fill: var(--color-surface);
    }
    
    .grid { 
      stroke: var(--color-border); 
      stroke-width: 1; 
      stroke-dasharray: 6 4; 
      opacity: 0.6;
    }
    
    .axis-label { 
      fill: var(--color-text-secondary); 
      font-size: 12px; 
      font-weight: 500;
    }
    
    .value-label { 
      fill: var(--color-primary); 
      font-size: 13px; 
      font-weight: 700; 
    }
    
    .line {
      fill: none;
      stroke: var(--color-primary);
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 2px 4px rgba(27, 58, 107, 0.3));
    }
    
    .area { 
      fill: rgba(27, 58, 107, 0.12); 
    }
    
    .dot { 
      fill: var(--color-primary); 
      stroke: white;
      stroke-width: 2;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
      transition: r 0.2s;
    }
    
    .dot:hover { r: 8; }
  `],
})
export class TrendChartComponent implements OnChanges {
  @Input() points: TrendPoint[] = [];

  viewBoxWidth = 900;
  viewBoxHeight = 350;
  padding = { top: 28, right: 36, bottom: 50, left: 60 };

  chartPoints: ChartPoint[] = [];

  get gridLines(): { y: number; value: number }[] {
    return [0, 20, 40, 60, 80, 100].map(value => ({
      value,
      y: this.scaleY(value),
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['points']) {
      this.chartPoints = this.mapPoints(this.points ?? []);
    }
  }

  private mapPoints(values: TrendPoint[]): ChartPoint[] {
    if (values.length === 0) return [];
    const innerWidth = this.viewBoxWidth - this.padding.left - this.padding.right;
    return values.map((point, index) => ({
      x:
        values.length === 1
          ? this.padding.left + innerWidth / 2
          : this.padding.left + (index / (values.length - 1)) * innerWidth,
      y: this.scaleY(point.averageScore ?? 0),
      label: point.periodLabel,
      value: Math.round((point.averageScore ?? 0) * 10) / 10,
      count: point.reviewCount,
    }));
  }

  private scaleY(score: number): number {
    const innerHeight = this.viewBoxHeight - this.padding.top - this.padding.bottom;
    const clamped = Math.max(0, Math.min(100, score));
    return this.viewBoxHeight - this.padding.bottom - (clamped / 100) * innerHeight;
  }

  linePoints(): string {
    return this.chartPoints.map(p => `${p.x},${p.y}`).join(' ');
  }

  areaPoints(): string {
    if (this.chartPoints.length === 0) return '';
    const baseline = this.viewBoxHeight - this.padding.bottom;
    const first = this.chartPoints[0];
    const last = this.chartPoints[this.chartPoints.length - 1];
    return `${first.x},${baseline} ${this.linePoints()} ${last.x},${baseline}`;
  }
}