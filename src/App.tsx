import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useRealtimeRoleChanges } from "@/hooks/useRealtimeRoleChanges";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  // Hook para escutar mudanças em tempo real de permissões
  useRealtimeRoleChanges();
  
  return <Layout>{children}</Layout>;
};
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import Analytics from "./pages/Analytics";
import Acionamentos from "./pages/Acionamentos";
import AcionamentoDetalhe from "./pages/AcionamentoDetalhe";
import AcionamentoMateriais from "./pages/AcionamentoMateriais";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";
import Medicoes from "./pages/Medicoes";
import MedicaoFinal from "./pages/MedicaoFinal";
import Materiais from "./pages/Materiais";
import Equipes from "./pages/Equipes";
import CodigosMO from "./pages/CodigosMO";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Analytics from "./pages/Analytics";
import Producao from "./pages/Producao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Index />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/acionamentos" element={
            <ProtectedRoute>
              <MainLayout>
                <Acionamentos />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/acionamentos/:codigo" element={
            <ProtectedRoute>
              <MainLayout>
                <AcionamentoDetalhe />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/acionamentos/:id/materials" element={
            <ProtectedRoute>
              <MainLayout>
                <AcionamentoMateriais />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/obras" element={
            <ProtectedRoute>
              <MainLayout>
                <Obras />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/obras/:obraId" element={
            <ProtectedRoute>
              <MainLayout>
                <ObraDetalhe />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicoes" element={
            <ProtectedRoute>
              <MainLayout>
                <Medicoes />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicao-final" element={
            <ProtectedRoute>
              <MainLayout>
                <MedicaoFinal />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/materiais" element={
            <ProtectedRoute>
              <MainLayout>
                <Materiais />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/equipes" element={
            <ProtectedRoute>
              <MainLayout>
                <Equipes />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/codigos-mo" element={
            <ProtectedRoute>
              <MainLayout>
                <CodigosMO />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute>
              <MainLayout>
                <Relatorios />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/producao" element={
            <ProtectedRoute>
              <MainLayout>
                <Producao />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <MainLayout>
                <Configuracoes />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <MainLayout>
                <Analytics />
              </MainLayout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
