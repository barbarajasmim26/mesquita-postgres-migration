import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  FileText,
  Bell,
  Calendar,
  BarChart2,
  Search,
  Menu,
  X,
  Building2,
  ChevronRight,
  Receipt,
  MessageCircle,
  LogOut,
  Sun,
  Moon,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  
  if (!toggleTheme) return null;
  
  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
      title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4" />
          <span>Tema Escuro</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          <span>Tema Claro</span>
        </>
      )}
    </button>
  );
}

function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      
      window.location.href = "/login";
    },
  });

  const handleLogout = () => {
    setIsLoading(true);
    logoutMutation.mutate();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading || logoutMutation.isPending}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      <span>Sair</span>
    </button>
  );
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/ex-inquilinos", label: "Ex-Inquilinos", icon: Users },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/relatorios", label: "Relatórios", icon: BarChart2 },
  { href: "/recibo", label: "Recibo", icon: Receipt },
  { href: "/busca", label: "Busca Rápida", icon: Search },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: alertas } = trpc.contratos.vencendoEm30.useQuery();
  const alertCount = alertas?.length ?? 0;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30 flex flex-col
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "var(--sidebar)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.65 0.20 255)" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-bold text-base leading-tight">Gestão</p>
            <p className="text-sidebar-foreground/60 text-xs">de Imóveis</p>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150 group relative
                    ${active
                      ? "text-white shadow-md"
                      : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }
                  `}
                  style={active ? { background: "oklch(0.50 0.22 255)" } : {}}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  {label === "Alertas" && alertCount > 0 && (
                    <span className="ml-auto text-xs font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                  {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
          <ThemeToggleButton />
          <LogoutButton />
          <p className="text-sidebar-foreground/40 text-xs text-center">Sistema de Aluguel v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Gestão de Imóveis</span>
          </div>
          {alertCount > 0 && (
            <Link href="/alertas">
              <a className="ml-auto flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                <Bell className="w-3 h-3" />
                {alertCount}
              </a>
            </Link>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
