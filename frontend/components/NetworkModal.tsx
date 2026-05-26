"use client";

import { useDisconnect } from "wagmi";

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HEXAGON_LOGO = (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.5L20 7v10l-8 4.5-8-4.5V7l8-4.5Z" fill="rgba(0,194,120,0.14)" stroke="var(--green)" strokeWidth="1.5" />
    <path d="M9 8.5h4.3c1.6 0 2.7.8 2.7 2.2 0 1-.6 1.7-1.5 2 1 .2 1.7 1 1.7 2.1 0 1.6-1.2 2.7-3.2 2.7H9V8.5Zm3.8 3.7c.7 0 1.1-.3 1.1-.9s-.4-.9-1.1-.9h-1.8v1.8h1.8Zm.2 4.1c.8 0 1.2-.4 1.2-1s-.4-1-1.2-1H11v2h2Z" fill="var(--green)" />
  </svg>
);

export function NetworkModal({ isOpen, onClose }: NetworkModalProps) {
  const { disconnect } = useDisconnect();

  if (!isOpen) return null;

  const handleSwitch = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x790" }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x790",
            chainName: "X Layer Testnet",
            nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
            rpcUrls: ["https://testrpc.xlayer.tech/terigon"],
            blockExplorerUrls: ["https://www.okx.com/web3/explorer/xlayer-test"],
          }],
        });
      } else {
        throw err;
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "32px",
        maxWidth: "420px",
        width: "90%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="rgba(251,146,60,0.15)" stroke="#fb923c" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>Wrong Network</div>
          <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
            PredictFun runs on X Layer Testnet. Please switch your wallet to continue.
          </div>
        </div>

        <div style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <div style={{ flexShrink: 0 }}>
            {HEXAGON_LOGO}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>X Layer Testnet</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>Chain ID: 1952 · OKB</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={async () => {
              await handleSwitch();
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: "var(--green)",
              color: "#000",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Switch to X Layer Testnet
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: "transparent",
              color: "var(--muted)",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
