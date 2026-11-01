const assert=require('node:assert/strict');
const esbuild=require('esbuild');
const vm=require('node:vm');
function load(file){const code=esbuild.buildSync({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text;const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,require,console});return module.exports;}
const {solar,values,metrics}=load('src/geography/models.js');
const {lessons,initial}=load('src/geography/lessons.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
near(solar({day:80,tilt:23.5,lat:40}).altitude,50);
near(solar({day:80,tilt:23.5,lat:40}).daylight,12);
for(let day=1;day<=365;day+=7){for(let lat=-80;lat<=80;lat+=10){const a=solar({day,lat,tilt:23.5}),b=solar({day,lat:-lat,tilt:23.5});near(a.daylight+b.daylight,24);near(solar({day,lat,tilt:0}).daylight,12);assert.ok(a.daylight>=0&&a.daylight<=24);}}
assert.equal(solar({day:172,lat:75,tilt:23.5}).daylight,24);assert.equal(solar({day:355,lat:75,tilt:23.5}).daylight,0);
const shadow={day:80,lat:45,tilt:23.5,height:20,gap:25};near(values('shadow',shadow).shadow,20);near(values('shadow',{...shadow,height:40}).shadow,40);
assert.ok(values('breeze',{hour:14,contrast:8}).delta>0);assert.ok(values('breeze',{hour:2,contrast:8}).delta<0);near(values('breeze',{hour:14,contrast:0}).strength,0);
for(let rain=10;rain<=120;rain+=10)for(let paving=0;paving<=100;paving+=10)for(let green=0;green<=100;green+=20){const w=values('water',{rain,paving,green});near(w.evap+w.infiltration+w.runoff,rain);near(w.detention+w.outlet,w.runoff);for(const n of Object.values(w))assert.ok(n>=0);}
assert.ok(values('water',{rain:60,paving:90,green:0}).runoff>values('water',{rain:60,paving:10,green:0}).runoff);
for(let inflow=20;inflow<=120;inflow+=10)for(let release=10;release<=120;release+=10)for(let allocation=0;allocation<=90;allocation+=10){const b=values('basin',{inflow,release,allocation});near(b.release+b.storage,inflow);near(b.irrigation+b.downstream,b.release);assert.ok(b.storage>=-40);assert.ok(b.release<=inflow+40);}
assert.equal(values('front',{type:0,position:1,moisture:0}).rain,0);assert.equal(values('front',{type:0,position:1,moisture:80}).temp,9);assert.equal(values('front',{type:1,position:1,moisture:80}).temp,24);
assert.equal(lessons.length,10);assert.equal(new Set(lessons.map(l=>l.id)).size,10);
for(const l of lessons){assert.equal(metrics(l.id,initial(l)).length,3);assert.ok(l.principle.length>=3&&l.tasks.length>=2&&l.boundary.length>20);for(const c of l.controls){const extremes=c.options?c.options.map((_,i)=>i):[c.min,c.max];for(const extreme of extremes){const s={...initial(l),[c.key]:extreme};for(const m of metrics(l.id,s))assert.ok(!/NaN|Infinity/.test(String(m.value)),`${l.id}: ${c.key}`);}}}
console.log('PASS geography: solar symmetry, equinox, polar day/night, shadows, sea breeze, water mass balance, reservoir constraints, 10 lesson model bounds.');
