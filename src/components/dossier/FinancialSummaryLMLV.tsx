import React from "react";

const FinancialSummaryLMLV = ({ orcamento }: { orcamento: any }) => (
  <div style={{ display: "flex", gap: 16 }}>
    <div>LM Base: {orcamento?.total_base_lm ?? "-"}</div>
    <div>LV Base: {orcamento?.total_base_lv ?? "-"}</div>
    <div>LM Final: {orcamento?.total_final_lm ?? "-"}</div>
    <div>LV Final: {orcamento?.total_final_lv ?? "-"}</div>
  </div>
);

export { FinancialSummaryLMLV };
export default FinancialSummaryLMLV;
