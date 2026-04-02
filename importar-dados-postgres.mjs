#!/usr/bin/env node
/**
 * Script para importar dados do dados_exportados.json para PostgreSQL
 * Uso: node importar-dados-postgres.mjs
 * 
 * Requer DATABASE_URL configurada como variável de ambiente
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ler arquivo de dados
const dataPath = path.join(__dirname, '../upload/dados_exportados.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

console.log('📦 Dados carregados:', {
  propriedades: data.propriedades?.length || 0,
  contratos: data.contratos?.length || 0,
  pagamentos: data.pagamentos?.length || 0,
});

// Conectar ao banco PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está configurada');
  process.exit(1);
}

const dbUrl = new URL(DATABASE_URL);
dbUrl.searchParams.set('sslmode', 'require');

const sql = postgres(dbUrl.toString());

async function importarDados() {
  try {
    console.log('\n🔄 Iniciando importação...\n');

    // Limpar tabelas existentes (ordem inversa de dependência)
    console.log('🗑️  Limpando tabelas existentes...');
    await sql`TRUNCATE TABLE pagamentos CASCADE`;
    await sql`TRUNCATE TABLE contratos CASCADE`;
    await sql`TRUNCATE TABLE propriedades CASCADE`;
    console.log('✅ Tabelas limpas\n');

    // Importar propriedades
    console.log('📍 Importando propriedades...');
    for (const prop of data.propriedades) {
      await sql`
        INSERT INTO propriedades (id, nome, endereco, cidade, "createdAt", "updatedAt")
        VALUES (${prop.id}, ${prop.nome}, ${prop.endereco}, ${prop.cidade}, ${new Date(prop.createdAt)}, ${new Date(prop.updatedAt)})
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          endereco = EXCLUDED.endereco,
          cidade = EXCLUDED.cidade,
          "updatedAt" = EXCLUDED."updatedAt"
      `;
    }
    console.log(`✅ ${data.propriedades.length} propriedades importadas\n`);

    // Importar contratos
    console.log('📋 Importando contratos...');
    for (const contrato of data.contratos) {
      await sql`
        INSERT INTO contratos (
          id, "propriedadeId", casa, "nomeInquilino", "dataEntrada", "dataSaida",
          caucao, aluguel, "diaPagamento", status, telefone, observacoes,
          "createdAt", "updatedAt"
        )
        VALUES (
          ${contrato.id},
          ${contrato.propriedadeId},
          ${contrato.casa},
          ${contrato.nomeInquilino},
          ${contrato.dataEntrada ? new Date(contrato.dataEntrada) : null},
          ${contrato.dataSaida ? new Date(contrato.dataSaida) : null},
          ${contrato.caucao ? parseFloat(contrato.caucao) : null},
          ${parseFloat(contrato.aluguel)},
          ${contrato.diaPagamento},
          ${contrato.status},
          ${contrato.telefone},
          ${contrato.observacoes},
          ${new Date(contrato.createdAt)},
          ${new Date(contrato.updatedAt)}
        )
        ON CONFLICT (id) DO UPDATE SET
          "propriedadeId" = EXCLUDED."propriedadeId",
          casa = EXCLUDED.casa,
          "nomeInquilino" = EXCLUDED."nomeInquilino",
          "dataEntrada" = EXCLUDED."dataEntrada",
          "dataSaida" = EXCLUDED."dataSaida",
          caucao = EXCLUDED.caucao,
          aluguel = EXCLUDED.aluguel,
          "diaPagamento" = EXCLUDED."diaPagamento",
          status = EXCLUDED.status,
          telefone = EXCLUDED.telefone,
          observacoes = EXCLUDED.observacoes,
          "updatedAt" = EXCLUDED."updatedAt"
      `;
    }
    console.log(`✅ ${data.contratos.length} contratos importados\n`);

    // Importar pagamentos
    console.log('💰 Importando pagamentos...');
    for (const pagamento of data.pagamentos) {
      await sql`
        INSERT INTO pagamentos (
          id, "contratoId", ano, mes, status, "valorPago", "dataPagamento",
          observacao, "createdAt", "updatedAt"
        )
        VALUES (
          ${pagamento.id},
          ${pagamento.contratoId},
          ${pagamento.ano},
          ${pagamento.mes},
          ${pagamento.status},
          ${pagamento.valorPago ? parseFloat(pagamento.valorPago) : null},
          ${pagamento.dataPagamento ? new Date(pagamento.dataPagamento) : null},
          ${pagamento.observacao},
          ${new Date(pagamento.createdAt)},
          ${new Date(pagamento.updatedAt)}
        )
        ON CONFLICT (id) DO UPDATE SET
          "contratoId" = EXCLUDED."contratoId",
          ano = EXCLUDED.ano,
          mes = EXCLUDED.mes,
          status = EXCLUDED.status,
          "valorPago" = EXCLUDED."valorPago",
          "dataPagamento" = EXCLUDED."dataPagamento",
          observacao = EXCLUDED.observacao,
          "updatedAt" = EXCLUDED."updatedAt"
      `;
    }
    console.log(`✅ ${data.pagamentos.length} pagamentos importados\n`);

    // Resetar sequences para evitar conflitos de ID
    console.log('🔢 Resetando sequences...');
    await sql`SELECT setval('propriedades_id_seq', (SELECT MAX(id) FROM propriedades) + 1)`;
    await sql`SELECT setval('contratos_id_seq', (SELECT MAX(id) FROM contratos) + 1)`;
    await sql`SELECT setval('pagamentos_id_seq', (SELECT MAX(id) FROM pagamentos) + 1)`;
    console.log('✅ Sequences resetadas\n');

    // Verificar dados importados
    const statsPropriedades = await sql`SELECT COUNT(*) as count FROM propriedades`;
    const statsContratos = await sql`SELECT COUNT(*) as count FROM contratos`;
    const statsPagamentos = await sql`SELECT COUNT(*) as count FROM pagamentos`;

    console.log('📊 Resumo da importação:');
    console.log(`   ✅ Propriedades: ${statsPropriedades[0].count}`);
    console.log(`   ✅ Contratos: ${statsContratos[0].count}`);
    console.log(`   ✅ Pagamentos: ${statsPagamentos[0].count}`);

    console.log('\n✨ Importação concluída com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro durante importação:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Executar importação
importarDados();
