// Roof connections change shape while the camera and skyline stay stationary.
export class RoofLayout {
 constructor(){this.reset();}
 reset(){this.sections=new Map();}
 indexAt(distance){return Math.floor((distance+1e-6)/12)+1;}
 lanes(index){return this.sections.get(index)??[-1,0,1];}
 schedule(start,side=1){
  const first=this.indexAt(Math.ceil(start/12)*12);
  const pattern=[[-1,1],[-1,1],[-1,0,1],[side,0],[0,-side],[0],[-1,0,1]];
  pattern.forEach((lanes,i)=>this.sections.set(first+i,lanes));
  return first;
 }
 supported(distance,x){return this.lanes(this.indexAt(distance)).some(l=>Math.abs(x-l*2.8)<1.55);}
 prune(distance){const before=this.indexAt(distance)-25;for(const index of this.sections.keys())if(index<before)this.sections.delete(index);}
}
export class Nitro {
 constructor(){this.reset();}
 reset(){this.fuel=60;this.held=false;this.active=false;}
 press(){if(this.fuel<5)return false;this.held=true;return true;}
 release(){this.held=false;this.active=false;}
 collect(amount=4){this.fuel=Math.min(100,this.fuel+amount);}
 step(dt,grounded){this.active=this.held&&grounded&&this.fuel>0;if(this.active){this.fuel=Math.max(0,this.fuel-dt*28);if(this.fuel===0)this.release();}else if(!this.held)this.fuel=Math.min(100,this.fuel+dt*2);}
}
