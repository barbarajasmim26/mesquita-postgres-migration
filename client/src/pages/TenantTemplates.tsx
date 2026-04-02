import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function TenantTemplates() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Inquilinos</h1>
          <p className="text-gray-600 mt-1">
            Salve dados de inquilinos para reutilizar em recibos
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Novo Template
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum template salvo
          </h3>
          <p className="text-gray-600 mb-6">
            Crie templates de inquilinos para facilitar o preenchimento de recibos
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Criar Primeiro Template
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <p>
            1. Clique em "Novo Template" para salvar os dados de um inquilino
          </p>
          <p>
            2. Preencha o nome completo, CPF, RG, endereço e outros dados
          </p>
          <p>
            3. Ao gerar um recibo, você poderá selecionar um template para preencher automaticamente
          </p>
          <p>
            4. Você também pode fazer upload de documentos (RG, CPF, contrato) para cada template
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
