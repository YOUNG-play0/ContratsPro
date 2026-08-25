import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Loader2, X } from 'lucide-react';

interface EarlyAccessBannerProps {
  companyName?: string;
  contractsCount?: number;
}

export const EarlyAccessBanner: React.FC<EarlyAccessBannerProps> = ({
  companyName,
  contractsCount,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const alreadyRegistered = localStorage.getItem('contratspro_waitlist_registered');
      const dismissed = localStorage.getItem('contratspro_waitlist_dismissed');
      if (alreadyRegistered === 'true') {
        setIsSuccess(true);
      }
      if (dismissed === 'true' && alreadyRegistered !== 'true') {
        setIsDismissed(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('contratspro_waitlist_dismissed', 'true');
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Veuillez saisir une adresse email valide.');
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
          companyName: companyName || '',
          contractsCount: contractsCount ?? 0,
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
        // Ignore localStorage errors
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’enregistrer votre email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      id="early-access-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 shadow-md border border-indigo-800/40 transition-all duration-300"
    >
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Banner Text */}
        <div className="flex items-start sm:items-center space-x-3.5 flex-1 pr-6">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-emerald-400 shadow-xs">
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-300" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase bg-emerald-400/15 text-emerald-300 rounded-md border border-emerald-400/20">
                Accès Anticipé Gratuit
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                ContratsPro est en accès anticipé gratuit et illimité.
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5">
              {isSuccess
                ? 'Merci ! Vous êtes inscrit(e). Vous serez informé(e) en priorité des nouveautés et de l’ouverture des abonnements Pro.'
                : 'Inscrivez-vous pour être informé des nouveautés et de l’ouverture des abonnements Pro.'}
            </p>
          </div>
        </div>

        {/* Form or Success State */}
        <div className="flex items-center space-x-2 shrink-0">
          {isSuccess ? (
            <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Inscrit(e) avec succès !</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative">
                <input
                  id="waitlist-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="votre.email@entreprise.fr"
                  className="w-full sm:w-64 px-3.5 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-emerald-400 rounded-xl text-white placeholder-indigo-200/50 outline-hidden transition-all"
                  disabled={isSubmitting}
                />
              </div>
              <button
                id="waitlist-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <span>Rejoindre</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Fermer la bannière"
            className="p-1.5 text-indigo-300/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-2 text-xs text-rose-300 font-medium pl-12">{errorMessage}</p>
      )}
    </div>
  );
};
