// src/app/create-campaign/page.tsx
"use client";

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { POLIDAO_ABI } from '../../blockchain/poliDaoAbi';

// Adres kontraktu PoliDAO (zastąp właściwym)
const POLIDAO_CONTRACT_ADDRESS = "0x..." as `0x${string}`;

// Dostępne tokeny
const SUPPORTED_TOKENS = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18
  },
  {
    address: "0xA0b86a33E6441CAACfD336E3B3C5A8E52D4B8B5c", // Example USDC
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6
  }
];

interface FormData {
  title: string;
  description: string;
  beneficiary: string;
  campaignType: 'target' | 'flexible';
  token: string;
  targetAmount: string;
  duration: string;
  category: string;
  contactInfo: string;
  agreeTerms: boolean;
  agreeDataProcessing: boolean;
}

export default function CreateCampaignPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    beneficiary: '',
    campaignType: 'target',
    token: SUPPORTED_TOKENS[0].address,
    targetAmount: '',
    duration: '30',
    category: 'medical',
    contactInfo: '',
    agreeTerms: false,
    agreeDataProcessing: false
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
      if (!formData.beneficiary.trim()) newErrors.beneficiary = 'Informacja o beneficjencie jest wymagana';
    }

    if (step === 2) {
      if (formData.campaignType === 'target') {
        if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
          newErrors.targetAmount = 'Kwota docelowa musi być większa od 0';
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
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3) || !isConnected) return;

    try {
      const selectedToken = SUPPORTED_TOKENS.find(t => t.address === formData.token);
      const decimals = selectedToken?.decimals || 18;
      
      // Konwertuj kwotę docelową na wei
      const targetInWei = formData.campaignType === 'target' 
        ? parseUnits(formData.targetAmount, decimals)
        : BigInt(0);

      // Konwertuj dni na sekundy
      const durationInSeconds = BigInt(parseInt(formData.duration) * 24 * 60 * 60);

      await writeContract({
        address: POLIDAO_CONTRACT_ADDRESS,
        abi: POLIDAO_ABI,
        functionName: 'createFundraiser',
        args: [
          formData.token as `0x${string}`,
          targetInWei,
          durationInSeconds,
          formData.campaignType === 'flexible'
        ],
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

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
            Utwórz zbiórkę i zbieraj na PoliDAO.pl
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Zakładając zbiórkę na naszej platformie blockchain, otrzymujesz narzędzia do skutecznego 
            zbierania funduszy z pełną przejrzystością i bezpieczeństwem.
          </p>
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
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.title.length}/100 znaków
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kto potrzebuje pomocy? *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="beneficiary"
                          value="myself"
                          checked={formData.beneficiary === 'myself'}
                          onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                          className="mr-3 text-green-600"
                        />
                        <span className="font-medium">Ja</span>
                      </label>
                      <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="beneficiary"
                          value="other"
                          checked={formData.beneficiary === 'other'}
                          onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                          className="mr-3 text-green-600"
                        />
                        <span className="font-medium">Inna osoba</span>
                      </label>
                    </div>
                    {errors.beneficiary && (
                      <p className="mt-2 text-sm text-red-600">{errors.beneficiary}</p>
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
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none ${
                        errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.description}</p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                          <span className="font-semibold">Zbiórka z celem</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Określasz konkretną kwotę. Jeśli cel nie zostanie osiągnięty, 
                          środki zostaną zwrócone wpłacającym.
                        </p>
                        <div className="mt-3 text-xs text-green-600 font-medium">
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
                          <span className="font-semibold">Zbiórka elastyczna</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Zbierasz środki bez określonego celu. 
                          Wszystkie wpłaty pozostają u ciebie.
                        </p>
                        <div className="mt-3 text-xs text-green-600 font-medium">
                          ✓ Każda kwota pomaga
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Kwota docelowa - tylko dla zbiórki z celem */}
                  {formData.campaignType === 'target' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Podaj kwotę zbiórki *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.targetAmount}
                          onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-4 py-3 pr-16 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold ${
                            errors.targetAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          {SUPPORTED_TOKENS.find(t => t.address === formData.token)?.symbol}
                        </div>
                      </div>
                      {errors.targetAmount && (
                        <p className="mt-2 text-sm text-red-600">{errors.targetAmount}</p>
                      )}
                      <p className="mt-2 text-sm text-green-600">
                        💡 Zastanów się nad realną kwotą - zbyt wysoki cel może zniechęcić darczyńców
                      </p>
                    </div>
                  )}

                  {/* Token */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Waluta zbiórki
                    </label>
                    <select
                      value={formData.token}
                      onChange={(e) => handleInputChange('token', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {SUPPORTED_TOKENS.map((token) => (
                        <option key={token.address} value={token.address}>
                          {token.symbol} - {token.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Czas trwania */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Czas trwania zbiórki (dni) *
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
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
                      <p className="mt-2 text-sm text-red-600">{errors.duration}</p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Podsumowanie zbiórki</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tytuł:</span>
                      <span className="font-medium">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Typ:</span>
                      <span className="font-medium">
                        {formData.campaignType === 'target' ? '🎯 Zbiórka z celem' : '🌊 Zbiórka elastyczna'}
                      </span>
                    </div>
                    {formData.campaignType === 'target' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kwota docelowa:</span>
                        <span className="font-medium">
                          {formData.targetAmount} {SUPPORTED_TOKENS.find(t => t.address === formData.token)?.symbol}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Czas trwania:</span>
                      <span className="font-medium">{formData.duration} dni</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Beneficjent:</span>
                      <span className="font-medium">
                        {formData.beneficiary === 'myself' ? 'Ja' : 'Inna osoba'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zgody */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-3">ℹ️ Ważne informacje</h4>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li>• Wszystkie transakcje są rejestrowane na blockchain i są publicznie dostępne</li>
                      <li>• Opłata platformy wynosi 2.5% od zebranej kwoty</li>
                      <li>• Po utworzeniu zbiórki nie będziesz mógł edytować jej podstawowych parametrów</li>
                      <li>• Zbiórka zostanie automatycznie zakończona po upływie określonego czasu</li>
                    </ul>
                  </div>

                  <label className={`flex items-start p-4 border rounded-xl cursor-pointer ${
                    errors.agreeTerms ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                      className="mt-1 mr-3 text-green-600"
                    />
                    <span className="text-sm">
                      Akceptuję <a href="#" className="text-green-600 underline">Regulamin</a> platformy PoliDAO i zobowiązuję się do przestrzegania jego postanowień *
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-sm text-red-600">{errors.agreeTerms}</p>
                  )}

                  <label className={`flex items-start p-4 border rounded-xl cursor-pointer ${
                    errors.agreeDataProcessing ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.agreeDataProcessing}
                      onChange={(e) => handleInputChange('agreeDataProcessing', e.target.checked)}
                      className="mt-1 mr-3 text-green-600"
                    />
                    <span className="text-sm">
                      Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z <a href="#" className="text-green-600 underline">Polityką Prywatności</a> *
                    </span>
                  </label>
                  {errors.agreeDataProcessing && (
                    <p className="text-sm text-red-600">{errors.agreeDataProcessing}</p>
                  )}
                </div>

                {/* Przycisk publikacji */}
                <div className="mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={isPending || isConfirming || !formData.agreeTerms || !formData.agreeDataProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 text-lg"
                  >
                    {isPending || isConfirming ? (
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        {isPending ? 'Wysyłanie transakcji...' : 'Potwierdzanie...'}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-3">🚀</span>
                        Opublikuj zbiórkę
                      </div>
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm">
                        <strong>Błąd:</strong> {error.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nawigacja */}
            {currentStep < 3 && (
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Wstecz
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Dalej →
                </button>
              </div>
            )}
          </div>

          {/* Dodatkowe informacje */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bezpieczeństwo</h3>
              <p className="text-gray-600 text-sm">
                Wszystkie transakcje są zabezpieczone przez blockchain i smart kontrakty.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Przejrzystość</h3>
              <p className="text-gray-600 text-sm">
                Każda wpłata jest widoczna publicznie. Darczyńcy wiedzą dokładnie, na co idą ich pieniądze.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Globalny zasięg</h3>
              <p className="text-gray-600 text-sm">
                Twoja zbiórka jest dostępna dla każdego na świecie z dostępem do internetu.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12 bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">❓ Często zadawane pytania</h3>
            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">Ile kosztuje utworzenie zbiórki?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed">
                  Utworzenie zbiórki jest darmowe. Płacisz tylko opłatę za transakcję blockchain (gas fee) 
                  oraz 2.5% prowizji od zebranej kwoty przy wypłacie środków.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">Czy mogę edytować zbiórkę po publikacji?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed">
                  Ze względów bezpieczeństwa blockchain, podstawowe parametry zbiórki (kwota docelowa, czas trwania, typ) 
                  nie mogą być zmienione po publikacji. Możesz jednak aktualizować opis w przyszłych wersjach platformy.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">Jak wypłacić zebrane środki?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed">
                  Dla zbiórek z celem: środki można wypłacić tylko po osiągnięciu celu przed upływem terminu. 
                  Dla zbiórek elastycznych: możesz wypłacić środki w dowolnym momencie przez panel swojego konta.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">Co się dzieje z niewykorzystanymi środkami?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed">
                  W zbiórce z celem: jeśli cel nie zostanie osiągnięty, wszystkie środki automatycznie wracają do darczyńców. 
                  W zbiórce elastycznej: wszystkie środki trafiają do twojego portfela niezależnie od kwoty.
                </div>
              </details>
            </div>
          </div>

          {/* Wsparcie */}
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Potrzebujesz pomocy?</h3>
            <p className="text-gray-600 mb-6">
              Nasz zespół pomoże Ci w każdym kroku tworzenia zbiórki.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="bg-white text-green-600 font-semibold py-3 px-6 rounded-lg hover:shadow-md transition-all duration-300"
              >
                📧 Skontaktuj się z nami
              </a>
              <a 
                href="/white-paper" 
                className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-300"
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