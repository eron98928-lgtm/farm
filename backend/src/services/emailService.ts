import { Resend } from "resend";
import { db } from "../db/index.js";
import { emailLogs } from "../db/schema.js";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailType = "SIGNUP_CONFIRMATION" | "NEW_CHAPTER" | "SECURITY_ALERT" | "ACCOUNT_BLOCKED" | "WEEKLY_DIGEST";

interface SendEmailParams {
  userId: number;
  to: string;
  type: EmailType;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    await resend.emails.send({
      from: `MangaReader <noreply@mangareader.com.br>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    await db.insert(emailLogs).values({
      userId: params.userId,
      emailType: params.type,
      recipientEmail: params.to,
      status: "SENT",
    });
  } catch {
    await db.insert(emailLogs).values({
      userId: params.userId,
      emailType: params.type,
      recipientEmail: params.to,
      status: "FAILED",
    });
  }
}

export function buildSecurityAlertEmail(userName: string, event: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 40px;">
      <h1 style="color: #1a1a1a;">Alerta de Segurança — MangaReader</h1>
      <p>Olá, <strong>${userName}</strong>.</p>
      <p>Detectamos uma atividade suspeita na sua conta:</p>
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0;">
        <strong>${event}</strong>
      </div>
      <p>Se não foi você, entre em contato imediatamente.</p>
      <p>— Equipe MangaReader</p>
    </div>
  `;
}

export function buildNewChapterEmail(mangaTitle: string, chapterNumber: string, chapterUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 40px;">
      <h1 style="color: #1a1a1a;">Novo Capítulo Disponível!</h1>
      <p><strong>${mangaTitle}</strong> — Capítulo ${chapterNumber} acaba de ser publicado.</p>
      <a href="${chapterUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Ler Agora
      </a>
      <p>— Equipe MangaReader</p>
    </div>
  `;
}
