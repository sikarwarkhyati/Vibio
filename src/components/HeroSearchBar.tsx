import React from "react";
import SearchBar, { SearchParams } from "./SearchBar";

interface HeroSearchBarProps {
  onResults?: (events: unknown[], params: SearchParams) => void;
}

const HeroSearchBar: React.FC<HeroSearchBarProps> = ({ onResults }) => {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-600 py-16 px-4 text-white">
      <div className="container mx-auto text-center space-y-6">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide">
            Welcome to Vibio
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Discover unforgettable events around you
          </h1>
          <p className="mx-auto max-w-2xl text-base text-white/80 md:text-lg">
            Search concerts, workshops, tech meetups, and everything in between. Filter by
            category or location and let Vibio surface the perfect experience.
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
          <SearchBar onResults={onResults} variant="hero" />
        </div>
      </div>
    </section>
  );
};

export default HeroSearchBar;
