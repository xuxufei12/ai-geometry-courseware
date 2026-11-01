/* Per-model construction recipes. Demo geometry and student geometry share constraints. */
const ChapterDrawing=(()=>{
const M=MethodGeometry.math,near=(a,b)=>a&&b&&M.dist(a,b)<1e-7;
const tools={line:'连接两点',midpoint:'取中点',perp:'过点作垂线',intersect:'两线交点',parallel:'平行线交点',normal:'垂线交点',rotate:'旋转与缩放',rotateAngle:'按已知角旋转',reflect:'轴对称',translate:'平移',copy:'延长并截取',cut:'在线上截取',ratio:'定比取点',circle:'以点为圆心作圆',circumcircle:'过三点作圆',arc:'取劣弧中点',circleMeet:'取两圆交点',functionPoint:'作函数上的点'};
const usage={line:'选择两个端点。',midpoint:'选择被平分线段的两个端点。',perp:'先选出发点，再选两个点确定参考直线。',intersect:'依次选择第一条直线的两点、第二条直线的两点。',parallel:'先选出发点；再选参考方向的两点；最后选要相交的直线上的两点。',normal:'先选出发点；再选垂直参考线的两点；最后选要相交的直线上的两点。',rotate:'先选被变换的点，再选旋转中心；输入有向角与长度倍数，逆时针为正。',reflect:'先选被变换的点，再选对称轴上的两点。',translate:'先选被平移的点，再选平移向量的起点和终点。',copy:'选定方向的起点、经过点，再选择要复制长度的两个端点；从经过点继续向前截取。',cut:'先选射线起点和方向点，再选择要复制长度的两个端点；从起点截取。',ratio:'选择起点与参考终点，再输入有向长度比；负号表示相反方向。',circle:'先选圆心，再选圆上的点以确定半径。',circumcircle:'依次选择圆经过的三个不共线点。',arc:'先选圆心，再选劣弧的两个端点。',circleMeet:'依次选两个圆心，本任务两圆半径均等于圆心距。',functionPoint:'选择横轴上的投影点，再输入对应的纵坐标。'};
usage.rotateAngle='先选被旋转的点和中心，再依次选参考角的三个点，中间一个是角的顶点。';
tools.angleIntersect='复制角取交点';usage.angleIntersect='先选新角的顶点和始边上的点，再选参考角的三个点，最后选交线上的两点。';
function calculate(tool,ps,values=[]){const [a,b,c,d,e]=ps,unit=v=>M.mul(v,1/M.norm(v));
 switch(tool){
 case 'line':return {lines:[[a,b]]};
 case 'midpoint':return {point:M.mid(a,b)};
 case 'perp':{const p=M.foot(a,b,c);return {point:p,lines:[[a,p]],right:[p,a,c]}}
 case 'intersect':return {point:M.meet(a,b,c,d)};
 case 'parallel':{const p=M.meet(a,M.add(a,M.sub(c,b)),d,e);return {point:p,lines:[[a,p]]}}
 case 'normal':{const v=M.sub(c,b),p=M.meet(a,M.add(a,[-v[1],v[0]]),d,e);return {point:p,lines:[[a,p]]}}
 case 'rotate':return {point:M.add(b,M.mul(M.sub(M.rot(a,b,M.rad(values[0])),b),values[1]))};
 case 'rotateAngle':return {point:M.rot(a,b,M.rad(M.angle(c,d,e)))};
 case 'reflect':return {point:M.reflect(a,b,c)};
 case 'translate':return {point:M.add(a,M.sub(c,b))};
 case 'copy':{const p=M.add(b,M.mul(unit(M.sub(b,a)),M.dist(c,d)));return {point:p,lines:[[b,p]]}}
 case 'cut':return {point:M.add(a,M.mul(unit(M.sub(b,a)),M.dist(c,d)))};
 case 'ratio':return {point:M.add(a,M.mul(M.sub(b,a),values[0]))};
 case 'circle':return {circle:{o:a,r:M.dist(a,b)}};
 case 'circumcircle':{const ab=M.mid(a,b),bc=M.mid(b,c),u=M.sub(b,a),v=M.sub(c,b),o=M.meet(ab,M.add(ab,[-u[1],u[0]]),bc,M.add(bc,[-v[1],v[0]]));return {point:o,circle:{o,r:M.dist(o,a)}}}
 case 'arc':return {point:M.add(a,M.mul(unit(M.add(unit(M.sub(b,a)),unit(M.sub(c,a)))),M.dist(a,b)))};
 case 'circleMeet':return {point:M.add(M.mid(a,b),M.mul(M.rot(M.sub(b,a),[0,0],Math.PI/2),Math.sqrt(3)/2))};
 case 'functionPoint':return {point:[a[0],values[0]],lines:[[a,[a[0],values[0]]]]};
 case 'angleIntersect':{const ray=M.add(a,M.rot(M.sub(b,a),[0,0],M.rad(M.angle(c,d,e))));return {point:M.meet(a,ray,ps[5],ps[6])}}
 default:throw Error('Unknown construction tool '+tool);
 }
}
function plan(chapter,values){const type=chapter.method,config=chapter.config||{},g=MethodGeometry.make(type,values,3,config),tasks=[],givenAux=new Set(),addPoint=(name,p,kind='base')=>{if(!g.points[name])g.points[name]={p,kind};return name},P=name=>g.points[name]?.p;
 const add=(tool,picks,gives,title,reason,nums=[])=>{const ps=picks.map(n=>{if(!P(n))throw Error(`${type}: missing reference ${n}`);return P(n)}),result=calculate(tool,ps,nums);if(result.point){if(!result.point.every(Number.isFinite))throw Error(type+': invalid point '+gives);if(P(gives)&&!near(P(gives),result.point))throw Error(`${type}: ${gives} does not match the model`);addPoint(gives,result.point,'aux')}
  const t={tool,picks,gives,title,reason,values:nums,result};tasks.push(t);return t};
 const L=(a,b,reason)=>add('line',[a,b],null,`连接 ${a}、${b}。`,reason||'把需要比较的点连接起来，让相关线段进入同一个三角形。');
 const mid=(a,b,n)=>add('midpoint',[a,b],n,`取 ${a}${b} 的中点 ${n}。`,'中点把一条线段分成相等的两段，为中线、对称或隐圆提供条件。');
 const perp=(a,b,c,n)=>add('perp',[a,b,c],n,`从 ${a} 向直线 ${b}${c} 作垂线，垂足为 ${n}。`,'垂足由点和直线共同确定。新直角可用于全等、相似、勾股或最短距离。');
 const meet=(a,b,c,d,n)=>add('intersect',[a,b,c,d],n,`取直线 ${a}${b} 与 ${c}${d} 的交点 ${n}。`,'交点同时满足两条直线的条件，需要时先延长直线。');
 const rot=(a,o,n,angle,k=1)=>add('rotate',[a,o],n,`以 ${o} 为中心，将 ${a} ${angle<0?'顺':'逆'}时针旋转 ${Math.abs(angle)}°${k===1?'':`，再按 ${k===4/3?'4/3':k} 倍缩放`}到 ${n}。`,'旋转保持夹角结构；相同的旋转与缩放把对应边搬到一起。',[angle,k]);
 const refl=(a,b,c,n)=>add('reflect',[a,b,c],n,`作 ${a} 关于直线 ${b}${c} 的对称点 ${n}。`,'先向对称轴作垂线，再在轴的另一侧截取等长距离；轴上的点到两对称点等距。');
 const ratio=(a,b,n,k,title)=>add('ratio',[a,b],n,title||`在射线 ${a}${b} 上取 ${n}，使 ${a}${n}/${a}${b}=${k}。`,'按题目给出的定比取点；位置随参考线段变化，不能凭外观随意放点。',[k]);
 const copy=(a,b,c,d,n)=>add('copy',[a,b,c,d],n,`沿 ${a}→${b} 延长，取 ${b}${n}=${c}${d}。`,'先确定延长方向，再用圆规复制指定长度；相同开口保证等长。');
 const circle=(o,a)=>add('circle',[o,a],null,`以 ${o} 为圆心、${o}${a} 为半径作圆。`,'同一个圆上的点到圆心等距；要先说明半径为什么固定。');
 const center=()=>addPoint('O',g.circles[0]?.o||[0,0]);
 const baseLine=()=>{addPoint('U',[-2,0]);addPoint('V',[9,0]);return ['U','V']};
 switch(type){
 case 'median':copy('A','D','A','D','E');L('B','E','用中点、等长截取和对顶角证明 SAS 全等，把 AC 搬成 BE。');break;
 case 'three-perp':case 'three-perp-similar':addPoint('U',[5,0]);perp('A','C','U','B');perp('E','C','U','D');break;
 case 'half-angle':copy('C','B','D','F','G');L('A','G','利用正方形的等边与直角，先把 DF 搬成 BG，再用两次全等。');break;
 case 'hand':case 'similar-hand':L('C','E','连接旋转前后对应的顶点，与 BD 比较；先看旋转中心 A 和相等夹角。');break;
 case 'equal-supplement':perp('C','O','E','G');perp('C','O','F','H');break;
 case 'parallel-midpoint':meet('D','E','A','B','F');L('E','F','沿原有 DE 延长到两直线交点，利用平行线得到等角。');L('B','F','把平行线上的线段连出，结合 BE=CE 证明全等。');break;
 case 'bisector':perp('P','O','M','D');perp('P','O','N','E');break;
 case 'bisector-normal':add('normal',['P','O','P','O','M'],'D','过 P 作 OP 的垂线，与 OM 交于 D。','垂直角平分线产生两个直角，配合相等半角构造全等。');meet('D','P','O','N','E');L('D','E');break;
 case 'bisector-parallel':add('parallel',['P','O','N','O','M'],'D','过 P 作 ON 的平行线，与 OM 交于 D。','利用平行线把一个半角搬到 P，得到等角对等边。');break;
 case 'cut-short':add('cut',['A','B','A','C'],'E','在 AB 上截取 AE=AC。','先把长度和差放在一条直线上，再连接辅助线构造全等。');L('D','E');break;
 case 'chicken':rot('D','A','E',60);L('A','E');L('D','E');L('E','C','旋转将 BD 搬成 CE，同时60°旋转给出 DE=AD。');break;
 case 'double-angle':copy('D','B','B','D','E');L('A','E');L('E','C','将倍角转化为等腰三角形中的等角关系。');break;
 case 'brahma':L('C','I');copy('C','I','C','I','P');L('C','P');L('P','E');break;
 case 'treasure':copy('D','F','D','F','G');L('D','G');L('C','G');break;
 case 'matching-angle':add('angleIntersect',['B','A','A','C','B','A','C'],'D','以 B 为顶点、BA 为始边，复制∠ACB，与 AC 交于 D。','利用题目给出的等角条件确定 D，再连接 BD；不需要预先知道 AD 的数值。');L('B','D','∠ABD=∠ACB，再结合共同直角判定相似，推出 AB²=AD·AC。');break;
 case 'similar-a':add('parallel',['D','B','C','A','C'],'E','过 D 作 BC 的平行线，与 AC 交于 E。','平行线保证两组对应角相等，构成 A 型相似。');break;
 case 'similar-eight':L('A','C','连出一组对应边，辨认交叉结构中的对顶角。');L('B','D','连出另一组对应边，按点序写相似比。');break;
 case 'reverse-eight':L('B','D');meet('A','C','B','D','X');break;
 case 'rectangle':perp('A','B','C','H');meet('A','H','G','F','K');break;
 case 'reciprocal':perp('E','B','D','F');break;
 case 'projection':perp('A','B','C','D');break;
 case 'mother':ratio('A','B','D',4/9,'在 AB 上取 D，使 AD=AC²/AB；输入 AD/AB 的值。');L('C','D');break;
 case 'cross':meet('B','D','C','E','P');L('A','C');break;
 case 'supplement':perp('C','O','D','F');perp('C','O','E','G');L('D','F');break;
 case 'double-height':perp('B','A','C','D');perp('C','A','B','E');L('A','D');break;
 case 'fold':givenAux.add('F');refl('C','A','F','C′');L('A','E','折叠把 D 搬到 E，保留 AD=AE。');L('E','C′');L('D','E');break;
 case 'angle-ratio':add('parallel',['B','A','D','A','C'],'E','过 B 作 AD 的平行线，与 CA 的延长线交于 E。','平行关系把角平分条件搬到新三角形中，形成等腰和相似。');break;
 case 'chord':perp('O','A','B','D');L('O','B','圆心连弦中点，利用垂径定理与半径构造直角三角形。');break;
 case 'semicircle':add('circleMeet',['O','O′'],'I','取两半圆范围内的交点 I。','两个半径都等于圆心距，连接后得到等边三角形。');L('O','I');L('O′','I');break;
 case 'diameter':case 'circle-trig':center();perp('C','A','B','D');L('O','C');break;
 case 'circle-sum':rot('D','B','E',-60);L('B','E');L('D','E');L('C','E');break;
 case 'tangent':case 'power':L('T','A');L('T','B');L('P','O','切线半径垂直切线，用相似联系切线长与割线乘积。');break;
 case 'circle-farthest':perp('A','B','C','D');L('A','P');ratio('A','C','Q',-.6,'在 AC 的反向延长线上取 Q，使 AQ=12/5；输入 AQ/AC 的有向比。');L('C','Q','三角形两边和的等号要求 C、A、Q 依次共线。');break;
 case 'rotation-tangent':add('rotateAngle',['D','A','B','A','C'],'E','以 A 为中心，把 D 逆时针旋转∠BAC 到 E。','先选 D、中心 A，再选 B、A、C 指定旋转角；这样 B 对应 C，D 对应 E。');L('A','E');L('C','E');L('D','E');L('O','C');break;
 case 'circle-anglebisector':center();addPoint('U',M.add(P('C'),[-P('C')[1],P('C')[0]]));L('O','C');perp('A','C','U','D');break;
 case 'circle-equilateral-values':rot('P','A','P′',-60);L('A','P′');L('P','P′');L('B','P′');break;
 case 'arc-midpoint':case 'incenter':center();add('arc',['O','B','C'],'D','取不含 A 的劣弧 BC 的中点 D。','弧中点给出等弧、等弦；再把它连向圆上的点与内心。');L('A','D');L('D','B');L('D','C');if(type==='incenter'){L('I','D');L('B','I')}break;
 case 'folded-chord':perp('M','A','B','D');L('M','A');L('M','C');break;
 case 'intersect-chords':L('A','C');L('B','D','利用同弧所对圆周角与对顶角得到相似。');break;
 case 'isosceles-diameter':mid('B','C','D');L('A','D');break;
 case 'double-tangent':L('O','P');L('T','Q');break;
 case 'tangent-perpendicular':L('T','A');L('T','B');break;
 case 'circle-projection':perp('B','A','C','D');L('D','E');L('O','D','证明切线之前先连接切点半径，把目标转成垂直关系。');break;
 case 'reflection':baseLine();refl('B','U','V','B′');L('A','B′');L('P','B′');break;
 case 'bridge':add('translate',['B','Q','P'],'B′','沿 Q→P 的方向平移 B，得到 B′。','平移消去固定的桥宽，使两段路径可以拼成一条折线。');L('A','B′');L('P','B′');break;
 case 'moving-segment':baseLine();refl('B','U','V','B₁');add('translate',['B₁','Q','P'],'B′','再沿 Q→P 平移 B₁ 到 B′。','先反射，再平移一个固定长度，替换两端的距离。');L('A','B′');L('P','B′');break;
 case 'double-reflection':addPoint('U',[6,0]);addPoint('V',M.pol(6,Math.PI/3));refl('A','O','U','A₁');refl('A','O','V','A₂');L('A₁','P');L('Q','A₂');L('A₁','A₂');break;
 case 'perpendicular-min':addPoint('U',[6,0]);addPoint('V',M.pol(6,Math.PI/8));refl('A','O','V','A′');L('O','V');L('A′','E');L('A′','F');perp('A′','O','U','H');break;
 case 'slant':perp('A','B','C','H');L('A','O');break;
 case 'quadratic':case 'vertical-height':perp('P','A','B','Q');mid('A','B','M');add('functionPoint',['M'],'V','由 y=x(6−x)，在 M 的正上方作出顶点 V；输入纵坐标。','M 的横坐标是3；代入或配方得到纵坐标9。顶点还须满足自变量范围。',[9]);break;
 case 'locus-line':case 'locus-midpoint':{addPoint('U',[-3,3]);addPoint('V',[5,3]);if(type==='locus-midpoint'){mid('A','P','Q');mid('A','U','U′');mid('A','V','V′')}else{rot('P','A','Q',60,1.4);rot('U','A','U′',60,1.4);rot('V','A','V′',60,1.4)}L('U′','V′','把原直线上的两个点按同一变换映射，确定像直线。');L('P','Q');break;}
 case 'locus-circle':addPoint('K',[3,2]);rot('P','A','Q',60,1.4);rot('K','A','K′',60,1.4);circle('K′','Q');L('P','Q');break;
 case 'weighted-perp':addPoint('T',M.add(P('B'),M.pol(-8,Math.PI/6)));L('B','T','以30°斜线把系数1/2变成直角三角形中的对边。');perp('P','B','T','Q');L('A','Q');break;
 case 'apollonius':center();ratio('O','A','B',9/M.norm(P('A'))**2,'在 OA 上取逆点 B，使 OA·OB=9；输入 OB/OA。');L('P','B');L('O','A');L('O','B');break;
 case 'apollonius-min':ratio('O','B','B*',4/M.norm(P('B'))**2,'在 OB 上取逆点 B*，使 OB·OB*=4；输入 OB*/OB。');L('O','P');L('O','B');L('P','B*');L('A','B*');break;
 case 'splice':case 'weighted-splice':rot('P','A','Q',type==='splice'?60:90);rot('B','A','C',type==='splice'?60:90);L('P','Q');L('Q','C');L('P','C');break;
 case 'fermat':case 'weighted-fermat':rot('P','A','Q',type==='fermat'?-60:-90);rot('B','A','B′',type==='fermat'?-60:-90);L('P','Q');L('Q','B′');L('C','B′');break;
 case 'weighted-fermat-original':case 'multi-fermat':{const k=type==='multi-fermat'?4/3:1;rot('P','C','P′',90,k);rot('B','C','B′',90,k);L('P','P′');L('P′','B′');L('A','B′');break;}
 case 'hidden-circle':mid('A','B','O');L('O','P');circle('O','P');break;
 case 'cyclic':L('B','D');break;
 case 'rectangle-circle-tangent':mid('A','B','O');circle('O','A');L('O','G');break;
 case 'height-right':mid('B','C','M');L('A','M');break;
 case 'miller':add('circumcircle',['A','B','P'],'O','过 A、B、P 作圆，标出圆心 O。','作两条弦的垂直平分线，交点是圆心；再观察圆与路径的相对位置。');L('O','P');break;
 case 'fixed-height':perp('A','B','C','D');break;
 default:throw Error('No chapter construction recipe: '+type);
 }
 // Merge explicitly constructed geometry into the full demonstration; do not invent points by clicking coordinates.
 for(const task of tasks){for(const [a,b] of task.result.lines||[])if(!g.segments.some(s=>near(s.a,a)&&near(s.b,b)||near(s.a,b)&&near(s.b,a)))g.segments.push({a,b,kind:'aux'});const c=task.result.circle;if(c&&!g.circles.some(x=>near(c.o,x.o)&&Math.abs(c.r-x.r)<1e-7))g.circles.push(c)}
 const newNames=new Set(tasks.map(t=>t.gives).filter(Boolean));for(const [name,p]of Object.entries(g.points))if(p.kind==='aux'&&!newNames.has(name)&&!givenAux.has(name))throw Error(type+': auxiliary point has no construction '+name);
 const named=p=>Object.entries(g.points).find(([,q])=>q.p===p)?.[0]||Object.entries(g.points).find(([,q])=>near(q.p,p))?.[0];
 const constructedLines=tasks.flatMap(t=>t.result.lines||[]),lineCovered=(a,b)=>constructedLines.some(([c,d])=>near(a,c)&&near(b,d)||near(a,d)&&near(b,c));
 // Lines already implicit in a polygon still need to be drawn when they are an auxiliary task.
 for(const s of [...g.segments])if(s.kind==='aux'&&!lineCovered(s.a,s.b)){const a=named(s.a),b=named(s.b);if(a&&b&&a!==b){const t=L(a,b);constructedLines.push(...t.result.lines)}}
 return {chapter,type,graph:g,tasks,newNames,givenAux};
}
function scene(plan,count=0,demo=false){if(demo||count>=plan.tasks.length)return plan.graph;const g=plan.graph,done=plan.tasks.slice(0,count),created=new Set(done.map(t=>t.gives).filter(Boolean)),hidden=new Set([...plan.newNames].filter(n=>!created.has(n))),visiblePoints=Object.fromEntries(Object.entries(g.points).filter(([n])=>!hidden.has(n))),hiddenCoords=[...hidden].map(n=>g.points[n].p),visibleCoords=Object.values(visiblePoints).map(x=>x.p),isHidden=p=>hiddenCoords.some(q=>near(p,q))&&!visibleCoords.some(q=>near(p,q));
 const allLines=plan.tasks.flatMap(t=>t.result.lines||[]),isTaskLine=(a,b)=>allLines.some(([c,d])=>near(a,c)&&near(b,d)||near(a,d)&&near(b,c)),lines=g.segments.filter(s=>s.kind!=='aux'&&!isHidden(s.a)&&!isHidden(s.b)&&!isTaskLine(s.a,s.b)).map(s=>({...s})),polygons=[];
 for(const poly of g.polygons){if(poly.kind==='aux')continue;if(poly.ps.length>4){polygons.push(poly);continue}for(let i=0;i<poly.ps.length;i++){const a=poly.ps[i],b=poly.ps[(i+1)%poly.ps.length];if(!isHidden(a)&&!isHidden(b)&&!isTaskLine(a,b))lines.push({a,b,kind:poly.kind})}}
 const taskCircles=plan.tasks.map(t=>t.result.circle).filter(Boolean),circles=g.circles.filter(c=>!taskCircles.some(q=>near(c.o,q.o)&&Math.abs(c.r-q.r)<1e-7));
 for(const t of done){for(const [a,b]of t.result.lines||[])lines.push({a,b,kind:'aux'});if(t.result.circle)circles.push(t.result.circle)}
 return {...g,points:visiblePoints,segments:lines,polygons,circles};
}
function validate(task,picks,values,points){if(picks.length!==task.picks.length)return '还没有选完所需的点。';const same=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);let correct=same(picks,task.picks);if(['line','midpoint'].includes(task.tool))correct=correct||same([...picks].reverse(),task.picks);if(['perp','reflect'].includes(task.tool))correct=correct||same([picks[0],picks[2],picks[1]],task.picks);if(!correct)return '当前点或顺序不符合这一步的关系。'+usage[task.tool];if(values.length!==task.values.length||values.some((v,i)=>!Number.isFinite(v)||Math.abs(v-task.values[i])>1e-7*Math.max(1,Math.abs(v))))return '方向、角度或长度比还不符合题目条件。请先列出关系，再填写精确值；支持分数与根式。';const result=calculate(task.tool,picks.map(n=>points[n].p),values);if(result.point&&!near(result.point,task.result.point))return '该构造得到的位置不符合条件，请检查所选参考线。';return null}
return {plan,scene,calculate,validate,tools,usage};
})();
