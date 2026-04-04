import { useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Building2, Calendar, DollarSign,
  FileText, Upload, Download, Trash2, AlertOctagon, RefreshCw, X, Check, Receipt, MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import PagamentoStatusSelector from "@/components/PagamentoStatusSelector";
import { toast } from "sonner";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function formatBRL(v: string | number | null) {
  if (!v) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function ContratoDetalhe() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModalRenovar, setShowModalRenovar] = useState(false);
  const [novaDataRenovacao, setNovaDataRenovacao] = useState("");
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    nomeInquilino: "",
    casa: "",
    aluguel: "",
    caucao: "",
    diaPagamento: 1,
    dataEntrada: "",
    dataSaida: "",
    telefone: "",
    observacoes: ""
  });
  const [expandedYears, setExpandedYears] = useState<Set<number>>(() => {
    const hoje = new Date();
    return new Set([hoje.getFullYear()]);
  });

  const toggleYear = (ano: number) => {
    const newSet = new Set(expandedYears);
    if (newSet.has(ano)) {
      newSet.delete(ano);
    } else {
      newSet.add(ano);
    }
    setExpandedYears(newSet);
  };

  const { data, isLoading } = trpc.contratos.byId.useQuery({ id });
  const { data: pagamentos } = trpc.pagamentos.byContrato.useQuery({ contratoId: id });
  const { data: arquivos } = trpc.arquivos.byContrato.useQuery({ contratoId: id });

  const uploadMutation = trpc.arquivos.getUploadUrl.useMutation({
    onSuccess: () => {
      utils.arquivos.byContrato.invalidate({ contratoId: id });
      toast.success("Arquivo enviado com sucesso!");
    },
    onError: () => toast.error("Erro ao enviar arquivo"),
  });

  const deleteMutation = trpc.arquivos.delete.useMutation({
    onSuccess: () => {
      utils.arquivos.byContrato.invalidate({ contratoId: id });
      toast.success("Arquivo removido");
    },
  });

  const upsertPagamento = trpc.pagamentos.upsert.useMutation({
    onSuccess: () => {
      utils.pagamentos.byContrato.invalidate({ contratoId: id });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar pagamento"),
  });

  const renovarMutation = trpc.contratos.renovar.useMutation({
    onSuccess: () => {
      toast.success("Contrato renovado com sucesso!");
      utils.contratos.byId.invalidate({ id });
      utils.contratos.list.invalidate();
      utils.contratos.vencendoEm30.invalidate();
      setShowModalRenovar(false);
    },
    onError: (err) => toast.error("Erro ao renovar: " + err.message),
  });

  const updateContratoMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      utils.contratos.byId.invalidate({ id });
      utils.contratos.list.invalidate();
      utils.contratos.vencendoEm30.invalidate();
      setShowModalEdit(false);
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message),
  });

  const openEditModal = () => {
    if (!contrato) return;
    setEditForm({
      nomeInquilino: contrato.nomeInquilino || "",
      casa: contrato.casa || "",
      aluguel: String(contrato.aluguel || ""),
      caucao: String(contrato.caucao || ""),
      diaPagamento: contrato.diaPagamento || 1,
      dataEntrada: contrato.dataEntrada ? new Date(contrato.dataEntrada).toISOString().split("T")[0] : "",
      dataSaida: contrato.dataSaida ? new Date(contrato.dataSaida).toISOString().split("T")[0] : "",
      telefone: contrato.telefone || "",
      observacoes: contrato.observacoes || ""
    });
    setShowModalEdit(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      await uploadMutation.mutateAsync({
        contratoId: id,
        nomeArquivo: file.name,
        mimeType: file.type,
        tamanho: file.size,
        base64,
      });
    };
    reader.readAsDataURL(file);
  };

  // Gerar todos os anos desde a data de entrada até 2 anos no futuro
  const gerarAnosDisponiveis = () => {
    const anos: number[] = [];
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    
    if (data?.contrato?.dataEntrada) {
      const anoEntrada = new Date(data.contrato.dataEntrada).getFullYear();
      for (let ano = anoEntrada; ano <= anoAtual + 2; ano++) {
        anos.push(ano);
      }
    } else {
      // Se não houver data de entrada, mostrar ano atual e próximo
      anos.push(anoAtual, anoAtual + 1, anoAtual + 2);
    }
    
    return anos.sort((a, b) => b - a); // Ordenar decrescente
  };

  // Agrupar pagamentos por ano
  const pagamentosPorAno: Record<number, Record<number, NonNullable<typeof pagamentos>[number]>> = {};
  pagamentos?.forEach((p) => {
    if (!pagamentosPorAno[p.ano]) pagamentosPorAno[p.ano] = {};
    pagamentosPorAno[p.ano][p.mes] = p;
  });

  // Garantir que todos os anos disponíveis existem no objeto
  const anosDisponiveis = gerarAnosDisponiveis();
  anosDisponiveis.forEach((ano) => {
    if (!pagamentosPorAno[ano]) {
      pagamentosPorAno[ano] = {};
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <Link href="/contratos" className="text-primary underline mt-2 block">Voltar</Link>
      </div>
    );
  }

  const { contrato, propriedade } = data;
  const hoje = Date.now();
  const diasParaVencer = contrato.dataSaida
    ? Math.ceil((new Date(contrato.dataSaida).getTime() - hoje) / 86400000)
    : null;
  const contratoVencido = contrato.status === "encerrado" || (diasParaVencer !== null && diasParaVencer < 0);
  const vencendoBreve = diasParaVencer !== null && diasParaVencer >= 0 && diasParaVencer <= 30;

  // Calcular sugestão de data de renovação quando os dados estiverem disponíveis
  const sugestaoRenovacao = (() => {
    if (!data?.contrato) return "";
    const base = data.contrato.dataSaida ? new Date(data.contrato.dataSaida) : new Date();
    const s = new Date(base);
    s.setFullYear(s.getFullYear() + 1);
    return s.toISOString().split("T")[0];
  })();

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Modal de renovação */}
      {showModalRenovar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModalRenovar(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.22 255)" }}>
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Renovar Contrato</h2>
                <p className="text-sm text-muted-foreground">{contrato.nomeInquilino} — Casa {contrato.casa}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de saída atual:</span>
                <span className="font-semibold text-red-600">{formatDate(contrato.dataSaida)}</span>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-2">Nova data de saída (vencimento)</label>
              <input
                type="date"
                value={novaDataRenovacao || sugestaoRenovacao}
                onChange={(e) => setNovaDataRenovacao(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-base font-medium"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Sugestão: +1 ano ({formatDate(sugestaoRenovacao)})</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModalRenovar(false)} className="flex-1 px-4 py-3 rounded-xl border-2 border-border text-sm font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={() => renovarMutation.mutate({ id, novaDataSaida: novaDataRenovacao })}
                disabled={!novaDataRenovacao || renovarMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "oklch(0.50 0.22 140)" }}
              >
                {renovarMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {renovarMutation.isPending ? "Salvando..." : "Confirmar Renovação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showModalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModalEdit(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.22 255)" }}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Editar Contrato</h2>
                <p className="text-sm text-muted-foreground">Corrija os dados do inquilino e valores</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Nome do Inquilino</label>
                <input
                  type="text"
                  value={editForm.nomeInquilino}
                  onChange={(e) => setEditForm({ ...editForm, nomeInquilino: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Casa / Apto</label>
                <input
                  type="text"
                  value={editForm.casa}
                  onChange={(e) => setEditForm({ ...editForm, casa: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Telefone</label>
                <input
                  type="text"
                  value={editForm.telefone}
                  onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Valor Aluguel (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.aluguel}
                  onChange={(e) => setEditForm({ ...editForm, aluguel: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Valor Caução (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.caucao}
                  onChange={(e) => setEditForm({ ...editForm, caucao: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Dia de Pagamento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editForm.diaPagamento}
                  onChange={(e) => setEditForm({ ...editForm, diaPagamento: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Data de Entrada</label>
                <input
                  type="date"
                  value={editForm.dataEntrada}
                  onChange={(e) => setEditForm({ ...editForm, dataEntrada: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Data de Saída (Vencimento)</label>
                <input
                  type="date"
                  value={editForm.dataSaida}
                  onChange={(e) => setEditForm({ ...editForm, dataSaida: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Observações</label>
                <textarea
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border-2 border-border focus:border-primary focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModalEdit(false)} className="flex-1 px-4 py-3 rounded-xl border-2 border-border text-sm font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={() => updateContratoMutation.mutate({ id, ...editForm })}
                disabled={updateContratoMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "oklch(0.50 0.22 255)" }}
              >
                {updateContratoMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {updateContratoMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/contratos" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Contratos
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-semibold text-sm">{contrato.nomeInquilino}</span>
      </div>

      {/* ⚠ Aviso de contrato vencido */}
      {contratoVencido && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-700 text-base">⚠ Contrato Vencido!</p>
            <p className="text-red-600 text-sm mt-0.5">
              Este contrato venceu em <b>{formatDate(contrato.dataSaida)}</b>.
              {diasParaVencer !== null && (
                <span> Há <b>{Math.abs(diasParaVencer)} dia(s)</b> sem renovação.</span>
              )}
            </p>
            <p className="text-red-500 text-xs mt-1">
              Entre em contato com o inquilino para renovar ou encerrar o contrato.
            </p>
              <div className="flex items-center gap-2">
              <button
                onClick={openEditModal}
                className="flex-1 bg-white border-2 border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <FileText className="w-4 h-4 text-primary" />
                Editar Dados
              </button>
              <button
                onClick={() => setShowModalRenovar(true)}              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Renovar Contrato
            </button>
          </div>
        </div>
      )}

      {/* Card principal do inquilino */}
      <Card className={`border-0 shadow-md rounded-2xl overflow-hidden ${contratoVencido ? "ring-2 ring-red-200" : ""}`}>
        <div className="h-2" style={{ background: contratoVencido ? "oklch(0.60 0.22 25)" : "oklch(0.50 0.22 255)" }} />
        <CardHeader className="pb-2 pt-5 px-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">{contrato.nomeInquilino}</CardTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-sm bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">
                  Casa {contrato.casa}
                </span>
                {contratoVencido ? (
                  <span className="text-sm bg-red-100 text-red-700 border border-red-300 px-2.5 py-0.5 rounded-full font-bold">
                    ⚠ Contrato Vencido
                  </span>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={contrato.status} size="md" />
                    {contrato.status !== "ex-inquilino" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({
                          id,
                          status: contrato.status === "ativo" ? "encerrado" : "ativo"
                        })}
                        disabled={updateStatusMutation.isPending}
                        className="text-xs px-2.5 py-0.5 rounded-full font-semibold transition-all disabled:opacity-50 hover:opacity-90"
                        style={{
                          background: contrato.status === "ativo" ? "oklch(0.65 0.20 25)" : "oklch(0.70 0.15 120)",
                          color: "white"
                        }}
                        title={contrato.status === "ativo" ? "Desativar inquilino" : "Ativar inquilino"}
                      >
                        {updateStatusMutation.isPending ? "..." : (contrato.status === "ativo" ? "Desativar" : "Ativar")}
                      </button>
                    )}
                    {contrato.status !== "ex-inquilino" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({
                          id,
                          status: "ex-inquilino"
                        })}
                        disabled={updateStatusMutation.isPending}
                        className="text-xs px-2.5 py-0.5 rounded-full font-semibold transition-all disabled:opacity-50 hover:opacity-90 bg-slate-500 text-white"
                        title="Marcar como ex-inquilino (nao renovacao)"
                      >
                        {updateStatusMutation.isPending ? "..." : "Ex-Inquilino"}
                      </button>
                    )}
                  </div>
                )}
                {vencendoBreve && !contratoVencido && (
                  <span className="text-sm bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                    ⚠ Vence em {diasParaVencer} dia(s)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatBRL(contrato.aluguel)}</p>
              <p className="text-xs text-muted-foreground">por mês • Dia {contrato.diaPagamento ?? "—"}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            <InfoItem icon={<Building2 className="w-4 h-4" />} label="Endereço" value={propriedade?.nome ?? "—"} />
            <InfoItem icon={<Building2 className="w-4 h-4" />} label="Casa" value={contrato.casa} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Data de Entrada" value={formatDate(contrato.dataEntrada)} />
            <InfoItem
              icon={<Calendar className="w-4 h-4" />}
              label="Data de Saída"
              value={formatDate(contrato.dataSaida)}
              highlight={vencendoBreve || contratoVencido}
              highlightColor={contratoVencido ? "red" : "amber"}
            />
            <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Aluguel Mensal" value={formatBRL(contrato.aluguel)} />
            <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Caução" value={formatBRL(contrato.caucao)} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Dia do Pagamento" value={contrato.diaPagamento ? `Todo dia ${contrato.diaPagamento}` : "—"} />
            <InfoItem
              icon={<FileText className="w-4 h-4" />}
              label="Situação"
              value={contratoVencido ? "⚠ Contrato Vencido" : contrato.status === "ativo" ? "✅ Ativo" : contrato.status}
              highlight={contratoVencido}
              highlightColor="red"
            />
          </div>
          {contrato.observacoes && (
            <div className="mt-4 bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Observações</p>
              <p className="text-sm text-foreground">{contrato.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de pagamentos */}
      <Card className="border border-border shadow-sm rounded-2xl">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Histórico de Pagamentos
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Pago</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Pendente</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Atrasado</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Caução</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Clique em qualquer mês para alterar o status do pagamento</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {/* Nota: Os pagamentos podem ser alterados independentemente do status do contrato (ativo/inativo) */}
          {Object.keys(pagamentosPorAno).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhum pagamento registrado</p>
          ) : (
            Object.entries(pagamentosPorAno)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([anoStr, mesesPag]) => {
                const isExpanded = expandedYears.has(Number(anoStr));
                const anoNum = Number(anoStr);
                return (
                <div key={anoStr} className="mb-6">
                  <button
                    onClick={() => toggleYear(anoNum)}
                    className="w-full text-left mb-3"
                  >
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                      <span className="bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs">{anoStr}</span>
                      <span className="text-xs text-muted-foreground">
                        {Object.values(mesesPag).filter((p) => p.status === "pago").length} pagos •{" "}
                        {Object.values(mesesPag).filter((p) => p.status === "atrasado").length} atrasados •{" "}
                        {Object.values(mesesPag).filter((p) => p.status === "pendente").length} pendentes
                      </span>
                    </h3>
                  </button>
                  {isExpanded && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {MESES.map((mesNome, idx) => {
                      const pag = mesesPag[idx + 1];
                      const pagamento = pag || {
                        id: 0,
                        contratoId: id,
                        ano: Number(anoStr),
                        mes: idx + 1,
                        status: 'pendente' as const,
                        valorPago: null,
                        dataPagamento: null,
                        observacao: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      };
                      return (
                        <div key={idx} className="rounded-xl overflow-visible">
                          <div className="bg-muted/20 rounded-xl p-2 text-center mb-1">
                            <p className="text-xs font-bold text-foreground">{mesNome}</p>
                            {pagamento.valorPago && (
                              <p className="text-xs text-muted-foreground">
                                {formatBRL(pagamento.valorPago)}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-center">
                            <PagamentoStatusSelector
                              contratoId={id}
                              ano={Number(anoStr)}
                              mes={idx + 1}
                              mesNome={mesNome}
                              statusAtual={pagamento.status as "pago" | "pendente" | "atrasado" | "caucao"}
                              valorAluguel={contrato.aluguel}
                              onSave={(params) => upsertPagamento.mutate(params)}
                              saving={upsertPagamento.isPending}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              );
              })
          )}
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 flex-wrap">
        <Link href={`/whatsapp?contratoId=${id}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90" style={{ background: "oklch(0.55 0.20 145)" }}>
            <MessageCircle className="w-4 h-4" />
            Enviar WhatsApp
        </Link>
        <Link href={`/recibo?contratoId=${id}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90" style={{ background: "oklch(0.50 0.22 255)" }}>
            <Receipt className="w-4 h-4" />
            Gerar Recibo de Pagamento
        </Link>
      </div>

      {/* Upload de arquivos */}
      <Card className="border border-border shadow-sm rounded-2xl">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Arquivos do Contrato
            </CardTitle>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadMutation.isPending ? "Enviando..." : "Enviar Arquivo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {!arquivos || arquivos.length === 0 ? (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground font-medium">Clique para enviar o contrato em PDF</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOC, DOCX, JPG, PNG — máx 10MB</p>
            </div>
          ) : (
            <div className="space-y-2">
              {arquivos.map((arq) => (
                <div key={arq.id} className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{arq.nomeArquivo}</p>
                    <p className="text-xs text-muted-foreground">
                      {arq.tamanho ? `${(arq.tamanho / 1024).toFixed(0)} KB` : ""} •{" "}
                      {new Date(arq.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={arq.urlArquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      title="Baixar arquivo"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate({ id: arq.id })}
                      className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Remover arquivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                + Adicionar outro arquivo
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  icon, label, value, highlight, highlightColor = "amber"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: "amber" | "red";
}) {
  const colors = {
    amber: { bg: "bg-amber-50 border border-amber-200", icon: "text-amber-600", text: "text-amber-700" },
    red:   { bg: "bg-red-50 border border-red-200",     icon: "text-red-600",   text: "text-red-700" },
  };
  const c = colors[highlightColor];
  return (
    <div className={`rounded-xl p-3 ${highlight ? c.bg : "bg-muted/40"}`}>
      <div className={`flex items-center gap-1.5 mb-1 ${highlight ? c.icon : "text-muted-foreground"}`}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className={`text-sm font-bold ${highlight ? c.text : "text-foreground"}`}>{value}</p>
    </div>
  );
}
