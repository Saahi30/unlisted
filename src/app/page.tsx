import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import MarqueeSection from '@/components/sections/MarqueeSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import CompaniesSection from '@/components/sections/CompaniesSection';
import TrustSection from '@/components/sections/TrustSection';
import DematerializationSection from '@/components/sections/DematerializationSection';
import CtaSection from '@/components/sections/CtaSection';

export default function Home() {
  return (
    <>
      <Header />
      <main className="w-full">
        <HeroSection />
        <MarqueeSection />
        <HowItWorksSection />
        <CompaniesSection />
        <DematerializationSection />
        <TrustSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
