import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type DashboardCarouselSlide = {
  id: string;
  imageSrc: string;
  imageAlt: string;
  text: string;
  attribution?: string;
  objectPosition?: string;
};

type DashboardCarouselProps = {
  slides: DashboardCarouselSlide[];
  autoPlayMs?: number;
};

const getAttribution = (value?: string) => {
  if (!value) return { text: 'Fonte (opzionale)' };
  if (/^https?:\/\//i.test(value.trim())) {
    return { text: value.trim(), href: value.trim() };
  }
  const hrefMatch = value.match(/href=["']([^"']+)["']/i);
  const textMatch = value.replace(/<[^>]*>/g, '').trim();
  const text = textMatch || value;
  if (hrefMatch && hrefMatch[1]) {
    return { text, href: hrefMatch[1] };
  }
  return { text };
};

const clampIndex = (index: number, length: number) => {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
};

const DashboardCarousel = ({ slides, autoPlayMs = 6500 }: DashboardCarouselProps) => {
  const safeSlides = useMemo(() => slides.filter((s) => Boolean(s.imageSrc)), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const length = safeSlides.length;

  const goTo = (nextIndex: number) => {
    setActiveIndex((prev) => {
      const current = typeof nextIndex === 'number' ? nextIndex : prev;
      return clampIndex(current, length);
    });
  };

  const goNext = () => setActiveIndex((prev) => clampIndex(prev + 1, length));
  const goPrev = () => setActiveIndex((prev) => clampIndex(prev - 1, length));

  useEffect(() => {
    setActiveIndex((prev) => clampIndex(prev, length));
  }, [length]);

  useEffect(() => {
    if (length <= 1 || isPaused) return;

    intervalRef.current = window.setInterval(() => {
      setActiveIndex((prev) => clampIndex(prev + 1, length));
    }, autoPlayMs);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [autoPlayMs, isPaused, length]);

  if (length === 0) return null;

  const active = safeSlides[activeIndex];
  const attribution = getAttribution(active.attribution);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      tabIndex={-1}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
      </div>

      <div className="relative">
        <div className="relative aspect-[16/10] lg:aspect-[21/9] bg-white/5">
          <AnimatePresence mode="wait">
            <motion.img
              key={active.id}
              src={active.imageSrc}
              alt={active.imageAlt}
              className="h-full w-full object-cover"
              style={{ objectPosition: active.objectPosition || 'center' }}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.45 }}
              loading="eager"
            />
          </AnimatePresence>

          {/* Leggera vignettatura solo per rendere leggibili i controlli (non il testo). */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          <button
            type="button"
            onClick={goPrev}
            aria-label="Slide precedente"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/35 text-white p-2 hover:bg-black/55 transition-colors backdrop-blur"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Slide successiva"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/35 text-white p-2 hover:bg-black/55 transition-colors backdrop-blur"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Caption sotto l'immagine (non la copre) */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] sm:text-xs uppercase tracking-wider text-white/70">
                  Testimonianza pubblica
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-white/55">{activeIndex + 1}/{length}</div>
                  <div className="flex items-center gap-2">
                    {safeSlides.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`Vai alla slide ${i + 1}`}
                        onClick={() => goTo(i)}
                        className={`h-2.5 rounded-full transition-all ${
                          i === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={active.id}
                  className="text-white text-base sm:text-xl font-semibold leading-snug text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  “{active.text}”
                </motion.blockquote>
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                {attribution.href ? (
                  <a
                    href={attribution.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-200 hover:text-purple-100 underline underline-offset-2"
                  >
                    {attribution.text}
                  </a>
                ) : (
                  <div className="text-xs text-white/60">{attribution.text}</div>
                )}
                <div className="hidden sm:block text-white/35">•</div>
                <div className="text-xs text-white/55">Autoplay {isPaused ? 'in pausa' : 'attivo'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCarousel;
