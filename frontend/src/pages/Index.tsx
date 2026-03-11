import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import VisualShowcase from "@/components/landing/VisualShowcase";
import Categories from "@/components/landing/Categories";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <VisualShowcase />
      <Categories />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
