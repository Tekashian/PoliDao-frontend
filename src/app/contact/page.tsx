// src/app/contact/page.tsx
"use client";

import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Symulacja wysyłania
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setShowSuccess(true);
    setIsSubmitting(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    // Ukryj powiadomienie po 4 sekundach
    setTimeout(() => setShowSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
              Skontaktuj się z nami
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Masz pytania o PoliDAO? Chcesz współpracować? Jesteśmy tutaj, aby pomóc w budowaniu przyszłości zdecentralizowanej demokracji.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">💬 Wyślij wiadomość</h2>
                <p className="text-gray-600">Odpowiemy w ciągu 24 godzin</p>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-green-800">Wiadomość wysłana!</h3>
                      <p className="text-green-700">Dziękujemy za kontakt. Odpowiemy wkrótce.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Imię i nazwisko
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="Jan Kowalski"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="jan@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                    Temat
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Wybierz temat</option>
                    <option value="general">🤝 Pytanie ogólne</option>
                    <option value="partnership">💼 Współpraca</option>
                    <option value="technical">🔧 Wsparcie techniczne</option>
                    <option value="media">📺 Zapytanie medialne</option>
                    <option value="bug">🐛 Zgłoszenie błędu</option>
                    <option value="other">📋 Inne</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-gray-700">
                    Wiadomość
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                    placeholder="Opisz swoje pytanie lub propozycję..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Wysyłanie...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">📤</span>
                      Wyślij wiadomość
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            
            {/* Contact Details */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">📞 Informacje kontaktowe</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xl">📧</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">hello@polidao.org</p>
                    <p className="text-sm text-gray-500">Odpowiadamy w ciągu 24h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 text-xl">🌐</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Discord</h4>
                    <p className="text-gray-600">PoliDAO Community</p>
                    <p className="text-sm text-gray-500">Dołącz do dyskusji</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xl">📍</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Lokalizacja</h4>
                    <p className="text-gray-600">Rumia, Polska</p>
                    <p className="text-sm text-gray-500">Strefa czasowa: CET</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">❓ Częste pytania</h3>
              
              <div className="space-y-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
                    <span className="font-medium text-gray-900">Jak działa głosowanie w DAO?</span>
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed">
                    Każdy posiadacz tokenów może uczestniczyć w głosowaniach. Siła głosu zależy od liczby posiadanych tokenów.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
                    <span className="font-medium text-gray-900">Jak utworzyć kampanię?</span>
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed">
                    Przejdź do sekcji "Utwórz", połącz portfel i wypełnij formularz z szczegółami kampanii.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
                    <span className="font-medium text-gray-900">Czy platforma jest bezpieczna?</span>
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-4 text-gray-600 text-sm leading-relaxed">
                    Tak, używamy audytowanych smart kontraktów i wszystkie transakcje są transparentne na blockchain.
                  </div>
                </details>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-xl border border-blue-100 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">🌐 Znajdź nas online</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <a href="#" className="flex items-center justify-center p-4 bg-white/80 rounded-2xl hover:bg-white transition-colors group">
                  <span className="text-2xl mr-3">🐦</span>
                  <span className="font-medium text-gray-700 group-hover:text-blue-600">Twitter</span>
                </a>
                <a href="#" className="flex items-center justify-center p-4 bg-white/80 rounded-2xl hover:bg-white transition-colors group">
                  <span className="text-2xl mr-3">📱</span>
                  <span className="font-medium text-gray-700 group-hover:text-purple-600">Telegram</span>
                </a>
                <a href="#" className="flex items-center justify-center p-4 bg-white/80 rounded-2xl hover:bg-white transition-colors group">
                  <span className="text-2xl mr-3">💻</span>
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">GitHub</span>
                </a>
                <a href="#" className="flex items-center justify-center p-4 bg-white/80 rounded-2xl hover:bg-white transition-colors group">
                  <span className="text-2xl mr-3">📖</span>
                  <span className="font-medium text-gray-700 group-hover:text-indigo-600">Docs</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}