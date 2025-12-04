import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationCenter } from "./NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import logo from "@/assets/logo-engeletrica.png";
import { Menu, LogOut, User } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70 shadow-sm">
            <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4 px-4 sm:px-6">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>

              <div className="flex items-center gap-2 sm:gap-3">
                <img src={logo} alt="Engeletrica" className="h-7 w-auto sm:h-8" />
                <div className="hidden sm:block border-l border-border pl-3">
                  <h1 className="text-base sm:text-lg font-semibold text-foreground">
                    Sistema de Gestao de Obras
                  </h1>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3 sm:gap-4">
                <NotificationCenter />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.email ? getInitials(user.email) : "US"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.user_metadata?.nome || "Usuario"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background">
            <div className="w-full px-2 sm:px-8 py-4 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
