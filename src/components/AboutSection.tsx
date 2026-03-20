'use client';

import { BookOpen, Leaf, Heart } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { useTranslation } from '@/i18n/LanguageContext';

export default function AboutSection() {
  const { t } = useTranslation();

  const cards = [
    { Icon: BookOpen, title: t.about.card1Title, desc: t.about.card1Desc },
    { Icon: Leaf, title: t.about.card2Title, desc: t.about.card2Desc },
    { Icon: Heart, title: t.about.card3Title, desc: t.about.card3Desc },
  ];

  return (
    <section id="about" className="relative bg-cream py-24 overflow-hidden">
      <div className="absolute inset-0 pattern-geo opacity-[0.03]" />
      <div className="relative mx-auto max-w-4xl px-4">
        <ScrollReveal className="text-center mb-16">
          {/* Arch motif + heading */}
          <div className="flex justify-center gap-1 mb-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-4 rounded-t-full bg-tan/50" />
            ))}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown-deep mb-6">
            {t.about.title}
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed mb-4 max-w-2xl mx-auto">
            {t.about.paragraph1}
          </p>
          <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
            {t.about.paragraph2}
          </p>
        </ScrollReveal>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map((item, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="bg-white-warm border border-sand/60 rounded-lg p-6 text-center hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(61,33,23,0.08)] transition-all duration-200">
                <div className="w-12 h-12 rounded-full bg-sand-light border border-sand/50 flex items-center justify-center mx-auto mb-4">
                  <item.Icon size={22} strokeWidth={1.5} className="text-brown" />
                </div>
                <h3 className="font-display text-lg font-semibold text-brown-deep mb-1">{item.title}</h3>
                <p className="text-text-secondary text-sm">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
      <div className="divider-warm mt-24" />
    </section>
  );
}
