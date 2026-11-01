import * as T from 'three';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';

// Adapted from Three.js r180 examples/webgl_volume_cloud.html (MIT).
// A fixed density field and fixed pixel jitter keep paused observations reproducible.
export class FrontClouds {
 constructor(){this.maps=[this.density(false),this.density(true)];}
 density(layered){
  const n=48,data=new Uint8Array(n*n*n),noise=new ImprovedNoise();let i=0;
  const lobes=layered?[[0,0,0,.44,.25,.4],[-.27,.03,.02,.2,.23,.32],[.29,-.02,0,.19,.21,.31]]:[[-.22,.17,0,.25,.19,.32],[.05,.13,0,.31,.29,.34],[.21,-.14,.02,.19,.29,.25],[-.07,-.15,.04,.24,.25,.32]];
  for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const px=x/(n-1)-.5,py=y/(n-1)-.5,pz=z/(n-1)-.5;let shape=0;
   for(const [cx,cy,cz,rx,ry,rz] of lobes)shape=Math.max(shape,1-Math.hypot((px-cx)/rx,(py-cy)/ry,(pz-cz)/rz));
   const detail=noise.noise(px*13+8,py*13+3,pz*13+4)*.2+noise.noise(px*29,py*29,pz*29)*.07;
   data[i++]=Math.max(0,Math.min(255,(shape+detail*Math.min(1,shape*8)-.035)*450));
  }
  const texture=new T.Data3DTexture(data,n,n,n);texture.format=T.RedFormat;texture.minFilter=texture.magFilter=T.LinearFilter;texture.unpackAlignment=1;texture.needsUpdate=true;return texture;
 }
 mesh(warm,moisture){
  const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,transparent:true,depthWrite:false,side:T.BackSide,
   uniforms:{map:{value:this.maps[warm?1:0]},cameraPos:{value:new T.Vector3()},opacity:{value:.5+moisture/100},reveal:{value:1}},
   vertexShader:`precision highp float;
    in vec3 position; uniform mat4 modelMatrix; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform vec3 cameraPos;
    out vec3 origin; out vec3 direction;
    void main(){origin=(inverse(modelMatrix)*vec4(cameraPos,1.)).xyz;direction=position-origin;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`precision highp float;precision highp sampler3D;
    uniform sampler3D map;uniform float opacity;uniform float reveal;in vec3 origin;in vec3 direction;out vec4 color;
    vec2 boxHit(vec3 o,vec3 d){vec3 a=(-.5-o)/d,b=(.5-o)/d,lo=min(a,b),hi=max(a,b);return vec2(max(lo.x,max(lo.y,lo.z)),min(hi.x,min(hi.y,hi.z)));}
    float density(vec3 p){return texture(map,p+.5).r;}
    void main(){vec3 ray=normalize(direction);vec2 bounds=boxHit(origin,ray);if(bounds.x>bounds.y)discard;float near=max(0.,bounds.x),stepSize=(bounds.y-near)/48.;
     float jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);vec3 p=origin+(near+stepSize*jitter)*ray;vec4 sum=vec4(0.);
     for(int i=0;i<48;i++){float d=density(p);float alpha=1.-exp(-d*stepSize*18.*opacity);
      float shade=clamp(.48+p.y*.8+(d-density(p+vec3(-.04,.07,.03)))*.75,.18,1.);
      vec3 lit=mix(vec3(.25,.32,.4),vec3(.98,.99,1.),shade);sum.rgb+=(1.-sum.a)*alpha*lit;sum.a+=(1.-sum.a)*alpha;
      if(sum.a>.975)break;p+=ray*stepSize;}
     if(sum.a<.005)discard;vec3 linear=sum.rgb/max(sum.a,.001);color=vec4(pow(linear,vec3(1./2.2)),sum.a*reveal);}`
  });
  const mesh=new T.Mesh(new T.BoxGeometry(1,1,1),material);mesh.userData.frontCloud=true;mesh.renderOrder=4;
  mesh.onBeforeRender=(_renderer,_scene,camera)=>material.uniforms.cameraPos.value.setFromMatrixPosition(camera.matrixWorld);
  return mesh;
 }
 dispose(){for(const texture of this.maps)texture.dispose();}
}
