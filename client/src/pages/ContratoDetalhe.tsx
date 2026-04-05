import { useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Building2, Calendar, DollarSign,
  FileText, Upload, Download, Trash2, AlertOctagon, RefreshCw, X, Check, Receipt, MessageCircle, Edit3, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import PagamentoStatusSelector from "@/components/PagamentoStatusSelector";
import { toast } from "sonner";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function formatBRL(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "—";
  try {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch (e) {
    return "—";
  }
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR");
  } catch (e) {
    return "—";
  }
}

export default function ContratoDetalhe() {
  console.log("CARREGANDO VERSÃO BLINDADA 1.0.1");
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
  const { data: pagamentosRaw } = trpc.pagamentos.byContrato.useQuery({ contratoId: id });
  const pagamentos = Array.isArray(pagamentosRaw) ? pagamentosRaw : [];
  const { data: arquivosRaw } = trpc.arquivos.byContrato.useQuery({ contratoId: id });
  const arquivos = Array.isArray(arquivosRaw) ? arquivosRaw : [];

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
    const c = data?.contrato;
    if (!c) return;
    setEditForm({
      nomeInquilino: c.nomeInquilino || "",
      casa: c.casa || "",
      aluguel: String(c.aluguel || ""),
      caucao: String(c.caucao || ""),
      diaPagamento: c.diaPagamento || 1,
      dataEntrada: c.dataEntrada ? new Date(c.dataEntrada).toISOString().split("T")[0] : "",
      dataSaida: c.dataSaida ? new Date(c.dataSaida).toISOString().split("T")[0] : "",
      telefone: c.telefone || "",
      observacoes: c.observacoes || ""
    });
    setShowModalEdit(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const gerarAnosDisponiveis = () => {
    const anos: number[] = [];
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const dataEntrada = data?.contrato?.dataEntrada;
    
    if (dataEntrada) {
      const anoEntrada = new Date(dataEntrada).getFullYear();
      for (let ano = Math.min(anoEntrada, anoAtual); ano <= anoAtual + 2; ano++) {
        anos.push(ano);
      }
    } else {
      anos.push(anoAtual, anoAtual + 1, anoAtual + 2);
    }
    
    return Array.from(new Set(anos)).sort((a, b) => b - a);
  };

  const pagamentosPorAno: Record<number, Record<number, any>> = {};
  pagamentos.forEach((p) => {
    if (!pagamentosPorAno[p.ano]) pagamentosPorAno[p.ano] = {};
    pagamentosPorAno[p.ano][p.mes] = p;
  });

  const anosDisponiveis = gerarAnosDisponiveis();
  anosDisponiveis.forEach((ano) => {
    if (!pagamentosPorAno[ano]) pagamentosPorAno[ano] = {};
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl p-6">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  const contrato = data?.contrato;
  const propriedade = data?.propriedade;

  if (!contrato) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <Link href="/contratos" className="text-primary underline mt-2 block">Voltar para lista</Link>
      </div>
    );
  }

  // PROTEÇÃO CRÍTICA CONTRA UNDEFINED EM DATAS
  const hojeTimestamp = Date.now();
  const dataSaidaRaw = contrato?.dataSaida;
  const diasParaVencer = dataSaidaRaw
    ? Math.ceil((new Date(dataSaidaRaw).getTime() - hojeTimestamp) / 86400000)
    : null;
    
  const contratoVencido = contrato?.status === "encerrado" || (diasParaVencer !== null && diasParaVencer < 0);
  const vencendoBreve = diasParaVencer !== null && diasParaVencer >= 0 && diasParaVencer <= 30;

  const sugestaoRenovacao = (() => {
    const base = dataSaidaRaw ? new Date(dataSaidaRaw) : new Date();
    const s = new Date(base);
    s.setFullYear(s.getFullYear() + 1);
    return s.toISOString().split("T")[0];
  })();

  return (
    <div className="space-y-5 max-w-4xl p-4 sm:p-6">
      {/* Modal de renovação */}
      {showModalRenovar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModalRenovar(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Renovar Contrato</h2>
                <p className="text-sm text-muted-foreground">{contrato?.nomeInquilino || "Inquilino"} — Casa {contrato?.casa || "—"}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de saída atual:</span>
                <span className="font-semibold text-red-600">{formatDate(contrato?.dataSaida)}</span>
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
                onClick={() => renovarMutation.mutate({ id, novaDataSaida: novaDataRenovacao || sugestaoRenovacao })}
                disabled={renovarMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 bg-green-600 disabled:opacity-50"
              >
                {renovarMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showModalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative my-8">
            <button onClick={() => setShowModalEdit(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Editar Inquilino</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1">Nome do Inquilino</label>
                <input className="w-full px-3 py-2 border rounded-xl" value={editForm.nomeInquilino} onChange={e => setEditForm({...editForm, nomeInquilino: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Casa</label>
                <input className="w-full px-3 py-2 border rounded-xl" value={editForm.casa} onChange={e => setEditForm({...editForm, casa: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Telefone</label>
                <input className="w-full px-3 py-2 border rounded-xl" value={editForm.telefone} onChange={e => setEditForm({...editForm, telefone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Aluguel (R$)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-xl" value={editForm.aluguel} onChange={e => setEditForm({...editForm, aluguel: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Caução (R$)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-xl" value={editForm.caucao} onChange={e => setEditForm({...editForm, caucao: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Dia Vencimento</label>
                <input type="number" className="w-full px-3 py-2 border rounded-xl" value={editForm.diaPagamento} onChange={e => setEditForm({...editForm, diaPagamento: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Data Entrada</label>
                <input type="date" className="w-full px-3 py-2 border rounded-xl" value={editForm.dataEntrada} onChange={e => setEditForm({...editForm, dataEntrada: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1">Data Saída (Vencimento Contrato)</label>
                <input type="date" className="w-full px-3 py-2 border rounded-xl" value={editForm.dataSaida} onChange={e => setEditForm({...editForm, dataSaida: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1">Observações</label>
                <textarea className="w-full px-3 py-2 border rounded-xl h-24" value={editForm.observacoes} onChange={e => setEditForm({...editForm, observacoes: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModalEdit(false)} className="flex-1 px-4 py-3 rounded-xl border-2 border-border font-semibold">Cancelar</button>
              <button 
                onClick={() => updateContratoMutation.mutate({ 
                  id, 
                  data: {
                    ...editForm,
                    aluguel: Number(editForm.aluguel),
                    caucao: Number(editForm.caucao),
                    dataEntrada: editForm.dataEntrada ? new Date(editForm.dataEntrada) : null,
                    dataSaida: editForm.dataSaida ? new Date(editForm.dataSaida) : null,
                  }
                })}
                disabled={updateContratoMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegação e Título */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/contratos">
          <a className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Contratos
          </a>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={openEditModal} className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-600 transition-colors">
            <Edit3 className="w-4 h-4" />
            Editar Dados
          </button>
          <Link href={`/recibo?contratoId=${id}`}>
            <a className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-orange-600 transition-colors">
              <Receipt className="w-4 h-4" />
              Gerar Recibo
            </a>
          </Link>
        </div>
      </div>

      {/* Alerta de Vencimento */}
      {contratoVencido && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800">Contrato Vencido!</p>
              <p className="text-sm text-red-600">Este contrato expirou em {formatDate(contrato?.dataSaida)}.</p>
            </div>
          </div>
          <button onClick={() => setShowModalRenovar(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm">
            Renovar Agora
          </button>
        </div>
      )}

      {vencendoBreve && !contratoVencido && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800">Contrato Vencendo em Breve</p>
              <p className="text-sm text-amber-600">Faltam {diasParaVencer} dias para o vencimento ({formatDate(contrato?.dataSaida)}).</p>
            </div>
          </div>
          <button onClick={() => setShowModalRenovar(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm">
            Renovar Contrato
          </button>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna de Informações (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-foreground">
                  {contrato?.nomeInquilino || "Inquilino"}
                </CardTitle>
                <StatusBadge status={contrato?.status || "ativo"} />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{propriedade?.nome || "Propriedade"} — Casa {contrato?.casa || "—"}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div className="p-3 rounded-2xl bg-muted/50 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Aluguel</p>
                  <p className="text-lg font-bold text-foreground">{formatBRL(contrato?.aluguel)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/50 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Caução</p>
                  <p className="text-lg font-bold text-foreground">{formatBRL(contrato?.caucao)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/50 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Dia Venc.</p>
                  <p className="text-lg font-bold text-foreground">{contrato?.diaPagamento || "—"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/50 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Entrada</p>
                  <p className="text-sm font-bold text-foreground">{formatDate(contrato?.dataEntrada)}</p>
                </div>
              </div>

              {contrato?.observacoes && (
                <div className="mt-6 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Observações
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{contrato.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Histórico de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {anosDisponiveis.map((ano) => {
                const isExpanded = expandedYears.has(ano);
                return (
                  <div key={ano} className="border-b last:border-0">
                    <button onClick={() => toggleYear(ano)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <span className="font-bold text-foreground">{ano}</span>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {MESES.map((nome, idx) => {
                          const mesNum = idx + 1;
                          const pag = pagamentosPorAno[ano]?.[mesNum];
                          return (
                            <div key={mesNum} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-white shadow-sm">
                              <span className="text-xs font-bold text-muted-foreground">{nome}</span>
                              <PagamentoStatusSelector
                                status={pag?.status || "pendente"}
                                onChange={(newStatus) => upsertPagamento.mutate({ contratoId: id, ano, mes: mesNum, status: newStatus })}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral (1/3) */}
        <div className="space-y-5">
          {/* Contato WhatsApp */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-green-50/50 border-green-100">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> Contato WhatsApp
              </p>
              <div className="flex flex-col gap-3">
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs">Telefone:</p>
                  <p className="font-bold text-foreground">{contrato?.telefone || "Não informado"}</p>
                </div>
                <Link href={`/whatsapp?contratoId=${id}`}>
                  <a className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                    <MessageCircle className="w-4 h-4" />
                    Enviar Mensagem
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Documentos/Arquivos */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Documentos
              </CardTitle>
              <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Upload className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
            </CardHeader>
            <CardContent className="space-y-2">
              {arquivos.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                  Nenhum arquivo enviado
                </div>
              ) : (
                arquivos.map((arq) => (
                  <div key={arq.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-white group">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{arq.nomeOriginal}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={arq.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => confirm("Remover este arquivo?") && deleteMutation.mutate({ id: arq.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
