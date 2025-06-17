// src/app/layout.tsx
import React from "react";

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";
import ContextProvider from "./context";
import Header from "./components/Header";

export const metadata = {
  title: "AltrSeed Crowdfunding",
  description: "Zdecentralizowana platforma crowdfundingowa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ContextProvider>
          <div className="flex flex-col min-h-screen">

            {/* 
              Tutaj nie używamy container – dzięki temu banner (i każda inna 
              full-width sekcja w dziecięcych stronach) wypełni całą szerokość. 
            */}
            <div className="flex-grow">
              {children}
            </div>

            {/* 
              Jeżeli masz stopkę globalną, możesz ją tutaj owinąć 
              osobnym kontenerem / px-4 / container, etc. 
            */}
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}
