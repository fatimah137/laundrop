import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Services from '../components/Services'
import HowItWorks from '../components/HowItWorks'
import WhyUs from '../components/WhyUs'
import Pricing from '../components/Pricing'
import FAQ from '../components/FAQ'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <HowItWorks />
      <WhyUs />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  )
}
