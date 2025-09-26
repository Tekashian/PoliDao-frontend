// src/app/create-campaign/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { parseUnits, decodeEventLog } from 'viem';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { USDC_CONTRACT_ADDRESS } from '../../blockchain/contracts';
import POLIDAO_ADDRESSES from '../../blockchain/addresses';
import { POLIDAO_ABI } from '../../blockchain/poliDaoAbi';
import { decodeErrorResult } from 'viem';

// USDC ma 6 miejsc po przecinku
const USDC_DECIMALS = 6;

interface FormData {
  title: string;
  description: string;
  beneficiary: string; // who benefits (person / organization / initiative)
  campaignType: 'target' | 'flexible';
  targetAmount: string;
  duration: string;
  category: string;
  contactInfo: string;
  agreeTerms: boolean;
  agreeDataProcessing: boolean;
  location: string;
}

export default function CreateCampaignPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  // NOTE: Na razie zakładamy że walidacje whitelist/paused pozostają w monolicie; jeśli przeniesione do innego modułu trzeba zaktualizować.
  const { data: pausedData } = useReadContract({
    address: POLIDAO_ADDRESSES.core,
    abi: POLIDAO_ABI,
    functionName: 'paused'
  } as any);
  const { data: isWhitelisted } = useReadContract({
    address: POLIDAO_ADDRESSES.core,
    abi: POLIDAO_ABI,
    functionName: 'isTokenWhitelisted',
    args: [USDC_CONTRACT_ADDRESS]
  } as any);
  const publicClient = usePublicClient();

  const paused = Boolean(pausedData);

  const [createdId, setCreatedId] = useState<bigint | null>(null);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);

  // NEW: status twórcy zbiórek
  const [creatorStatus, setCreatorStatus] = useState<'loading' | 'ok' | 'notAllowed' | 'unknown'>('loading');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    beneficiary: '',
    campaignType: 'target',
    targetAmount: '',
    duration: '30',
    category: 'medical',
    contactInfo: '',
    agreeTerms: false,
    agreeDataProcessing: false,
    location: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Usuń błąd gdy użytkownik zaczyna wpisywać
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Tytuł jest wymagany';
      if (formData.title.length < 10) newErrors.title = 'Tytuł musi mieć co najmniej 10 znaków';
      if (!formData.description.trim()) newErrors.description = 'Opis jest wymagany';
      if (formData.description.length < 50) newErrors.description = 'Opis musi mieć co najmniej 50 znaków';
      if (!formData.beneficiary.trim()) newErrors.beneficiary = 'Wybierz kto jest beneficjentem';
      if (formData.location.length > 80) newErrors.location = 'Lokalizacja maks 80 znaków';
    }

    if (step === 2) {
      if (formData.campaignType === 'target') {
        if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
          newErrors.targetAmount = 'Kwota docelowa musi być większa od 0';
        }
        if (parseFloat(formData.targetAmount) > 1000000) {
          newErrors.targetAmount = 'Kwota docelowa nie może przekraczać 1,000,000 USDC';
        }
      }
      if (!formData.duration || parseInt(formData.duration) < 1 || parseInt(formData.duration) > 365) {
        newErrors.duration = 'Czas trwania musi być między 1 a 365 dni';
      }
    }

    if (step === 3) {
      if (!formData.agreeTerms) newErrors.agreeTerms = 'Musisz zaakceptować regulamin';
      if (!formData.agreeDataProcessing) newErrors.agreeDataProcessing = 'Musisz wyrazić zgodę na przetwarzanie danych';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const mapError = (raw: string): string => {
    const lower = raw.toLowerCase();
    if (lower.includes('invalidenddate')) return 'Nieprawidłowa data zakończenia';
    if (lower.includes('goalamountrequired')) return 'Musisz podać cel kwotowy dla tego typu zbiórki';
    if (lower.includes('goalamounttoolarge')) return 'Kwota celu jest zbyt wysoka';
    if (lower.includes('titletoolong')) return 'Tytuł jest za długi';
    if (lower.includes('descriptiontoolong')) return 'Opis jest za długi';
    if (lower.includes('invalidtitle')) return 'Tytuł nie spełnia wymagań';
    if (lower.includes('invalidamount')) return 'Nieprawidłowa kwota';
    if (lower.includes('tokennotwhitelisted')) return 'Wybrany token nie jest dozwolony';
    if (lower.includes('invalid creator')) return 'Twoje konto nie ma uprawnień do tworzenia zbiórek (Invalid creator). Skontaktuj się z administracją lub zakończ proces weryfikacji.';
    return 'Nieudana transakcja – sprawdź dane lub spróbuj ponownie';
  };

  // FIX: fundraiserType zależy od typu kampanii: 0 = WITH_GOAL, 1 = WITHOUT_GOAL (dla elastycznych)
  const mapFundraiserType = (campaignType: 'target' | 'flexible'): number => (campaignType === 'target' ? 0 : 1);

  const handleSubmit = async () => {
    if (creatorStatus === 'notAllowed') {
      setFriendlyError('Twoje konto nie jest uprawnione do tworzenia zbiórek.');
      return;
    }
    if (!validateStep(3) || !isConnected) return;

    try {
      const now = Math.floor(Date.now() / 1000);
      const endDate = BigInt(now + parseInt(formData.duration) * 24 * 60 * 60);
      const metadataHash = '';
      const goalAmount = formData.campaignType === 'target' ? parseUnits(formData.targetAmount || '0', USDC_DECIMALS) : BigInt(0);
      const fundraiserType = mapFundraiserType(formData.campaignType);
      const images: string[] = [];
      const videos: string[] = [];
      const location = formData.location || '';

      // 1. Pre-symulacja (diagnostyka revertu zanim wydamy gas)
      try {
        if (publicClient) {
          await publicClient.simulateContract({
            address: POLIDAO_ADDRESSES.core,
            abi: POLIDAO_ABI as any,
            functionName: 'createFundraiser',
            account: address as `0x${string}`,
            args: [{
              title: formData.title.trim(),
              description: formData.description.trim(),
              endDate,
              fundraiserType,
              token: USDC_CONTRACT_ADDRESS,
              goalAmount,
              initialImages: images,
              initialVideos: videos,
              metadataHash,
              location,
              isFlexible: formData.campaignType === 'flexible'
            }]
          });
        }
      } catch (simErr: any) {
        console.error('Simulation revert', simErr);
        try {
          if (simErr?.data) {
            const decoded = decodeErrorResult({ abi: POLIDAO_ABI as any, data: simErr.data });
            setFriendlyError(mapError(decoded.errorName || simErr?.shortMessage || simErr?.message || 'Błąd symulacji'));
          } else {
            setFriendlyError(mapError(simErr?.shortMessage || simErr?.message || 'Błąd symulacji'));
          }
        } catch {
          setFriendlyError(mapError(simErr?.shortMessage || simErr?.message || 'Błąd symulacji'));
        }
        return; // nie wysyłaj transakcji jeśli symulacja się wywaliła (np. Invalid creator)
      }

      await writeContract({
        address: POLIDAO_ADDRESSES.core,
        abi: POLIDAO_ABI as any,
        functionName: 'createFundraiser',
        args: [{
          title: formData.title.trim(),
          description: formData.description.trim(),
          endDate,
          fundraiserType,
          token: USDC_CONTRACT_ADDRESS,
          goalAmount,
          initialImages: images,
          initialVideos: videos,
          metadataHash,
          location,
          isFlexible: formData.campaignType === 'flexible'
        }]
      });
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      setFriendlyError(mapError(error?.message || ''));
    }
  };

  // Gdy transakcja potwierdzona – dekodujemy log FundraiserCreated aby uzyskać ID.
  useEffect(() => {
    const run = async () => {
      if (!isSuccess || createdId || !hash || !publicClient) return;
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash });
        // Próbujemy znaleźć log eventu FundraiserCreated
        for (const log of receipt.logs) {
          try {
            const decoded: any = decodeEventLog({
              abi: POLIDAO_ABI as any,
              data: log.data,
              topics: [...log.topics] as [`0x${string}`, ...`0x${string}`[]],
            });
            if (decoded?.eventName === 'FundraiserCreated') {
              const id = decoded?.args?.fundraiserId as bigint | undefined;
              if (id && id > 0n) {
                setCreatedId(id);
                return;
              }
            }
          } catch {/* ignore non-matching logs */}
        }
        // Fallback: fundraiserCounter - 1 (zakładamy sekwencyjne inkrementowanie)
        try {
          const counter = await publicClient.readContract({
            address: POLIDAO_ADDRESSES.core,
            abi: POLIDAO_ABI as any,
            functionName: 'fundraiserCounter',
            args: []
          });
          if (typeof counter === 'bigint' && counter > 0n) {
            setCreatedId(counter); // jeżeli kontrakt zwraca już nowy counter jako ID nowej zbiórki
          }
        } catch {/* ignore fallback errors */}
      } catch (e) {
        // brak ID – użytkownik może przejść do konta żeby ją odnaleźć
      }
    };
    run();
  }, [isSuccess, createdId, hash, publicClient]);

  // Auto-redirect po uzyskaniu createdId (placeholder – gdy będzie dekodowanie logów z viem publicClient)
  useEffect(() => {
    if (createdId) {
      const t = setTimeout(() => {
        window.location.href = `/campaigns/${createdId.toString()}`;
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [createdId]);

  // NEW: sprawdzanie czy adres jest uprawniony do tworzenia (probing potencjalnych nazw)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!address || !publicClient) {
        setCreatorStatus('unknown');
        return;
      }
      setCreatorStatus('loading');
      const candidateFns = [
        'isCreatorWhitelisted',
        'isFundraiserCreator',
        'isUserWhitelisted',
        'creatorWhitelist',
        'approvedCreators'
      ];
      for (const fn of candidateFns) {
        try {
          const res: any = await publicClient.readContract({
            address: POLIDAO_ADDRESSES.core,
            abi: POLIDAO_ABI as any,
            functionName: fn as any,
            args: [address]
          });
          if (cancelled) return;
            if (typeof res === 'boolean') {
              setCreatorStatus(res ? 'ok' : 'notAllowed');
              return;
            }
        } catch {
          // ignorujemy jeśli funkcji nie ma / revert
        }
      }
      // jeśli żadna funkcja nie pasowała – pozostawiamy unknown (nie blokujemy)
      if (!cancelled) setCreatorStatus('unknown');
    })();
    return () => { cancelled = true; };
  }, [address, publicClient]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Połącz portfel</h2>
            <p className="text-gray-600 mb-6">
              Aby utworzyć zbiórkę, musisz najpierw połączyć swój portfel Web3.
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300">
              Połącz portfel
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Zbiórka utworzona!</h2>
            <p className="text-gray-600 mb-6">
              Twoja zbiórka została pomyślnie utworzona i jest już dostępna na platformie.
            </p>
            <div className="space-y-3">
              {createdId && (
                <button
                  onClick={() => window.location.href = `/campaigns/${createdId.toString()}`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Przejdź do zbiórki #{createdId.toString()}
                </button>
              )}
              <button 
                onClick={() => window.location.href = '/my-account'}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Zobacz w moim koncie
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Wróć do strony głównej
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero sekcja */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Utwórz zbiórkę i zbieraj w USDC
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Zakładając zbiórkę na naszej platformie blockchain, otrzymujesz stabilną walutę USDC 
            z pełną przejrzystością i bezpieczeństwem.
          </p>
          <div className="mt-6 inline-flex items-center bg-white/20 rounded-full px-6 py-3">
            <span className="text-2xl mr-3">💲</span>
            <span className="font-semibold">Tylko USDC - stabilna kryptowaluta</span>
          </div>
        </div>
      </div>

      {/* Główny formularz */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step <= currentStep 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 md:w-32 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Szczegóły zbiórki</span>
              <span>Ustawienia</span>
              <span>Podsumowanie</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            
            {/* Krok 1: Szczegóły zbiórki */}
            {currentStep === 1 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📝 Opisz szczegóły zbiórki
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tytuł zbiórki *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Podaj krótki i opisowy tytuł swojej zbiórki"
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg font-medium ${
                        errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      style={{ fontSize: '18px' }}
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.title}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.title.length}/100 znaków
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kto jest beneficjentem zbiórki? *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          name="beneficiary"
                          value="myself"
                          checked={formData.beneficiary === 'myself'}
                          onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                          className="mr-3 text-green-600 w-5 h-5"
                        />
                        <span className="font-semibold text-lg">Osoba prywatna</span>
                      </label>
                      <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          name="beneficiary"
                          value="other"
                          checked={formData.beneficiary === 'other'}
                          onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                          className="mr-3 text-green-600 w-5 h-5"
                        />
                        <span className="font-semibold text-lg">Fundacja / Inicjatywa</span>
                      </label>
                    </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Lokalizacja (miasto / kraj) (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Np. Warszawa, Polska"
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg font-medium ${
                        errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.location && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.location}</p>
                    )}
                  </div>
                    {errors.beneficiary && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.beneficiary}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Opisz sytuację i przedstaw nam bliżej problem *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      placeholder="Opisz szczegółowo sytuację, na co będą przeznaczone zebrane środki, dlaczego potrzebujesz pomocy..."
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none font-medium ${
                        errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      style={{ fontSize: '16px', lineHeight: '1.5' }}
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.description}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.description.length}/2000 znaków (minimum 50)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kategoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-lg"
                    >
                      <option value="medical">💊 Medycyna i zdrowie</option>
                      <option value="education">📚 Edukacja</option>
                      <option value="social">🤝 Pomoc społeczna</option>
                      <option value="animals">🐕 Zwierzęta</option>
                      <option value="environment">🌱 Środowisko</option>
                      <option value="technology">💻 Technologia</option>
                      <option value="culture">🎭 Kultura i sztuka</option>
                      <option value="sports">⚽ Sport</option>
                      <option value="other">📋 Inne</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Krok 2: Ustawienia finansowe */}
            {currentStep === 2 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  💰 Ustawienia finansowe
                </h2>

                {/* Info o USDC */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-4">💲</span>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">USDC - Stabilna kryptowaluta</h3>
                      <p className="text-blue-700">Twoja zbiórka będzie zbierać fundusze w USDC (1 USDC = ~1 USD)</p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>✅ Stabilna wartość - nie podlega wahaniom jak Bitcoin czy Ethereum</p>
                    <p>✅ Łatwa wymiana na złotówki przez giełdy kryptowalut</p>
                    <p>✅ Przejrzyste transakcje na blockchain</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Typ zbiórki */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Typ zbiórki
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.campaignType === 'target' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}>
                        <input
                          type="radio"
                          name="campaignType"
                          value="target"
                          checked={formData.campaignType === 'target'}
                          onChange={(e) => handleInputChange('campaignType', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center mb-3">
                          <span className="text-2xl mr-3">🎯</span>
                          <span className="font-bold text-lg">Zbiórka z celem</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Określasz konkretną kwotę w USDC. Jeśli cel nie zostanie osiągnięty, 
                          środki zostaną zwrócone wpłacającym.
                        </p>
                        <div className="mt-3 text-xs text-green-600 font-bold">
                          ✓ Wszystko albo nic
                        </div>
                      </label>

                      <label className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.campaignType === 'flexible' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}>
                        <input
                          type="radio"
                          name="campaignType"
                          value="flexible"
                          checked={formData.campaignType === 'flexible'}
                          onChange={(e) => handleInputChange('campaignType', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center mb-3">
                          <span className="text-2xl mr-3">🌊</span>
                          <span className="font-bold text-lg">Zbiórka elastyczna</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Zbierasz środki bez określonego celu. 
                          Wszystkie wpłaty w USDC pozostają u ciebie.
                        </p>
                        <div className="mt-3 text-xs text-green-600 font-bold">
                          ✓ Każda kwota pomaga
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Kwota docelowa - tylko dla zbiórki z celem */}
                  {formData.campaignType === 'target' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Podaj kwotę zbiórki w USDC *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max="1000000"
                          value={formData.targetAmount}
                          onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                          placeholder="1000.00"
                          className={`w-full px-6 py-5 pr-20 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold text-2xl ${
                            errors.targetAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold text-xl">
                          USDC
                        </div>
                      </div>
                      {errors.targetAmount && (
                        <p className="mt-2 text-sm text-red-600 font-medium">{errors.targetAmount}</p>
                      )}
                      <p className="mt-2 text-sm text-green-600 font-medium">
                        💡 1 USDC ≈ 1 USD ≈ 4 PLN | Zastanów się nad realną kwotą
                      </p>
                    </div>
                  )}

                  {/* Czas trwania */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Czas trwania zbiórki (dni) *
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold text-lg ${
                        errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="7">7 dni</option>
                      <option value="14">14 dni</option>
                      <option value="30">30 dni (zalecane)</option>
                      <option value="60">60 dni</option>
                      <option value="90">90 dni</option>
                      <option value="180">180 dni</option>
                      <option value="365">365 dni</option>
                    </select>
                    {errors.duration && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.duration}</p>
                    )}
                  </div>

                  {/* Dane kontaktowe */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dane kontaktowe (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo}
                      onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                      placeholder="Email lub numer telefonu do kontaktu"
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-lg"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Darczyńcy będą mogli skontaktować się z Tobą w sprawie zbiórki
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Krok 3: Podsumowanie i zgody */}
            {currentStep === 3 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📋 Podsumowanie i publikacja
                </h2>

                {/* Podsumowanie */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Podsumowanie zbiórki</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Tytuł:</span>
                      <span className="font-bold">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Typ:</span>
                      <span className="font-bold">
                        {formData.campaignType === 'target' ? '🎯 Zbiórka z celem' : '🌊 Zbiórka elastyczna'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Waluta:</span>
                      <span className="font-bold text-blue-600">💲 USDC (stabilny dolar)</span>
                    </div>
                    {formData.campaignType === 'target' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Kwota docelowa:</span>
                        <span className="font-bold text-green-600 text-xl">
                          {formData.targetAmount} USDC
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Czas trwania:</span>
                      <span className="font-bold">{formData.duration} dni</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Beneficjent:</span>
                      <span className="font-bold">
                        {formData.beneficiary === 'myself' ? 'Osoba prywatna' : 'Fundacja / Inicjatywa'}
                      </span>
                    </div>
                    {formData.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Lokalizacja:</span>
                        <span className="font-bold">{formData.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Zgody */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h4 className="font-bold text-blue-900 mb-3 text-lg">ℹ️ Ważne informacje</h4>
                    <ul className="text-sm text-blue-800 space-y-2 font-medium">
                      <li>• Wszystkie transakcje są rejestrowane na blockchain i są publicznie dostępne</li>
                      <li>• Opłata platformy wynosi 2.5% od zebranej kwoty</li>
                      <li>• Po utworzeniu zbiórki nie będziesz mógł edytować jej podstawowych parametrów</li>
                      <li>• Zbiórka będzie zbierać tylko USDC - stabilną kryptowalutę</li>
                      <li>• Zbiórka zostanie automatycznie zakończona po upływie określonego czasu</li>
                    </ul>
                  </div>

                  <label className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    errors.agreeTerms ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-green-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                      className="mt-1 mr-4 text-green-600 w-5 h-5"
                    />
                    <span className="text-sm font-medium">
                      Akceptuję <a href="#" className="text-green-600 underline font-bold">Regulamin</a> platformy PoliDAO i zobowiązuję się do przestrzegania jego postanowień *
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-sm text-red-600 font-medium">{errors.agreeTerms}</p>
                  )}

                  <label className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    errors.agreeDataProcessing ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-green-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.agreeDataProcessing}
                      onChange={(e) => handleInputChange('agreeDataProcessing', e.target.checked)}
                      className="mt-1 mr-4 text-green-600 w-5 h-5"
                    />
                    <span className="text-sm font-medium">
                      Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z <a href="#" className="text-green-600 underline font-bold">Polityką Prywatności</a> *
                    </span>
                  </label>
                  {errors.agreeDataProcessing && (
                    <p className="text-sm text-red-600 font-medium">{errors.agreeDataProcessing}</p>
                  )}
                </div>

                {/* Przycisk publikacji */}
                <div className="mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      paused ||
                      isPending ||
                      isConfirming ||
                      !formData.agreeTerms ||
                      !formData.agreeDataProcessing ||
                      (isWhitelisted === false) ||
                      creatorStatus === 'notAllowed' ||
                      creatorStatus === 'loading'
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 text-xl shadow-lg"
                  >
                    {paused
                      ? 'Kontrakt wstrzymany'
                      : isWhitelisted === false
                        ? 'Token USDC nie jest whitelisted'
                        : (isPending || isConfirming)
                          ? (
                            <div className="flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                              {isPending ? '1/2 Wysyłanie...' : '2/2 Potwierdzanie...'}
                            </div>
                          )
                          : (
                            <div className="flex items-center justify-center">
                              <span className="mr-3">🚀</span>
                              Opublikuj zbiórkę w USDC
                            </div>
                          )}
                  </button>
                  {creatorStatus === 'notAllowed' && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      Twoje konto nie ma uprawnień do tworzenia zbiórek. Uzupełnij weryfikację lub skontaktuj się z administracją.
                    </p>
                  )}
                  {creatorStatus === 'loading' && (
                    <p className="mt-2 text-sm text-gray-600 font-medium">
                      Sprawdzanie uprawnień twórcy...
                    </p>
                  )}
                  {creatorStatus === 'unknown' && (
                    <p className="mt-2 text-xs text-gray-500 font-medium">
                      Nie udało się potwierdzić uprawnień twórcy (funkcja whitelist nieznaleziona). Próba utworzenia może się nie powieść jeśli kontrakt wymaga weryfikacji.
                    </p>
                  )}

                  {isWhitelisted === false && (
                    <p className="mt-2 text-sm text-red-600 font-medium">Wybrany token nie jest dopuszczony przez kontrakt.</p>
                  )}

                  {(friendlyError || error) && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm font-medium">
                        <strong>Błąd:</strong> {friendlyError || error?.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nawigacja */}
            {currentStep < 3 && (
              <div className="px-8 py-4 bg-gray-50 border-t-2 border-gray-200 flex justify-between">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                >
                  ← Wstecz
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-300 text-lg"
                >
                  Dalej →
                </button>
              </div>
            )}
          </div>

          {/* Dodatkowe informacje */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💲</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">USDC - Stabilność</h3>
              <p className="text-gray-600 text-sm font-medium">
                Zbierasz w stabilnej walucie USDC która nie podlega wahaniom jak Bitcoin czy Ethereum.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Bezpieczeństwo</h3>
              <p className="text-gray-600 text-sm font-medium">
                Wszystkie transakcje są zabezpieczone przez blockchain i smart kontrakty.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Przejrzystość</h3>
              <p className="text-gray-600 text-sm font-medium">
                Każda wpłata jest widoczna publicznie. Darczyńcy wiedzą dokładnie, na co idą ich pieniądze.
              </p>
            </div>
          </div>

          {/* FAQ dla USDC */}
          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">❓ Często zadawane pytania o USDC</h3>
            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">Co to jest USDC?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  USDC (USD Coin) to stabilna kryptowaluta która ma zawsze wartość około 1 dolara amerykańskiego. 
                  Jest to bezpieczna alternatywa dla zmiennych kryptowalut jak Bitcoin czy Ethereum.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">Jak wymienić USDC na złotówki?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  USDC możesz łatwo wymienić na złotówki przez polskie giełdy kryptowalut takie jak BitBay, Zonda czy Binance. 
                  Proces jest prosty i bezpieczny.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">Dlaczego nie ETH lub Bitcoin?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  ETH i Bitcoin mogą drastycznie zmienić wartość (nawet o 50% w ciągu dnia). USDC jest stabilny - 
                  jeśli zbierzesz 1000 USDC, będzie to nadal około 1000 USD/4000 PLN niezależnie od wahań rynku.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-gray-900">Czy USDC jest bezpieczny?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed font-medium">
                  Tak! USDC jest wydawany przez regulowane firmy i jest zabezpieczony rezerwami dolara amerykańskiego. 
                  To jedna z najbezpieczniejszych kryptowalut na rynku.
                </div>
              </details>
            </div>
          </div>

          {/* Wsparcie */}
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center border-2 border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Potrzebujesz pomocy z USDC?</h3>
            <p className="text-gray-600 mb-6 font-medium">
              Nasz zespół pomoże Ci w każdym kroku tworzenia zbiórki i wyjaśni jak działa USDC.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="bg-white text-green-600 font-bold py-3 px-6 rounded-lg hover:shadow-md transition-all duration-300 border-2 border-green-200"
              >
                📧 Skontaktuj się z nami
              </a>
              <a 
                href="/white-paper" 
                className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-300"
              >
                📖 Przeczytaj dokumentację
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}