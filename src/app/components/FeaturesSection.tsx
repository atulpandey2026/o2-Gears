'use client';
import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const closeupDetails = [
{
  label: 'Speaker Driver',
  title: '12mm Dynamic Driver',
  description: 'Precision-tuned 12mm dynamic drivers deliver rich bass, clear mids, and sparkling highs across every genre.',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_492cc008c-1790579997478.png",
  alt: 'O2 Eardop 12mm dynamic speaker driver close-up, bright studio lighting, white background',
  stat: '12mm',
  statLabel: 'Driver',
  accent: 'text-blue-600',
  bg: 'bg-blue-50'
},
{
  label: 'Charging Case',
  title: 'Compact Charging Case',
  description: 'Pocket-sized USB-C charging case delivers 24 extra hours. 15 minutes of charging gives 2 hours of playback.',
  image: "https://images.unsplash.com/photo-1591050643071-fa624a09814d",
  alt: 'O2 Eardop compact charging case open showing earbuds inside, clean white background',
  stat: '24hrs',
  statLabel: 'Case Battery',
  accent: 'text-orange-500',
  bg: 'bg-orange-50'
},
{
  label: 'Touch Controls',
  title: 'Intuitive Touch Surface',
  description: 'Capacitive touch controls on each earbud let you manage music, calls, and ANC without reaching for your phone.',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_4f6b4749e-1790579997674.png",
  alt: 'O2 Eardop touch control surface close-up showing capacitive sensor area, bright studio',
  stat: '5',
  statLabel: 'Gestures',
  accent: 'text-purple-600',
  bg: 'bg-purple-50'
},
{
  label: 'Microphone',
  title: '6-Mic Array',
  description: 'Three microphones per earbud with beamforming technology ensure crystal-clear calls even in noisy environments.',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_4b3cabfde-1790579997690.png",
  alt: 'O2 Eardop microphone array close-up showing mic ports, bright clean background',
  stat: '6',
  statLabel: 'Microphones',
  accent: 'text-teal-600',
  bg: 'bg-teal-50'
}];


const techFeatures = [
{
  icon: 'SignalIcon',
  title: 'Bluetooth 5.3',
  description: 'Latest BT 5.3 for stable, low-latency connection up to 10 meters. Instant pairing with your devices.',
  stat: '10m',
  statLabel: 'Range',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_438132672-1790579998758.png",
  alt: 'Person using O2 Eardops with Bluetooth connectivity, bright gym environment',
  color: 'from-green-50 to-teal-50',
  iconColor: 'text-teal-600',
  iconBg: 'bg-teal-100'
},
{
  icon: 'BoltIcon',
  title: '30-Hour Battery',
  description: '6 hours on a single charge plus 24 more from the case. Fast charging gives 2 hours in just 15 minutes.',
  stat: '30hrs',
  statLabel: 'Total Playtime',
  image: 'https://images.unsplash.com/photo-1565267320115-bafa3fb0518f',
  alt: 'O2 Eardop charging case with battery indicator, clean white background',
  color: 'from-yellow-50 to-orange-50',
  iconColor: 'text-orange-500',
  iconBg: 'bg-orange-100'
},
{
  icon: 'ShieldCheckIcon',
  title: 'IPX5 Water Resistant',
  description: 'Built for your active lifestyle. Sweat, rain, and splashes are no match for IPX5 rated protection.',
  stat: 'IPX5',
  statLabel: 'Water Rating',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1ad9d9e8e-1781001383284.png",
  alt: 'O2 Eardop water resistance test showing water droplets on earbuds, bright background',
  color: 'from-cyan-50 to-sky-50',
  iconColor: 'text-sky-600',
  iconBg: 'bg-sky-100'
},
{
  icon: 'SparklesIcon',
  title: 'Hybrid ANC',
  description: 'Adaptive noise cancellation powered by 6 microphones. Block the world out or let it in with Transparency Mode.',
  stat: '40dB',
  statLabel: 'Noise Reduction',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_472bb183e-1790579997958.png",
  alt: 'O2 Eardop ANC technology component close-up, bright studio lighting',
  color: 'from-blue-50 to-indigo-50',
  iconColor: 'text-blue-600',
  iconBg: 'bg-blue-100'
}];


export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.scroll-reveal');
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('revealed'), i * 90);
            });
          }
        });
      },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    if (techRef.current) observer.observe(techRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── CLOSE-UP DETAILS SECTION ─────────────────────────────────────── */}
      <section ref={sectionRef} className="py-24 bg-muted/30" id="closeup">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Up Close</span>
            <h2 className="font-display font-bold text-section-title text-primary mt-2">
              Every Detail, Perfected
            </h2>
            <div className="section-divider" />
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base leading-relaxed">
              From the precision-machined driver to the ergonomic eartip — every component of O2 Eardops is engineered for excellence.
            </p>
          </div>

          {/* Alternating close-up rows */}
          <div className="flex flex-col gap-16">
            {closeupDetails.map((item, i) =>
            <div
              key={item.label}
              className={`scroll-reveal stagger-${i % 4 + 1} grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${
              i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`
              }>
              
                {/* Image side */}
                <div className={`${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/3] product-image-zoom">
                    <AppImage
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover" />
                  
                    {/* Stat overlay */}
                    <div className="absolute top-4 right-4 glass-card rounded-2xl px-4 py-3 text-center shadow-lg">
                      <p className="text-xl font-bold text-primary leading-none">{item.stat}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.statLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Text side */}
                <div className={`flex flex-col gap-4 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <span className={`text-xs font-bold uppercase tracking-[0.3em] ${item.accent}`}>{item.label}</span>
                  <h3 className="font-display font-bold text-3xl text-primary leading-tight">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                  <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-2xl ${item.bg} self-start`}>
                    <div className={`w-8 h-8 rounded-xl ${item.bg} border border-current/20 flex items-center justify-center`}>
                      <Icon name="CheckCircleIcon" size={18} className={item.accent} />
                    </div>
                    <span className={`text-sm font-bold ${item.accent}`}>Precision Engineered</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY SECTION ───────────────────────────────────────────── */}
      <section ref={techRef} className="py-24 bg-white" id="technology">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Technology</span>
            <h2 className="font-display font-bold text-section-title text-primary mt-2">
              Built for Sound Lovers
            </h2>
            <div className="section-divider" />
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base leading-relaxed">
              Every component is precision-engineered to deliver an uncompromised listening experience.
            </p>
          </div>

          {/* Tech feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techFeatures.map((f, i) =>
            <div
              key={f.title}
              className={`scroll-reveal stagger-${i + 1} product-card-hover rounded-3xl overflow-hidden bg-white border border-border flex flex-col`}>
              
                {/* Image */}
                <div className="relative h-44 overflow-hidden product-image-zoom">
                  <AppImage src={f.image} alt={f.alt} fill className="object-cover" />
                  <div className="absolute top-3 right-3 glass-card rounded-xl px-2.5 py-1.5 text-center">
                    <p className="text-base font-bold text-primary leading-none">{f.stat}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{f.statLabel}</p>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-3`}>
                    <Icon name={f.icon as any} size={20} className={f.iconColor} />
                  </div>
                  <h3 className="font-display font-bold text-base text-primary mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{f.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom banner */}
          <div className="mt-12 scroll-reveal rounded-3xl overflow-hidden relative">
            <AppImage
              src="https://img.rocket.new/generatedImages/rocket_gen_img_4b7414df5-1790579997513.png"
              alt="O2 Eardops premium audio accessories lifestyle collection, bright airy studio, white background"
              width={1200}
              height={300}
              className="w-full object-cover h-48 sm:h-56" />
            
            <div className="absolute inset-0 bg-gradient-to-r from-primary/75 via-primary/40 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 sm:px-12">
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">O2 Gears Technology</p>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">Sound that moves you.</h3>
                <p className="text-white/70 text-sm mt-2 max-w-xs">Engineered for clarity. Tuned for emotion.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>);

}