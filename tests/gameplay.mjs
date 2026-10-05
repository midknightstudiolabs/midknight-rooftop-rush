import {curveMaterial,createAdventure} from '../adventure.js';import {bendAt,rampVelocity} from '../rooftops.js';
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
const elements=new Map(),registered=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},hidden:false,textContent:'',showModal(){this.open=true},close(){this.open=false},setPointerCapture(){}});return elements.get(id);};
globalThis.document={getElementById:element};
const inputHandlers=new Map();
const ctx={curveMaterial,createAdventure:(api)=>createAdventure({...api,avatarFactory:createMidknight}),bendAt,rampVelocity,THREE:{...Three,WebGLRenderer:class{setPixelRatio(){}setSize(){}render(){}}},CatPhysics,STEP,sweptOverlap,createMidknight,document:{getElementById:element,body:element('body'),addEventListener(){},modelContext:{registerTool(t){registered.set(t.name,t)}}},localStorage:{getItem(){return '0'},setItem(){}},window:{},innerWidth:1440,innerHeight:900,devicePixelRatio:1,requestAnimationFrame(){},addEventListener(name,fn){inputHandlers.set(name,fn)},performance,console,Math,AbortController,Error};
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');vm.createContext(ctx);vm.runInContext(source,ctx);const run=code=>vm.runInContext(code,ctx);const reset=()=>run('sound=false;start();spawnClock=999;invincible=0;');
await run('avatar.loaded');
reset();run("createObject('barrier',0,-.1);update(STEP);");assert.equal(run('lives'),2);run('update(STEP)');assert.equal(run('lives'),2);
reset();run("duck();for(let i=0;i<30;i++)update(STEP);createObject('overhead',0,-.1);for(let i=0;i<10;i++)update(STEP);");assert.equal(run('lives'),3);assert.equal(run('tricks'),1);assert.equal(run('combo'),1);
reset();run("shield=5;createObject('penthouse',0,-.1);update(STEP);");assert.equal(run('lives'),3);assert.equal(run('shield'),0);
reset();run("for(let i=0;i<20;i++){createObject('coin',0,-.1);update(STEP);}createObject('penthouse',0,-.1);update(STEP);");assert.equal(run('coins'),20);assert.ok(run('rush')>6);assert.equal(run('lives'),3);
for(const meters of [0,2700]){reset();run(`distance=${meters};speed=16+Math.min(distance/180,15);createObject('penthouse',0,-20);createObject('ramp',0,-6);for(let i=0;i<360;i++)update(STEP);`);assert.equal(run('lives'),3,`penthouse ramp at ${meters} m`);}
reset();run("createObject('roof',0,-28);createObject('ramp',0,-7);for(let i=0;i<450;i++)update(STEP);");assert.equal(run('lives'),3,'long rooftop is safe');assert.ok(run('tricks')>=1);
reset();run("physics.pounce();createObject('barrier',0,-.1);for(let i=0;i<15;i++)update(STEP);");assert.equal(run('lives'),3);assert.equal(run('tricks'),1,'phase-through earns ghost paws');
reset();run("lives=2;for(let k=0;k<3;k++){physics.y=3.55;physics.grounded=false;physics.vy=0;createObject('gate',0,-.1,3.7);update(STEP);}");assert.equal(run('gates'),3);assert.equal(run('awakened'),1);assert.equal(run('lives'),3);assert.ok(run('styleScore')>=2500);assert.equal(run('physics.moon'),3);
run('pause();');const before=run('distance');run('update(.04)');assert.equal(run('distance'),before);run('pause();update(STEP)');assert.ok(run('distance')>before);
reset();run("lives=1;createObject('barrier',0,-.1);update(STEP);");assert.equal(run('mode'),'over');run('start()');assert.equal(run('lives'),3);assert.equal(run('styleScore'),0);assert.equal(run('gates'),0);assert.equal(run('physics.moon'),3);
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
assert.ok(run('roofSections.every(g=>{const shell=g.children[0],deck=g.children[1];return shell.position.y+shell.scale.y/2 < deck.position.y+deck.scale.y/2-.1;})'));
assert.ok(run('roofSections.every(g=>g.children.filter(o=>o.material===mats.rail).every(o=>o.position.y+o.scale.y/2>.01))'));
reset();for(let i=0;i<120;i++){run('frame(last+1000/60)');assert.equal(run('cat.visible'),true,'invulnerability never blinks the cat');}
reset();run("gates=2;collectGate({mesh:{position:new THREE.Vector3()}})");const initialLight=run('scene.background.r');
assert.ok(Math.abs(initialLight-run('districtTint.r'))>.001,'district effect starts from the previous lighting');
run('update(STEP)');assert.ok(Math.abs(run('scene.background.r')-initialLight)<.002,'district light fades gradually');
console.log('PASS: physics, jump height/buffering/coyote time, pounce limits, rooftop landings, spring lanes, swept collisions, shields/rush, ramp speeds, combos/gates/healing, pause/restart, structured controls, texture readiness/failure, eight-frame stride, loop duration, air/crouch/landing blends and paw alignment.');

// Exercise the actual game loop across multiple full encounter decks.
reset();run('for(let i=0;i<20000;i++){invincible=100;update(STEP);}');
assert.equal(run('mode'),'running');assert.ok(run('adventure.snapshot().encounters')>16);
assert.ok(run('objects.length')<100,'encounter collectibles are recycled');
assert.ok(run('adventure.snapshot().platforms')<8);
reset();run("adventure.buildEncounter('fork');for(let i=0;i<900&&!adventure.readyToAim;i++){invincible=100;update(STEP);}moonPounce();");
assert.ok(run('adventure.aiming'));const aimDistance=run('distance');
run('pause();for(let i=0;i<12;i++)frame(last+1000/60);');assert.equal(run('distance'),aimDistance);
run('pause();');inputHandlers.get('keydown')({code:'ArrowRight',repeat:false,preventDefault(){}});
assert.equal(run('adventure.snapshot().selectedLane'),1);inputHandlers.get('keyup')({code:'ShiftLeft'});
assert.equal(run('adventure.aiming'),false);assert.equal(run('physics.moon'),2);
run('home();start();');assert.equal(run('adventure.snapshot().encounters'),0);assert.equal(run('adventure.snapshot().aiming'),false);
console.log('PASS: extended live-loop integration, aim keyboard selection/release, pause during aiming and clean restart.');



