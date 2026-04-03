import {
  LayoutDashboard,
  Cuboid,
  PenTool,
  HardHat,
  Eye,
  FolderOpen,
  FileBarChart,
  BookOpen,
  Camera,
  Users,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Building2 } from "lucide-react";


const mainMenu = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Visualisasi Proyek", url: "/visualisasi", icon: Cuboid },
];

const todoMenu = [
  { title: "Semua", url: "/semua", icon: LayoutDashboard },
  { title: "BPS Kabupaten Majalengka", url: "/bps-kabupaten", icon: Building2 },
  { title: "Konsultan Perancangan", url: "/perancangan", icon: PenTool },
  { title: "Kontraktor Pelaksana", url: "/konstruksi", icon: HardHat },
  { title: "Konsultan Pengawas", url: "/pengawas", icon: Eye },
];

const progresMenu = [
  { title: "Kurva S", url: "/kurva-s", icon: TrendingUp },
];

const mitigasiMenu = [
  { title: "Stakeholder", url: "/stakeholder", icon: Users },
  { title: "Potensi Masalah", url: "/mitigasi", icon: ShieldAlert },
];

const supportMenu = [
  { title: "Dokumentasi", url: "/dokumentasi", icon: FolderOpen },
  { title: "Notulen Rapat", url: "/notulen", icon: BookOpen },
  { title: "Foto Progres", url: "/foto-progres", icon: Camera },
  { title: "Laporan", url: "/laporan", icon: FileBarChart },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderMenu = (items: typeof mainMenu) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground font-semibold"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  const isProgresActive = location.pathname.includes("/kurva-s");

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground leading-tight">
                BPS Majalengka
              </span>
              <span className="text-[11px] text-sidebar-foreground/60 leading-tight">
                Monitoring Gedung
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenu(mainMenu)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Todo list - Penanggungjawab
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenu(todoMenu)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Progres Gedung
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenu(progresMenu)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Mitigasi Resiko
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenu(mitigasiMenu)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Lainnya
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenu(supportMenu)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center">
            © 2026 BPS Kab. Majalengka
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
