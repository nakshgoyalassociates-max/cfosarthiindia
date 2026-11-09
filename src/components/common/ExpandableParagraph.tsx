import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableParagraphProps {
  text: string;
  className?: string;
  defaultExpanded?: boolean;
  prefix?: React.ReactNode;
  maxLines?: number;
}

/**
 * Renders text clamped to 1 line by default to save dashboard space.
 * If the paragraph extends beyond 1 line, provides an expandable/collapsible toggle.
 */
export const ExpandableParagraph: React.FC<ExpandableParagraphProps> = ({
  text,
  className = "",
  defaultExpanded = false,
  prefix,
  maxLines = 1,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const checkOverflow = () => {
      if (el) {
        const hasOverflow =
          el.scrollHeight > el.clientHeight + 1 ||
          el.scrollWidth > el.clientWidth + 1 ||
          text.length > 75;
        setIsOverflowing(hasOverflow);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text, maxLines]);

  if (!text) return null;

  const canToggle = isOverflowing || text.length > 70;

  return (
    <div className="relative group/exp">
      <div
        onClick={() => {
          if (canToggle) setIsExpanded((prev) => !prev);
        }}
        className={canToggle ? "cursor-pointer" : undefined}
      >
        <p
          ref={textRef}
          className={`${className} ${
            isExpanded
              ? "line-clamp-none whitespace-normal leading-relaxed"
              : "line-clamp-1 truncate leading-snug"
          }`}
          title={!isExpanded && canToggle ? text : undefined}
        >
          {prefix}
          {text}
        </p>
      </div>

      {canToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mt-0.5 cursor-pointer py-0.5 px-1 rounded hover:bg-indigo-50/80"
          title={isExpanded ? "Collapse to 1 line" : "Expand full text"}
        >
          <span>{isExpanded ? "Show less" : "Show more"}</span>
          {isExpanded ? (
            <ChevronUp className="w-2.5 h-2.5" />
          ) : (
            <ChevronDown className="w-2.5 h-2.5" />
          )}
        </button>
      )}
    </div>
  );
};
