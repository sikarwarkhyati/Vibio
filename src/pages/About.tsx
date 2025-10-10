import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">About Zevo</h1>
          <p className="text-lg text-muted-foreground">
            Zevo is your premier destination for discovering and booking amazing events. 
            We connect people with experiences that matter.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;