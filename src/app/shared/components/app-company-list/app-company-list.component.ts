import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Company } from '@app/data/interfaces/company';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-company-list.component.html',
  styleUrl: './app-company-list.component.css',
})
export class AppCompanyListComponent {
  @Input() companies: Company[] = [];
  @Output() editCompany = new EventEmitter<Company>();
  @Output() deleteCompany = new EventEmitter<Company>();
}
