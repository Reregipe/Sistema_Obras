import React from "react";


export const DataTable = ({ columns, data }: { columns: any[]; data: any[] }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm border rounded-lg">
      <thead className="bg-muted">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b">{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="even:bg-muted/40">
            {columns.map((col) => (
              <td key={col.key} className="px-3 py-2 border-b">{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
