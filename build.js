// Splits portfolio.html (the single-file version used for the Claude preview link)
// into a standard website: index.html + style.css + script.js.
// Run with:  node build.js
const fs = require('fs');
const src = fs.readFileSync('portfolio.html', 'utf8');

const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, 'Portfolio'])[1].trim();
const fontLinks = (src.match(/<link[^>]+>/g) || []).join('\n  ');
const css = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const scripts = [...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const inlineJs = scripts.filter(m => !/src=/.test(m[0])).map(m => m[1]).join('\n');

const bodyStart = src.indexOf('</style>') + '</style>'.length;
const bodyEnd = src.search(/<script(?:\s[^>]*)?>/);
const body = src.slice(bodyStart, bodyEnd).trim();

const reset = `/* Base reset */
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; }
img { max-width: 100%; }
[hidden] { display: none !important; }
`;

fs.writeFileSync('style.css', reset + css.trim() + '\n');
fs.writeFileSync('script.js', inlineJs.trim() + '\n');
fs.writeFileSync('index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="Portfolio of Prashamsha S: projects, skills, learning and experience, set in a painted Mt Fuji and sakura world.">
  ${fontLinks}
  <link rel="stylesheet" href="style.css">
</head>
<body>
${body}

<script src="script.js"></script>
</body>
</html>
`);
console.log('Built index.html, style.css and script.js');
