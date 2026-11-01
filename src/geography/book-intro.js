import coldImage from '../../assets/geography/pep-cold-front.jpg';
import warmImage from '../../assets/geography/pep-warm-front.jpg';
import coverImage from '../../assets/geography/pep-natural-cover.jpg';

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
export class BookIntro {
 constructor(host,{prepare,reveal,finish,pause,has3D}){
  this.host=host;this.prepare=prepare;this.reveal=reveal;this.finish=finish;this.pause=pause;this.has3D=has3D;this.token=0;this.active=false;
  this.canvas=host.querySelector('canvas');this.replay=document.getElementById('book-replay');
  this.element=document.createElement('div');this.element.className='book-intro';this.element.hidden=true;
  this.element.innerHTML=`<div class="book-intro-head"><span>人教版 · 选择性必修1 · 第三章</span><button class="book-skip">直接进入实验</button></div>
   <div class="book-stage"><div class="textbook">
    <div class="book-pages">
     <article class="book-page left"><small>第一节　常见天气系统</small><h2>冷锋及其天气</h2><p>冷空气推进，暖空气被迫抬升。先在原图中找到气团、云层与雨区。</p><img class="source-figure" data-figure="0" src="${coldImage}" alt="教材图3.3：冷空气从左向右推进，暖空气抬升，锋面附近有云和降水。"><div class="figure-caption">图 3.3 · 教材第 43 页</div><button class="lift-figure" data-lift="0">让冷锋图立起来</button><span class="folio">43</span></article>
     <article class="book-page right"><small>锋与天气</small><h2>暖锋及其天气</h2><p>暖空气沿冷空气缓缓爬升。比较云层的展开方式与降水的位置。</p><img class="source-figure" data-figure="1" src="${warmImage}" alt="教材图3.4：暖空气从右侧沿冷气团爬升，云层铺展，雨区位于地面锋线前方。"><div class="figure-caption">图 3.4 · 教材第 44 页</div><button class="lift-figure" data-lift="1">让暖锋图立起来</button><span class="folio">44</span></article>
    </div><div class="turning-sheet sheet-one"></div><div class="turning-sheet sheet-two"></div><div class="turning-sheet sheet-three"></div>
    <div class="book-cover"><img src="${coverImage}" alt="人教版普通高中教科书地理选择性必修1，自然地理基础封面"></div>
   </div></div>
   <div class="book-intro-footer"><p class="book-status" role="status">从书上的一幅图，走进正在发生的天气。</p><button class="open-book primary">翻到“锋与天气”</button><small>原图摘录：人民教育出版社 · 导读页重新排版 · <a href="https://www.jnnu.edu.cn/dlxy/info/1143/3062.htm" target="_blank" rel="noopener noreferrer">教材索引</a></small></div>`;
  host.append(this.element);
  this.element.querySelector('.open-book').onclick=()=>this.open();
  this.element.querySelector('.book-skip').onclick=()=>this.cancel(true);
  for(const button of this.element.querySelectorAll('[data-lift]'))button.onclick=()=>this.lift(Number(button.dataset.lift));
  this.replay.onclick=()=>this.show();
 }
 setLesson(id){this.cancel(false);this.replay.hidden=id!=='front';if(id==='front')this.show();}
 show(){this.cancel(false);this.pause();this.active=true;this.element.hidden=false;this.element.dataset.stage='closed';this.element.querySelector('.book-pages').inert=true;this.element.querySelector('.open-book').hidden=false;this.element.querySelector('.book-status').textContent='从书上的一幅图，走进正在发生的天气。';this.host.classList.add('book-active');if(this.canvas)this.canvas.style.opacity='0';this.element.querySelector('.textbook').removeAttribute('style');for(const leaf of this.element.querySelectorAll('.turning-sheet,.book-cover,.book-pages'))leaf.removeAttribute('style');}
 animate(duration,step,done){const token=++this.token,start=performance.now();const frame=now=>{if(token!==this.token)return;const t=Math.min(1,(now-start)/duration);step(t);if(t<1)this.raf=requestAnimationFrame(frame);else done?.();};this.raf=requestAnimationFrame(frame);}
 open(){if(this.element.dataset.stage!=='closed')return;this.element.dataset.stage='opening';this.element.querySelector('.open-book').hidden=true;this.element.querySelector('.book-status').textContent='翻到第 43–44 页 · 冷锋与暖锋';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.animate(reduced?1:2400,p=>{
   const t=smooth(p/.7),book=this.element.querySelector('.textbook');book.style.transform=`translateX(${-25*(1-t)}%) rotateX(${8*(1-t)}deg) rotateY(${-12*(1-t)}deg)`;
   this.element.querySelector('.book-pages').style.opacity=String(smooth(p/.2));
   const cover=this.element.querySelector('.book-cover');cover.style.transform=`rotateY(${-178*smooth(p/.5)}deg)`;cover.style.opacity=String(1-smooth((p-.5)/.2));
   this.element.querySelectorAll('.turning-sheet').forEach((leaf,i)=>{const phase=smooth((p-.2-i*.14)/.38);leaf.style.opacity=p<.18+i*.14?'0':String(1-smooth((phase-.85)/.15));leaf.style.transform=`rotateY(${-178*phase}deg)`;});
  },()=>{this.element.dataset.stage='pages';this.element.querySelector('.book-pages').inert=false;this.element.querySelector('.book-status').textContent='选择一幅原图，让它从书页中展开。';this.element.querySelector('[data-lift="0"]').focus({preventScroll:true});});
 }
 lift(type){if(this.element.dataset.stage!=='pages')return;if(!this.has3D()){this.element.querySelector('.book-status').textContent='此设备无法显示三维。可以继续查看原图，或直接进入实验操作图表。';return;}
  this.pause();this.prepare(type);this.element.dataset.stage='lifting';this.element.querySelector('.book-pages').inert=true;const image=this.element.querySelector(`[data-figure="${type}"]`),bounds=image.getBoundingClientRect(),host=this.element.getBoundingClientRect();
  const flight=document.createElement('img');flight.className='figure-flight';flight.src=type?warmImage:coldImage;flight.alt=type?'暖锋原图向三维展开':'冷锋原图向三维展开';this.element.append(flight);
  const initial={x:bounds.left-host.left,y:bounds.top-host.top,w:bounds.width,h:bounds.height};const maxW=host.width*.9,maxH=host.height*.64,w=Math.min(maxW,maxH*bounds.width/bounds.height),h=w*bounds.height/bounds.width,target={x:(host.width-w)/2,y:(host.height-h)/2-10,w,h};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.element.querySelector('.book-status').textContent='图像离开纸面，锋面展开，云层显现…';
  this.animate(reduced?1:3600,p=>{
   const zoom=smooth(p/.4);Object.assign(flight.style,{left:lerp(initial.x,target.x,zoom)+'px',top:lerp(initial.y,target.y,zoom)+'px',width:lerp(initial.w,target.w,zoom)+'px',height:lerp(initial.h,target.h,zoom)+'px',opacity:String(1-smooth((p-.4)/.34)),transform:`perspective(900px) rotateX(${-8*smooth((p-.35)/.5)}deg)`});
   this.element.querySelector('.textbook').style.opacity=String(1-smooth(p/.3));const unfold=smooth((p-.4)/.6);if(this.canvas)this.canvas.style.opacity=String(smooth((p-.37)/.3));this.reveal(unfold);
  },()=>{this.cancel(false);this.finish();});
 }
 cancel(focus=false){this.token++;cancelAnimationFrame(this.raf);this.element.querySelector('.figure-flight')?.remove();this.element.hidden=true;this.host.classList.remove('book-active');if(this.canvas)this.canvas.style.opacity='';if(this.active)this.reveal(1);this.active=false;if(focus&&!this.replay.hidden)this.replay.focus({preventScroll:true});}
}
