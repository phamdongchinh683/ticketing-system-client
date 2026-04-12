import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { DashboardTrendChartKind } from '../../../../data/interfaces/dashboard';
import { DashboardChartComponent } from '../dashboard-chart/dashboard-chart.component';

@Component({
  selector: 'app-dashboard-trend-chart-panel',
  standalone: true,
  imports: [CommonModule, DashboardChartComponent],
  templateUrl: './dashboard-trend-chart-panel.component.html',
  styleUrl: './dashboard-trend-chart-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTrendChartPanelComponent {
  @Input({ required: true }) chartTitle!: string;
  @Input({ required: true }) labels!: string[];
  @Input({ required: true }) datasets!: { label: string; data: number[]; backgroundColor?: string }[];
  @Input({ required: true }) loading!: boolean;
  @Input({ required: true }) chartKind!: DashboardTrendChartKind;
  @Input({ required: true }) stacked!: boolean;
  @Input({ required: true }) total!: number;
  /** Matches `app-dashboard-chart` yFormat — drives summary formatting. */
  @Input() summaryFormat: 'number' | 'currency' = 'number';
}
