// World units are meters; simulation advances at a fixed 120 Hz.
export const STEP = 1 / 120;
export const PHYSICS = Object.freeze({gravity:26,jumpSpeed:9.7,pounceSpeed:11.4,laneWidth:2.8,radius:.4,height:2.12,crouchHeight:1.02,buffer:.14,coyote:.1});
export class CatPhysics {
  constructor(){this.reset();}
  reset(){Object.assign(this,{x:0,y:0,vx:0,vy:0,lane:0,grounded:true,coyote:PHYSICS.coyote,jumpBuffer:0,jumpHeld:false,slide:0,crouch:0,anticipation:0,landing:0,phase:0,airPounced:false,moon:3,regen:0,landed:false,impact:0,previousY:0});this.secondary??=new SecondaryMotion();this.secondary.reset();}
  move(direction){this.lane=Math.max(-1,Math.min(1,this.lane+direction));}
  requestJump(){this.jumpHeld=true;if(!this.grounded&&this.coyote<=0){if(this.pounce())return 'pounce';}this.jumpBuffer=PHYSICS.buffer;return 'jump';}
  releaseJump(){this.jumpHeld=false;if(this.vy>4&&!this.airPounced)this.vy*=.56;}
  pounce(){if(this.moon<1||this.airPounced)return false;this.moon--;this.regen=0;this.secondary.kick(PHYSICS.pounceSpeed-this.vy);this.vy=PHYSICS.pounceSpeed;this.grounded=false;this.coyote=0;this.phase=.65;this.airPounced=true;this.slide=0;this.jumpBuffer=0;this.anticipation=0;return true;}
  duck(){this.slide=.8;this.jumpBuffer=0;if(!this.grounded){const next=Math.min(this.vy,-12);this.secondary.kick(next-this.vy);this.vy=next;}}
  launch(velocity){this.secondary.kick(velocity-this.vy);this.vy=velocity;this.grounded=false;this.coyote=0;this.slide=0;this.jumpBuffer=0;this.anticipation=0;}
  step(dt,surfaces=[]){
    this.landed=false;this.previousY=this.y;this.phase=Math.max(0,this.phase-dt);this.slide=Math.max(0,this.slide-dt);this.landing=Math.max(0,this.landing-dt*4.5);this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    // Critically damped lateral spring: acceleration, braking and no lane teleport.
    const ax=(this.lane*PHYSICS.laneWidth-this.x)*190-this.vx*27;
    this.vx+=ax*dt;this.x+=this.vx*dt;
    const supported=surfaces.some(s=>Math.abs(this.x-s.x)<s.halfWidth+.2&&Math.abs(s.z)<s.halfLength+.28&&Math.abs(this.y-s.top)<.035);
    if(this.grounded&&this.y>.04&&!supported){this.grounded=false;this.coyote=PHYSICS.coyote;}
    this.coyote=this.grounded?PHYSICS.coyote:Math.max(0,this.coyote-dt);
    if(this.jumpBuffer>0&&(this.grounded||this.coyote>0)&&this.anticipation===0)this.anticipation=.045;
    if(this.anticipation>0){this.anticipation=Math.max(0,this.anticipation-dt);if(this.anticipation===0){this.launch(PHYSICS.jumpSpeed*(this.jumpHeld?1:.67));this.airPounced=false;}}
    if(!this.grounded){this.vy-=PHYSICS.gravity*dt;this.y+=this.vy*dt;let floor=0;
      if(this.vy<=0)for(const s of surfaces){if(Math.abs(this.x-s.x)<s.halfWidth+.2&&Math.abs(s.z)<s.halfLength+.28&&this.previousY>=s.top-.03&&this.y<=s.top)floor=Math.max(floor,s.top);}
      if(this.y<=floor&&this.vy<=0){this.impact=-this.vy;this.secondary.kick(this.impact);this.y=floor;this.vy=0;this.grounded=true;this.landed=true;this.landing=Math.min(1,this.impact/14);this.airPounced=false;this.phase=0;}
    }
    const crouchTarget=this.slide>0?1:this.anticipation>0?.6:0;this.crouch+=(crouchTarget-this.crouch)*(1-Math.exp(-24*dt));
    if(this.moon<3){this.regen+=dt;if(this.regen>=9){this.moon++;this.regen=0;}}else this.regen=0;
    this.secondary.step(dt,this,ax);
  }
  get height(){return PHYSICS.height-(PHYSICS.height-PHYSICS.crouchHeight)*this.crouch;}
}

// Small angular springs, in radians, integrated on the same clock as collisions.
// This state never changes the gameplay collider or adds camera shake.
class AngularSpring {
  constructor(frequency,damping,limit){Object.assign(this,{frequency,damping,limit});this.reset();}
  reset(){this.value=0;this.velocity=0;}
  step(dt,target){const w=this.frequency;this.velocity+=((target-this.value)*w*w-2*this.damping*w*this.velocity)*dt;this.value+=this.velocity*dt;if(Math.abs(this.value)>this.limit){this.value=Math.sign(this.value)*this.limit;if(this.velocity*this.value>0)this.velocity=0;}}
}
export class SecondaryMotion {
  constructor(){this.tailBase=new AngularSpring(12,.86,.13);this.tailTip=new AngularSpring(9,.82,.18);this.tailPitch=new AngularSpring(14,.80,.10);this.earLeft=new AngularSpring(23,.74,.075);this.earRight=new AngularSpring(25,.76,.075);this.bodySquash=new AngularSpring(15,.70,.065);this.bodyTwist=new AngularSpring(11,.78,.06);this.reset();}
  reset(){this.phase=0;for(const s of [this.tailBase,this.tailTip,this.tailPitch,this.earLeft,this.earRight,this.bodySquash,this.bodyTwist])s.reset();}
  kick(velocityChange){const impulse=Math.max(-18,Math.min(18,velocityChange));this.tailPitch.velocity+=impulse*.06;this.earLeft.velocity+=impulse*.06;this.earRight.velocity+=impulse*.055;this.bodySquash.velocity+=impulse*.075;this.bodyTwist.velocity+=impulse*.025;}
  step(dt,p,ax=0){
    // Substeps preserve damping under a slow frame; the game normally calls at 120 Hz.
    const count=Math.max(1,Math.ceil(dt*240)),h=dt/count;
    for(let i=0;i<count;i++){
      this.phase+=h*2.4;
      const sway=Math.sin(this.phase)*(p.grounded?.055:.025);
      const turn=Math.max(-.035,Math.min(.035,-ax*.00045-p.vx*.001));
      this.tailBase.step(h,sway+turn);
      this.tailTip.step(h,this.tailBase.value*1.3);
      this.tailPitch.step(h,Math.max(-.06,Math.min(.06,p.vy*.0035))+p.crouch*.018);
      const fold=(p.grounded?0:.012)+p.crouch*.025,earTurn=Math.max(-.018,Math.min(.018,ax*.0002));
      this.earLeft.step(h,fold+earTurn);this.earRight.step(h,fold-earTurn);
      this.bodySquash.step(h,p.grounded?p.crouch*.02:-Math.min(.025,Math.abs(p.vy)*.002));
      this.bodyTwist.step(h,Math.max(-.03,Math.min(.03,-ax*.0002))+(p.grounded?0:Math.sin(this.phase*3)*.02));
    }
  }
}

// Swept depth overlap catches hazards even if a frame crosses the entire object.
export function sweptOverlap(beforeZ,afterZ,halfLength,padding=.33){return Math.min(beforeZ,afterZ)<=halfLength+padding&&Math.max(beforeZ,afterZ)>=-halfLength-padding;}
