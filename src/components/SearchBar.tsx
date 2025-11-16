import React, { useCallback, useMemo, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import api from "../lib/api";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface SearchParams {
  q?: string;
  category?: string;
  location?: string;
}

interface SearchBarProps {
  onResults?: (events: unknown[], params: SearchParams) => void;
  variant?: "inline" | "hero";
  className?: string;
  initialQuery?: string;
  initialCategory?: string;
  initialLocation?: string;
}

const CATEGORY_CLEAR_VALUE = "__all__";

const CATEGORIES: { label: string; value: string }[] = [
  { label: "All Categories", value: CATEGORY_CLEAR_VALUE },
  { label: "Concert", value: "concert" },
  { label: "Tech", value: "tech" },
  { label: "Sports", value: "sports" },
  { label: "Workshop", value: "workshop" },
  { label: "Festival", value: "festival" },
];

const SearchBar: React.FC<SearchBarProps> = ({
  onResults,
  variant = "inline",
  className,
  initialQuery = "",
  initialCategory = "",
  initialLocation = "",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    initialCategory === CATEGORY_CLEAR_VALUE ? "" : initialCategory
  );
  const [location, setLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(
    async (override?: Partial<SearchParams>) => {
      const merged: SearchParams = {
        q: query,
        category,
        location,
        ...override,
      };

      const params = Object.fromEntries(
        Object.entries(merged).filter(([, value]) => value !== "" && value != null)
      );

      setLoading(true);
      try {
        const response = await api.get("/events", { params });
        const payload = response.data?.events ?? response.data ?? [];
        onResults?.(Array.isArray(payload) ? payload : [], merged);
      } catch (error) {
        console.error("searchEvents error", error);
        onResults?.([], merged);
      } finally {
        setLoading(false);
      }
    },
    [category, location, onResults, query]
  );

  const formClasses = useMemo(
    () =>
      cn(
        "w-full",
        variant === "hero"
          ? "grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          : "flex items-center gap-2"
      ),
    [variant]
  );

  const inputClasses =
    variant === "hero"
      ? "h-12 text-lg bg-muted/40"
      : "h-10 bg-muted/40";

  const selectTriggerClasses =
    variant === "hero" ? "h-12 text-lg bg-muted/40" : "h-10 bg-muted/40";

  const buttonClasses =
    variant === "hero"
      ? "h-12 px-6 text-lg"
      : "h-10 px-4 text-sm font-medium";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch();
  };

  const handleCategoryChange = (value: string) => {
    const normalized = value === CATEGORY_CLEAR_VALUE ? "" : value;
    setCategory(normalized);
    runSearch({ category: normalized });
  };

  const normalizedCategory = typeof category === "string" ? category.trim() : "";
  const categorySelectValue =
    normalizedCategory === "" ? CATEGORY_CLEAR_VALUE : normalizedCategory;

  const categoryOptions = useMemo(
    () =>
      CATEGORIES.filter((option) => option && option.label?.trim()).map((option, index) => {
        const safeValue = option.value?.trim() || `${CATEGORY_CLEAR_VALUE}-${index}`;
        return {
          ...option,
          value: safeValue,
        };
      }),
    []
  );

  return (
    <form onSubmit={handleSubmit} className={cn(formClasses, className)}>
      <div className={cn("relative", variant === "hero" ? "md:col-span-2" : "flex-1")}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events..."
          className={cn("pl-10", inputClasses)}
          onBlur={() => runSearch()}
        />
      </div>

      <Select value={categorySelectValue} onValueChange={handleCategoryChange}>
        <SelectTrigger className={selectTriggerClasses}>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categoryOptions.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className={cn("relative", variant === "hero" ? "" : "flex-1 max-w-[180px]")}>
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          onBlur={() => runSearch({ location })}
          placeholder="Location"
          className={cn("pl-10", inputClasses)}
        />
      </div>

      <Button
        type="submit"
        className={cn(
          "bg-gradient-to-r from-primary to-primary-600 text-white shadow-sm",
          buttonClasses
        )}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
    </form>
  );
};

export default SearchBar;
