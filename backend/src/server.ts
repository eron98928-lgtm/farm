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

const app = express();
const PORT = process.env.PORT ?? 3001;

// Sentry deve ser inicializado com o app antes das rotas
initSentry(app);

app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
}));

app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(securityHeadersMiddleware);

if (process.env.UPSTASH_REDIS_URL) {
  app.use("/api/trpc", apiRateLimitMiddleware);
}

app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Handler global de erros não capturados
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  captureException(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV ?? "development"}`);
});
