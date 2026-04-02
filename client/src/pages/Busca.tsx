import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, Building2, Home, ChevronRight, FileText } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

function formatBRL(v: string | number | null) {
  if (!v) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function Busca() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: resultados, isLoading } = trpc.contratos.list.useQuery(
    { busca: debouncedQuery || undefined },
    { enabled: debouncedQuery.length >= 2 }
  );

  const mostrarResultados = debouncedQuery.length >= 2;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.55 0.20 145)" }}>
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Busca Rápida</h1>
          <p className="text-muted-foreground text-sm">Encontre qualquer inquilino ou imóvel</p>
        </div>
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Digite o nome do inquilino, número da casa..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border bg-white text-base shadow-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Dicas de busca */}
      {!mostrarResultados && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Como buscar:</p>
          <div className="space-y-2">
            {[
              { icon: <Home className="w-4 h-4 text-blue-500" />, text: "Número da casa: \"205\", \"846I\", \"851-C\"" },
              { icon: <FileText className="w-4 h-4 text-green-500" />, text: "Nome do inquilino: \"Maria\", \"Francisco\"" },
              { icon: <Building2 className="w-4 h-4 text-purple-500" />, text: "Parte do nome: \"Silva\", \"Santos\"" },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                {icon}
                <span>{text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Digite pelo menos 2 caracteres para buscar</p>
        </div>
      )}

      {/* Resultados */}
      {mostrarResultados && (
        <div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !resultados || resultados.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">Nenhum resultado encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Tente buscar por outro nome ou número</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3 font-medium">
                {resultados.length} resultado(s) para "{debouncedQuery}"
              </p>
              <div className="space-y-2">
                {resultados.map(({ contrato, propriedade }) => {
                  const dias = contrato.dataSaida
                    ? Math.ceil((new Date(contrato.dataSaida).getTime() - Date.now()) / 86400000)
                    : null;
                  const vencendo = dias !== null && dias >= 0 && dias <= 30;

                  return (
                    <Link key={contrato.id} href={`/contratos/${contrato.id}`}>
                      <a className="block">
                        <div className={`bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all cursor-pointer card-hover ${vencendo ? "border-amber-300" : "border-border"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground">{contrato.nomeInquilino}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                  Casa {contrato.casa}
                                </span>
                                <StatusBadge status={contrato.status} />
                                {vencendo && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                                    ⚠ {dias}d
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{propriedade?.endereco}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                <span>Aluguel: <b className="text-foreground">{formatBRL(contrato.aluguel)}</b></span>
                                <span>Entrada: <b className="text-foreground">{formatDate(contrato.dataEntrada)}</b></span>
                                <span>Saída: <b className={vencendo ? "text-amber-600" : "text-foreground"}>{formatDate(contrato.dataSaida)}</b></span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          </div>
                        </div>
                      </a>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
