import assert from 'node:assert/strict';
import {SecondaryMotion,CatPhysics,STEP} from '../physics.js';
const neutral={grounded:true,vx:0,vy:0,crouch:0};
const channels=s=>[s.tailBase,s.tailTip,s.tailPitch,s.earLeft,s.earRight,s.bodySquash,s.bodyTwist];
const run=(s,seconds,dt=STEP,p=neutral,ax=0)=>{for(let t=0;t<seconds-dt/2;t+=dt)s.step(dt,p,ax);};
const idle=new SecondaryMotion();let low=0,high=0,lag=0;
for(let i=0;i<1200;i++){idle.step(STEP,neutral);low=Math.min(low,idle.tailTip.value);high=Math.max(high,idle.tailTip.value);lag=Math.max(lag,Math.abs(idle.tailBase.value-idle.tailTip.value));}
assert.ok(high-low>.06&&high-low<.15,'gentle tail sway stays below nine degrees peak to peak');assert.ok(lag>.001,'tip follows base with inertial delay');
assert.equal(idle.earLeft.value,0,'ears do not wag continuously');
const jump=new CatPhysics();jump.requestJump();let sawAir=false,sawLanding=false,earPeak=0,tailPeak=0;
for(let i=0;i<240;i++){jump.step(STEP);sawAir ||= !jump.grounded;sawLanding ||= jump.landed;earPeak=Math.max(earPeak,Math.abs(jump.secondary.earLeft.value));tailPeak=Math.max(tailPeak,Math.abs(jump.secondary.tailPitch.value));}
assert.ok(sawAir&&sawLanding&&earPeak>.005&&tailPeak>.005,'takeoff and impact excite ear and tail springs');
run(jump.secondary,2);assert.ok(Math.abs(jump.secondary.earLeft.value)<.0001,'ears settle after landing');
const soft=new SecondaryMotion(),hard=new SecondaryMotion();soft.kick(3);hard.kick(15);let softPeak=0,hardPeak=0;
assert.ok(soft.earLeft.velocity>0,'ears lag downward under upward body acceleration');
for(let i=0;i<60;i++){soft.step(STEP,neutral);hard.step(STEP,neutral);softPeak=Math.max(softPeak,soft.earLeft.value);hardPeak=Math.max(hardPeak,hard.earLeft.value);}
assert.ok(hardPeak>softPeak*3,'landing response scales with impact');
const turn=new SecondaryMotion();run(turn,.15,STEP,{...neutral,vx:5},100);assert.ok(turn.tailBase.value<0,'tail lags lateral acceleration');assert.ok(turn.earLeft.value>turn.earRight.value,'ears react separately to turns');
const slow=new SecondaryMotion(),fast=new SecondaryMotion();slow.kick(12);fast.kick(12);run(slow,1,1/30);run(fast,1,1/120);channels(slow).forEach((c,i)=>assert.ok(Math.abs(c.value-channels(fast)[i].value)<.00001,'substeps preserve response across frame rates'));
for(let i=0;i<300;i++){hard.kick(i%2?100:-100);hard.step(.1,{grounded:false,vx:100,vy:-100,crouch:1},i%2?1e4:-1e4);for(const c of channels(hard)){assert.ok(Number.isFinite(c.value)&&Number.isFinite(c.velocity));assert.ok(Math.abs(c.value)<=c.limit);}}
hard.reset();for(const c of channels(hard)){assert.equal(c.value,0);assert.equal(c.velocity,0);}
console.log('PASS: restrained sway, tail-tip inertia, takeoff/landing response, impact strength, ear settling, directional response, 30/120 Hz consistency, impulse limits and restart reset.');

