// src/components/Header.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

// --- IKONY ---
const SunIcon = () => (
  <svg
    className={styles.themeIconSvg}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    className={styles.themeIconSvg}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 2.138 0 4.123-.693 5.752-1.848Z"
    />
  </svg>
);

const HamburgerIcon = () => (
  <svg
    className={styles.hamburgerIconSvg}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg
    className={styles.hamburgerIconSvg}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const TranslatorIcon = () => (
  <svg
    className={styles.themeIconSvg}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 21l5.25-11.25L21 21m-9.75-4.5H21m-12-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// --- SearchBar komponent ---
const SearchBar = ({
  isFocused,
  setFocused,
  isMobile = false,
}: {
  isFocused: boolean;
  setFocused: (b: boolean) => void;
  isMobile?: boolean;
}) => (
  <div
    className={`
      ${styles.searchBarContainer}
      ${isFocused ? styles.searchBarShadow : ''}
      ${isMobile ? styles.mobileSearchBarContainer : ''}
    `}
    onMouseEnter={!isMobile ? () => setFocused(true) : undefined}
    onMouseLeave={!isMobile ? () => setFocused(false) : undefined}
  >
    <input
      type="text"
      placeholder="Fund id or title."
      className={styles.searchInput}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
    <button onClick={() => console.log('Search clicked')} className={styles.searchButton}>
      Search
    </button>
  </div>
);

// --- GŁÓWNY KOMPONENT HEADER ---
const Header = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const darkHoverBoxShadow = '0 0 12px rgba(100, 220, 150, 0.4)';

  // Ustawienie dark/light
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Obsługa scrollowania
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Obsługa kliknięcia poza menu mobilnym
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Toggle dark/light
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleLanguageChange = () => console.log('Change language clicked');
  const toggleMobileMenu = () => setIsMobileMenuOpen((m) => !m);

  if (!isMounted) {
    // Placeholder, aby uniknąć skoku layoutu przed inicjacją stanu
    return <header className={`${styles.header} ${styles.unscrolled}`} style={{ minHeight: '80px' }} />;
  }

  return (
    <header
      ref={headerRef}
      className={`${styles.header} ${scrolled ? styles.scrolled : styles.unscrolled}`}
    >
      <nav className={styles.nav}>
        {/* --- LEWA CZĘŚĆ (logo + linki) --- */}
        <div className={styles.navLeft}>
          <Link
            href="/"
            className={styles.logoWrapper}
            style={{
              transform: isLogoHovered ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isLogoHovered ? darkHoverBoxShadow : 'none',
              padding: '0.4rem 0.2rem',
              borderRadius: '6px',
            }}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            aria-label="PoliDao Home"
          >
            <Image
              src="/images/PoliDaoLogo.png"
              alt="AltrSeed"
              width={140}
              height={30}
              className={styles.logoImage}
              priority
            />
          </Link>
          <Link href="/my-account" className={styles.navLink}>
            My Account
          </Link>
          <Link href="/whitepaper" className={styles.navLink}>
            WhitePaper
          </Link>
          <Link href="/contact" className={styles.navLink}>
            Contact
          </Link>
        </div>

        {/* --- ŚRODEK (przycisk Create Campaign) --- */}
        <div className={styles.navCenter}>
          <button
            onClick={() => router.push('/create-campaign')}
            className={styles.createCampaignButton}
          >
            <span className={styles.buttonIcon}>🚀</span>
            Create Campaign
          </button>
        </div>

        {/* --- PRAWA CZĘŚĆ (SearchBar + ikony + Connect Wallet – w3m-button) --- */}
        <div className={styles.navRight}>
          <SearchBar isFocused={isSearchFocused} setFocused={setIsSearchFocused} />
          <button
            onClick={handleLanguageChange}
            className={`${styles.iconThemeToggle} ${styles.desktopThemeToggle}`}
            title="Change language"
          >
            <TranslatorIcon />
          </button>
          <button
            onClick={toggleDarkMode}
            className={`${styles.iconThemeToggle} ${styles.desktopThemeToggle}`}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <div className={styles.connectWalletButtonWrapper}>
            <w3m-button />
          </div>
        </div>

        {/* --- MOBILNE KONTROLKI: tylko ikony i hamburger --- */}
        <div className={styles.mobileHeaderControls}>
          <button
            onClick={handleLanguageChange}
            className={`${styles.iconThemeToggle} ${styles.mobileInlineThemeToggle}`}
            title="Change language"
          >
            <TranslatorIcon />
          </button>
          <button
            onClick={toggleDarkMode}
            className={`${styles.iconThemeToggle} ${styles.mobileInlineThemeToggle}`}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <div className={styles.hamburgerMenuButtonContainer}>
            <button
              onClick={toggleMobileMenu}
              className={styles.hamburgerButton}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- Pełne menu mobilne (po kliknięciu hamburger) --- */}
      {isMobileMenuOpen && (
        <div className={`${styles.mobileMenu} ${styles.mobileMenuOpen}`}>
          <div className={styles.mobileMenuContent}>
            <Link href="/my-account" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
              My Account
            </Link>
            <Link href="/whitepaper" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
              WhitePaper
            </Link>
            <Link href="/contact" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
              Contact
            </Link>
            <div className={`${styles.mobileMenuItem} ${styles.mobileMenuItemSpecial}`}>
              <SearchBar isFocused={isSearchFocused} setFocused={setIsSearchFocused} isMobile />
            </div>
            <button
              onClick={() => {
                handleLanguageChange();
                toggleMobileMenu();
              }}
              className={styles.mobileLangButton}
            >
              Change Language
            </button>
            <button
              onClick={() => {
                router.push('/create-campaign');
                toggleMobileMenu();
              }}
              className={styles.mobileNavLink}
            >
              🚀 Create Campaign
            </button>
            <div className={styles.mobileConnectWalletWrapper}>
              <w3m-button />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
