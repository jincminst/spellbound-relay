import { WebSocketServer } from 'ws';
import crypto from 'node:crypto';

const port = Number(process.env.PORT || 8080);
const relayHost = process.env.RELAY_HOST || '0.0.0.0';
const wss = new WebSocketServer({
  port,
  host: relayHost,
  maxPayload: 16 * 1024,
  // Compression caused RSV1 protocol failures on some browsers/LAN routes.
  // Game packets are small enough that an uncompressed relay is faster and
  // substantially more reliable for local multiplayer.
  perMessageDeflate: false,
});
const players = new Map();
const rooms = new Map();
const cleanCode = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
const cleanMode = value => ['pvp', 'endless'].includes(value) ? value : 'campaign';
const cleanArena = value => ['frost', 'glacier', 'verdant', 'grove', 'rift', 'caldera', 'warden', 'nexus'].includes(value) ? value : 'frost';
const finiteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clampNumber = (value, minimum, maximum, fallback = 0) => Math.max(minimum, Math.min(maximum, finiteNumber(value, fallback)));
const safeDirection = value => {
  const x=finiteNumber(value?.x),y=finiteNumber(value?.y),z=finiteNumber(value?.z,-1),length=Math.hypot(x,y,z);
  return length>.0001?{x:x/length,y:y/length,z:z/length}:{x:0,y:0,z:-1};
};
const safeCastOrigin = (value, player) => {
  const requested={x:finiteNumber(value?.x,player.x),y:finiteNumber(value?.y,player.y),z:finiteNumber(value?.z,player.z)},dx=requested.x-player.x,dy=requested.y-player.y,dz=requested.z-player.z,distance=Math.hypot(dx,dy,dz);
  if(distance<=3)return requested;const scale=3/Math.max(distance,.001);return{x:player.x+dx*scale,y:player.y+dy*scale,z:player.z+dz*scale};
};

const sendPayload = (socket, payload) => {
  if (socket.readyState !== 1) return;
  try {
    socket.send(payload, { compress: false }, error => {
      if (error && socket.readyState === 1) socket.terminate();
    });
  } catch {
    socket.terminate();
  }
};
const send = (socket, message) => {
  sendPayload(socket, JSON.stringify(message));
};

const sameScope = (player, room, map) => player?.room === room && player?.map === map;
const broadcast = (message, except = null, room = null, map = null) => {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client !== except && client.readyState === 1) {
      const player = players.get(client.id);
      if (!room || sameScope(player, room, map)) sendPayload(client, payload);
    }
  }
};
const broadcastCampaignRoom = (message, room, except = null) => {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) if (client !== except && client.readyState === 1 && players.get(client.id)?.room === room) sendPayload(client, payload);
};

const roomCount = (room, map) => [...players.values()].filter(player => sameScope(player, room, map)).length;
const scopeHost = (room, map) => [...players.values()].filter(player => sameScope(player, room, map)).sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id || null;
const nextPvpSpawnSlot = (room, map) => {
  const occupied = new Set([...players.values()].filter(player => sameScope(player, room, map)).map(player => player.spawnSlot).filter(Number.isInteger));
  let slot = 0;while (occupied.has(slot)) slot++;return slot;
};
const nextPvpTeam = (room, map) => {
  const members = [...players.values()].filter(player => sameScope(player, room, map) && player.mode === 'pvp');
  const alpha = members.filter(player => player.team === 'alpha').length, bravo = members.filter(player => player.team === 'bravo').length;
  return alpha <= bravo ? 'alpha' : 'bravo';
};
const pvpSpawn = (slot, arena, team = null) => {
  if (team) {
    const side = team === 'alpha' ? 1 : -1, lane = Math.floor(slot / 2), column = lane % 5, row = Math.floor(lane / 5);
    return { x: (column - 2) * 5.2, y: 1.72, z: side * Math.max(17, (arena === 'warden' ? 25 : 31) - row * 5), ry: side > 0 ? Math.PI : 0 };
  }
  const order = [0, 6, 3, 9, 1, 7, 4, 10, 2, 8, 5, 11], ring = Math.floor(slot / order.length), index = order[slot % order.length], radius = Math.max(17, (arena === 'warden' ? 29 : 33) - ring * 8), angle = index / order.length * Math.PI * 2 + ring * .21;
  const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius;
  return { x, y: 1.72, z, ry: Math.atan2(x, z) };
};
const broadcastRoomState = (room, map) => broadcast({ type: 'room-state', room, map, count: roomCount(room, map), hostId: scopeHost(room, map) }, null, room, map);
const broadcastPvpReady = (room, map) => {
  const members = [...players.values()].filter(player => sameScope(player, room, map) && player.mode === 'pvp');
  broadcast({ type: 'pvp-ready-state', players: members.map(({ id, name, team, ready }) => ({ id, name, team, ready: Boolean(ready) })) }, null, room, map);
};
const cancelPvpStart = (meta, room, map) => {if(!meta?.pvpStarting)return;meta.pvpStarting=false;meta.pvpStartToken=(meta.pvpStartToken||0)+1;for(const member of players.values())if(sameScope(member,room,map))member.ready=false;broadcast({type:'pvp-start-cancelled'},null,room,map)};
const sendCampaignRosters = (room, map) => {
  const members = [...players.values()].filter(player => sameScope(player, room, map));
  for (const client of wss.clients) {
    const viewer = players.get(client.id);
    if (client.readyState === 1 && sameScope(viewer, room, map)) send(client, { type: 'campaign-roster', players: members.filter(member => member.id !== client.id) });
  }
};

wss.on('connection', socket => {
  socket.id = crypto.randomUUID().slice(0, 8);
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });
  socket.on('error', error => {
    console.warn(`Relay client ${socket.id} disconnected after a WebSocket protocol error: ${error.code || error.message}`);
    if (socket.readyState !== 3) socket.terminate();
  });
  send(socket, { type: 'welcome', id: socket.id });

  socket.on('message', raw => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return; }

    if (data.type === 'lookup-room') {
      const room = cleanCode(data.room), meta = rooms.get(room);
      send(socket, meta ? { type: 'room-info', room, mode: meta.mode, arena: meta.arena, pvpTeams: Boolean(meta.pvpTeams), campaignIndex: meta.campaignIndex ?? 0, pvpRound: meta.pvpRound ?? 0, endlessSeed: meta.endlessSeed, endlessWave: meta.endlessWave ?? 0, endlessConfig: meta.endlessConfig || null } : { type: 'room-missing', room });
      return;
    }

    if (data.type === 'ping') {
      send(socket, { type: 'pong', sentAt: Math.max(0, Number(data.sentAt) || 0) });
      return;
    }

    if (data.type === 'join') {
      const previous = players.get(socket.id);
      if (previous) {
        players.delete(socket.id);
        broadcast({ type: 'player-leave', id: socket.id }, socket, previous.room, previous.map);
        broadcastRoomState(previous.room, previous.map);
      }
      const room = cleanCode(data.room);
      if (!room) return;
      let meta = rooms.get(room);
      if (data.create) {
        if (meta) { send(socket, { type: 'join-error', reason: 'ROOM CODE ALREADY EXISTS' }); return; }
        const mode = cleanMode(data.mode), campaignIndex = Math.max(0, Math.min(7, Math.floor(Number(data.campaignIndex) || 0)));
        meta = { mode, arena: cleanArena(data.arena), pvpTeams: mode === 'pvp' && Boolean(data.pvpTeams), pvpActive: false, pvpStarting: false, campaignIndex, pvpRound: 0, campaignMap: mode === 'campaign' ? String(data.map || 'campaign:frost').slice(0, 48) : null, endlessSeed: mode === 'endless' ? Math.max(1, Math.floor(Number(data.endlessSeed) || 1)) : null, endlessWave: 0, endlessConfig: null, lastPartyPosition: null, createdAt: Date.now(), lastActive: Date.now() };
        rooms.set(room, meta);
      } else if (!meta) {
        send(socket, { type: 'join-error', reason: 'RIFT NOT FOUND' });
        return;
      }
      if(!data.create&&meta.mode==='pvp'&&meta.pvpTeams&&(meta.pvpStarting||meta.pvpActive)&&!data.resume){send(socket,{type:'join-error',reason:'TEAM MATCH ALREADY STARTED'});return}
      meta.lastActive = Date.now();
      const campaignMap = meta.mode === 'campaign' ? (meta.campaignMap || String(data.map || 'campaign:frost').slice(0, 48)) : null;
      const campaignMembers = meta.mode === 'campaign' ? [...players.values()].filter(other => other.room === room && other.map === campaignMap).sort((a, b) => a.joinedAt - b.joinedAt) : [];
      const partyMember = campaignMembers[0] || null;
      const arenaMode = meta.mode === 'pvp' || meta.mode === 'endless', playerMap = arenaMode ? `${meta.mode}:${meta.arena}` : campaignMap, spawnSlot = arenaMode ? nextPvpSpawnSlot(room, playerMap) : null, requestedTeam=['alpha','bravo'].includes(data.team)?data.team:null,team = meta.mode === 'pvp' && meta.pvpTeams ? (data.resume&&requestedTeam?requestedTeam:nextPvpTeam(room, playerMap)) : null, assignedSpawn = arenaMode ? pvpSpawn(spawnSlot, meta.arena, team) : { x: 0, y: 1.1, z: 0, ry: 0 }, resumePvp = arenaMode && Boolean(data.resume) && [data.x, data.y, data.z, data.ry].every(value => Number.isFinite(Number(value))), resumeLimit = meta.arena === 'warden' ? 38 : 48;
      if(meta.mode==='pvp'&&meta.pvpTeams&&meta.pvpStarting)cancelPvpStart(meta,room,playerMap);
      const player = {
        id: socket.id,
        name: String(data.name || 'Wanderer').slice(0, 18),
        map: playerMap,
        room,
        mode: meta.mode,
        arena: meta.arena,
        color: Number(data.color) || 0x79e8ff,
        spawnSlot,
        team,
        ready: false,
        x: resumePvp ? Math.max(-resumeLimit, Math.min(resumeLimit, Number(data.x))) : assignedSpawn.x,
        y: resumePvp ? Math.max(-18, Math.min(80, Number(data.y))) : assignedSpawn.y,
        z: resumePvp ? Math.max(-resumeLimit, Math.min(resumeLimit, Number(data.z))) : assignedSpawn.z,
        ry: resumePvp ? Number(data.ry) : assignedSpawn.ry,
        hp: resumePvp ? Math.max(0,Math.min(100,Number(data.hp)||0)) : 100, crouch: 0, sprint: 100, sprinting: false, jetpackActive: false, jetpackThrusting: false, jetpackBoost: false, fov: 70, shieldActive: false, shieldEnergy: 0, shieldMax: 100, defeated: resumePvp&&Boolean(data.defeated), waitingRoom: resumePvp&&Boolean(data.waitingRoom), selectedSpell: 'fireball', heldDebris: null,
        respawns: Boolean(data.respawns),
        joinedAt: Date.now(), seq: 0,
      };
      players.set(socket.id, player);
      send(socket, { type: 'room-info', room, mode: meta.mode, arena: meta.arena, pvpTeams: Boolean(meta.pvpTeams), pvpActive: Boolean(meta.pvpActive), campaignIndex: meta.campaignIndex ?? 0, pvpRound: meta.pvpRound ?? 0, spawnSlot, team, partyPosition: partyMember ? { x: partyMember.x, y: partyMember.y, z: partyMember.z } : meta.lastPartyPosition, endlessSeed: meta.endlessSeed, endlessWave: meta.endlessWave ?? 0, endlessConfig: meta.endlessConfig || null });
      for (const other of players.values()) {
        if (other.id !== socket.id && sameScope(other, player.room, player.map)) send(socket, { type: 'player-join', player: other });
      }
      broadcast({ type: 'player-join', player }, socket, player.room, player.map);
      broadcastRoomState(player.room, player.map);
      if (meta.mode === 'pvp' && meta.pvpTeams) broadcastPvpReady(player.room, player.map);
      return;
    }

    const player = players.get(socket.id);
    if (!player) return;
    if (data.type === 'state') {
      const planarLimit=player.mode==='campaign'?180:player.mode==='endless'?110:70;
      Object.assign(player, {
        x: clampNumber(data.x,-planarLimit,planarLimit,player.x), y: clampNumber(data.y,-80,100,player.y), z: clampNumber(data.z,-planarLimit,planarLimit,player.z),
        ry: clampNumber(data.ry,-Math.PI*8,Math.PI*8,player.ry), pitch: clampNumber(data.pitch,-1.5,1.5,0), hp: clampNumber(data.hp,0,100,player.hp),
        crouch: Math.max(0, Math.min(1, Number(data.crouch) || 0)),
        sprint: Math.max(0, Math.min(100, Number(data.sprint) || 0)),
        sprinting: Boolean(data.sprinting),
        jetpackActive: Boolean(data.jetpackActive),
        jetpackThrusting: Boolean(data.jetpackThrusting),
        jetpackBoost: Boolean(data.jetpackBoost),
        fov: Math.max(46, Math.min(82, Number(data.fov) || 70)),
        shieldActive: Boolean(data.shieldActive),
        shieldEnergy: Math.max(0, Math.min(200, Number(data.shieldEnergy) || 0)),
        shieldMax: Math.max(1, Math.min(200, Number(data.shieldMax) || 100)),
        defeated: Boolean(data.defeated),
        waitingRoom: Boolean(data.waitingRoom),
        selectedSpell: String(data.selectedSpell || 'fireball').slice(0, 20),
        heldDebris: data.heldDebris && typeof data.heldDebris === 'object' ? {
          x: Math.max(.08, Math.min(1.85, Number(data.heldDebris.x) || .35)),
          y: Math.max(.08, Math.min(1.85, Number(data.heldDebris.y) || .35)),
          z: Math.max(.08, Math.min(1.85, Number(data.heldDebris.z) || .35)),
          color: Math.max(0, Math.min(0xffffff, Math.floor(Number(data.heldDebris.color) || 0x77736d))),
        } : null,
        cooldowns: data.cooldowns && typeof data.cooldowns === 'object' ? Object.fromEntries(Object.entries(data.cooldowns).slice(0, 8).map(([key, value]) => [String(key).slice(0, 20), Math.max(0, Math.min(180000, Number(value) || 0))])) : {},
        vx: clampNumber(data.vx,-60,60), vy: clampNumber(data.vy,-60,60), vz: clampNumber(data.vz,-60,60),
        seq: Math.max(player.seq + 1, Number(data.seq) || 0),
      });
      const roomMeta = rooms.get(player.room);if(player.mode==='campaign'&&roomMeta&&player.map===roomMeta.campaignMap){roomMeta.lastPartyPosition={x:player.x,y:player.y,z:player.z};roomMeta.lastActive=Date.now()}
      broadcast({ type: 'state', player, serverTime: Date.now() }, socket, player.room, player.map);
    } else if (data.type === 'cast') {
      const spell = String(data.spell || '').slice(0, 20), targetId = String(data.targetId || '').slice(0, 16);
      if(!['fireball','missiles','lightning','fog','quake','sword','blast'].includes(spell))return;
      const roomMeta=rooms.get(player.room),cellTarget = spell === 'lightning' ? [...wss.clients].find(client => {const target=players.get(client.id);return client.id === targetId && sameScope(target, player.room, player.map)&&!(player.mode==='pvp'&&roomMeta?.pvpTeams&&player.team&&player.team===target?.team)}) : null;
      const power = clampNumber(data.power,1,2,1),origin=safeCastOrigin(data.origin,player),direction=safeDirection(data.direction);
      broadcast({ type: 'cast', from: socket.id, spell, origin, direction, targetId, targetedCell: Boolean(cellTarget), power }, socket, player.room, player.map);
      if (cellTarget) send(cellTarget, { type: 'cell-attempt', from: socket.id, origin, power });
    } else if (data.type === 'debris-throw') {
      const vector = value => ({ x: Number(value?.x) || 0, y: Number(value?.y) || 0, z: Number(value?.z) || 0 });
      const appearance = data.appearance && typeof data.appearance === 'object' ? {
        x: Math.max(.08, Math.min(1.85, Number(data.appearance.x) || .35)),
        y: Math.max(.08, Math.min(1.85, Number(data.appearance.y) || .35)),
        z: Math.max(.08, Math.min(1.85, Number(data.appearance.z) || .35)),
        color: Math.max(0, Math.min(0xffffff, Math.floor(Number(data.appearance.color) || 0x77736d))),
      } : { x: .35, y: .35, z: .35, color: 0x77736d };
      broadcast({ type: 'debris-throw', from: socket.id, appearance, origin: vector(data.origin), velocity: vector(data.velocity), angular: vector(data.angular) }, socket, player.room, player.map);
    } else if (data.type === 'campaign-progress') {
      const meta = rooms.get(player.room);
      if (!meta || meta.mode !== 'campaign') return;
      const requested = Math.max(0, Math.min(7, Math.floor(Number(data.campaignIndex) || 0))), current = meta.campaignIndex ?? 0;
      if (requested < current || requested > current + 1) return;
      const campaignMap = String(data.map || '').slice(0, 48);
      if (!campaignMap.startsWith('campaign:')) return;
      meta.campaignIndex = requested;meta.campaignMap = campaignMap;meta.lastActive = Date.now();
      for (const member of players.values()) if (member.room === player.room){member.map=campaignMap;if(member.id===player.id){const x=Number(data.position?.x),y=Number(data.position?.y),z=Number(data.position?.z);if(Number.isFinite(x))member.x=x;if(Number.isFinite(y))member.y=y;if(Number.isFinite(z))member.z=z}}
      meta.lastPartyPosition={x:player.x,y:player.y,z:player.z};broadcastCampaignRoom({ type: 'campaign-progress', from: socket.id, campaignIndex: requested, position: meta.lastPartyPosition }, player.room, socket);
      broadcastRoomState(player.room, campaignMap);
      sendCampaignRosters(player.room, campaignMap);
    } else if (data.type === 'world-state') {
      if (scopeHost(player.room, player.map) !== socket.id) return;
      const helpers = Array.isArray(data.helpers) ? data.helpers.slice(0, 5).map((helper, index) => ({
        name: String(helper?.name || `AEGIS ${index + 1}`).slice(0, 18),
        x: Number(helper?.x) || 0, y: Number(helper?.y) || 0, z: Number(helper?.z) || 0,
        ry: Number(helper?.ry) || 0, hp: Math.max(0, Math.min(100, Number(helper?.hp) || 0)),
        d: Boolean(helper?.d), shield: Boolean(helper?.shield), shieldEnergy: Math.max(0, Math.min(100, Number(helper?.shieldEnergy) || 0)),
      })) : [];
      const debris = Array.isArray(data.debris) ? data.debris.slice(0, 32).filter(record => Array.isArray(record) && record.length >= 19).map(record => record.slice(0, 19).map((value, index) => index === 11 ? Math.max(0, Math.min(0xffffff, Math.floor(Number(value) || 0))) : Number(value) || 0)) : undefined;
      broadcast({ type: 'world-state', from: socket.id, seq: Number(data.seq) || 0, bots: data.bots, helpers, crystals: data.crystals, drones: data.drones, debris, finalPhase: data.finalPhase, finalWave: data.finalWave, phaseRemaining: data.phaseRemaining, endlessWave: data.endlessWave }, socket, player.room, player.map);
    } else if (data.type === 'endless-wave') {
      if (player.mode !== 'endless' || scopeHost(player.room, player.map) !== socket.id) return;
      const meta = rooms.get(player.room), wave = Math.max(1, Math.floor(Number(data.wave) || 1));
      const config = { count: Math.max(1, Math.min(60, Math.floor(Number(data.config?.count) || 1))), difficulty: ['easy', 'normal', 'hard', 'nightmare'].includes(data.config?.difficulty) ? data.config.difficulty : 'easy', wardens: Math.max(0, Math.min(5, Math.floor(Number(data.config?.wardens) || 0))), drones: Math.max(0, Math.min(12, Math.floor(Number(data.config?.drones) || 0))), arena: cleanArena(data.config?.arena), seed: Math.max(1, Math.floor(Number(data.config?.seed) || 1)) };
      if (meta) { meta.endlessWave = wave; meta.endlessConfig = config; meta.lastActive = Date.now(); }
      broadcast({ type: 'endless-wave', wave, config }, socket, player.room, player.map);
    } else if (data.type === 'endless-upgrade') {
      if (player.mode !== 'endless' || scopeHost(player.room, player.map) !== socket.id) return;
      broadcast({ type: 'endless-upgrade', wave: Math.max(1, Math.floor(Number(data.wave) || 1)) }, socket, player.room, player.map);
    } else if (data.type === 'endless-game-over') {
      if (player.mode !== 'endless' || scopeHost(player.room, player.map) !== socket.id) return;
      broadcast({ type: 'endless-game-over', wave: Math.max(1, Math.floor(Number(data.wave) || 1)) }, socket, player.room, player.map);
    } else if (data.type === 'pvp-ready') {
      const meta = rooms.get(player.room);if(player.mode !== 'pvp' || !meta?.pvpTeams || meta.pvpActive || meta.pvpStarting)return;
      player.ready = Boolean(data.ready);broadcastPvpReady(player.room, player.map);
      const members=[...players.values()].filter(member=>sameScope(member,player.room,player.map)&&member.mode==='pvp'),teams=new Set(members.map(member=>member.team));
      if(members.length>=2&&teams.has('alpha')&&teams.has('bravo')&&members.every(member=>member.ready)){meta.pvpStarting=true;meta.lastActive=Date.now();const token=meta.pvpStartToken=(meta.pvpStartToken||0)+1,room=player.room,map=player.map,startsAt=Date.now()+5000;broadcast({type:'pvp-start',round:meta.pvpRound,startsAt},null,room,map);setTimeout(()=>{if(rooms.get(room)===meta&&meta.pvpStartToken===token){meta.pvpStarting=false;meta.pvpActive=true}},5100)}
    } else if (data.type === 'pvp-game-over') {
      const meta = rooms.get(player.room), round = Math.max(0, Math.floor(Number(data.round) || 0));
      if (player.mode !== 'pvp' || player.defeated || !meta || round !== (meta.pvpRound ?? 0)) return;
      broadcast({ type: 'pvp-game-over', winnerId: socket.id, winnerTeam: meta.pvpTeams ? player.team : null, round }, null, player.room, player.map);meta.pvpActive=false;meta.pvpStarting=false;
    } else if (data.type === 'pvp-rematch') {
      if (player.mode !== 'pvp') return;
      const meta = rooms.get(player.room), currentRound = Math.max(0, Math.floor(Number(meta?.pvpRound) || 0)), requestedRound = Math.max(0, Math.floor(Number(data.round) || 0));
      if (!meta || requestedRound !== currentRound) return;
      meta.pvpRound = currentRound + 1;meta.pvpActive=false;meta.pvpStarting=false;meta.lastActive = Date.now();
      for (const member of players.values()) if (sameScope(member, player.room, player.map)) { member.hp = 100;member.defeated = false;member.waitingRoom = false;member.ready=false;member.shieldActive = false;member.shieldEnergy = 0;member.jetpackActive = false;member.jetpackThrusting = false;member.jetpackBoost = false;member.cooldowns = {};member.heldDebris = null; }
      broadcast({ type: 'pvp-rematch', round: meta.pvpRound }, null, player.room, player.map);
      if(meta.pvpTeams)broadcastPvpReady(player.room,player.map);
    } else if (data.type === 'bot-hit') {
      const hostId = scopeHost(player.room, player.map);
      for (const client of wss.clients) if (client.id === hostId && client !== socket) send(client, { type: 'bot-hit', from: socket.id, target: Math.max(0, Math.floor(Number(data.target) || 0)), amount: Math.max(0, Math.min(150, Number(data.amount) || 0)), spell: String(data.spell || 'attack').slice(0, 32) });
    } else if (data.type === 'object-hit') {
      const hostId = scopeHost(player.room, player.map);
      for (const client of wss.clients) if (client.id === hostId && client !== socket) send(client, { type: 'object-hit', from: socket.id, kind: data.kind === 'crystal' ? 'crystal' : 'drone', target: Math.max(0, Math.floor(Number(data.target) || 0)), amount: Math.max(0, Math.min(50, Number(data.amount) || 0)) });
    } else if (data.type === 'enemy-cast') {
      if (scopeHost(player.room, player.map) !== socket.id) return;
      broadcast({ type: 'enemy-cast', bot: Math.max(0, Math.floor(Number(data.bot) || 0)), spell: String(data.spell || '').slice(0, 20), target: String(data.target || '').slice(0, 16) }, socket, player.room, player.map);
    } else if (data.type === 'hit') {
      for (const client of wss.clients) {
        const target = players.get(client.id);
        if (client.id === data.target && sameScope(target, player.room, player.map) && !(player.mode==='pvp'&&rooms.get(player.room)?.pvpTeams&&player.team&&player.team===target.team)) send(client, { type: 'damage', amount: Math.max(0, Math.min(150, Number(data.amount) || 0)), spell: data.spell, from: socket.id });
      }
    }
  });

  socket.on('close', () => {
    const player = players.get(socket.id);
    players.delete(socket.id);
    if (player) {
      const meta=rooms.get(player.room);if(player.mode==='pvp'&&meta?.pvpTeams&&meta.pvpStarting)cancelPvpStart(meta,player.room,player.map);
      broadcast({ type: 'player-leave', id: socket.id }, null, player.room, player.map);
      broadcastRoomState(player.room, player.map);
      if(player.mode==='pvp'&&rooms.get(player.room)?.pvpTeams)broadcastPvpReady(player.room,player.map);
    }
  });
});

setInterval(() => {
  for (const client of wss.clients) {
    if (!client.isAlive) { client.terminate(); continue; }
    if (client.readyState === 1) { client.isAlive = false; client.ping(); }
  }
}, 20000);

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) if (![...players.values()].some(player => player.room === code) && now - room.lastActive > 2 * 60 * 60 * 1000) rooms.delete(code);
}, 10 * 60 * 1000);

wss.on('listening', () => console.log(`Spellbound relay listening on ws://${relayHost}:${port}`));
wss.on('error', error => console.error(`Spellbound relay failed on port ${port}: ${error.message}`));
