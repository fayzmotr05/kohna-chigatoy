'use client';

import { useState } from 'react';
import { Box, Smartphone, RotateCw } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface AROnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const stepIcons = [Box, Smartphone, RotateCw];

export default function AROnboarding({ onComplete, onSkip }: AROnboardingProps) {
  const [step, setStep] = useState(0);
  const { t } = useTranslation();

  const steps = [
    { title: t.ar.step1Title, description: t.ar.step1Desc },
    { title: t.ar.step2Title, description: t.ar.step2Desc },
    { title: t.ar.step3Title, description: t.ar.step3Desc },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const StepIcon = stepIcons[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/80 backdrop-blur-sm px-4">
      <div className="bg-white-warm rounded-lg max-w-sm w-full overflow-hidden shadow-xl">
        {/* Step content */}
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <StepIcon size={48} strokeWidth={1.5} className="text-brown" />
          </div>
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
            {t.ar.skip}
          </button>
          <div className="w-px bg-sand" />
          <button
            onClick={handleNext}
            className="flex-1 py-3.5 text-brown-deep font-semibold text-sm hover:bg-sand-light transition-colors"
          >
            {step < steps.length - 1 ? t.ar.next : t.ar.start}
          </button>
        </div>
      </div>
    </div>
  );
}
