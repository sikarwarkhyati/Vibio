import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, X } from 'lucide-react';

interface EventFiltersProps {
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  activeFilters: string[];
  onClearFilters: () => void;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  dateFilter,
  onDateFilterChange,
  activeFilters,
  onClearFilters,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={dateFilter} onValueChange={onDateFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="When?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="weekend">This Weekend</SelectItem>
            <SelectItem value="next-week">Next Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="text-xs">
              {filter}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventFilters;