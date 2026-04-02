# Project TODO - Mesquita Imóveis v2

## Funcionalidades Principais

### Ex-Inquilinos
- [x] Criar tabela `former_tenants` no banco de dados
- [x] Implementar procedure tRPC para mover inquilino para ex-inquilinos
- [x] Implementar procedure tRPC para listar ex-inquilinos
- [x] Implementar procedure tRPC para restaurar ex-inquilino para ativo
- [x] Criar página de gestão de ex-inquilinos
- [ ] Adicionar botão "Mover para Ex-Inquilinos" nos contratos ativos
- [ ] Implementar confirmação de ação antes de mover

### Templates de Inquilinos
- [x] Criar tabela `tenant_templates` no banco de dados
- [x] Implementar procedure tRPC para salvar template de inquilino
- [x] Implementar procedure tRPC para listar templates
- [x] Implementar procedure tRPC para buscar template por nome ou CPF
- [x] Implementar procedure tRPC para deletar template
- [ ] Criar interface de salvamento de templates no recibo
- [ ] Implementar busca rápida de templates no preenchimento de recibos

### Gestão de Documentos
- [x] Criar tabela `tenant_documents` no banco de dados
- [ ] Implementar upload de documentos para S3
- [x] Implementar procedure tRPC para fazer upload de documento
- [x] Implementar procedure tRPC para listar documentos de um template
- [x] Implementar procedure tRPC para deletar documento
- [ ] Criar interface de upload de documentos na página de templates
- [ ] Implementar visualização/download de documentos

### Meses Vencidos Disponíveis
- [x] Ajustar lógica de geração de meses para incluir períodos vencidos
- [x] Permitir visualização de meses vencidos mas ainda ocupados
- [ ] Implementar filtro para mostrar meses vencidos

### Testes e Validação
- [x] Criar testes unitários para procedures de ex-inquilinos
- [x] Criar testes unitários para procedures de templates
- [ ] Criar testes unitários para procedures de documentos
- [ ] Testar fluxo completo de salvamento e recuperação de templates
- [ ] Testar upload e download de documentos

### Exportação e Entrega
- [x] Preparar código-fonte para exportação
- [x] Criar script de exportação em ZIP
- [x] Implementar Dashboard com navegação
- [x] Integrar AppLayout com sidebar
- [x] Testar todas as funcionalidades
- [ ] Testar funcionamento do sistema exportado
- [ ] Documentar instruções de instalação e uso

### Ajustes Solicitados
- [ ] Permitir marcar meses como pago/pendente/atrasado mesmo em contratos vencidos
- [ ] Manter meses vencidos visíveis na interface para verificação de renovação
- [ ] Adicionar flag "isOccupied" para rastrear se inquilino ainda está no imóvel
