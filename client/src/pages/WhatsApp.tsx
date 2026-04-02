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
    return d.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

export default function WhatsApp() {
  const { data: contratos = [] } = trpc.contratos.list.useQuery({});
  const { data: propriedades = [] } = trpc.propriedades.list.useQuery();

  // Pegar contratoId da URL se vier do botão do detalhe
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
    () => contratos.find((c) => String(c.contrato.id) === contratoId),
    [contratos, contratoId]
  );
  const contrato = contratoItem?.contrato;
  const propriedade = contratoItem?.propriedade;

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const c = contratos.find((x) => String(x.contrato.id) === id);
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

  const contratosAtivos = contratos.filter((c) => c.contrato.status === "ativo");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
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
        {/* Coluna esquerda: configurações */}
        <div className="space-y-4">
          {/* Selecionar inquilino */}
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
              {contratosAtivos.map((c) => {
              const prop = c.propriedade;
              return (
                <SelectItem key={c.contrato.id} value={String(c.contrato.id)}>
                  {c.contrato.nomeInquilino} — Casa {c.contrato.casa}
                  {prop ? ` (${prop.nome})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {contrato && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                  <p><span className="font-medium">Casa:</span> {contrato.casa}</p>
                  <p><span className="font-medium">Endereço:</span> {propriedade?.endereco}</p>
                  <p><span className="font-medium">Aluguel:</span> R$ {Number(contrato.aluguel).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p><span className="font-medium">Vencimento:</span> Dia {contrato.diaPagamento}</p>
                  <p><span className="font-medium">Contrato até:</span> {formatarData(contrato.dataSaida ? String(contrato.dataSaida) : null)}</p>
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
                <p className="text-xs text-gray-400 mt-1">Salvo automaticamente quando disponível no contrato</p>
              </div>
            </CardContent>
          </Card>

          {/* Modelo de mensagem */}
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
                    {modeloKey === key && (
                      <Badge className="ml-auto bg-orange-500 text-white text-xs">Selecionado</Badge>
                    )}
                  </button>
                ))}
              </div>

              {/* Mês/Ano para cobrança e recibo */}
              {(modeloKey === "cobranca" || modeloKey === "recibo") && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <Label className="text-xs text-gray-600">Mês de referência</Label>
                    <Select value={mes} onValueChange={(v) => { setMes(v); setEditando(false); }}>
                      <SelectTrigger className="mt-1 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((m, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Ano</Label>
                    <Select value={ano} onValueChange={(v) => { setAno(v); setEditando(false); }}>
                      <SelectTrigger className="mt-1 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita: preview e envio */}
        <div className="space-y-4">
          <Card className="border-2 border-green-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-green-500">💬</span> Preview da Mensagem
                {editando && (
                  <Badge className="ml-auto bg-purple-500 text-white text-xs">Editando</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Balão estilo WhatsApp */}
              {!editando && modeloKey !== "personalizada" ? (
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-4 text-sm text-gray-800 whitespace-pre-wrap shadow-sm min-h-[160px] font-sans leading-relaxed border border-green-200">
                  {mensagemGerada}
                </div>
              ) : (
                <Textarea
                  className="min-h-[200px] text-sm font-sans leading-relaxed resize-none"
                  value={editando ? mensagemEditada : mensagemPersonalizada}
                  onChange={(e) => {
                    if (editando) setMensagemEditada(e.target.value);
                    else setMensagemPersonalizada(e.target.value);
                  }}
                  placeholder={modeloKey === "personalizada" ? "Digite sua mensagem personalizada aqui..." : ""}
                />
              )}

              {/* Botões de ação da mensagem */}
              <div className="flex gap-2">
                {!editando && modeloKey !== "personalizada" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                    onClick={handleEditar}
                  >
                    ✏️ Editar
                  </Button>
                )}
                {editando && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-gray-600"
                    onClick={() => setEditando(false)}
                  >
                    ↩️ Restaurar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={handleCopiar}
                >
                  📋 Copiar
                </Button>
              </div>

              {/* Botão principal de envio */}
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 text-base shadow-md"
                onClick={handleEnviar}
              >
                <span className="mr-2 text-lg">📱</span>
                Abrir no WhatsApp
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Abre o WhatsApp Web (ou app) com a mensagem pronta para enviar
              </p>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="border-2 border-gray-100 bg-gray-50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">💡 Como usar:</p>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                <li>Selecione o inquilino na lista</li>
                <li>Informe o número do WhatsApp com DDD</li>
                <li>Escolha o modelo de mensagem</li>
                <li>Edite se necessário e clique em "Abrir no WhatsApp"</li>
                <li>O WhatsApp abrirá com a mensagem pronta — só clicar em Enviar!</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista rápida de inquilinos ativos */}
      <Card className="border-2 border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span>📋</span> Acesso Rápido — Inquilinos Ativos ({contratosAtivos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {contratosAtivos.map((c) => {
              const prop = c.propriedade;
              return (
                <button
                  key={c.contrato.id}
                  onClick={() => handleContratoChange(String(c.contrato.id))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all ${
                    contratoId === String(c.contrato.id)
                      ? "border-green-400 bg-green-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                  }`}
                >
                  <span className="text-green-500 text-base">👤</span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{c.contrato.nomeInquilino}</p>
                    <p className="text-xs text-gray-500 truncate">Casa {c.contrato.casa} — {prop?.nome ?? "—"}</p>
                  </div>
                  {c.contrato.telefone && (
                    <span className="ml-auto text-green-500 text-xs shrink-0">📱</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
