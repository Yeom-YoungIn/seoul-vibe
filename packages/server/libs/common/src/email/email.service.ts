/**
 * 목적 - 기존 SMTP로 회원가입 인증 메일을 전송한다.
 * 설명 - 문자열 환경변수의 포트와 TLS 플래그를 nodemailer 타입에 맞게 변환한다.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: Number(this.configService.get('MAIL_PORT', 587)),
      secure: String(this.configService.get('MAIL_SECURE', false)) === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        pass: this.configService.getOrThrow<string>('MAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');
    const verifyUrl = `${clientUrl}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"Seoul Vibe" <${this.configService.get('MAIL_FROM', this.configService.get('MAIL_USER'))}>`,
      to,
      subject: 'Verify your Seoul Vibe account',
      html: `
        <h2>Welcome to Seoul Vibe!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #111;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        ">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <p>If you did not sign up, please ignore this email.</p>
      `,
    });

    this.logger.log(`Verification email sent to ${to}`);
  }
}
