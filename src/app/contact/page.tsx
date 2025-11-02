// src/app/contact/page.tsx
"use client";

import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './pagestyles.css'; // light-mode FAQ styles

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

    try {
      // Send email via FormSubmit (no backend required)
      const res = await fetch('https://formsubmit.co/ajax/jakub.grzegorz.lacki@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          _subject: `Contact form: ${formData.subject || 'No subject'}`,
          _template: 'table',
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      // reset + success
      setShowSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setShowSuccess(false), 4000);
    } catch {
      alert('Sending failed. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page min-h-screen bg-white dark:bg-neutral-950">
      <Header />
      
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#10b981]/10 to-[#10b981]/5 dark:from-emerald-500/12 dark:to-teal-700/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-[#10b981] to-[#065f46] bg-clip-text text-transparent mb-6">
              Contact us
            </h1>
            <p className="text-xl text-gray-900 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Have questions about PoliDAO or want to collaborate? We are here to help build a decentralized future.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-white/5 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">💬 Send a message</h2>
                <p className="text-gray-700 dark:text-gray-300">We reply within 24 hours</p>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/60 dark:from-emerald-900/20 dark:to-emerald-800/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/60 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 dark:text-emerald-300 text-xl">✓</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">Message sent!</h3>
                      <p className="text-emerald-700 dark:text-emerald-200">Thank you for reaching out. We will get back to you soon.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Full name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 caret-emerald-600 shadow-sm"
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 caret-emerald-600 shadow-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 shadow-sm"
                  >
                    <option value="">Choose a subject</option>
                    <option value="general">🤝 General question</option>
                    <option value="partnership">💼 Partnership</option>
                    <option value="technical">🔧 Technical support</option>
                    <option value="media">📺 Media inquiry</option>
                    <option value="bug">🐛 Bug report</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-4 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 caret-emerald-600 shadow-sm resize-none"
                    placeholder="Describe your question or proposal..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#10b981] to-[#065f46] hover:from-emerald-600 hover:to-emerald-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">📤</span>
                      Send message
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            
            {/* Contact Details */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 p-8 contact-card">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📞 Contact information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 dark:text-emerald-300 text-xl">📧</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Email</h4>
                    <p className="text-gray-900 dark:text-gray-300">jakub.grzegorz.lacki@gmail.com</p>
                    <p className="text-sm text-gray-800 dark:text-gray-400">We respond within 24h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 dark:text-emerald-300 text-xl">🌐</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Discord</h4>
                    <p className="text-gray-900 dark:text-gray-300">PoliDAO Community</p>
                    <p className="text-sm text-gray-800 dark:text-gray-400">Join the discussion</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 dark:text-emerald-300 text-xl">📍</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Location</h4>
                    <p className="text-gray-900 dark:text-gray-300">Rumia, Poland</p>
                    <p className="text-sm text-gray-800 dark:text-gray-400">Timezone: CET</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="faq-card contact-card bg-white dark:bg-white/5 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">❓ FAQ</h3>
              
              <div className="space-y-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-white rounded-xl border border-gray-300 shadow-sm hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-white text-base">How does DAO voting work?</span>
                    <span className="chev text-gray-700 dark:text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-4 text-gray-800 dark:text-gray-300 text-sm leading-relaxed">
                    Each token holder can participate in votes. Voting power depends on the amount of tokens.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-white rounded-xl border border-gray-300 shadow-sm hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-white text-base">How to create a campaign?</span>
                    <span className="chev text-gray-700 dark:text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-4 text-gray-800 dark:text-gray-300 text-sm leading-relaxed">
                    Go to the "Create" section, connect your wallet and fill in campaign details.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-white rounded-xl border border-gray-300 shadow-sm hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-white text-base">Is the platform secure?</span>
                    <span className="chev text-gray-700 dark:text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-4 text-gray-800 dark:text-gray-300 text-sm leading-relaxed">
                    Yes, we use audited smart contracts and all transactions are transparent on-chain.
                  </div>
                </details>
              </div>
            </div>

            {/* Social Links */}
            <div className="social-card contact-card bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-emerald-800/10 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🌐 Find us online</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <a href="#" className="flex items-center justify-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group">
                  <span className="text-2xl mr-3">🐦</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Twitter</span>
                </a>
                <a href="#" className="flex items-center justify-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group">
                  <span className="text-2xl mr-3">📱</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Telegram</span>
                </a>
                <a href="#" className="flex items-center justify-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group">
                  <span className="text-2xl mr-3">💻</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Website</span>
                </a>
                <a href="#" className="flex items-center justify-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group">
                  <span className="text-2xl mr-3">📧</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Email</span>
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