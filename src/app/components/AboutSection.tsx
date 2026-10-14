import React from 'react';

export default function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-3">Who We Are</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary mb-6">About O2-Gears</h2>
        <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-primary">O2-Gears is a brand registered under House of BNG LLP</strong>, focused on
            delivering innovative solutions, building meaningful industry connections, and creating opportunities for
            growth. With a forward-looking approach and a commitment to quality, O2-Gears aims to bring fresh ideas,
            practical solutions, and value-driven experiences to its audience.
          </p>
          <p>
            Driven by innovation, collaboration, and excellence, O2-Gears strives to build a strong presence in its
            domain while adapting to evolving market needs. Backed by the vision of House of BNG LLP, the brand is
            committed to creating lasting value through its offerings and partnerships.
          </p>
        </div>
      </div>
    </section>
  );
}
