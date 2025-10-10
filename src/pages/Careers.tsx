import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">Careers at Zevo</h1>
          <p className="text-lg text-muted-foreground">
            Join our team and help us create unforgettable experiences for event-goers everywhere.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;