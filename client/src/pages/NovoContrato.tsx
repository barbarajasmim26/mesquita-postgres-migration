import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, UserPlus, Building2, Home, Calendar, DollarSign, Check, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function NovoContrato() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: propriedades } = trpc.propriedades.list.useQuery();

  // Formulário
  const [form, setForm] = useState({
    propriedadeId: "",
    casa: "",
    nomeInquilino: "",
    dataEntrada: "",
    dataSaida: "",
    caucao: "",
    aluguel: "",
    diaPagamento: "10",
    observacoes: "",
  });

  // Modal de nova propriedade
  const [showNovaProp, setShowNovaProp] = useState(false);
  const [novaProp, setNovaProp] = useState({ nome: "", endereco: "", cidade: "Bessalândia" });

  const criarPropMutation = trpc.propriedadesAdmin.create.useMutation({
    onSuccess: (data) => {
      toast.success("Condomínio/endereço criado!");
      utils.propriedades.list.invalidate();
      setForm((f) => ({ ...f, propriedadeId: String(data.id) }));
      setShowNovaProp(false);
      setNovaProp({ nome: "", endereco: "", cidade: "Bessalândia" });
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const criarContratoMutation = trpc.contratos.create.useMutation({
    onSuccess: async (data) => {
      // Gerar meses de 2026 automaticamente para o novo contrato
      toast.success("Inquilino cadastrado com sucesso!");
      utils.contratos.list.invalidate();
      utils.dashboard.stats.invalidate();
      navigate(`/contratos/${data.id}`);
    },
    onError: (err) => toast.error("Erro ao cadastrar: " + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propriedadeId || !form.casa || !form.nomeInquilino || !form.aluguel) {
      toast.error("Preencha os campos obrigatórios: Condomínio, Casa, Nome e Aluguel");
      return;
    }
    criarContratoMutation.mutate({
      propriedadeId: Number(form.propriedadeId),
      casa: form.casa,
      nomeInquilino: form.nomeInquilino,
      dataEntrada: form.dataEntrada || null,
      dataSaida: form.dataSaida || null,
      caucao: form.caucao || null,
      aluguel: form.aluguel,
      diaPagamento: form.diaPagamento ? Number(form.diaPagamento) : null,
      observacoes: form.observacoes || null,
      status: "ativo",
    });
  };

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Modal nova propriedade */}
      {showNovaProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.22 255)" }}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold">Novo Condomínio / Endereço</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Nome do condomínio *</label>
                <input
                  type="text"
                  placeholder="Ex: Rua Gabriel Gomes Barbosa"
                  value={novaProp.nome}
                  onChange={(e) => setNovaProp((p) => ({ ...p, nome: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Endereço completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Rua Gabriel Gomes Barbosa - Bessalândia"
                  value={novaProp.endereco}
                  onChange={(e) => setNovaProp((p) => ({ ...p, endereco: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Cidade</label>
                <input
                  type="text"
                  value={novaProp.cidade}
                  onChange={(e) => setNovaProp((p) => ({ ...p, cidade: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNovaProp(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => criarPropMutation.mutate(novaProp)}
                disabled={!novaProp.nome || !novaProp.endereco || criarPropMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "oklch(0.50 0.22 255)" }}
              >
                <Check className="w-4 h-4" />
                {criarPropMutation.isPending ? "Salvando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/contratos">
          <a className="flex items-center gap-1.5 text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Contratos
          </a>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-semibold text-sm">Novo Inquilino</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.22 255)" }}>
          <UserPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Inquilino</h1>
          <p className="text-muted-foreground text-sm">Preencha os dados para cadastrar um novo contrato</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Condomínio */}
        <Card className="border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Condomínio / Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex gap-2">
              <select
                value={form.propriedadeId}
                onChange={(e) => set("propriedadeId", e.target.value)}
                required
                className="flex-1 px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm bg-background"
              >
                <option value="">Selecione o condomínio/endereço *</option>
                {propriedades?.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNovaProp(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-primary/50 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Novo
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Selecione o endereço onde o inquilino vai morar. Se não existir, clique em "Novo" para criar.
            </p>
          </CardContent>
        </Card>

        {/* Dados do inquilino */}
        <Card className="border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              Dados do Inquilino
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Nome completo *</label>
                <input
                  type="text"
                  placeholder="Nome do inquilino"
                  value={form.nomeInquilino}
                  onChange={(e) => set("nomeInquilino", e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Número da casa *</label>
                <input
                  type="text"
                  placeholder="Ex: 205, 864F, 851-C"
                  value={form.casa}
                  onChange={(e) => set("casa", e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card className="border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Período do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Data de entrada</label>
                <input
                  type="date"
                  value={form.dataEntrada}
                  onChange={(e) => set("dataEntrada", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Data de saída (vencimento)</label>
                <input
                  type="date"
                  value={form.dataSaida}
                  onChange={(e) => set("dataSaida", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card className="border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Valores e Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Aluguel mensal (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="450,00"
                  value={form.aluguel}
                  onChange={(e) => set("aluguel", e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Caução (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="500,00"
                  value={form.caucao}
                  onChange={(e) => set("caucao", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Dia do pagamento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="10"
                  value={form.diaPagamento}
                  onChange={(e) => set("diaPagamento", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="border border-border shadow-sm rounded-2xl">
          <CardContent className="px-5 py-4">
            <label className="block text-sm font-semibold mb-1.5">Observações (opcional)</label>
            <textarea
              placeholder="Anotações sobre o contrato, condições especiais, etc."
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-sm resize-none"
            />
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-3 pb-6">
          <Link href="/contratos">
            <a className="flex-1 px-4 py-3 rounded-xl border-2 border-border text-sm font-semibold text-center hover:bg-gray-50 transition-colors">
              Cancelar
            </a>
          </Link>
          <button
            type="submit"
            disabled={criarContratoMutation.isPending}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            style={{ background: "oklch(0.50 0.22 255)" }}
          >
            {criarContratoMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Cadastrar Inquilino
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
