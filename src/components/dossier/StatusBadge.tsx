import React from "react";


const StatusBadge = ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
  <span className={
    variant === "success"
      ? "inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold"
      : "inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold"
  }>
    {children}
  </span>
);

export { StatusBadge };
export default StatusBadge;
