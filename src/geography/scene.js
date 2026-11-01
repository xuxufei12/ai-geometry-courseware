import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {values,solar,rad,clamp,farmParcels} from './models.js';
import earthURL from '../../assets/geography/earth.jpg';

const C={water:0x368ba7,land:0x87a98a,rock:0xa48a72,sand:0xd3b88a,warm:0xf2b766,cool:0x66c6e4,ink:0x153c50};
const v=(x,y,z)=>new T.Vector3(x,y,z);
export class GeoScene {
 constructor(container,onPick) {
  this.container=container;this.onPick=onPick;this.time=0;this.paths=[];this.pickables=[];this.labels=[];
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(40,1,.1,100);
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.25;container.prepend(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','三维实验场景。拖动旋转，滚轮缩放；也可使用下方视角按钮。');
  this.renderer.domElement.setAttribute('role','img');
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.08;
  this.controls.minDistance=5;this.controls.maxDistance=36;this.controls.maxPolarAngle=Math.PI*.49;this.controls.enablePan=false;
  this.ambient=new T.HemisphereLight(0xd6f3ff,0x526878,2);this.scene.add(this.ambient);
  this.sun=new T.DirectionalLight(0xffedcf,3);this.sun.position.set(-4,10,6);this.sun.castShadow=true;
  Object.assign(this.sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:40});this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.bias=-.001;
  this.scene.add(this.sun);this.scene.add(this.sun.target);
  this.root=new T.Group();this.scene.add(this.root);
  this.earthMap=new T.TextureLoader().load(earthURL);this.earthMap.colorSpace=T.SRGBColorSpace;
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.view('perspective');
  let down;
  this.renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;
   const r=this.renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);
   const hit=ray.intersectObjects(this.pickables)[0];if(hit)this.onPick(hit.object.userData.parcel);
  });
 }
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();const next=Math.max(1,1.25/this.camera.aspect);if(this.fitScale&&this.controls){this.camera.position.sub(this.controls.target).multiplyScalar(next/this.fitScale).add(this.controls.target);}this.fitScale=next;}
 view(mode){const globe=['orbit','daylight','circulation'].includes(this.id);this.controls.target.set(0,globe?0:1,0);
  if(mode==='top')this.camera.position.set(.01,globe?8:16,.01);
  else if(mode==='front')this.camera.position.set(0,globe?1:3,globe?9:17);
  else this.camera.position.set(globe?6:8.5,globe?3:8,globe?7:11);
  this.camera.position.sub(this.controls.target).multiplyScalar((this.fitScale||1)*(this.id==='circulation'?1.25:1)).add(this.controls.target);
  this.controls.update();
 }
 material(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.85,...extra});}
 mesh(geo,color,parent=this.root,extra={}){const m=new T.Mesh(geo,this.material(color,extra));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(x,y,z,w,h,d,color,parent=this.root,extra={}){const m=this.mesh(new T.BoxGeometry(w,h,d),color,parent,extra);m.position.set(x,y,z);return m;}
 ball(x,y,z,r,color,parent=this.root,extra={}){const m=this.mesh(new T.SphereGeometry(r,18,12),color,parent,extra);m.position.set(x,y,z);return m;}
 line(points,color=0xffffff,width=1,opacity=1,parent=this.root){const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color,transparent:opacity<1,opacity,linewidth:width}));parent.add(line);return line;}
 tube(points,color,r=.025,closed=false){const curve=new T.CatmullRomCurve3(points,closed);const m=this.mesh(new T.TubeGeometry(curve,70,r,6,closed),color);return {m,curve};}
 label(text,x,y,z,color='#e9f5fa',size=1.2){const cv=document.createElement('canvas');const probe=cv.getContext('2d');probe.font='600 30px "Microsoft YaHei",sans-serif';cv.width=Math.ceil(probe.measureText(text).width)+36;cv.height=64;const c=cv.getContext('2d');c.font='600 30px "Microsoft YaHei",sans-serif';c.textAlign='center';c.fillStyle='rgba(15,43,62,.85)';c.beginPath();c.roundRect(1,1,cv.width-2,62,12);c.fill();c.fillStyle=color;c.fillText(text,cv.width/2,43);
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;const m=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,transparent:true,toneMapped:false}));m.position.set(x,y,z);m.userData.labelRatio=cv.width/64;m.userData.labelPixels=28*Math.max(.9,Math.min(1.2,size));m.renderOrder=20;this.root.add(m);this.labels.push(m);return m;}
 arrow(from,to,color=C.warm){const d=to.clone().sub(from);const a=new T.ArrowHelper(d.clone().normalize(),from,d.length(),color,.23,.12);this.root.add(a);return a;}
 flow(points,color,count=12,speed=.08,closed=true){const {curve}=this.tube(points,color,.018,closed);const particles=[];
  for(let i=0;i<count;i++){const p=this.ball(0,0,0,.045,color,this.root,{emissive:color,emissiveIntensity:.4});particles.push(p);}
  this.paths.push({curve,particles,speed});
  for(let t of [.12,.38,.64,.88]){const a=curve.getPoint(t),b=curve.getPoint((t+.035)%1);this.arrow(a,b,color);}
 }
 tree(x,z,y=.15,scale=1){this.box(x,y+.16*scale,z,.07*scale,.32*scale,.07*scale,0x735744);const p=this.mesh(new T.ConeGeometry(.27*scale,.8*scale,7),0x428670);p.position.set(x,y+.62*scale,z);const q=this.mesh(new T.ConeGeometry(.22*scale,.65*scale,7),0x6fa183);q.position.set(x,y+.9*scale,z);}
 house(x,z,y=.15,scale=1){this.box(x,y+.25*scale,z,.6*scale,.5*scale,.48*scale,0xe5ded0);const roof=this.mesh(new T.ConeGeometry(.48*scale,.3*scale,4),0x70828a);roof.rotation.y=Math.PI/4;roof.position.set(x,y+.65*scale,z);this.box(x,y+.29*scale,z+.245*scale,.16*scale,.16*scale,.012,0x35556a);}
 cloud(x,y,z,scale=1){for(let i=0;i<5;i++)this.ball(x+(i-2)*.3*scale,y+Math.sin(i)*.13*scale,z+Math.cos(i)*.15*scale,.4*scale,0xeaf3f7,this.root,{transparent:true,opacity:.72,depthWrite:false});}
 platform(){this.box(0,-.5,0,10,.8,7,0x667d82);for(let i=0;i<3;i++)this.box(0,-.3+i*.13,0,10.02,.035,7.02,[0xa48b72,0xb5a089,0x859782][i]);this.box(0,-.06,0,10,.1,7,C.land);}
 terrain(height,color=C.land){const g=new T.PlaneGeometry(10,7,75,50);g.rotateX(-Math.PI/2);const a=g.attributes.position;const colors=[];
  for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),y=height(x,z);a.setY(i,y);const c=new T.Color(color);c.multiplyScalar(.85+.15*Math.sin(x*2+z)+Math.min(.35,y*.12));colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  // Close the terrain to its geological base; never leave an elevated floating sheet.
  const edge=[];for(let i=0;i<=75;i++)edge.push([-5+i*10/75,-3.5]);for(let i=1;i<=50;i++)edge.push([5,-3.5+i*7/50]);for(let i=1;i<=75;i++)edge.push([5-i*10/75,3.5]);for(let i=1;i<=50;i++)edge.push([-5,3.5-i*7/50]);
  const skirt=[],indices=[];edge.forEach(([x,z],i)=>{skirt.push(x,-.08,z,x,Math.max(-.08,height(x,z)),z);if(i<edge.length-1){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}});const sides=new T.BufferGeometry();sides.setAttribute('position',new T.Float32BufferAttribute(skirt,3));sides.setIndex(indices);sides.computeVertexNormals();this.mesh(sides,0x9c9a7e,this.root,{side:T.DoubleSide});
  return this.mesh(g,0xffffff,this.root,{vertexColors:true});}
 ribbon(fn,width,color,y=.08){const vs=[],ix=[];const count=120;for(let i=0;i<=count;i++){const x=-5+i/12;const z=fn(x);const w=typeof width==='function'?width(x):width;vs.push(x,y,z-w,x,y,z+w);if(i<count){const j=i*2;ix.push(j,j+2,j+1,j+1,j+2,j+3);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setIndex(ix);g.computeVertexNormals();return this.mesh(g,color,this.root,{side:T.DoubleSide,roughness:.3,metalness:.12});}
 reset(){const geometries=new Set(),materials=new Set(),textures=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of [].concat(o.material)){materials.add(m);if(m.map&&m.map!==this.earthMap)textures.add(m.map);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();this.root.clear();this.paths=[];this.labels=[];this.pickables=[];}
 build(id,s){const changed=id!==this.id;this.id=id;this.state=s;this.reset();this.ambient.intensity=1.8;this.sun.intensity=3;this.sun.color.set(0xffedcf);this.sun.position.set(-4,10,6);this.sun.target.position.set(0,0,0);
  if(id==='breeze')this.breeze(s);else if(id==='orbit'||id==='daylight')this.earth(s);else if(id==='shadow')this.shadow(s);else if(id==='front')this.front(s);else if(id==='circulation')this.circulation(s);else if(id==='water')this.water(s);else if(id==='river')this.river(s);else if(id==='farm')this.farm(s);else if(id==='basin')this.basin(s);
  if(changed)this.view('perspective');this.tick(0,false);
 }
 breeze(s){const data=values('breeze',s),day=data.delta>=0;this.platform();this.box(-2.5,.04,0,5,.16,7,C.water,this.root,{roughness:.24,metalness:.18});
  this.terrain((x,z)=>x<0?-.08:.12+Math.max(0,x-1)*.12+Math.sin(z*2+x)*.06);
  for(let i=0;i<17;i++){const x=1.1+(i%5)*.7,z=-2.7+Math.floor(i/5)*1.5;this.tree(x,z,.17+Math.max(0,x-1)*.12,.6+(i%3)*.12);}
  this.house(1,1.4,.18,.9);this.house(2,2,.27,.8);
  for(let j=0;j<8;j++){const x=-4.6+j*.52;this.line(Array.from({length:30},(_,i)=>v(x+.05*Math.sin(i/3),.14,-3+i*.21)),0x96d6df,1,.35);}
  const pts=[v(-2.6,.6,0),v(-.5,.6,0),v(2.6,.9,0),v(2.8,2.7,0),v(.3,3.3,0),v(-2.6,3.1,0),v(-3,1.6,0)];
  if(Math.abs(data.delta)>.05)this.flow(day?pts:pts.reverse(),day?C.warm:C.cool,24,.025*Math.sqrt(Math.abs(data.delta)));
  this.label(day?'暖空气上升':'冷空气下沉',2.6,3.7,0,day?'#f4c883':'#a5e2f7');this.label(day?'冷空气下沉':'暖空气上升',-2.8,3.7,0,day?'#a5e2f7':'#f4c883');
  this.label(Math.abs(data.delta)<.05?'海洋':'海洋 · '+(day?'高压':'低压'),-3.2,.5,2.7);this.label(Math.abs(data.delta)<.05?'陆地':'陆地 · '+(day?'低压':'高压'),3.1,.9,2.7);
  if(!day){this.ambient.intensity=.7;this.sun.intensity=.8;this.sun.color.set(0xadc9ff);}else this.sun.color.set(0xffedcf);
  this.ball(-4,4.7,-2.5,.36,day?0xffd47b:0xe3effa,this.root,{emissive:day?0xffbf55:0x749abd,emissiveIntensity:1});
 }
 earth(s){this.sun.color.set(0xffffff);const d=solar(s),dir=v(Math.sin(d.phase),0,Math.cos(d.phase));this.sun.position.copy(dir.clone().multiplyScalar(12));this.sun.intensity=3.5;this.ambient.intensity=.55;
  const globe=new T.Group();globe.rotation.z=-s.tilt*rad;this.root.add(globe);
  const m=new T.Mesh(new T.SphereGeometry(2,96,64),new T.MeshPhongMaterial({map:this.earthMap,shininess:12,specular:0x17374b}));globe.add(m);
  const atmo=new T.Mesh(new T.SphereGeometry(2.065,64,48),new T.ShaderMaterial({transparent:true,side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 n; varying vec3 p; void main(){n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); p=mv.xyz;gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 n;varying vec3 p;void main(){float a=pow(1.0-abs(dot(normalize(n),normalize(-p))),3.0);gl_FragColor=vec4(.25,.68,.9,a*.65);}'}));globe.add(atmo);
  for(let lat=-60;lat<=60;lat+=30)this.latitude(globe,lat,0x6db2c6,.28);
  for(let lon=0;lon<180;lon+=30){const points=Array.from({length:129},(_,i)=>{const a=i/128*Math.PI*2;return v(2.012*Math.cos(a)*Math.cos(lon*rad),2.012*Math.sin(a),2.012*Math.cos(a)*Math.sin(lon*rad));});this.line(points,0x6db2c6,1,.2,globe);}
  this.latitude(globe,0,0x68e0d0,.8);this.latitude(globe,s.lat,C.warm,1);
  this.line([v(0,-2.8,0),v(0,2.8,0)],0xffffff,1,.8,globe);
  const axis=v(Math.sin(s.tilt*rad),Math.cos(s.tilt*rad),0);this.label('北极',axis.x*2.9,axis.y*2.9,0,'#e8f8ff',.8);
  const b1=v(0,1,0),b2=new T.Vector3().crossVectors(dir,b1).normalize();
  this.line(Array.from({length:129},(_,i)=>b1.clone().multiplyScalar(Math.cos(i/128*Math.PI*2)*2.025).add(b2.clone().multiplyScalar(Math.sin(i/128*Math.PI*2)*2.025))),0xffffff,2,.9);
  for(let k=-1;k<=1;k++){const offset=b1.clone().multiplyScalar(k*.9);this.arrow(dir.clone().multiplyScalar(4.5).add(offset),dir.clone().multiplyScalar(2.4).add(offset),C.warm);}
  this.ball(dir.x*5,dir.y*5,dir.z*5,.38,0xffca66,this.root,{emissive:0xffbb44,emissiveIntensity:2});
  this.label('平行太阳光',dir.x*4,1.5,dir.z*4,'#ffda86',1);
  this.ball(dir.x*2.03,dir.y*2.03,dir.z*2.03,.065,0xffdf87,this.root,{emissive:0xffbb44});
  // The local meridian facing the Sun locates the chosen-latitude solar-noon marker.
  const local=dir.clone().applyQuaternion(globe.quaternion.clone().invert());globe.updateMatrixWorld();
  const hourAngle=(s.hour===undefined?0:(s.hour-12)*15*rad);const longitude=Math.atan2(local.z,local.x)+hourAngle;const mark=v(2.04*Math.cos(s.lat*rad)*Math.cos(longitude),2.04*Math.sin(s.lat*rad),2.04*Math.cos(s.lat*rad)*Math.sin(longitude));
  m.rotation.y=hourAngle;this.ball(mark.x,mark.y,mark.z,.08,0xffffff,globe,{emissive:0xffffff,emissiveIntensity:.5});
 }
 latitude(group,lat,color,opacity=1){const a=lat*rad,r=2.025*Math.cos(a);this.line(Array.from({length:129},(_,i)=>v(r*Math.cos(i/128*Math.PI*2),2.025*Math.sin(a),r*Math.sin(i/128*Math.PI*2))),color,1,opacity,group);}
 shadow(s){this.platform();const d=values('shadow',s),scale=Math.min(.065,4.8/s.gap),h=s.height*scale,gap=s.gap*scale;
  this.box(0,.04,0,9.8,.12,6.8,0xb8c8b5);this.box(0,.11,0,1.65,.04,6.8,0x849da3);
  this.box(0,h/2+.15,-2,1.15,h,.65,0xe5e2d3);this.box(0,h/2+.15,-2+gap,1.15,h,.65,0x84adbc);
  for(let floor=.3;floor<h;floor+=.32){for(let x of [-.35,0,.35]){this.box(x,.15+floor,-1.667,.12,.15,.012,0x436f88);this.box(x,.15+floor,-2+gap+.333,.12,.15,.012,0x365c73);}}
  for(let i=0;i<14;i++)this.tree(i%2?3:-3,-2.8+Math.floor(i/2)*.85,.14,.65);
  if(d.altitude>0){const alt=d.altitude*rad;this.sun.position.set(0,Math.sin(alt)*14,-Math.cos(alt)*14);const length=Math.min(5.2,d.shadow*scale);
   this.box(0,.157,-2+length/2,1.15,.007,length,0x456078,this.root,{transparent:true,opacity:.55});
   this.line([v(0,h+.16,-2),v(0,.16,-2+length)],C.warm,2);this.ball(0,Math.sin(alt)*6+1,-Math.cos(alt)*6,.32,0xffd078,this.root,{emissive:0xffc566,emissiveIntensity:1});
   this.arrow(v(0,h+.2+Math.sin(alt)*3,-2-Math.cos(alt)*3),v(0,h+.2,-2),C.warm);
  }else{this.sun.intensity=.05;this.ambient.intensity=.6;}
  this.label('前楼 · '+s.height+' m',-1.7,h+.5,-2);this.label('后楼底部',1.6,.7,-2+gap);this.label('间距 '+s.gap+' m',2,.5,-2+gap/2,'#f8d18a',1);
  this.label('南',0,.4,-3.3,'#c8e9f2',.65);this.label('北',0,.4,3.3,'#c8e9f2',.65);
 }
 front(s){this.platform();this.box(0,0,0,10,.1,7,0x91ad93);const x=s.position*.65,cold=s.type===0;
  // Side profiles: cold air behind a cold front, ahead of a warm front moving right.
  const shape=new T.Shape();if(cold){shape.moveTo(-5,0);shape.lineTo(x,0);shape.lineTo(x-2.2,3);shape.lineTo(-5,3);}else{shape.moveTo(x,0);shape.lineTo(5,0);shape.lineTo(5,3);shape.lineTo(x+4.3,3);}shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:3.7,bevelEnabled:false});const m=this.mesh(g,C.cool,this.root,{transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide});m.position.set(0,.2,-1.85);
  const boundary=[v(x,.21,1.9),v(x+(cold?-2.2:4.3),3.2,1.9)];this.line(boundary,0xd3f1ff,2);
  this.box(x,.17,0,.055,.04,5.5,cold?0x5cc3ed:0xf0a164);
  this.house(0,2.2,.12,.7);this.box(0,1.2,1.9,.04,2.2,.04,0xe3eef0);this.label('固定测站',0,2.7,2.2,'#ffffff',1.05);
  this.label(cold?'冷气团推进':'暖空气爬升',cold?-3: -2,3.7,-1,'#b9eafa');this.label(cold?'暖空气被迫抬升':'前方冷气团',cold?2.9:3.3,3.7,-1,'#ffe0a2');
  const lift=cold?[v(x+1,.5,-.1),v(x+.2,1,-.1),v(x-1.6,3,-.1)]:[v(x-2,.5,-.1),v(x+.2,1,-.1),v(x+3.4,3,-.1)];this.flow(lift,C.warm,14,.1,false);
  const rainX=x+(cold?-.8:1.2);if(s.moisture>0){this.cloud(rainX,3.3,0,1);for(let j=0;j<20;j++){const px=rainX+(j%5-2)*.2,pz=-1+(j%4)*.5;this.flow([v(px,2.8,pz),v(px-.1,.25,pz)],0x8cdbf3,2,.25*s.moisture/100,false);}}
  this.arrow(v(-4.3,.35,2.6),v(-2.7,.35,2.6),0xffffff);
 }
 circulation(s){this.sun.color.set(0xffedcf);const globe=this.mesh(new T.SphereGeometry(1.9,64,48),0xffffff);globe.material.map=this.earthMap;globe.material.needsUpdate=true;const shift=s.season*12;
  for(const lat of [-60,-30,0,30,60])this.latitude(this.root,clamp(lat+shift,-85,85),lat===0?C.warm:C.cool,.75);
  this.latitude(this.root,s.lat,0xffffff,1);
  const bands=s.rotation?[[0,30],[30,60],[60,88]]:[[0,88]];
  for(const hemi of [-1,1])for(let j=0;j<bands.length;j++){
   const [lo,hi]=bands[j];const pts=[];const point=(lat,r)=>v(r*Math.cos(lat*rad),r*Math.sin(lat*rad),.35);
   const a=clamp(hemi*lo+shift,-88,88),b=clamp(hemi*hi+shift,-88,88);
   for(let t=0;t<=1;t+=.05)pts.push(point(a+(b-a)*t,2.12));
   for(let t=1;t>=0;t-=.05)pts.push(point(a+(b-a)*t,2.7));
   // Hadley/polar cells: near-surface flow toward lower absolute latitude; Ferrel opposite.
   this.flow(j===1?pts:pts.reverse(),j===1?C.cool:C.warm,14,.055);
  }
  this.label('北极',0,3.3,0);this.label('南极',0,-3.2,0);this.label(s.rotation?'三圈环流 · 纬向剖面':'不考虑自转 · 单圈',0,-3.75,0,'#d7eff8',1.5);
  if(s.rotation){for(const [lat,text] of [[0,'赤道低压'],[30,'副热带高压'],[60,'副极地低压']]){const l=(lat+shift)*rad;this.label(text,-2.9,Math.sin(l)*2.6,0,'#d8ebef',.8);}}
 }
 water(s){const d=values('water',s);this.platform();const hard=s.paving/100;
  this.box(-2.6,.04,0,4.6,.18,6.8,0x659c88);this.box(2.3,.055,0,4.8,.2,6.8,0x809ba6);
  for(let i=0;i<20;i++){const x=-4.4+(i%4)*.9,z=-2.5+Math.floor(i/4)*1.15;if(i/20>hard*.65)this.tree(x,z,.17,.7);}
  for(let i=0;i<12;i++){const x=.8+(i%3)*1.3,z=-2.4+Math.floor(i/3)*1.5;if(i/12<hard){const h=.4+(i%3)*.25;this.box(x,h/2+.17,z,.7,h,.8,0xc4d2d2);this.box(x,h+.2,z,.75,.06,.85,0x557788);}}
  this.box(0,.17,0,.6,.04,7,C.water);for(let k=0;k<Math.round(s.green/15);k++){this.box(1+k%3*1.1,.17,2.5-Math.floor(k/3),.8,.07,.5,0x76bc9e);}
  this.cloud(-1,4,0,1.6);this.cloud(2,4.2,0,1.2);
  for(let i=0;i<20;i++){const x=-3.5+i%8,z=-2+(i%4)*1.2;this.flow([v(x,3.5,z),v(x,.25,z)],0x9ee2ee,2,.07+s.rain/600,false);}
  this.flow([v(-3,.2,2),v(-3,-.5,2),v(-1,-.65,2)],0xf0c180,10,d.infiltration/600,false);
  this.flow([v(3,.25,1),v(1,.25,1),v(0,.25,1),v(0,.25,3.3)],C.cool,15,d.outlet/500,false);
  if(d.flood>.1)this.box(2.3,.24,1,3.7,.03,2.8,C.water,this.root,{transparent:true,opacity:clamp(d.flood/50,.1,.55),depthWrite:false});
  this.label('透水绿地',-2.8,1.5,2.8);this.label('城区与海绵设施',2.6,1.6,2.8);this.label('下渗',-3,-.25,3.7,'#f6d39e',.7);
 }
 river(s){this.platform();const d=values('river',s),phase=s.years/100;
  const fn=x=>Math.sin(x*.85)*(.65+phase*.32);
  this.terrain((x,z)=>{const distance=Math.abs(z-fn(x));return .05+Math.max(0,distance-.5)*(.23+s.slope*.035)+.04*Math.sin(x*3)*Math.cos(z*2);},0x91a68a);
  this.ribbon(fn,.27+s.flow/300+Math.min(.2,d.erosion/500)*phase,C.water,.14);
  for(let k=0;k<5;k++)this.flow(Array.from({length:20},(_,i)=>{const x=-4.8+i*.5;return v(x,.18,fn(x)+(k-2)*.1);}),0x9cdeeb,8,.025+s.flow/1800,false);
  const dep=clamp(d.deposition/80,0,1)*phase;
  if(dep>.01){const fan=this.mesh(new T.ConeGeometry(.4+dep*1.1,.12+dep*.28,40),C.sand);fan.scale.z=.65;fan.position.set(3.8,.16,fn(3.8));for(let i=0;i<3;i++)this.line([v(3,.4,fn(3)),v(4.5,.35,fn(3)+(i-1)*.6)],C.water);}
  for(let i=0;i<18;i++){const x=-4.5+i%6*1.7,z=i%2?2.7:-2.6;this.tree(x,z,.05+Math.max(0,Math.abs(z-fn(x))-.5)*(.23+s.slope*.035),.55);}
  this.label('上游',-4.2,1.6,0);this.label('下游',4,1.5,0);this.label(d.state,0,3.2,0,'#f5d7a7',1.3);
  this.label('凹岸侧蚀',-1.7,.9,-1.4,'#bce7ee',.85);this.label('凸岸堆积',1.9,.9,.3,'#efcfa1',.85);
 }
 farm(s){this.platform();const height=(x,z)=>{let sum=0,weight=0;for(const p of farmParcels){const h=.12+p.altitude*.0015;if(Math.abs(x-p.x)<1.02&&Math.abs(z-p.z)<.74)return h;const w=1/(.15+((x-p.x)**2+(z-p.z)**2)**1.7);sum+=w*h;weight+=w;}return sum/weight;};this.terrain(height,0x8bae83);
  for(let i=0;i<6;i++){const {x,z,name}=farmParcels[i],y=height(x,z);const parcel=this.box(x,y+.055,z,1.9,.12,1.35,i===s.parcel?0xd1b75c:0x6caa73);parcel.userData.parcel=i;this.pickables.push(parcel);
   const health=values('farm',{...s,parcel:i}).score/100;
   for(let r=0;r<5;r++){for(let t=0;t<7;t++){const px=x-.75+t*.25,pz=z-.5+r*.25;const color=new T.Color(0xb39b69).lerp(new T.Color(s.crop===1?0xd4be75:s.crop===2?0x3f8059:0x8cc882),health);const crop=this.mesh(new T.ConeGeometry(s.crop===2?.12:.055,(s.crop===2?.22:.18)*(.4+health),5),color);crop.position.set(px,y+.22,pz);}}
   this.label(name,x,y+.75,z,'#f4f8e7',.7);
  }
  const riverPoints=Array.from({length:25},(_,i)=>{const z=-3.3+i*6.6/24,x=-4.4+Math.sin(z)*.12;return v(x,height(x,z)+.06,z);});this.tube(riverPoints,C.water,.13);
  this.house(-4,-.3,height(-4,-.3),.6);for(let j=0;j<9;j++)this.tree(-4.5+j*.9,-3,height(-4.5+j*.9,-3),.6);
  if(s.irrigation>0)this.flow([[-4.4,0],[-2,0],[0,1],[2,1]].map(([x,z])=>v(x,height(x,z)+.18,z)),C.cool,12,s.irrigation/1100,false);
 }
 basin(s){this.platform();const d=values('basin',s);this.terrain((x,z)=>.07+Math.max(0,Math.abs(z)-.8)*.35+Math.max(0,-x-1)*.12,0x88a490);
  this.ribbon(x=>Math.sin(x*.7)*.3,x=>x<-1?.9:.25,C.water,.2);
  const level=.28+clamp(d.storage/100,-.2,.4);this.box(-2.8,level/2+.12,0,3.4,level,1.6,C.water,this.root,{roughness:.25});
  this.box(-.9,.6,0,.3,1.1,2.15,0xc2c6bd);this.box(-.9,1.2,0,.55,.1,2.35,0xe0d8bf);
  for(let i=0;i<4;i++)this.box(-.7,.5,-.7+i*.45,.1,.65,.2,0x678797);
  for(let i=0;i<4;i++){this.box(1.3+i*.6,.3,2,.45,.08,1.5,0x9fb86b);for(let j=0;j<4;j++)this.line([v(1.1+i*.6,.36,1.4+j*.3),v(1.5+i*.6,.36,1.4+j*.3)],0xd2d79b);}
  this.flow([v(-4.7,.5,0),v(-3,.5,0),v(-1,.5,0),v(.2,.3,0),v(2,.3,.3),v(4.7,.3,0)],C.cool,22,.03+d.release/2200,false);
  if(d.irrigation>0)this.flow([v(.5,.3,0),v(1,.4,1),v(2.3,.4,2)],0xb5d58c,12,d.irrigation/650,false);
  for(let i=0;i<12;i++)this.tree(3.8+i%3*.35,-2.6+Math.floor(i/3)*.5,.7,.55);
  this.house(4,2,.7,.65);this.label('上游入库',-3.7,2,-.5);this.label('水库',-1.5,2,0);this.label('农业取水',2,1.4,2.4);this.label('下游生态',4,1.7,-1.4);
 }
 tick(dt,playing){if(playing)this.time+=Math.min(dt,.06);for(const path of this.paths){path.particles.forEach((p,i)=>{const t=(i/path.particles.length+this.time*path.speed)%1;p.position.copy(path.curve.getPoint(t));});}this.controls.update();for(const l of this.labels){const distance=this.camera.position.distanceTo(l.position);const h=2*Math.tan(this.camera.fov*Math.PI/360)*distance/Math.max(1,this.container.clientHeight)*l.userData.labelPixels;l.scale.set(h*l.userData.labelRatio,h,1);}this.renderer.render(this.scene,this.camera);}
 setLabels(visible){for(const l of this.labels)l.visible=visible;}
 dispose(){this.resizeObserver.disconnect();this.controls.dispose();this.reset();this.earthMap.dispose();this.renderer.dispose();}
}
