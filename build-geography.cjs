const fs=require('node:fs');
const path=require('node:path');
const esbuild=require('esbuild');
const root=__dirname;
const result=esbuild.buildSync({entryPoints:[path.join(root,'src/geography/app.js')],bundle:true,write:false,minify:true,format:'iife',target:['es2020'],loader:{'.jpg':'dataurl'},legalComments:'inline'});
const css=['style.css','book-intro.css'].map(file=>fs.readFileSync(path.join(root,'src/geography',file),'utf8')).join('\n');
const html=fs.readFileSync(path.join(root,'src/geography/index.html'),'utf8').replace('/*STYLE*/',()=>css).replace('/*APP*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
for(const dir of ['dist','docs']){fs.mkdirSync(path.join(root,dir),{recursive:true});fs.writeFileSync(path.join(root,dir,'geography.html'),html);}
console.log('Built 10 geography experiments: '+(Buffer.byteLength(html)/1024/1024).toFixed(2)+' MB, standalone and offline.');
