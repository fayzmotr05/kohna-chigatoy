'use client';

import { useState } from 'react';
import { X, Phone, User } from 'lucide-react';
import { useTelegram } from './TelegramProvider';
import { useTranslation } from '@/i18n/LanguageContext';

interface RegistrationGateProps {
  onClose: () => void;
  onRegistered: () => void;
}

export default function RegistrationGate({ onClose, onRegistered }: RegistrationGateProps) {
  const { webApp, user, rawInitData, setRegistered } = useTelegram();
  const { t } = useTranslation();
  const [step, setStep] = useState<'contact' | 'name'>('contact');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(user?.first_name || '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleShareContact = () => {
    if (!webApp) return;
    setError(null);

    webApp.requestContact((sent: boolean, event?: any) => {
      if (sent && event?.responseUnsafe?.contact?.phone_number) {
        setPhone(event.responseUnsafe.contact.phone_number);
        setStep('name');
        webApp.HapticFeedback.impactOccurred('light');
      } else if (!sent) {
        setError(t.telegram.regDenied);
      }
    });
  };

  const handleConfirm = async () => {
    if (!name.trim() || !phone || !rawInitData) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/telegram/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': rawInitData,
        },
        body: JSON.stringify({ phone, name: name.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setRegistered(data.user);
        webApp?.HapticFeedback.notificationOccurred('success');
        onRegistered();
      } else {
        const data = await res.json();
        setError(data.error || t.telegram.regFailed);
      }
    } catch {
      setError(t.telegram.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-cream w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-brown-deep">{t.telegram.regTitle}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-brown-deep transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === 'contact' ? (
          <>
            <p className="text-text-secondary text-sm mb-6">{t.telegram.regDesc}</p>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <button
              onClick={handleShareContact}
              className="w-full bg-brown-deep text-cream py-3 rounded-lg font-semibold hover:bg-brown transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              {t.telegram.shareContact}
            </button>
            <button
              onClick={onClose}
              className="w-full mt-3 text-text-secondary py-2 text-sm hover:text-brown-deep transition-colors"
            >
              {t.telegram.regCancel}
            </button>
          </>
        ) : (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium text-brown-deep mb-1.5">
                <User size={14} className="inline mr-1.5" />
                {t.telegram.regName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.telegram.regNamePlaceholder}
                className="w-full px-4 py-3 rounded-lg bg-white-warm border border-sand/60 text-brown-deep placeholder:text-brown-light/40 focus:border-tan focus:outline-none text-sm"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <button
              onClick={handleConfirm}
              disabled={!name.trim() || submitting}
              className="w-full bg-brown-deep text-cream py-3 rounded-lg font-semibold hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : t.telegram.regConfirm}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
