// src/app/components/Hero3D.tsx
"use client";

import React from "react";
import Image from "next/image";

export default function Hero3D() {
  return (
    <div className="w-full aspect-[1920/800] relative overflow-hidden">
      {/* Wyświetlamy tylko jedną warstwę tła */}
      <Image
        src="/images/banerPoliDao.png"
        alt="tło"
        fill
        quality={100}
        priority
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
    </div>
  );
}
