import * as THREE from './three.module.js';

// Baked character animation. No independently moving primitive limbs or fur cones.
// All frames share the same straight rear camera angle as the running lane.
export function createMidknight({camera,loader=new THREE.TextureLoader(),tint=0xffffff}={}){
 const root=new THREE.Group(),billboard=new THREE.Group();root.add(billboard);
 const centers=[.5371,.5272,.5256,.5,.5462,.5335,.5224,.5143,.5398,.5447,.524,.508,.543,.5399,.5192,.5016].map(v=>.1+.8*v);
 const baselines=[.978,.978,.978,.978,.949,.949,.949,.949,.914,.914,.914,.914,.7325,.8567,.8854,.8885].map(v=>.1+.8*v);
 const offsets=centers.map((x,i)=>new THREE.Vector2(x-.5,.88-baselines[i]));
 const poseWeights=new THREE.Vector3();
 const tailDynamics=new THREE.Vector3(),earDynamics=new THREE.Vector2(),bodyDynamics=new THREE.Vector2();
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,uniforms:{runAtlas:{value:null},poseAtlas:{value:null},frameOffsets:{value:offsets},frameA:{value:0},frameB:{value:1},frameMix:{value:0},poseFrame:{value:0},poseMix:{value:0},glow:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 uniform sampler2D runAtlas;uniform sampler2D poseAtlas;
 uniform float frameA,frameB,frameMix,poseFrame,poseMix,glow;uniform vec3 poseWeights;varying vec2 vUv;
 uniform vec2 frameOffsets[16];
 vec4 sampleFrame(float frame){vec2 p=vUv+frameOffsets[int(frame)];if(p.x<.002||p.x>.998||p.y<.002||p.y>.998)return vec4(0.);vec2 cell=vec2(mod(frame,4.),floor(frame/4.));return texture2D(runAtlas,vec2((cell.x+p.x)/4.,1.-(cell.y+1.-p.y)/4.));}
 vec4 premul(vec4 c){return vec4(c.rgb*c.a,c.a);}
 void main(){
   vec4 a=premul(sampleFrame(frameA));
   vec4 b=premul(sampleFrame(frameB));
   vec4 stride=mix(a,b,frameMix);
   // Keep the upper body and tail registered to one quiet pose. The feet keep
   // their authored stride; broad feathering avoids a visible horizontal seam.
   stride=mix(stride,premul(sampleFrame(0.)),smoothstep(.30,.53,vUv.y));
   // Blend state weights independently so landing never swaps a pose instantly.
   vec4 c=stride*(1.-poseWeights.x-poseWeights.y-poseWeights.z)
     +premul(sampleFrame(12.))*poseWeights.x
     +premul(sampleFrame(13.))*poseWeights.y
     +premul(sampleFrame(14.))*poseWeights.z;
   if(c.a<.018)discard;
   vec3 rgb=c.rgb/max(c.a,.001);rgb=mix(rgb,vec3(.77,.64,1.),glow*.17);
   gl_FragColor=vec4(pow(max(rgb*tintColor,vec3(0.)),vec3(2.2)),c.a);
   #include <colorspace_fragment>
 }`});
 material.fragmentShader='uniform vec3 tintColor;\n'+material.fragmentShader;
 material.uniforms.tintColor={value:new THREE.Color(tint)};
 material.uniforms.poseWeights={value:poseWeights};
 material.uniforms.tailDynamics={value:tailDynamics};material.uniforms.earDynamics={value:earDynamics};
 material.uniforms.bodyDynamics={value:bodyDynamics};
 // A finely subdivided sprite deforms continuously without changing its atlas UVs.
 // Region pivots follow the blended pose, leaving the paws and body root anchored.
 material.vertexShader=`varying vec2 vUv;uniform vec3 poseWeights,tailDynamics;uniform vec2 earDynamics,bodyDynamics;
 void main(){
   vUv=uv;float running=1.-poseWeights.x-poseWeights.y-poseWeights.z;
   vec3 pivots=vec3(.51,.60,.79)*running+vec3(.40,.45,.66)*poseWeights.x+vec3(.37,.47,.67)*poseWeights.y+vec3(.46,.55,.77)*poseWeights.z;
   float rise=max(0.,uv.y-pivots.x),t=smoothstep(0.,.34,rise);
   float tailMask=1.-smoothstep(.065,.115,abs(uv.x-(.50+.044*t)));
   float earHeight=max(0.,uv.y-pivots.y)*smoothstep(pivots.y,pivots.y+.07,uv.y);
   float leftMask=(1.-smoothstep(.05,.10,abs(uv.x-.365)))*(1.-tailMask);
   float rightMask=(1.-smoothstep(.05,.10,abs(uv.x-.63)))*(1.-tailMask);
   float left=earDynamics.x*earHeight*leftMask,right=earDynamics.y*earHeight*rightMask;
   vec3 p=position;
   p.x+=3.5*(mix(tailDynamics.x,tailDynamics.y,t)*rise*tailMask+(-left+right)*.65);
   p.y-=3.5*(tailDynamics.z*rise*tailMask*.6+(left+right)*.75);
   float body=max(0.,uv.y-.12)*smoothstep(.12,.3,uv.y);
   p.x+=3.5*bodyDynamics.y*body;
   p.y-=3.5*bodyDynamics.x*body;
   gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
 }`;
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(3.5,3.5,64,64),material);plane.position.set(0,.38*3.5,0);billboard.add(plane);root.visible=false;
 let ready=false,failed=false,disposed=false,gait=0,lastPose=3,cadence=1.5,lean=0;
 const load=url=>loader.loadAsync(url).then(t=>{t.colorSpace=THREE.NoColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;});
 const loaded=load('assets/midknight-rooftop-padded.png').then(atlas=>{if(disposed){atlas.dispose();return;}material.uniforms.runAtlas.value=atlas;material.uniforms.poseAtlas.value=atlas;ready=true;}).catch(error=>{failed=true;throw error;});
 function reset(){gait=0;lastPose=3;cadence=1.5;lean=0;plane.scale.set(1,1,1);plane.position.y=.38*3.5;poseWeights.set(0,0,0);tailDynamics.set(0,0,0);earDynamics.set(0,0);bodyDynamics.set(0,0);material.uniforms.poseMix.value=0;}
 function animateSplat(seconds,p){
   if(!ready)return;
   // Squash around the planted paw line, then settle without bouncing the camera.
   const t=Math.min(1,Math.max(0,seconds/.32)),s=t*t*(3-2*t);
   plane.scale.set(1+s*.8,1-s*.89,1);plane.position.y=.38*3.5*plane.scale.y;
   tailDynamics.set(0,0,0);earDynamics.set(0,0);bodyDynamics.set(0,0);
   root.position.set(p.x,p.y+.10,0);if(camera)billboard.quaternion.copy(camera.quaternion);
   material.uniforms.glow.value=0;
 }
 function animate(dt,p,speed,time,protectedState=false,strideScale=1){if(!ready)return;
   // Use the first complete left/right stride, avoiding the mismatched third row.
   // Cadence changes gradually and remains restrained at maximum game speed.
   cadence=THREE.MathUtils.damp(cadence,1.5*THREE.MathUtils.clamp(speed/16,1,1.3),4,dt);
   gait=(gait+dt*cadence*strideScale)%1;
   const cursor=gait*8,a=Math.floor(cursor);material.uniforms.frameA.value=a;material.uniforms.frameB.value=(a+1)%8;material.uniforms.frameMix.value=cursor-a;
   let pose=-1;if(p.crouch>.35)pose=1;else if(!p.grounded)pose=0;else if(p.landing>.25)pose=2;
   if(pose>=0)lastPose=pose;
   for(let i=0;i<3;i++)poseWeights.setComponent(i,THREE.MathUtils.damp(poseWeights.getComponent(i),pose===i?1:0,22,dt));
   material.uniforms.poseFrame.value=lastPose;material.uniforms.poseMix.value=poseWeights.x+poseWeights.y+poseWeights.z;
   if(p.secondary){const s=p.secondary;tailDynamics.set(s.tailBase.value,s.tailTip.value,s.tailPitch.value);earDynamics.set(s.earLeft.value,s.earRight.value);bodyDynamics.set(s.bodySquash.value+(p.grounded?Math.sin(gait*Math.PI*4)*.008:0),s.bodyTwist.value);}
   // Per-frame UV offsets keep the body centered and the grounded paw line stable.
   root.position.set(p.x,p.y+.10,0);if(camera)billboard.quaternion.copy(camera.quaternion);else billboard.quaternion.identity();
   lean=THREE.MathUtils.damp(lean,THREE.MathUtils.clamp(-p.vx*.003,-.025,.025),9,dt);billboard.rotateZ(lean);
   material.uniforms.glow.value=THREE.MathUtils.damp(material.uniforms.glow.value,p.phase>0?.35:protectedState?.15:0,4,dt);
 }
 function dispose(){disposed=true;material.uniforms.runAtlas.value?.dispose();plane.geometry.dispose();material.dispose();}
 return {root,animate,animateSplat,loaded,reset,dispose,get ready(){return ready;},get failed(){return failed;}};
}
