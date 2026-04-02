type Status = "pago" | "caucao" | "pendente" | "atrasado" | "vencendo" | "ativo" | "encerrado" | "vencido" | "ex-inquilino";

const labels: Record<Status, string> = {
  pago: "Pago",
  caucao: "Caução",
  pendente: "Pendente",
  atrasado: "Atrasado",
  vencendo: "Vencendo em breve",
  ativo: "Ativo",
  encerrado: "⚠ Contrato Vencido",
  vencido: "⚠ Contrato Vencido",
  "ex-inquilino": "👤 Ex-Inquilino",
};

const styles: Record<Status, string> = {
  pago: "bg-green-500 text-white",
  caucao: "bg-amber-400 text-amber-900",
  pendente: "bg-gray-200 text-gray-700",
  atrasado: "bg-red-500 text-white",
  vencendo: "bg-purple-500 text-white",
  ativo: "bg-blue-500 text-white",
  encerrado: "bg-red-100 text-red-700 border border-red-300",
  vencido: "bg-red-100 text-red-700 border border-red-300",
  "ex-inquilino": "bg-slate-400 text-white",
};

export default function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const s = (status as Status) ?? "pendente";
  const label = labels[s] ?? status;
  const style = styles[s] ?? "bg-gray-200 text-gray-600";
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${style} ${
        size === "sm" ? "text-xs px-2.5 py-0.5" : "text-sm px-3 py-1"
      }`}
    >
      {label}
    </span>
  );
}
