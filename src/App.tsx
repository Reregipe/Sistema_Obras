import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Acionamentos from "./pages/Acionamentos";
import Obras from "./pages/Obras";
import Medicoes from "./pages/Medicoes";
import Materiais from "./pages/Materiais";
import Equipes from "./pages/Equipes";
import Viaturas from "./pages/Viaturas";
import CodigosMO from "./pages/CodigosMO";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/acionamentos" element={<Acionamentos />} />
            <Route path="/obras" element={<Obras />} />
            <Route path="/medicoes" element={<Medicoes />} />
            <Route path="/materiais" element={<Materiais />} />
            <Route path="/equipes" element={<Equipes />} />
            <Route path="/viaturas" element={<Viaturas />} />
            <Route path="/codigos-mo" element={<CodigosMO />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
