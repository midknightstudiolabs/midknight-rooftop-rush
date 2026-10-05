import {Speedster,createSpeedTrail} from '../speedster.js';
import {RoofLayout,Nitro} from '../terrain.js';
import {curveMaterial,createAdventure} from '../adventure.js';import {bendAt,rampVelocity,pounceVelocity} from '../rooftops.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import * as Three from '../three.module.js';import {CatPhysics,PHYSICS,STEP,sweptOverlap} from '../physics.js';import {createMidknight as createSprite} from '../character-sprite.js';
const createMidknight=(options={})=>createSprite({...options,loader:{loadAsync:async()=>new Three.Texture()}});
const simulate=(p,seconds,surfaces=[])=>{for(let i=0;i<Math.round(seconds/STEP);i++)p.step(STEP,surfaces);};
const held=new CatPhysics();held.requestJump();let peak=0;for(let i=0;i<150;i++){held.step(STEP);peak=Math.max(peak,held.y);}assert.ok(peak>1.7&&peak<1.85);assert.equal(held.y,0);assert.equal(held.grounded,true);
const tap=new CatPhysics();tap.requestJump();tap.releaseJump();let tapPeak=0;for(let i=0;i<150;i++){tap.step(STEP);tapPeak=Math.max(tapPeak,tap.y);}assert.ok(tapPeak<peak*.6,'early release makes a short hop');
const pounce=new CatPhysics();pounce.requestJump();simulate(pounce,.3);assert.equal(pounce.requestJump(),'pounce');assert.equal(pounce.moon,2);assert.equal(pounce.pounce(),false,'one pounce per airtime');let pouncePeak=pounce.y;for(let i=0;i<180;i++){pounce.step(STEP);pouncePeak=Math.max(pouncePeak,pounce.y);}assert.ok(pouncePeak>3.4);assert.equal(pounce.airPounced,false);assert.ok(pounce.pounce());
const ledge=new CatPhysics();ledge.y=2.76;ledge.x=2.2;ledge.step(STEP,[]);assert.equal(ledge.grounded,false);assert.ok(ledge.coyote>0);ledge.requestJump();simulate(ledge,.07);assert.ok(ledge.vy>8,'coyote time accepts a jump after leaving a roof');
const buffered=new CatPhysics();buffered.moon=0;buffered.y=.15;buffered.vy=-2;buffered.grounded=false;buffered.coyote=0;buffered.requestJump();simulate(buffered,.16);assert.ok(buffered.vy>6,'pre-landing input buffers next jump');
const roof=new CatPhysics();roof.y=4;roof.vy=-3;roof.grounded=false;const platforms=[{x:0,z:0,halfWidth:1.2,halfLength:4,top:2.76}];simulate(roof,.5,platforms);assert.equal(roof.y,2.76);assert.equal(roof.grounded,true);simulate(roof,.6,[]);assert.equal(roof.y,0,'walk off roof and fall naturally');
const regen=new CatPhysics();regen.moon=0;simulate(regen,27.1);assert.equal(regen.moon,3);
const spring=new CatPhysics();spring.move(1);spring.step(STEP);assert.ok(spring.x>0&&spring.x<.1);simulate(spring,1);assert.ok(Math.abs(spring.x-2.8)<.01);spring.move(1);assert.equal(spring.lane,1);assert.ok(sweptOverlap(-20,20,.4));assert.equal(sweptOverlap(-20,-10,.4),false);
const elements=new Map(),registered=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(name,fn){this.handlers??=new Map();this.handlers.set(name,fn);},setAttribute(){},hidden:false,textContent:'',showModal(){this.open=true},close(){this.open=false},setPointerCapture(){}});return elements.get(id);};
globalThis.document={getElementById:element};
const inputHandlers=new Map();
const ctx={Speedster,createSpeedTrail,RoofLayout,Nitro,curveMaterial,createAdventure:(api)=>createAdventure({...api,avatarFactory:createMidknight}),bendAt,rampVelocity,pounceVelocity,THREE:{...Three,WebGLRenderer:class{setPixelRatio(){}setSize(){}render(){}}},CatPhysics,STEP,sweptOverlap,createMidknight,document:{getElementById:element,body:element('body'),addEventListener(){},modelContext:{registerTool(t){registered.set(t.name,t)}}},localStorage:{getItem(){return '0'},setItem(){}},window:{},innerWidth:1440,innerHeight:900,devicePixelRatio:1,requestAnimationFrame(){},addEventListener(name,fn){inputHandlers.set(name,fn)},performance,console,Math,AbortController,Error};
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');vm.createContext(ctx);vm.runInContext(source,ctx);const run=code=>vm.runInContext(code,ctx);const reset=()=>run('sound=false;start();spawnClock=999;invincible=0;');
await run('avatar.loaded');
reset();run("createObject('barrier',0,-.1);update(STEP);");assert.equal(run('lives'),0);assert.equal(run('mode'),'splat');const crashDistance=run('distance');run('update(STEP)');assert.equal(run('distance'),crashDistance);
reset();run("duck();for(let i=0;i<30;i++)update(STEP);createObject('overhead',0,-.1);for(let i=0;i<10;i++)update(STEP);");assert.equal(run('lives'),3);assert.equal(run('tricks'),1);assert.equal(run('combo'),1);
reset();run("shield=5;createObject('penthouse',0,-.1);update(STEP);");assert.equal(run('mode'),'splat');assert.equal(run('shield'),0);
reset();run('shield=5;hit(false);');assert.equal(run('lives'),3);assert.equal(run('shield'),0);
reset();run("for(let i=0;i<20;i++){createObject('coin',0,-.1);update(STEP);}");assert.equal(run('coins'),20);assert.equal(run('nitro.fuel'),100);assert.equal(run('nitro.active'),false);run('nitro.press();update(STEP);');assert.ok(run('nitro.active'));run("createObject('penthouse',0,-.1);update(STEP);");assert.equal(run('mode'),'splat');
for(const meters of [0,2700]){reset();run(`distance=${meters};speed=16+Math.min(distance/180,15);createObject('penthouse',0,-20);createObject('ramp',0,-6);for(let i=0;i<360;i++)update(STEP);`);assert.equal(run('lives'),3,`penthouse ramp at ${meters} m`);}
reset();run("createObject('roof',0,-28);createObject('ramp',0,-7);for(let i=0;i<450;i++)update(STEP);");assert.equal(run('lives'),3,'long rooftop is safe');assert.ok(run('tricks')>=1);
reset();run("physics.pounce();createObject('barrier',0,-.1);for(let i=0;i<15;i++)update(STEP);");assert.equal(run('mode'),'splat');assert.equal(run('tricks'),0,'solid objects stop Moon Pounce too');
reset();run("lives=2;for(let k=0;k<3;k++){physics.y=3.55;physics.grounded=false;physics.vy=0;createObject('gate',0,-.1,3.7);update(STEP);}");assert.equal(run('gates'),3);assert.equal(run('awakened'),1);assert.equal(run('lives'),3);assert.ok(run('styleScore')>=2500);assert.equal(run('physics.moon'),3);
run('pause();');const before=run('distance');run('update(.04)');assert.equal(run('distance'),before);run('pause();update(STEP)');assert.ok(run('distance')>before);
reset();run("lives=1;createObject('barrier',0,-.1);update(STEP);");assert.equal(run('mode'),'splat');run('for(let i=0;i<150;i++)update(STEP);');assert.equal(run('mode'),'over');run('start()');assert.equal(run('lives'),3);assert.equal(run('styleScore'),0);assert.equal(run('gates'),0);assert.equal(run('physics.moon'),3);
assert.equal(registered.size,2);assert.throws(()=>registered.get('control_run').execute({action:'invalid'}));registered.get('control_run').execute({action:'pause'});assert.equal(registered.get('read_run_state').execute().state,'paused');registered.get('control_run').execute({action:'resume'});
const camera=new Three.PerspectiveCamera();camera.position.set(0,4.1,8.3);camera.lookAt(0,1.25,-14);
const avatar=createMidknight({camera}),anim=new CatPhysics();await avatar.loaded;assert.equal(avatar.ready,true);
let mesh;avatar.root.traverse(o=>{if(o.isMesh)mesh=o;});const u=mesh.material.uniforms;
for(let i=0;i<500;i++){if(i===30)anim.requestJump();if(i===60)anim.pounce();if(i===200)anim.duck();anim.step(STEP);avatar.animate(STEP,anim,24,i*STEP);avatar.root.updateMatrixWorld(true);assert.ok(u.frameA.value>=0&&u.frameA.value<8);assert.ok(u.frameB.value>=0&&u.frameB.value<8);assert.ok(u.frameMix.value>=0&&u.frameMix.value<1);}
avatar.root.traverse(o=>{for(const n of o.matrixWorld.elements)assert.ok(Number.isFinite(n),'finite sprite transforms');});
anim.reset();avatar.reset();avatar.animate(2/3,anim,16,0);assert.ok(u.frameA.value===0,'stride loops seamlessly at its authored duration');
anim.requestJump();simulate(anim,.14);avatar.animate(.2,anim,16,0);assert.equal(u.poseFrame.value,0);assert.ok(u.poseMix.value>.98,'airborne pose blends in');
anim.reset();anim.crouch=1;avatar.animate(.2,anim,16,0);assert.equal(u.poseFrame.value,1,'crouch pose selected');assert.ok(Math.abs(mesh.position.y-1.33)<.01,'crouching paws stay planted');
anim.crouch=0;anim.landing=.6;avatar.animate(.2,anim,16,0);assert.equal(u.poseFrame.value,2,'landing pose selected');
anim.landing=0;avatar.animate(.3,anim,16,0);assert.ok(u.poseMix.value<.002,'running resumes after landing');
const failed=createSprite({loader:{loadAsync:async()=>{throw new Error('texture unavailable')}}});await assert.rejects(failed.loaded);assert.equal(failed.failed,true);assert.equal(failed.ready,false);
anim.reset();avatar.reset();anim.grounded=false;avatar.animate(.3,anim,16,0);
const airBefore=u.poseWeights.value.x;
anim.grounded=true;anim.landing=.8;avatar.animate(1/120,anim,16,0);
assert.ok(u.poseWeights.value.x>airBefore*.8,'previous pose retained during transition');
assert.ok(u.poseWeights.value.z>0&&u.poseWeights.value.z<.2,'landing blends in without a snap');
assert.ok(u.poseWeights.value.x+u.poseWeights.value.y+u.poseWeights.value.z<=1.00001,'pose blending stays normalized');
anim.reset();avatar.reset();for(let i=0;i<120;i++){anim.vx=i<60?18:-18;avatar.animate(1/120,anim,31,i/120);const q=mesh.parent.quaternion.clone();q.premultiply(camera.quaternion.clone().invert());assert.ok(Math.abs(new Three.Euler().setFromQuaternion(q).z)<.0251,'turning lean remains small');}
avatar.dispose();
// Regression: roof shell and bridge surfaces must not compete at one depth.
assert.ok(run('roofSections.every(g=>g.userData.lanes.every(p=>{const shell=p.children[0],deck=p.children[1];return shell.position.y+shell.scale.y/2 < deck.position.y+deck.scale.y/2-.1;}))'));
assert.ok(run('roofSections.every(g=>g.children.filter(o=>o.material===mats.rail).every(o=>o.position.y+o.scale.y/2>.01))'));
reset();for(let i=0;i<120;i++){run('frame(last+1000/60)');assert.equal(run('cat.visible'),true,'invulnerability never blinks the cat');}
reset();run("gates=2;collectGate({mesh:{position:new THREE.Vector3()}})");const initialLight=run('scene.background.r');
assert.ok(Math.abs(initialLight-run('districtTint.r'))>.001,'district effect starts from the previous lighting');
run('update(STEP)');assert.ok(Math.abs(run('scene.background.r')-initialLight)<.002,'district light fades gradually');
console.log('PASS: physics, jump height/buffering/coyote time, pounce limits, rooftop landings, spring lanes, swept collisions, shields/rush, ramp speeds, combos/gates/healing, pause/restart, structured controls, texture readiness/failure, eight-frame stride, loop duration, air/crouch/landing blends and paw alignment.');

// Course generation, roof visibility and player collisions share one terrain map.
reset();run("for(let i=0;i<50000;i++){if(i%600===0)nitro.press();if(i%600===360)nitro.release();const city=adventure.snapshot(),now=terrain.lanes(terrain.indexAt(distance)),ahead=terrain.lanes(terrain.indexAt(distance+8)),safe=now.filter(l=>ahead.includes(l));const preferred=['chimney','shutters'].includes(city.encounter)?-city.hazardLane:0;physics.lane=safe.includes(preferred)?preferred:safe[0];update(STEP);}");
assert.equal(run('mode'),'running',JSON.stringify(run('({distance,y:physics.y,lane:physics.lane,city:adventure.snapshot()})')));assert.ok(run('adventure.snapshot().encounters')>16);assert.ok(run('objects.length')<100);
reset();run("adventure.buildEncounter('fork');moonPounce();");assert.equal(run('mode'),'running');assert.equal(run('physics.moon'),2);assert.equal(run('motionScale'),1);
inputHandlers.get('keydown')({code:'KeyN',repeat:false,preventDefault(){}});assert.equal(run('nitro.held'),true);inputHandlers.get('keyup')({code:'KeyN'});assert.equal(run('nitro.held'),false);
run('nitro.press();pause();');assert.equal(run('nitro.held'),false);const stoppedAt=run('distance');run('update(STEP)');assert.equal(run('distance'),stoppedAt);run('pause();');
run('home();start();');assert.equal(run('nitro.fuel'),60);assert.equal(run('nitro.held'),false);
console.log('PASS: continuous route selection, Nitro key press/release, pause safety and reset.');

// A crash freezes every world object, rejects movement and preserves the impact spot.
reset();run("createObject('barrier',0,-2);while(mode==='running')update(STEP);");
const stopped=run('({distance,z:objects[0].mesh.position.z,x:physics.x})');
run('move(1);jump();duck();for(let i=0;i<75;i++)frame(last+1000/60);');
assert.equal(run('distance'),stopped.distance);assert.equal(run('objects[0].mesh.position.z'),stopped.z);assert.equal(run('physics.x'),stopped.x);assert.equal(run('speed'),0);assert.equal(run('mode'),'over');
run('start();');assert.equal(run('splatEnded'),false);assert.ok(run('speed')>0);
// Fixed camera: lane changes, airborne motion, Rush and restart cannot move it.
const fixedCamera=run('camera.position.toArray().concat(camera.quaternion.toArray(),camera.fov)').join(',');
run('physics.lane=1;physics.launch(17);rush=7;for(let i=0;i<90;i++)frame(last+1000/60);');
assert.equal(run('camera.position.toArray().concat(camera.quaternion.toArray(),camera.fov)').join(','),fixedCamera);
reset();assert.equal(run('camera.position.toArray().concat(camera.quaternion.toArray(),camera.fov)').join(','),fixedCamera);
const liquid=createMidknight({camera});await liquid.loaded;let liquidMesh;liquid.root.traverse(o=>{if(o.isMesh)liquidMesh=o;});
liquid.animateSplat(.5,new CatPhysics());assert.ok(liquidMesh.scale.y<.12&&liquidMesh.scale.x>1.7);assert.ok(Math.abs(liquidMesh.position.y-1.33*liquidMesh.scale.y)<1e-9,'paws stay anchored while flattening');liquid.reset();assert.equal(liquidMesh.scale.y,1);assert.equal(liquidMesh.scale.x,1);liquid.dispose();
console.log('PASS: solid-impact stop, liquid splat, frozen world, input lock, safe restart and fixed camera/FOV.');

// A fixed camera still needs to show both outer lanes on tall phone screens.
ctx.innerWidth=390;ctx.innerHeight=844;inputHandlers.get('resize')();
run('camera.updateMatrixWorld(true);');
for(const x of [-5.7,5.7])assert.ok(Math.abs(run(`new THREE.Vector3(${x},1.5,0).project(camera).x`))<1,'outer lane fits portrait viewport');
ctx.innerWidth=1440;ctx.innerHeight=900;inputHandlers.get('resize')();run('camera.updateMatrixWorld(true);');
assert.ok(run('new THREE.Vector3(0,10.5,0).project(camera).y')<1,'high pounce fits without moving the camera');

reset();run('nitro.press();for(let i=0;i<100;i++)update(STEP);');assert.ok(run('speed')>19&&run('speed')<22,'boost accelerates smoothly');const boostSpeed=run('speed');run('nitro.release();for(let i=0;i<100;i++)update(STEP);');assert.ok(run('speed')<boostSpeed,'release eases back to normal speed');
const boostButton=element('nitroBtn');boostButton.handlers.get('pointerdown')({preventDefault(){},pointerId:4});assert.equal(run('nitro.held'),true);boostButton.handlers.get('pointercancel')();assert.equal(run('nitro.held'),false);boostButton.handlers.get('pointerdown')({preventDefault(){},pointerId:5});inputHandlers.get('blur')();assert.equal(run('mode'),'paused');assert.equal(run('nitro.held'),false);
assert.ok(!fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('id="aimPanel"'),'landing dialog is removed from the page');
console.log('PASS: Nitro acceleration/release, touch cancellation, focus-loss pause and no landing dialog.');

reset();element('leftBtn').onclick();assert.equal(run('physics.lane'),-1);element('rightBtn').onclick();assert.equal(run('physics.lane'),0);
run('pause();');element('leftBtn').onclick();assert.equal(run('physics.lane'),0);assert.equal(element('steerControls').hidden,true);
reset();run('terrain.schedule(144,1);syncRoofs();');
assert.ok(run(`roofSections.every(g=>g.userData.lanes.every(p=>p.children.every(m=>{
 const a=m.geometry.attributes.position,rest=m.userData.rest;
 for(let v=0;v<a.count;v++){const d=g.userData.index*12-6-(rest[v*3+2]*m.scale.z+m.position.z);if(Math.abs((a.getX(v)-rest[v*3])*m.scale.x-terrain.offsetAt(d))>1e-5)return false;}return true;
})))`),'rendered roof vertices match the support map');
run("distance=180;const o=createObject('coin',1,-6);globalThis.coinX=o.mesh.position.x;");assert.ok(Math.abs(ctx.coinX-(2.8+run('terrain.offsetAt(186)')))<1e-9,'gold stays on the bend');
reset();const skyline=run('scenery.map(g=>g.position.toArray().join()).join()');run('for(let i=0;i<120;i++)update(STEP);');assert.equal(run('scenery.map(g=>g.position.toArray().join()).join()'),skyline,'distant skyline is stationary');
assert.ok(run('skylineBatches.size')<12,'skyline uses a small number of material batches');
console.log('PASS: steering buttons, curved roof geometry, pickup alignment and stationary batched skyline.');

reset();run('for(let i=0;i<120;i++)update(STEP);');const normalTravel=run('distance'),normalTime=run('time');
reset();const boostStart=run('time');run('nitro.press();for(let i=0;i<120;i++)update(STEP);');
assert.ok(run('distance')>normalTravel*1.4,'Nitro actually covers more ground, never slows the cat');assert.ok(run('time')-boostStart<.4,'hazards and effects run on slowed world time');
assert.ok(run('speedster.strideScale')>2.29);assert.ok(Math.abs(run('nitro.fuel')-32)<1e-8);
const boostCamera=run('camera.position.toArray().concat(camera.quaternion.toArray(),camera.fov)').join(',');run('frame(last+16);');assert.ok(run('speedTrail.visible'));
assert.equal(run('camera.position.toArray().concat(camera.quaternion.toArray(),camera.fov)').join(','),boostCamera);
run('physics.pounce();update(STEP);');assert.ok(run('nitro.active'),'boost continues through a jump');
run('pause();');assert.equal(run('speedster.amount'),0);assert.equal(run('speedTrail.visible'),false);run('home();start();');assert.equal(run('speedster.worldScale'),1);
reset();run("nitro.press();createObject('barrier',0,-.1);update(STEP);");assert.equal(run('mode'),'splat');assert.equal(run('speedster.amount'),0);assert.equal(run('speedTrail.visible'),false);
console.log('PASS: slowed environment with faster forward travel, faster stride, airborne boost, fixed camera and effect cleanup.');
