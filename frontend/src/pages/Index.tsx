import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import IntroSplash from "@/components/landing/IntroSplash";
import Categories from "@/components/landing/Categories";
import CollaborateSlide from "@/components/landing/CollaborateSlide";
import HowItWorks from "@/components/landing/HowItWorks";
import EarningsSlide from "@/components/landing/EarningsSlide";
import FutureSlide from "@/components/landing/FutureSlide";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <IntroSplash />
      <Navbar />
      <Hero />
      <Categories />
      <CollaborateSlide />
      <HowItWorks />
      <EarningsSlide />
      <FutureSlide />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
