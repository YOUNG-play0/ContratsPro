import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  Coins,
  Sparkles,
  ShieldCheck,
  Globe2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  FileCheck2,
  BellRing,
  Bot,
  Loader2,
  BarChart3,
  Check,
  ExternalLink,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { useLanguage, LanguageSelector } from '../i18n/LanguageContext';

interface LandingPageProps {
  onNavigateToApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToApp }) => {
  const { t } = useLanguage();

  // Waitlist form state
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const alreadyRegistered = localStorage.getItem('contratspro_waitlist_registered');
      if (alreadyRegistered === 'true') {
        setIsSuccess(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleScrollToWaitlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('section-waitlist');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t.landing.invalidEmailError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          companyName: companyName.trim() || 'Visiteur Landing',
          contractsCount: 0,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’inscription.');
      }

      setIsSuccess(true);
      try {
        localStorage.setItem('contratspro_waitlist_registered', 'true');
        localStorage.setItem('contratspro_waitlist_email', email.trim());
      } catch {
        // Ignore localStorage error
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’enregistrer votre adresse pour l’instant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white flex flex-col">
      {/* Top Header / Public Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white flex items-center justify-center p-0.5 shrink-0">
                <AppLogo className="w-full h-full" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 tracking-tight text-xl">
                    ContratsPro
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/80">
                    {t.landing.badgeHeader}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  {t.landing.taglineHeader}
                </p>
              </div>
            </div>

            {/* Nav actions & Language Selector */}
            <div className="flex items-center space-x-2.5 sm:space-x-4">
              {/* Language Selector Switcher */}
              <LanguageSelector variant="light" />

              <button
                id="header-nav-demo-btn"
                onClick={onNavigateToApp}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <span>{t.landing.navDemo}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <a
                id="header-join-btn"
                href="#section-waitlist"
                onClick={handleScrollToWaitlist}
                className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <span>{t.landing.navJoin}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-200/70 bg-gradient-to-b from-white via-indigo-50/30 to-[#FAFAFC]">
        {/* Subtle decorative glow elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.landing.heroBadge}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
            {t.landing.heroTitlePart1}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900">
              {t.landing.heroTitleHighlight}
            </span>
            {t.landing.heroTitlePart2}
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-600 leading-relaxed font-normal">
            {t.landing.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a
              id="hero-cta-waitlist-btn"
              href="#section-waitlist"
              onClick={handleScrollToWaitlist}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>{t.landing.heroCtaWaitlist}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              id="hero-cta-demo-btn"
              onClick={onNavigateToApp}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm sm:text-base rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <span>{t.landing.heroCtaDemo}</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Social Proof / Micro-reassurances */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t.landing.heroCheckFree}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t.landing.heroCheckNoCard}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t.landing.heroCheckLegal}</span>
            </span>
          </div>
        </div>
      </section>

      {/* SECTION PROBLÈME */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              {t.landing.problemBadge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              {t.landing.problemTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {t.landing.problemSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div
              id="problem-card-1"
              className="p-6 sm:p-8 bg-[#FAFAFC] border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.landing.problem1Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.problem1Desc}
              </p>
            </div>

            {/* Card 2 */}
            <div
              id="problem-card-2"
              className="p-6 sm:p-8 bg-[#FAFAFC] border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.landing.problem2Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.problem2Desc}
              </p>
            </div>

            {/* Card 3 */}
            <div
              id="problem-card-3"
              className="p-6 sm:p-8 bg-[#FAFAFC] border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.landing.problem3Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.problem3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION SOLUTION */}
      <section className="py-16 sm:py-24 bg-[#FAFAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {t.landing.solutionBadge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              {t.landing.solutionTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {t.landing.solutionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div
              id="solution-card-1"
              className="p-6 sm:p-8 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.landing.solution1Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.solution1Desc}
              </p>
            </div>

            {/* Feature 2 */}
            <div
              id="solution-card-2"
              className="p-6 sm:p-8 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.landing.solution2Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.solution2Desc}
              </p>
            </div>

            {/* Feature 3 */}
            <div
              id="solution-card-3"
              className="p-6 sm:p-8 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.landing.solution3Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.solution3Desc}
              </p>
            </div>

            {/* Feature 4 */}
            <div
              id="solution-card-4"
              className="p-6 sm:p-8 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.landing.solution4Title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.landing.solution4Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION CAPTURE EMAIL (WAITLIST) */}
      <section
        id="section-waitlist"
        className="py-16 sm:py-24 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white relative overflow-hidden"
      >
        {/* Glow visuals */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.landing.waitlistBadge}</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {t.landing.waitlistTitle}
            </h2>
            <p className="text-sm sm:text-base text-indigo-200/90 max-w-xl mx-auto leading-relaxed">
              {t.landing.waitlistSubtitle}
            </p>
          </div>

          {/* Form Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-2xl shadow-xl">
            {isSuccess ? (
              <div className="space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">{t.landing.successTitle}</h3>
                <p className="text-sm text-indigo-200/80 max-w-md mx-auto">
                  {t.landing.successDesc}
                </p>
                <div className="pt-2">
                  <button
                    id="waitlist-success-demo-btn"
                    onClick={onNavigateToApp}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    <span>{t.landing.successDemoButton}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                  <div>
                    <label
                      htmlFor="landing-company-name"
                      className="block text-xs font-semibold text-indigo-200 mb-1.5"
                    >
                      {t.landing.companyLabel}
                    </label>
                    <input
                      id="landing-company-name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t.landing.companyPlaceholder}
                      className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-indigo-400 rounded-xl text-white placeholder-indigo-300/40 text-sm outline-hidden transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="landing-waitlist-email"
                      className="block text-xs font-semibold text-indigo-200 mb-1.5"
                    >
                      {t.landing.emailLabel}
                    </label>
                    <input
                      id="landing-waitlist-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder={t.landing.emailPlaceholder}
                      className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-emerald-400 rounded-xl text-white placeholder-indigo-300/40 text-sm outline-hidden transition-all"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-300 font-medium text-left">{errorMessage}</p>
                )}

                <button
                  id="landing-waitlist-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-sm sm:text-base rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.landing.submittingButton}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.landing.submitButton}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-indigo-300/60 text-center">
                  {t.landing.spamNote}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Brand & Legal mention */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200">
                  <AppLogo className="w-full h-full" />
                </div>
                <span className="font-extrabold text-slate-900 text-sm">{t.landing.footerBrand}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">
                {t.landing.footerRights}
              </span>
            </div>

            {/* Right: Link to App / Demo */}
            <div className="flex items-center space-x-4">
              <button
                id="footer-nav-to-app-btn"
                onClick={onNavigateToApp}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                <span>{t.landing.footerAppDemo}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
