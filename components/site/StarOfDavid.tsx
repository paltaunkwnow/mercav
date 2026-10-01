import type { SVGProps } from "react";

/** Magen David drawn with the same stroke metrics as lucide icons, so it sits next to them. */
export function StarOfDavid({ className, strokeWidth = 2, ...props }: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M12 2.5 20.25 16.75H3.75Z" />
      <path d="M12 21.5 3.75 7.25h16.5Z" />
    </svg>
  );
}
// creado por pato dev y askforvini
