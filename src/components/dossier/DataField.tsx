import React from "react";


export const DataField = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="mb-2">
    <span className="block text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
    <span className={mono ? "font-mono text-sm" : "text-sm"}>{value}</span>
  </div>
);

export const DataGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>{children}</div>
);
