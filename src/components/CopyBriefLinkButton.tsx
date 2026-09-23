"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyBriefLinkButton({
  unit,
  label = "คัดลอกลิงก์แบบฟอร์ม",
  className = ""
}: {
  unit: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/request?unit=${unit}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`คัดลอกลิงก์แบบฟอร์ม ${unit}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
        copied
          ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-white/90 hover:bg-white text-zinc-600 hover:text-zinc-900 border-zinc-200/90 shadow-2xs"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-600" />
          <span className="text-[11px]">คัดลอกแล้ว!</span>
        </>
      ) : (
        <>
          <Copy size={12} className="text-zinc-400" />
          <span className="text-[11px]">{label}</span>
        </>
      )}
    </button>
  );
}
