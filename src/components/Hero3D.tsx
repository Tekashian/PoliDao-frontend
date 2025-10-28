"use client";

import React from "react";
import Image from "next/image";

export default function Hero3D() {
  return (
    <div className="w-full h-[500px] relative overflow-hidden">
      {/* Tło banner */}
      <Image
        src="/images/nowybaner2.png"
        alt="PoliDAO Banner"
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