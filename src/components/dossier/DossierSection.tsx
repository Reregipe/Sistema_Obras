import React from "react";


const DossierSection = ({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) => (
  <section className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
    <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-primary">
      {Icon && <Icon className="w-5 h-5" />} {title}
    </h3>
    <div>{children}</div>
  </section>
);

export { DossierSection };
export default DossierSection;
