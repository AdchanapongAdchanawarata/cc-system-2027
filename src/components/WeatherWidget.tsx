"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, RefreshCw } from "lucide-react";

// WMO Weather interpretation codes
function getWeatherStatus(code: number): { label: string; type: "sunny" | "cloudy" | "rainy" } {
  if (code === 0 || code === 1) return { label: "Sunny", type: "sunny" };
  if (code === 2) return { label: "Partly Cloudy", type: "cloudy" };
  if (code === 3) return { label: "Overcast", type: "cloudy" };
  if (code >= 45 && code <= 48) return { label: "Foggy", type: "cloudy" };
  if (code >= 51 && code <= 67) return { label: "Rainy", type: "rainy" };
  if (code >= 71 && code <= 77) return { label: "Snow", type: "cloudy" };
  if (code >= 80 && code <= 99) return { label: "Rainy", type: "rainy" };
  return { label: "Partly Cloudy", type: "cloudy" };
}

const QUOTES = [
  { text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs" },
  { text: "Good design is obvious. Great design is transparent.", author: "Joe Sparano" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Make it simple, but significant.", author: "Don Draper" },
  { text: "Creativity is nothing but a mind set free.", author: "Torrie T. Asai" },
  { text: "Less, but better.", author: "Dieter Rams" },
  { text: "Everything is designed. Few things are designed well.", author: "Brian Reed" }
];

const MAX_WEATHER_CACHE_AGE = 30 * 60 * 1000; // 30 minutes

export function InspirationalQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Date.now() / 86400000) % QUOTES.length);
  }, []);

  const quote = QUOTES[quoteIndex];

  return (
    <div className="text-center max-w-3xl mx-auto px-4 select-none">
      <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-serif italic text-foreground mb-1 leading-snug sm:leading-relaxed">
        "{quote.text}"
      </p>
      <p className="text-[10px] sm:text-xs md:text-sm font-medium text-primary tracking-[0.15em] sm:tracking-[0.25em] uppercase">
        — {quote.author} —
      </p>
    </div>
  );
}

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
        const saved = localStorage.getItem("cc_weather_cache");
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
    return { temp: 28, label: "Chiang Mai", type: "cloudy" };
  });
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [dateString, setDateString] = useState("");

  const fetchWeather = async (lat = 18.7961, lon = 98.9793) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
      const data = await res.json();
      if (data && data.current) {
        const status = getWeatherStatus(data.current.weather_code);
        const newWeather = {
          temp: Math.round(data.current.temperature_2m),
          label: status.label,
          type: status.type,
        };
        setWeather(newWeather);
        if (typeof window !== "undefined") {
          localStorage.setItem("cc_weather_cache", JSON.stringify({ ...newWeather, timestamp: Date.now() }));
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
      const saved = localStorage.getItem("cc_weather_cache");
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

    setQuoteIndex(Math.floor(Date.now() / 86400000) % QUOTES.length);
    
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
        </div>

        {/* Weather Text & Date (Real Weather - No Manual Switchers) */}
        <div className="text-center font-light tracking-wide text-[#78716c] -mt-7 sm:-mt-9 md:-mt-11 mb-0 relative z-30">
          <p className="text-xs sm:text-base md:text-lg text-foreground font-normal mb-0.5">{weather.label} & {weather.temp}°C</p>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">{dateString}</p>
        </div>
      </div>
      
      {/* Quote */}
      {showQuote && (
        <div className={variant === "hidden" ? "opacity-0" : "opacity-100"}>
          <div className="mt-4 sm:mt-6 md:mt-7 mb-2 sm:mb-3 text-center max-w-3xl mx-auto px-3">
            <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-serif italic text-foreground mb-0.5 sm:mb-1 leading-snug sm:leading-relaxed">"{quote.text}"</p>
            <p className="text-[10px] sm:text-xs md:text-sm font-medium text-primary tracking-[0.15em] sm:tracking-[0.25em] uppercase">— {quote.author} —</p>
          </div>
        </div>
      )}
    </div>
  );
}
