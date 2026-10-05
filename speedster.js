import * as THREE from './three.module.js';

// Time dilation only affects environmental animation. Player travel, gravity
// and fuel use real time, so Nitro never slows the cat's forward progress.
export class Speedster {
 constructor(){this.reset();}
 reset(){this.amount=0;}
 step(dt,active){const target=active?1:0;this.amount=target+(this.amount-target)*Math.exp(-5*dt);if(this.amount<.0001)this.amount=0;}
 get worldScale(){return 1-.82*this.amount;}
 get strideScale(){return 1+1.3*this.amount;}
 get travelScale(){return 1+.75*this.amount;}
 get steeringScale(){return 1+.35*this.amount;}
}

// Two short, steady ribbons follow the cat. No flashing, screen overlay,
// full-screen streaks, new textures or per-frame object allocation.
export function createSpeedTrail(scene){
 const material=new THREE.MeshBasicMaterial({color:0xeac079,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const geometry=new THREE.BufferGeometry(),positions=new Float32Array(2*13*2*3),indices=[];
 for(let side=0;side<2;side++)for(let i=0;i<12;i++){const n=side*26+i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);
 const ribbon=new THREE.Mesh(geometry,material);ribbon.frustumCulled=false;ribbon.visible=false;scene.add(ribbon);
 let tailX=0,tailY=0;
 return {
  reset(){ribbon.visible=false;material.opacity=0;tailX=0;tailY=0;},
  update(dt,p,amount){
   if(amount<.01){ribbon.visible=false;tailX=p.x;tailY=p.y;return;}
   tailX=THREE.MathUtils.damp(tailX,p.x,9,dt);tailY=THREE.MathUtils.damp(tailY,p.y,9,dt);
   ribbon.visible=true;material.opacity=.42*amount;const a=geometry.attributes.position;
   for(let side=0;side<2;side++)for(let i=0;i<=12;i++){
    const t=i/12,x=p.x+(tailX-p.x)*t+(side?1:-1)*(.43+.18*t),y=p.y+(tailY-p.y)*t+.28+.09*Math.sin(t*Math.PI),z=.35+5.4*t,width=.07*(1-t);
    a.setXYZ(side*26+i*2,x-width,y,z);a.setXYZ(side*26+i*2+1,x+width,y,z);
   }
   a.needsUpdate=true;
  },
  get visible(){return ribbon.visible;},
  dispose(){scene.remove(ribbon);geometry.dispose();material.dispose();}
 };
}
