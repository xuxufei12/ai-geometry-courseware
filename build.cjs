const fs=require('node:fs'),path=require('node:path');
const katex=require('katex');
const lessons=require('./src/lessons.cjs');
const render=s=>s.replace(/\\\[([\s\S]*?)\\\]/g,(_,tex)=>katex.renderToString(tex.replaceAll('′',"'"),{displayMode:true,throwOnError:true})).replace(/\\\(([\s\S]*?)\\\)/g,(_,tex)=>katex.renderToString(tex.replaceAll('′',"'"),{throwOnError:true}));
function walk(v){if(typeof v==='string')return render(v);if(Array.isArray(v))return v.map(walk);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x)]));return v}
const old=fs.readFileSync(path.join(__dirname,'dist/circle-distance.html'),'utf8');const css=old.match(/<style id="offline-math-fonts">([\s\S]*?)<\/style>/)?.[1];if(!css)throw Error('Missing embedded math fonts');
const html=fs.readFileSync(path.join(__dirname,'src/index.template.html'),'utf8').replace('/*MATH_CSS*/',()=>css).replace('/*APP_CSS*/',()=>fs.readFileSync(path.join(__dirname,'src/style.css'),'utf8')).replace('/*LESSONS*/',()=>JSON.stringify(walk(lessons))).replace('/*APP_JS*/',()=>fs.readFileSync(path.join(__dirname,'src/app.js'),'utf8'));
fs.writeFileSync(path.join(__dirname,'dist/index.html'),html);console.log('Built 5 topic experiments + original lesson:',html.length,'characters');

const chapters=require('./src/chapters-data.json'),presets=require('./src/method-presets.cjs'),excerpts=require('./src/source-excerpts.json');
for(const c of chapters){if(!presets[c.method]||!excerpts[c.id])throw Error('Incomplete chapter '+c.id)}
const replacements={'/*MATH_CSS*/':css,'/*CHAPTER_CSS*/':fs.readFileSync('src/chapters.css','utf8'),'/*CHAPTER_DATA*/':JSON.stringify(walk(chapters)),'/*PRESETS*/':JSON.stringify(walk(presets)),'/*EXCERPTS*/':JSON.stringify(excerpts).replaceAll('</script','<\\/script'),'/*GEOMETRY*/':fs.readFileSync('src/method-geometry.js','utf8'),'/*CHAPTER_JS*/':fs.readFileSync('src/chapters-app.js','utf8')};
let chapterHtml=fs.readFileSync('src/chapters.template.html','utf8');for(const [key,value] of Object.entries(replacements))chapterHtml=chapterHtml.replace(key,()=>value);
fs.writeFileSync('dist/chapters.html',chapterHtml);console.log('Built',chapters.length,'chapter experiments');

fs.cpSync(path.join(__dirname,'dist'),path.join(__dirname,'docs'),{recursive:true});

