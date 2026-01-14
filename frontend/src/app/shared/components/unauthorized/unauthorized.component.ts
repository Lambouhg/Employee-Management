import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="error-content">
        <h1>🚫</h1>
        <h2>Không có quyền truy cập</h2>
        <p>Bạn không có quyền truy cập vào trang này.</p>
        <a href="/dashboard" class="btn-back">Quay lại Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f7fafc;
    }

    .error-content {
      text-align: center;
    }

    .error-content h1 {
      font-size: 80px;
      margin-bottom: 20px;
    }

    .error-content h2 {
      font-size: 32px;
      color: #1a202c;
      margin-bottom: 12px;
    }

    .error-content p {
      font-size: 16px;
      color: #718096;
      margin-bottom: 32px;
    }

    .btn-back {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }

    .btn-back:hover {
      transform: translateY(-2px);
    }
  `]
})
export class UnauthorizedComponent {}
