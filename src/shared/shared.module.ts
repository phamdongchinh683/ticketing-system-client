import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from './components/app-button/app-button.component';
import { AppInputComponent } from './components/app-input/app-input.component';
import { AppNotificationComponent } from './components/app-notification/app-notification.component';
import { AppStatCardComponent } from './components/app-stat-card/app-stat-card.component';
import { AppCompanyListComponent } from './components/app-company-list/app-company-list.component';



@NgModule({
  imports: [
    CommonModule,
    AppButtonComponent,
    AppInputComponent,
    AppNotificationComponent,
    AppStatCardComponent,
    AppCompanyListComponent
  ],
  exports: [
    AppButtonComponent,
    AppInputComponent,
    AppNotificationComponent,
    AppStatCardComponent,
    AppCompanyListComponent
  ]
})
export class SharedModule { }
