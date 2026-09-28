"use client";

import React, { useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, isValid, format } from "date-fns";

interface ModernDatePickerProps {
  value: string; // ISO date string "YYYY-MM-DD" or "YYYY-MM-DD HH:mm" or ""
  onChange: (val: string) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  className?: string;
  minDate?: Date;
  align?: "left" | "center";
  disabled?: boolean;
  accentColor?: "orange" | "red";
  showTimeSelect?: boolean;
  dateFormat?: string;
  timeIntervals?: number;
  timeCaption?: string;
}

export default function ModernDatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่...",
  name,
  id,
  required = false,
  className = "",
  minDate,
  align = "left",
  disabled = false,
  showTimeSelect = false,
  dateFormat,
  timeIntervals = 15,
  timeCaption = "เวลา"
}: ModernDatePickerProps) {
  // Parse date safely without timezone shift
  const selectedDate = useMemo(() => {
    if (!value) return null;
    try {
      if (value.includes(" ") || value.includes("T") || value.includes(":")) {
        const isoLike = value.replace(" ", "T");
        const d = new Date(isoLike);
        if (isValid(d)) return d;
      }
      const parts = value.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return isValid(d) ? d : null;
      }
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [value]);

  const handleChange = (date: Date | null) => {
    if (date) {
      if (showTimeSelect) {
        const formatted = format(date, "yyyy-MM-dd HH:mm");
        onChange(formatted);
      } else {
        const formatted = format(date, "yyyy-MM-dd");
        onChange(formatted);
      }
    } else {
      onChange("");
    }
  };

  const defaultClasses = "w-full text-sm font-medium bg-[#f9f9fb] hover:bg-white focus:bg-white border border-zinc-200 rounded-full px-4 py-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="relative w-full">
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

      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat={dateFormat || (showTimeSelect ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd")}
        showTimeSelect={showTimeSelect}
        timeIntervals={timeIntervals}
        timeCaption={timeCaption}
        placeholderText={placeholder}
        minDate={minDate}
        disabled={disabled}
        isClearable={Boolean(value)}
        popperClassName="z-[9999]"
        wrapperClassName="w-full block"
        className={`w-full block transition-all cursor-pointer ${
          align === "center" ? "text-center" : "text-left"
        } ${className || defaultClasses}`}
      />
    </div>
  );
}
