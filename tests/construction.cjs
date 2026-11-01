const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/construction-lessons.js','utf8')+';globalThis.lessons=ConstructionLessons;',ctx);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),dist=(a,b)=>Math.hypot(...sub(a,b)),close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let configurations=0,actions=0;
for(const id of ctx.lessons.ids)for(const independent of [false,true])for(let n=0;n<=100;n++){
 const initial=ctx.lessons.make(id,independent),p=initial.parameter,L=ctx.lessons.make(id,independent,p[1]+(p[2]-p[1])*n/100),points={...L.points};
 for(const step of L.steps){if(step.type==='question'){assert(step.why.length===step.options.length);assert(step.answer>=0&&step.answer<step.options.length);continue}for(const name of step.picks)assert(points[name],`${id}: missing point ${name}`);const result=step.result;for(const coord of Object.values(result.points||{}))assert(coord.every(Number.isFinite));
  const picked=step.picks.map(n=>points[n]),created=Object.values(result.points||{});
  if(step.tool==='midpoint')close(dist(picked[0],created[0]),dist(picked[1],created[0]));
  if(step.tool==='extend'){close(dist(picked[0],picked[1]),dist(picked[1],created[0]));const u=sub(picked[1],picked[0]),v=sub(created[0],picked[1]);close(dot(u,v),dot(u,u))}
  if(step.tool==='perp'){const u=sub(picked[1],picked[2]),v=sub(created[0],picked[0]);close(dot(u,v),0);const w=sub(created[0],picked[1]);close(u[0]*w[1]-u[1]*w[0],0)}
  if(step.tool==='intersect'){for(const [a,b]of [[picked[0],picked[1]],[picked[2],picked[3]]]){const u=sub(b,a),v=sub(created[0],a);close(u[0]*v[1]-u[1]*v[0],0)}}
  if(step.tool==='reflect'){const [a,u,v]=picked,ap=created[0],axis=sub(v,u),m=a.map((x,i)=>(x+ap[i])/2);close(dot(sub(ap,a),axis),0);const um=sub(m,u);close(um[0]*axis[1]-um[1]*axis[0],0)}
  if(step.tool==='circleMeet'){close(dist(created[0],picked[0]),2);close(dist(created[0],picked[1]),2)}
  if(step.tool==='lineCircle')for(const c of created)close(dist(c,[0,0]),Math.sqrt(116));
  Object.assign(points,result.points);for(const pair of result.lines||[])for(const name of pair)assert(points[name]);actions++;
 }
 if(id==='median'){close(dist(points.B,points.E),dist(points.A,points.C));const ad=dist(points.A,points.D),ab=dist(points.A,points.B),ac=dist(points.A,points.C);assert(ad>(ab-ac)/2&&ad<(ab+ac)/2)}
 if(id==='rectangle')close(dist(points.G,points.F)/10,dist(points.A,points.K)/8);
 if(id==='power')close(dist(points.P,points.A)*dist(points.P,points.B),80);
 if(id==='reflection'){close(dist(points.A,points.E),dist(points['A′'],points.E));close(dist(points.A,points.T)+dist(points.T,points.H),2*Math.SQRT2)}
 if(id==='circle-distance'){close(dist(points.C,points.M),dist(points.A,points.M));const h=L.parameter[3],s=dist(points.A,points.M);close(dist(points.O,points.C)**2,16-Math.sqrt(3)*h*s);assert(dist(points.O,points.C)>=2*Math.sqrt(3)-2-1e-8)}
 configurations++;
}
console.log(`Construction math passed: ${configurations} configurations, ${actions} actions, midpoint / extension / perpendicular / reflection / intersections / invariants.`);
