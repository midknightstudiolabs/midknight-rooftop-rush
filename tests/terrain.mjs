import assert from 'node:assert/strict';
import {RoofLayout,Nitro} from '../terrain.js';
import {CatPhysics,STEP} from '../physics.js';
const roof=new RoofLayout();const first=roof.schedule(140,1);
assert.deepEqual(roof.lanes(first),[-1,1]);assert.equal(roof.supported((first-1)*12+1,0),false);assert.equal(roof.supported((first-1)*12+1,2.8),true);
for(let i=first;i<first+6;i++){const a=roof.lanes(i),b=roof.lanes(i+1);assert.ok(a.some(l=>b.includes(l)),'connections have at least one continuous route');}
const fall=new CatPhysics();for(let i=0;i<65;i++)fall.step(STEP,[],false);assert.ok(fall.y<-3,'missing roof is a real drop');fall.step(STEP,[],true);assert.ok(fall.y<0,'cannot teleport onto a roof from underneath');
const jumper=new CatPhysics();jumper.requestJump();for(let i=0;i<12;i++)jumper.step(STEP);for(let i=0;i<40;i++)jumper.step(STEP,[],false);assert.ok(jumper.y>0,'jump crosses a gap');for(let i=0;i<100;i++)jumper.step(STEP,[],true);assert.equal(jumper.y,0);
const nitro=new Nitro();nitro.collect(100);nitro.step(1,true);assert.equal(nitro.active,false,'full fuel never auto-activates');assert.ok(nitro.press());nitro.step(1,true);assert.equal(nitro.fuel,72);assert.equal(nitro.active,true);nitro.release();nitro.step(.5,true);assert.equal(nitro.active,false);assert.ok(nitro.fuel>72);nitro.press();const fuel=nitro.fuel;nitro.step(.5,false);assert.equal(nitro.active,false);assert.equal(nitro.fuel,fuel,'airtime conserves fuel');nitro.step(10,true);assert.equal(nitro.fuel,0);assert.equal(nitro.held,false);assert.equal(nitro.press(),false);nitro.collect();assert.equal(nitro.active,false);nitro.reset();assert.equal(nitro.fuel,60);
for(let i=0;i<100;i++){roof.schedule(i*235+140,i%2?1:-1);roof.prune(i*235);}assert.ok(roof.sections.size<40,'old terrain plans expire');
console.log('PASS: split roofs, continuous alternate routes, true gaps, jumping, no underside teleport, manual fuel and depletion.');
