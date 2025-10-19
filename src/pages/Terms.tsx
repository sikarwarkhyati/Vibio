import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">Terms & Conditions</h1>
          <p className="text-lg text-muted-foreground">
            Please read our terms and conditions carefully before using Zevo's services.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;