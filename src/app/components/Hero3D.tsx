"use client";

import React from "react";
import Image from "next/image";

export default function Hero3D() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      {/* Tło banner */}
      <Image
        src="/images/PoliDaoBanner.png"
        alt="PoliDao tło"
        fill
        quality={100}
        priority
        className="object-cover object-center"
      />
      
      {/* Opcjonalny overlay dla lepszej czytelności */}
      <div className="absolute inset-0 bg-black/10"></div>
    </div>
  );
}