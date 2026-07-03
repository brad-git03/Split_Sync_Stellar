"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { StellarWalletsKit, Networks, KitEventType } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

interface StellarWalletContextType {
  address: string | null;
  status: "disconnected" | "connecting" | "connected";
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  signTx: (xdr: string) => Promise<string>;
}

const StellarWalletContext = createContext<StellarWalletContextType | undefined>(undefined);

export function StellarWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    try {
      // Initialize the Stellar Wallets Kit statically
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        modules: defaultModules(),
      });

      setInitialized(true);

      // Restore session if previously connected
      const savedAddress = localStorage.getItem("splitSyncAddress");
      if (savedAddress) {
        setAddress(savedAddress);
        setStatus("connected");
      }

      // Set up event listeners
      const unsubscribeState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
        if (event.payload.address) {
          setAddress(event.payload.address);
          setStatus("connected");
          localStorage.setItem("splitSyncAddress", event.payload.address);
        } else {
          setAddress(null);
          setStatus("disconnected");
          localStorage.removeItem("splitSyncAddress");
        }
      });

      const unsubscribeDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
        setAddress(null);
        setStatus("disconnected");
        localStorage.removeItem("splitSyncAddress");
      });

      return () => {
        unsubscribeState();
        unsubscribeDisconnect();
      };
    } catch (err: any) {
      console.error("Failed to initialize StellarWalletsKit:", err);
      setError(err?.message || "Failed to initialize wallet provider.");
    }
  }, []);

  const connect = async (): Promise<string | null> => {
    if (!initialized) {
      setError("Wallet Kit is not initialized.");
      return null;
    }

    setStatus("connecting");
    setError(null);

    try {
      // Open the modal for the user to select their wallet
      const res = await StellarWalletsKit.authModal();
      
      if (res && res.address) {
        setAddress(res.address);
        setStatus("connected");
        localStorage.setItem("splitSyncAddress", res.address);
        return res.address;
      } else {
        throw new Error("No address returned from wallet.");
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err?.message || "Failed to connect wallet.");
      setStatus("disconnected");
      return null;
    }
  };

  const disconnect = async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    } finally {
      setAddress(null);
      setStatus("disconnected");
      localStorage.removeItem("splitSyncAddress");
    }
  };

  const signTx = async (xdr: string): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected.");
    }

    try {
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: address,
      });

      return signedTxXdr;
    } catch (err: any) {
      console.error("Failed to sign transaction:", err);
      throw new Error(err?.message || "Transaction signing rejected or failed.");
    }
  };

  return (
    <StellarWalletContext.Provider
      value={{
        address,
        status,
        error,
        connect,
        disconnect,
        signTx,
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWalletContext() {
  const context = useContext(StellarWalletContext);
  if (context === undefined) {
    throw new Error("useStellarWalletContext must be used within a StellarWalletProvider");
  }
  return context;
}
