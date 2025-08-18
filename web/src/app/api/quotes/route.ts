import { NextRequest, NextResponse } from 'next/server';

interface QuoteResponse {
  text: string;
  author: string;
  category?: string;
  source: string;
}

// Multiple reliable quote APIs as fallbacks
const QUOTE_APIS = [
  {
    name: 'zenquotes',
    url: 'https://zenquotes.io/api/random',
    transform: (data: any): QuoteResponse => ({
      text: data[0].q,
      author: data[0].a,
      category: 'zen',
      source: 'zenquotes.io'
    })
  },
  {
    name: 'quotegarden',
    url: 'https://quote-garden.herokuapp.com/api/v3/quotes/random',
    transform: (data: any): QuoteResponse => ({
      text: data.data[0].quoteText,
      author: data.data[0].quoteAuthor,
      category: 'general',
      source: 'quotegarden.com'
    })
  },
  {
    name: 'quotable',
    url: 'https://api.quotable.io/random?maxLength=150',
    transform: (data: any): QuoteResponse => ({
      text: data.content,
      author: data.author,
      category: data.tags?.[0] || 'general',
      source: 'quotable.io'
    })
  },
  {
    name: 'quotegarden_wisdom',
    url: 'https://quote-garden.herokuapp.com/api/v3/quotes/random?genre=wisdom',
    transform: (data: any): QuoteResponse => ({
      text: data.data[0].quoteText,
      author: data.data[0].quoteAuthor,
      category: 'wisdom',
      source: 'quotegarden.com'
    })
  },
  {
    name: 'quotegarden_life',
    url: 'https://quote-garden.herokuapp.com/api/v3/quotes/random?genre=life',
    transform: (data: any): QuoteResponse => ({
      text: data.data[0].quoteText,
      author: data.data[0].quoteAuthor,
      category: 'life',
      source: 'quotegarden.com'
    })
  }
];

// Islamic-specific quote APIs (using wisdom/philosophy from reliable sources)
const ISLAMIC_QUOTE_APIS = [
  {
    name: 'quotegarden_wisdom',
    url: 'https://quote-garden.herokuapp.com/api/v3/quotes/random?genre=wisdom',
    transform: (data: any): QuoteResponse => ({
      text: data.data[0].quoteText,
      author: data.data[0].quoteAuthor,
      category: 'islamic',
      source: 'quotegarden.com'
    })
  },
  {
    name: 'zenquotes_wisdom',
    url: 'https://zenquotes.io/api/random',
    transform: (data: any): QuoteResponse => ({
      text: data[0].q,
      author: data[0].a,
      category: 'islamic',
      source: 'zenquotes.io'
    })
  },
  {
    name: 'quotegarden_life',
    url: 'https://quote-garden.herokuapp.com/api/v3/quotes/random?genre=life',
    transform: (data: any): QuoteResponse => ({
      text: data.data[0].quoteText,
      author: data.data[0].quoteAuthor,
      category: 'islamic',
      source: 'quotegarden.com'
    })
  }
];

// Simple in-memory cache (in production, use Redis or database)
const quoteCache = new Map<string, { quote: QuoteResponse; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (increased to reduce API calls)

// Track rate limited APIs to avoid them temporarily
const rateLimitedAPIs = new Map<string, number>();
const RATE_LIMIT_COOLDOWN = 60 * 60 * 1000; // 1 hour cooldown for rate limited APIs

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const preferIslamic = searchParams.get('islamic') === 'true';
  
  // Check cache first
  const cacheKey = `quote_${preferIslamic}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached quote');
    return NextResponse.json({
      success: true,
      quote: cached.quote,
      source: 'cache'
    });
  }
  
  try {
    // Choose appropriate APIs based on preference
    const apisToTry = preferIslamic 
      ? [...ISLAMIC_QUOTE_APIS, ...QUOTE_APIS] // Try Islamic first, then general
      : QUOTE_APIS; // Just general APIs
    
         // Try each API in sequence until one works
     for (const api of apisToTry) {
       // Skip APIs that are currently rate limited
       const rateLimitTime = rateLimitedAPIs.get(api.name);
       if (rateLimitTime && Date.now() - rateLimitTime < RATE_LIMIT_COOLDOWN) {
         console.log(`Skipping ${api.name} API (rate limited until ${new Date(rateLimitTime + RATE_LIMIT_COOLDOWN).toLocaleTimeString()})`);
         continue;
       }
       
       try {
         console.log(`Trying ${api.name} API...`);
        
        const response = await fetch(api.url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Soul-Pages-Journal/1.0'
          },
          // 2 second timeout per API (faster fallback)
          signal: AbortSignal.timeout(2000)
        });

                 if (!response.ok) {
           console.log(`${api.name} API returned status ${response.status}`);
           
           // Check for rate limiting
           if (response.status === 429 || response.status === 403) {
             console.log(`${api.name} API rate limited, marking for cooldown`);
             rateLimitedAPIs.set(api.name, Date.now());
             continue;
           }
           
           continue;
         }

        const data = await response.json();
        const quote = api.transform(data);
        
                 // Validate the quote
         if (quote.text && quote.author && quote.text.length > 10 && quote.text.length < 300) {
           console.log(`Successfully fetched quote from ${api.name}`);
           
           // Cache the successful quote
           quoteCache.set(cacheKey, {
             quote,
             timestamp: Date.now()
           });
           
           return NextResponse.json({
             success: true,
             quote,
             source: api.name
           });
         }
             } catch (error) {
         if (error instanceof Error) {
           console.log(`${api.name} API failed: ${error.name} - ${error.message}`);
         } else {
           console.log(`${api.name} API failed:`, error);
         }
         continue;
       }
    }

    // If all external APIs fail, return a fallback quote
    console.log('All external APIs failed, using fallback');
    
    const fallbackQuotes = preferIslamic ? [
      {
        text: "Verily, with hardship comes ease.",
        author: "Quran 94:5",
        category: "islamic",
        source: "fallback"
      },
      {
        text: "Indeed, Allah is with the patient.",
        author: "Quran 2:153",
        category: "islamic",
        source: "fallback"
      },
      {
        text: "The best of people are those who are most beneficial to people.",
        author: "Prophet Muhammad ﷺ",
        category: "islamic",
        source: "fallback"
      }
    ] : [
      {
        text: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb",
        category: "wisdom",
        source: "fallback"
      },
      {
        text: "The journey of a thousand miles begins with one step.",
        author: "Lao Tzu",
        category: "wisdom",
        source: "fallback"
      },
      {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        category: "motivation",
        source: "fallback"
      }
    ];
    
    const randomFallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    
    return NextResponse.json({
      success: false,
      message: 'External APIs unavailable',
      fallback: randomFallback
    });

  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch quote',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
