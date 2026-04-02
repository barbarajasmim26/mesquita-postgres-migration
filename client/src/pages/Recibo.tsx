import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Printer, Receipt, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663491336634/HYxBNRCcMAFfUrRuSsmFNE/logo_mesquita_a2807a4a.png";
const ASSINATURA_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663491336634/HYxBNRCcMAFfUrRuSsmFNE/assinatura_mesquita_a69bc557.png";

const MESES = [
  "janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro"
];
const MESES_SELECT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function valorPorExtenso(valor: number): string {
  if (valor === 0) return "zero reais";
  const unidades = ["","um","dois","três","quatro","cinco","seis","sete","oito","nove",
    "dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
  const dezenas = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
  const centenas = ["","cem","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];

  function escreverMenorQueMil(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    let resultado = "";
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (c > 0) resultado += centenas[c];
    if (c > 0 && resto > 0) resultado += " e ";
    if (resto > 0) {
      if (resto < 20) resultado += unidades[resto];
      else {
        const d = Math.floor(resto / 10);
        const u = resto % 10;
        resultado += dezenas[d];
        if (u > 0) resultado += " e " + unidades[u];
      }
    }
    return resultado;
  }

  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  let resultado = "";
  if (reais >= 1000) {
    const mil = Math.floor(reais / 1000);
    const resto = reais % 1000;
    resultado += escreverMenorQueMil(mil) + " mil";
    if (resto > 0) resultado += " e " + escreverMenorQueMil(resto);
  } else if (reais > 0) {
    resultado += escreverMenorQueMil(reais);
  }
  if (reais > 0) resultado += reais === 1 ? " real" : " reais";
  if (centavos > 0) {
    if (reais > 0) resultado += " e ";
    resultado += escreverMenorQueMil(centavos);
    resultado += centavos === 1 ? " centavo" : " centavos";
  }
  return resultado.charAt(0).toUpperCase() + resultado.slice(1);
}

function formatarDataExtenso(dataStr: string, cidade: string): string {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  return `${cidade || "Fortaleza"} ${dia} de ${MESES[mes - 1]} de ${ano}`;
}

interface ReciboForm {
  nomeInquilino: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  rg: string;
  orgaoExpedidor: string;
  cpf: string;
  tipoRecibo: "aluguel" | "caucao";
  valor: string;
  formaPagamento: string;
  incluirPagoPor: "sim" | "nao";
  nomePagador: string;
  mesReferencia: string;
  anoReferencia: string;
  enderecoImovel: string;
  cidade: string;
  data: string;
  nomeLocadora: string;
}

const FORM_INICIAL: ReciboForm = {
  nomeInquilino: "",
  nacionalidade: "brasileiro(a)",
  estadoCivil: "solteiro(a)",
  profissao: "",
  rg: "",
  orgaoExpedidor: "SSP/CE",
  cpf: "",
  tipoRecibo: "aluguel",
  valor: "",
  formaPagamento: "via pix",
  incluirPagoPor: "sim",
  nomePagador: "",
  mesReferencia: String(new Date().getMonth() + 1),
  anoReferencia: String(new Date().getFullYear()),
  enderecoImovel: "",
  cidade: "Fortaleza",
  data: new Date().toISOString().split("T")[0],
  nomeLocadora: "Maria Eneide da Silva",
};

const inputCls = "w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

export default function Recibo() {
  const utils = trpc.useUtils();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const contratoIdParam = params.get("contratoId") ? Number(params.get("contratoId")) : undefined;

  const { data: propriedades } = trpc.propriedades.list.useQuery();
  const [propSelecionadaId, setPropSelecionadaId] = useState<number | "">("");
  const { data: contratosData } = trpc.contratos.list.useQuery(
    { propriedadeId: propSelecionadaId !== "" ? propSelecionadaId : undefined, status: "ativo" },
    { enabled: true }
  );
  const contratos = contratosData ?? [];

  const { data: contratoPreData } = trpc.contratos.byId.useQuery(
    { id: contratoIdParam! },
    { enabled: !!contratoIdParam }
  );

  const [form, setForm] = useState<ReciboForm>(FORM_INICIAL);
  const [contratoSelecionadoId, setContratoSelecionadoId] = useState<number | "">("");
  const [preenchidoDoContrato, setPreenchidoDoContrato] = useState(false);
  const [perfilAplicado, setPerfilAplicado] = useState(false);

  const { data: perfilRecibo } = trpc.inquilinoRecibo.byContrato.useQuery(
    { contratoId: Number(contratoSelecionadoId) },
    { enabled: contratoSelecionadoId !== "" }
  );

  const { data: historicoRecibos, isLoading: carregandoHistorico } = trpc.recibos.list.useQuery(
    contratoSelecionadoId !== "" ? { contratoId: Number(contratoSelecionadoId) } : undefined
  );

  const salvarDadosInquilino = trpc.inquilinoRecibo.save.useMutation({
    onSuccess: () => {
      utils.inquilinoRecibo.byContrato.invalidate({ contratoId: Number(contratoSelecionadoId) });
      toast.success("Dados do inquilino salvos para os próximos recibos.");
    },
    onError: (error) => toast.error(error.message || "Não foi possível salvar os dados do inquilino."),
  });

  const criarRecibo = trpc.recibos.create.useMutation({
    onSuccess: async () => {
      await utils.recibos.list.invalidate();
    },
  });

  const getValorContrato = (tipoRecibo: ReciboForm["tipoRecibo"], aluguel?: string | number | null, caucao?: string | number | null) => {
    if (tipoRecibo === "caucao") return caucao ? String(Number(caucao)) : "";
    return aluguel ? String(Number(aluguel)) : "";
  };

  useEffect(() => {
    if (contratoPreData && !preenchidoDoContrato) {
      const c = contratoPreData.contrato;
      const p = contratoPreData.propriedade;
      if (p) setPropSelecionadaId(p.id);
      setContratoSelecionadoId(c.id);
      setForm((prev) => ({
        ...prev,
        nomeInquilino: c.nomeInquilino ?? "",
        valor: getValorContrato(prev.tipoRecibo, c.aluguel, c.caucao),
        enderecoImovel: p ? `${p.endereco}, ${c.casa} - Bessalândia - Cascavel/CE` : "",
      }));
      setPreenchidoDoContrato(true);
    }
  }, [contratoPreData, preenchidoDoContrato]);

  useEffect(() => {
    if (contratoSelecionadoId === "") {
      setPerfilAplicado(false);
      return;
    }
    const item = contratos.find((c) => c.contrato.id === contratoSelecionadoId);
    if (!item) return;

    setForm((prev) => ({
      ...prev,
      nomeInquilino: item.contrato.nomeInquilino ?? prev.nomeInquilino,
      valor: getValorContrato(prev.tipoRecibo, item.contrato.aluguel, item.contrato.caucao),
      enderecoImovel: item.propriedade ? `${item.propriedade.endereco}, ${item.contrato.casa} - Bessalândia - Cascavel/CE` : prev.enderecoImovel,
    }));
  }, [contratoSelecionadoId, contratos]);

  useEffect(() => {
    if (!perfilRecibo || perfilAplicado === true) return;
    setForm((prev) => ({
      ...prev,
      nomeInquilino: perfilRecibo.nomeInquilino || prev.nomeInquilino,
      nacionalidade: perfilRecibo.nacionalidade || prev.nacionalidade,
      estadoCivil: perfilRecibo.estadoCivil || prev.estadoCivil,
      profissao: perfilRecibo.profissao || prev.profissao,
      rg: perfilRecibo.rg || prev.rg,
      orgaoExpedidor: perfilRecibo.orgaoExpedidor || prev.orgaoExpedidor,
      cpf: perfilRecibo.cpf || prev.cpf,
    }));
    setPerfilAplicado(true);
  }, [perfilRecibo, perfilAplicado]);

  const handleSelecionarContrato = (id: number | "") => {
    setContratoSelecionadoId(id);
    setPerfilAplicado(false);
    if (id === "") {
      setForm((prev) => ({ ...prev, ...FORM_INICIAL, nomePagador: "", valor: "", enderecoImovel: "" }));
      return;
    }
    const item = contratos.find((c) => c.contrato.id === id);
    if (!item) return;
    const c = item.contrato;
    const p = item.propriedade;
    setForm((prev) => ({
      ...prev,
      nomeInquilino: c.nomeInquilino ?? "",
      valor: getValorContrato(prev.tipoRecibo, c.aluguel, c.caucao),
      enderecoImovel: p ? `${p.endereco}, ${c.casa} - Bessalândia - Cascavel/CE` : "",
      rg: "",
      cpf: "",
      profissao: "",
    }));
  };

  const handleSelecionarProp = (id: number | "") => {
    setPropSelecionadaId(id);
    setContratoSelecionadoId("");
    setPerfilAplicado(false);
    setForm((prev) => ({ ...prev, ...FORM_INICIAL, nomePagador: "", nomeInquilino: "", valor: "", enderecoImovel: "" }));
  };

  const set = (field: keyof ReciboForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: nextValue } as ReciboForm;
      if (field === "tipoRecibo" && contratoSelecionadoId !== "") {
        const item = contratos.find((c) => c.contrato.id === contratoSelecionadoId);
        if (item) {
          next.valor = getValorContrato(nextValue as ReciboForm["tipoRecibo"], item.contrato.aluguel, item.contrato.caucao);
        }
      }
      if (field === "incluirPagoPor" && nextValue === "nao") {
        next.nomePagador = "";
      }
      return next;
    });
  };

  const valorNum = parseFloat(form.valor.replace(",", ".")) || 0;
  const valorFormatado = valorNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const valorExtenso = valorPorExtenso(valorNum);
  const mesNome = MESES[Number(form.mesReferencia) - 1] ?? "";
  const dataExtenso = formatarDataExtenso(form.data, form.cidade);

  const payloadRecibo = useMemo(() => ({
    contratoId: contratoSelecionadoId === "" ? null : Number(contratoSelecionadoId),
    nomeInquilino: form.nomeInquilino,
    nacionalidade: form.nacionalidade,
    estadoCivil: form.estadoCivil,
    profissao: form.profissao,
    rg: form.rg,
    orgaoExpedidor: form.orgaoExpedidor,
    cpf: form.cpf,
    tipoRecibo: form.tipoRecibo,
    valor: (valorNum || 0).toFixed(2),
    formaPagamento: form.formaPagamento,
    incluirPagoPor: form.incluirPagoPor,
    nomePagador: form.incluirPagoPor === "sim" ? form.nomePagador : "",
    mesReferencia: Number(form.mesReferencia),
    anoReferencia: Number(form.anoReferencia),
    enderecoImovel: form.enderecoImovel,
    cidade: form.cidade,
    dataRecibo: form.data,
    nomeLocadora: form.nomeLocadora,
  }), [contratoSelecionadoId, form, valorNum]);

  const handleSalvarDados = async () => {
    if (contratoSelecionadoId === "") {
      toast.error("Selecione um inquilino para salvar os dados dele.");
      return;
    }
    await salvarDadosInquilino.mutateAsync({
      contratoId: Number(contratoSelecionadoId),
      nomeInquilino: form.nomeInquilino,
      nacionalidade: form.nacionalidade,
      estadoCivil: form.estadoCivil,
      profissao: form.profissao,
      rg: form.rg,
      orgaoExpedidor: form.orgaoExpedidor,
      cpf: form.cpf,
    });
  };

  const handleImprimir = async () => {
    if (!form.nomeInquilino || !form.valor || !form.enderecoImovel) {
      toast.error("Preencha nome, valor e endereço antes de gerar o recibo.");
      return;
    }
    try {
      await criarRecibo.mutateAsync(payloadRecibo);
      toast.success("Recibo salvo no histórico.");
      window.print();
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível salvar o recibo no histórico.");
    }
  };

  const handleReset = () => {
    setForm(FORM_INICIAL);
    setContratoSelecionadoId("");
    setPropSelecionadaId("");
    setPreenchidoDoContrato(false);
    setPerfilAplicado(false);
  };

  const aplicarReciboHistorico = (item: any) => {
    setForm((prev) => ({
      ...prev,
      nomeInquilino: item.nomeInquilino ?? prev.nomeInquilino,
      nacionalidade: item.nacionalidade ?? prev.nacionalidade,
      estadoCivil: item.estadoCivil ?? prev.estadoCivil,
      profissao: item.profissao ?? prev.profissao,
      rg: item.rg ?? prev.rg,
      orgaoExpedidor: item.orgaoExpedidor ?? prev.orgaoExpedidor,
      cpf: item.cpf ?? prev.cpf,
      tipoRecibo: item.tipoRecibo ?? prev.tipoRecibo,
      valor: item.valor ? String(Number(item.valor)) : prev.valor,
      formaPagamento: item.formaPagamento ?? prev.formaPagamento,
      incluirPagoPor: item.incluirPagoPor ?? prev.incluirPagoPor,
      nomePagador: item.nomePagador ?? prev.nomePagador,
      mesReferencia: item.mesReferencia ? String(item.mesReferencia) : prev.mesReferencia,
      anoReferencia: item.anoReferencia ? String(item.anoReferencia) : prev.anoReferencia,
      enderecoImovel: item.enderecoImovel ?? prev.enderecoImovel,
      cidade: item.cidade ?? prev.cidade,
      data: item.dataRecibo ? String(item.dataRecibo).slice(0, 10) : prev.data,
      nomeLocadora: item.nomeLocadora ?? prev.nomeLocadora,
    }));
    toast.success("Recibo carregado do histórico.");
  };

  return (
    <>
      <style>{`
        @page { margin: 0; size: A4; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #recibo-preview-print, #recibo-preview-print * { visibility: visible !important; }
          #recibo-preview-print {
            position: fixed !important; left: 0 !important; top: 0 !important; width: 100vw !important; height: 100vh !important;
            margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; background: white !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.22 255)" }}>
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recibo de Pagamento</h1>
              <p className="text-muted-foreground text-sm">Selecione o inquilino, salve os dados dele e mantenha histórico dos recibos emitidos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-border text-sm font-semibold hover:bg-muted/50 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Limpar
            </button>
            <button onClick={handleSalvarDados} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted/50" disabled={salvarDadosInquilino.isPending}>
              <Save className="w-4 h-4" />
              Salvar dados do inquilino
            </button>
            <button
              onClick={handleImprimir}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "oklch(0.50 0.22 255)" }}
              disabled={criarRecibo.isPending}
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4 no-print">
            <div className="bg-white rounded-2xl border-2 border-primary/30 shadow-sm p-5">
              <h2 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                Selecionar Inquilino
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Preenchimento automático</span>
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Condomínio / Endereço</label>
                  <select value={propSelecionadaId} onChange={(e) => handleSelecionarProp(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls}>
                    <option value="">— Todos os condomínios —</option>
                    {(propriedades ?? []).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Inquilino</label>
                  <select value={contratoSelecionadoId} onChange={(e) => handleSelecionarContrato(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls}>
                    <option value="">— Selecione o inquilino —</option>
                    {contratos.map(({ contrato, propriedade }) => (
                      <option key={contrato.id} value={contrato.id}>
                        {contrato.nomeInquilino} — Casa {contrato.casa}{propriedade ? ` (${propriedade.nome})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h2 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                Dados do Inquilino
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Nome completo *</label>
                  <input value={form.nomeInquilino} onChange={set("nomeInquilino")} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nacionalidade</label>
                    <input value={form.nacionalidade} onChange={set("nacionalidade")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Estado Civil</label>
                    <select value={form.estadoCivil} onChange={set("estadoCivil")} className={inputCls}>
                      <option>solteiro(a)</option>
                      <option>casado(a)</option>
                      <option>divorciado(a)</option>
                      <option>viúvo(a)</option>
                      <option>separado(a)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Profissão</label>
                  <input value={form.profissao} onChange={set("profissao")} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>RG</label>
                    <input value={form.rg} onChange={set("rg")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Órgão Expedidor</label>
                    <input value={form.orgaoExpedidor} onChange={set("orgaoExpedidor")} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>CPF</label>
                  <input value={form.cpf} onChange={set("cpf")} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h2 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                Dados do Pagamento
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tipo do recibo</label>
                    <select value={form.tipoRecibo} onChange={set("tipoRecibo")} className={inputCls}>
                      <option value="aluguel">Aluguel</option>
                      <option value="caucao">Caução</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Valor (R$) *</label>
                    <input value={form.valor} onChange={set("valor")} className={inputCls} />
                    {valorNum > 0 && <p className="text-xs text-green-600 mt-1 font-medium">Por extenso: {valorExtenso}</p>}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Forma de pagamento</label>
                  <input value={form.formaPagamento} onChange={set("formaPagamento")} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Mostrar “por / pago por” no recibo?</label>
                    <select value={form.incluirPagoPor} onChange={set("incluirPagoPor")} className={inputCls}>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pago por (nome do pagador)</label>
                    <input value={form.nomePagador} onChange={set("nomePagador")} className={inputCls} disabled={form.incluirPagoPor === "nao"} placeholder={form.incluirPagoPor === "nao" ? "Oculto no recibo" : "Nome do pagador"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Mês de referência</label>
                    <select value={form.mesReferencia} onChange={set("mesReferencia")} className={inputCls}>
                      {MESES_SELECT.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Ano</label>
                    <select value={form.anoReferencia} onChange={set("anoReferencia")} className={inputCls}>
                      {[2024, 2025, 2026, 2027, 2028].map((ano) => <option key={ano}>{ano}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h2 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: "oklch(0.62 0.20 310)" }}>4</span>
                Endereço e Data
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Endereço do imóvel *</label>
                  <input value={form.enderecoImovel} onChange={set("enderecoImovel")} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Cidade (data)</label>
                    <input value={form.cidade} onChange={set("cidade")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Data do recibo</label>
                    <input type="date" value={form.data} onChange={set("data")} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nome da Locadora</label>
                  <input value={form.nomeLocadora} onChange={set("nomeLocadora")} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-base text-foreground">Histórico de recibos</h2>
                  <p className="text-xs text-muted-foreground">Cada recibo impresso fica salvo aqui.</p>
                </div>
                {contratoSelecionadoId !== "" && <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">Filtrando pelo inquilino selecionado</span>}
              </div>
              <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
                {carregandoHistorico && <p className="text-sm text-muted-foreground">Carregando histórico...</p>}
                {!carregandoHistorico && (historicoRecibos ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum recibo salvo ainda.</p>
                )}
                {(historicoRecibos ?? []).map((item: any) => (
                  <div key={item.id} className="border border-border rounded-xl p-3 flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">{item.nomeInquilino} • {item.tipoRecibo === "caucao" ? "Caução" : "Aluguel"}</p>
                      <p className="text-muted-foreground">R$ {Number(item.valor ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {MESES_SELECT[(item.mesReferencia ?? 1) - 1]} / {item.anoReferencia}</p>
                      <p className="text-muted-foreground">Emitido em {String(item.dataRecibo).slice(0, 10)}</p>
                    </div>
                    <button onClick={() => aplicarReciboHistorico(item)} className="px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50">
                      Reusar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="no-print">
            <div className="sticky top-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Preview — como ficará impresso</p>
              <div className="bg-white rounded-2xl border-2 border-dashed border-border overflow-auto" style={{ maxHeight: "85vh" }}>
                <ReciboPreview form={form} valorFormatado={valorFormatado} valorExtenso={valorExtenso} mesNome={mesNome} dataExtenso={dataExtenso} />
              </div>
            </div>
          </div>
        </div>

        <div id="recibo-preview-print" style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <ReciboPreview form={form} valorFormatado={valorFormatado} valorExtenso={valorExtenso} mesNome={mesNome} dataExtenso={dataExtenso} />
        </div>
      </div>
    </>
  );
}

interface ReciboPreviewProps {
  form: ReciboForm;
  valorFormatado: string;
  valorExtenso: string;
  mesNome: string;
  dataExtenso: string;
}

function ReciboPreview({ form, valorFormatado, valorExtenso, mesNome, dataExtenso }: ReciboPreviewProps) {
  const descricaoReferencia = form.tipoRecibo === "caucao"
    ? `ao pagamento da caução${mesNome ? ` do mês de ${mesNome} de ${form.anoReferencia}` : ""}`
    : `ao aluguel do mês de ${mesNome} de ${form.anoReferencia}`;
  const trechoPagamento = form.incluirPagoPor === "sim"
    ? `${form.formaPagamento} por ${form.nomePagador || "___________________"}`
    : form.formaPagamento;

  return (
    <div style={{ fontFamily: "'Garamond', 'Georgia', serif", background: "#fff", color: "#1a1a1a", padding: "48px 72px", minHeight: "842px", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "52px" }}>
        <img src={LOGO_URL} alt="Mesquita Administração de Imóveis" style={{ height: "84px", objectFit: "contain" }} />
      </div>
      <div style={{ textAlign: "center", marginBottom: "44px" }}>
        <p style={{ fontWeight: "bold", fontSize: "16px", letterSpacing: "2px", textTransform: "uppercase" }}>Recibo de Pagamento</p>
      </div>
      <div style={{ textAlign: "center", lineHeight: "2.0", fontSize: "14.5px", maxWidth: "520px", margin: "0 auto 48px auto" }}>
        <p>
          Recebi de <strong>{form.nomeInquilino || "___________________"}</strong>, {form.nacionalidade}{form.estadoCivil ? `, ${form.estadoCivil}` : ""}
          {form.profissao ? `, ${form.profissao}` : ""}, portador da cédula de identidade n° {form.rg || "_______________"} {form.orgaoExpedidor}, inscrito no CPF n° {form.cpf || "___.___.___-__"}, o valor de <strong>R$ {valorFormatado || "0,00"} ({valorExtenso || "zero reais"})</strong> {trechoPagamento}, valor este referente {descricaoReferencia} do imóvel localizado na {form.enderecoImovel || "_________________________________"}.
        </p>
      </div>
      <div style={{ textAlign: "center", marginBottom: "60px", fontSize: "14px" }}>
        <p>{dataExtenso || "Fortaleza, ___ de _________ de ____"}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src={ASSINATURA_URL} alt="Assinatura" style={{ height: "72px", objectFit: "contain", marginBottom: "-4px" }} />
        <div style={{ width: "280px", borderTop: "1.5px solid #1a1a1a", paddingTop: "6px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", fontWeight: "500" }}>{form.nomeLocadora || "Maria Eneide da Silva"} - LOCADORA</p>
        </div>
      </div>
    </div>
  );
}
