import assert from 'node:assert/strict';
import * as THREE from '../three.module.js';
import {createAdventure,curveMaterial} from '../adventure.js';
import {ENCOUNTERS,EncounterDirector,bendAt,pounceVelocity,rampVelocity,smokeStage} from '../rooftops.js';
import {CatPhysics,STEP} from '../physics.js';
import {Speedster} from '../speedster.js';
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
  const dt=STEP*(state.timeScale??1),travel=state.speed*STEP;state.distance+=travel;state.time+=dt;a.advance(dt,travel);
  for(const o of objects){o.z+=travel;if(o.type==='ramp'&&!o.done&&Math.abs(o.z)<1.65&&Math.abs(physics.x-o.l*2.8)<1.05&&physics.y<.7){physics.launch(o.routeRamp?rampVelocity(state.speed,physics.y,o.routeTop??2.76):14.5);o.done=true;}}
  physics.step(STEP,a.surfaces(),true,0,STEP);a.collide(dt);a.render(dt);
 }}
 return {a,state,physics,scene,rewards,messages,objects,tick,get hits(){return hits}};
}
for(let s=0;s<10000;s+=17)for(const z of [-150,-60,0,20])assert.equal(bendAt(s,z),0,'world never bends at any distance');
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
// Forks are traversed by steering onto ramps, without any modal or time stop.
for(const speed of [12,16,20,28])for(const lane of [-1,0,1]){const h=harness();h.state.speed=speed;h.physics.x=lane*2.8;h.physics.lane=lane;h.a.buildEncounter('fork');h.tick(9);assert.equal(h.hits,0,'fork ramp at '+speed+' lane '+lane);if(lane!==0)assert.ok(h.rewards.length>0);}
// High routes are reachable from their ramp at the entire speed range.
for(const kind of ['collapse','laundry','corner'])for(const speed of [12,16,20,40]){const h=harness();h.state.speed=speed;h.physics.x=-2.8;h.physics.lane=-1;h.a.buildEncounter(kind);h.tick(9);assert.equal(h.hits,0,kind+' ramp remains fair at '+speed);assert.ok(h.rewards.length>0,kind+' traversal gives a reward at '+speed);}
// Race resolves in either direction, and restart removes every temporary prop.
for(const win of [false,true]){const h=harness();h.a.buildEncounter('rival');h.tick(4.2);if(win)h.state.styleScore+=650;h.tick(10);assert.equal(h.rewards.includes('RIVAL OUTSMARTED'),win);h.a.reset();assert.equal(h.a.snapshot().actors,0);assert.equal(h.a.snapshot().platforms,0);assert.equal(h.a.snapshot().racing,false);}
// Long sessions recycle actors and platforms instead of accumulating a city forever.
{const h=harness(true);h.state.rush=10000;h.state.speed=40;for(let i=0;i<900;i++){h.tick(.1);const s=h.a.snapshot();assert.ok(s.actors<20&&s.platforms<8&&s.clouds<=28);}assert.ok(h.a.snapshot().encounters>10);}
console.log('PASS: all eight encounters, safe routes, reactive smoke/shutters/pigeons, continuous forks, high routes at 12–40 m/s, race win/loss and bounded cleanup.');

// Release/reapply time dilation while crossing each elevated route. Vertical
// physics and travel stay in real time through both transitions.
for(const kind of ['fork','collapse','laundry','corner'])for(const speed of [12,21,28]){
 const h=harness(),fx=new Speedster();h.state.speed=speed;h.physics.x=-2.8;h.physics.lane=-1;h.a.buildEncounter(kind);
 for(let i=0;i<2400;i++){fx.step(STEP,h.state.distance>40&&h.state.distance<70||h.state.distance>83&&h.state.distance<90);h.state.timeScale=fx.worldScale;h.tick(STEP);}
 assert.equal(h.hits,0,kind+' remains safe when toggling slow motion at '+speed);assert.ok(h.rewards.length>0);
}
console.log('PASS: ramp landings when Speedster engages and releases mid-flight.');
