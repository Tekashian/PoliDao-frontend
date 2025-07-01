"use client";

import React, { useState, useEffect } from "react";
import Hero3D from "./Hero3D";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { POLIDAO_ABI } from "../blockchain/poliDaoAbi";
import { polidaoContractConfig } from "../blockchain/contracts";

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export default function HeroWithForm() {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isFlexible, setIsFlexible] = useState(true); // Domyślnie elastyczna (bez celu)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Reset target amount when switching to flexible
  useEffect(() => {
    if (isFlexible) {
      setTargetAmount("");
    }
  }, [isFlexible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !description || !endTime) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }

    // Sprawdź cel kwotowy tylko dla kampanii z określonym celem
    let amountBI: bigint = 0n;
    if (!isFlexible) {
      if (!targetAmount) {
        setError("Dla kampanii z określonym celem musisz podać kwotę.");
        return;
      }
      try {
        amountBI = parseUnits(targetAmount, 6);
        if (amountBI <= 0n) throw new Error();
      } catch {
        setError("Nieprawidłowa kwota.");
        return;
      }
    }

    let ts: number;
    try {
      const ms = new Date(endTime).getTime();
      ts = Math.floor((ms + 5 * 60 * 1000) / 1000); // +5 minut zapasu
      if (ts <= Math.floor(Date.now() / 1000)) throw new Error();
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
        isFlexible,
        targetAmount: isFlexible ? "0" : targetAmount,
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

      // czas trwania kampanii = różnica od teraz
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const duration = BigInt(ts - nowInSeconds);

      // wywołanie kontraktu PoliDAO: createFundraiser
      const args = [
        USDC_ADDRESS,     // token
        amountBI,         // target (0 dla flexible, kwota dla fixed)
        duration,         // duration
        isFlexible        // isFlexible
      ] as const;

      const txHash = await writeContractAsync({
        address: polidaoContractConfig.address,
        abi: POLIDAO_ABI,
        functionName: "createFundraiser",
        args,
      });

      setSuccess(`Kampania utworzona! Hash: ${txHash.slice(0, 10)}...`);
      
      // Reset formularza po sukcesie
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setTargetAmount("");
        setEndTime("");
        setImageFile(null);
        setIsFlexible(true);
        setSuccess("");
        router.push("/");
      }, 3000);

    } catch (err: any) {
      console.error("Error creating campaign:", err);
      setError(err.message || "Błąd podczas tworzenia kampanii.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="hidden xl:block relative w-full aspect-[1920/800] overflow-hidden">
        <Hero3D />

        <div className="absolute inset-0 container mx-auto px-6 h-full flex items-center justify-center pointer-events-none">
          <div className="hidden xl:flex flex-row items-center justify-center gap-12 w-full pointer-events-auto">
            <div className="flex-1 text-white space-y-6">
              <h1 className="text-5xl font-extrabold leading-tight">
                Plant goodness, let people grow.
              </h1>
              <p className="text-lg max-w-md">
                Start your fundraising journey here. Inspire, collect and make a real impact.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 bg-white/30 backdrop-blur-lg p-8 rounded-xl shadow-lg max-w-md w-full space-y-4"
            >
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-100 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-white mb-1">Tytuł zbiórki *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Wprowadź tytuł zbiórki"
                  className="w-full px-4 py-2 rounded bg-white text-black focus:ring-2 focus:ring-[#68CC89]"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-1">Typ kampanii</label>
                <div className="space-y-2">
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="radio"
                      name="campaignType"
                      checked={isFlexible}
                      onChange={() => setIsFlexible(true)}
                      className="mr-2 text-[#68CC89] focus:ring-[#68CC89]"
                    />
                    <span className="text-sm">
                      <strong>Elastyczna</strong> - bez określonego celu (zbierasz ile się uda)
                    </span>
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="radio"
                      name="campaignType"
                      checked={!isFlexible}
                      onChange={() => setIsFlexible(false)}
                      className="mr-2 text-[#68CC89] focus:ring-[#68CC89]"
                    />
                    <span className="text-sm">
                      <strong>Z celem</strong> - określona kwota do zebrania
                    </span>
                  </label>
                </div>
              </div>

              {!isFlexible && (
                <div>
                  <label className="block text-white mb-1">Cel kwotowy (USDC) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Wprowadź kwotę, np. 500.00"
                    className="w-full px-4 py-2 rounded bg-white text-black focus:ring-2 focus:ring-[#68CC89]"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-white mb-1">Krótki opis *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Napisz krótki opis kampanii..."
                  className="w-full px-4 py-2 rounded bg-white text-black h-24 focus:ring-2 focus:ring-[#68CC89] resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-1">Data zakończenia *</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-white text-black focus:ring-2 focus:ring-[#68CC89]"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-1">Dodaj zdjęcie (opcjonalne)</label>
                <label className="w-full flex items-center justify-center px-4 py-2 bg-white text-black rounded cursor-pointer hover:bg-gray-100 transition-colors">
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
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !address}
                className={`w-full py-3 rounded text-white font-medium transition-colors ${
                  submitting || !address
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-[#68CC89] hover:bg-[#5fbf7a]"
                }`}
              >
                {submitting 
                  ? "Tworzę kampanię..." 
                  : !address 
                    ? "Podłącz portfel" 
                    : `Utwórz kampanię ${isFlexible ? "(elastyczną)" : "(z celem)"}`
                }
              </button>

              {!address && (
                <p className="text-center text-white/80 text-sm">
                  Aby utworzyć kampanię, musisz najpierw podłączyć portfel
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="xl:hidden flex flex-col">
        <div className="relative w-full h-48 overflow-hidden pointer-events-none">
          <Hero3D />
        </div>

        <div className="relative z-20 bg-white p-6 rounded-xl shadow-lg -mt-20 mx-4 pointer-events-auto flex flex-col items-center text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-black leading-tight">
            Plant goodness,
            <br />
            let people grow.
          </h1>
          <p className="text-base text-black max-w-sm">
            Start your fundraising journey here. Inspire, collect and make a real impact.
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