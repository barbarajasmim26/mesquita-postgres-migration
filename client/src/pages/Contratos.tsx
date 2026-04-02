import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { FileText, Search, Filter, ChevronRight, Building2, Plus, AlertOctagon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";

function formatBRL(v: string | number | null) {
  if (!v) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function diasParaVencer(dataSaida: Date | string | null): number | null {
  if (!dataSaida) return null;
  const hoje = new Date();
  const saida = new Date(dataSaida);
  return Math.ceil((saida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Contratos() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [busca, setBusca] = useState("");
  const [propFiltro, setPropFiltro] = useState<number | undefined>(
    params.get("propriedadeId") ? Number(params.get("propriedadeId")) : undefined
  );
  const [statusFiltro, setStatusFiltro] = useState("");

  const { data: propriedades } = trpc.propriedades.list.useQuery();
  const { data: contratos, isLoading } = trpc.contratos.list.useQuery({
    propriedadeId: propFiltro,
    status: statusFiltro || undefined,
    busca: busca || undefined,
  });

  const listaContratos = Array.isArray(contratos) ? contratos : [];
  const listaPropriedades = Array.isArray(propriedades) ? propriedades : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Contratos
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {listaContratos.length} contrato(s)
          </p>
        </div>

        <Link href="/contratos/novo">
          <a className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" />
            Novo Contrato
          </a>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="px-3 py-2 rounded-xl border"
          />

          <select
            value={propFiltro ?? ""}
            onChange={(e) => setPropFiltro(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 rounded-xl border"
          >
            <option value="">Todos</option>
            {listaPropriedades.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="px-3 py-2 rounded-xl border"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="encerrado">Encerrado</option>
          </select>

        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div>Carregando...</div>
      ) : listaContratos.length === 0 ? (
        <div>Nenhum contrato encontrado</div>
      ) : (
        <div className="space-y-3">
          {listaContratos.map(({ contrato, propriedade }) => {
            const dias = diasParaVencer(contrato.dataSaida);

            return (
              <Link key={contrato.id} href={`/contratos/${contrato.id}`}>
                <Card className="cursor-pointer">
                  <CardContent>

                    <div className="flex justify-between">
                      <div>
                        <p>{contrato.nomeInquilino}</p>
                        <p>Casa {contrato.casa}</p>
                        <p>{propriedade?.nome}</p>
                      </div>

                      <div>
                        <p>{formatBRL(contrato.aluguel)}</p>
                        <p>{formatDate(contrato.dataSaida)}</p>
                        {dias !== null && <p>{dias} dias</p>}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
