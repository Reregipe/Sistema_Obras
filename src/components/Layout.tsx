import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import logo from "@/assets/logo-engeletrica.png";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex items-center gap-3">
                <img 
                  src={logo} 
                  alt="Engeletrica" 
                  className="h-8 w-auto"
                />
                <div className="border-l border-border pl-3">
                  <h1 className="text-lg font-semibold text-foreground">
                    Sistema de Gestão de Obras
                  </h1>
                </div>
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Energisa MT
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
