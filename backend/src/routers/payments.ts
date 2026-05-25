import { createHmac, timingSafeEqual } from "crypto";
import { eq, and } from "drizzle-orm";
import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { invoices, userPurchases } from "../db/schema.js";

const paymentsRouter = Router();

// ─── Valida assinatura HMAC-SHA256 do BTCPay ─────────────────────────────────

function validateBtcpaySignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const received = Buffer.from(signatureHeader.slice(7), "hex");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

// ─── Webhook BTCPay — recebe notificações de fatura ──────────────────────────

paymentsRouter.post(
  "/webhook/btcpay",
  async (req: Request & { rawBody?: Buffer }, res: Response) => {
    const signatureHeader = req.headers["btcpay-sig"] as string;
    const webhookSecret = process.env.BTCPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[btcpay] BTCPAY_WEBHOOK_SECRET não configurado");
      res.status(500).end();
      return;
    }

    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    if (!validateBtcpaySignature(rawBody, signatureHeader, webhookSecret)) {
      res.status(401).json({ error: "Assinatura inválida" });
      return;
    }

    const event = req.body as BtcpayWebhookEvent;
    console.log(`[btcpay] evento: ${event.type} | fatura: ${event.invoiceId}`);

    try {
      await handleBtcpayEvent(event);
      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[btcpay] erro ao processar evento:", (err as Error).message);
      res.status(500).end();
    }
  }
);

// ─── Dispatcher de eventos ────────────────────────────────────────────────────

async function handleBtcpayEvent(event: BtcpayWebhookEvent) {
  switch (event.type) {
    case "InvoiceSettled":
      await handleInvoiceSettled(event.invoiceId);
      break;
    case "InvoiceExpired":
    case "InvoiceInvalid":
      await updateInvoiceStatus(event.invoiceId, event.type === "InvoiceExpired" ? "expired" : "invalid");
      break;
    case "InvoicePaymentSettled":
      await updateInvoiceStatus(event.invoiceId, "confirmed");
      break;
    default:
      break;
  }
}

// ─── Liquidação: desbloqueia acesso ao conteúdo premium ──────────────────────

async function handleInvoiceSettled(btcpayInvoiceId: string) {
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.btcpayInvoiceId, btcpayInvoiceId))
    .limit(1);

  const invoice = rows[0];
  if (!invoice) {
    console.warn(`[btcpay] fatura não encontrada: ${btcpayInvoiceId}`);
    return;
  }

  // Atualiza status da fatura
  await db
    .update(invoices)
    .set({ status: "settled", settledAt: new Date() })
    .where(eq(invoices.id, invoice.id));

  // Registra acesso — manga inteiro ou capítulo específico
  await db
    .insert(userPurchases)
    .values({
      userId: invoice.userId,
      mangaId: invoice.mangaId,
      chapterId: invoice.chapterId,
      invoiceId: invoice.id,
    })
    .onConflictDoNothing();

  console.log(
    `[btcpay] acesso liberado | user=${invoice.userId} manga=${invoice.mangaId ?? "-"} cap=${invoice.chapterId ?? "-"}`
  );
}

async function updateInvoiceStatus(
  btcpayInvoiceId: string,
  status: "confirmed" | "expired" | "invalid"
) {
  await db
    .update(invoices)
    .set({ status })
    .where(
      and(
        eq(invoices.btcpayInvoiceId, btcpayInvoiceId),
        eq(invoices.status, "pending")
      )
    );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BtcpayWebhookEvent {
  type:
    | "InvoiceCreated"
    | "InvoicePaymentSettled"
    | "InvoiceSettled"
    | "InvoiceExpired"
    | "InvoiceInvalid";
  invoiceId: string;
  storeId: string;
  metadata?: Record<string, unknown>;
}

export { paymentsRouter };
