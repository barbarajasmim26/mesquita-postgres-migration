import 'dotenv/config';
import fs from 'fs';
import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL não encontrado no arquivo .env');
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

const raw = fs.readFileSync('./database/dados_exportados.json', 'utf-8');
const data = JSON.parse(raw);

function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

await connection.query('SET FOREIGN_KEY_CHECKS=0');
await connection.query('DROP TABLE IF EXISTS arquivos_contrato');
await connection.query('DROP TABLE IF EXISTS pagamentos');
await connection.query('DROP TABLE IF EXISTS contratos');
await connection.query('DROP TABLE IF EXISTS propriedades');
await connection.query('DROP TABLE IF EXISTS users');

await connection.query(`
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openId VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    loginMethod VARCHAR(64),
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

await connection.query(`
  CREATE TABLE propriedades (
    id INT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(500) NOT NULL,
    cidade VARCHAR(100),
    createdAt TIMESTAMP NULL,
    updatedAt TIMESTAMP NULL
  )
`);

await connection.query(`
  CREATE TABLE contratos (
    id INT PRIMARY KEY,
    propriedadeId INT NOT NULL,
    casa VARCHAR(20) NOT NULL,
    nomeInquilino VARCHAR(255) NOT NULL,
    dataEntrada DATE NULL,
    dataSaida DATE NULL,
    caucao DECIMAL(10,2) NULL,
    aluguel DECIMAL(10,2) NOT NULL,
    diaPagamento INT NULL,
    status ENUM('ativo','encerrado','pendente') NOT NULL DEFAULT 'ativo',
    telefone VARCHAR(20) NULL,
    observacoes TEXT NULL,
    createdAt TIMESTAMP NULL,
    updatedAt TIMESTAMP NULL
  )
`);

await connection.query(`
  CREATE TABLE pagamentos (
    id INT PRIMARY KEY,
    contratoId INT NOT NULL,
    ano INT NOT NULL,
    mes INT NOT NULL,
    status ENUM('pago','caucao','pendente','atrasado') NOT NULL DEFAULT 'pendente',
    valorPago DECIMAL(10,2) NULL,
    dataPagamento DATE NULL,
    observacao TEXT NULL,
    createdAt TIMESTAMP NULL,
    updatedAt TIMESTAMP NULL
  )
`);

await connection.query(`
  CREATE TABLE arquivos_contrato (
    id INT PRIMARY KEY,
    contratoId INT NOT NULL,
    nomeArquivo VARCHAR(255) NOT NULL,
    urlArquivo TEXT NOT NULL,
    fileKey VARCHAR(500) NOT NULL,
    tamanho INT NULL,
    mimeType VARCHAR(100) NULL,
    createdAt TIMESTAMP NULL
  )
`);

for (const item of data.propriedades ?? []) {
  await connection.query(
    `INSERT INTO propriedades (id, nome, endereco, cidade, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.id, item.nome, item.endereco, item.cidade ?? null, toDateTime(item.createdAt), toDateTime(item.updatedAt)]
  );
}

for (const item of data.contratos ?? []) {
  await connection.query(
    `INSERT INTO contratos
     (id, propriedadeId, casa, nomeInquilino, dataEntrada, dataSaida, caucao, aluguel, diaPagamento, status, telefone, observacoes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.propriedadeId,
      item.casa,
      item.nomeInquilino,
      toDateOnly(item.dataEntrada),
      toDateOnly(item.dataSaida),
      item.caucao ?? null,
      item.aluguel,
      item.diaPagamento ?? null,
      item.status,
      item.telefone ?? null,
      item.observacoes ?? null,
      toDateTime(item.createdAt),
      toDateTime(item.updatedAt),
    ]
  );
}

for (const item of data.pagamentos ?? []) {
  await connection.query(
    `INSERT INTO pagamentos
     (id, contratoId, ano, mes, status, valorPago, dataPagamento, observacao, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.contratoId,
      item.ano,
      item.mes,
      item.status,
      item.valorPago ?? null,
      toDateOnly(item.dataPagamento),
      item.observacao ?? null,
      toDateTime(item.createdAt),
      toDateTime(item.updatedAt),
    ]
  );
}

for (const item of data.arquivosContrato ?? data.arquivos_contrato ?? []) {
  await connection.query(
    `INSERT INTO arquivos_contrato
     (id, contratoId, nomeArquivo, urlArquivo, fileKey, tamanho, mimeType, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.contratoId,
      item.nomeArquivo,
      item.urlArquivo,
      item.fileKey,
      item.tamanho ?? null,
      item.mimeType ?? null,
      toDateTime(item.createdAt),
    ]
  );
}

await connection.query('SET FOREIGN_KEY_CHECKS=1');
await connection.end();
console.log('Importação concluída com sucesso.');
