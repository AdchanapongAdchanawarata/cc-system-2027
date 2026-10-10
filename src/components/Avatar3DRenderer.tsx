"use client";

import React from "react";
import { Avatar3DConfig } from "@/types/avatar3d";
import { Avatar2DRenderer, normalizeConfig } from "./Avatar2DRenderer";

interface Avatar3DRendererProps {
  config: Avatar3DConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
  showBorder?: boolean;
  animate?: boolean;
  cheeky?: boolean;
}

/**
 * Avatar3DRenderer
 * Seamless wrapper rendering 2D line-art vector illustration style (Anna Khramtsova style),
 * preserving backwards compatibility with all existing task cards, boards, and email templates.
 */
export const Avatar3DRenderer: React.FC<Avatar3DRendererProps> = ({
  config,
  size = 40,
  className = "",
  onClick,
  showBorder = false,
  animate = true,
  cheeky = false,
}) => {
  return (
    <Avatar2DRenderer
      config={config}
      size={size}
      className={className}
      onClick={onClick}
      showBorder={showBorder}
      animate={animate}
      cheeky={cheeky}
    />
  );
};

export { normalizeConfig };
