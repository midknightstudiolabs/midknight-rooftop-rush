import assert from 'node:assert/strict';
import * as THREE from '../three.module.js';
import {Speedster,createSpeedTrail} from '../speedster.js';
import {CatPhysics,STEP} from '../physics.js';
import {Nitro} from '../terrain.js';

for(const hz of [30,60,120,144]){
 const fx=new Speedster();let previous=1;
 for(let i=0;i<hz;i++){fx.step(1/hz,true);assert.ok(fx.worldScale<=previous);assert.ok(previous-fx.worldScale<.1);previous=fx.worldScale;}
 assert.ok(fx.worldScale>.38&&fx.worldScale<.39);assert.ok(fx.strideScale>1.54);
 for(let i=0;i<hz*2;i++)fx.step(1/hz,false);
 assert.equal(fx.worldScale,1);assert.equal(fx.strideScale,1);
}
// Steering takes the same real time during time dilation.
const normal=new CatPhysics(),boosted=new CatPhysics();normal.move(1);boosted.move(1);
for(let i=0;i<60;i++){normal.step(STEP);boosted.step(STEP*.38,[],true,0,STEP);assert.ok(Math.abs(normal.x-boosted.x)<1e-10);}
// Jump distance stays stable even when the effect is toggled in midair.
function jumpDistance(dilated){const p=new CatPhysics(),fx=new Speedster();p.launch(16);let distance=0;
 for(let i=0;i<2000&&!p.grounded;i++){fx.step(STEP,dilated&&i<120);const dt=STEP*fx.worldScale;distance+=16*dt;p.step(dt,[],true,0,STEP);}
 assert.ok(p.grounded);return distance;
}
assert.ok(Math.abs(jumpDistance(true)-jumpDistance(false))<.2);
const fuel=new Nitro();fuel.press();const fx=new Speedster();for(let i=0;i<120;i++){fuel.step(STEP);fx.step(STEP,fuel.active);}assert.ok(Math.abs(fuel.fuel-32)<1e-8,'fuel uses real seconds');
const scene=new THREE.Scene(),trail=createSpeedTrail(scene),p=new CatPhysics();
for(let i=0;i<300;i++){p.x=Math.sin(i/20)*3;p.y=Math.max(0,Math.sin(i/30)*2);trail.update(STEP,p,1);}
assert.equal(scene.children.length,1);assert.ok(trail.visible);
const mesh=scene.children[0];assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));assert.ok(mesh.material.opacity<=.32);assert.equal(mesh.material.depthWrite,false);
trail.update(STEP,p,0);assert.equal(trail.visible,false);trail.reset();trail.dispose();assert.equal(scene.children.length,0);
console.log('PASS: smooth speedster transitions, fast steering, jump-distance stability, real-time fuel and bounded soft trails.');
