const { compileFromFile } = require('json-schema-to-typescript');
const fs = require('fs');

try {
  compileFromFile('./configschema.json').then(ts => fs.writeFileSync('./configschema.d.ts', ts));
  console.log('configschema');
} catch (err) {
  console.log('no configschema');
}

try {
  const files = fs.readdirSync('./schemas');
  const filesProcessed = [];

  files.forEach((file) => {
    if (file.match('.json$', 'i')) {
      const fileName = file.replace(/.json$/, '');
      console.log(fileName);
      filesProcessed.push(fileName);
      compileFromFile(`./schemas/${fileName}.json`).then(ts => fs.writeFileSync(`./schemas/${fileName}.d.ts`, ts));
    }
  });

  const index = [];
  filesProcessed.forEach((file) => {
    index.push(`export * from './${file}';`);
  });

  fs.writeFileSync('./schemas/index.d.ts', `${index.join('\n')}\n`);
} catch (err) {
  console.log('no schemas');
}
