import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Users, Search, Filter, Plus, RotateCcw, Trash2, Calendar, DollarSign, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function formatBRL(v: string | number | null) {
  if (!v) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR");
  } catch (e) {
    return "—";
  }
}

export default function ExInquilinos() {
  const [busca, setBusca] = useState("");
  const [propFiltro, setPropFiltro] = useState<number | undefined>();

  const { data: exInquilinos, isLoading } = trpc.contratos.list.useQuery({
    status: "ex-inquilino",
    busca: busca || undefined,
    propriedadeId: propFiltro,
  });

  const { data: propriedades } = trpc.propriedades.list.useQuery();
  const utils = trpc.useUtils();

  const reativarMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success("Inquilino reativado com sucesso!");
      utils.contratos.list.invalidate();
    },
    onError: () => toast.error("Erro ao reativar inquilino"),
  });

  const deleteMutation = trpc.contratos.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrato removido com sucesso!");
      utils.contratos.list.invalidate();
    },
    onError: () => toast.error("Erro ao remover contrato"),
  });

  const listaExInquilinos = Array.isArray(exInquilinos) ? exInquilinos : [];
  const listaPropriedades = Array.isArray(propriedades) ? propriedades : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Ex-Inquilinos
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {listaExInquilinos.length} ex-inquilino(s)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border dark:bg-slate-800 dark:text-white"
          />

          <select
            value={propFiltro ?? ""}
            onChange={(e) => setPropFiltro(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 rounded-xl border border-border dark:bg-slate-800 dark:text-white"
          >
            <option value="">Todas as propriedades</option>
            {listaPropriedades.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : listaExInquilinos.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhum ex-inquilino registrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listaExInquilinos.map((item: any) => {
            const contrato = item?.contrato || item;
            if (!contrato) return null;
            
            return (
            <Card key={contrato.id} className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground">{contrato.nomeInquilino || "Sem nome"}</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        Casa {contrato.casa || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Saída: {formatDate(contrato.dataSaida)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatBRL(contrato.aluguel)}/mês
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reativarMutation.mutate({
                        id: contrato.id,
                        status: "ativo"
                      })}
                      disabled={reativarMutation.isPending}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      title="Reativar inquilino"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reativar
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Tem certeza que deseja remover este contrato?")) {
                          deleteMutation.mutate({ id: contrato.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      title="Remover contrato"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
