"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, RefreshCw } from "lucide-react";
import HalloweenPumpkin from "@/components/HalloweenPumpkin";
import HalloweenTop5Leaderboard from "@/components/HalloweenTop5Leaderboard";

// WMO Weather interpretation codes with real precipitation verification
function getWeatherStatus(code: number, rainAmount = 0, precipitation = 0): { label: string; type: "sunny" | "cloudy" | "rainy" } {
  // If weather code says drizzle (51-55) but rain/precip is negligible (< 0.5mm), it is not actively raining -> Cloudy / Partly Cloudy
  if (code >= 51 && code <= 55 && precipitation < 0.5 && rainAmount < 0.5) {
    return { label: "Partly Cloudy", type: "cloudy" };
  }
  if (code === 0 || code === 1) return { label: "Sunny", type: "sunny" };
  if (code === 2) return { label: "Partly Cloudy", type: "cloudy" };
  if (code === 3) return { label: "Overcast", type: "cloudy" };
  if (code >= 45 && code <= 48) return { label: "Foggy", type: "cloudy" };
  if (code >= 51 && code <= 67) {
    // Only classify as Rainy if precipitation is actually measurable (>= 0.5mm) or moderate/heavy code (>= 63)
    if (precipitation >= 0.5 || rainAmount >= 0.5 || code >= 63) {
      return { label: "Rainy", type: "rainy" };
    }
    return { label: "Partly Cloudy", type: "cloudy" };
  }
  if (code >= 71 && code <= 77) return { label: "Snow", type: "cloudy" };
  if (code >= 80 && code <= 99) {
    if (precipitation >= 0.5 || rainAmount >= 0.5 || code >= 81) {
      return { label: "Rain Showers", type: "rainy" };
    }
    return { label: "Partly Cloudy", type: "cloudy" };
  }
  return { label: "Partly Cloudy", type: "cloudy" };
}

export interface CreativeQuote {
  text: string;
  author: string;
  role?: string;
}

export const CREATIVE_QUOTES: CreativeQuote[] = [
  // World-Class Industrial & Product Design Legends
  { text: "Less, but better.", author: "Dieter Rams", role: "Industrial Design Legend" },
  { text: "Good design is as little design as possible.", author: "Dieter Rams", role: "Braun & Vitsœ" },
  { text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs", role: "Apple Co-founder" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", role: "Apple Co-founder" },
  { text: "Simplicity isn’t just the absence of clutter. It’s about bringing order to complexity.", author: "Jony Ive", role: "Former Chief Design Officer, Apple" },
  { text: "The details are not the details. They make the design.", author: "Charles Eames", role: "Eames Office" },
  { text: "Recognizing the need is the primary condition for design.", author: "Charles Eames", role: "Eames Office" },
  { text: "What works good is better than what looks good, because what works good lasts.", author: "Ray Eames", role: "Eames Office" },
  { text: "Design needs to be plugged into human behavior naturally.", author: "Naoto Fukasawa", role: "Product Designer & Muji Advisor" },
  { text: "Design is not just about making things look good, it is about communicating the essence of things.", author: "Kenya Hara", role: "Art Director, MUJI" },
  { text: "Design brings ideas to life, transforming complex technologies into meaningful experiences.", author: "Yves Béhar", role: "fuseproject" },

  // Graphic Design, Typography & Identity Masters
  { text: "Design is so simple, that's why it is so complicated.", author: "Paul Rand", role: "Corporate Identity Legend (IBM, ABC, UPS)" },
  { text: "Don't try to be original, just try to be good.", author: "Paul Rand", role: "Graphic Design Icon" },
  { text: "If you can design one thing, you can design everything.", author: "Massimo Vignelli", role: "Modernist Master" },
  { text: "Styles come and go. Good design is a language, not a style.", author: "Massimo Vignelli", role: "Unimark & Vignelli Associates" },
  { text: "Design is thinking made visual.", author: "Saul Bass", role: "Title Sequence & Logo Legend" },
  { text: "It took me a few seconds to draw it, but it took me 34 years of experience to learn how to draw it in a few seconds.", author: "Paula Scher", role: "Partner, Pentagram" },
  { text: "There are three responses to a piece of design – yes, no, and WOW! Wow is the one to aim for.", author: "Milton Glaser", role: "Creator of I ❤️ NY" },
  { text: "To design is to communicate clearly by whatever means you can control or master.", author: "Milton Glaser", role: "Graphic Design Pioneer" },
  { text: "Good design is about making something intelligible and memorable. Great design is about making something memorable and meaningful.", author: "Erik Spiekermann", role: "Typographer & Type Designer" },
  { text: "The grid system is an aid, not a guarantee.", author: "Josef Müller-Brockmann", role: "Pioneer of Swiss Style" },
  { text: "Good design shouldn't be about showing off; it should be about serving the user.", author: "Susan Kare", role: "Original Apple Macintosh Icon Designer" },
  { text: "Good art inspires; good design motivates.", author: "Otl Aicher", role: "Ulm School & Munich 1972" },
  { text: "Digital design is like painting, except the paint never dries.", author: "Neville Brody", role: "The Face & Research Studios" },
  { text: "Design is not what it looks like, it’s what it does.", author: "Alan Fletcher", role: "Co-founder, Pentagram" },
  { text: "You have to be willing to take risks to create something that hasn't been seen before.", author: "Herb Lubalin", role: "Typographer & ITC Avant Garde" },
  { text: "Never fall in love with an idea. If the one you're with isn't doing the job, there's always another.", author: "Chip Kidd", role: "Iconic Book Cover Designer" },
  { text: "Confusion is the welcome mat at the door of creativity.", author: "Tibor Kalman", role: "M&Co & Colors Magazine" },
  { text: "There's no such thing as a bad client. Part of our job is to do good work and get the client to accept it.", author: "Bob Gill", role: "Illustrator & Pentagram Co-founder" },
  { text: "You can have an art experience in front of a Rembrandt, or in front of a piece of graphic design.", author: "Stefan Sagmeister", role: "Sagmeister & Walsh" },
  { text: "Creativity is a habit, not just a talent. Do what you love and don't compromise.", author: "Jessica Walsh", role: "Founder, &Walsh" },
  { text: "If you're not failing every now and then, it's a sign you're not being very innovative.", author: "Michael Bierut", role: "Partner, Pentagram" },
  { text: "People ignore design that ignores people.", author: "Frank Chimero", role: "Designer & Writer" },

  // Legendary Advertising & Creative Directors
  { text: "If it doesn't sell, it isn't creative.", author: "David Ogilvy", role: "The Father of Advertising" },
  { text: "The best ideas come as jokes. Make your thinking as funny as possible.", author: "David Ogilvy", role: "Ogilvy & Mather" },
  { text: "Creativity can solve almost any problem. The defeat of habit by originality overcomes everything.", author: "George Lois", role: "Esquire Magazine & Big Idea Pioneer" },
  { text: "An idea can turn to dust or magic, depending on the talent that rubs against it.", author: "Bill Bernbach", role: "DDB Co-founder" },
  { text: "Most ideas are a bit scary, and if an idea isn't scary, it's not an idea at all.", author: "Lee Clow", role: "TBWA\\Chiat\\Day & Apple 1984" },
  { text: "Dare to look foolish. The best work comes from the places you least expect.", author: "Dan Wieden", role: "Co-Founder, Wieden+Kennedy" },

  // Architecture & Spatial Visionaries
  { text: "There are 360 degrees, so why stick to one?", author: "Zaha Hadid", role: "Pritzker Architecture Laureate" },
  { text: "I believe that architecture should be quiet, and let light and wind speak.", author: "Tadao Ando", role: "Pritzker Architecture Laureate" },
  { text: "Architecture is the learned game, correct and magnificent, of forms assembled in the light.", author: "Le Corbusier", role: "Modernist Architecture Master" },
  { text: "Art and technology: a new unity.", author: "Walter Gropius", role: "Founder of the Bauhaus" },
  { text: "Form must have a content, and that content must be linked with nature.", author: "Alvar Aalto", role: "Finnish Architect & Designer" },
  { text: "When I am working on a problem, I never think about beauty, but when I have finished, if the solution is not beautiful, I know it is wrong.", author: "Buckminster Fuller", role: "Architect & Inventor" },
  { text: "Architecture should speak of its time and place, but yearn for timelessness.", author: "Frank Gehry", role: "Pritzker Architecture Laureate" },

  // Contemporary Creative Innovators & Storytellers
  { text: "Simplicity is about subtracting the obvious and adding the meaningful.", author: "John Maeda", role: "The Laws of Simplicity" },
  { text: "A delayed game is eventually good, but a rushed game is forever bad.", author: "Shigeru Miyamoto", role: "Creative Legend, Nintendo" },
  { text: "Do everything by hand, even when using the computer.", author: "Hayao Miyazaki", role: "Director, Studio Ghibli" },
  { text: "Steal from anywhere that resonates with inspiration or fuels your imagination.", author: "Austin Kleon", role: "Author of Steal Like an Artist" },
  { text: "You can’t use up creativity. The more you use, the more you have.", author: "Maya Angelou", role: "Poet & Creator" },
  { text: "Inspiration exists, but it has to find you working.", author: "Pablo Picasso", role: "Artist & Master of Modern Art" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", role: "Renaissance Polymath" },
  { text: "Good design is obvious. Great design is transparent.", author: "Joe Sparano", role: "Designer & Educator" },
  { text: "Everything is designed. Few things are designed well.", author: "Brian Reed", role: "Front-end Architect" },
  { text: "Design is where science and art break even.", author: "Robin Mathew", role: "Design Thinker" },
  { text: "Don't be afraid to allow your work to surprise you.", author: "Bruce Mau", role: "Massive Change Network" },
  { text: "Design is not for philosophy, it's for life.", author: "Issey Miyake", role: "Miyake Design Studio" },
  { text: "Make it simple, but significant.", author: "Don Draper", role: "Mad Men" },
  { text: "Creativity is nothing but a mind set free.", author: "Torrie T. Asai", role: "Creative Thinker" }
];

export const QUOTES = CREATIVE_QUOTES;

const QUOTES_STORAGE_KEY = "cc_creative_quotes_shuffle_v3";

/**
 * Returns the next quote index from a non-repeating shuffle deck.
 * Guaranteed to cycle through all quotes without repeats until every quote has been shown.
 */
export function getNextNonRepeatingQuoteIndex(currentIndex?: number): number {
  if (typeof window === "undefined") {
    return Math.floor(Math.random() * CREATIVE_QUOTES.length);
  }

  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY);
    let pool: number[] = raw ? JSON.parse(raw) : [];

    // Filter out invalid indices in case list size changed
    pool = pool.filter(i => typeof i === "number" && i >= 0 && i < CREATIVE_QUOTES.length);

    // If deck is empty, build a fresh shuffled deck
    if (pool.length === 0) {
      pool = Array.from({ length: CREATIVE_QUOTES.length }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      // Ensure the first quote of new deck doesn't match the current one
      if (currentIndex !== undefined && pool[0] === currentIndex && pool.length > 1) {
        [pool[0], pool[1]] = [pool[1], pool[0]];
      }
    }

    const nextIndex = pool.shift() ?? 0;
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(pool));
    return nextIndex;
  } catch (e) {
    return Math.floor(Math.random() * CREATIVE_QUOTES.length);
  }
}

export function InspirationalQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const rotateQuote = () => {
    setIsFading(true);
    setTimeout(() => {
      setQuoteIndex(prev => getNextNonRepeatingQuoteIndex(prev));
      setIsFading(false);
    }, 220);
  };

  useEffect(() => {
    // Pick next non-repeating quote on mount
    setQuoteIndex(getNextNonRepeatingQuoteIndex());

    // Auto rotate every 16 seconds
    const interval = setInterval(() => {
      rotateQuote();
    }, 16000);

    return () => clearInterval(interval);
  }, []);

  const quote = CREATIVE_QUOTES[quoteIndex] || CREATIVE_QUOTES[0];

  return (
    <div 
      onClick={rotateQuote}
      title="คลิกเพื่อหมุนเวียนคำบันดาลใจจากครีเอทีฟระดับโลกท่านถัดไป"
      className="text-center max-w-3xl mx-auto px-4 select-none cursor-pointer group transition-all"
    >
      <div className={`transition-all duration-300 ease-out transform ${isFading ? "opacity-0 translate-y-1 scale-[0.99]" : "opacity-100 translate-y-0 scale-100"}`}>
        <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-serif italic text-foreground mb-2 leading-snug sm:leading-relaxed group-hover:text-primary transition-colors">
          "{quote.text}"
        </p>
        <div className="flex flex-col items-center justify-center gap-0.5 mt-1">
          <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-primary tracking-[0.15em] sm:tracking-[0.25em] uppercase text-center">
            — {quote.author} —
          </p>
          {quote.role && (
            <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-sans tracking-normal font-normal text-center">
              ({quote.role})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const MAX_WEATHER_CACHE_AGE = 15 * 60 * 1000; // 15 minutes
const WEATHER_STORAGE_KEY = "cc_weather_cache_v5";

export default function WeatherWidget({ 
  variant = "full",
  showQuote = true 
}: { 
  variant?: "full" | "quoteOnly" | "hidden";
  showQuote?: boolean;
}) {
  const [weather, setWeather] = useState<{ temp: number; label: string; type: "sunny" | "cloudy" | "rainy" }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(WEATHER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.temp === "number" && parsed.timestamp && (Date.now() - parsed.timestamp < MAX_WEATHER_CACHE_AGE)) {
            return { temp: parsed.temp, label: parsed.label, type: parsed.type };
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return { temp: 29, label: "Partly Cloudy", type: "cloudy" };
  });
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [dateString, setDateString] = useState("");

  const fetchWeather = async (lat = 18.7961, lon = 98.9793) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation,rain`);
      const data = await res.json();
      if (data && data.current) {
        const rainVal = Number(data.current.rain || 0);
        const precipVal = Number(data.current.precipitation || 0);
        const status = getWeatherStatus(data.current.weather_code, rainVal, precipVal);
        const newWeather = {
          temp: Math.round(data.current.temperature_2m),
          label: status.label,
          type: status.type,
        };
        setWeather(newWeather);
        if (typeof window !== "undefined") {
          localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify({ ...newWeather, timestamp: Date.now() }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch weather", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try immediate read from localStorage with cache validity check
    try {
      const saved = localStorage.getItem(WEATHER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.temp === "number" && parsed.timestamp && (Date.now() - parsed.timestamp < MAX_WEATHER_CACHE_AGE)) {
          setWeather({ temp: parsed.temp, label: parsed.label, type: parsed.type });
        }
      }
    } catch (e) {}

    // Check geolocation or fallback to Chiang Mai (STeP)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          fetchWeather(18.7961, 98.9793);
        },
        { timeout: 4000 }
      );
    } else {
      fetchWeather(18.7961, 98.9793);
    }

    setQuoteIndex(getNextNonRepeatingQuoteIndex());
    
    const today = new Date();
    setDateString(today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  const quote = QUOTES[quoteIndex];

  // Calculate needle rotation based on weather type
  let needleRotation = 0;
  if (weather.type === "cloudy") needleRotation = -35;
  if (weather.type === "sunny") needleRotation = 0;
  if (weather.type === "rainy") needleRotation = 35;

  return (
    <div className="flex flex-col items-center justify-center mt-0 sm:-mt-2 mb-0 w-full">
      {/* If variant is quoteOnly, we just hide the weather part using opacity-0 so layout remains EXACTLY identical */}
      <div className={variant === "quoteOnly" ? "opacity-0 pointer-events-none" : ""}>
        {/* Character Image (Multi-layer Lo-fi Animation with Weather - Responsive on Mobile) */}
        <div className="relative w-[150px] h-[150px] sm:w-[220px] sm:h-[220px] md:w-[290px] md:h-[290px] flex flex-col items-center justify-center mt-1 sm:mt-0 pointer-events-none scale-95 sm:scale-100 -mb-5 sm:-mb-7 md:-mb-10">
          {/* Weather Background Effects */}
          {weather.type === "sunny" && (
            <img 
              src="/animation/พระอาทิตย์ (Sunny).png" 
              alt="Sunny" 
              className="absolute inset-0 w-full h-full object-contain char-sunny"
            />
          )}
          
          {weather.type === "cloudy" && (
            <>
              {/* Original 3 Clouds */}
              <img src="/animation/เมฆ (Cloudy)_1.png" alt="Cloudy 1" className="absolute inset-0 w-full h-full object-contain cloud-1" />
              <img src="/animation/เมฆ (Cloudy)_2.png" alt="Cloudy 2" className="absolute inset-0 w-full h-full object-contain cloud-2" />
              <img src="/animation/เมฆ (Cloudy)_3.png" alt="Cloudy 3" className="absolute inset-0 w-full h-full object-contain cloud-3" />
            </>
          )}

          {/* Character Base & Seat */}
          <img src="/animation/ฐานพื้นหลัง.png" alt="Base" className="absolute inset-0 w-full h-full object-contain" />
          <img src="/animation/ที่นั่ง.png" alt="Seat" className="absolute inset-0 w-full h-full object-contain" />

          {/* Legs (Behind Body, Right first so Left is on top) */}
          <img src="/animation/เท้าขวา.png" alt="Right Foot" className="absolute inset-0 w-full h-full object-contain char-leg-right" />
          <img src="/animation/เท้าซ้าย.png" alt="Left Foot" className="absolute inset-0 w-full h-full object-contain char-leg-left" />

          {/* Body (On top of legs) */}
          <img src="/animation/ตัว.png" alt="Body" className="absolute inset-0 w-full h-full object-contain" />

          {/* Face (Eyes and Mouth moving together) */}
          <div className="absolute inset-0 w-full h-full char-face-look">
            {/* Eyes */}
            <img src="/animation/ตา.png" alt="Eyes" className="absolute inset-0 w-full h-full object-contain char-eyes-blink" />
            
            {/* Mouth */}
            <img src="/animation/ปาก_1.png" alt="Mouth 1" className="absolute inset-0 w-full h-full object-contain char-mouth-1" />
            <img src="/animation/ปาก_2.png" alt="Mouth 2" className="absolute inset-0 w-full h-full object-contain char-mouth-2" />
          </div>

          {/* Weather Foreground Effects (Rain) */}
          {weather.type === "rainy" && (
            <>
              <img src="/animation/ฝน (Rainy)_1.png" alt="Rainy" className="absolute inset-0 w-full h-full object-contain anim-frame-4 f1" />
              <img src="/animation/ฝน (Rainy)_2.png" alt="Rainy" className="absolute inset-0 w-full h-full object-contain anim-frame-4 f2" />
              <img src="/animation/ฝน (Rainy)_3.png" alt="Rainy" className="absolute inset-0 w-full h-full object-contain anim-frame-4 f3" />
              <img src="/animation/ฝน (Rainy)_4.png" alt="Rainy" className="absolute inset-0 w-full h-full object-contain anim-frame-4 f4" />
            </>
          )}

          {/* Halloween Pumpkin sitting directly on the green grass mound next to the logs */}
          <div className="absolute bottom-[30.5%] sm:bottom-[31%] md:bottom-[31%] right-[13%] sm:right-[14%] md:right-[14.5%] z-20 pointer-events-auto">
            <HalloweenPumpkin className="w-[36px] h-[33px] sm:w-[48px] sm:h-[44px] md:w-[62px] md:h-[57px]" />
          </div>

          {/* Desktop & Tablet Top 5 Leaderboard (Moved to the right to clear speech bubble, white minimal card) */}
          <div className="hidden sm:block absolute left-[136%] md:left-[142%] lg:left-[146%] top-0 md:top-1 w-[195px] md:w-[225px] z-30 pointer-events-auto">
            <HalloweenTop5Leaderboard />
          </div>
        </div>

        {/* Weather Text & Date (Real Weather - No Manual Switchers) */}
        <div className="text-center font-light tracking-wide text-[#78716c] -mt-7 sm:-mt-9 md:-mt-11 mb-0 relative z-30">
          <p className="text-xs sm:text-base md:text-lg text-foreground font-normal mb-0.5">{weather.label} & {weather.temp}°C</p>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">{dateString}</p>
        </div>

        {/* Mobile Top 5 Leaderboard Widget (Below weather text) */}
        <div className="block sm:hidden w-full max-w-[260px] mx-auto mt-2.5 z-30 pointer-events-auto">
          <HalloweenTop5Leaderboard />
        </div>
      </div>
      
      {/* Quote */}
      {showQuote && (
        <div className={variant === "hidden" ? "opacity-0" : "opacity-100"}>
          <div className={`${variant === "quoteOnly" ? "-mt-3 sm:-mt-6 md:-mt-8 mb-0 sm:mb-1" : "mt-4 sm:mt-6 md:mt-7 mb-2 sm:mb-3"} text-center max-w-3xl mx-auto px-3`}>
            <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-serif italic text-foreground mb-2 leading-snug sm:leading-relaxed">"{quote.text}"</p>
            <div className="flex flex-col items-center justify-center gap-0.5 mt-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-primary tracking-[0.15em] sm:tracking-[0.25em] uppercase text-center">
                — {quote.author} —
              </p>
              {quote.role && (
                <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-sans tracking-normal font-normal text-center">
                  ({quote.role})
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
