'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Users, FileText, CheckCircle } from 'lucide-react';
import { useTelegram } from './TelegramProvider';
import { useTranslation } from '@/i18n/LanguageContext';

interface BookingFormProps {
  onClose: () => void;
  onNeedRegistration: () => void;
}

// Generate time slots from 10:00 to 22:00 in 30-min increments
const TIME_SLOTS: string[] = [];
for (let h = 10; h <= 22; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 22) TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function BookingForm({ onClose, onNeedRegistration }: BookingFormProps) {
  const { rawInitData, isRegistered, webApp } = useTelegram();
  const { t } = useTranslation();

  const [date, setDate] = useState(getTomorrow());
  const [time, setTime] = useState('12:00');
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!isRegistered) {
      onNeedRegistration();
      return;
    }

    if (!rawInitData) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/telegram/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': rawInitData,
        },
        body: JSON.stringify({ date, time, party_size: partySize, notes: notes.trim() || null }),
      });

      if (res.ok) {
        setSuccess(true);
        webApp?.HapticFeedback.notificationOccurred('success');
      } else {
        try {
          const data = await res.json();
          setError(data.error || t.telegram.bookError);
        } catch {
          setError(t.telegram.bookError);
        }
        webApp?.HapticFeedback.notificationOccurred('error');
      }
    } catch {
      setError(t.telegram.bookError);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
        <div className="bg-cream w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={28} />
          </div>
          <h3 className="font-display text-xl font-bold text-brown-deep mb-2">{t.telegram.bookSuccess}</h3>
          <p className="text-text-secondary mb-6">{t.telegram.bookSuccessDesc}</p>
          <button onClick={onClose} className="w-full bg-brown-deep text-cream py-3 rounded-lg font-semibold hover:bg-brown transition-colors">
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-cream w-full max-w-md max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand/60">
          <h3 className="font-display text-lg font-bold text-brown-deep">{t.telegram.bookTable}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-brown-deep transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1.5">
              <Calendar size={14} className="inline mr-1.5" />
              {t.telegram.bookDate}
            </label>
            <input
              type="date"
              value={date}
              min={getTomorrow()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white-warm border border-sand/60 text-brown-deep focus:border-tan focus:outline-none text-sm"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1.5">
              <Clock size={14} className="inline mr-1.5" />
              {t.telegram.bookTime}
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white-warm border border-sand/60 text-brown-deep focus:border-tan focus:outline-none text-sm"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {/* Party Size */}
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1.5">
              <Users size={14} className="inline mr-1.5" />
              {t.telegram.bookPartySize}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                className="w-10 h-10 rounded-full bg-sand-light border border-sand/50 flex items-center justify-center text-brown-deep hover:bg-sand transition-colors text-lg font-bold"
              >
                -
              </button>
              <span className="w-16 text-center font-display text-xl font-bold text-brown-deep">
                {partySize}
              </span>
              <button
                onClick={() => setPartySize(Math.min(60, partySize + 1))}
                className="w-10 h-10 rounded-full bg-sand-light border border-sand/50 flex items-center justify-center text-brown-deep hover:bg-sand transition-colors text-lg font-bold"
              >
                +
              </button>
              <span className="text-text-secondary text-sm">{t.telegram.persons}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1.5">
              <FileText size={14} className="inline mr-1.5" />
              {t.telegram.bookNotes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-white-warm border border-sand/60 text-brown-deep placeholder:text-brown-light/40 focus:border-tan focus:outline-none text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sand/60">
          {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-brown-deep text-cream py-3 rounded-lg font-semibold hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '...' : t.telegram.bookConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
