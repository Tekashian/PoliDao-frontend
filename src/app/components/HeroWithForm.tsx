// src/app/components/HeroWithForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import Hero3D from "./Hero3D";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { POLIDAO_ABI } from "../blockchain/poliDaoAbi";
import { polidaoContractConfig } from "../blockchain/contracts";

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
// stała typ kampanii: 0 = startup, 1 = charity
const DEFAULT_CAMPAIGN_TYPE = 1;

export default function HeroWithForm() {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // 1) Form state (tylko na ekstra-dużych ekranach)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [endTime, setEndTime] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 2) Podgląd obrazka
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // 3) Obsługa wysyłki formularza (tylko XL)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !description || !targetAmount || !endTime) {
      setError("Wypełnij wszystkie pola.");
      return;
    }
    let amountBI: bigint;
    try {
      amountBI = parseUnits(targetAmount, 6);
      if (amountBI <= 0n) throw new Error();
    } catch {
      setError("Nieprawidłowa kwota.");
      return;
    }
    let ts: bigint;
    try {
      const ms = new Date(endTime).getTime();
      ts = BigInt(Math.floor((ms + 5 * 60 * 1000) / 1000));
      if (ts <= BigInt(Math.floor(Date.now() / 1000))) throw new Error();
    } catch {
      setError("Data zakończenia musi być w przyszłości.");
      return;
    }
    if (!address) {
      setError("Podłącz portfel.");
      return;
    }
    setSubmitting(true);
    try {
      // upload obrazka
      let rawCID: any = "";
      if (imageFile) {
        const fm = new FormData();
        fm.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: fm });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Błąd uploadu");
        rawCID = json.cid;
      }
      const cid =
        typeof rawCID === "object" && rawCID["/"]
          ? rawCID["/"]
          : String(rawCID);

      // upload metadanych
      const metadata = {
        title: title.trim(),
        description: description.trim(),
        image: cid ? `https://ipfs.io/ipfs/${cid}` : "",
      };
      const blob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      const file = new File([blob], "metadata.json", {
        type: "application/json",
      });
      const fm2 = new FormData();
      fm2.append("file", file);
      const res2 = await fetch("/api/upload", {
        method: "POST",
        body: fm2,
      });
      const json2 = await res2.json();
      if (!res2.ok) throw new Error(json2.error || "Błąd uploadu metadanych");
      const metaCID =
        typeof json2.cid === "object" && json2.cid["/"]
          ? json2.cid["/"]
          : String(json2.cid);

      // wywołanie kontraktu PoliDao
      const args = [
        DEFAULT_CAMPAIGN_TYPE,
        USDC_ADDRESS,
        amountBI,
        metaCID,
        ts,
      ] as const;
      await writeContractAsync({
        address: polidaoContractConfig.address,
        abi: POLIDAO_ABI,
        functionName: "createCampaign",
        args,
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Błąd podczas tworzenia kampanii.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ===== XL (≥1280px): banner + form ===== */}
      <div className="hidden xl:block relative w-full aspect-[1920/800] overflow-hidden">
        <Hero3D />

        <div className="absolute inset-0 container mx-auto px-6 h-full flex items-center justify-center pointer-events-none">
          <div className="hidden xl:flex flex-row items-center justify-center gap-12 w-full pointer-events-auto">
            {/* tekst */}
            <div className="flex-1 text-white space-y-6">
              <h1 className="text-5xl font-extrabold leading-tight">
                Plant goodness, let people grow.
              </h1>
              <p className="text-lg max-w-md">
                Start your fundraising journey here. Inspire, collect and make a
                real impact.
              </p>
            </div>
            {/* formularz */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 bg-white/30 backdrop-blur-lg p-8 rounded-xl shadow-lg max-w-md w-full space-y-4"
            >
              {error && <p className="text-red-500">{error}</p>}

              <div>
                <label className="block text-black mb-1">Tytuł zbiórki</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Wprowadź tytuł zbiórki"
                  className="w-full px-4 py-2 rounded bg-white text-black focus:ring-2 focus:ring-[#68CC89]"
                />
              </div>

              <div>
                <label className="block text-black mb-1">
                  Cel kwotowy (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="Wprowadź kwotę, np. 500.00"
                  className="w-full px-4 py-2 rounded bg-white text-black focus:ring-2 focus:ring-[#68CC89]"
                />
              </div>

              <div>
                <label className="block text-black mb-1">Krótki opis</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Napisz krótki opis..."
                  className="w-full px-4 py-2 rounded bg-white text-black h-24 focus:ring-2 focus:ring-[#68CC89]"
                />
              </div>

              <div>
                <label className="block text-black mb-1">
                  Data zakończenia
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-white text-black focus:ring-2 focus:ring-[#68CC89]"
                />
              </div>

              <div>
                <label className="block text-black mb-1">
                  Dodaj zdjęcie (opcjonalne)
                </label>
                <label className="w-full flex items-center justify-center px-4 py-2 bg-white text-black rounded cursor-pointer hover:bg-gray-100">
                  <span className="mr-2">📷</span>
                  <span>{imageFile ? imageFile.name : "Wybierz zdjęcie"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded text-white ${
                  submitting ? "bg-gray-400" : "bg-[#68CC89] hover:bg-[#5fbf7a]"
                }`}
              >
                {submitting ? "Tworzę…" : "Utwórz kampanię"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ===== MOBILE & TABLET (<1280px): banner + kartka ===== */}
      <div className="xl:hidden flex flex-col">
        {/* banner */}
        <div className="relative w-full h-48 overflow-hidden pointer-events-none">
          <Hero3D />
        </div>

        {/* karta */}
        <div className="relative z-20 bg-white p-6 rounded-xl shadow-lg -mt-20 mx-4 pointer-events-auto flex flex-col items-center text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-black leading-tight">
            Plant goodness,
            <br />
            let people grow.
          </h1>
          <p className="text-base text-black max-w-sm">
            Start your fundraising journey here. Inspire, collect and make a
            real impact.
          </p>
          <button
            onClick={() => router.push("/create-campaign")}
            className="px-6 py-2 bg-[#68CC89] hover:bg-[#5fbf7a] text-white font-medium rounded-lg shadow-md transition"
          >
            Utwórz kampanię
          </button>
        </div>
      </div>
    </>
  );
}
