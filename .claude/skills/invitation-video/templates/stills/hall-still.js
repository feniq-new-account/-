// node hallstill.js <buildDir> <out.png> <w> <h> camX camY camZ lookX lookY lookZ [t]
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
(async()=>{const [dir,out,W,H,cx,cy,cz,lx,ly,lz,tt]=process.argv.slice(2);const w=+W,h=+H;
const srv=http.createServer((q,r)=>{const f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/octet-stream'});fs.createReadStream(f).pipe(r)});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:w/1080});p.setDefaultTimeout(600000);
p.on('pageerror',e=>console.error('ERR',e.message));
await p.addInitScript(([w,h])=>{window.PALACE_CFG={wedding:true,width:w,height:h}},[w,h]);
await p.goto(`http://127.0.0.1:${srv.address().port}/palace-3d.html`);await p.waitForFunction(()=>window.__ready!==false,null,{timeout:600000});
await p.addStyleTag({content:'.page,.veil,.white{display:none!important}'});
const t0=Date.now();
await p.evaluate(([cx,cy,cz,lx,ly,lz,t])=>{seek(+t||20);const T=window.__three;T.scene.fog.density=+(window.__fog||0.0065);T.renderer.toneMappingExposure=0.74;T.scene.traverse(o=>{if(o.isHemisphereLight)o.intensity=0.42;if(o.isDirectionalLight)o.intensity=0.8;if(o.isSprite&&o.scale.x>=9){o.material.opacity=o.scale.x>20?0.28:0.3}});T.M.win.color.setRGB(0.95,0.78,0.78);T.M.curtain.emissiveIntensity=0.12;T.camera.position.set(+cx,+cy,+cz);T.camera.lookAt(+lx,+ly,+lz);T.composer.render();},[cx,cy,cz,lx,ly,lz,tt]);
await p.screenshot({path:out});console.log('done',Date.now()-t0,'ms');
await b.close();srv.close();})();
