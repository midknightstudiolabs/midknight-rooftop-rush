import assert from 'node:assert/strict';
import * as THREE from '../three.module.js';
import {createAdventure,curveMaterial} from '../adventure.js';
import {ENCOUNTERS,EncounterDirector,bendAt,pounceVelocity,rampVelocity,smokeStage} from '../rooftops.js';
import {CatPhysics,STEP} from '../physics.js';
const elements=new Map();globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,{hidden:false,style:{},textContent:'',classList:{toggle(){}},setAttribute(){}});return elements.get(id);}};
function harness(autospawn=false){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),physics=new CatPhysics(),route={value:0};
 const state={distance:0,speed:16,time:0,styleScore:0,rush:0};let hits=0;const rewards=[],messages=[],objects=[];
 const mat=(c,e=0)=>curveMaterial(new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:e}),route);
 const mats=Object.fromEntries(['purple','road','moon','gold','rail','black','white'].map(c=>[c,mat('#777777')]));
 const mesh=(geo,m,pos,scale,parent=scene)=>{const o=new THREE.Mesh(geo,m);o.position.set(...pos);if(scale)o.scale.set(...scale);parent.add(o);return o;};
 const box=(m,p,s,parent)=>mesh(new THREE.BoxGeometry(),m,p,s,parent),ball=(m,p,s,parent)=>mesh(new THREE.SphereGeometry(1,8,6),m,p,s,parent);
 const a=createAdventure({scene,camera,physics,route,mat,mats,mesh,box,ball,autospawn,avatarFactory:()=>({loaded:Promise.resolve(),root:new THREE.Group(),ready:true,animate(){}}),getState:()=>state,toast:s=>messages.push(s),hit:()=>{hits++},addStyle:(label,points)=>{rewards.push(label);state.styleScore+=points},createObject:(type,l,z,height=0)=>{const o={type,l,z,height,done:false};objects.push(o);return o;}});
 function tick(seconds){for(let i=0;i<Math.round(seconds/STEP);i++){
  if(a.lockedSpeed!==null)state.speed=a.lockedSpeed;const travel=state.speed*STEP;state.distance+=travel;state.time+=STEP;a.advance(STEP,travel);
  for(const o of objects){o.z+=travel;if(o.type==='ramp'&&!o.done&&Math.abs(o.z)<1.65&&Math.abs(physics.x-o.l*2.8)<1.05&&physics.y<.7){physics.launch(o.routeRamp?rampVelocity(state.speed,physics.y):14.5);o.done=true;}}
  physics.step(STEP,a.surfaces());a.collide(STEP);a.render(STEP);
 }}
 return {a,state,physics,scene,rewards,messages,objects,tick,get hits(){return hits}};
}
for(let s=0;s<10000;s+=17){assert.equal(bendAt(s,0),0);assert.ok(Math.abs(bendAt(s,.001))<.00001,'curve is tangent to player heading');assert.ok(Number.isFinite(bendAt(s,-150)));}
const d=new EncounterDirector();const order=[];for(let i=0;i<24;i++){const c=d.advance(d.next);order.push(c.id);assert.equal(d.advance(d.next-.01),null);}
for(let i=0;i<24;i+=8)assert.equal(new Set(order.slice(i,i+8)).size,8,'every deck includes all encounter types');
assert.equal(smokeStage(.2),'warning');assert.equal(smokeStage(1),'burst');assert.equal(smokeStage(3),'clear');
assert.ok(Math.abs(pounceVelocity(0,3.5,1)-16.5)<.001);
// Every encounter preserves a readable safe route, but it isn't always the center.
for(const e of ENCOUNTERS){const h=harness();if(['chimney','shutters'].includes(e.id)){h.physics.lane=1;h.physics.x=2.8;}h.a.buildEncounter(e.id);h.tick(9);assert.equal(h.hits,0,e.id+' has a safe route');h.scene.traverse(o=>{assert.ok(o.position.toArray().every(Number.isFinite));});}
// Chimneys hurt on their lane; their smoke remains bounded and clears.
{const h=harness();h.physics.x=-2.8;h.physics.lane=-1;h.a.buildEncounter('chimney');h.tick(5.4);assert.ok(h.hits>0);h.tick(5);assert.equal(h.a.snapshot().clouds,0);}
// A crouch fits below an open shutter; a standing cat does not.
for(const crouch of [false,true]){const h=harness();h.physics.x=-2.8;h.physics.lane=-1;h.a.buildEncounter('shutters');for(let i=0;i<640;i++){if(crouch)h.physics.duck();h.tick(STEP);}assert.equal(h.hits>0,!crouch);}
// Pigeons only cause the falling-pot hazard when actually startled.
{const h=harness();h.physics.x=-2.8;h.physics.lane=-1;h.a.buildEncounter('pigeons');h.tick(6.3);assert.ok(h.messages.some(s=>s.includes('FEATHER EFFECT')));assert.ok(h.hits>0);}
// Ballistic choices must land on the selected height at slow and fast speeds.
for(const speed of [16,25,40])for(const lane of [-1,0,1]){
 const h=harness();h.state.speed=speed;h.a.buildEncounter('fork');while(!h.a.readyToAim)h.tick(STEP);
 assert.ok(h.a.beginAim());assert.equal(h.a.timeScale,.22);h.a.choose(lane);assert.ok(h.a.releaseAim());assert.equal(h.physics.moon,2);h.tick(2.1);
 assert.ok(h.rewards.some(s=>s.endsWith('LANDING')),`successful target landing at ${speed}, lane ${lane}; got ${h.rewards}`);assert.equal(h.hits,0);
}
// Aiming auto-releases and cannot consume a second charge while already airborne.
{const h=harness();h.a.buildEncounter('fork');while(!h.a.readyToAim)h.tick(STEP);h.a.beginAim();h.a.realtime(3.01);assert.equal(h.a.aiming,false);assert.equal(h.physics.moon,2);assert.equal(h.a.beginAim(),false);}
// High routes are reachable from their ramp at the entire speed range.
for(const kind of ['collapse','laundry','corner'])for(const speed of [16,25,40]){const h=harness();h.state.speed=speed;h.physics.x=-2.8;h.physics.lane=-1;h.a.buildEncounter(kind);h.tick(9);assert.equal(h.hits,0,kind+' ramp remains fair at '+speed);assert.ok(h.rewards.length>0,kind+' traversal gives a reward at '+speed);}
// Race resolves in either direction, and restart removes every temporary prop.
for(const win of [false,true]){const h=harness();h.a.buildEncounter('rival');h.tick(4.2);if(win)h.state.styleScore+=650;h.tick(10);assert.equal(h.rewards.includes('RIVAL OUTSMARTED'),win);h.a.reset();assert.equal(h.a.snapshot().actors,0);assert.equal(h.a.snapshot().platforms,0);assert.equal(h.a.snapshot().racing,false);assert.equal(h.a.snapshot().aiming,false);}
// Long sessions recycle actors and platforms instead of accumulating a city forever.
{const h=harness(true);h.state.rush=10000;h.state.speed=40;for(let i=0;i<900;i++){h.tick(.1);const s=h.a.snapshot();assert.ok(s.actors<20&&s.platforms<8&&s.clouds<=28);}assert.ok(h.a.snapshot().encounters>15);}
console.log('PASS: all eight encounters, safe routes, reactive smoke/shutters/pigeons, aimed landings, slow-motion timeout, high routes at 16–40 m/s, race win/loss and bounded cleanup.');
