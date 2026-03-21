'use client';

import { MapPin, Clock, Phone, Send } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { useTranslation } from '@/i18n/LanguageContext';

export default function LocationSection() {
  const { t } = useTranslation();

  const contactInfo = [
    { Icon: MapPin, label: t.location.addressLabel, value: t.location.address },
    { Icon: Clock, label: t.location.hoursLabel, value: t.location.hours },
    { Icon: Phone, label: t.location.phoneLabel, value: t.location.phone },
  ];

  return (
    <section id="location" className="bg-cream py-24">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-14">
          <div className="flex justify-center gap-1 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-4 rounded-t-full bg-tan/50" />
            ))}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown-deep">
            {t.location.title}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <ScrollReveal>
            <div className="space-y-6">
              {contactInfo.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-sand-light border border-sand/50 flex items-center justify-center shrink-0 mt-0.5">
                    <item.Icon size={18} strokeWidth={1.5} className="text-brown" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brown-deep mb-0.5">{item.label}</h4>
                    <p className="text-text-secondary">{item.value}</p>
                  </div>
                </div>
              ))}

              <a
                href="https://t.me/kohnachigatoy"
                className="inline-flex items-center gap-2 mt-4 bg-brown-deep text-cream px-6 py-2.5 rounded font-semibold text-sm hover:bg-brown hover:shadow-[0_4px_20px_rgba(109,53,32,0.3)] transition-all duration-200"
              >
                <Send size={15} />
                {t.location.contactTelegram}
              </a>
            </div>
          </ScrollReveal>

          {/* Yandex Map */}
          <ScrollReveal delay={150}>
            <div className="h-72 md:h-80 rounded-lg overflow-hidden border border-sand/60 shadow-sm">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ol=biz&oid=115326991436&z=16"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
            <a
              href="https://yandex.ru/navi/org/115326991436?si=pc80aka2670muqd2xb1x1b0vc8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-brown hover:text-brown-deep transition-colors font-medium"
            >
              <MapPin size={14} />
              {t.location.openMap}
            </a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
