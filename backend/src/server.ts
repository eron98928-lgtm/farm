import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { securityHeadersMiddleware } from "./_core/securityHeaders.js";
import { apiRateLimitMiddleware } from "./_core/rateLimiting.js";
import { initSentry, captureException } from "./_core/sentry.js";
import { createContext } from "./_core/trpc.js";
import { appRouter } from "./routers/index.js";
import { paymentsRouter } from "./routers/payments.js";

export const app = express();
const PORT = process.env.PORT ?? 3001;

initSentry(app);

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(o => o.trim())
    : ["http://localhost:3000"],
  credentials: true,
}));

app.use(morgan((tokens, req, res) =>
  [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, "content-length"),
    tokens["response-time"](req, res), "ms",
  ].join(" ")
));
// Captura rawBody via verify — express.json continua parseando normalmente
app.use(express.json({
  limit: "10mb",
  verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use("/api/payments", paymentsRouter);
app.use(securityHeadersMiddleware);

// Rate limiting sempre ativo — Redis quando disponível, memória como fallback
app.use("/api/trpc", apiRateLimitMiddleware);

app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  captureException(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

// Sobe servidor local apenas fora da Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV ?? "development"}`);
  });
}
