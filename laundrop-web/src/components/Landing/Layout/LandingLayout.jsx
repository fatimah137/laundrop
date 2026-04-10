import Navbar from "../Sections/Navbar/Navbar";
import Hero from "../Sections/Hero/Hero";
import Services from "../Sections/Services/Services";
import HowItWorks from "../Sections/HowItWorks/HowItWorks";
import Stats from "../Sections/Stats/Stats";
import WhyUs from "../Sections/WhyUs/WhyUs";
import Pricing from "../Sections/Pricing/Pricing";
import FAQ from "../Sections/FAQ/FAQ";
import CTA from "../Sections/CTA/CTA";
import Footer from "../Sections/Footer/Footer";

export default function LandingLayout() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <Stats />
      <WhyUs />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}