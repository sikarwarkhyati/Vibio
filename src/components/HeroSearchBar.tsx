import React, { useState } from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface HeroSearchBarProps {
  onSearch: (query: string, category: string, location: string) => void;
}

const HeroSearchBar: React.FC<HeroSearchBarProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery, category, location);
  };

  return (
    <div className="bg-gradient-to-r from-primary via-primary to-primary-glow py-16 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Discover Amazing Events
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Find concerts, workshops, conferences, and more happening around you
        </p>
        
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
              <Input
                placeholder="Search events, venues, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 text-lg border-0 bg-muted/30 focus:bg-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 text-lg border-0 bg-muted/30 focus:bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="concerts">Concerts</SelectItem>
                <SelectItem value="tech">Tech & Business</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="workshops">Workshops</SelectItem>
                <SelectItem value="festivals">Festivals</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 pr-4 h-12 text-lg border-0 bg-muted/30 focus:bg-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Button 
              onClick={handleSearch}
              className="h-12 text-lg bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            >
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSearchBar;