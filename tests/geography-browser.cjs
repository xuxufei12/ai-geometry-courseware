const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const artifact=process.env.GEO_QA_DIR||path.join(__dirname,'../.geography-qa');fs.mkdirSync(artifact,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--allow-file-access-from-files','--enable-webgl','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];const external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 const url=pathToFileURL(path.join(__dirname,'../docs/geography.html')).href;await page.goto(url);await page.waitForSelector('#scene canvas');await page.waitForTimeout(1200);
 assert.equal(await page.locator('#fallback').isVisible(),false);assert.equal(await page.locator('[data-lesson]').count(),10);
 const ids=await page.locator('[data-lesson]').evaluateAll(bs=>bs.map(b=>b.dataset.lesson));
 for(const id of ids){await page.locator(`[data-lesson="${id}"]`).click();await page.waitForTimeout(350);assert.equal(await page.locator('.metric').count(),3);
  await page.locator('[data-predict="0"]').click();await page.locator('#record').click();
  const before=await page.locator('#metrics').innerText();const preset=['orbit','daylight'].includes(id)?2:1;await page.locator(`[data-preset="${preset}"]`).click();await page.waitForTimeout(300);await page.locator('#record').click();
  const after=await page.locator('#metrics').innerText();assert.notEqual(after,before,`${id} preset must affect results`);
  await page.locator('#baseline').click();await page.locator('[data-preset="0"]').click();await page.locator('#restore-baseline').click();assert.equal(await page.locator('.metric-diff').count(),3);
  await page.locator('[data-tab="records"]').click();assert.equal(await page.locator('#record-body tr').count(),2);await page.locator('#notes').fill('我改变一个条件并记录现象。');
  await page.locator('[data-tab="explain"]').click();const correct=(3-ids.indexOf(id)%3)%3;await page.locator(`[data-transfer="${(correct+1)%3}"]`).click();assert.ok((await page.locator('#transfer-feedback').innerText()).includes('再想'));await page.locator(`[data-transfer="${correct}"]`).click();await page.locator('[data-view="front"]').click();await page.locator('[data-view="perspective"]').click();
  await page.locator('#labels').click();await page.locator('#labels').click();
  await page.screenshot({path:path.join(artifact,id+'.png'),fullPage:true});await page.locator('.scene-panel').screenshot({path:path.join(artifact,id+'-scene.png')});
 }
 await page.locator('[data-lesson="farm"]').click();await page.locator('#input-parcel').selectOption('2');await page.waitForTimeout(300);const canvas=page.locator('#scene canvas'),bounds=await canvas.boundingBox();let picked=false;for(const [x,y] of [[.28,.53],[.4,.55],[.55,.6],[.7,.55],[.5,.45],[.4,.45],[.7,.4]]){await canvas.click({position:{x:bounds.width*x,y:bounds.height*y}});await page.waitForTimeout(150);if(await page.locator('#input-parcel').inputValue()!=='2'){picked=true;break;}}assert.ok(picked,'clicking a field must select a parcel');
 const imageBefore=await canvas.screenshot();await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.65,bounds.y+bounds.height*.58,{steps:8});await page.mouse.up();await page.waitForTimeout(400);assert.ok(!(await canvas.screenshot()).equals(imageBefore),'dragging rotates the model');
 // New crop geometry must track the selected plan, including after repeated rebuilding.
 await page.locator('[data-view="perspective"]').click();await page.waitForTimeout(700);const cropImages=[];
 for(const crop of ['0','1','2']){await page.locator('#input-crop').selectOption(crop);await page.waitForTimeout(300);cropImages.push(await canvas.screenshot());}
 assert.ok(!cropImages[0].equals(cropImages[1])&&!cropImages[1].equals(cropImages[2]),'rice, wheat and tea must have distinct models');
 await page.locator('[data-lesson="breeze"]').click();await page.locator('[data-preset="0"]').click();await page.waitForTimeout(1000);
 const pausedWater=await canvas.screenshot();await page.waitForTimeout(350);assert.ok((await canvas.screenshot()).equals(pausedWater),'water and scenery must remain still while paused');
 await page.locator('#play').click();await page.waitForTimeout(700);await page.locator('#play').click();await page.waitForTimeout(400);assert.ok(!(await canvas.screenshot()).equals(pausedWater),'playing must visibly advance the experiment');
 const stoppedWater=await canvas.screenshot();await page.waitForTimeout(350);assert.ok((await canvas.screenshot()).equals(stoppedWater),'pausing must freeze animated water again');
 await page.locator('[data-lesson="orbit"]').click();const day=await page.locator('#number-day').inputValue();await page.locator('#play').click();await page.waitForTimeout(650);await page.locator('#play').click();assert.notEqual(await page.locator('#number-day').inputValue(),day);
 await page.locator('#number-day').fill('9999');await page.locator('#number-day').blur();assert.ok(Number(await page.locator('#number-day').inputValue())<=365);
 await page.reload();await page.waitForTimeout(500);await page.locator('[data-tab="records"]').click();assert.equal(await page.locator('#record-body tr').count(),2);assert.equal(await page.locator('#notes').inputValue(),'我改变一个条件并记录现象。');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;assert.ok(download.suggestedFilename().endsWith('.csv'));await download.saveAs(path.join(artifact,'observations.csv'));
 await page.setViewportSize({width:390,height:844});await page.locator('[data-lesson="breeze"]').click();await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow');await page.screenshot({path:path.join(artifact,'mobile.png'),fullPage:true});
 assert.deepEqual(external,[],'standalone lesson must not make external network requests');assert.deepEqual(errors,[]);
 // Fallback remains usable with WebGL deliberately disabled.
 const fallback=await context.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2'||type==='webgl')return null;return original.call(this,type,...args);};});await fallback.goto(url+'#water');await fallback.waitForSelector('#fallback:not([hidden])');await fallback.locator('[data-preset="1"]').click();assert.equal(await fallback.locator('.metric').count(),3);
 await browser.close();console.log('PASS browser: all 10 lessons, predictions, changed metrics, baseline, records, persistence, CSV, playback, input rejection, mobile layout, offline requests, WebGL fallback. Screenshots: '+artifact);
})().catch(e=>{console.error(e);process.exit(1);});
