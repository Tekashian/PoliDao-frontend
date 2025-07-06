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

// --- Enhanced SearchBar komponent z lepszymi efektami ---
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

// --- GŁÓWNY KOMPONENT HEADER Z ENHANCED EFFECTS ---
const Header = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Enhanced scroll detection z lepszą responsywnością
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

  // Enhanced scroll handling z throttling dla lepszej wydajności
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          setScrolled(scrollPosition > 10); // Slight delay for smoother transition
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced outside click handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Enhanced dark mode toggle z smooth transition
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      
      // Add transition class temporarily
      document.documentElement.style.setProperty('--transition-duration', '0.3s');
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      
      // Remove transition after animation
      setTimeout(() => {
        document.documentElement.style.removeProperty('--transition-duration');
      }, 300);
      
      return next;
    });
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((m) => !m);

  if (!isMounted) {
    // Enhanced placeholder with better styling
    return (
      <header 
        className={`${styles.header} ${styles.unscrolled}`} 
        style={{ minHeight: '80px', opacity: 0.9 }} 
      />
    );
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
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            aria-label="PoliDao Home"
          >
            <Image
              src="/images/PoliDaoLogo.png"
              alt="PoliDao"
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

        {/* --- ŚRODEK (enhanced przycisk Create Campaign) --- */}
        <div className={styles.navCenter}>
          <button
            onClick={() => router.push('/create-campaign')}
            className={styles.createCampaignButton}
          >
            <span className={styles.buttonIcon}>🚀</span>
            Create Campaign
          </button>
        </div>

        {/* --- PRAWA CZĘŚĆ (enhanced SearchBar + ikony + Connect Wallet) --- */}
        <div className={styles.navRight}>
          <SearchBar isFocused={isSearchFocused} setFocused={setIsSearchFocused} />
          <button
            onClick={toggleDarkMode}
            className={`${styles.iconThemeToggle} ${styles.desktopThemeToggle}`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <div className={styles.connectWalletButtonWrapper}>
            <w3m-button />
          </div>
        </div>

        {/* --- ENHANCED MOBILNE KONTROLKI --- */}
        <div className={styles.mobileHeaderControls}>
          <button
            onClick={toggleDarkMode}
            className={`${styles.iconThemeToggle} ${styles.mobileInlineThemeToggle}`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <div className={styles.hamburgerMenuButtonContainer}>
            <button
              onClick={toggleMobileMenu}
              className={styles.hamburgerButton}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- Enhanced mobile menu z lepszymi animacjami --- */}
      {isMobileMenuOpen && (
        <div className={`${styles.mobileMenu} ${styles.mobileMenuOpen}`}>
          <div className={styles.mobileMenuContent}>
            <Link 
              href="/my-account" 
              className={styles.mobileNavLink} 
              onClick={toggleMobileMenu}
            >
              My Account
            </Link>
            <Link 
              href="/whitepaper" 
              className={styles.mobileNavLink} 
              onClick={toggleMobileMenu}
            >
              WhitePaper
            </Link>
            <Link 
              href="/contact" 
              className={styles.mobileNavLink} 
              onClick={toggleMobileMenu}
            >
              Contact
            </Link>
            <div className={`${styles.mobileMenuItem} ${styles.mobileMenuItemSpecial}`}>
              <SearchBar isFocused={isSearchFocused} setFocused={setIsSearchFocused} isMobile />
            </div>
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