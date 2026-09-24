"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Option {
  value: string;
  label: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  triggerClassName?: string;
  dropdownClassName?: string;
  renderValue?: (value: string) => React.ReactNode;
  placeholder?: string;
}

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  triggerClassName = "text-slate-700 font-medium bg-white border border-slate-200 rounded-full px-3 py-1.5 text-sm shadow-sm hover:border-slate-300 transition-colors",
  dropdownClassName = "w-48",
  renderValue,
  placeholder = "Select..."
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(val);
    setIsOpen(false);
  };

  const selectedOption = options.find(o => o.value === value);

  const isLeftAligned = triggerClassName?.includes('text-left');

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`flex items-center cursor-pointer ${triggerClassName}`}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
      >
        {!isLeftAligned && <div className="w-[14px] shrink-0" />} {/* Spacer to balance chevron for true centering */}
        <span className={`flex-1 truncate ${isLeftAligned ? 'text-left' : 'text-center'}`}>
          {renderValue ? renderValue(value) : (selectedOption ? selectedOption.label : placeholder)}
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ml-1 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className={`absolute z-50 mt-1 left-0 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden ${dropdownClassName}`}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`px-4 py-2.5 text-[13px] transition-colors border-b border-slate-100 dark:border-zinc-700/60 last:border-b-0 ${
                opt.disabled 
                  ? 'opacity-40 cursor-not-allowed bg-slate-50/50 dark:bg-zinc-900/50 text-slate-400 dark:text-zinc-500 select-none'
                  : 'cursor-pointer ' + (opt.className 
                      ? `${opt.className} ${value === opt.value ? 'bg-slate-50 dark:bg-zinc-700' : ''}` 
                      : (value === opt.value ? 'bg-slate-50 dark:bg-zinc-700 font-semibold text-slate-800 dark:text-zinc-100' : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/70 hover:text-slate-900 dark:hover:text-white'))
              }`}
              onClick={(e) => {
                if (opt.disabled) {
                  e.stopPropagation();
                  return;
                }
                handleSelect(e, opt.value);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
