import {
  Home,
  AlertCircle,
  Wrench,
  FileText,
  TrendingUp,
  Package,
  Users,
  Settings,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type SidebarNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  hidden?: boolean;
};

const mainItems: SidebarNavItem[] = [
  { title: "Dashboard", url: "/", icon: Home, hidden: true },
  { title: "Acionamentos", url: "/acionamentos", icon: AlertCircle },
  { title: "Obras", url: "/obras", icon: Wrench },
  { title: "Alocação", url: "/alocacao", icon: Home },
  { title: "Medições", url: "/medicoes", icon: TrendingUp, hidden: true },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, hidden: true },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
];

const cadastrosItems: SidebarNavItem[] = [
  { title: "Materiais", url: "/materiais", icon: Package },
  { title: "Equipes", url: "/equipes", icon: Users },
    { title: "Códigos MO", url: "/codigos-mo", icon: FileText },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.filter((item) => !item.hidden).map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.url)}
                    >
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-3"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cadastrosItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.url)}
                    >
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-3"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/configuracoes")}>
                  <NavLink 
                    to="/configuracoes" 
                    className="flex items-center gap-3"
                    activeClassName="bg-primary/10 text-primary font-semibold"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
