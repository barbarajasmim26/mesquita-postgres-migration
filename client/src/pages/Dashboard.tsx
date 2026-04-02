import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BarChart3,
  Building2,
  FileText,
  AlertOctagon,
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
  Search,
  Plus,
  ChevronRight,
  DollarSign,
  Home,
} from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: vencendo } = trpc.contratos.vencendoEm30.useQuery();

  const totalContratos = stats?.totalContratos ?? 0;
  const ativosCount = stats?.contratosAtivos ?? 0;
  const receitaMensal = stats?.receitaMes ?? 0;

  const funcionalidades = [
    {
      id: "contratos",
      titulo: "Contratos",
      descricao: "Gerencie todos os contratos de aluguel",
      icon: FileText,
      cor: "bg-blue-500",
      href: "/contratos",
      badge: `${ativosCount} ativos`,
      badgeBg: "bg-blue-100 text-blue-700",
    },
    {
      id: "alertas",
      titulo: "Alertas",
      descricao: "Contratos vencendo e vencidos",
      icon: AlertOctagon,
      cor: "bg-red-500",
      href: "/alertas",
      badge: `${vencendo?.length ?? 0} avisos`,
      badgeBg: "bg-red-100 text-red-700",
    },
    {
      id: "calendario",
      titulo: "Calendário",
      descricao: "Visualize datas de vencimento",
      icon: Calendar,
      cor: "bg-purple-500",
      href: "/calendario",
      badge: "Próximos 30 dias",
      badgeBg: "bg-purple-100 text-purple-700",
    },
    {
      id: "relatorios",
      titulo: "Relatórios",
      descricao: "Análise de receitas e inadimplência",
      icon: BarChart3,
      cor: "bg-green-500",
      href: "/relatorios",
      badge: `R$ ${receitaMensal.toFixed(2)}`,
      badgeBg: "bg-green-100 text-green-700",
    },
    {
      id: "recibo",
      titulo: "Recibo",
      descricao: "Gerar recibos de aluguel",
      icon: FileText,
      cor: "bg-orange-500",
      href: "/recibo",
      badge: "Novo recibo",
      badgeBg: "bg-orange-100 text-orange-700",
    },
    {
      id: "inquilinos",
      titulo: "Inquilinos",
      descricao: "Gerencie dados dos inquilinos",
      icon: Users,
      cor: "bg-indigo-500",
      href: "/inquilinos",
      badge: `${totalContratos} inquilinos`,
      badgeBg: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "busca",
      titulo: "Busca Rápida",
      descricao: "Encontre contratos rapidamente",
      icon: Search,
      cor: "bg-cyan-500",
      href: "/busca",
      badge: "Pesquisar",
      badgeBg: "bg-cyan-100 text-cyan-700",
    },
    {
      id: "whatsapp",
      titulo: "WhatsApp",
      descricao: "Envie mensagens aos inquilinos",
      icon: MessageSquare,
      cor: "bg-emerald-500",
      href: "/whatsapp",
      badge: "Conectado",
      badgeBg: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
          <Home className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Bem-vindo ao Sistema de Gestão de Imóveis</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total de Contratos",
            valor: totalContratos,
            icon: Building2,
            cor: "bg-blue-50 border-blue-200",
            iconBg: "bg-blue-500",
          },
          {
            label: "Contratos Ativos",
            valor: ativosCount,
            icon: TrendingUp,
            cor: "bg-green-50 border-green-200",
            iconBg: "bg-green-500",
          },
          {
            label: "Receita Mensal",
            valor: `R$ ${receitaMensal.toFixed(2)}`,
            icon: DollarSign,
            cor: "bg-purple-50 border-purple-200",
            iconBg: "bg-purple-500",
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.cor} border-2 rounded-2xl p-5`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.valor}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de Funcionalidades */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Funcionalidades do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {funcionalidades.map((func) => {
            const Icon = func.icon;
            return (
              <Link key={func.id} href={func.href}>
                <div className="bg-white border-2 border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer group h-full">
                  {/* Ícone */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${func.cor} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Título e Descrição */}
                  <h3 className="font-bold text-foreground text-base mb-1">{func.titulo}</h3>
                  <p className="text-muted-foreground text-xs mb-4 line-clamp-2">{func.descricao}</p>

                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${func.badgeBg}`}>
                      {func.badge}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" />
          Atalhos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/recibo">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              Gerar Novo Recibo
            </button>
          </Link>
          <Link href="/alertas">
            <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Ver Alertas
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
