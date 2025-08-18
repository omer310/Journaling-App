'use client';

import { useState, useEffect } from 'react';
import { RiRefreshLine, RiHeartLine, RiHeartFill, RiSettings3Line } from 'react-icons/ri';
import { QuoteService, type Quote } from '@/services/quotes';

export function MotivationBanner() {
  const [currentQuote, setCurrentQuote] = useState<Quote>({
    text: "Today Write the story only you can tell.",
    author: "Soul Pages",
    category: "motivation"
  });
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preferIslamic, setPreferIslamic] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const quoteService = QuoteService.getInstance();

  // Load preferences from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('soul-pages-favorite-quotes');
    const savedPreference = localStorage.getItem('soul-pages-prefer-islamic');
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    if (savedPreference !== null) {
      setPreferIslamic(JSON.parse(savedPreference));
    }
  }, []);

  // Save preferences to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('soul-pages-favorite-quotes', JSON.stringify(newFavorites));
  };

  const savePreference = (newPreference: boolean) => {
    setPreferIslamic(newPreference);
    localStorage.setItem('soul-pages-prefer-islamic', JSON.stringify(newPreference));
  };

  // Fetch quote
  const fetchQuote = async () => {
    setLoading(true);
    try {
      const quote = await quoteService.fetchQuote(preferIslamic);
      setCurrentQuote(quote);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      // Use fallback quote
      setCurrentQuote({
        text: "Today Write the story only you can tell.",
        author: "Soul Pages",
        category: "motivation"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load new quote on mount
  useEffect(() => {
    fetchQuote();
  }, []);

  // Auto-refresh quote every 4 hours (instead of 24)
  useEffect(() => {
    if (quoteService.shouldRefresh()) {
      fetchQuote();
    }
  }, []);

  const toggleFavorite = () => {
    const quoteText = currentQuote.text;
    const newFavorites = favorites.includes(quoteText)
      ? favorites.filter(fav => fav !== quoteText)
      : [...favorites, quoteText];
    
    saveFavorites(newFavorites);
  };

  const togglePreference = () => {
    const newPreference = !preferIslamic;
    savePreference(newPreference);
    // Fetch new quote with new preference
    fetchQuote();
  };

  const isFavorite = favorites.includes(currentQuote.text);
  const stats = quoteService.getQuoteStats();

  return (
    <div className="flex-1 bg-surface rounded-xl shadow-lg p-6 relative group">
      {/* Quote content */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-text-primary mb-2 leading-relaxed">
            "{currentQuote.text}"
          </h2>
          {currentQuote.author && (
            <p className="text-sm text-text-secondary italic">
              — {currentQuote.author}
              {currentQuote.category === 'islamic' && (
                <span className="ml-2 text-primary">• Islamic</span>
              )}
            </p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleFavorite}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <RiHeartFill className="w-5 h-5 text-red-500" />
            ) : (
              <RiHeartLine className="w-5 h-5 text-text-secondary hover:text-red-500" />
            )}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            aria-label="Quote settings"
          >
            <RiSettings3Line className="w-5 h-5 text-text-secondary hover:text-primary" />
          </button>
          
          <button
            onClick={fetchQuote}
            disabled={loading}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
            aria-label="Get new quote"
          >
            <RiRefreshLine className={`w-5 h-5 text-text-secondary hover:text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg p-4 z-10">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-primary">Quote Preferences</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferIslamic}
                onChange={togglePreference}
                className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
              />
              <span className="text-sm text-text-secondary">
                Prefer Islamic quotes when available
              </span>
            </label>
            
            <div className="text-xs text-text-secondary space-y-1">
              <div>
                {preferIslamic 
                  ? "Showing Islamic and general inspirational quotes"
                  : "Showing all inspirational quotes"
                }
              </div>
              <div className="pt-2 border-t border-border">
                <div className="font-medium text-text-primary mb-1">Quote Statistics:</div>
                <div>• {stats.totalIslamic} Islamic quotes available</div>
                <div>• {stats.totalGeneral} General quotes available</div>
                <div>• Auto-refresh every {stats.refreshIntervalHours} hours</div>
                <div>• {stats.usedQuotes} quotes used recently</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-surface/80 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Quote source indicator */}
      {currentQuote.source && (
        <div className="absolute bottom-2 right-2">
          <span className="text-xs text-text-secondary opacity-60">
            via {currentQuote.source}
          </span>
        </div>
      )}
    </div>
  );
}
