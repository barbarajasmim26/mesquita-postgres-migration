import { gerarMeses2026 } from './db.ts';

const result = await gerarMeses2026();
console.log('Meses 2026 gerados com sucesso:', result);
process.exit(0);
