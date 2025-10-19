import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Quick answers to the most common questions about booking events and using Zevo.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;