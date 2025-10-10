import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">Zevo Blog</h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with the latest news, event trends, and insider tips from the world of events.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;