"use server";
// Thin client over the minatokens backend (which holds the saved private keys
// and builds/signs/sends the Mesa verification-key upgrade). nft-ui has no DB.
import { getChain } from "./chain";

const apiKey = process.env.MINATOKENS_JWT_KEY;

export interface MesaUpgradeInfo {
  name: string;
  address: string;
  tokenId: string;
  isDefaultTokenId: boolean;
  currentVk: { hash: string; data: string };
  newVk: { hash: string; data: string } | null;
  savedInDb: boolean;
}

function baseUrl(): string {
  const chain = getChain();
  return chain === "zeko:testnet"
    ? "https://zekotokens.com/api/v1"
    : chain === "mina:devnet"
    ? "https://devnet.minatokens.com/api/v1"
    : chain === "mina:testnet"
    ? "https://mesa.minatokens.com/api/v1"
    : "https://minatokens.com/api/v1";
}

async function post(
  path: string,
  body: unknown
): Promise<{ status: number; json: any }> {
  if (!apiKey) return { status: 500, json: { error: "MINATOKENS_JWT_KEY is not set" } };
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  } catch (e) {
    return {
      status: 500,
      json: { error: e instanceof Error ? e.message : "request failed" },
    };
  }
}

export async function mesaUpgradeInfo(params: {
  address: string;
  tokenId?: string;
  parentAddress?: string;
}): Promise<MesaUpgradeInfo | { error: string }> {
  const { status, json } = await post("/info/upgrade", params);
  if (status !== 200) return { error: json?.error ?? "Failed to get upgrade info" };
  return json as MesaUpgradeInfo;
}

export async function mesaBuildUpgrade(params: {
  address: string;
  tokenId?: string;
  parentAddress?: string;
  sender: string;
  privateKey?: string;
}): Promise<{ payloads: any; name: string } | { error: string }> {
  const { status, json } = await post("/transaction/upgrade", params);
  if (status !== 200)
    return { error: json?.error ?? "Failed to build upgrade transaction" };
  return json as { payloads: any; name: string };
}

export async function mesaSendUpgrade(
  transaction: string
): Promise<{ hash?: string; success: boolean; error?: string }> {
  const { status, json } = await post("/transaction/send", { transaction });
  if (status !== 200) return { success: false, error: json?.error ?? "Failed to send" };
  return { success: true, hash: json?.hash };
}

export async function mesaUpgradeStatus(
  hash: string
): Promise<{ included: boolean }> {
  const { status, json } = await post("/transaction/status", { hash });
  if (status !== 200) return { included: false };
  // TransactionStatus: treat common "applied/included" indicators as included.
  const s = json?.status ?? json?.txStatus;
  return {
    included:
      s === "applied" ||
      s === "included" ||
      json?.result === true ||
      json?.included === true,
  };
}
