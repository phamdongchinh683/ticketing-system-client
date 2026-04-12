import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { DashboardTimeType } from '../../../../data/interfaces/dashboard';

@Component({
  selector: 'app-dashboard-charts-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-charts-toolbar.component.html',
  styleUrl: './dashboard-charts-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardChartsToolbarComponent {
  @Input({ required: true }) chartType!: DashboardTimeType;
  @Input({ required: true }) selectedYear!: number;
  @Input({ required: true }) yearOptions: number[] = [];

  @Output() chartTypeChange = new EventEmitter<DashboardTimeType>();
  @Output() selectedYearChange = new EventEmitter<number>();

  emitChartType(value: DashboardTimeType): void {
    this.chartTypeChange.emit(value);
  }

  emitYear(value: number): void {
    this.selectedYearChange.emit(value);
  }
}
