import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">Help Center</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions and get the support you need for using Zevo.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Help;