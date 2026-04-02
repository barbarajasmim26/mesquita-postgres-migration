import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

type StatusPag = "pago" | "pendente" | "atrasado" | "caucao";

const opcoes: { value: StatusPag; label: string; bg: string; text: string; dot: string }[] = [
  { value: "pago",     label: "✅ Pago",      bg: "bg-green-50 hover:bg-green-100",   text: "text-green-700",  dot: "bg-green-500" },
  { value: "pendente", label: "⏳ Pendente",  bg: "bg-gray-50 hover:bg-gray-100",     text: "text-gray-600",   dot: "bg-gray-400" },
  { value: "atrasado", label: "❌ Atrasado",  bg: "bg-red-50 hover:bg-red-100",       text: "text-red-700",    dot: "bg-red-500" },
  { value: "caucao",   label: "🔒 Caução",    bg: "bg-amber-50 hover:bg-amber-100",   text: "text-amber-700",  dot: "bg-amber-400" },
];

const badgeStyle: Record<StatusPag, string> = {
  pago:     "bg-green-500 text-white",
  pendente: "bg-gray-200 text-gray-700",
  atrasado: "bg-red-500 text-white",
  caucao:   "bg-amber-400 text-amber-900",
};

interface Props {
  contratoId: number;
  ano: number;
  mes: number;
  mesNome: string;
  statusAtual: StatusPag;
  valorAluguel: string | number | null;
  onSave: (params: { contratoId: number; ano: number; mes: number; status: StatusPag; valorPago: string | null }) => void;
  saving?: boolean;
}

export default function PagamentoStatusSelector({
  contratoId, ano, mes, mesNome, statusAtual, valorAluguel, onSave, saving
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(status: StatusPag) {
    setOpen(false);
    onSave({
      contratoId,
      ano,
      mes,
      status,
      valorPago: status === "pago" ? String(valorAluguel ?? 0) : null,
    });
  }

  const atual = opcoes.find((o) => o.value === statusAtual);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold
          transition-all cursor-pointer select-none
          ${badgeStyle[statusAtual] ?? "bg-gray-200 text-gray-700"}
          ${saving ? "opacity-60 cursor-wait" : "hover:opacity-80 active:scale-95"}
          shadow-sm
        `}
        title="Clique para alterar o status"
      >
        <span>{atual?.label ?? statusAtual}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white rounded-2xl shadow-xl border border-border overflow-hidden min-w-[150px]">
          <div className="px-3 py-2 border-b border-border/50">
            <p className="text-xs font-bold text-muted-foreground">{mesNome}/{ano}</p>
            <p className="text-xs text-muted-foreground">Alterar status:</p>
          </div>
          {opcoes.map((op) => (
            <button
              key={op.value}
              onClick={() => handleSelect(op.value)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold
                transition-colors ${op.bg} ${op.text}
              `}
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${op.dot}`} />
              {op.label}
              {op.value === statusAtual && (
                <Check className="w-3.5 h-3.5 ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
