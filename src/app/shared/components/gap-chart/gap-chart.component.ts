import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface GapData {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  currentLevelLabel: string;
  targetLevelLabel: string;
  gap: number;
  gapClass: 'primary' | 'accent' | 'warn';
}

const LEVEL_LABELS = ['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const LEVEL_COLORS = ['', '#6B7280', '#1B3A6B', '#9C27B0', '#16A34A'];

@Component({
  selector: 'app-gap-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gap-chart">
      @if (data().length === 0) {
        <div class="gap-chart__empty">
          <div class="empty-icon">📊</div>
          <p>No gaps to visualize</p>
          <small>Set target levels higher than current to see gap analysis</small>
        </div>
      } @else {
        <div class="gap-chart__header">
          <h3>Gap Visualization</h3>
          <div class="gap-chart__legend">
            <span class="legend-item">
              <span class="legend-color" style="background: #3B82F6;"></span>
              Current
            </span>
            <span class="legend-item">
              <span class="legend-color" style="background: #F59E0B;"></span>
              Target
            </span>
          </div>
        </div>

        <!-- Skill Selector -->
        @if (data().length > 1) {
          <div class="skill-selector">
            <label>Select Skill:</label>
            <select 
              [(ngModel)]="selectedSkillName" 
              (ngModelChange)="onSkillChange($event)"
              class="skill-select">
              @for (item of data(); track item.skillName) {
                <option [value]="item.skillName">{{ item.skillName }} (Gap: +{{ item.gap }} level{{ item.gap > 1 ? 's' : '' }})</option>
              }
            </select>
          </div>
        }

        <!-- Chart for Selected Skill -->
        @if (selectedSkill()) {
          <div class="selected-skill-chart" [class]="selectedSkill().gapClass">
            <div class="skill-title">
              <span class="skill-name">{{ selectedSkill().skillName }}</span>
              <span class="gap-badge" [class]="selectedSkill().gapClass">
                +{{ selectedSkill().gap }} level{{ selectedSkill().gap > 1 ? 's' : '' }}
              </span>
            </div>

            <div class="bars-container">
              <!-- Current Level Bar -->
              <div class="bar-wrapper">
                <div class="bar-label-wrapper">
                  <span class="bar-label">Current Level</span>
                  <span class="level-badge current" [style.background]="LEVEL_COLORS[selectedSkill().currentLevel]">
                    {{ selectedSkill().currentLevelLabel }}
                  </span>
                </div>
                <div class="bar current" [style.width.%]="selectedSkill().currentLevel * 25"></div>
              </div>

              <!-- Target Level Bar -->
              <div class="bar-wrapper">
                <div class="bar-label-wrapper">
                  <span class="bar-label">Target Level</span>
                  <span class="level-badge target" [style.background]="LEVEL_COLORS[selectedSkill().targetLevel]">
                    {{ selectedSkill().targetLevelLabel }}
                  </span>
                </div>
                <div class="bar target" [style.width.%]="selectedSkill().targetLevel * 25"></div>
              </div>

              
            </div>

            <!-- Level Scale -->
            <div class="level-scale">
              <span class="scale-label" *ngFor="let level of levels" [style.--color]="LEVEL_COLORS[level]">
                {{ LEVEL_LABELS[level] }}
              </span>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .gap-chart { width: 100%; }
    
    .gap-chart__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--color-text-muted);
      background: var(--color-surface);
      border: 1px dashed var(--color-border-light);
      border-radius: 12px;
      text-align: center;
    }
    
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .gap-chart__empty p { margin: 0 0 4px; font-weight: 500; font-size: 14px; }
    .gap-chart__empty small { font-size: 12px; }
    
    .gap-chart__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 0 8px;
    }
    
    .gap-chart__header h3 { margin: 0; font-size: 16px; font-weight: 600; }
    
    .gap-chart__legend {
      display: flex;
      gap: 24px;
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .legend-color {
      width: 16px;
      height: 4px;
      border-radius: 2px;
    }

    .skill-selector {
      margin-bottom: 20px;
      padding: 0 8px;
    }
    
    .skill-selector label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }
    
    .skill-select {
      width: 100%;
      max-width: 400px;
      padding: 10px 14px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font-size: 14px;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
    }
    
    .skill-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(27, 58, 107, 0.15);
    }

    .selected-skill-chart {
      background: var(--color-surface);
      border: 1px solid var(--color-border-light);
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.2s;
    }
    
    .selected-skill-chart.warn { border-color: #FCA5A5; }
    .selected-skill-chart.accent { border-color: #FCD34D; }
    .selected-skill-chart.primary { border-color: #86EFAC; }
    
    .skill-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--color-border-light);
    }
    
    .skill-name { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
    
    .gap-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: white;
    }
    
    .gap-badge.primary { background: #16A34A; }
    .gap-badge.accent { background: #D97706; color: #1F2937; }
    .gap-badge.warn { background: #DC2626; }
    
    .bars-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .bar-wrapper {
      position: relative;
    }
    
    .bar-label-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .bar-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }
    
    .level-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .level-badge.current { background: #3B82F6; }
    .level-badge.target { background: #F59E0B; }
    
    .bar {
      height: 40px;
      border-radius: 10px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .bar.current {
      background: linear-gradient(90deg, #3B82F6, #60A5FA);
      box-shadow: 0 2px 12px rgba(59, 130, 246, 0.35);
    }
    
    .bar.target {
      background: linear-gradient(90deg, #F59E0B, #FBBF24);
      box-shadow: 0 2px 12px rgba(245, 158, 11, 0.35);
    }
    
    
    
    .level-scale {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      padding: 0 8px;
      font-size: 11px;
      color: var(--color-text-muted);
    }
    
    .scale-label {
      position: relative;
      text-align: center;
      flex: 1;
    }
    
    .scale-label::before {
      content: '';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color);
    }
    
    .gap-chart__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--color-text-muted);
      background: var(--color-surface);
      border: 1px dashed var(--color-border-light);
      border-radius: 12px;
      text-align: center;
    }
    
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .gap-chart__empty p { margin: 0 0 4px; font-weight: 500; font-size: 14px; }
    .gap-chart__empty small { font-size: 12px; }
  `],
})
export class GapChartComponent {
  @Input() gapData: { skillName: string; currentLevel: number; targetLevel: number }[] = [];

  LEVEL_LABELS = LEVEL_LABELS;
  LEVEL_COLORS = LEVEL_COLORS;
  levels = [1, 2, 3, 4];

  selectedSkillName = signal<string>('');

  data = computed<GapData[]>(() => this.gapData
    .filter(d => d.targetLevel > 0 && d.targetLevel > d.currentLevel)
    .map(d => ({
      skillName: d.skillName,
      currentLevel: d.currentLevel,
      targetLevel: d.targetLevel,
      currentLevelLabel: LEVEL_LABELS[d.currentLevel] || 'N/A',
      targetLevelLabel: LEVEL_LABELS[d.targetLevel] || 'N/A',
      gap: d.targetLevel - d.currentLevel,
      gapClass: (() => {
        const gap = d.targetLevel - d.currentLevel;
        if (gap >= 3) return 'warn';
        if (gap >= 2) return 'accent';
        return 'primary';
      })()
    })));

  selectedSkill = computed(() => {
    if (!this.selectedSkillName()) return this.data()[0] || null;
    return this.data().find(d => d.skillName === this.selectedSkillName()) || this.data()[0] || null;
  });

  onSkillChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedSkillName.set(select.value);
  }
}