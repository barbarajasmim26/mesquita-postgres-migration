import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart2, TrendingUp, Home, DollarSign, Calendar, Building2, Printer, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_CURTO = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Relatorios() {
  const [ano, setAno] = useState(2025);
  const { data: receita, isLoading: receitaLoading } = trpc.dashboard.receitaPorMes.useQuery({ ano });
  const { data: propriedades } = trpc.propriedades.listComResumo.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: vencendo } = trpc.contratos.vencendoEm30.useQuery();

  const chartData = MESES_CURTO.map((nome, idx) => {
    const mes = idx + 1;
    const d = receita?.find((r) => Number(r.mes) === mes);
    return {
      mes: nome,
      mesCompleto: MESES[idx],
      total: Number(d?.total ?? 0),
      pagos: Number(d?.qtdPago ?? 0),
      pendentes: Number(d?.qtdPendente ?? 0),
    };
  });

  const totalAnual = chartData.reduce((acc, d) => acc + d.total, 0);
  const mediaMensal = totalAnual / 12;

  const handleImprimir = () => {
    window.print();
  };

  const handleSalvarPDF = () => {
    // Abre a janela de impressão com opção de salvar como PDF
    const printContent = document.getElementById("relatorio-print-area");
    if (!printContent) return;
    const originalTitle = document.title;
    document.title = `Relatório de Aluguéis ${ano}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #relatorio-print-area, #relatorio-print-area * { visibility: visible; }
          #relatorio-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.62 0.20 310)" }}>
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
              <p className="text-muted-foreground text-sm">Análise financeira e de ocupação</p>
            </div>
          </div>
          {/* Botões de exportação */}
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleImprimir}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleSalvarPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "oklch(0.50 0.22 255)" }}
            >
              <FileDown className="w-4 h-4" />
              Salvar como PDF
            </button>
          </div>
        </div>

        {/* Seletor de ano */}
        <div className="flex items-center gap-3 no-print">
          <span className="text-sm font-semibold text-muted-foreground">Ano:</span>
          {[2024, 2025, 2026].map((a) => (
            <button
              key={a}
              onClick={() => setAno(a)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                ano === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Área de impressão */}
        <div id="relatorio-print-area">
          {/* Cabeçalho de impressão (só aparece no print) */}
          <div className="hidden print:block mb-6 border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold">Relatório de Aluguéis — {ano}</h1>
            <p className="text-gray-500 text-sm mt-1">Gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>

          {/* Cards de resumo anual */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm rounded-2xl" style={{ background: "oklch(0.50 0.22 255)" }}>
              <CardContent className="p-4">
                <DollarSign className="w-6 h-6 text-white/80 mb-2" />
                <p className="text-white text-xl font-bold">{formatBRL(totalAnual)}</p>
                <p className="text-white/70 text-xs mt-0.5">Receita Total {ano}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl" style={{ background: "oklch(0.55 0.20 145)" }}>
              <CardContent className="p-4">
                <TrendingUp className="w-6 h-6 text-white/80 mb-2" />
                <p className="text-white text-xl font-bold">{formatBRL(mediaMensal)}</p>
                <p className="text-white/70 text-xs mt-0.5">Média Mensal</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl" style={{ background: "oklch(0.62 0.20 310)" }}>
              <CardContent className="p-4">
                <Home className="w-6 h-6 text-white/80 mb-2" />
                <p className="text-white text-xl font-bold">
                  {stats ? Math.round((stats.contratosAtivos / Math.max(stats.totalContratos, 1)) * 100) : 0}%
                </p>
                <p className="text-white/70 text-xs mt-0.5">Taxa de Ocupação</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl" style={{ background: "oklch(0.72 0.16 55)" }}>
              <CardContent className="p-4">
                <Calendar className="w-6 h-6 text-amber-900/70 mb-2" />
                <p className="text-amber-900 text-xl font-bold">{vencendo?.length ?? 0}</p>
                <p className="text-amber-900/70 text-xs mt-0.5">Vencem em 30 dias</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de receita mensal — oculto na impressão, substituído pela tabela */}
          <Card className="border border-border shadow-sm rounded-2xl no-print">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Receita Mensal — {ano}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {receitaLoading ? (
                <div className="h-48 bg-muted rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 240)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatBRL(value), "Receita"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.88 0.01 240)", fontSize: "12px" }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.total > 0 ? "oklch(0.50 0.22 255)" : "oklch(0.88 0.01 240)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Tabela mensal detalhada */}
          <Card className="border border-border shadow-sm rounded-2xl">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-base font-bold text-foreground">Detalhamento Mensal — {ano}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/30">
                      <th className="text-left py-2.5 px-3 text-muted-foreground font-bold text-xs">Mês</th>
                      <th className="text-right py-2.5 px-3 text-muted-foreground font-bold text-xs">Receita Arrecadada</th>
                      <th className="text-right py-2.5 px-3 text-muted-foreground font-bold text-xs">Pagamentos Pagos</th>
                      <th className="text-right py-2.5 px-3 text-muted-foreground font-bold text-xs">Pendentes/Atrasados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d, idx) => (
                      <tr key={idx} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/20"}`}>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{d.mesCompleto}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-bold ${d.total > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                            {d.total > 0 ? formatBRL(d.total) : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-green-600 font-semibold">{d.pagos > 0 ? d.pagos : "—"}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-semibold ${d.pendentes > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {d.pendentes > 0 ? d.pendentes : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-primary/30 bg-primary/5">
                      <td className="py-2.5 px-3 font-bold text-foreground">TOTAL</td>
                      <td className="py-2.5 px-3 text-right font-bold text-primary">{formatBRL(totalAnual)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-600">
                        {chartData.reduce((a, d) => a + d.pagos, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                        {chartData.reduce((a, d) => a + d.pendentes, 0) || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Resumo por propriedade */}
          <Card className="border border-border shadow-sm rounded-2xl">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Resumo por Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                {propriedades?.map((prop) => {
                  const taxa = prop.totalContratos > 0
                    ? Math.round((prop.contratosAtivos / prop.totalContratos) * 100)
                    : 0;
                  return (
                    <div key={prop.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{prop.nome}</p>
                        <p className="text-xs text-muted-foreground">{prop.contratosAtivos}/{prop.totalContratos} ativos</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-primary">{formatBRL(prop.receitaMensal)}/mês</p>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${taxa}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{taxa}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Rodapé de impressão */}
          <div className="hidden print:block mt-6 border-t-2 border-gray-300 pt-4 text-center text-gray-400 text-xs">
            Sistema de Gestão de Aluguéis — Relatório gerado em {new Date().toLocaleDateString("pt-BR")}
          </div>
        </div>
      </div>
    </>
  );
}
