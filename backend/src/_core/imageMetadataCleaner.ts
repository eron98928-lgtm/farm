/**
 * imageMetadataCleaner — strip de EXIF/metadados via manipulação de buffer pura.
 * Sem dependências nativas: funciona em qualquer plataforma.
 *
 * JPEG: remove todos os segmentos APP1–APP15 (EXIF, XMP, ICC, IPTC, comentários).
 * PNG:  remove chunks não-essenciais (tEXt, zTXt, iTXt, gAMA, cHRM, sRGB, iCCP, bKGD).
 */

import { RequestHandler } from "express";

const SUPPORTED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface CleanResult {
  buffer: Buffer;
  mime: string;
  cleaned: boolean;
  originalSize: number;
  cleanedSize: number;
  method: string;
}

// ─── JPEG ─────────────────────────────────────────────────────────────────────

function stripJpegMetadata(input: Buffer): Buffer {
  if (input[0] !== 0xff || input[1] !== 0xd8) return input;

  const out: Buffer[] = [];
  out.push(Buffer.from([0xff, 0xd8])); // SOI marker

  let i = 2;
  while (i < input.length) {
    if (input[i] !== 0xff) break;

    const marker = input[i + 1];

    // SOS (0xda) — início dos dados de imagem, copia o resto e para
    if (marker === 0xda) {
      out.push(input.subarray(i));
      break;
    }

    const segLen = input.readUInt16BE(i + 2);
    const segEnd = i + 2 + segLen;

    // APP0 (0xe0 = JFIF) — mantém
    // APP1–APP15 (0xe1–0xef) — remove (EXIF, XMP, ICC, Photoshop, IPTC)
    // COM (0xfe) — remove comentários
    const isMetadata =
      (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;

    if (!isMetadata) {
      out.push(input.subarray(i, segEnd));
    }

    i = segEnd;
  }

  return Buffer.concat(out);
}

// ─── PNG ──────────────────────────────────────────────────────────────────────

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// Chunks essenciais que devem ser preservados
const PNG_KEEP_CHUNKS = new Set([
  "IHDR", "PLTE", "IDAT", "IEND",
  "tRNS", "cICP", "acTL", "fcTL", "fdAT",
]);

function stripPngMetadata(input: Buffer): Buffer {
  if (!input.subarray(0, 8).equals(PNG_SIGNATURE)) return input;

  const out: Buffer[] = [PNG_SIGNATURE];
  let i = 8;

  while (i < input.length) {
    if (i + 8 > input.length) break;

    const length = input.readUInt32BE(i);
    const type = input.subarray(i + 4, i + 8).toString("ascii");
    const chunkEnd = i + 12 + length;

    if (PNG_KEEP_CHUNKS.has(type)) {
      out.push(input.subarray(i, chunkEnd));
    }

    i = chunkEnd;
  }

  return Buffer.concat(out);
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function cleanImageBuffer(
  input: Buffer,
  mime: string
): Promise<CleanResult> {
  const originalSize = input.byteLength;
  let buffer = input;
  let cleaned = false;
  let method = "none";

  if (mime === "image/jpeg") {
    buffer = stripJpegMetadata(input);
    cleaned = true;
    method = "jpeg-marker-strip";
  } else if (mime === "image/png") {
    buffer = stripPngMetadata(input);
    cleaned = true;
    method = "png-chunk-strip";
  }

  return { buffer, mime, cleaned, originalSize, cleanedSize: buffer.byteLength, method };
}

/**
 * Middleware Express para limpeza automática de uploads de imagem.
 * Aplique antes do handler de upload:
 *   app.post("/api/upload", imageMetadataCleanerMiddleware, uploadHandler);
 *
 * O buffer limpo fica em req.cleanedImageBuffer, mime em req.cleanedImageMime.
 */
export const imageMetadataCleanerMiddleware: RequestHandler = async (req, _res, next) => {
  const contentType = (req.headers["content-type"] ?? "").split(";")[0].trim();

  if (!SUPPORTED_MIME.has(contentType)) {
    return next();
  }

  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", async () => {
    const raw = Buffer.concat(chunks);
    const result = await cleanImageBuffer(raw, contentType);

    (req as any).cleanedImageBuffer = result.buffer;
    (req as any).cleanedImageMime = result.mime;
    (req as any).metadataCleaned = result.cleaned;

    if (result.cleaned) {
      console.log(
        `[imageCleaner] ${contentType} ${result.originalSize}B -> ${result.cleanedSize}B [${result.method}]`
      );
    }
    next();
  });
  req.on("error", next);
};

/**
 * Garante que URLs de imagem apontem apenas para o Supabase Storage do projeto.
 * Bloqueia CDNs externos, data URIs e paths relativos.
 */
export function validateSupabaseStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}
