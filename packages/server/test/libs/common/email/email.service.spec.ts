/** 목적 - 배포 환경의 SMTP 문자열 설정 검증. 설명 - STARTTLS 포트와 TLS 플래그를 올바른 타입으로 전달한다. */
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from '../../../../libs/common/src/email/email.service';
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: jest.fn() })) }));
describe('메일 전송 설정', () => {
  it('587 포트와 false 문자열을 STARTTLS 설정으로 전달한다', () => {
    new EmailService(
      new ConfigService({
        MAIL_HOST: 'smtp.test',
        MAIL_USER: 'user',
        MAIL_PASS: 'pass',
        MAIL_PORT: '587',
        MAIL_SECURE: 'false',
      })
    );
    expect(nodemailer.createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ port: 587, secure: false })
    );
  });
  it('true 문자열은 직접 TLS 연결로 전달한다', () => {
    new EmailService(
      new ConfigService({
        MAIL_HOST: 'smtp.test',
        MAIL_USER: 'user',
        MAIL_PASS: 'pass',
        MAIL_PORT: '465',
        MAIL_SECURE: 'true',
      })
    );
    expect(nodemailer.createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ port: 465, secure: true })
    );
  });
});
