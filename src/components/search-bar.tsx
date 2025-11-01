import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number; // Delay in milliseconds for debouncing
}

export function SearchBar({
  onSearch,
  placeholder = "Search...",
  delay = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  // Debounce the search to avoid too many re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, onSearch]);

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500 transition duration-150"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
