"use server";
import { PinataSDK } from "pinata-web3";
import { debug } from "@/lib/debug";
import { getChain } from "@/lib/chain";
import { log as logtail } from "@logtail/next";
const chain = getChain();
const log = logtail.with({
  service: "ipfs",
  chain,
});
const DEBUG = debug();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_IPFS_GATEWAY,
  pinataGatewayKey: process.env.PINATA_GATEWAY_TOKEN,
});

export async function createIpfsURL(params: {
  hash: string;
  gateway?: string;
  apiToken?: string;
}): Promise<string> {
  let { hash, gateway, apiToken } = params;
  gateway ??= process.env.PINATA_IPFS_GATEWAY;
  apiToken ??= process.env.PINATA_GATEWAY_TOKEN;

  if (!gateway) {
    gateway = "https://gateway.pinata.cloud/ipfs/";
  }
  return gateway + hash + (apiToken ? "?pinataGatewayToken=" + apiToken : "");
}

export async function publicIpfsURL(params: { hash: string }): Promise<string> {
  let { hash } = params;
  return "https://gateway.pinata.cloud/ipfs/" + hash;
}

export async function pinJson(params: {
  data: object;
  name?: string;
  keyValues?: Record<string, string | number>;
  auth?: string;
}): Promise<string | undefined> {
  const {
    data,
    name = "nft.json",
    keyValues = { library: "nft-standard" },
  } = params;

  try {
    const upload = await pinata.upload.json(data, {
      cidVersion: 1,
      metadata: {
        name,
        keyValues,
      },
    });

    log.info("pinJson result:", upload);
    return upload.IpfsHash;
  } catch (error: any) {
    log.error("pinJson error:", error?.message);
    return undefined;
  }
}

export async function pinImage(params: {
  imageBase64: string;
  name?: string;
  keyValues?: Record<string, string | number>;
  auth?: string;
}): Promise<string | undefined> {
  const {
    imageBase64,
    name = "nft.json",
    keyValues = { library: "nft-standard" },
  } = params;

  try {
    const upload = await pinata.upload.base64(imageBase64, {
      cidVersion: 1,
      metadata: {
        name,
        keyValues,
      },
    });

    log.info("pinImage result:", upload);
    return upload.IpfsHash;
  } catch (error: any) {
    log.error("pinImage error:", error?.message);
    return undefined;
  }
}
