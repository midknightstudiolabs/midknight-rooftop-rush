import * as THREE from './three.module.js';
import {createMidknight} from './character-sprite.js?v=steady8';
import {CatPhysics,STEP,sweptOverlap} from './physics.js?v=steady8';

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color('#21102f');scene.fog=new THREE.Fog('#21102f',35,165);
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});}catch(e){$('loadError').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,260);camera.position.set(9,8,15);camera.lookAt(0,1,-35);
scene.add(new THREE.HemisphereLight(0xc0b7ff,0x372239,2.3));const sun=new THREE.DirectionalLight(0xffdcad,3.4);sun.position.set(-8,18,8);scene.add(sun);const blueLight=new THREE.DirectionalLight(0x6488ff,2.8);blueLight.position.set(8,7,-16);scene.add(blueLight);
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,20,14),cylGeo=new THREE.CylinderGeometry(1,1,1,16),coinGeo=new THREE.TorusGeometry(.25,.07,7,16);
const mat=(c,e=0)=>new THREE.MeshStandardMaterial({color:c,roughness:.65,metalness:.18,emissive:c,emissiveIntensity:e});
const mats={ground:mat('#22192e'),road:mat('#32273c'),rail:mat('#777089'),tie:mat('#554053'),gold:mat('#ffcc35',.75),white:mat('#faf1dd'),black:mat('#17141e'),pink:mat('#fd60db',1),cyan:mat('#45dbfa',1.4),purple:mat('#7960b4'),glass:mat('#acf3ff',1.1),darkglass:mat('#12213c'),red:mat('#fb7966',.6)};
function mesh(g,m,p,s,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(...p);if(s)o.scale.set(...s);parent.add(o);return o;}
const box=(m,p,s,parent)=>mesh(boxGeo,m,p,s,parent);const ball=(m,p,s,parent)=>mesh(sphereGeo,m,p,s,parent);
// A route across elevated roofs and short service bridges, high above the streets.
box(mats.ground,[0,-23,-90],[350,1,300]);
const roofSections=[];
for(let i=0;i<11;i++){
 const g=new THREE.Group();g.position.z=6-i*24;
 box(mats.purple,[0,-7.16,0],[10,14,22],g);box(mats.road,[0,-.12,0],[10.4,.24,22.2],g);
 for(const side of [-1,1]){
   box(mats.purple,[side*5.08,.28,0],[.24,.56,22],g);
   box(mats.moon??mats.cyan,[side*5.08,.57,0],[.28,.055,22],g);
   for(let z=-9;z<=9;z+=3)box(mats.gold,[side*5.015,-3,z],[.025,1.2,.75],g);
   const planter=box(mats.purple,[side*4.5,.26,6],[.65,.5,2.2],g);
   ball(mats.black,[side*4.5,.67,6],[.4,.35,1],g);
 }
 for(let z=-9;z<=9;z+=3)box(mats.tie,[0,.004,z],[9.7,.008,.025],g);
 // Grating and three warm-lit bridge paths connect successive rooftops.
 box(mats.purple,[0,-.14,-12],[9.7,.24,2.4],g);
 for(let lane=-1;lane<=1;lane++){
   box(mats.rail,[lane*2.8,-.015,-12],[2.35,.06,2.5],g);
   for(const side of [-1,1])box(mats.gold,[lane*2.8+side*1.14,.025,-12],[.04,.025,2.4],g);
 }
 scene.add(g);roofSections.push(g);
}
let seed=729;function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
const scenery=[];const buildingMats=['#312543','#34253e','#28273e','#3b2847','#252138'].map(c=>mat(c));
for(let i=0;i<44;i++){const side=i%2?1:-1,z=-i*5.6+15,h=7+rand()*22,w=4+rand()*5;const g=new THREE.Group();g.position.set(side*(10+rand()*12),-17,z);box(buildingMats[i%5],[0,h/2,0],[w,h,5+rand()*5],g);box(mats.purple,[0,h+.2,0],[w+.3,.3,6],g);for(let y=2;y<h-1;y+=2.2){for(let x=-w/2+1;x<w/2;x+=1.3){if(rand()>.28)box(rand()>.55?mats.gold:mats.glass,[x,y,3.6],[.4,.75,.03],g);}}if(i%3===0){const ne=box(i%2?mats.cyan:mats.pink,[-w/2-.1,h/2,3.8],[.1,h*.6,.13],g);box(i%2?mats.cyan:mats.pink,[0,h*.72,3.8],[w,.1,.13],g);}scene.add(g);scenery.push(g);}
const lamps=[];for(let i=0;i<18;i++){const g=new THREE.Group(),side=i%2?1:-1;g.position.set(side*6.2,-2,-i*13);box(mats.purple,[0,1,0],[.22,2,.22],g);ball(mats.gold,[0,2.1,0],[.22,.25,.22],g);scene.add(g);lamps.push(g);}
const arches=[];for(let i=0;i<8;i++){const g=new THREE.Group(),side=i%2?1:-1;g.position.set(side*(9+i%3),-1,-i*30);
 for(const dx of [-1,1])for(const dz of [-1,1])box(mats.purple,[dx*.75,1.6,dz*.75],[.13,3.2,.13],g);
 mesh(cylGeo,mats.tie,[0,4,0],[1.65,2.2,1.65],g);mesh(new THREE.ConeGeometry(.95,.6,24),mats.purple,[0,5.4,0],null,g);
 for(let y=3.25;y<=4.8;y+=.7){const hoop=mesh(new THREE.TorusGeometry(.835,.035,6,24),mats.rail,[0,y,0],null,g);hoop.rotation.x=Math.PI/2;}
 scene.add(g);arches.push(g);
}
ball(new THREE.MeshBasicMaterial({color:0xffbcaf}),[-21,37,-150],[10,10,1]);
const starsGeo=new THREE.BufferGeometry();const starPos=[];for(let i=0;i<300;i++)starPos.push((rand()-.5)*300,18+rand()*80,-30-rand()*180);starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xcab8ef,size:.14,transparent:true,opacity:.7})));

const avatar=createMidknight({camera}),cat=avatar.root;scene.add(cat);
const shadow=mesh(new THREE.CircleGeometry(.7,28),new THREE.MeshBasicMaterial({color:0x080511,transparent:true,opacity:.38}),[0,.18,0],[1,1.6,1]);shadow.rotation.x=-Math.PI/2;
const physics=new CatPhysics();
let mode='menu',distance=0,coins=0,lives=3,charge=0,rush=0,shield=0,magnet=0,invincible=0,speed=16,spawnClock=0,time=0,best=0,toastTimer=0;
const districtTint=new THREE.Color('#21102f');let districtGlow=0;
let styleScore=0,combo=0,comboTimer=0,tricks=0,gates=0,awakened=0,shake=0,trailClock=0,gateHint=false;
try{best=Number(localStorage.getItem('midknight-rush-best')||0);}catch{}
$('menuBest').textContent=String(Math.floor(best)).padStart(5,'0');
let objects=[],particles=[],sound=true,audioCtx=null,beat=0;const notes=[130.81,164.81,196,261.63,130.81,196,220,164.81];
function audioInit(){if(!sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch{sound=false;}}
function tone(freq=660,dur=.1,volume=.04,type='sine'){if(!sound||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');toastTimer=1.7;}
function setMode(m){mode=m;$('menu').hidden=m!=='menu';$('hud').hidden=m==='menu';$('pauseScreen').hidden=m!=='paused';$('endScreen').hidden=m!=='over';document.body.classList.toggle('playing',m!=='menu');cat.visible=m!=='menu';shadow.visible=cat.visible;$('pounceBtn').hidden=m!=='running';}
function clearObjects(){objects.forEach(o=>scene.remove(o.mesh));objects=[];particles.forEach(p=>scene.remove(p.mesh));particles=[];}
function resetCity(){awakened=0;districtGlow=0;districtTint.set('#21102f');buildingMats.forEach(m=>m.emissiveIntensity=0);scene.fog.color.set('#21102f');scene.background.set('#21102f');}
function start(){if(!avatar.ready){toast(avatar.failed?"CHARACTER COULD NOT LOAD · RELOAD TO RETRY":"MIDKNIGHT IS GETTING READY…");return;}avatar.reset();audioInit();clearObjects();physics.reset();resetCity();wave=0;distance=0;coins=0;lives=3;charge=0;rush=0;shield=0;magnet=0;invincible=2;speed=16;spawnClock=1.5;beat=0;styleScore=0;combo=0;comboTimer=0;tricks=0;gates=0;shake=0;gateHint=false;camera.position.set(0,4.1,8.3);camera.lookAt(0,1.25,-14);camera.fov=58;camera.updateProjectionMatrix();avatar.animate(0,physics,speed,time);setMode('running');toast('FOLLOW THE MOONLIGHT');updateHud();}
function home(){clearObjects();rush=0;shield=0;magnet=0;physics.phase=0;$('rushFx').classList.remove('active');$('phaseFx').classList.remove('active');setMode('menu');$('menuBest').textContent=String(Math.floor(best)).padStart(5,'0');}
function pause(){if(mode==='running')setMode('paused');else if(mode==='paused'){setMode('running');audioInit();}}
function finish(){const previousBest=best;best=Math.max(best,Math.floor(distance));try{localStorage.setItem('midknight-rush-best',String(best));}catch{}$('endScore').textContent=Math.floor(distance);$('endCoins').textContent=coins;$('endBest').textContent=best;$('endStyle').textContent=styleScore.toLocaleString();$('endGates').textContent=gates;$('endTricks').textContent=tricks;$('endEyebrow').textContent=distance>previousBest?'✦ NEW PERSONAL BEST':'THE MOON WILL WAIT';$('endMessage').textContent=awakened?`${awakened} district${awakened===1?'':'s'} awakened. Leave a little more light next time.`:'Those rooftops still have secrets to find.';setMode('over');tone(164,.5,.06,'triangle');$('rushFx').classList.remove('active');$('phaseFx').classList.remove('active');}
function move(d){if(mode==='running'){physics.move(d);tone(220+d*40,.045,.014);}}
function pounceFeedback(){burst(new THREE.Vector3(physics.x,physics.y+.8,0),mats.moon,18);toast('☾ MOON POUNCE');tone(1046,.25,.055,'triangle');}
function jump(){if(mode!=='running')return;const action=physics.requestJump();if(action==='pounce')pounceFeedback();else tone(410,.1,.025);}
function moonPounce(){if(mode!=='running')return;if(physics.pounce())pounceFeedback();else toast(physics.moon<1?'MOONLIGHT RECHARGING':'LAND TO POUNCE AGAIN');}
function duck(){if(mode==='running'){physics.duck();tone(140,.1,.025);}}
const sparkGeo=new THREE.IcosahedronGeometry(.075,0);
function burst(pos,color,count=12){count=Math.min(5,Math.ceil(count*.3));for(let i=0;i<count&&particles.length<32;i++){const o=mesh(sparkGeo,color,pos.toArray());particles.push({mesh:o,v:new THREE.Vector3((Math.random()-.5)*5,Math.random()*4,(Math.random()-.5)*5),life:.65,max:.65});}}
function addStyle(label,points=100){combo=Math.min(8,combo+1);comboTimer=6;tricks++;styleScore+=points*combo;physics.moon=Math.min(3,physics.moon+1);physics.regen=0;toast(`${label} · ×${combo}`);tone(660+combo*90,.15,.035,'triangle');}
function collect(o){coins++;styleScore+=10*Math.max(1,combo);tone(760+(coins%5)*120,.075,.026);burst(o.mesh.position.clone().add(new THREE.Vector3(0,1,0)),mats.gold,4);if(rush<=0&&++charge>=20){charge=0;rush=7;toast('ϟ MIDKNIGHT RUSH!');tone(1046,.4,.06,'triangle');}}
function collectGate(o){gates++;addStyle('MOON GATE',250);burst(o.mesh.position.clone().add(new THREE.Vector3(0,1,0)),mats.moon,30);if(gates%3===0){awakened++;lives=Math.min(3,lives+1);physics.moon=3;shield=Math.max(shield,4);styleScore+=1000;districtGlow=.12+Math.min(awakened,3)*.09;districtTint.set(awakened%2?'#292047':'#312343');toast('✦ DISTRICT AWAKENED · +1000');tone(1318,.6,.07,'triangle');}}
function hit(){if(invincible>0||physics.phase>0)return;if(shield>0){shield=0;invincible=1.5;toast('SHIELD SAVED YOU');burst(new THREE.Vector3(physics.x,physics.y+1,0),mats.cyan,18);return;}lives--;combo=0;comboTimer=0;invincible=2.3;shake=.2;speed=Math.max(13,speed-4);burst(new THREE.Vector3(physics.x,physics.y+1,0),mats.red,15);tone(80,.24,.08,'sawtooth');toast(lives===1?'LAST HEART. MAKE IT COUNT.':'SHAKE IT OFF!');if(lives<=0)finish();}
const penthouseMats=[mat('#27657f'),mat('#735286'),mat('#457c79')];mats.moon=mat('#cfb6ff',1.7);
function createObject(type,l,z,height=0){const g=new THREE.Group();g.position.set(l*2.8,height,z);let len=.8;
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
let wave=0;function spawn(){wave++;const l=Math.floor(Math.random()*3)-1,z=-105;const roofWave=wave%6===0;const type=roofWave?'roof':wave<3?'barrier':Math.random()<.42?'penthouse':Math.random()<.5?'overhead':'barrier';createObject(type,l,z);
 if(roofWave||(type==='penthouse'&&wave%2===0)){createObject('ramp',l,z+(roofWave?21:14));for(let k=0;k<(roofWave?10:4);k++)createObject('coin',l,z+5-k*1.5,2.76);if(roofWave)createObject('gate',l,z,4);}
 const safe=[-1,0,1].filter(v=>v!==l),cl=safe[Math.floor(Math.random()*2)];for(let k=0;k<7;k++)createObject('coin',cl,z+12-k*1.6);
 if(wave%3===0&&!roofWave){createObject('gate',cl,z-4,3.7);if(!gateHint){gateHint=true;toast('☾ JUMP AGAIN TO CATCH MOON GATES');}}
 if(distance>500&&wave%4===0)createObject('barrier',safe.find(v=>v!==cl),z);
 if(wave%5===0)createObject(wave%10===0?'shield':'magnet',cl,z+17);
}
function updateHud(){$('score').textContent=Math.floor(distance);$('coins').textContent=coins;$('bestHud').textContent=`BEST ${best} m`;$('hearts').textContent='♥ '.repeat(Math.max(lives,0))+'♡ '.repeat(3-Math.max(lives,0));$('hearts').setAttribute('aria-label',`${lives} lives`);$('charge').style.width=(rush>0?rush/7*100:charge/20*100)+'%';$('chargeLabel').textContent=rush>0?`${rush.toFixed(1)}s`:charge+' / 20';$('powerStatus').textContent=rush>0?'UNSTOPPABLE · KEEP RUNNING':shield>0?`SHIELD · ${Math.ceil(shield)}s`:magnet>0?`GOLD MAGNET · ${Math.ceil(magnet)}s`:'20 gold unleashes Midknight Rush';$('rushFx').classList.toggle('active',rush>0);$('phaseFx').classList.toggle('active',physics.phase>0);$('district').textContent=`WAKE THE CITY · ${gates%3} / 3 GATES`;$('moonCount').textContent='● '.repeat(physics.moon)+'○ '.repeat(3-physics.moon);$('moonRegen').style.width=physics.moon===3?'100%':`${physics.regen/9*100}%`;$('styleScore').textContent=styleScore.toLocaleString();$('combo').textContent=combo?`×${combo} · ${comboTimer.toFixed(1)}s`:'FIND YOUR FLOW';$('combo').classList.toggle('hot',combo>1);$('pounceBtn').disabled=physics.moon<1||physics.airPounced;$('pounceBtn').setAttribute('aria-label',`Moon pounce, ${physics.moon} charges`);}
function update(dt){
 if(mode!=='running'&&mode!=='menu')return;time+=dt;const lightBlend=1-Math.exp(-dt*.7);scene.fog.color.lerp(districtTint,lightBlend);scene.background.copy(scene.fog.color);buildingMats.forEach(m=>m.emissiveIntensity=THREE.MathUtils.damp(m.emissiveIntensity,districtGlow,.7,dt));toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');
 if(mode==='running'){const targetSpeed=16+Math.min(distance/180,15)+(rush>0?9:0);speed=THREE.MathUtils.damp(speed,targetSpeed,2.8,dt);}const step=(mode==='running'?speed:3)*dt;
 for(const a of [roofSections,scenery,lamps,arches])for(const o of a){o.position.z+=step;if(o.position.z>22)o.position.z-=a===roofSections?264:a===scenery?246.4:a===lamps?234:240;}
 if(mode==='menu')return;
 distance+=step;invincible=Math.max(0,invincible-dt);rush=Math.max(0,rush-dt);shield=Math.max(0,shield-dt);magnet=Math.max(0,magnet-dt);shake=Math.max(0,shake-dt);comboTimer=Math.max(0,comboTimer-dt);if(comboTimer===0)combo=0;
 for(const o of objects){o.previousZ=o.mesh.position.z;o.mesh.position.z+=step;}
 const surfaces=objects.filter(o=>o.type==='penthouse'||o.type==='roof').map(o=>({x:o.mesh.position.x,z:o.mesh.position.z,halfWidth:1.2,halfLength:o.len/2,top:2.76}));
 physics.step(dt,surfaces);
 if(physics.landed&&physics.impact>7){burst(new THREE.Vector3(physics.x,physics.y+.12,0),mats.white,5);tone(95,.06,.023,'triangle');}
 spawnClock-=dt;if(spawnClock<=0){spawn();spawnClock=2.05;}beat+=dt;if(beat>.26){beat=0;tone(notes[Math.floor(time/.26)%8],.13,.012,'triangle');}
 for(let i=objects.length-1;i>=0;i--){const o=objects[i],dz=o.mesh.position.z,dx=Math.abs(o.mesh.position.x-physics.x),overlap=sweptOverlap(o.previousZ,dz,o.len/2);
   if(['coin','shield','magnet','gate'].includes(o.type)){
     if(o.type!=='gate')o.mesh.rotation.y+=dt*3;else o.mesh.rotation.z=Math.sin(time*1.4)*.08;
     if(magnet>0&&o.type==='coin'&&dz>-12&&dz<2){o.mesh.position.x=THREE.MathUtils.damp(o.mesh.position.x,physics.x,9,dt);o.mesh.position.y=THREE.MathUtils.damp(o.mesh.position.y,physics.y,9,dt);}
     const targetY=o.mesh.position.y+(o.type==='gate'?1:1.1),centerY=physics.y+physics.height*.55;
     if(!o.done&&overlap&&Math.abs(o.mesh.position.x-physics.x)<(o.type==='gate'?1.05:1.1)&&Math.abs(targetY-centerY)<(o.type==='gate'?.85:1.15)){o.done=true;if(o.type==='coin')collect(o);else if(o.type==='gate')collectGate(o);else{if(o.type==='shield')shield=12;else magnet=10;toast(o.type==='shield'?'SHIELD UP!':'GOLD MAGNET!');tone(880,.3,.04);}scene.remove(o.mesh);objects.splice(i,1);continue;}
   }else if(o.type==='ramp'){
     if(!o.done&&overlap&&dx<1.05&&physics.y<.7){physics.launch(14.5);o.done=true;toast('ROOFTOP ROUTE');tone(520,.25,.04);}
   }else{
     const horizontal=dx<1.42;const vertical=(o.type==='penthouse'||o.type==='roof')?physics.y<2.65:o.type==='barrier'?physics.y<1.09&&physics.y+physics.height>.36:physics.y+physics.height>1.46&&physics.y<2.79;
     if(overlap){if(dx>1.42&&dx<1.91)o.close=true;if(horizontal&&!vertical)o.cleared=true;
       if(horizontal&&vertical&&!o.done){if(rush>0){burst(o.mesh.position.clone().add(new THREE.Vector3(0,1,0)),mats.gold,20);scene.remove(o.mesh);objects.splice(i,1);continue;}if(physics.phase>0)o.phased=true;else{hit();o.done=true;o.failed=true;if(mode==='over')break;}}}
     if(!o.rewarded&&dz>o.len/2+.4){o.rewarded=true;if(!o.failed&&(o.close||o.cleared||o.phased)){if(o.phased)addStyle('GHOST PAWS',150);else if(o.close)addStyle('WHISKER CLOSE',120);else if(o.type==='overhead')addStyle('SILKY SLIDE');else if(o.type==='penthouse'||o.type==='roof')addStyle('ROOFTOP FLOW',180);else addStyle('CLEAN LEAP');}}
   }
   if(dz>25){scene.remove(o.mesh);objects.splice(i,1);}
 }
 
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.v.y-=8*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.position.z+=step*.2;p.mesh.scale.setScalar(Math.max(.01,p.life/p.max));if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}}
}
let last=performance.now(),accumulator=0,hudClock=0;function frame(now){const elapsed=Math.min((now-last)/1000,.1);last=now;accumulator+=elapsed;while(accumulator>=STEP){update(STEP);accumulator-=STEP;}if(mode==='menu'){camera.position.lerp(new THREE.Vector3(8.5,7,14),1-Math.exp(-elapsed*2));camera.lookAt(0,3,-45);}else if(mode==='running'){
 cat.visible=true;shadow.position.set(physics.x,physics.y>2.75?2.8:.035,0);shadow.scale.set(1-physics.y*.055,1.6-physics.y*.09,1);shadow.material.opacity=Math.max(.1,.38-physics.y*.045);
 const camY=4.1+Math.min(physics.y,3)*.23,shakeX=0;camera.position.lerp(new THREE.Vector3(physics.x*.32+shakeX,camY,8.3+(rush>0?.65:0)),1-Math.exp(-elapsed*6));camera.lookAt(physics.x*.22,1.25,-14);camera.fov=THREE.MathUtils.damp(camera.fov,rush>0?69:58,3,elapsed);camera.updateProjectionMatrix();avatar.animate(elapsed,physics,speed,time,shield>0||rush>0);}
 hudClock+=elapsed;if(hudClock>=.06){if(mode==='running')updateHud();hudClock=0;}renderer.render(scene,camera);requestAnimationFrame(frame);}
setMode('menu');requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
$('startBtn').onclick=start;$('againBtn').onclick=start;$('homeBtn').onclick=home;$('quitBtn').onclick=home;$('pauseBtn').onclick=pause;$('resumeBtn').onclick=pause;$('pounceBtn').onclick=moonPounce;
let helpPaused=false;$('helpBtn').onclick=()=>{helpPaused=mode==='running';if(helpPaused)pause();$('help').showModal();};function closeHelp(){$('help').close();if(helpPaused&&mode==='paused')pause();helpPaused=false;}$('closeHelp').onclick=closeHelp;$('gotIt').onclick=closeHelp;$('help').addEventListener('cancel',e=>{e.preventDefault();closeHelp();});
$('soundBtn').onclick=()=>{sound=!sound;$('soundBtn').textContent=sound?'♫':'♪̸';$('soundBtn').setAttribute('aria-label',sound?'Mute sound':'Enable sound');if(sound){audioInit();tone();}};
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch{toast('FULLSCREEN UNAVAILABLE');}};
addEventListener('keydown',e=>{if($('help').open)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space'&&['menu','over'].includes(mode)){start();return;}if(e.code==='KeyP'||e.code==='Escape'){pause();return;}if(mode!=='running')return;if(e.code==='ArrowLeft'||e.code==='KeyA')move(-1);if(e.code==='ArrowRight'||e.code==='KeyD')move(1);if(['ArrowUp','KeyW','Space'].includes(e.code))jump();if(['ArrowDown','KeyS'].includes(e.code))duck();if(['ShiftLeft','ShiftRight','KeyE'].includes(e.code))moonPounce();});
addEventListener('keyup',e=>{if(['ArrowUp','KeyW','Space'].includes(e.code))physics.releaseJump();});
let touchX=0,touchY=0,activePointer=null;$('world').addEventListener('pointerdown',e=>{activePointer=e.pointerId;touchX=e.clientX;touchY=e.clientY;$('world').setPointerCapture(e.pointerId);});$('world').addEventListener('pointerup',e=>{if(activePointer!==e.pointerId)return;activePointer=null;const dx=e.clientX-touchX,dy=e.clientY-touchY;if(Math.max(Math.abs(dx),Math.abs(dy))<15){jump();return;}if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else if(dy<0)jump();else duck();});$('world').addEventListener('pointercancel',()=>activePointer=null);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')pause();});
$('startBtn').disabled=true;$('startBtn').innerHTML='GETTING READY <span>☾</span>';
avatar.loaded.then(()=>{$('startBtn').disabled=false;$('startBtn').innerHTML='LET’S RUN <span>↗</span>';}).catch(()=>{$('startBtn').disabled=true;$('startBtn').innerHTML='RELOAD TO RETRY';toast('MIDKNIGHT COULD NOT LOAD');});
const art=$('mascotArt');art.onload=()=>{art.hidden=false;};art.src='assets/mascot.png';
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const snapshot=()=>({state:mode,distance:Math.floor(distance),gold:coins,lives,best,moonlight:physics.moon,moonGates:gates,styleScore});const register=t=>{try{Promise.resolve(document.modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});}catch{}};register({name:'read_run_state',description:'Read the current Midknight Rush score, moonlight and run state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>snapshot()});register({name:'control_run',description:'Start a new run from the menu or results, pause an active run, or resume a paused run.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','pause','resume']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||!['start','pause','resume'].includes(input.action))throw Error('Choose start, pause or resume.');if(input.action==='start'&&['menu','over'].includes(mode))start();else if(input.action==='pause'&&mode==='running')pause();else if(input.action==='resume'&&mode==='paused')pause();else throw Error('That action is unavailable in the current state.');return snapshot();}});addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}


