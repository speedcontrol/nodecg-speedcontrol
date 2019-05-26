const { compileFromFile } = require('json-schema-to-typescript');
const fs = require('fs');

process.chdir('./schemas');
const files = fs.readdirSync(process.cwd());
const filesProcessed = [];

files.forEach((file) => {
  if (file.match('.json$', 'i')) {
    file = file.replace(/.json$/, '');
    console.log(file);
    filesProcessed.push(file);
    compileFromFile(`${file}.json`).then(ts => fs.writeFileSync(`${file}.d.ts`, ts));
  }
});

let index = [];
filesProcessed.forEach((file) => {
  index.push(`export * from './${file}';`);
});

fs.writeFileSync('index.d.ts', `${index.join('\n')}\n`);
