import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Index />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/acionamentos" element={
            <ProtectedRoute>
              <Layout>
                <Acionamentos />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/obras" element={
            <ProtectedRoute>
              <Layout>
                <Obras />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/medicoes" element={
            <ProtectedRoute>
              <Layout>
                <Medicoes />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/materiais" element={
            <ProtectedRoute>
              <Layout>
                <Materiais />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/equipes" element={
            <ProtectedRoute>
              <Layout>
                <Equipes />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/viaturas" element={
            <ProtectedRoute>
              <Layout>
                <Viaturas />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/codigos-mo" element={
            <ProtectedRoute>
              <Layout>
                <CodigosMO />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute>
              <Layout>
                <Relatorios />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <Layout>
                <Configuracoes />
              </Layout>
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
