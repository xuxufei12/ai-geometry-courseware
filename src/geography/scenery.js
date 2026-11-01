import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Deterministic details: changing a teaching parameter never re-rolls the landscape.
export const coast=z=>-.38+.25*Math.sin(z*1.2)+.11*Math.sin(z*2.7);
export function grain(x,z){return Math.sin(x*5.7+Math.cos(z*3.1))*.5+Math.sin(z*12.3+x*8.9)*.22+Math.sin(x*28.7-z*23.1)*.09;}

// Small repeated props share one draw call after baking their transforms and colours.
export class Scenery {
 constructor(){this.parts=[];}
 add(geometry,color,x,y,z,sx=1,sy=1,sz=1,rotation=0){
  const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rotation),new T.Vector3(sx,sy,sz));
  geometry.applyMatrix4(matrix);const c=new T.Color(color),colors=[];
  for(let i=0;i<geometry.attributes.position.count;i++)colors.push(c.r,c.g,c.b);
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  // All detail primitives are merged without indices, including extruded roof faces.
  const flat=geometry.index?geometry.toNonIndexed():geometry;
  if(flat!==geometry)geometry.dispose();this.parts.push(flat);
 }
 tree(x,z,y,s){
  const phase=Math.abs(Math.sin(x*17.2+z*8.4));
  this.add(new T.CylinderGeometry(.035,.065,.6,7),0x76604b,x,y+.3*s,z,s,s,s);
  if(phase<.38){
   for(let k=0;k<4;k++)this.add(new T.ConeGeometry(.32-k*.046,.48,9),[0x315e52,0x46785d,0x578767,0x709471][k],x,y+(.47+k*.19)*s,z,s,s,s,phase*8);
  }else{
   for(let k=0;k<5;k++){
    const a=k*2.4+phase*6,r=k===0?0:.18;
    this.add(new T.IcosahedronGeometry(.32,1),[0x47785a,0x648e62,0x7fa06b,0x5d8558,0x92ab77][k],x+Math.cos(a)*r*s,y+(.65+(k%3)*.13)*s,z+Math.sin(a)*r*s,s,.9*s,s,a);
   }
  }
 }
 house(x,z,y,s){
  this.add(new T.BoxGeometry(.64,.5,.52),0xefe8d6,x,y+.25*s,z,s,s,s);
  const roof=new T.Shape();roof.moveTo(-.4,0);roof.lineTo(0,.29);roof.lineTo(.4,0);roof.closePath();
  this.add(new T.ExtrudeGeometry(roof,{depth:.65,bevelEnabled:false}),0xa96449,x,y+.5*s,z-.325*s,s,s,s);
  this.add(new T.BoxGeometry(.09,.3,.1),0xcfbd9b,x+.2*s,y+.65*s,z-.13*s,s,s,s);
  for(const side of [-1,1])for(const dx of [-.2,.2]){
   this.add(new T.BoxGeometry(.14,.18,.025),0xf6eed6,x+dx*s,y+.29*s,z+side*.268*s,s,s,s);
   this.add(new T.BoxGeometry(.1,.13,.028),0x507e89,x+dx*s,y+.29*s,z+side*.28*s,s,s,s);
  }
  this.add(new T.BoxGeometry(.12,.27,.03),0x776151,x,y+.135*s,z+.27*s,s,s,s);
 }
 rock(x,z,y,s){this.add(new T.IcosahedronGeometry(1,1),0x9b9d8e,x,y+s*.25,z,s,s*.55,s*.7,x+z);}
 flush(parent){if(!this.parts.length)return;const geometry=mergeGeometries(this.parts,false);for(const part of this.parts)part.dispose();this.parts=[];
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.92}));mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 }
}

// Original lightweight water treatment inspired by Three.js Water2's moving normals
// and view-angle reflectance. Waves are illustrative; they do not calculate wind speed.
export function waterMaterial(clock,{coastal=false,river=false}={}){
 const material=new T.MeshStandardMaterial({color:0xffffff,roughness:.28,metalness:.24,side:T.DoubleSide});
 material.customProgramCacheKey=()=>`geography-water-${coastal}-${river}`;
 material.onBeforeCompile=shader=>{
  shader.uniforms.uWaterTime=clock;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterPosition; varying vec2 vWaterUV;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterPosition=(modelMatrix*vec4(position,1.0)).xyz; vWaterUV=uv;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float uWaterTime; varying vec3 vWaterPosition; varying vec2 vWaterUV;')
   .replace('#include <color_fragment>',`#include <color_fragment>
    vec2 p=vWaterPosition.xz;
    float t=uWaterTime;
    float ripple=sin(p.x*10.0+p.y*2.0+sin(p.y*5.0)*.6-t*1.6)*.6+sin(p.x*17.0-p.y*6.0+t*.9)*.25;
    float shore=-.38+.25*sin(p.y*1.2)+.11*sin(p.y*2.7);
    float depth=${coastal?'clamp((shore-p.x)*.65,0.0,1.0)':river?'smoothstep(0.0,.38,min(vWaterUV.y,1.0-vWaterUV.y))':'.7'};
    vec3 water=mix(vec3(.13,.52,.46),vec3(.018,.18,.27),depth);
    water+=ripple*.008;
    float foam=${coastal?'(1.0-smoothstep(.03,.25,shore-p.x))*(.48+.32*sin((shore-p.x)*47.0-t*1.4))':river?'(1.0-smoothstep(.015,.065,min(vWaterUV.y,1.0-vWaterUV.y)))*.3':'0.0'};
    diffuseColor.rgb=mix(water,vec3(.73,.85,.75),clamp(foam,0.0,.75));`)
   .replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
    normal=normalize(normal+vec3(sin(vWaterPosition.x*10.0+vWaterPosition.z*2.0+sin(vWaterPosition.z*5.0)*.6-uWaterTime*1.6)*.014,cos(vWaterPosition.z*14.0+uWaterTime*.9)*.009,0.0));`);
 };
 return material;
}

export function geologyMaterial(){
 const m=new T.MeshStandardMaterial({color:0xffffff,roughness:1,side:T.DoubleSide});
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStrata;').replace('#include <begin_vertex>','#include <begin_vertex>\nvStrata=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vStrata;').replace('#include <color_fragment>',`#include <color_fragment>
   float bedding=sin(vStrata.y*36.0+.4*sin(vStrata.x*1.7+vStrata.z));
   vec3 soil=mix(vec3(.055,.063,.046),vec3(.19,.13,.075),smoothstep(-.65,.25,vStrata.y));
   diffuseColor.rgb=soil*(.93+.09*bedding);`);
 };
 return m;
}
