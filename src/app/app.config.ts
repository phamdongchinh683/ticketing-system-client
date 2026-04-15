import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';
import { firebaseWebConfig } from './data/constants';
import { provideMessaging } from '@angular/fire/messaging';
import { getMessaging } from 'firebase/messaging';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseWebConfig)),
    provideMessaging(() => getMessaging()),
  ],
};
