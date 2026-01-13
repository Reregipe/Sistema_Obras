import React from "react";


const DossierHeader = ({ dossier }: { dossier: any }) => (
  <header className="bg-white rounded-lg shadow p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200">
    <div>
      <h2 className="text-xl font-bold text-primary">Acionamento #{dossier?.acionamento?.codigo_acionamento || "-"}</h2>
      <div className="text-sm text-muted-foreground">{dossier?.acionamento?.municipio || ""}</div>
    </div>
    <div className="mt-2 md:mt-0">
      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
        {dossier?.acionamento?.status || ""}
      </span>
    </div>
  </header>
);

export { DossierHeader };
export default DossierHeader;
