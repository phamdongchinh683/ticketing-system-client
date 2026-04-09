import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1>404</h1>
      <p>Page not found.</p>
      <a routerLink="/dashboard" class="btn">Go Home</a>
    </div>
  `,
  styles: [`
    .page { text-align: center; padding: 80px 20px; }
    h1 { font-size: 72px; color: #ddd; margin: 0; }
    p { color: #999; font-size: 18px; margin: 10px 0 30px; }
    .btn {
      display: inline-block; padding: 10px 20px;
      background: #1976d2; color: white; text-decoration: none; border-radius: 6px;
    }
  `],
})
export class NotFoundComponent {}
