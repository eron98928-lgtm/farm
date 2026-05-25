-- Migração: sistema de faturas BTCPay
CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'confirmed', 'settled', 'expired', 'invalid');

CREATE TABLE "invoices" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"          integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "manga_id"         integer REFERENCES mangas(id) ON DELETE SET NULL,
  "chapter_id"       integer REFERENCES chapters(id) ON DELETE SET NULL,
  "btcpay_invoice_id" varchar(255) NOT NULL UNIQUE,
  "btc_address"      varchar(255),
  "amount_sats"      bigint NOT NULL,
  "status"           "invoice_status" DEFAULT 'pending' NOT NULL,
  "webhook_secret"   varchar(255) NOT NULL,
  "created_at"       timestamp DEFAULT now() NOT NULL,
  "expires_at"       timestamp NOT NULL,
  "settled_at"       timestamp
);

CREATE INDEX "idx_invoices_user"    ON "invoices" ("user_id");
CREATE INDEX "idx_invoices_btcpay"  ON "invoices" ("btcpay_invoice_id");
CREATE INDEX "idx_invoices_status"  ON "invoices" ("status", "expires_at");

-- Tabela de acessos desbloqueados após pagamento
CREATE TABLE "user_purchases" (
  "id"          serial PRIMARY KEY NOT NULL,
  "user_id"     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "manga_id"    integer REFERENCES mangas(id) ON DELETE CASCADE,
  "chapter_id"  integer REFERENCES chapters(id) ON DELETE CASCADE,
  "invoice_id"  uuid NOT NULL REFERENCES invoices(id),
  "granted_at"  timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "uq_purchase_user_chapter" UNIQUE ("user_id", "chapter_id")
);

CREATE INDEX "idx_purchases_user" ON "user_purchases" ("user_id");
