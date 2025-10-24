import {
  MinaNetwork,
  Mainnet,
  Devnet,
  Zeko,
  CanonicalBlockchain,
} from "@silvana-one/api";

export function getChain(): "mina:mainnet" | "mina:devnet" | "zeko:testnet" {
  const chain = process.env.NEXT_PUBLIC_CHAIN;
  if (chain === undefined) throw new Error("NEXT_PUBLIC_CHAIN is undefined");
  if (
    chain !== "mina:devnet" &&
    chain !== "mina:mainnet" &&
    chain !== "zeko:testnet"
  )
    throw new Error("NEXT_PUBLIC_CHAIN must be devnet or mainnet or zeko");
  return chain;
}

export function getChainId(): "mina:mainnet" | "mina:devnet" | "zeko:testnet" {
  return getChain();
}

export function getUrl(): string {
  const chain = getChain();
  switch (chain) {
    case "mina:mainnet":
      return "https://mainnet.minanft.io";
    case "mina:devnet":
      return "https://devnet.minanft.io";
    case "zeko:testnet":
      return "https://zeko.minanft.io";
  }
}

// export function getWallet(): string {
//   const wallet = process.env.NEXT_PUBLIC_WALLET;
//   if (wallet === undefined) throw new Error("NEXT_PUBLIC_WALLET is undefined");
//   return wallet;
// }

export function getNetwork(): MinaNetwork {
  const chain = getChain();
  switch (chain) {
    case "mina:mainnet":
      return Mainnet;
    case "mina:devnet":
      return Devnet;
    case "zeko:testnet":
      return Zeko;
  }
}

export function explorerAccountUrl(): string {
  const network = getNetwork();
  if (network === undefined || network.explorerAccountUrl === undefined)
    throw new Error("Network explorer account url is undefined");
  return network.explorerAccountUrl;
}

export function explorerTransactionUrl(): string {
  const network = getNetwork();
  if (network === undefined || network.explorerTransactionUrl === undefined)
    throw new Error("Network explorer transaction url is undefined");
  return network.explorerTransactionUrl;
}

export function explorerTokenUrl(): string {
  const network = getNetwork();
  if (network === undefined || network.explorerTokenUrl === undefined)
    throw new Error("Network explorer token url is undefined");
  return network.explorerTokenUrl;
}

export function getSiteName(): string {
  const chain = getChain();
  if (chain === "mina:mainnet") return "MinaNFT";
  if (chain === "mina:devnet") return "MinaNFT";
  if (chain === "zeko:testnet") return "MinaNFT Zeko";
  throw new Error("Chain not supported");
}
