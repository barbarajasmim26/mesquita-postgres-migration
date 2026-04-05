import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const anoAtual = new Date().getFullYear();
const mesAtual = new Date().getMonth() + 1;

type ModeloKey = "cobranca" | "vencimento" | "recibo" | "boas_vindas" | "personalizada";

interface Modelo {
  label: string;
  emoji: string;
  cor: string;
  gerar: (dados: DadosContrato) => string;
}

interface DadosContrato {
  nome: string;
  casa: string;
  endereco: string;
  aluguel: string;
  diaPagamento: string;
  dataSaida: string;
  mes: string;
  ano: string;
  diasAtraso?: number;
}

const MODELOS: Record<ModeloKey, Modelo> = {
  cobranca: {
    label: "Cobrança de Aluguel",
    emoji: "💰",
    cor: "bg-red-100 text-red-800 border-red-200",
    gerar: (d) =>
      `Olá, ${d.nome}! 😊\n\nPassando para lembrar que o aluguel referente ao mês de *${d.mes}/${d.ano}* no valor de *R$ ${d.aluguel}* está em aberto.\n\nImóvel: ${d.endereco} - Casa ${d.casa}\nVencimento: dia ${d.diaPagamento}\n\nPor favor, entre em contato para regularizar. Obrigado! 🏠\n\n_Mesquita Administração de Imóveis_`,
  },
  vencimento: {
    label: "Aviso de Vencimento de Contrato",
    emoji: "📅",
    cor: "bg-orange-100 text-orange-800 border-orange-200",
    gerar: (d) =>
      `Olá, ${d.nome}! 😊\n\nInformamos que seu contrato de aluguel no imóvel *${d.endereco} - Casa ${d.casa}* vence em *${d.dataSaida}*.\n\nCaso tenha interesse em renovar, entre em contato conosco com antecedência para tratarmos dos detalhes.\n\nAtenciosamente,\n_Mesquita Administração de Imóveis_ 🏠`,
  },
  recibo: {
    label: "Confirmação de Pagamento",
    emoji: "✅",
    cor: "bg-green-100 text-green-800 border-green-200",
    gerar: (d) =>
      `Olá, ${d.nome}! 😊\n\nConfirmamos o recebimento do aluguel referente ao mês de *${d.mes}/${d.ano}* no valor de *R$ ${d.aluguel}*.\n\nImóvel: ${d.endereco} - Casa ${d.casa}\n\nObrigado pelo pagamento em dia! ✅\n\n_Mesquita Administração de Imóveis_ 🏠`,
  },
  boas_vindas: {
    label: "Boas-vindas ao Inquilino",
    emoji: "🎉",
    cor: "bg-blue-100 text-blue-800 border-blue-200",
    gerar: (d) =>
      `Olá, ${d.nome}! Seja muito bem-vindo(a)! 🎉🏠\n\nÉ um prazer tê-lo(a) como inquilino(a) no imóvel *${d.endereco} - Casa ${d.casa}*.\n\nSeu aluguel mensal é de *R$ ${d.aluguel}*, com vencimento todo dia *${d.diaPagamento}*.\n\nQualquer dúvida, estamos à disposição!\n\n_Mesquita Administração de Imóveis_ 😊`,
  },
  personalizada: {
    label: "Mensagem Personalizada",
    emoji: "✏️",
    cor: "bg-purple-100 text-purple-800 border-purple-200",
    gerar: (d) => `Olá, ${d.nome}! 😊\n\n`,
  },
};

function formatarData(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

export default function WhatsApp() {
  const { data: contratosRaw = [] } = trpc.contratos.list.useQuery({});
  const contratos = Array.isArray(contratosRaw) ? contratosRaw : [];

  const urlParams = new URLSearchParams(window.location.search);
  const contratoIdFromUrl = urlParams.get("contratoId") ?? "";

  const [contratoId, setContratoId] = useState<string>(contratoIdFromUrl);
  const [modeloKey, setModeloKey] = useState<ModeloKey>("cobranca");
  const [mes, setMes] = useState<string>(String(mesAtual));
  const [ano, setAno] = useState<string>(String(anoAtual));
  const [telefone, setTelefone] = useState<string>("");
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState<string>("");
  const [mensagemEditada, setMensagemEditada] = useState<string>("");
  const [editando, setEditando] = useState(false);

  const contratoItem = useMemo(
    () => contratos.find((c: any) => String(c.contrato?.id) === contratoId),
    [contratos, contratoId]
  );
  const contrato = contratoItem?.contrato;
  const propriedade = contratoItem?.propriedade;

  const dadosContrato: DadosContrato = useMemo(() => ({
    nome: contrato?.nomeInquilino ?? "Inquilino",
    casa: contrato?.casa ?? "—",
    endereco: propriedade?.endereco ?? "—",
    aluguel: contrato ? Number(contrato.aluguel).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "—",
    diaPagamento: String(contrato?.diaPagamento ?? "—"),
    dataSaida: formatarData(contrato?.dataSaida ? String(contrato.dataSaida) : null),
    mes: MESES[Number(mes) - 1] ?? mes,
    ano,
  }), [contrato, propriedade, mes, ano]);

  const mensagemGerada = useMemo(() => {
    if (modeloKey === "personalizada") return mensagemPersonalizada;
    return MODELOS[modeloKey].gerar(dadosContrato);
  }, [modeloKey, dadosContrato, mensagemPersonalizada]);

  const mensagemFinal = editando ? mensagemEditada : mensagemGerada;

  function handleContratoChange(id: string) {
    setContratoId(id);
    const c = contratos.find((x: any) => String(x.contrato?.id) === id);
    if (c?.contrato?.telefone) setTelefone(c.contrato.telefone);
    setEditando(false);
  }

  function handleModeloChange(key: ModeloKey) {
    setModeloKey(key);
    setEditando(false);
  }

  function handleEditar() {
    setMensagemEditada(mensagemGerada);
    setEditando(true);
  }

  function handleEnviar() {
    const numero = telefone.replace(/\D/g, "");
    if (!numero) {
      toast.error("Informe o número do WhatsApp do inquilino.");
      return;
    }
    const numeroFinal = numero.startsWith("55") ? numero : `55${numero}`;
    const url = `https://wa.me/${numeroFinal}?text=${encodeURIComponent(mensagemFinal)}`;
    window.open(url, "_blank");
    toast.success("WhatsApp aberto com a mensagem pronta!");
  }

  function handleCopiar() {
    navigator.clipboard.writeText(mensagemFinal);
    toast.success("Mensagem copiada para a área de transferência!");
  }

  const contratosAtivos = contratos.filter((c: any) => c.contrato?.status === "ativo");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white text-2xl shadow-lg">
          📱
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mensagens WhatsApp</h1>
          <p className="text-gray-500 text-sm">Envie mensagens prontas diretamente pelo WhatsApp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="border-2 border-blue-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-blue-500">👤</span> Selecionar Inquilino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Inquilino</Label>
                <Select value={contratoId} onValueChange={handleContratoChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um inquilino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contratosAtivos.map((c: any) => {
                      const prop = c.propriedade;
                      return (
                        <SelectItem key={c.contrato?.id} value={String(c.contrato?.id)}>
                          {c.contrato?.nomeInquilino} — Casa {c.contrato?.casa}
                          {prop ? ` (${prop.nome})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {contrato && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                  <p><span className="font-medium">Casa:</span> {contrato.casa || "—"}</p>
                  <p><span className="font-medium">Endereço:</span> {propriedade?.endereco || "—"}</p>
                  <p><span className="font-medium">Aluguel:</span> R$ {Number(contrato.aluguel || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p><span className="font-medium">Vencimento:</span> Dia {contrato.diaPagamento || "—"}</p>
                  <p><span className="font-medium">Contrato até:</span> {formatarData(contrato.dataSaida)}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Número do WhatsApp <span className="text-gray-400">(com DDD)</span>
                </Label>
                <Input
                  className="mt-1"
                  placeholder="Ex: 64 9 9999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-orange-500">📝</span> Modelo de Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(MODELOS) as [ModeloKey, Modelo][]).map(([key, modelo]) => (
                  <button
                    key={key}
                    onClick={() => handleModeloChange(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                      modeloKey === key
                        ? "border-orange-400 bg-orange-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
                    }`}
                  >
                    <span className="text-lg">{modelo.emoji}</span>
                    <span>{modelo.label}</span>
                  </button>
                ))}
              </div>

              {modeloKey === "personalizada" ? (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mensagem</Label>
                  <Textarea
                    className="mt-1 h-32"
                    placeholder="Digite sua mensagem aqui..."
                    value={mensagemPersonalizada}
                    onChange={(e) => setMensagemPersonalizada(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Mês Ref.</Label>
                    <Select value={mes} onValueChange={setMes}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Ano Ref.</Label>
                    <Select value={ano} onValueChange={setAno}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[anoAtual - 1, anoAtual, anoAtual + 1].map((a) => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-2 border-green-100 shadow-md h-full flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">👀</span> Prévia da Mensagem
                </div>
                {!editando && modeloKey !== "personalizada" && (
                  <Button variant="ghost" size="sm" onClick={handleEditar} className="text-xs h-7">
                    ✏️ Editar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-4 flex flex-col">
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 font-sans text-sm whitespace-pre-wrap text-gray-800">
                {editando ? (
                  <Textarea
                    className="w-full h-full bg-transparent border-none focus:ring-0 p-0 resize-none text-sm"
                    value={mensagemEditada}
                    onChange={(e) => setMensagemEditada(e.target.value)}
                  />
                ) : (
                  mensagemGerada || "Selecione um inquilino e um modelo para gerar a prévia..."
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopiar} className="gap-2">
                  📋 Copiar
                </Button>
                <Button onClick={handleEnviar} className="bg-green-600 hover:bg-green-700 gap-2">
                  📱 Enviar WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
