// Shared route math and encounter planning; independent of rendering and input.
export const ENCOUNTERS = Object.freeze([
 {id:'chimney',name:'THE CHIMNEY WORKS',hint:'A cough, a puff, then smoke. Take the clear lane.',icon:'♨'},
 {id:'fork',name:'THREE WAYS HOME',hint:'Hold POUNCE, choose a landing, then release.',icon:'⑂'},
 {id:'shutters',name:'AFTER HOURS',hint:'Amber windows are about to open. Mind the shutters.',icon:'▥'},
 {id:'pigeons',name:'FEATHER EFFECT',hint:'Startle the flock. Watch what they knock over.',icon:'⌁'},
 {id:'collapse',name:'LOOSE TILES',hint:'Take the gold ramp. Keep moving on the crumbling roof.',icon:'▧'},
 {id:'laundry',name:'ON THE LINE',hint:'The gold ramp leads to a laundry line. Balance, then jump.',icon:'⌇'},
 {id:'rival',name:'CATCH THE NIGHT CAT',hint:'Collect gold and land tricks to overtake your rival.',icon:'♜'},
 {id:'corner',name:'SKYLINE SHORTCUT',hint:'Take the raised shortcut, or stay on the lower roof.',icon:'↱'}
]);
export const pathX = () => 0;
export const pathSlope = () => 0;
export const bendAt = () => 0;
export function pounceVelocity(y,targetY,seconds){return (targetY-y+13*seconds*seconds)/seconds;}
export function rampVelocity(speed,y=0,top=2.76){return pounceVelocity(y,top,Math.max(.65,Math.min(1.2,20/speed)));}
export function smokeStage(seconds){return seconds<.65?'warning':seconds<2.4?'burst':'clear';}
export class EncounterDirector {
 constructor(seed=729){this.seed=seed;this.reset();}
 reset(){this.next=0;this.index=0;this.cycle=0;this.deck=ENCOUNTERS.map(e=>e.id);this.last=null;}
 random(){this.seed=this.seed*16807%2147483647;return(this.seed-1)/2147483646;}
 advance(distance){
  if(distance<this.next)return null;
  const id=this.deck[this.index++],card=ENCOUNTERS.find(e=>e.id===id);
  this.next=distance+(id==='rival'?235:135);this.last=id;
  if(this.index===this.deck.length){this.index=0;this.cycle++;const last=id;for(let i=this.deck.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}if(this.deck[0]===last)[this.deck[0],this.deck[1]]=[this.deck[1],this.deck[0]];}
  return {...card,lane:(this.cycle+this.index)%2?1:-1,cycle:this.cycle};
 }
}
