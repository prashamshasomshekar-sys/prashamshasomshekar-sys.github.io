// Splits a portfolio.html (the single-file version used for Claude preview links)
// into a standard website: index.html + style.css + script.js, in the same folder.
// Run with:  node build.js          (the painted version in this folder)
//            node build.js clean    (the clean version in the "clean" folder)
const fs = require('fs');
const path = require('path');
const dir = process.argv[2] || '.';
const at = f => path.join(dir, f);
const src = fs.readFileSync(at('portfolio.html'), 'utf8');

const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, 'Portfolio'])[1].trim();
const fontLinks = (src.match(/<link[^>]+>/g) || []).join('\n  ');
const css = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const scripts = [...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const inlineJs = scripts.filter(m => !/src=/.test(m[0])).map(m => m[1]).join('\n');

const bodyStart = src.indexOf('</style>') + '</style>'.length;
const bodyEnd = src.search(/<script(?:\s[^>]*)?>/);
const body = src.slice(bodyStart, bodyEnd).trim();

const ver = require("crypto").createHash("md5").update(css + inlineJs).digest("hex").slice(0, 8);
const reset = `/* Base reset */
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; }
img { max-width: 100%; }
[hidden] { display: none !important; }
`;

fs.writeFileSync(at('style.css'), reset + css.trim() + '\n');
fs.writeFileSync(at('script.js'), inlineJs.trim() + '\n');
fs.writeFileSync(at('index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="Portfolio of Prashamsha S: final-year B.Tech student in AI & Data Science exploring business, design and people. Projects, skills, learning and experience.">
  ${fontLinks}
  <link rel="stylesheet" href="style.css?v=${ver}">
</head>
<body>
${body}

<script src="script.js?v=${ver}"></script>
</body>
</html>
`);
console.log('Built index.html, style.css and script.js in ' + path.resolve(dir));
