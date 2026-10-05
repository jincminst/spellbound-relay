export function seeded(seed) {
  let value=seed%2147483647;
  return()=>{
    value=value*16807%2147483647;
    return value/2147483647;
  };
}

export function secureWorldSeed(){
  const values=new Uint32Array(1);
  crypto.getRandomValues(values);
  return(values[0]%2147483646)+1;
}

export function worldSeedFromCode(code){
  let hash=2166136261;
  for(const character of String(code||'')){
    hash^=character.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return(Math.abs(hash)%2147483646)+1;
}
