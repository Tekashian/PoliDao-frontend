// src/app/page.tsx
"use client";

import React, { useState } from "react";
import Header from "./components/Header";
import Hero3D from "./components/Hero3D";
import HeroWithForm from "./components/HeroWithForm";
import { useGetAllCampaigns, Campaign } from "./hooks/usePoliDao";

export default function HomePage() {
  const { campaigns, isLoading, error, refetchCampaigns } = useGetAllCampaigns();
  const [activeTab, setActiveTab] = useState<"zbiorki" | "glosowania">("zbiorki");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* HERO BANNER + FORM */}
      <div className="relative w-full aspect-[1920/800] overflow-hidden">
        <Hero3D />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <HeroWithForm />
        </div>
      </div>

      {/* TABS */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab("zbiorki")}
            className={`py-2 px-4 -mb-px border-b-2 font-medium ${
              activeTab === "zbiorki"
                ? "border-green-500 text-green-500"
                : "border-transparent text-gray-600"
            }`}
          >
            Zbiórki
          </button>
          <button
            onClick={() => setActiveTab("glosowania")}
            className={`py-2 px-4 -mb-px border-b-2 font-medium ${
              activeTab === "glosowania"
                ? "border-green-500 text-green-500"
                : "border-transparent text-gray-600"
            }`}
          >
            Głosowania
          </button>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "zbiorki" && (
            <>
              {isLoading && <p>Ładowanie kampanii...</p>}
              {error && <p className="text-red-500">Błąd: {error.message}</p>}
              {!isLoading && !error && (
                <ul className="space-y-4">
                  {campaigns?.map((c: Campaign) => (
                    <li
                      key={c.campaignId}
                      className="p-4 bg-white rounded-lg shadow"
                    >
                      <h2 className="text-xl font-semibold mb-2">
                        Kampania #{c.campaignId}
                      </h2>
                      <p>
                        <strong>Token:</strong> {c.acceptedToken}
                      </p>
                      <p>
                        <strong>Cel:</strong>{" "}
                        {(Number(c.targetAmount) / 1e6).toLocaleString()} USDC
                      </p>
                      <p>
                        <strong>Zebrano:</strong>{" "}
                        {(Number(c.raisedAmount) / 1e6).toLocaleString()} USDC
                      </p>
                      <p>
                        <strong>Zakończenie:</strong>{" "}
                        {new Date(
                          Number(c.endTime) * 1000
                        ).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {activeTab === "glosowania" && (
            <p className="text-gray-700">
              Zakładka głosowania w przygotowaniu. Potrzebny hook do pobrania
              propozycji („getAllProposals”).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
