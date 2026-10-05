import * as THREE from './three.module.js';
import {createMidknight} from './character-sprite.js?v=speedster13';
import {CatPhysics,STEP,sweptOverlap} from './physics.js?v=speedster13';
import {curveMaterial,createAdventure} from './adventure.js?v=speedster13';
import {bendAt,rampVelocity,pounceVelocity} from './rooftops.js?v=speedster13';
import {RoofLayout,Nitro} from './terrain.js?v=speedster13';
import {Speedster,createSpeedTrail} from './speedster.js?v=speedster13';
const route={value:0},terrain=new RoofLayout(),nitro=new Nitro(),speedster=new Speedster();

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color('#21102f');scene.fog=new THREE.Fog('#21102f',35,165);
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});}catch(e){$('loadError').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,260);
function setComfortCamera(){camera.aspect=innerWidth/innerHeight;camera.position.set(0,6.8,12.5);camera.lookAt(0,2.3,-13);camera.fov=Math.max(58,THREE.MathUtils.radToDeg(2*Math.atan(6.5/(12.5*camera.aspect))));camera.updateProjectionMatrix();}
setComfortCamera();
scene.add(new THREE.HemisphereLight(0xc0b7ff,0x372239,2.3));const sun=new THREE.DirectionalLight(0xffdcad,3.4);sun.position.set(-8,18,8);scene.add(sun);const blueLight=new THREE.DirectionalLight(0x6488ff,2.8);blueLight.position.set(8,7,-16);scene.add(blueLight);
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,20,14),cylGeo=new THREE.CylinderGeometry(1,1,1,16),coinGeo=new THREE.TorusGeometry(.25,.07,7,16);
const mat=(c,e=0)=>curveMaterial(new THREE.MeshStandardMaterial({color:c,roughness:.65,metalness:.18,emissive:c,emissiveIntensity:e}),route);
const mats={ground:mat('#22192e'),road:mat('#32273c'),rail:mat('#777089'),tie:mat('#554053'),gold:mat('#ffcc35',.75),white:mat('#faf1dd'),black:mat('#17141e'),pink:mat('#fd60db',1),cyan:mat('#45dbfa',1.4),purple:mat('#7960b4'),glass:mat('#acf3ff',1.1),darkglass:mat('#12213c'),red:mat('#fb7966',.6)};
function mesh(g,m,p,s,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(...p);if(s)o.scale.set(...s);parent.add(o);return o;}
const box=(m,p,s,parent)=>mesh(boxGeo,m,p,s,parent);const ball=(m,p,s,parent)=>mesh(sphereGeo,m,p,s,parent);
// A route across elevated roofs and short service bridges, high above the streets.
box(mats.ground,[0,-23,-90],[350,1,300]);
const roofEdge=mat('#a18b61',.08),windowWarm=mat('#887951',.12),windowCool=mat('#677c89',.12);
const roofSections=[];
function roofBox(m,p,s,parent){return mesh(new THREE.BoxGeometry(1,1,1,1,1,8),m,p,s,parent);}
for(let i=0;i<23;i++){
 const g=new THREE.Group();g.position.z=6-i*12;g.userData.index=i;g.userData.lanes=[];
 for(let lane=-1;lane<=1;lane++){
  const part=new THREE.Group();part.position.x=lane*2.8;g.add(part);
  roofBox(mats.purple,[0,-7.16,0],[2.78,14,12],part);roofBox(mats.road,[0,-.12,0],[2.78,.24,12],part);
  for(const side of [-1,1])roofBox(roofEdge,[side*1.35,.045,0],[.045,.03,12],part);
  // Unbroken roof surfaces avoid repetitive stripes rushing underfoot.
  g.userData.lanes.push(part);
 }
 scene.add(g);roofSections.push(g);
}
function syncRoofs(){for(const g of roofSections){
 const lanes=terrain.lanes(g.userData.index),key=g.userData.index+':'+terrain.revision;
 g.userData.lanes.forEach((p,i)=>p.visible=lanes.includes(i-1));
 if(g.userData.shapeKey===key)continue;g.userData.shapeKey=key;
 for(const p of g.userData.lanes)for(const m of p.children){
  const a=m.geometry.attributes.position;m.userData.rest??=a.array.slice();const rest=m.userData.rest;
  for(let v=0;v<a.count;v++){const worldDistance=g.userData.index*12-6-(rest[v*3+2]*m.scale.z+m.position.z);a.setX(v,rest[v*3]+terrain.offsetAt(worldDistance)/m.scale.x);}
  a.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingSphere();
 }
}}
function resetRoofs(){terrain.reset();roofSections.forEach((g,i)=>{g.position.z=6-i*12;g.userData.index=i;});syncRoofs();}
let seed=729;function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
const scenery=[];const buildingMats=['#312543','#34253e','#28273e','#3b2847','#252138'].map(c=>mat(c));
for(let i=0;i<44;i++){const side=i%2?1:-1,z=-i*5.6+15,h=7+rand()*22,w=4+rand()*5;const g=new THREE.Group();g.position.set(side*(10+rand()*12),-17,z);box(buildingMats[i%5],[0,h/2,0],[w,h,5+rand()*5],g);box(mats.purple,[0,h+.2,0],[w+.3,.3,6],g);for(let y=2;y<h-1;y+=2.2){for(let x=-w/2+1;x<w/2;x+=1.3){if(rand()>.28)box(rand()>.55?windowWarm:windowCool,[x,y,3.6],[.4,.75,.03],g);}}if(i%3===0){const ne=box(i%2?windowCool:windowWarm,[-w/2-.1,h/2,3.8],[.1,h*.6,.13],g);box(i%2?windowCool:windowWarm,[0,h*.72,3.8],[w,.1,.13],g);}scene.add(g);scenery.push(g);}
const skylineBatches=new Map();
for(const g of scenery){g.updateMatrixWorld(true);g.traverse(o=>{if(!o.isMesh)return;let batch=skylineBatches.get(o.material);if(!batch)skylineBatches.set(o.material,batch=[]);batch.push(o.matrixWorld.clone());});scene.remove(g);}
for(const [material,matrices] of skylineBatches){const batch=new THREE.InstancedMesh(boxGeo,material,matrices.length);matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.instanceMatrix.needsUpdate=true;scene.add(batch);}
const lamps=[];for(let i=0;i<18;i++){const g=new THREE.Group(),side=i%2?1:-1;g.position.set(side*6.2,-2,-i*13);box(mats.purple,[0,1,0],[.22,2,.22],g);ball(mats.gold,[0,2.1,0],[.22,.25,.22],g);g.visible=false;scene.add(g);lamps.push(g);}
const arches=[];for(let i=0;i<8;i++){const g=new THREE.Group(),side=i%2?1:-1;g.position.set(side*(9+i%3),-1,-i*30);
 for(const dx of [-1,1])for(const dz of [-1,1])box(mats.purple,[dx*.75,1.6,dz*.75],[.13,3.2,.13],g);
 mesh(cylGeo,mats.tie,[0,4,0],[1.65,2.2,1.65],g);mesh(new THREE.ConeGeometry(.95,.6,24),mats.purple,[0,5.4,0],null,g);
 for(let y=3.25;y<=4.8;y+=.7){const hoop=mesh(new THREE.TorusGeometry(.835,.035,6,24),mats.rail,[0,y,0],null,g);hoop.rotation.x=Math.PI/2;}
 scene.add(g);arches.push(g);
}
ball(new THREE.MeshBasicMaterial({color:0xffbcaf}),[-21,37,-150],[10,10,1]);
const starsGeo=new THREE.BufferGeometry();const starPos=[];for(let i=0;i<300;i++)starPos.push((rand()-.5)*300,18+rand()*80,-30-rand()*180);starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xcab8ef,size:.14,transparent:true,opacity:.7})));

const avatar=createMidknight({camera}),cat=avatar.root;scene.add(cat);
const speedTrail=createSpeedTrail(scene);
const shadow=mesh(new THREE.CircleGeometry(.7,28),new THREE.MeshBasicMaterial({color:0x080511,transparent:true,opacity:.38}),[0,.18,0],[1,1.6,1]);shadow.rotation.x=-Math.PI/2;
const physics=new CatPhysics();
let splatTime=0,splatFromY=0,splatFloor=0,splatEnded=false,motionScale=1;
let mode='menu',distance=0,coins=0,lives=3,charge=0,rush=0,shield=0,magnet=0,invincible=0,speed=12,spawnClock=0,time=0,best=0,toastTimer=0;
const districtTint=new THREE.Color('#21102f');let districtGlow=0;
let styleScore=0,combo=0,comboTimer=0,tricks=0,gates=0,awakened=0,shake=0,trailClock=0,gateHint=false;
try{best=Number(localStorage.getItem('midknight-rush-best')||0);}catch{}
$('menuBest').textContent=String(Math.floor(best)).padStart(5,'0');
let objects=[],particles=[],sound=true,audioCtx=null,beat=0;const notes=[130.81,164.81,196,261.63,130.81,196,220,164.81];
function audioInit(){if(!sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch{sound=false;}}
function tone(freq=660,dur=.1,volume=.04,type='sine'){if(!sound||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');toastTimer=1.7;}
function setMode(m){mode=m;$('menu').hidden=m!=='menu';$('hud').hidden=m==='menu';$('pauseScreen').hidden=m!=='paused';$('endScreen').hidden=m!=='over';document.body.classList.toggle('playing',m!=='menu');cat.visible=m!=='menu';shadow.visible=cat.visible;$('pounceBtn').hidden=m!=='running';$('nitroBtn').hidden=m!=='running';$('steerControls').hidden=m!=='running';if(m!=='running'){nitro.release();speedster.reset();speedTrail.reset();}adventure.setVisible(m==='running');}
function clearObjects(){objects.forEach(o=>scene.remove(o.mesh));objects=[];particles.forEach(p=>scene.remove(p.mesh));particles=[];}
function resetCity(){awakened=0;districtGlow=0;districtTint.set('#21102f');buildingMats.forEach(m=>m.emissiveIntensity=0);scene.fog.color.set('#21102f');scene.background.set('#21102f');}
function start(){if(!avatar.ready){toast(avatar.failed?"CHARACTER COULD NOT LOAD · RELOAD TO RETRY":"MIDKNIGHT IS GETTING READY…");return;}avatar.reset();audioInit();clearObjects();physics.reset();resetCity();adventure.reset();resetRoofs();nitro.reset();speedster.reset();speedTrail.reset();splatTime=0;splatEnded=false;motionScale=1;accumulator=0;distance=0;coins=0;lives=3;charge=0;rush=0;shield=0;magnet=0;invincible=2;speed=12;spawnClock=1.5;beat=0;styleScore=0;combo=0;comboTimer=0;tricks=0;gates=0;shake=0;gateHint=false;setComfortCamera();avatar.animate(0,physics,speed,time);setMode('running');toast('FOLLOW THE MOONLIGHT');updateHud();}
function home(){clearObjects();adventure.reset();rush=0;shield=0;magnet=0;physics.phase=0;$('rushFx').classList.remove('active');$('phaseFx').classList.remove('active');setMode('menu');$('menuBest').textContent=String(Math.floor(best)).padStart(5,'0');}
function pause(){if(mode==='running')setMode('paused');else if(mode==='paused'){setMode('running');audioInit();}}
function finish(){const previousBest=best;best=Math.max(best,Math.floor(distance));try{localStorage.setItem('midknight-rush-best',String(best));}catch{}$('endScore').textContent=Math.floor(distance);$('endCoins').textContent=coins;$('endBest').textContent=best;$('endStyle').textContent=styleScore.toLocaleString();$('endGates').textContent=gates;$('endTricks').textContent=tricks;$('endEyebrow').textContent=distance>previousBest?'✦ NEW PERSONAL BEST':'THE MOON WILL WAIT';$('endMessage').textContent=awakened?`${awakened} district${awakened===1?'':'s'} awakened. Leave a little more light next time.`:'Those rooftops still have secrets to find.';if(splatEnded){$('endEyebrow').textContent='CAT IS LIQUID.';$('endMessage').textContent='The wall was solid. Midknight was briefly a puddle. Ready to re-inflate?';}setMode('over');tone(164,.5,.06,'triangle');$('rushFx').classList.remove('active');$('phaseFx').classList.remove('active');}
function move(d){if(mode==='running'){physics.move(d);tone(220+d*40,.045,.014);}}
function pounceFeedback(){burst(new THREE.Vector3(physics.x,physics.y+.8,0),mats.moon,18);toast('☾ MOON POUNCE');tone(1046,.25,.055,'triangle');}
function jump(){if(mode!=='running')return;const action=physics.requestJump();if(action==='pounce')pounceFeedback();else tone(410,.1,.025);}
function moonPounce(){if(mode!=='running')return;if(physics.pounce())pounceFeedback();else toast(physics.moon<1?'MOONLIGHT RECHARGING':'LAND TO POUNCE AGAIN');}
function duck(){if(mode==='running'){physics.duck();tone(140,.1,.025);}}
const sparkGeo=new THREE.IcosahedronGeometry(.075,0);
function burst(pos,color,count=12){count=Math.min(5,Math.ceil(count*.3));for(let i=0;i<count&&particles.length<32;i++){const o=mesh(sparkGeo,color,pos.toArray());particles.push({mesh:o,v:new THREE.Vector3((Math.random()-.5)*5,Math.random()*4,(Math.random()-.5)*5),life:.65,max:.65});}}
function addStyle(label,points=100){combo=Math.min(8,combo+1);comboTimer=6;tricks++;nitro.collect(8);styleScore+=points*combo;physics.moon=Math.min(3,physics.moon+1);physics.regen=0;toast(`${label} · ×${combo}`);tone(660+combo*90,.15,.035,'triangle');}
function collect(o){coins++;nitro.collect(4);styleScore+=10*Math.max(1,combo)*(nitro.active?2:1);tone(760+(coins%5)*120,.075,.026);burst(o.mesh.position.clone().add(new THREE.Vector3(0,1,0)),mats.gold,4);}
function collectGate(o){gates++;addStyle('MOON GATE',250);burst(o.mesh.position.clone().add(new THREE.Vector3(0,1,0)),mats.moon,30);if(gates%3===0){awakened++;lives=Math.min(3,lives+1);physics.moon=3;shield=Math.max(shield,4);styleScore+=1000;districtGlow=.12+Math.min(awakened,3)*.09;districtTint.set(awakened%2?'#292047':'#312343');toast('✦ DISTRICT AWAKENED · +1000');tone(1318,.6,.07,'triangle');}}
function hit(hard=false){
 if(mode!=='running')return mode==='splat';
 if(hard){
  splatEnded=true;splatTime=0;splatFromY=physics.y;
  const supports=objects.filter(o=>o.type==='roof'||o.type==='penthouse').map(o=>({x:o.mesh.position.x,z:o.mesh.position.z,halfWidth:1.2,halfLength:o.len/2,top:2.76})).concat(adventure.surfaces());
  splatFloor=supports.filter(s=>s.top<=physics.y+.03&&Math.abs(physics.x-s.x)<s.halfWidth&&Math.abs(s.z)<s.halfLength).reduce((floor,s)=>Math.max(floor,s.top),0);
  speed=0;physics.vx=0;physics.vy=0;physics.phase=0;physics.jumpBuffer=0;physics.jumpHeld=false;physics.secondary.reset();lives=0;combo=0;comboTimer=0;rush=0;shield=0;
  setMode('splat');avatar.animateSplat(0,physics);updateHud();toast('BONK. CAT IS LIQUID.');tone(110,.14,.035,'triangle');return true;
 }
 if(invincible>0||physics.phase>0)return false;
 if(shield>0){shield=0;invincible=1.5;toast('SHIELD CLEARED THE SMOKE');return false;}
 lives--;combo=0;comboTimer=0;invincible=2.3;tone(150,.14,.025,'triangle');toast('COUGH! FIND CLEAR AIR.');if(lives<=0)finish();return mode!=='running';
}
const penthouseMats=[mat('#27657f'),mat('#735286'),mat('#457c79')];mats.moon=mat('#cfb6ff',1.7);
function createObject(type,l,z,height=0){const g=new THREE.Group();g.position.set(l*2.8+terrain.offsetAt(distance-z),height,z);let len=.8;
 if(type==='coin'){mesh(coinGeo,mats.gold,[0,1,0],null,g);ball(mats.gold,[0,1,0],[.12,.12,.07],g);}
 if(type==='penthouse'){len=8;const tm=penthouseMats[Math.floor(Math.random()*3)];box(tm,[0,1.3,0],[2.35,2.6,8],g);box(mats.road,[0,2.65,0],[2.5,.15,8.2],g);box(mats.darkglass,[0,1.12,4.02],[.85,2.1,.03],g);box(mats.gold,[.27,1.15,4.05],[.06,.06,.04],g);for(let z=-3;z<=3;z+=1.2){box(mats.rail,[0,2.77,z],[1.5,.08,.035],g);for(const side of [-1,1])box(mats.cyan,[side*1.19,1.6,z],[.025,.65,.5],g);}}
 if(type==='roof'){len=22;box(mats.purple,[0,1.32,0],[2.45,2.64,22],g);box(mats.road,[0,2.7,0],[2.5,.12,22],g);for(const s of [-1,1]){box(mats.moon,[s*1.18,2.78,0],[.065,.07,22],g);for(let z=-9;z<=9;z+=3)box(mats.gold,[s*1.235,1.4,z],[.025,.55,.6],g);}for(let z=-8;z<=8;z+=4)box(mats.gold,[0,2.78,z],[.5,.02,.25],g);}
 if(type==='barrier'){box(mats.rail,[0,.54,0],[2.15,1.08,.6],g);box(mats.purple,[0,1.09,0],[2.25,.07,.7],g);for(let x=-.9;x<=.9;x+=.15)box(mats.darkglass,[x,.55,.31],[.05,.74,.02],g);box(mats.gold,[.8,.92,.33],[.15,.08,.02],g);}
 if(type==='overhead'){for(const side of [-1,1])box(mats.purple,[side*1.08,1.5,0],[.15,3,.24],g);box(mats.rail,[0,2.14,0],[2.35,1.25,.38],g);for(let x=-.9;x<=.9;x+=.3)box(mats.purple,[x,2.14,.21],[.06,1.25,.03],g);box(mats.gold,[0,1.51,.22],[.6,.08,.04],g);}
 if(type==='ramp'){len=2.6;const ramp=box(mats.gold,[0,.35,0],[2.3,.12,2.7],g);ramp.rotation.x=.3;for(const s of [-1,1])box(mats.white,[s*.9,.4,0],[.07,.1,2.4],g);}
 if(type==='shield'||type==='magnet'){const m=type==='shield'?mats.cyan:mats.pink;ball(m,[0,1.2,0],[.4,.4,.4],g);const ring=mesh(new THREE.TorusGeometry(.6,.035,8,24),m,[0,1.2,0],null,g);ring.rotation.x=.5;}
 if(type==='gate'){len=1;mesh(new THREE.TorusGeometry(.9,.065,8,40),mats.moon,[0,1,0],null,g);const inside=mesh(new THREE.TorusGeometry(.68,.035,6,30,Math.PI*1.5),mats.gold,[0,1,.02],null,g);inside.rotation.z=.65;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ball(mats.gold,[Math.cos(a)*1.1,1+Math.sin(a)*1.1,0],[.075,.075,.075],g);}box(mats.moon,[0,-height/2,0],[.035,Math.max(.1,height),.035],g);}
 scene.add(g);const obj={type,l,mesh:g,len,done:false,height,previousZ:z,close:false,cleared:false,failed:false};objects.push(obj);return obj;
}
const adventure=createAdventure({scene,camera,physics,route,box,ball,mesh,mats,mat,createObject,toast,hit,addStyle,tone,scheduleRoute:(start,side)=>{terrain.schedule(start,side);syncRoofs();},getState:()=>({distance,speed,time,styleScore,rush})});
function updateHud(){$('score').textContent=Math.floor(distance);$('coins').textContent=coins;$('bestHud').textContent=`BEST ${best} m`;$('hearts').textContent='♥ '.repeat(Math.max(lives,0))+'♡ '.repeat(3-Math.max(lives,0));$('hearts').setAttribute('aria-label',`${lives} lives`);$('charge').style.width=nitro.fuel+'%';$('chargeLabel').textContent=Math.floor(nitro.fuel)+'%';$('nitroBtn').classList.toggle('active',nitro.active);$('nitroBtn').setAttribute('aria-pressed',String(nitro.held));$('nitroFuel').textContent=Math.floor(nitro.fuel)+'%';$('nitroMode').textContent=nitro.active?'ϟ SPEEDSTER':'ϟ NITRO';$('powerStatus').textContent=nitro.active?'SPEEDSTER · WORLD IN SLOW MOTION':shield>0?`SHIELD · ${Math.ceil(shield)}s`:magnet>0?`GOLD MAGNET · ${Math.ceil(magnet)}s`:'HOLD N / NITRO · GOLD REFILLS FUEL';$('rushFx').classList.toggle('active',rush>0);$('phaseFx').classList.toggle('active',physics.phase>0);$('district').textContent=`WAKE THE CITY · ${gates%3} / 3 GATES`;$('moonCount').textContent='● '.repeat(physics.moon)+'○ '.repeat(3-physics.moon);$('moonRegen').style.width=physics.moon===3?'100%':`${physics.regen/9*100}%`;$('styleScore').textContent=styleScore.toLocaleString();$('combo').textContent=combo?`×${combo} · ${comboTimer.toFixed(1)}s`:'FIND YOUR FLOW';$('combo').classList.toggle('hot',combo>1);$('pounceBtn').disabled=physics.moon<1||physics.airPounced;$('pounceLabel').textContent='POUNCE';$('pounceBtn').setAttribute('aria-label',`Moon pounce, ${physics.moon} charges`);}
function update(dt){
 if(mode==='splat'){splatTime+=dt;const fall=Math.min(1,splatTime/.55);physics.y=splatFromY+(splatFloor-splatFromY)*(fall*fall*(3-2*fall));avatar.animateSplat(splatTime,physics);shadow.position.set(physics.x,splatFloor+.035,0);shadow.scale.set(1.65,1.6,1);if(splatTime>=1.15)finish();return;}
 if(mode!=='running'&&mode!=='menu')return;
 const realDt=dt;if(mode==='running'){nitro.step(realDt);speedster.step(realDt,nitro.active);}dt*=speedster.worldScale;
 time+=dt;const lightBlend=1-Math.exp(-dt*.7);scene.fog.color.lerp(districtTint,lightBlend);scene.background.copy(scene.fog.color);buildingMats.forEach(m=>m.emissiveIntensity=THREE.MathUtils.damp(m.emissiveIntensity,districtGlow,.7,dt));toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');
 if(mode==='running'){const targetSpeed=12+Math.min(distance/900,4)+(nitro.active?4:0);if(physics.grounded)speed=THREE.MathUtils.damp(speed,targetSpeed,1.8,realDt);}const step=(mode==='running'?speed:0)*dt;
 for(const o of roofSections){o.position.z+=step;if(o.position.z>18){o.position.z-=276;o.userData.index+=23;}}syncRoofs();terrain.prune(distance);
 for(const a of [arches])for(const o of a){o.position.z+=step;if(o.position.z>22)o.position.z-=a===scenery?246.4:a===lamps?234:240;}
 if(mode==='menu')return;
 distance+=step;invincible=Math.max(0,invincible-dt);rush=Math.max(0,rush-dt);shield=Math.max(0,shield-dt);magnet=Math.max(0,magnet-dt);shake=Math.max(0,shake-dt);comboTimer=Math.max(0,comboTimer-dt);if(comboTimer===0)combo=0;
 for(const o of objects){o.previousZ=o.mesh.position.z;o.mesh.position.z+=step;}
 adventure.advance(dt,step);
 const surfaces=objects.filter(o=>o.type==='penthouse'||o.type==='roof').map(o=>({x:o.mesh.position.x,z:o.mesh.position.z,halfWidth:1.2,halfLength:o.len/2,top:2.76})).concat(adventure.surfaces());
 physics.step(dt,surfaces,terrain.supported(distance,physics.x),terrain.offsetAt(distance),realDt);if(physics.y < -3){lives=0;nitro.release();finish();$('endEyebrow').textContent='MIND THE GAP';$('endMessage').textContent='Choose a lit roof, or jump across the gap. Your next run starts here.';return;}adventure.collide(dt);if(mode!=='running')return;
 if(physics.landed&&physics.impact>7){burst(new THREE.Vector3(physics.x,physics.y+.12,0),mats.white,5);tone(95,.06,.023,'triangle');}
 spawnClock-=dt;if(spawnClock<=0&&adventure.canSpawn()){for(let k=0;k<6;k++){const z=-38-k*2.2,lanes=terrain.lanes(terrain.indexAt(distance-z));createObject('coin',lanes.includes(0)?0:lanes[0],z);}spawnClock=2.8;}beat+=dt;if(beat>.26){beat=0;tone(notes[Math.floor(time/.26)%8],.13,.012,'triangle');}
 for(let i=objects.length-1;i>=0;i--){const o=objects[i],dz=o.mesh.position.z,dx=Math.abs(o.mesh.position.x-physics.x),overlap=sweptOverlap(o.previousZ,dz,o.len/2);
   if(['coin','shield','magnet','gate'].includes(o.type)){
     if(o.type!=='gate')o.mesh.rotation.y+=dt*3;else o.mesh.rotation.z=Math.sin(time*1.4)*.08;
     if(magnet>0&&o.type==='coin'&&dz>-12&&dz<2){o.mesh.position.x=THREE.MathUtils.damp(o.mesh.position.x,physics.x,9,dt);o.mesh.position.y=THREE.MathUtils.damp(o.mesh.position.y,physics.y,9,dt);}
     const targetY=o.mesh.position.y+(o.type==='gate'?1:1.1),centerY=physics.y+physics.height*.55;
     if(!o.done&&overlap&&Math.abs(o.mesh.position.x-physics.x)<(o.type==='gate'?1.05:1.1)&&Math.abs(targetY-centerY)<(o.type==='gate'?.85:1.15)){o.done=true;if(o.type==='coin')collect(o);else if(o.type==='gate')collectGate(o);else{if(o.type==='shield')shield=12;else magnet=10;toast(o.type==='shield'?'SHIELD UP!':'GOLD MAGNET!');tone(880,.3,.04);}scene.remove(o.mesh);objects.splice(i,1);continue;}
   }else if(o.type==='ramp'){
     if(!o.done&&overlap&&dx<1.05&&physics.y<.7){const destination=surfaces.filter(s=>s.z<0&&Math.abs(s.x-physics.x)<1.2).sort((a,b)=>b.z-a.z)[0];const launch=o.routeRamp?rampVelocity(speed,physics.y,o.routeTop??2.76):destination?pounceVelocity(physics.y,destination.top,Math.max(.65,(-destination.z-destination.halfLength+Math.min(3,destination.halfLength))/speed)):14.5;physics.launch(launch);o.done=true;toast('ROOFTOP ROUTE');tone(520,.25,.04);}
   }else{
     const horizontal=dx<1.42;const vertical=(o.type==='penthouse'||o.type==='roof')?physics.y<2.65:o.type==='barrier'?physics.y<1.09&&physics.y+physics.height>.36:physics.y+physics.height>1.46&&physics.y<2.79;
     if(overlap){if(dx>1.42&&dx<1.91)o.close=true;if(horizontal&&!vertical)o.cleared=true;
       if(horizontal&&vertical&&!o.done){o.done=true;o.failed=true;hit(true);return;}}
     if(!o.rewarded&&dz>o.len/2+.4){o.rewarded=true;if(!o.failed&&(o.close||o.cleared||o.phased)){if(o.phased)addStyle('GHOST PAWS',150);else if(o.close)addStyle('WHISKER CLOSE',120);else if(o.type==='overhead')addStyle('SILKY SLIDE');else if(o.type==='penthouse'||o.type==='roof')addStyle('ROOFTOP FLOW',180);else addStyle('CLEAN LEAP');}}
   }
   if(dz>25){scene.remove(o.mesh);objects.splice(i,1);}
 }
 
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.v.y-=8*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.position.z+=step*.2;p.mesh.scale.setScalar(Math.max(.01,p.life/p.max));if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}}
}
let last=performance.now(),accumulator=0,hudClock=0;function frame(now){const elapsed=Math.min((now-last)/1000,.1);last=now;motionScale=1;accumulator+=elapsed;while(accumulator>=STEP){update(STEP);accumulator-=STEP;}if(mode==='running'){
 cat.visible=true;shadow.visible=terrain.supported(distance,physics.x);shadow.position.set(physics.x,physics.y>2.75?2.8:.035,0);shadow.scale.set(1-physics.y*.055,1.6-physics.y*.09,1);shadow.material.opacity=Math.max(.1,.38-physics.y*.045);
 // Fixed camera and fixed FOV: jumping, turns and Rush never move the horizon.
 avatar.animate(elapsed,physics,speed,time,shield>0||rush>0,speedster.strideScale);speedTrail.update(elapsed,physics,speedster.amount);adventure.render(elapsed*speedster.worldScale);}
 hudClock+=elapsed;if(hudClock>=.06){if(mode==='running')updateHud();hudClock=0;}renderer.render(scene,camera);requestAnimationFrame(frame);}
setMode('menu');requestAnimationFrame(frame);
addEventListener('resize',()=>{setComfortCamera();renderer.setSize(innerWidth,innerHeight);});
$('startBtn').onclick=start;$('againBtn').onclick=start;$('homeBtn').onclick=home;$('quitBtn').onclick=home;$('pauseBtn').onclick=pause;$('resumeBtn').onclick=pause;$('pounceBtn').addEventListener('pointerdown',e=>{e.preventDefault();$('pounceBtn').setPointerCapture(e.pointerId);moonPounce();});
for(const [id,direction] of [['leftBtn',-1],['rightBtn',1]])$(id).onclick=()=>move(direction);
$('pounceBtn').onclick=e=>{if(e.detail===0)moonPounce();};
$('nitroBtn').addEventListener('pointerdown',e=>{e.preventDefault();$('nitroBtn').setPointerCapture(e.pointerId);if(mode==='running')nitro.press();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('nitroBtn').addEventListener(event,()=>nitro.release());
$('nitroBtn').addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();if(mode==='running')nitro.press();}});
$('nitroBtn').addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();nitro.release();}});
addEventListener('blur',()=>{nitro.release();if(mode==='running')pause();});
let helpPaused=false;$('helpBtn').onclick=()=>{helpPaused=mode==='running';if(helpPaused)pause();$('help').showModal();};function closeHelp(){$('help').close();if(helpPaused&&mode==='paused')pause();helpPaused=false;}$('closeHelp').onclick=closeHelp;$('gotIt').onclick=closeHelp;$('help').addEventListener('cancel',e=>{e.preventDefault();closeHelp();});
$('soundBtn').onclick=()=>{sound=!sound;$('soundBtn').textContent=sound?'♫':'♪̸';$('soundBtn').setAttribute('aria-label',sound?'Mute sound':'Enable sound');if(sound){audioInit();tone();}};
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch{toast('FULLSCREEN UNAVAILABLE');}};
addEventListener('keydown',e=>{if($('help').open||['leftBtn','rightBtn'].includes(e.target?.id))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space'&&['menu','over'].includes(mode)){start();return;}if(e.code==='KeyP'||e.code==='Escape'){pause();return;}if(mode!=='running')return;if(e.code==='KeyN'){nitro.press();return;}if(e.code==='ArrowLeft'||e.code==='KeyA')move(-1);if(e.code==='ArrowRight'||e.code==='KeyD')move(1);if(['ArrowUp','KeyW','Space'].includes(e.code))jump();if(['ArrowDown','KeyS'].includes(e.code))duck();if(['ShiftLeft','ShiftRight','KeyE'].includes(e.code))moonPounce();});
addEventListener('keyup',e=>{if(e.code==='KeyN')nitro.release();if(mode!=='running')return;if(['ArrowUp','KeyW','Space'].includes(e.code))physics.releaseJump();});
let touchX=0,touchY=0,activePointer=null;$('world').addEventListener('pointerdown',e=>{activePointer=e.pointerId;touchX=e.clientX;touchY=e.clientY;$('world').setPointerCapture(e.pointerId);});$('world').addEventListener('pointerup',e=>{if(activePointer!==e.pointerId)return;activePointer=null;const dx=e.clientX-touchX,dy=e.clientY-touchY;if(Math.max(Math.abs(dx),Math.abs(dy))<15){jump();return;}if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else if(dy<0)jump();else duck();});$('world').addEventListener('pointercancel',()=>activePointer=null);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')pause();});
$('startBtn').disabled=true;$('startBtn').innerHTML='GETTING READY <span>☾</span>';
avatar.loaded.then(()=>{$('startBtn').disabled=false;$('startBtn').innerHTML='LET’S RUN <span>↗</span>';}).catch(()=>{$('startBtn').disabled=true;$('startBtn').innerHTML='RELOAD TO RETRY';toast('MIDKNIGHT COULD NOT LOAD');});
const art=$('mascotArt');art.onload=()=>{art.hidden=false;};art.src='assets/mascot.png';
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const snapshot=()=>({state:mode,distance:Math.floor(distance),gold:coins,lives,best,moonlight:physics.moon,moonGates:gates,styleScore,nitro:{fuel:Math.floor(nitro.fuel),active:nitro.active},rooftops:adventure.snapshot()});const register=t=>{try{Promise.resolve(document.modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});}catch{}};register({name:'read_run_state',description:'Read the current Midknight Rush score, moonlight and run state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>snapshot()});register({name:'control_run',description:'Start a new run from the menu or results, pause an active run, or resume a paused run.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','pause','resume']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||!['start','pause','resume'].includes(input.action))throw Error('Choose start, pause or resume.');if(input.action==='start'&&['menu','over'].includes(mode))start();else if(input.action==='pause'&&mode==='running')pause();else if(input.action==='resume'&&mode==='paused')pause();else throw Error('That action is unavailable in the current state.');return snapshot();}});addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}


