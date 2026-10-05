import * as THREE from './three.module.js';

// Fuel and input use real time. World travel and vertical physics share this
// clock, so changing time dilation never changes a jump's landing distance.
export class Speedster {
 constructor(){this.reset();}
 reset(){this.amount=0;}
 step(dt,active){const target=active?1:0;this.amount=target+(this.amount-target)*Math.exp(-5*dt);if(this.amount<.0001)this.amount=0;}
 get worldScale(){return 1-.62*this.amount;}
 get strideScale(){return 1+.55*this.amount;}
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
   ribbon.visible=true;material.opacity=.32*amount;const a=geometry.attributes.position;
   for(let side=0;side<2;side++)for(let i=0;i<=12;i++){
    const t=i/12,x=p.x+(tailX-p.x)*t+(side?1:-1)*(.43+.12*t),y=p.y+(tailY-p.y)*t+.28+.09*Math.sin(t*Math.PI),z=.35+3*t,width=.045*(1-t);
    a.setXYZ(side*26+i*2,x-width,y,z);a.setXYZ(side*26+i*2+1,x+width,y,z);
   }
   a.needsUpdate=true;
  },
  get visible(){return ribbon.visible;},
  dispose(){scene.remove(ribbon);geometry.dispose();material.dispose();}
 };
}
