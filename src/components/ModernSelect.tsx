"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export interface ModernSelectOption {
  value: string;
  label: string;
  desc?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface ModernSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: ModernSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  className?: string;
  dropdownClassName?: string;
  required?: boolean;
  name?: string;
  id?: string;
  disabled?: boolean;
  align?: "left" | "center";
  accentColor?: "red" | "orange";
}

export default function ModernSelect({
  value,
  onChange,
  options,
  placeholder = "-- เลือกรายการ --",
  searchPlaceholder = "ค้นหา...",
  searchable,
  className = "",
  dropdownClassName = "",
  required = false,
  name,
  id,
  disabled = false,
  align = "left",
  accentColor = "red"
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if this select has rich descriptions (Category style)
  const hasDescriptions = useMemo(() => {
    return options.some(opt => Boolean(opt.desc));
  }, [options]);

  // Enable search if explicitly set, or auto for long lists
  const isSearchable = searchable !== undefined ? searchable : options.length > 9;

  // Selected option
  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(query) || 
      (opt.desc && opt.desc.toLowerCase().includes(query)) ||
      (opt.badge && opt.badge.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen, isSearchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isCenter = align === "center" && !hasDescriptions;

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden input for HTML form submissions */}
      {name && (
        <input 
          type="hidden" 
          name={name} 
          value={value} 
          id={id}
          required={required} 
        />
      )}

      {/* Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all border ${
          className.includes("rounded-") ? "" : (hasDescriptions ? "rounded-2xl" : "rounded-xl")
        } ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200" :
          isOpen
            ? "border-slate-800 ring-2 ring-slate-800/10 bg-white shadow-xs"
            : "border-slate-200 hover:border-slate-300 bg-white shadow-2xs"
        } ${className}`}
      >
        {isCenter && <div className="w-[14px] shrink-0" />}

        <div className={`flex items-center gap-2 min-w-0 flex-1 ${isCenter ? "justify-center" : ""}`}>
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}

          {selectedOption ? (
            <span className={`text-slate-900 text-sm truncate ${isCenter ? "font-bold text-center" : "font-semibold"}`}>
              {selectedOption.label}
            </span>
          ) : (
            <span className={`text-slate-400 text-sm truncate font-normal ${isCenter ? "text-center" : ""}`}>
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown 
          size={16} 
          className={`shrink-0 text-slate-500 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180 text-slate-800" : ""}`} 
        />
      </div>

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div className={`absolute z-50 mt-1.5 left-0 right-0 bg-white ${
          hasDescriptions ? "rounded-2xl shadow-xl border border-slate-200" : "rounded-xl shadow-lg border border-slate-200"
        } overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}>
          
          {/* Search Box if enabled */}
          {isSearchable && (
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all placeholder:text-slate-400 text-slate-800"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                ไม่พบรายการที่ค้นหา &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;

                // 1. RICH CATEGORY STYLE (Matching media_1788502754042.png)
                if (hasDescriptions || opt.desc) {
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`px-4 py-3 cursor-pointer transition-colors group ${
                        isSelected 
                          ? "bg-red-50/50 text-[#ff4b4b]" 
                          : "hover:bg-slate-50/80 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <div className={`text-sm font-bold transition-colors ${
                          isSelected 
                            ? "text-[#ff4b4b]" 
                            : "text-slate-800 group-hover:text-[#ff4b4b]"
                        }`}>
                          {opt.label}
                        </div>
                      </div>
                      {opt.desc && (
                        <div className={`text-xs mt-0.5 leading-relaxed transition-colors ${
                          isSelected 
                            ? "text-[#ff4b4b]/80" 
                            : "text-slate-400 group-hover:text-[#ff4b4b]/70"
                        }`}>
                          {opt.desc}
                        </div>
                      )}
                    </div>
                  );
                }

                // 2. SIMPLE ASSIGNEE STYLE (Matching media_1788502813941.png)
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-4 py-2.5 text-[13px] cursor-pointer transition-colors ${
                      isCenter ? "text-center" : "text-left"
                    } ${
                      isSelected
                        ? "bg-slate-50 font-bold text-slate-900"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
