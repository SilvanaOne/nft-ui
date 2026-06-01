"use client";

import { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/orderbook/dialog";
import { AddressContext } from "@/context/address";
import {
  mesaUpgradeInfo,
  mesaBuildUpgrade,
  mesaSendUpgrade,
  mesaUpgradeStatus,
  MesaUpgradeInfo,
} from "@/lib/mesa-upgrade";

const ENABLED = process.env.NEXT_PUBLIC_UPGRADE_MESA_TESTNET_KEYS === "true";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type StepStatus = "pending" | "active" | "success" | "error";
interface Step {
  id: string;
  label: string;
  status: StepStatus;
}
const INITIAL_STEPS: Step[] = [
  { id: "prepared", label: "Transaction prepared", status: "pending" },
  { id: "signed", label: "Transaction signed", status: "pending" },
  { id: "sent", label: "Transaction sent", status: "pending" },
  { id: "included", label: "Included in block", status: "pending" },
];

function mark(status: StepStatus): string {
  return status === "success" ? "✓" : status === "error" ? "✕" : status === "active" ? "●" : "○";
}
function markColor(status: StepStatus): string {
  return status === "success"
    ? "text-green-500"
    : status === "error"
    ? "text-red-500"
    : status === "active"
    ? "text-accent animate-pulse"
    : "text-jacarta-300";
}
function short(s: string | undefined, n = 10): string {
  if (!s) return "";
  return s.length <= n * 2 + 3 ? s : `${s.slice(0, n)}…${s.slice(-n)}`;
}

export function MesaUpgradeButton({
  address,
  tokenId,
  parentAddress,
  label = "Mesa Upgrade",
  className,
}: {
  address: string;
  tokenId?: string;
  parentAddress?: string;
  label?: string;
  className?: string;
}) {
  const { address: wallet } = useContext(AddressContext);
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<MesaUpgradeInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [providedKey, setProvidedKey] = useState("");
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  if (!ENABLED) return null;

  async function loadInfo() {
    setLoadingInfo(true);
    setInfoError(null);
    try {
      const result = await mesaUpgradeInfo({ address, tokenId, parentAddress });
      if ("error" in result) setInfoError(result.error);
      else setInfo(result);
    } catch (e) {
      setInfoError(e instanceof Error ? e.message : "Failed to load info");
    } finally {
      setLoadingInfo(false);
    }
  }

  useEffect(() => {
    if (open) {
      setSteps(INITIAL_STEPS);
      setRunError(null);
      setHash(null);
      setProvidedKey("");
      loadInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function setStep(id: string, status: StepStatus) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const candidates = [
        json.collectionContractPrivateKey,
        json.nftContractPrivateKey,
        json.adminContractPrivateKey,
        json.tokenPrivateKey,
        json.privateKey,
      ].filter((x: unknown): x is string => typeof x === "string");
      if (candidates.length > 0) setProvidedKey(candidates[0]);
      else setRunError("No private key field found in the uploaded JSON");
    } catch {
      setRunError("Could not parse the uploaded JSON file");
    }
  }

  async function onUpgrade() {
    if (!wallet) {
      setRunError("Connect your wallet first");
      return;
    }
    setRunning(true);
    setRunError(null);
    setSteps(INITIAL_STEPS);
    try {
      setStep("prepared", "active");
      const build = await mesaBuildUpgrade({
        address,
        tokenId,
        parentAddress,
        sender: wallet,
        privateKey: providedKey || undefined,
      });
      if ("error" in build) {
        setStep("prepared", "error");
        setRunError(build.error);
        return;
      }
      setStep("prepared", "success");

      setStep("signed", "active");
      const mina = (window as any).mina;
      if (!mina) {
        setStep("signed", "error");
        setRunError("Auro wallet not found");
        return;
      }
      const txResult = await mina.sendTransaction(build.payloads.walletPayload);
      const signedData = txResult?.signedData;
      if (!signedData) {
        setStep("signed", "error");
        setRunError("Wallet did not return a signature");
        return;
      }
      setStep("signed", "success");

      setStep("sent", "active");
      const sent = await mesaSendUpgrade(signedData);
      if (!sent.success || !sent.hash) {
        setStep("sent", "error");
        setRunError(sent.error ?? "Failed to send the transaction");
        return;
      }
      setHash(sent.hash);
      setStep("sent", "success");

      setStep("included", "active");
      const start = Date.now();
      const TIMEOUT = 1000 * 60 * 20;
      let included = (await mesaUpgradeStatus(sent.hash)).included;
      while (!included && Date.now() - start < TIMEOUT) {
        await sleep(10000);
        included = (await mesaUpgradeStatus(sent.hash)).included;
      }
      if (!included) {
        setStep("included", "error");
        setRunError("Transaction was not included before timeout");
        return;
      }
      setStep("included", "success");

      await loadInfo();
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Upgrade failed");
    } finally {
      setRunning(false);
    }
  }

  const upgraded = info && info.newVk && info.currentVk.hash === info.newVk.hash;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center rounded-xl border border-jacarta-100 bg-white px-3 py-2 text-sm font-semibold text-jacarta-700 hover:bg-jacarta-50 dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white"
        }
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mesa verification key upgrade</DialogTitle>
            <DialogDescription>
              Reset this account&apos;s verification key to the new Mesa key,
              authorized by its private-key signature.
            </DialogDescription>
          </DialogHeader>

          {loadingInfo && (
            <p className="text-sm text-jacarta-500">Loading account info…</p>
          )}
          {infoError && <p className="text-sm text-red-500">{infoError}</p>}

          {info && (
            <div className="space-y-2 text-sm">
              <Row label="Contract" value={info.name} />
              <Row label="Account" value={info.address} mono />
              <Row
                label="Token ID"
                value={info.isDefaultTokenId ? "none" : info.tokenId}
                mono={!info.isDefaultTokenId}
              />
              <Row label="Current VK" value={short(info.currentVk.hash)} mono />
              <Row
                label="New VK (mainnet)"
                value={info.newVk ? short(info.newVk.hash) : "not found"}
                mono={!!info.newVk}
              />
              <Row
                label="Private key in DB"
                value={info.savedInDb ? "yes" : "no"}
              />
              {upgraded && (
                <p className="rounded-lg bg-green-500/10 px-3 py-2 text-green-600">
                  Verification key matches the new Mesa key — upgraded.
                </p>
              )}
            </div>
          )}

          {info && !info.savedInDb && !upgraded && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-jacarta-700 dark:text-white">
                Private key not in DB — provide it to upgrade
              </label>
              <textarea
                value={providedKey}
                onChange={(e) => setProvidedKey(e.target.value.trim())}
                placeholder="Paste the account's base58 private key (EK…)"
                className="w-full rounded-lg border border-jacarta-100 px-3 py-2 text-sm dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white"
                rows={2}
              />
              <input
                type="file"
                accept="application/json"
                onChange={onFile}
                className="text-xs"
              />
            </div>
          )}

          {(running || hash || runError) && (
            <ul className="space-y-1 rounded-lg bg-jacarta-50 p-3 text-sm dark:bg-jacarta-800">
              {steps.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className={`w-4 text-center ${markColor(s.status)}`}>
                    {mark(s.status)}
                  </span>
                  <span
                    className={
                      s.status === "pending"
                        ? "text-jacarta-300"
                        : "text-jacarta-700 dark:text-white"
                    }
                  >
                    {s.label}
                  </span>
                </li>
              ))}
              {hash && (
                <li className="pt-1 text-xs text-jacarta-400">
                  tx: <span className="font-mono">{short(hash, 8)}</span>
                </li>
              )}
            </ul>
          )}
          {runError && <p className="text-sm text-red-500">{runError}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-xl border border-jacarta-100 px-4 py-2 text-sm font-semibold dark:border-jacarta-600 dark:text-white"
              >
                Close
              </button>
            </DialogClose>
            <button
              type="button"
              disabled={
                running ||
                !info ||
                !info.newVk ||
                !!upgraded ||
                (!info.savedInDb && !providedKey)
              }
              onClick={onUpgrade}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {running ? "Upgrading…" : "Upgrade"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-jacarta-400">{label}</span>
      <span
        className={`text-right text-jacarta-700 dark:text-white ${
          mono ? "font-mono break-all" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
