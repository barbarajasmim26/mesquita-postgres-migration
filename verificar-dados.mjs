import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL não encontrado');
  process.exit(1);
}

const url = new URL(dbUrl);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  ssl: {
    rejectUnauthorized: false,
  },
});

// Verificar dados dos contratos
const [contratos] = await connection.query(`
  SELECT 
    c.id,
    c.nomeInquilino,
    c.casa,
    c.dataEntrada,
    c.dataSaida,
    c.caucao,
    c.aluguel,
    c.diaPagamento,
    c.telefone,
    c.observacoes,
    p.endereco,
    p.cidade
  FROM contratos c
  LEFT JOIN propriedades p ON c.propriedadeId = p.id
  LIMIT 5
`);

console.log('Amostra de contratos:');
console.log(JSON.stringify(contratos, null, 2));

// Contar total de contratos
const [countResult] = await connection.query('SELECT COUNT(*) as total FROM contratos');
console.log('\nTotal de contratos:', countResult[0].total);

// Verificar se há dados em outras tabelas
const [pagamentosCount] = await connection.query('SELECT COUNT(*) as total FROM pagamentos');
console.log('Total de pagamentos:', pagamentosCount[0].total);

await connection.end();
