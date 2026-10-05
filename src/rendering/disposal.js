function disposeObject(object,{disposeSpriteMaps=false}={}){
  object.traverse(child=>{
    if(child.geometry&&!child.geometry.userData.shared)child.geometry.dispose();
    if(!child.material)return;
    const materials=Array.isArray(child.material)?child.material:[child.material];
    for(const material of materials){
      if(disposeSpriteMaps&&(child.isSprite||child.userData.actorCard))material.map?.dispose();
      material.dispose();
    }
  });
}

export function disposeGroup(group){
  disposeObject(group);
  group.clear();
}

export function removeAndDispose(parent,object){
  if(!object)return;
  parent.remove(object);
  disposeObject(object,{disposeSpriteMaps:true});
}
