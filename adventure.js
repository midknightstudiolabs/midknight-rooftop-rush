import * as THREE from './three.module.js';
import {EncounterDirector,bendAt,pounceVelocity,smokeStage} from './rooftops.js?v=calm10';
import {createMidknight} from './character-sprite.js?v=calm10';

// Keep the skyline stationary: no vertex warping or moving horizon.
export function curveMaterial(material){return material;}

export function createAdventure(api){
 const {scene,camera,physics,route,box,ball,mesh,mats,mat,createObject,toast,hit,addStyle,getState}=api;
 const cue=api.tone??(()=>{});
 const director=new EncounterDirector();
 const actors=[],platforms=[],clouds=[];
 const ownedGeometries=[];
 const geo=g=>(ownedGeometries.push(g),g);
 const ringGeo=geo(new THREE.TorusGeometry(.78,.045,6,32));
 const smokeMat=curveMaterial(new THREE.MeshStandardMaterial({color:'#a8a0b4',transparent:true,opacity:.32,depthWrite:false,roughness:1}),route);
 const cloth=mat('#bf839c'),brick=mat('#72516b'),feather=mat('#b9b6ce'),warning=mat('#efb857',.3);
 const lineMat=mat('#d4bc8f'),leaf=mat('#5a8b80');
 let card=null,eventUntil=0,aim=null,fork=null,flight=null,race=null,eventCount=0,routeLabel='ROOFTOP DISTRICT',balance=0;
 const rival=(api.avatarFactory??createMidknight)({camera,tint:0xb9c6ff});rival.loaded.catch(()=>{});scene.add(rival.root);
 const rivalState={x:0,y:0,vx:0,vy:0,grounded:true,crouch:0,landing:0,phase:0};
 const $=id=>document.getElementById(id);
 function remove(item,list){scene.remove(item.mesh);const i=list.indexOf(item);if(i>=0)list.splice(i,1);}
 function group(x,z,y=0){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);return g;}
 function actor(type,lane,z){const o={type,lane,mesh:group(lane*2.8,z),previousZ:z,t:0,triggered:false,done:false};actors.push(o);return o;}
 function platform(lane,z,length=25,top=2.76,width=2.35,kind='roof'){
  const g=group(lane*2.8,z);box(mats.purple,[0,top/2-.08,0],[width,top-.16,length],g);box(mats.road,[0,top-.06,0],[width+.08,.12,length],g);
  for(const side of [-1,1])box(kind==='collapse'?warning:mats.moon,[side*width/2,top+.035,0],[.065,.05,length],g);
  const o={mesh:g,lane,top,width,length,kind,tiles:[],timer:0,active:false};platforms.push(o);
  if(kind==='collapse'){
   g.children[0].visible=false;g.children[1].visible=false;
   for(const side of [-1,1])box(brick,[side*(width/2-.12),top-.35,0],[.16,.45,length],g);
   for(let z=-length/2+1;z<length/2;z+=2){const tile=box(warning,[0,top-.04,z],[width*.98,.08,1.96],g);o.tiles.push({mesh:tile,z,drop:0});}
  }
  return o;
 }
 function coins(lane,z,count=6,y=0){for(let k=0;k<count;k++)createObject('coin',lane,z-k*2.2,y);}
 function routeRamp(lane,z){const ramp=createObject('ramp',lane,z);ramp.routeRamp=true;}
 function spawnChimney(lane,z){const o=actor('chimney',lane,z);box(brick,[0,.62,0],[1.05,1.24,1.05],o.mesh);box(mats.rail,[0,1.28,0],[1.3,.18,1.3],o.mesh);box(mats.black,[0,1.38,0],[.85,.02,.85],o.mesh);o.ring=mesh(ringGeo,warning,[0,.03,0],[1.3,1.3,1.3],o.mesh);o.ring.rotation.x=-Math.PI/2;return o;}
 function build(card){
  const l=card.lane,z=-82;eventCount++;routeLabel=card.name;eventUntil=getState().distance+125;
  $('encounterName').textContent=card.name;$('encounterHint').textContent=card.hint;$('encounterIcon').textContent=card.icon;
  toast(card.name);
  if(card.id==='chimney'){spawnChimney(l,z);spawnChimney(0,z-24);coins(-l,z+14,18);}
  if(card.id==='fork'){
   fork={z:z+12,used:false,markers:[]};
   const choices=[{lane:-1,top:2.76,name:'HIGH ROOF',reward:220,width:2.35},{lane:0,top:0,name:'SAFE BRIDGE',reward:80,width:2.35},{lane:1,top:3.5,name:'BONUS PERCH',reward:400,width:1.35}];
   fork.choices=choices;
   for(const c of choices){const p=c.top?platform(c.lane,z,30,c.top,c.width):null;const g=group(c.lane*2.8,z+10,c.top+.08);const r=mesh(ringGeo,c.lane===1?mats.gold:mats.moon,[0,0,0],[1,1,1],g);r.rotation.x=-Math.PI/2;fork.markers.push({mesh:g,ring:r});coins(c.lane,z+5,9,c.top);if(p)p.fork=true;}
   createObject('gate',1,z-7,3.5);
  }
  if(card.id==='shutters'){
   for(let i=0;i<3;i++){const o=actor('shutter',i%2?0:l,z-i*16);const side=l;box(brick,[side*.95,1.8,0],[.3,3.6,2.6],o.mesh);box(mats.gold,[side*.76,2,0],[.06,1.35,1.4],o.mesh);o.pivot=new THREE.Group();o.pivot.position.set(side*.72,1.9,-.8);o.mesh.add(o.pivot);box(cloth,[-side*.77,0,0],[1.55,1.45,.12],o.pivot);o.pivot.rotation.y=side*Math.PI/2;o.side=side;}
   coins(-l,z+12,22);
  }
  if(card.id==='pigeons'){
   const o=actor('pigeons',l,z);o.birds=[];
   for(let i=0;i<6;i++){const b=new THREE.Group();b.position.set((i%3-1)*.5,.2,-Math.floor(i/3)*.6);o.mesh.add(b);ball(feather,[0,.12,0],[.16,.18,.27],b);ball(mats.white,[0,.3,-.13],[.11,.12,.13],b);const wings=[-1,1].map(s=>box(feather,[s*.2,.15,0],[.32,.04,.28],b));o.birds.push({mesh:b,wings});}
   o.pot=box(brick,[0,.3,-15],[.65,.6,.65],o.mesh);ball(leaf,[0,.8,-15],[.5,.55,.5],o.mesh);coins(l,z+8,4);coins(0,z-5,10);
  }
  if(card.id==='collapse'){
   platform(l,z,34,2.76,2.3,'collapse');routeRamp(l,z+28);coins(l,z+12,13,2.76);coins(-l,z+8,8);createObject('gate',l,z-8,2.76);
  }
  if(card.id==='laundry'){
   const p=platform(l,z,32,2.76,.48,'line');p.mesh.children.slice(0,2).forEach(m=>m.visible=false);
   box(lineMat,[0,2.73,0],[.17,.1,32],p.mesh);
   for(const end of [-1,1]){box(brick,[0,1.6,end*17],[.24,3.2,.24],p.mesh);box(lineMat,[0,3.25,end*17],[2.6,.08,.08],p.mesh);}
   p.clothes=[];for(let k=0;k<8;k++){const c=box(k%2?cloth:feather,[.6,1.7,12-k*3.5],[.9,1.6,.04],p.mesh);p.clothes.push(c);}
   routeRamp(l,z+27);coins(l,z+12,13,2.76);coins(-l,z+8,9);createObject('gate',l,z-8,2.76);
  }
  if(card.id==='rival'){
   const s=getState();race={start:s.distance+65,end:s.distance+220,baseline:null,progress:0,lane:-l,z:-17,finished:false};
   coins(0,z+15,12);coins(l,z-15,10);createObject('barrier',l,z);createObject('barrier',-l,z-28);createObject('gate',0,z-40,3.7);
  }
  if(card.id==='corner'){
   platform(l,z,32,2.76,1.65,'corner');routeRamp(l,z+27);coins(l,z+12,13,2.76);createObject('gate',l,z-6,3.7);
   for(let i=0;i<5;i++){const o=actor('sign',0,z+22-i*8);o.mesh.position.x=4.6;const a=box(mats.gold,[0,1,0],[.75,.12,.12],o.mesh);a.rotation.z=.6;const b=box(mats.gold,[0,.6,0],[.75,.12,.12],o.mesh);b.rotation.z=-.6;box(mats.rail,[0,.4,0],[.08,.8,.08],o.mesh);}
   coins(0,z+5,10);
  }
 }
 function reset(){for(const list of [actors,platforms,clouds]){list.forEach(o=>scene.remove(o.mesh));list.length=0;}if(fork)fork.markers.forEach(o=>scene.remove(o.mesh));director.seed=729;director.reset();card=null;aim=null;fork=null;flight=null;race=null;eventCount=0;balance=0;route.value=0;rival.root.visible=false;routeLabel='ROOFTOP DISTRICT';$('aimPanel').hidden=true;$('racePanel').hidden=true;$('encounter').hidden=true;}
 function beginAim(){
  if(aim)return true;
  if(!fork||fork.used||fork.z < -getState().speed*1.45||fork.z> -9||physics.moon<1||physics.airPounced)return false;
  aim={lane:physics.lane,time:0};$('aimPanel').hidden=false;toast('CHOOSE YOUR LANDING · RELEASE TO POUNCE');updateAimUI();return true;
 }
 function updateAimUI(){if(!aim)return;for(let i=-1;i<=1;i++){const el=$('landing'+(i+1));el.classList.toggle('selected',i===aim.lane);el.setAttribute('aria-pressed',String(i===aim.lane));}$('aimTime').style.width=`${Math.max(0,1-aim.time/3)*100}%`;}
 function choose(lane){if(!aim)return false;aim.lane=Math.max(-1,Math.min(1,lane));updateAimUI();return true;}
 function releaseAim(){
  if(!aim||!fork)return false;const c=fork.choices.find(c=>c.lane===aim.lane),s=getState();
  const seconds=Math.max(.9,Math.min(1.5,(-fork.z+2)/s.speed));
  physics.moon--;physics.regen=0;physics.lane=c.lane;physics.launch(pounceVelocity(physics.y,c.top,seconds));physics.airPounced=true;physics.phase=.65;physics.jumpHeld=true;
  flight={choice:c,speed:s.speed,remaining:seconds+.8,rewarded:false};fork.used=true;aim=null;$('aimPanel').hidden=true;toast(c.name+' · COMMIT!');cue(880,.2,.035,'triangle');return true;
 }
 function realtime(dt){if(aim){aim.time+=dt;updateAimUI();if(aim.time>=3)releaseAim();}}
 function emitSmoke(o){for(let i=0;i<7&&clouds.length<28;i++){const g=group(o.mesh.position.x+(i%3-1)*.38,o.mesh.position.z,1.5+i*.35);ball(smokeMat,[0,0,0],[.45,.4,.5],g);clouds.push({mesh:g,life:1.9,age:0,drift:(i%3-1)*.25});}}
 function advance(dt,step){
  const s=getState();route.value=s.distance;
  const next=api.autospawn===false?null:director.advance(s.distance);if(next){card=next;build(card);}
  $('encounter').hidden=false;
  if(s.distance>eventUntil){$('encounterName').textContent='FIND YOUR FLOW';$('encounterHint').textContent='A breath between rooftops. Follow the gold.';}
  for(const o of [...actors]){o.previousZ=o.mesh.position.z;o.mesh.position.z+=step;
   const z=o.mesh.position.z;
   if(!o.triggered&&z > -s.speed*1.55){o.triggered=true;o.t=0;if(o.type==='chimney'){toast('CHIMNEY COUGH · CLEAR THE VENT');cue(160,.25,.025,'triangle');}if(o.type==='shutter'){toast('SHUTTERS OPENING');cue(320,.12,.02,'triangle');}}
   if(o.triggered)o.t+=dt;
   if(o.type==='chimney'){
    o.stage=smokeStage(o.t);o.ring.visible=o.triggered&&o.stage!=='clear';o.ring.scale.setScalar(1.3+(o.triggered?Math.min(o.t,.65)*.7:0));
    if(o.triggered&&o.stage==='burst'&&!o.emitted){o.emitted=true;emitSmoke(o);}
   }
   if(o.type==='shutter'){const openness=o.triggered?Math.min(1,o.t/.8):0;o.pivot.rotation.y=o.side*Math.PI/2*(1-openness);}
   if(o.type==='pigeons'){
    if(!o.scattered&&z>-9&&Math.abs(physics.x-o.mesh.position.x)<1.6){o.scattered=true;o.scatterTime=0;toast('FEATHER EFFECT · FALLING POT');cue(1400,.12,.018);}
    if(o.scattered){o.scatterTime+=dt;for(let i=0;i<o.birds.length;i++){const b=o.birds[i];b.mesh.position.y+=dt*(2+i*.15);b.mesh.position.x+=dt*(i%2?2:-2);b.mesh.position.z-=dt*2;b.wings.forEach((w,j)=>w.rotation.z=Math.sin(o.scatterTime*12+i)*(j?1:-1)*.8);}o.pot.rotation.z=Math.min(Math.PI/2,o.scatterTime*2);}
   }
   if(z>32)remove(o,actors);
  }
  for(const p of [...platforms]){
   p.mesh.position.z+=step;const z=p.mesh.position.z;
   if(p.kind==='collapse')for(const tile of p.tiles){const tz=z+tile.z;if(tz>1){tile.drop+=dt;tile.mesh.position.y=p.top-.04-12*tile.drop*tile.drop;tile.mesh.rotation.x=tile.drop*.45;}}
   if(p.clothes)for(let i=0;i<p.clothes.length;i++)p.clothes[i].rotation.z=Math.sin(s.time*1.5+i)*.12;
   if(z>p.length/2+30)remove(p,platforms);
  }
  if(fork){fork.z+=step;fork.markers.forEach(o=>{o.mesh.position.z+=step;o.ring.scale.setScalar(1+.07*Math.sin(s.time*2));});if(fork.z>28){fork.markers.forEach(o=>scene.remove(o.mesh));fork=null;aim=null;$('aimPanel').hidden=true;}}
  for(const c of [...clouds]){c.age+=dt;c.life-=dt;c.mesh.position.z+=step;c.mesh.position.x+=c.drift*dt;c.mesh.position.y+=dt*.8;const scale=(1+c.age*.8)*Math.min(1,c.life/.4);c.mesh.scale.setScalar(Math.max(.01,scale));if(c.life<=0)remove(c,clouds);}
  if(flight){flight.remaining-=dt;if(flight.remaining<=0)flight=null;}
  if(race){
   if(s.distance>=race.start&&race.baseline===null){race.baseline=s.styleScore;toast('RIVAL RACE · GOLD + TRICKS TO OVERTAKE');}
   if(race.baseline!==null&&!race.finished){race.progress=Math.min(1,(s.styleScore-race.baseline)/600);race.z=-12+race.progress*19;$('racePanel').hidden=false;$('raceFill').style.width=`${race.progress*100}%`;$('raceLabel').textContent=`NIGHT CAT · ${Math.max(0,Math.ceil(race.end-s.distance))} m TO FINISH`;if(s.distance>=race.end){race.finished=true;const won=race.progress>=1;if(won)addStyle('RIVAL OUTSMARTED',600);else toast('NIGHT CAT WINS · CHASE THE GOLD NEXT TIME');$('racePanel').hidden=true;}}
   if(s.distance>race.end+30){race=null;rival.root.visible=false;}
  }
 }
 function collide(dt){
  const s=getState();
  for(const o of actors){if(o.done)continue;const z=o.mesh.position.z,dx=Math.abs(physics.x-o.mesh.position.x),overlap=o.previousZ<=1&&z>=-1;
   let contact=false,hard=true;
   if(o.type==='chimney'){hard=physics.y<1.35;contact=overlap&&dx<.93&&(hard||(o.triggered&&o.stage==='burst'&&physics.y<3.7));}
   if(o.type==='shutter')contact=overlap&&dx<1.15&&o.t>.55&&physics.y+physics.height>1.2&&physics.y<2.7;
   if(o.type==='pigeons')contact=o.scattered&&o.previousZ-15<=.65&&z-15>=-.65&&dx<.9&&physics.y<.65;
   if(contact&&(hard||!o.smoked)){o.done=hard;o.smoked=true;if(hit(hard))return;}
  }
  for(const p of platforms){if(p.kind==='line'||p.wallHit)continue;if(Math.abs(p.mesh.position.z)<p.length/2+.1&&Math.abs(physics.x-p.lane*2.8)<p.width/2+.22&&physics.y<p.top-.12){p.wallHit=true;if(hit(true))return;}}
  const support=platforms.find(p=>Math.abs(physics.x-p.lane*2.8)<p.width/2+.12&&Math.abs(p.mesh.position.z)<p.length/2&&physics.grounded&&Math.abs(physics.y-p.top)<.06);
  if(support){
   if(support.kind==='line'){balance+=dt;$('encounterHint').textContent='ON THE LINE · Stay centered. Jump or change lane to dismount.';physics.secondary.tailBase.velocity+=Math.sin(s.time*2)*dt*.1;}
   if(!support.active){support.active=true;support.start=s.distance;}
   if(!support.rewarded&&s.distance-support.start>Math.min(13,support.length*.5)){support.rewarded=true;addStyle(support.kind==='line'?'LAUNDRY ACROBAT':support.kind==='collapse'?'TILES OF TROUBLE':support.kind==='corner'?'CORNER CUTTER':'SKYLINE EXPLORER',support.kind==='line'?350:250);}
  }
  if(flight&&physics.landed&&!flight.rewarded){flight.rewarded=true;const c=flight.choice;if(Math.abs(physics.x-c.lane*2.8)<c.width/2+.2&&Math.abs(physics.y-c.top)<.1)addStyle(c.name+' LANDING',c.reward);else toast('SOFT LANDING · TRY ANOTHER PERCH');flight=null;}
 }
 function render(dt){
  if(race&&rival.ready){const s=getState();rivalState.x=THREE.MathUtils.damp(rivalState.x,race.lane*2.8,3,dt);rivalState.y=.08;const z=race.z;rival.animate(dt,rivalState,s.speed,s.time);rival.root.position.x+=bendAt(s.distance,z);rival.root.position.z=z;rival.root.scale.setScalar(.78);rival.root.visible=true;}else rival.root.visible=false;
 }
 function surfaces(){return platforms.flatMap(p=>p.kind==='collapse'?p.tiles.filter(t=>t.drop===0).map(t=>({x:p.lane*2.8,z:p.mesh.position.z+t.z,halfWidth:p.width/2,halfLength:1,top:p.top})):[{x:p.lane*2.8,z:p.mesh.position.z,halfWidth:p.width/2,halfLength:p.length/2,top:p.top}]);}
 function canSpawn(){return !aim&&getState().distance>eventUntil-12&&!race;}
 function setVisible(show){if(!show){rival.root.visible=false;$('aimPanel').hidden=true;$('racePanel').hidden=true;$('encounter').hidden=true;}else if(aim)$('aimPanel').hidden=false;}
 return {reset,advance,collide,render,surfaces,canSpawn,beginAim,releaseAim,realtime,choose,setVisible,
  move(d){return aim?choose(aim.lane+d):false;},get aiming(){return !!aim;},get timeScale(){return aim ? .22 : 1;},get lockedSpeed(){return flight?.speed??null;},get readyToAim(){return !!fork&&!fork.used&&fork.z>=-getState().speed*1.45&&fork.z<=-9;},
  snapshot(){return {encounter:card?.id??null,hazardLane:card?.lane??null,encounters:eventCount,aiming:!!aim,selectedLane:aim?.lane??null,racing:!!race,curve:bendAt(getState().distance,-60),platforms:platforms.length,actors:actors.length,clouds:clouds.length};},
  // Deterministic entry point also used by the gameplay regression harness.
  buildEncounter(id){const c=director.deck.includes(id)?{id,lane:-1,name:id.toUpperCase(),hint:'',icon:'✦'}:null;if(!c)throw Error('Unknown encounter');build(c);}
 };
}
