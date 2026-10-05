import * as THREE from 'three';

export function createArenaGenerators({world,state,mat,addInstances,spawnSurfaceFire,addAmbientParticles}){
  function generateRift(rand,cfg){
    const rockMat=mat(0x151214,.98,.05); const glow=mat(0x6e1508,.8,.1,0xff3400,3);
    addInstances(new THREE.DodecahedronGeometry(1,0),rockMat,30,d=>{const a=rand()*Math.PI*2,r=10+rand()*43,s=.7+rand()*3.2;d.position.set(Math.cos(a)*r,s*.55,Math.sin(a)*r);d.scale.set(s,s*(.8+rand()*2.6),s);d.rotation.set(rand()*2,rand()*2,rand()*2)},true);
    addInstances(new THREE.PlaneGeometry(1,1),glow,9,d=>{const a=rand()*Math.PI*2,r=15+rand()*35;d.scale.set(1+rand()*1.5,8+rand()*11,1);d.rotation.set(-Math.PI/2,0,a+rand());d.position.set(Math.cos(a)*r,.025,Math.sin(a)*r)});
    addInstances(new THREE.ConeGeometry(1,1,5),mat(0x120e10,1),14,(d,i)=>{const a=i/14*Math.PI*2,r=58+rand()*10,h=14+rand()*30;d.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);d.scale.set(7+rand()*7,h,7+rand()*7);d.rotation.y=rand()*3},true);
    for(let i=0;i<2;i++){const a=rand()*Math.PI*2,r=18+rand()*28;const light=new THREE.PointLight(0xff3c13,7,17,2);light.position.set(Math.cos(a)*r,.35,Math.sin(a)*r);world.add(light)}
    for(const [x,z] of [[-28,-17],[-13,27],[17,-25],[30,13],[4,34],[-35,7]])spawnSurfaceFire(new THREE.Vector3(x,0,z),0xff5126,{ambient:true,life:Infinity,scale:.88});
    addAmbientParticles(48,cfg.accent,.085,rand);
  }
  function generateCaldera(rand,cfg){
    const steel=mat(0x30383d,.38,.78),rust=mat(0x5b3723,.68,.45,0xff762b,.08),warning=mat(0x33281e,.5,.62,0xff9d35,1.9),electric=mat(0x193847,.26,.72,0x63d9ff,3.4);
    // A real central landmark: the turbine creates a dangerous roundabout instead
    // of another empty circle filled with rocks.
    const turbine=new THREE.Group(),rotor=new THREE.Mesh(new THREE.TorusGeometry(7.4,.72,8,28),steel),hub=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,3.4,12),rust);rotor.rotation.x=Math.PI/2;rotor.position.y=4.2;hub.rotation.z=Math.PI/2;hub.position.y=4.2;turbine.add(rotor,hub);for(let i=0;i<6;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.65,5.2,1.1),warning);blade.position.set(0,4.2,0);blade.rotation.z=i*Math.PI/3;turbine.add(blade)}world.add(turbine);
    addInstances(new THREE.BoxGeometry(1,1,1),steel,12,(d,i)=>{const quadrant=i%4,a=quadrant*Math.PI/2,row=Math.floor(i/4),r=16+row*13,x=Math.cos(a)*r,z=Math.sin(a)*r;d.position.set(x,1.2,z);d.scale.set(4.8,2.4,3.2);d.rotation.y=-a+(i%2?.22:-.22)},true);
    // Four pipe corridors point at the turbine, with gaps wide enough to flank.
    addInstances(new THREE.CylinderGeometry(.42,.42,5.6,8),rust,24,(d,i)=>{const arm=i%4,a=arm*Math.PI/2,step=Math.floor(i/4),r=12+step*7;d.position.set(Math.cos(a)*r,1.05,Math.sin(a)*r);d.rotation.set(Math.PI/2,0,-a);d.scale.set(1,1,1)},false);
    addInstances(new THREE.CylinderGeometry(.8,1.15,1,10),steel,8,(d,i)=>{const a=i*Math.PI/4,r=45,h=9+(i%3)*3;d.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);d.scale.y=h},true);
    addInstances(new THREE.BoxGeometry(1,1,1),warning,16,(d,i)=>{const a=(i%8)*Math.PI/4,r=i<8?29:51;d.position.set(Math.cos(a)*r,.09,Math.sin(a)*r);d.scale.set(2.5,.12,.55);d.rotation.y=-a});
    for(const [x,z] of [[-18,-18],[18,18],[-35,12],[34,-14]]){const light=new THREE.PointLight(0x63d9ff,4.5,16,2);light.position.set(x,2.4,z);world.add(light);const coil=new THREE.Mesh(new THREE.TorusKnotGeometry(.55,.12,28,5),electric);coil.position.copy(light.position);world.add(coil)}
    // A broken containment cage gives the refinery a skyline and creates four
    // obvious combat sectors without filling the floor with disposable clutter.
    addInstances(new THREE.TorusGeometry(11.2,.24,8,40),electric,3,(d,i)=>{d.position.set(0,3.2+i*2.25,0);d.rotation.set(Math.PI/2+(i-1)*.07,i*.18,0)});
    addInstances(new THREE.BoxGeometry(1,1,1),steel,8,(d,i)=>{const a=i*Math.PI/4,r=12.4,h=i%2?7.4:10.2;d.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);d.scale.set(.55,h,.55);d.rotation.y=-a},true);
    // Two loading gantries frame the arena and make the long flanks play very
    // differently from the cramped turbine roundabout.
    for(const side of [-1,1]){const gantry=new THREE.Group(),beam=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.15,25),rust);beam.position.set(side*39,6.8,0);gantry.add(beam);for(const z of [-10.5,10.5]){const leg=new THREE.Mesh(new THREE.BoxGeometry(1.5,7.2,1.5),steel);leg.position.set(side*39,3.6,z);gantry.add(leg);state.colliders.push({x:side*39,z,radius:1.05,bottom:0,top:7.2,owner:leg});state.blockers.push(leg)}const hook=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,4.2,7),warning);hook.position.set(side*39,4.15,side*4.5);gantry.add(hook);world.add(gantry)}
    // Hazard chevrons visually connect the outer refinery to the central machine.
    addInstances(new THREE.BoxGeometry(4.8,.045,.22),warning,24,(d,i)=>{const lane=i%4,a=lane*Math.PI/2,step=Math.floor(i/4),r=15+step*5.8;d.position.set(Math.cos(a)*r,.08,Math.sin(a)*r);d.rotation.y=-a});
    addAmbientParticles(26,0xb8d9e8,.04,rand);
  }
  function generateHollow(rand,cfg){
    const shard=mat(0x120e19,.24,.72,0x21062d,.35),vein=mat(0x153944,.2,.55,0x35dfff,2.8);addInstances(new THREE.OctahedronGeometry(1,0),shard,34,d=>{const a=rand()*Math.PI*2,r=8+rand()*44,s=.6+rand()*2.4;d.position.set(Math.cos(a)*r,1+rand()*9,Math.sin(a)*r);d.scale.set(s*.45,s*(1.2+rand()*2.3),s*.45);d.rotation.set(rand()*3,rand()*3,rand()*3)},true);addInstances(new THREE.TorusGeometry(1,.055,5,18),vein,12,d=>{const a=rand()*Math.PI*2,r=9+rand()*38,s=1.2+rand()*3;d.position.set(Math.cos(a)*r,.12+rand()*3,Math.sin(a)*r);d.scale.setScalar(s);d.rotation.set(rand()*3,rand()*3,rand()*3)});for(let i=0;i<3;i++){const light=new THREE.PointLight(i%2?0x45e6ff:0xc64fff,5,20,2);light.position.set((rand()-.5)*48,2+rand()*5,(rand()-.5)*48);world.add(light)}addAmbientParticles(64,0x9b5cff,.095,rand)
  }
  function generateNexus(rand,cfg){
    const sandstone=mat(0x8b6a43,.94,.02),dark=mat(0x33271d,.98,.01),script=mat(0x244c49,.58,.18,0x52ffe2,2.15);
    // Three long reading aisles make ranged duels play differently from every
    // radial arena. Their staggered breaks are intentional crossing points.
    const shelves=[];for(const x of [-23,0,23])for(let z=-39;z<=39;z+=13)if(!((x===0&&Math.abs(z)<7)||(x!==0&&Math.abs(z-13*Math.sign(x))<7)))shelves.push({x,z,turn:(Math.floor((z+39)/13)+Math.abs(x))%2});
    addInstances(new THREE.BoxGeometry(1,1,1),dark,shelves.length,(d,i)=>{const shelf=shelves[i];d.position.set(shelf.x,2.15,shelf.z);d.scale.set(8.5,4.3,1.35);d.rotation.y=shelf.turn?.045:-.045},true);
    addInstances(new THREE.BoxGeometry(1,1,1),sandstone,18,(d,i)=>{const side=i%2?-1:1,row=Math.floor(i/2),z=-47+row*11.7;d.position.set(side*42,3.1,z);d.scale.set(3.2,6.2,2.2);d.rotation.z=side*(rand()-.5)*.08},true);
    // Broken gates produce recognisable rooms without closing the arena.
    addInstances(new THREE.CylinderGeometry(.65,.88,1,8),sandstone,12,(d,i)=>{const gate=Math.floor(i/4),part=i%4,x=(gate-1)*23+(part<2?-5.2:5.2),z=[-29,0,29][gate],h=5.5+(part%2)*1.2;d.position.set(x,h/2,z);d.scale.y=h},true);
    addInstances(new THREE.BoxGeometry(1,1,1),sandstone,6,(d,i)=>{const gate=Math.floor(i/2),half=i%2,direction=half?-1:1;d.position.set((gate-1)*23+direction*3.8,6.1,[ -29,0,29][gate]);d.scale.set(3.1,.75,1.15);d.rotation.z=direction*.12},true);
    addInstances(new THREE.PlaneGeometry(2.6,.42),script,22,(d,i)=>{const shelf=shelves[i%shelves.length];d.position.set(shelf.x+(i%2?1.9:-1.9),2.4,shelf.z+(i%2?.69:-.69));d.rotation.y=i%2?0:Math.PI});
    // The archive now has a recognisable central reading rotunda instead of an
    // empty crossing between shelves. Its open arches preserve every exit.
    addInstances(new THREE.CylinderGeometry(.58,.72,5.8,8),sandstone,8,(d,i)=>{const a=i*Math.PI/4,r=9.5;d.position.set(Math.cos(a)*r,2.9,Math.sin(a)*r);d.rotation.z=(i%2?1:-1)*.035},true);
    addInstances(new THREE.BoxGeometry(5.8,.62,1.05),sandstone,8,(d,i)=>{const a=i*Math.PI/4,r=9.5;d.position.set(Math.cos(a)*r,5.55,Math.sin(a)*r);d.rotation.y=-a},true);
    const oculus=new THREE.Mesh(new THREE.TorusGeometry(5.7,.23,9,38),script);oculus.position.set(0,6.05,0);oculus.rotation.x=Math.PI/2;world.add(oculus);
    // Cyan index-lines form a readable route through the maze at a glance.
    addInstances(new THREE.BoxGeometry(.14,.035,8),script,18,(d,i)=>{const aisle=i%3,x=[-23,0,23][aisle],row=Math.floor(i/3);d.position.set(x,.075,-34+row*13.4)});
    addInstances(new THREE.BoxGeometry(1,1,1),sandstone,9,(d,i)=>{const a=i/9*Math.PI*2+.3,r=34+(i%2)*9;d.position.set(Math.cos(a)*r,.65,Math.sin(a)*r);d.scale.set(3.8,.7,1.3);d.rotation.set(0,-a+(i%2?.5:-.25),(i%3-1)*.13)},true);
    const archiveLight=new THREE.PointLight(0x52ffe2,5,30,2);archiveLight.position.set(0,5,0);world.add(archiveLight);addAmbientParticles(31,0xf4c98d,.045,rand);
  }
  function generateRuins(rand,cfg){
    const stone=mat(0x59665b,.95,.02), moss=mat(0x29432d,1,0);
    addInstances(new THREE.CylinderGeometry(.62,.85,1,6),stone,24,d=>{const a=rand()*Math.PI*2,r=8+rand()*45,h=2+rand()*8;d.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);d.scale.set(.7+rand()*.5,h,.7+rand()*.5);d.rotation.z=(rand()-.5)*.15},true);
    const treeData=Array.from({length:34},()=>{const a=rand()*Math.PI*2,r=12+rand()*48;return{x:Math.cos(a)*r,z:Math.sin(a)*r,h:2+rand()*3,s:1+rand()*1.7}});
    const trunks=addInstances(new THREE.CylinderGeometry(.15,.3,1,6),mat(0x372a1c,1),treeData.length,(d,i)=>{const t=treeData[i];d.position.set(t.x,t.h/2,t.z);d.scale.y=t.h},true);trunks.userData.flammable=true;
    const canopies=addInstances(new THREE.IcosahedronGeometry(1,1),moss,treeData.length,(d,i)=>{const t=treeData[i];d.position.set(t.x,t.h+.8,t.z);d.scale.setScalar(t.s)});trunks.userData.linkedVisual=canopies;
    for(let i=0;i<2;i++){const a=rand()*Math.PI*2,r=12+rand()*35;const light=new THREE.PointLight(0x9be67a,2.2,12,2);light.position.set(Math.cos(a)*r,1.2,Math.sin(a)*r);world.add(light)}
    addAmbientParticles(36,0xb9ee8c,.06,rand);
  }
  function generateGrove(rand,cfg){
    const bone=new THREE.MeshStandardMaterial({color:0xc6b58e,roughness:.9,metalness:0,emissive:0x342b19,emissiveIntensity:.08}),marrow=mat(0x534331,.95,.01),lichen=mat(0x285841,.92,.01,0x45d99a,.55);
    // The spine divides the field lengthwise; paired ribs create a sequence of
    // chambers instead of generic scattered cover.
    addInstances(new THREE.DodecahedronGeometry(1,0),bone,13,(d,i)=>{const z=-42+i*7;d.position.set(Math.sin(i*.7)*1.6,1.05,z);d.scale.set(2.25,1.25,2.7);d.rotation.set(.12,i*.38,.08)},true);
    addInstances(new THREE.CylinderGeometry(.42,.72,1,8),bone,24,(d,i)=>{const pair=Math.floor(i/2),side=i%2?-1:1,z=-38+pair*7,x=side*(7.2+(pair%3)*1.2),length=11+(pair%2)*1.5;d.position.set(x,3.6,z);d.scale.set(1,length,1);d.rotation.set(0,0,side*(1.02+(pair%2)*.08))},true);
    // The skull is asymmetrical and large enough to fight through its eye gaps.
    addInstances(new THREE.DodecahedronGeometry(1,1),bone,5,(d,i)=>{const pieces=[[0,4.2,-49,7,4.5,6],[-6.1,3.2,-46,3.1,3.4,3.5],[6.1,3.2,-46,3.1,3.4,3.5],[-5.4,1.1,-53,1.2,2.4,4.5],[5.4,1.1,-53,1.2,2.4,4.5]][i];d.position.set(pieces[0],pieces[1],pieces[2]);d.scale.set(pieces[3],pieces[4],pieces[5]);d.rotation.y=(i-2)*.08},true);
    addInstances(new THREE.ConeGeometry(.45,1.8,6),marrow,16,(d,i)=>{const side=i%2?-1:1,row=Math.floor(i/2),dirtX=side*(20+row%3*7),z=-36+row*10;d.position.set(dirtX,.85,z);d.rotation.z=side*.28},true);
    addInstances(new THREE.IcosahedronGeometry(.48,1),lichen,18,(d,i)=>{d.position.set((rand()-.5)*78,.35+rand()*1.1,-44+rand()*87);d.scale.setScalar(.7+rand()*1.7)});
    // A half-buried jaw makes the south end as memorable as the skull. Players
    // can fight through its teeth, while the open centre remains a clean route.
    addInstances(new THREE.CylinderGeometry(.48,.72,1,7),bone,10,(d,i)=>{const side=i%2?-1:1,row=Math.floor(i/2),x=side*(4.5+row*2.6),z=44-row*.95,h=3.4+row*.7;d.position.set(x,h/2-.35,z);d.scale.y=h;d.rotation.z=side*(.13+row*.045)},true);
    addInstances(new THREE.ConeGeometry(.48,2.8,7),bone,8,(d,i)=>{const side=i%2?-1:1,row=Math.floor(i/2);d.position.set(side*(3.2+row*3.05),1.25,40-row*.62);d.rotation.z=side*.17},true);
    // Giant claw bones on each flank make short, curved cover lanes rather than
    // another collection of random rocks.
    addInstances(new THREE.CylinderGeometry(.34,.6,1,7),bone,12,(d,i)=>{const side=i<6?-1:1,index=i%6,a=-.8+index*.32,x=side*(29+Math.cos(a)*7),z=-4+Math.sin(a)*17,length=5.2+index*.45;d.position.set(x,1.25,z);d.scale.y=length;d.rotation.set(Math.PI/2+a*.35,0,side*(1.1-a*.18))},true);
    // Broad bioluminescent patches supply direction and atmosphere at negligible
    // geometry cost; unlike old debris, none of these obstruct movement.
    addInstances(new THREE.CircleGeometry(1,18),new THREE.MeshBasicMaterial({color:0x42c98b,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}),7,(d,i)=>{const points=[[-19,-30],[18,-19],[-25,9],[25,19],[-13,31],[15,36],[31,-33]][i];d.position.set(points[0],.055,points[1]);d.rotation.x=-Math.PI/2;d.scale.setScalar(3.2+(i%3)*1.2)});
    for(const [x,z] of [[-15,-12],[17,8],[-27,30],[29,-31]]){const light=new THREE.PointLight(0x66efae,2.8,13,2);light.position.set(x,.8,z);world.add(light)}addAmbientParticles(32,0xd8c99f,.045,rand);
  }
  function generateFrost(rand,cfg){
    const ice=new THREE.MeshPhysicalMaterial({color:0x9bcbd4,roughness:.24,metalness:.08,clearcoat:.7,clearcoatRoughness:.18,emissive:0x173842,emissiveIntensity:.12});
    addInstances(new THREE.ConeGeometry(1,1,5),ice,26,d=>{const a=rand()*Math.PI*2,r=9+rand()*46,h=2+rand()*10,s=.4+rand()*1.5;d.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);d.scale.set(s,h,s);d.rotation.z=(rand()-.5)*.4},true);
    addInstances(new THREE.ConeGeometry(1,1,4),mat(0xb8d3d8,.75,.05),14,(d,i)=>{const a=i/14*Math.PI*2,r=58+rand()*9,h=10+rand()*24,s=8+rand()*5;d.position.set(Math.cos(a)*r,h/2-2,Math.sin(a)*r);d.scale.set(s,h,s);d.rotation.y=rand()*2},true);
    for(let i=0;i<2;i++){const a=rand()*Math.PI*2,r=16+rand()*32;const light=new THREE.PointLight(0x77ddff,3,15,2);light.position.set(Math.cos(a)*r,.5,Math.sin(a)*r);world.add(light)}
    addAmbientParticles(52,0xd9fbff,.065,rand);
  }
  function generateGlacier(rand,cfg){
    const regolith=mat(0x4e5762,.96,.04),probe=mat(0x8b9299,.31,.76),solar=mat(0x142c54,.22,.58,0x3088ff,.35),beacon=mat(0xb9eaff,.2,.48,0x5ad9ff,3.5);
    // Concentric ejecta gives this map a bowl silhouette. The broken probe forms
    // a central, directional landmark rather than a field of ice spikes.
    addInstances(new THREE.DodecahedronGeometry(1,0),regolith,28,(d,i)=>{const ring=i<12?0:1,index=i<12?i:i-12,count=i<12?12:16,a=index/count*Math.PI*2+rand()*.12,r=ring?47:35,s=ring?2.1+rand()*2.8:1.1+rand()*2;d.position.set(Math.cos(a)*r,s*.35-1.1,Math.sin(a)*r);d.scale.set(s,1+rand()*1.4,s*1.25);d.rotation.set(rand(),rand()*2,rand())},true);
    const hull=new THREE.Mesh(new THREE.CylinderGeometry(3.1,4.2,17,10),probe);hull.position.set(-3,2.2,0);hull.rotation.z=1.17;hull.rotation.y=.35;hull.castShadow=hull.receiveShadow=true;hull.userData.blocksSight=true;world.add(hull);state.blockers.push(hull);state.colliders.push({x:-3,z:0,radius:5.2,bottom:-1,top:7,owner:hull});
    addInstances(new THREE.BoxGeometry(1,1,1),solar,6,(d,i)=>{const side=i%2?-1:1,row=Math.floor(i/2),x=side*(9+row*8),z=(row-1)*7;d.position.set(x,.75,z);d.scale.set(7,.22,4.5);d.rotation.set((rand()-.5)*.22,(rand()-.5)*.3,side*(.12+rand()*.18))},true);
    addInstances(new THREE.CylinderGeometry(.18,.32,1,7),beacon,7,(d,i)=>{const a=i/7*Math.PI*2,r=20+(i%2)*8,h=2.4+(i%3);d.position.set(Math.cos(a)*r,h/2-1.2,Math.sin(a)*r);d.scale.y=h},true);
    addInstances(new THREE.OctahedronGeometry(1,0),regolith,14,(d,i)=>{const a=i/14*Math.PI*2+rand()*.25,r=10+rand()*20,s=.5+rand()*1.2;d.position.set(Math.cos(a)*r,-1.1+s*.35,Math.sin(a)*r);d.scale.set(s,s*.7,s)},true);
    // The probe's separated command dish establishes a second destination and a
    // strong diagonal axis across the impact basin.
    const dishGroup=new THREE.Group(),mast=new THREE.Mesh(new THREE.CylinderGeometry(.28,.42,7.2,8),probe),dish=new THREE.Mesh(new THREE.SphereGeometry(4.4,20,8,0,Math.PI*2,0,Math.PI*.38),probe),dishGlow=new THREE.Mesh(new THREE.TorusGeometry(3.55,.09,6,30),beacon);mast.position.y=3.25;dish.position.y=7;dish.rotation.set(-.72,0,.36);dishGlow.position.set(0,7.12,-.2);dishGlow.rotation.set(-.72,0,.36);dishGroup.position.set(28,0,-25);dishGroup.add(mast,dish,dishGlow);world.add(dishGroup);state.blockers.push(mast);state.colliders.push({x:28,z:-25,radius:.8,bottom:-.35,top:7,owner:mast});
    // Radial fracture trenches are painted into the regolith as dark, luminous
    // seams, making the crater read as an impact site from ground level.
    const fracture=mat(0x101722,.84,.12,0x225c8d,.75);addInstances(new THREE.BoxGeometry(.28,.055,1),fracture,34,(d,i)=>{const ray=i%7,a=ray/7*Math.PI*2+.18,step=Math.floor(i/7),r=9+step*8.4,length=7.2;d.position.set(Math.cos(a)*r,-.91,Math.sin(a)*r);d.scale.z=length;d.rotation.y=-a});
    // A trail of large wreck sections leads away from the hull. These replace
    // tiny debris with a few useful pieces of hard cover.
    addInstances(new THREE.BoxGeometry(1,1,1),probe,7,(d,i)=>{const x=-12-i*5.1,z=7+i*3.8,s=1.2+(i%3)*.55;d.position.set(x,.35+s*.3,z);d.scale.set(2.7+s,s*.72,1.1+s*.28);d.rotation.set((i%2?1:-1)*.18,-.55+i*.09,(i%3-1)*.16)},true);
    const signal=new THREE.Mesh(new THREE.CylinderGeometry(.035,.22,24,8,1,true),new THREE.MeshBasicMaterial({color:0x7de5ff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false}));signal.position.set(28,19,-25);world.add(signal);
    const coldLight=new THREE.PointLight(0x67dfff,6,34,2);coldLight.position.set(-2,5,0);world.add(coldLight);addAmbientParticles(24,0xa9c8e8,.035,rand);
  }

  return{
    rift:generateRift,
    stormworks:generateCaldera,
    hollow:generateHollow,
    warden:generateHollow,
    archive:generateNexus,
    verdant:generateRuins,
    titan:generateGrove,
    frost:generateFrost,
    moonfall:generateGlacier,
  };
}

