import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { Bell, AlertOctagon, Building2, Calendar, ChevronRight, CheckCircle, RefreshCw, X, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function diasParaVencer(dataSaida: Date | string | null): number {
  if (!dataSaida) return 999;
  return Math.ceil((new Date(dataSaida).getTime() - Date.now()) / 86400000);
}

function urgencyColor(dias: number) {
  if (dias <= 7) return { bg: "bg-red-50 border-red-300", bar: "oklch(0.60 0.22 25)", badge: "bg-red-500 text-white" };
  if (dias <= 15) return { bg: "bg-orange-50 border-orange-300", bar: "oklch(0.72 0.18 45)", badge: "bg-orange-500 text-white" };
  return { bg: "bg-amber-50 border-amber-300", bar: "oklch(0.78 0.16 55)", badge: "bg-amber-400 text-amber-900" };
}

type ContratoParaRenovar = {
  id: number;
  nomeInquilino: string;
  casa: string;
  dataSaida: Date | string | null;
};

function ModalRenovacao({
  contrato,
  onClose,
  onSuccess,
}: {
  contrato: ContratoParaRenovar;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Calcula sugestão: +12 meses da data atual de saída (ou hoje se não tiver)
  const base = contrato.dataSaida ? new Date(contrato.dataSaida) : new Date();
  const sugestao = new Date(base);
  sugestao.setFullYear(sugestao.getFullYear() + 1);
  const sugestaoStr = sugestao.toISOString().split("T")[0];

  const [novaData, setNovaData] = useState(sugestaoStr);
  const utils = trpc.useUtils();

  const renovar = trpc.contratos.renovar.useMutation({
    onSuccess: () => {
      toast.success(`Contrato de ${contrato.nomeInquilino} renovado com sucesso!`);
      utils.contratos.list.invalidate();
      utils.contratos.vencendoEm30.invalidate();
      utils.contratos.byId.invalidate({ id: contrato.id });
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error("Erro ao renovar: " + err.message);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Ícone + título */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.22 255)" }}>
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Renovar Contrato</h2>
            <p className="text-sm text-muted-foreground">{contrato.nomeInquilino} — Casa {contrato.casa}</p>
          </div>
        </div>

        {/* Info atual */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data de saída atual:</span>
            <span className="font-semibold text-red-600">{formatDate(contrato.dataSaida)}</span>
          </div>
        </div>

        {/* Nova data */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Nova data de saída (vencimento do contrato)
          </label>
          <input
            type="date"
            value={novaData}
            onChange={(e) => setNovaData(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-base font-medium"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Sugestão: +1 ano da data atual ({formatDate(sugestao)})
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => renovar.mutate({ id: contrato.id, novaDataSaida: novaData })}
            disabled={!novaData || renovar.isPending}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ background: "oklch(0.50 0.22 140)" }}
          >
            {renovar.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {renovar.isPending ? "Salvando..." : "Confirmar Renovação"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Alertas() {
  const [contratoRenovando, setContratoRenovando] = useState<ContratoParaRenovar | null>(null);
  const utils = trpc.useUtils();

  const { data: vencendo, isLoading } = trpc.contratos.vencendoEm30.useQuery();
  const { data: todosContratos, refetch: refetchTodos } = trpc.contratos.list.useQuery({ status: "encerrado" });

  // Contratos vencidos = encerrados OU com dataSaida no passado
  const vencidos = todosContratos?.filter(({ contrato }) => {
    if (contrato.status === "encerrado") return true;
    if (contrato.dataSaida) {
      return new Date(contrato.dataSaida).getTime() < Date.now();
    }
    return false;
  }) ?? [];

  return (
    <div className="space-y-5">
      {/* Modal de renovação */}
      {contratoRenovando && (
        <ModalRenovacao
          contrato={contratoRenovando}
          onClose={() => setContratoRenovando(null)}
          onSuccess={() => {
            refetchTodos();
            utils.contratos.vencendoEm30.invalidate();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.62 0.20 310)" }}>
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-muted-foreground text-sm">Contratos vencidos e vencendo nos próximos 30 dias</p>
        </div>
      </div>

      {/* Seção de contratos vencidos */}
      {vencidos.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-red-700">Contratos Vencidos — Precisam de Renovação</h2>
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{vencidos.length}</span>
          </div>
          <p className="text-xs text-red-500 mb-3">Estes contratos já passaram da data de saída. Clique em <b>Renovar</b> para definir uma nova data de vencimento.</p>
          <div className="space-y-2">
            {vencidos.map(({ contrato, propriedade }) => {
              const diasVencido = contrato.dataSaida
                ? Math.abs(Math.ceil((new Date(contrato.dataSaida).getTime() - Date.now()) / 86400000))
                : null;
              return (
                <div key={contrato.id} className="bg-white border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{contrato.nomeInquilino}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Casa {contrato.casa}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>{propriedade?.nome}</span>
                      <span>Venceu em: <b className="text-red-600">{formatDate(contrato.dataSaida)}</b></span>
                      {diasVencido !== null && (
                        <span className="text-red-500 font-semibold">Há {diasVencido} dia(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Botão de renovar — clicável e funcional */}
                    <button
                      onClick={() => setContratoRenovando({
                        id: contrato.id,
                        nomeInquilino: contrato.nomeInquilino,
                        casa: contrato.casa,
                        dataSaida: contrato.dataSaida,
                      })}
                      className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white border border-green-600 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renovar
                    </button>
                    <Link href={`/contratos/${contrato.id}`} className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !vencendo || vencendo.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Nenhum contrato vencendo em breve!</h2>
          <p className="text-muted-foreground text-sm mt-1">Nenhum contrato vence nos próximos 30 dias.</p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Vencem em 7 dias", count: vencendo.filter(({ contrato }) => diasParaVencer(contrato.dataSaida) <= 7).length, color: "bg-red-500" },
              { label: "Vencem em 15 dias", count: vencendo.filter(({ contrato }) => { const d = diasParaVencer(contrato.dataSaida); return d > 7 && d <= 15; }).length, color: "bg-orange-500" },
              { label: "Vencem em 30 dias", count: vencendo.filter(({ contrato }) => diasParaVencer(contrato.dataSaida) > 15).length, color: "bg-amber-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-border p-3 text-center">
                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center mx-auto mb-1`}>
                  <span className="text-white font-bold text-sm">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Lista de contratos vencendo */}
          <div className="space-y-3">
            {vencendo
              .sort((a, b) => diasParaVencer(a.contrato.dataSaida) - diasParaVencer(b.contrato.dataSaida))
              .map(({ contrato, propriedade }) => {
                const dias = diasParaVencer(contrato.dataSaida);
                const colors = urgencyColor(dias);
                return (
                  <Card key={contrato.id} className={`border-2 rounded-2xl overflow-hidden ${colors.bg}`}>
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className="w-2 flex-shrink-0 rounded-l-2xl" style={{ background: colors.bar }} />
                        <div className="flex-1 px-4 py-3">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground text-base">{contrato.nomeInquilino}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                  Casa {contrato.casa}
                                </span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${colors.badge}`}>
                                  {dias === 0 ? "Vence hoje!" : `${dias} dia(s)`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{propriedade?.nome}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1.5 justify-end">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm font-bold text-foreground">
                                  {formatDate(contrato.dataSaida)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">Data de vencimento</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span>Aluguel: <b className="text-foreground">R$ {Number(contrato.aluguel).toFixed(2).replace(".", ",")}</b></span>
                            <span>Entrada: <b className="text-foreground">{formatDate(contrato.dataEntrada)}</b></span>
                            {/* Botão renovar também na lista de "vencendo em breve" */}
                            <button
                              onClick={() => setContratoRenovando({
                                id: contrato.id,
                                nomeInquilino: contrato.nomeInquilino,
                                casa: contrato.casa,
                                dataSaida: contrato.dataSaida,
                              })}
                              className="ml-auto flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Renovar
                            </button>
                            <Link href={`/contratos/${contrato.id}`} className="flex items-center">
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
