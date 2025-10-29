// src/components/Header.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  // NEW: Add scroll progress for dynamic blur effect
  const [scrollProgress, setScrollProgress] = useState(0);
  const headerRef = useRef<HTMLElement>(null);

  // Enhanced scroll detection z lepszą responsywnością
  useEffect(() => {
    setIsMounted(true);
    // NEW: robust theme application on mount
    const themePalettes = {
      light: {
        '--bg': '#f8fafc',
        '--surface': '#ffffff',
        '--muted': '#6b7280',
        '--text': '#0f172a',
        '--primary': '#10b981',
        '--accent': '#1f4e79',
        '--border': 'rgba(229,231,235,0.7)',
        'meta': '#ffffff',
        'mode': 'light'
      },
      dark: {
        '--bg': '#0b1220',
        '--surface': '#0f1724',
        '--muted': '#9ca3af',
        '--text': '#ffffff', // changed to pure white
        '--primary': '#34d399',
        '--accent': '#60a5fa',
        '--border': 'rgba(255,255,255,0.06)',
        'meta': '#0f1724',
        'mode': 'dark'
      }
    } as const;

    const injectOverridesOnce = () => {
      if (document.getElementById('polidao-theme-overrides')) return;
      const el = document.createElement('style');
      el.id = 'polidao-theme-overrides';
      el.textContent = `
        /* quick runtime overrides to make utility classes theme-aware */
        .bg-white { background: var(--surface) !important; }
        .text-gray-800 { color: var(--text) !important; }
        .text-gray-500 { color: var(--muted) !important; }
        .bg-gray-50 { background: color-mix(in srgb, var(--surface) 80%, transparent) !important; }
        .border-gray-100 { border-color: var(--border) !important; }

        /* Force all text color in dark mode immediately */
        html.dark, html.dark body, html.dark #__next, html.dark * { color: var(--text) !important; }

        /* Shadow overrides: ensure white-ish shadows in dark mode */
        html.dark .shadow,
        html.dark .shadow-sm,
        html.dark .shadow-md,
        html.dark .shadow-lg,
        html.dark .shadow-xl,
        html.dark .shadow-2xl,
        html.dark .shadow-inner {
          box-shadow: var(--shadow) !important;
        }
        html.dark .drop-shadow,
        html.dark .filter-drop-shadow {
          filter: drop-shadow(0 8px 16px rgba(255,255,255,0.06)) !important;
        }

        /* Footer: ensure darker background and readable text */
        footer, .site-footer {
          background: color-mix(in srgb, var(--surface) 88%, #000000 6%) !important;
          color: var(--text) !important;
          border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent 40%) !important;
          box-shadow: var(--shadow) !important;
        }
        html.dark footer, html.dark .site-footer {
          background: color-mix(in srgb, var(--surface) 70%, #000000 30%) !important;
          color: #ffffff !important;
          border-top: 1px solid rgba(255,255,255,0.06) !important;
        }
        footer a, .site-footer a { color: var(--primary) !important; }

        /* CampaignCard protection: explicit non-blend styles */
        .campaign-card {
          background: var(--surface) !important;
          color: var(--text) !important;
          border: 1px solid var(--border) !important;
          border-radius: 12px !important;
          box-shadow: var(--shadow) !important;
        }
        .campaign-card * {
          color: inherit !important;
          background: transparent !important;
        }
      `;
      document.head.appendChild(el);
    };

    const applyTheme = (t: 'light' | 'dark') => {
      const pal = themePalettes[t];
      const root = document.documentElement;
      // set variables
      Object.keys(pal).forEach(k => {
        if (k.startsWith('--')) root.style.setProperty(k, (pal as any)[k]);
      });
      // color-scheme + class for libs
      root.style.setProperty('color-scheme', (pal as any).mode);
      root.classList.toggle('dark', t === 'dark');
      // apply basic body colors (immediate fallback)
      try {
        document.body.style.backgroundColor = (pal as any)['--bg'];
        document.body.style.color = (pal as any)['--text'];
      } catch {}
      // meta theme-color
      let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement|null;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
      meta.content = (pal as any).meta;
      injectOverridesOnce();
    };

    // decide initial theme
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'dark' || (!saved && prefersDark) ? 'dark' : 'light';
    setDarkMode(initial === 'dark');
    applyTheme(initial);
  }, []);

  // Enhanced scroll handling z backdrop blur effect
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const maxScroll = 100; // Maximum scroll distance for full effect
          const progress = Math.min(scrollPosition / maxScroll, 1); // 0 to 1
          
          setScrolled(scrollPosition > 10);
          setScrollProgress(progress);
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
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.add('theme-transition');
      // apply variables + body + meta + overrides (reuse applyTheme above by re-creating palette)
      const themeToApply = next ? 'dark' : 'light';
      // set duration variable for transition
      document.documentElement.style.setProperty('--transition-duration', '0.25s');
      // apply palette (recompute inline to avoid moving applyTheme outside)
      const pal = themeToApply === 'dark'
        ? { '--bg': '#0b1220', '--surface': '#0f1724', '--muted': '#9ca3af', '--text': '#e6eef8', '--primary': '#34d399', '--border': 'rgba(255,255,255,0.06)', meta: '#0f1724', mode: 'dark' }
        // update inline palette dark text -> white
        : { '--bg': '#f8fafc', '--surface': '#ffffff', '--muted': '#6b7280', '--text': '#0f172a', '--primary': '#10b981', '--border': 'rgba(229,231,235,0.7)', meta: '#ffffff', mode: 'light' };

      // Fix: ensure dark branch uses white text
      if (themeToApply === 'dark') {
        pal['--text'] = '#ffffff';
      }

      const root = document.documentElement;
      Object.keys(pal).forEach(k => { if ((k as string).startsWith('--')) root.style.setProperty(k, (pal as any)[k]); });
      root.style.setProperty('color-scheme', (pal as any).mode);
      root.classList.toggle('dark', themeToApply === 'dark');
      try { document.body.style.backgroundColor = (pal as any)['--bg']; document.body.style.color = (pal as any)['--text']; } catch {}
      let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement|null;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
      meta.content = (pal as any).meta;
      localStorage.setItem('theme', themeToApply);

      // remove transition helper shortly
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
        document.documentElement.style.removeProperty('--transition-duration');
      }, 300);

      // ensure overrides are present when toggling
      if (!document.getElementById('polidao-theme-overrides')) {
        const el = document.createElement('style');
        el.id = 'polidao-theme-overrides';
        el.textContent = `
          /* Force all text color in dark mode immediately */
          html.dark, html.dark body, html.dark #__next, html.dark * { color: var(--text) !important; }

          .bg-white { background: var(--surface) !important; }
          .text-gray-800 { color: var(--text) !important; }
          .text-gray-500 { color: var(--muted) !important; }
          .bg-gray-50 { background: color-mix(in srgb, var(--surface) 80%, transparent) !important; }
          .border-gray-100 { border-color: var(--border) !important; }

          /* Shadow overrides */
          html.dark .shadow,
          html.dark .shadow-sm,
          html.dark .shadow-md,
          html.dark .shadow-lg,
          html.dark .shadow-xl,
          html.dark .shadow-2xl,
          html.dark .shadow-inner {
            box-shadow: var(--shadow) !important;
          }
          html.dark .drop-shadow,
          html.dark .filter-drop-shadow {
            filter: drop-shadow(0 8px 16px rgba(255,255,255,0.06)) !important;
          }

          footer, .site-footer {
            background: color-mix(in srgb, var(--surface) 88%, #000000 6%) !important;
            color: var(--text) !important;
            border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent 40%) !important;
            box-shadow: var(--shadow) !important;
          }
          html.dark footer, html.dark .site-footer {
            background: color-mix(in srgb, var(--surface) 70%, #000000 30%) !important;
            color: #ffffff !important;
            border-top: 1px solid rgba(255,255,255,0.06) !important;
          }
          footer a, .site-footer a { color: var(--primary) !important; }

          .campaign-card {
            background: var(--surface) !important;
            color: var(--text) !important;
            border: 1px solid var(--border) !important;
            border-radius: 12px !important;
            box-shadow: var(--shadow) !important;
          }
          .campaign-card * {
            color: inherit !important;
            background: transparent !important;
          }
        `;
        document.head.appendChild(el);
      }

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
      style={{
        // Dynamic backdrop blur based on scroll progress
        backdropFilter: `blur(${scrollProgress * 8}px)`, // Reduced from 12px to 8px
        WebkitBackdropFilter: `blur(${scrollProgress * 8}px)`,
        // Much more transparent background
        backgroundColor: scrolled 
          ? `rgba(255, 255, 255, ${0.4 + scrollProgress * 0.1})` // Reduced from 0.8+0.15 to 0.4+0.1
          : 'rgba(255, 255, 255, 0.7)', // Reduced from 0.95 to 0.7
        // More subtle border when scrolled
        borderBottom: scrolled 
          ? `1px solid rgba(229, 231, 235, ${0.2 + scrollProgress * 0.2})` // Reduced opacity
          : 'none',
        // Smooth transition for all effects
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <nav className={styles.nav}>
        {/* --- LEWA CZĘŚĆ (logo + linki) --- */}
        <div className={styles.navLeft}>
          <Link
            href="/"
            className={styles.logoWrapper}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            aria-label="PolyFund Home"
          >
            <Image
              src="/images/logo2.png" // changed: use public/images/logo2.png
              alt="PolyFund"
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
            Whitepaper
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
            Create Fundraiser
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
              Whitepaper
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
              🚀 Create Fundraiser
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