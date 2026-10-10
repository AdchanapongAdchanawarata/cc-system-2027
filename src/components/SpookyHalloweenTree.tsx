"use client";

import React, { useEffect, useState } from "react";

/**
 * Spooky Halloween Bare Tree (ต้นไม้แห้งฮาโลวีน)
 * Active throughout October (until Oct 31, 23:59:59)
 * Stands on the left side of the grass mound matching the exact form from ref media_1791439032431.png 100%.
 * Non-intrusive: pointer-events-none.
 */
export default function SpookyHalloweenTree({ className = "" }: { className?: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const now = new Date();
    setActive(now.getMonth() === 9 && now.getDate() <= 31);
  }, []);

  if (!active) return null;

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <style jsx>{`
        @keyframes treeSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.2deg); }
        }
        .spooky-tree-sway {
          animation: treeSway 6s ease-in-out infinite;
          transform-origin: bottom center;
        }
      `}</style>
      <img
        src="/animation/spooky_tree_ref.png"
        alt="Spooky Halloween Tree"
        className="w-full h-full object-contain filter drop-shadow-xs spooky-tree-sway"
      />
    </div>
  );
}
