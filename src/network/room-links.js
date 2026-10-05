const ROOM_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function sanitizeRoomCode(value){
  return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
}

export function createRoomCode(){
  const bytes=new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return[...bytes].map(value=>ROOM_ALPHABET[value%ROOM_ALPHABET.length]).join('');
}

export function relayEndpoint(){
  const protocol=location.protocol==='https:'?'wss':'ws';
  return new URLSearchParams(location.search).get('relay')||`${protocol}://${location.host}/rift-socket`;
}

export async function shareableRiftUrl(roomCode){
  const url=new URL(location.href);
  if(['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname)){
    try{
      const response=await fetch('/__spellbound/network',{cache:'no-store'});
      const network=await response.json();
      if(/^\d{1,3}(\.\d{1,3}){3}$/.test(network.host||''))url.hostname=network.host;
    }catch{}
  }
  url.searchParams.set('room',sanitizeRoomCode(roomCode));
  url.searchParams.delete('demo');
  url.searchParams.delete('relay');
  return url;
}
