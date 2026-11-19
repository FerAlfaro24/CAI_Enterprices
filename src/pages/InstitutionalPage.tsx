import { useEffect } from 'react'
import { HeroSection } from '../features/landing/components/HeroSection'
import { CertificationStrip, StatisticsSection } from '../features/landing/components/TrustSections'
import { HistorySection } from '../features/landing/components/HistorySection'
import { ServicesSection } from '../features/landing/components/ServicesSection'
import { AudienceSection, ProgramsSection, CaiLifeSection, TrialClassSection } from '../features/landing/components/ProgramsSection'
import { ContactSection, FaqSection, PlatformPreviewSection } from '../features/landing/components/ContactSections'

export function InstitutionalPage() {
  useEffect(() => {
    document.title = 'CAI · Aprende inglés con confianza · Prototipo'
  }, [])

  return (
    <>
      <HeroSection />
      <CertificationStrip />
      <StatisticsSection />
      <HistorySection />
      <ServicesSection />
      <CaiLifeSection />
      <AudienceSection />
      <TrialClassSection />
      <ProgramsSection />
      <PlatformPreviewSection />
      <FaqSection />
      <ContactSection />
    </>
  )
}
