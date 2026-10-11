# CalculaNegócio

Site estático brasileiro com calculadoras gratuitas para pequenos empreendedores, vendedores e autônomos. Não usa framework, banco de dados, fonte externa, API paga, analytics ou publicidade.

## Recursos

- Calculadoras de lucro, preço de venda, margem, porcentagem e desconto.
- Validação de entradas, proteção contra divisão por zero e arredondamento monetário.
- Resultados em formato brasileiro, fórmula aplicada e compartilhamento nativo ou por cópia.
- Páginas institucionais, página 404, `robots.txt`, `sitemap.xml` e cabeçalhos de segurança.
- Layout responsivo, navegação por teclado, foco visível, região viva para resultados e contraste alto.
- Testes das regras matemáticas e verificador de páginas, links e metadados.

## Pré-requisitos

Node.js 20 ou mais recente. Não é necessário instalar dependências.

## Abrir a prévia local

```bash
npm run dev
```

Abra `http://localhost:8080`. Para usar outra porta no PowerShell:

```powershell
$env:PORT=3000; npm run dev
```

Abrir os HTMLs diretamente com `file://` não é recomendado, pois os caminhos absolutos dos assets simulam a raiz de um site publicado.

## Testar

```bash
npm test
npm run check
```

`npm test` testa todos os cálculos. `npm run check` também percorre os HTMLs, confere links locais, títulos e descrições únicos, requisitos básicos de acessibilidade/SEO e presença de breakpoint responsivo.

## Configurar o domínio antes da publicação

O projeto não inventa um domínio. Por isso, o `sitemap.xml` inicial contém caminhos relativos e o `robots.txt` ainda não anuncia o sitemap. Assim que houver um domínio real, execute:

```bash
npm run sitemap -- https://dominio-real.com.br
```

O comando exige HTTPS, rejeita domínios `.example` e atualiza o sitemap, `robots.txt` e as URLs canônicas. Revise também o canal oficial em `contato.html` e a identificação do provedor em `privacidade.html`.

## Publicar no Cloudflare Pages

Não é necessário processo de build:

1. Envie o repositório para o provedor Git de sua preferência.
2. No Cloudflare Pages, conecte o repositório.
3. Em **Build command**, informe `exit 0`.
4. Em **Build output directory**, informe `.`.
5. Antes da publicação definitiva, configure o domínio real conforme a seção anterior.

O arquivo `_headers` define cabeçalhos básicos de segurança e cache de assets. Nenhum deploy é realizado por este projeto.

## Estrutura

```text
calculadoras/          páginas independentes das ferramentas
assets/css/            identidade visual e responsividade
assets/js/             cálculos puros e comportamento da interface
scripts/               servidor local, auditoria e gerador de sitemap
test/                  testes automatizados
*.html                 páginas inicial, institucionais e 404
```

## AdSense e serviços futuros

Não há IDs, scripts, espaços vazios de anúncio nem promessa de aprovação. Se publicidade ou analytics forem adicionados futuramente, revise desempenho, consentimento aplicável, Política de Privacidade e Termos de Uso antes de ativar qualquer script.
