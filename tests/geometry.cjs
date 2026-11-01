const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8').split('function draw()')[0];const context={};vm.createContext(context);vm.runInContext(source+'\nglobalThis.geometry=sceneFor;',context);const g=context.geometry;
for(let i=0;i<=100;i++){
  const m=g('median',[5+1.7*i],true,180);assert.ok(m.ad>2&&m.ad<6);assert.ok(Math.abs(m.be-4)<1e-8);
  const r=g('rectangle',[.2+.076*i]);assert.ok(r.area<=20+1e-8);
  const c=g('semicircle',[5+.5*i]);let area=0;for(let j=0;j<c.shade.length;j++){const a=c.shade[j],b=c.shade[(j+1)%c.shade.length];area+=a[0]*b[1]-b[0]*a[1]}assert.ok(Math.abs(Math.abs(area/2)-c.area)<.001);
  const p=g('power',[.48*i]);assert.ok(Math.abs(p.pa*p.pb-80)<1e-8);
  const f=g('reflection',[.1+.059*i,.06*i]);assert.ok(f.total>=2*Math.SQRT2-1e-8);
}
const original=g('power',[Math.acos(6/7)*180/Math.PI]);assert.ok(Math.abs(original.pa-4)<1e-8);assert.ok(Math.abs(original.ab-16)<1e-8);
assert.ok(Math.abs(g('reflection',[2*Math.SQRT2/Math.cos(Math.PI/8),2*Math.SQRT2]).total-2*Math.SQRT2)<1e-8);
for(let angle=5;angle<=175;angle+=5)for(let turn=0;turn<=180;turn+=10){const svg=g('median',[angle],true,turn).svg;for(const m of svg.matchAll(/points="([^"]+)"/g))for(const pair of m[1].split(' ')){const [x,y]=pair.split(',').map(Number);assert.ok(x>=0&&x<=640&&y>=0&&y<=460,'Rotating triangle leaves canvas')}}
console.log('Geometry checks passed: 505 positions, original data, minima, and full median rotation bounds.');
