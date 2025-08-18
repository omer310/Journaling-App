export interface Quote {
  text: string;
  author?: string;
  category?: string;
  source?: string;
  language?: string;
}

// Islamic quotes database - Expanded significantly
const islamicQuotes: Quote[] = [
  // Quran Verses
  {
    text: "Verily, with hardship comes ease.",
    author: "Quran 94:5",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "Indeed, Allah is with the patient.",
    author: "Quran 2:153",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "Allah does not burden a soul beyond that it can bear.",
    author: "Quran 2:286",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "And We have certainly created man in the best of stature.",
    author: "Quran 95:4",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "Indeed, Allah is Forgiving and Merciful.",
    author: "Quran 2:173",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "And whoever fears Allah, He will make for him a way out.",
    author: "Quran 65:2",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "And whoever puts his trust in Allah, then He will suffice him.",
    author: "Quran 65:3",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "Indeed, the most noble of you in the sight of Allah is the most righteous of you.",
    author: "Quran 49:13",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "And We have not sent you, [O Muhammad], except as a mercy to the worlds.",
    author: "Quran 21:107",
    category: "islamic",
    source: "Quran"
  },
  {
    text: "Read in the name of your Lord who created.",
    author: "Quran 96:1",
    category: "islamic",
    source: "Quran"
  },

  // Hadith - Prophet Muhammad ﷺ
  {
    text: "The best of people are those who are most beneficial to people.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Seek knowledge from the cradle to the grave.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The ink of the scholar is more sacred than the blood of the martyr.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most beloved places to Allah are the mosques, and the most disliked places to Allah are the markets.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Allah is beautiful and He loves beauty.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The best of you are those who are best to their families.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Do not be people without minds of your own, saying that if others treat you well you will treat them well, and that if they do wrong you will do wrong. Instead, accustom yourselves to do good if people do good and not to do wrong if they do evil.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most complete of the believers in faith is the one with the best character.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "A Muslim is the one from whose tongue and hands other Muslims are safe.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The believer is not the one who eats his fill while his neighbor is hungry.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "None of you truly believes until he wishes for his brother what he wishes for himself.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The best charity is that given when one is healthy and wealthy.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Modesty is part of faith.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most beloved of places to Allah are the mosques, and the most disliked of places to Allah are the markets.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Whoever removes a worldly grief from a believer, Allah will remove from him one of the griefs of the Day of Resurrection.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most excellent jihad is that for the conquest of self.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "He who has no compassion has no faith.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The best of you are those who have the best manners and character.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Whoever is not grateful to people is not grateful to Allah.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most beloved of people to Allah are those who are most beneficial to people.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The best of you are those who are best to their wives.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Whoever believes in Allah and the Last Day should honor his guest.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most excellent charity is that given to a relative who does not like you.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most beloved of places to Allah are the mosques, and the most disliked of places to Allah are the markets.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Whoever removes a worldly grief from a believer, Allah will remove from him one of the griefs of the Day of Resurrection.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most excellent jihad is that for the conquest of self.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "He who has no compassion has no faith.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The best of you are those who have the best manners and character.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Whoever is not grateful to people is not grateful to Allah.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most beloved of people to Allah are those who are most beneficial to people.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The best of you are those who are best to their wives.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "Whoever believes in Allah and the Last Day should honor his guest.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },
  {
    text: "The most excellent charity is that given to a relative who does not like you.",
    author: "Prophet Muhammad ﷺ",
    category: "islamic",
    source: "Hadith"
  },

  // Islamic Proverbs and Wisdom
  {
    text: "Trust in Allah, but tie your camel.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "The pen is mightier than the sword.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "Knowledge is power.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "Actions speak louder than words.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "A journey of a thousand miles begins with a single step.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "Patience is the key to relief.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "The tongue is like a lion. If you let it loose, it will wound someone.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "A good deed is like a good tree, its roots are firm and its branches are in the sky.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  },
  {
    text: "The best of you are those who are most beneficial to people.",
    author: "Islamic Proverb",
    category: "islamic",
    source: "Proverb"
  }
];

// General inspirational quotes
const generalQuotes: Quote[] = [
  {
    text: "Today Write the story only you can tell.",
    author: "Soul Pages",
    category: "motivation",
    source: "Soul Pages"
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: "motivation",
    source: "General"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "motivation",
    source: "General"
  },
  {
    text: "The pen is mightier than the sword.",
    author: "Edward Bulwer-Lytton",
    category: "motivation",
    source: "General"
  },
  {
    text: "Write what should not be forgotten.",
    author: "Isabel Allende",
    category: "motivation",
    source: "General"
  },
  {
    text: "The purpose of life is to live it, to taste experience to the utmost, to reach out eagerly and without fear for newer and richer experience.",
    author: "Eleanor Roosevelt",
    category: "motivation",
    source: "General"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    category: "motivation",
    source: "General"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "motivation",
    source: "General"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "motivation",
    source: "General"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    category: "motivation",
    source: "General"
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
    category: "motivation",
    source: "General"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "motivation",
    source: "General"
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    category: "motivation",
    source: "General"
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
    category: "motivation",
    source: "General"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha",
    category: "motivation",
    source: "General"
  }
];

// Combine all quotes
const allQuotes = [...islamicQuotes, ...generalQuotes];

export class QuoteService {
  private static instance: QuoteService;
  private lastFetchTime: number = 0;
  private currentQuote: Quote = islamicQuotes[0];
  private usedQuotes: Set<string> = new Set();
  private refreshInterval: number = 4 * 60 * 60 * 1000; // 4 hours instead of 24
  private lastExternalFetchTime: number = 0;
  private externalFetchInterval: number = 30 * 60 * 1000; // 30 minutes for external API calls (increased to respect rate limits)
  private lastForceRefreshTime: number = 0;
  private forceRefreshCooldown: number = 5 * 60 * 1000; // 5 minutes cooldown for force refresh

  static getInstance(): QuoteService {
    if (!QuoteService.instance) {
      QuoteService.instance = new QuoteService();
    }
    return QuoteService.instance;
  }

  async fetchQuote(preferIslamic: boolean = true): Promise<Quote> {
    const now = Date.now();
    
    // Try external APIs first, but with rate limiting
    if (now - this.lastExternalFetchTime > this.externalFetchInterval) {
      try {
        const externalQuote = await this.fetchFromExternalAPI(preferIslamic);
        if (externalQuote) {
          this.currentQuote = externalQuote;
          this.lastFetchTime = Date.now();
          this.lastExternalFetchTime = Date.now();
          return externalQuote;
        }
      } catch (error) {
      }
    } else {
    }

    // Fallback to local quotes with better rotation
    const quotes = preferIslamic ? islamicQuotes : allQuotes;
    const availableQuotes = quotes.filter(quote => !this.usedQuotes.has(quote.text));
    
    // If we've used most quotes, reset the used quotes set
    if (availableQuotes.length < quotes.length * 0.3) {
      this.usedQuotes.clear();
    }
    
    const randomQuote = availableQuotes.length > 0 
      ? availableQuotes[Math.floor(Math.random() * availableQuotes.length)]
      : quotes[Math.floor(Math.random() * quotes.length)];
    
    this.usedQuotes.add(randomQuote.text);
    this.currentQuote = randomQuote;
    this.lastFetchTime = Date.now();
    return randomQuote;
  }

  private async fetchFromExternalAPI(preferIslamic: boolean): Promise<Quote | null> {
    try {
      // Use our backend API route to safely fetch external quotes
      const response = await fetch(`/api/quotes?islamic=${preferIslamic}`, {
        headers: {
          'Accept': 'application/json',
        },
        // 3 second timeout (faster fallback)
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.quote) {
        return {
          text: data.quote.text,
          author: data.quote.author,
          category: data.quote.category,
          source: data.quote.source
        };
      } else if (data.fallback) {
        return {
          text: data.fallback.text,
          author: data.fallback.author,
          category: data.fallback.category,
          source: data.fallback.source
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  getCurrentQuote(): Quote {
    return this.currentQuote;
  }

  getLastFetchTime(): number {
    return this.lastFetchTime;
  }

  shouldRefresh(): boolean {
    const now = Date.now();
    return now - this.lastFetchTime > this.refreshInterval;
  }

  // Get refresh interval in hours for display
  getRefreshIntervalHours(): number {
    return this.refreshInterval / (60 * 60 * 1000);
  }

  getIslamicQuotes(): Quote[] {
    return islamicQuotes;
  }

  getGeneralQuotes(): Quote[] {
    return generalQuotes;
  }

  getAllQuotes(): Quote[] {
    return allQuotes;
  }

  // Get quote statistics
  getQuoteStats() {
    return {
      totalIslamic: islamicQuotes.length,
      totalGeneral: generalQuotes.length,
      totalQuotes: allQuotes.length,
      usedQuotes: this.usedQuotes.size,
      refreshIntervalHours: this.getRefreshIntervalHours(),
      lastExternalFetch: this.lastExternalFetchTime,
      externalFetchIntervalMinutes: this.externalFetchInterval / (60 * 1000),
      externalAPIAvailable: this.isExternalAPIAvailable(),
      timeUntilNextExternalCall: this.getTimeUntilNextExternalCall(),
      forceRefreshAvailable: this.isForceRefreshAvailable(),
      timeUntilForceRefreshAvailable: this.getTimeUntilForceRefreshAvailable(),
      forceRefreshCooldownMinutes: this.forceRefreshCooldown / (60 * 1000)
    };
  }

  // Force refresh external quotes (with cooldown protection)
  async forceRefreshExternal(preferIslamic: boolean = true): Promise<Quote> {
    const now = Date.now();
    
    // Check if we're still in cooldown from a recent force refresh
    if (now - this.lastForceRefreshTime < this.forceRefreshCooldown) {
      const remainingCooldown = Math.ceil((this.forceRefreshCooldown - (now - this.lastForceRefreshTime)) / 1000);
      console.log(`Force refresh in cooldown. Please wait ${remainingCooldown} seconds before trying again.`);
      
      // Return a local quote instead of making external API calls
      const quotes = preferIslamic ? islamicQuotes : allQuotes;
      const availableQuotes = quotes.filter(quote => !this.usedQuotes.has(quote.text));
      
      if (availableQuotes.length < quotes.length * 0.3) {
        this.usedQuotes.clear();
      }
      
      const randomQuote = availableQuotes.length > 0 
        ? availableQuotes[Math.floor(Math.random() * availableQuotes.length)]
        : quotes[Math.floor(Math.random() * quotes.length)];
      
      this.usedQuotes.add(randomQuote.text);
      this.currentQuote = randomQuote;
      this.lastFetchTime = now;
      return randomQuote;
    }
    
    console.log('Force refreshing external quote...');
    this.lastForceRefreshTime = now; // Track the force refresh time
    this.lastExternalFetchTime = 0; // Reset the timer for this force refresh
    return this.fetchQuote(preferIslamic);
  }

  // Check if external APIs are available (not rate limited)
  isExternalAPIAvailable(): boolean {
    const now = Date.now();
    return now - this.lastExternalFetchTime > this.externalFetchInterval;
  }

  // Get time until next external API call
  getTimeUntilNextExternalCall(): number {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastExternalFetchTime;
    return Math.max(0, this.externalFetchInterval - timeSinceLastCall);
  }

  // Check if force refresh is available (not in cooldown)
  isForceRefreshAvailable(): boolean {
    const now = Date.now();
    return now - this.lastForceRefreshTime >= this.forceRefreshCooldown;
  }

  // Get time until force refresh is available
  getTimeUntilForceRefreshAvailable(): number {
    const now = Date.now();
    const timeSinceLastForceRefresh = now - this.lastForceRefreshTime;
    return Math.max(0, this.forceRefreshCooldown - timeSinceLastForceRefresh);
  }

  // Get a fresh local quote (no external API calls)
  getFreshLocalQuote(preferIslamic: boolean = true): Quote {
    const quotes = preferIslamic ? islamicQuotes : allQuotes;
    const availableQuotes = quotes.filter(quote => !this.usedQuotes.has(quote.text));
    
    // If we've used most quotes, reset the used quotes set
    if (availableQuotes.length < quotes.length * 0.3) {
      this.usedQuotes.clear();
    }
    
    const randomQuote = availableQuotes.length > 0 
      ? availableQuotes[Math.floor(Math.random() * availableQuotes.length)]
      : quotes[Math.floor(Math.random() * quotes.length)];
    
    this.usedQuotes.add(randomQuote.text);
    this.currentQuote = randomQuote;
    this.lastFetchTime = Date.now();
    return randomQuote;
  }
}
