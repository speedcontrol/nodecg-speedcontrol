const { compileFromFile } = require('json-schema-to-typescript');
const fs = require('fs');

console.log('configschema');
compileFromFile('./configschema.json').then(ts => fs.writeFileSync('./configschema.d.ts', ts));

const files = fs.readdirSync('./schemas');
const filesProcessed = [];

files.forEach((file) => {
  if (file.match('.json$', 'i')) {
    file = file.replace(/.json$/, '');
    console.log(file);
    filesProcessed.push(file);
    compileFromFile(`./schemas/${file}.json`).then(ts => fs.writeFileSync(`./schemas/${file}.d.ts`, ts));
  }
});

let index = [];
filesProcessed.forEach((file) => {
  index.push(`export * from './${file}';`);
});

fs.writeFileSync('./schemas/index.d.ts', `${index.join('\n')}\n`);
