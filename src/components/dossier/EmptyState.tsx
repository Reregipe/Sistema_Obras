import React from "react";


const EmptyState = ({ message }: { message?: string }) => (
  <div className="py-8 text-center text-muted-foreground text-sm">{message || 'Sem dados'}</div>
);

export { EmptyState };
export default EmptyState;
