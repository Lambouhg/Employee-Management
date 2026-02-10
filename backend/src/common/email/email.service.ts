import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Employee Management System" <noreply@company.com>',
        ),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Không thể gửi email');
    }
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt Lại Mật Khẩu</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${fullName}</strong>,</p>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trong hệ thống quản lý nhân viên.</p>
            
            <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt Lại Mật Khẩu</a>
            </div>
            
            <p>Hoặc sao chép và dán liên kết sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul>
                <li>Link này chỉ có hiệu lực trong <strong>30 phút</strong></li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                <li>Không chia sẻ link này với bất kỳ ai</li>
              </ul>
            </div>
            
            <p>Nếu bạn gặp khó khăn, vui lòng liên hệ bộ phận IT hoặc HR để được hỗ trợ.</p>
            
            <p>Trân trọng,<br><strong>Employee Management System</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; ${new Date().getFullYear()} Employee Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Xin chào ${fullName},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Vui lòng truy cập liên kết sau để đặt lại mật khẩu:
${resetUrl}

Lưu ý:
- Link này chỉ có hiệu lực trong 30 phút
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này

Trân trọng,
Employee Management System
    `;

    await this.sendEmail({
      to: email,
      subject: '🔐 Đặt Lại Mật Khẩu - Employee Management System',
      html,
      text,
    });
  }

  async sendPasswordChangedNotification(
    email: string,
    fullName: string,
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .info { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Mật Khẩu Đã Được Thay Đổi</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${fullName}</strong>,</p>
            
            <p>Mật khẩu của bạn đã được thay đổi thành công vào lúc <strong>${new Date().toLocaleString('vi-VN')}</strong>.</p>
            
            <div class="info">
              <strong>🛡️ Bảo mật tài khoản:</strong>
              <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với bộ phận IT hoặc HR để được hỗ trợ.</p>
            </div>
            
            <p>Trân trọng,<br><strong>Employee Management System</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; ${new Date().getFullYear()} Employee Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '✅ Mật Khẩu Đã Được Thay Đổi - Employee Management System',
      html,
    });
  }
}
