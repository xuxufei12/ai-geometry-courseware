const assert=require('node:assert/strict'),{parse}=require('../src/numeric-input.js');
const cases=[['1/3',1/3],['2√3',2*Math.sqrt(3)],['√(2+3)',Math.sqrt(5)],['sqrt(2)/2',Math.sqrt(2)/2],['根号下2',Math.sqrt(2)],['2根号(3+1)',4],['（１＋２）÷３',1],['π/6',Math.PI/6],['2pi',2*Math.PI],['2(3+4)',14],['(1/2)(2+3)',2.5],['-2^2',-4],['2^3^2',512],['2^-2',.25],['1e-3',.001],['√2+1/3',Math.sqrt(2)+1/3],['3²+2³',17]];
for(const [s,want]of cases)assert(Math.abs(parse(s)-want)<1e-12,s);
assert(Math.abs(parse('π/6 rad','°')-30)<1e-12);assert.equal(parse('90°','°'),90);assert.equal(parse('60度','°'),60);
for(const s of ['', '1/0','sqrt(-2)','√(-1)','Infinity','∞','NaN','1e999','2+','(2+3','2..3','2 3','abc','Math.sqrt(2)','alert(1)','globalThis','1;2','2**3','<script>','('.repeat(60)+'2'+')'.repeat(60)])assert.throws(()=>parse(s),undefined,s);
assert.throws(()=>parse('π rad'));assert.throws(()=>parse('90°'));
console.log('Numeric input: fractions, roots, pi, powers, units and invalid expressions passed.');
