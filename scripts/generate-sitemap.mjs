import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = process.argv[2]?.replace(/\/$/, '');
if (!origin || !/^https:\/\/[^/]+$/i.test(origin) || origin.includes('.example')) {
  console.error('Uso: npm run sitemap -- https://dominio-real.com.br');
  process.exit(1);
}
const root = resolve(import.meta.dirname, '..');
const pages = [
  ['/', 'index.html'],
  ['/calculadoras/lucro', 'calculadoras/lucro.html'],
  ['/calculadoras/preco-de-venda', 'calculadoras/preco-de-venda.html'],
  ['/calculadoras/margem-de-lucro', 'calculadoras/margem-de-lucro.html'],
  ['/calculadoras/porcentagem', 'calculadoras/porcentagem.html'],
  ['/calculadoras/desconto', 'calculadoras/desconto.html'],
  ['/calculadoras/juros-compostos', 'calculadoras/juros-compostos.html'],
  ['/calculadoras/rendimento-investimentos', 'calculadoras/rendimento-investimentos.html'],
  ['/calculadoras/financiamento', 'calculadoras/financiamento.html'],
  ['/sobre', 'sobre.html'], ['/contato', 'contato.html'], ['/privacidade', 'privacidade.html'], ['/termos', 'termos.html']
];
const paths = pages.map(([route]) => route);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(resolve(root, 'sitemap.xml'), xml);
await writeFile(resolve(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
for (const [path, source] of pages) {
  const file = resolve(root, source);
  const html = await readFile(file, 'utf8');
  await writeFile(file, html.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${origin}${path}">`));
}
console.log(`Sitemap, robots.txt e URLs canônicas atualizados para ${origin}.`);
