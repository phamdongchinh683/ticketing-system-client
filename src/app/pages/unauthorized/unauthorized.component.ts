import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <div class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1>403</h1>
        <h2>Unauthorized</h2>
        <p>You don't have permission to access this page.</p>
        <a routerLink="/login" class="btn-back">Back to Login</a>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--color-bg);
        padding: 20px;
      }
      .card {
        text-align: center;
        padding: 48px;
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-md);
        max-width: 400px;
        width: 100%;
      }
      .icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 20px;
        background: var(--color-red-bg);
        color: var(--color-red);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon svg { width: 28px; height: 28px; }
      h1 {
        margin: 0;
        font-size: 48px;
        font-weight: 700;
        color: var(--color-text-dark);
      }
      h2 {
        margin: 4px 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-dark);
      }
      p {
        margin: 0 0 24px;
        font-size: 14px;
        color: var(--color-text);
      }
      .btn-back {
        display: inline-block;
        padding: 10px 24px;
        background: var(--color-primary);
        color: white;
        border-radius: var(--radius-md);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: opacity 0.15s;
      }
      .btn-back:hover { opacity: 0.9; }
    `,
  ],
})
export class UnauthorizedComponent {}
