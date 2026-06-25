import { SVGProps } from "react";

export function LogoRenri(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      width="100" 
      height="100" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line x1="50" y1="50" x2="86" y2="20" stroke="currentColor" strokeWidth="3" opacity="0.6" />
      <line x1="50" y1="50" x2="14" y2="20" stroke="currentColor" strokeWidth="3" opacity="0.6" />
      <line x1="50" y1="50" x2="50" y2="86" stroke="currentColor" strokeWidth="3" opacity="0.6" />
      <circle cx="50" cy="50" r="16" fill="currentColor" />
      <circle cx="86" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="14" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="86" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="86" cy="20" r="6" fill="currentColor" opacity="0.8" />
    </svg>
  );
}
