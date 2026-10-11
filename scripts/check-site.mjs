import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => entry.isDirectory() ? walk(resolve(dir, entry.name)) : [resolve(dir, entry.name)]))).flat();
}
const files = await walk(root);
const htmlFiles = files.filter(file => file.endsWith('.html'));
const failures = [];
const titles = new Map();
const descriptions = new Map();

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const name = relative(root, file);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  if (!title) failures.push(`${name}: sem title`);
  if (!description) failures.push(`${name}: sem meta description`);
  if (!/<meta name="viewport"/i.test(html)) failures.push(`${name}: sem viewport`);
  if (!/<link rel="icon" href="\/assets\/icons\/favicon\.svg" type="image\/svg\+xml">/i.test(html)) failures.push(`${name}: sem favicon SVG`);
  if (!/<html lang="pt-BR"/i.test(html)) failures.push(`${name}: idioma ausente`);
  if (!/<h1[ >]/i.test(html)) failures.push(`${name}: sem h1`);
  if (name === '404.html' && !/<meta name="robots" content="noindex"/i.test(html)) failures.push('404.html: sem noindex');
  if (name !== '404.html' && !/<link rel="canonical" href="[^"]+"/i.test(html)) failures.push(`${name}: sem canonical`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  for (const id of new Set(ids)) if (ids.filter(value => value === id).length > 1) failures.push(`${name}: id duplicado #${id}`);
  for (const match of html.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"[^>]*>/gi)) {
    if (!new RegExp(`<label[^>]+for="${match[1]}"`, 'i').test(html)) failures.push(`${name}: campo #${match[1]} sem label`);
  }
  if (/<button[^>]+class="nav-toggle"/i.test(html) && !/aria-controls="menu-principal"/i.test(html)) failures.push(`${name}: menu móvel sem aria-controls`);
  if (name.startsWith('calculadoras') && !/<section class="faq"/i.test(html)) failures.push(`${name}: sem perguntas frequentes`);
  if (name.startsWith('calculadoras') && !/<ol class="steps"/i.test(html)) failures.push(`${name}: sem instruções de uso`);
  if (title) titles.set(title, [...(titles.get(title) || []), name]);
  if (description) descriptions.set(description, [...(descriptions.get(description) || []), name]);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
    const url = match[1].split(/[?#]/)[0];
    if (url === '/') continue;
    const target = resolve(root, url.slice(1));
    try { await access(target); } catch {
      try { await access(`${target}.html`); } catch { failures.push(`${name}: link quebrado ${url}`); }
    }
  }
}
for (const [title, owners] of titles) if (owners.length > 1) failures.push(`title duplicado “${title}”: ${owners.join(', ')}`);
for (const [description, owners] of descriptions) if (owners.length > 1) failures.push(`description duplicada: ${owners.join(', ')}`);
const homepage = await readFile(resolve(root, 'index.html'), 'utf8');
if (!/id="busca-calculadoras"/.test(homepage)) failures.push('index.html: busca de calculadoras ausente');
if ([...homepage.matchAll(/class="tool-entry"/g)].length !== 8) failures.push('index.html: o diretório deve listar exatamente 8 calculadoras');
for (const required of ['robots.txt', 'sitemap.xml', '404.html', 'assets/css/style.css']) {
  try { await access(resolve(root, required)); } catch { failures.push(`arquivo obrigatório ausente: ${required}`); }
}
const css = await readFile(resolve(root, 'assets/css/style.css'), 'utf8');
if (!/@media\s*\(max-width:/i.test(css)) failures.push('CSS sem breakpoint responsivo');
if (!/:focus/.test(css)) failures.push('CSS sem estilo de foco');
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
for (const file of htmlFiles.filter(file => !file.endsWith('404.html'))) {
  const route = file.endsWith('index.html') ? '/' : `/${relative(root, file).replaceAll('\\', '/').replace(/\.html$/, '')}`;
  if (!sitemap.includes(`<loc>${route}</loc>`)) failures.push(`${relative(root, file)}: ausente do sitemap`);
}

if (failures.length) {
  console.error(`Falharam ${failures.length} verificações:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else console.log(`Site verificado: ${htmlFiles.length} páginas, links internos, SEO básico, foco e breakpoint responsivo.`);
