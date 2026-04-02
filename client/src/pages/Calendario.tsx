import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Calendar, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MESES_NOMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

type StatusPag = "pago" | "caucao" | "pendente" | "atrasado";

const statusConfig: Record<StatusPag, { label: string; bg: string; text: string }> = {
  pago: { label: "Pago", bg: "bg-green-500", text: "text-white" },
  caucao: { label: "Caução", bg: "bg-amber-400", text: "text-amber-900" },
  pendente: { label: "Pendente", bg: "bg-gray-200", text: "text-gray-600" },
  atrasado: { label: "Atrasado", bg: "bg-red-500", text: "text-white" },
};

export default function Calendario() {
  // Começar em dezembro 2025
  const [ano, setAno] = useState(2025);
  const [mes, setMes] = useState(12);

  const { data: pagamentos, isLoading } = trpc.pagamentos.byMes.useQuery({ ano, mes });
  const { data: propriedades } = trpc.propriedades.list.useQuery();
  const [propFiltro, setPropFiltro] = useState<number | undefined>();

  const mesNome = MESES_NOMES[mes - 1];

  function navMes(dir: -1 | 1) {
    let novoMes = mes + dir;
    let novoAno = ano;
    if (novoMes < 1) { novoMes = 12; novoAno--; }
    if (novoMes > 12) { novoMes = 1; novoAno++; }
    setMes(novoMes);
    setAno(novoAno);
  }

  const pagsFiltrados = pagamentos?.filter((p) =>
    propFiltro ? p.propriedade?.id === propFiltro : true
  ) ?? [];

  // Agrupar por propriedade
  const porPropriedade: Record<string, typeof pagsFiltrados> = {};
  pagsFiltrados.forEach((p) => {
    const key = p.propriedade?.nome ?? "Sem endereço";
    if (!porPropriedade[key]) porPropriedade[key] = [];
    porPropriedade[key].push(p);
  });

  // Estatísticas
  const total = pagsFiltrados.length;
  const pagos = pagsFiltrados.filter((p) => p.pagamento.status === "pago").length;
  const caucao = pagsFiltrados.filter((p) => p.pagamento.status === "caucao").length;
  const pendente = pagsFiltrados.filter((p) => p.pagamento.status === "pendente").length;
  const atrasado = pagsFiltrados.filter((p) => p.pagamento.status === "atrasado").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.22 255)" }}>
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendário de Pagamentos</h1>
          <p className="text-muted-foreground text-sm">Visualize os pagamentos por mês</p>
        </div>
      </div>

      {/* Navegação de mês */}
      <div className="bg-white rounded-2xl shadow-sm border border-border p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navMes(-1)}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="text-center min-w-[160px]">
              <p className="text-xl font-bold text-foreground">{mesNome}</p>
              <p className="text-sm text-muted-foreground">{ano}</p>
            </div>
            <button
              onClick={() => navMes(1)}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Atalhos rápidos */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Nov/2025", a: 2025, m: 11 },
              { label: "Dez/2025", a: 2025, m: 12 },
              { label: "Jan/2026", a: 2026, m: 1 },
              { label: "Fev/2026", a: 2026, m: 2 },
            ].map(({ label, a, m }) => (
              <button
                key={label}
                onClick={() => { setAno(a); setMes(m); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  ano === a && mes === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filtro por propriedade */}
          <select
            value={propFiltro ?? ""}
            onChange={(e) => setPropFiltro(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos os endereços</option>
            {propriedades?.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estatísticas do mês */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: total, bg: "bg-blue-500" },
          { label: "Pagos", count: pagos, bg: "bg-green-500" },
          { label: "Caução", count: caucao, bg: "bg-amber-400" },
          { label: "Pendente", count: pendente + atrasado, bg: "bg-gray-400" },
        ].map(({ label, count, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-border p-3 text-center">
            <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center mx-auto mb-1`}>
              <span className="text-white font-bold text-sm">{count}</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground font-semibold">Legenda:</span>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Tabela por propriedade */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : Object.keys(porPropriedade).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum pagamento registrado para este mês</p>
        </div>
      ) : (
        Object.entries(porPropriedade).map(([propNome, pags]) => (
          <Card key={propNome} className="border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="h-1.5" style={{ background: "oklch(0.50 0.22 255)" }} />
            <CardHeader className="pb-2 pt-3 px-5">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                {propNome}
                <span className="ml-auto text-xs text-muted-foreground font-normal">{pags.length} inquilino(s)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-2">
                {pags
                  .sort((a, b) => (a.contrato?.nomeInquilino ?? "").localeCompare(b.contrato?.nomeInquilino ?? ""))
                  .map(({ pagamento, contrato }) => {
                    const st = pagamento.status as StatusPag;
                    const cfg = statusConfig[st] ?? statusConfig.pendente;
                    return (
                      <Link key={pagamento.id} href={`/contratos/${contrato?.id}`}>
                        <a className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                              {contrato?.casa}
                            </span>
                            <span className="text-sm font-semibold text-foreground truncate">
                              {contrato?.nomeInquilino}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {pagamento.valorPago && (
                              <span className="text-xs text-muted-foreground">
                                R$ {Number(pagamento.valorPago).toFixed(2).replace(".", ",")}
                              </span>
                            )}
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </a>
                      </Link>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
