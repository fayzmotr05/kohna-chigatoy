'use client';

import { useState } from 'react';

interface AROnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    title: 'AR rejim nima?',
    description:
      'Taomni 3D ko\'rinishda telefoningiz kamerasi orqali o\'z stolingizda ko\'ring — xuddi haqiqiyday!',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Qanday ishlaydi?',
    description:
      '"AR ko\'rish" tugmasini bosing. Kamera ochiladi — telefonni stolga qarating va taom paydo bo\'ladi.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="1.5">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="8" r="2" />
        <path d="M8 18h8" />
      </svg>
    ),
  },
  {
    title: 'Aylantiring va kattalashtiring',
    description:
      'Barmog\'ingiz bilan taomni aylantiring, kattalashtiring yoki kichiklashtiring.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="1.5">
        <path d="M21 12a9 9 0 11-6.22-8.57" />
        <path d="M21 3v6h-6" />
      </svg>
    ),
  },
];

export default function AROnboarding({ onComplete, onSkip }: AROnboardingProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/80 backdrop-blur-sm px-4">
      <div className="bg-white-warm rounded-lg max-w-sm w-full overflow-hidden shadow-xl">
        {/* Step content */}
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">{steps[step].icon}</div>
          <h3 className="font-display text-xl font-bold text-brown-deep mb-3">
            {steps[step].title}
          </h3>
          <p className="text-text-secondary leading-relaxed">
            {steps[step].description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-brown-deep' : 'bg-sand'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex border-t border-sand">
          <button
            onClick={onSkip}
            className="flex-1 py-3.5 text-text-secondary text-sm hover:bg-sand-light transition-colors"
          >
            O&apos;tkazish
          </button>
          <div className="w-px bg-sand" />
          <button
            onClick={handleNext}
            className="flex-1 py-3.5 text-brown-deep font-semibold text-sm hover:bg-sand-light transition-colors"
          >
            {step < steps.length - 1 ? 'Keyingi' : 'Boshlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
