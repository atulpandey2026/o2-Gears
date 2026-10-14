'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-20 hero-gradient-dark relative overflow-hidden">
      {/* Blobs */}
      <div
        className="blob-bg w-80 h-80 -top-20 -left-20"
        style={{ background: 'rgba(79, 195, 247, 0.15)' }}
      />
      <div
        className="blob-bg w-64 h-64 -bottom-10 -right-10"
        style={{ background: 'rgba(33, 150, 243, 0.1)' }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-5">
          <Icon name="EnvelopeIcon" size={26} className="text-secondary" />
        </div>
        <h2 className="font-display font-bold text-section-title text-white mb-3">
          Stay in the Loop
        </h2>
        <p className="text-white/60 text-base leading-relaxed mb-8">
          Get exclusive deals, new product launches, and audio tips delivered to your inbox.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-3 bg-green-500/20 border border-green-500/30 rounded-2xl px-6 py-4">
            <Icon name="CheckCircleIcon" size={22} className="text-green-400" />
            <span className="text-green-300 font-semibold">You&apos;re subscribed! Welcome to O2 Gears.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 h-12 px-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-secondary/60 focus:ring-2 focus:ring-secondary/20 transition-all"
            />
            <button
              type="submit"
              className="btn-accent h-12 px-7 rounded-full font-bold text-sm flex-shrink-0 flex items-center gap-2 justify-center"
            >
              Subscribe
              <Icon name="ArrowRightIcon" size={15} className="text-white" />
            </button>
          </form>
        )}
        <p className="text-white/30 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}