import crypto from "crypto";
import axios from "axios";

type CPFStatus = "REGULAR" | "PENDENTE" | "CANCELADA" | "NULA" | "FALECIDO";

interface CPFResult {
  cpfHash: string;
  status: CPFStatus;
  message: string;
  rawResponse: unknown;
}

function hashCPF(cpf: string): string {
  return crypto.createHash("sha256").update(cpf + process.env.FONTDATA_API_KEY).digest("hex");
}

function validateCPFFormat(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf[10]);
}

const STATUS_MESSAGES: Record<CPFStatus, string> = {
  REGULAR: "CPF verificado com sucesso.",
  PENDENTE: "CPF em situação pendente. Regularize junto à Receita Federal.",
  CANCELADA: "CPF cancelado. Não é possível prosseguir.",
  NULA: "CPF nulo. Não é possível prosseguir.",
  FALECIDO: "CPF pertence a titular falecido.",
};

export async function verifyCPF(cpf: string, birthDate: string): Promise<CPFResult> {
  const cpfClean = cpf.replace(/\D/g, "");

  if (!validateCPFFormat(cpfClean)) {
    return {
      cpfHash: hashCPF(cpfClean),
      status: "NULA",
      message: "CPF inválido (falha na validação Mod-11).",
      rawResponse: null,
    };
  }

  const cpfHash = hashCPF(cpfClean);

  if (!process.env.FONTDATA_API_KEY) {
    return { cpfHash, status: "REGULAR", message: STATUS_MESSAGES.REGULAR, rawResponse: { mock: true } };
  }

  try {
    const response = await axios.post(
      `${process.env.FONTDATA_API_URL}/cpf/verify`,
      { cpf: cpfClean, birthDate },
      {
        headers: { Authorization: `Bearer ${process.env.FONTDATA_API_KEY}` },
        timeout: 10000,
      }
    );

    const status: CPFStatus = response.data.situation ?? "PENDENTE";
    return { cpfHash, status, message: STATUS_MESSAGES[status], rawResponse: response.data };
  } catch {
    return { cpfHash, status: "PENDENTE", message: "Não foi possível verificar o CPF agora. Tente novamente.", rawResponse: null };
  }
}
