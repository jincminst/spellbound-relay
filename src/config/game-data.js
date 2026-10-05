export const MAPS = {
  rift: { name:'OBSIDIAN RIFT', description:'Magma fissures punish predictable positioning',generator:'rift', sky:0x100b0c, horizon:0x6a2115, fog:0x25100e, ground:0x171315, sun:0xff7445, accent:0xff4d1f, texture:'./textures/obsidian-ground-lite.jpg' },
  caldera: { name:'IRON TEMPEST', description:'Reactor EMP pulses drain active shields',generator:'stormworks', sky:0x0c141b, horizon:0x496170, fog:0x1d2a32, ground:0x343a3c, sun:0xb9dcf0, accent:0xffa43b, texture:'./textures/obsidian-ground-lite.jpg' },
  verdant: { name:'VERDANT RUINS', description:'Control the central root sanctuary to regenerate',generator:'verdant', sky:0x172321, horizon:0x75917a, fog:0x344c40, ground:0x1b2921, sun:0xc6e2c0, accent:0x7ed36d, texture:'./textures/verdant-ground-lite.jpg' },
  grove: { name:'TITAN GRAVE', description:'Titan heartbeats throw combatants away from the center',generator:'titan', sky:0x261d16, horizon:0xb08d62, fog:0x59452f, ground:0x4a3a27, sun:0xffe0aa, accent:0x78e6b0, texture:'./textures/verdant-ground-lite.jpg' },
  frost: { name:'FROSTBOUND', description:'Crosswinds shove exposed combatants across open ice',generator:'frost', sky:0x233743, horizon:0xa8d1df, fog:0x7695a0, ground:0xb3cdd2, sun:0xe7fbff, accent:0x77dfff, texture:'./textures/frost-ground-lite.jpg' },
  glacier: { name:'MOONFALL BASIN', description:'Low-gravity surges launch everyone above cover',generator:'moonfall', sky:0x02050d, horizon:0x17233b, fog:0x111827, ground:0x5d6570, sun:0xdce8ff, accent:0x66d9ff, texture:'./textures/frost-ground-lite.jpg' },
  hollow: { name:'THE HOLLOW BETWEEN', sky:0x06020b, horizon:0x2a0838, fog:0x12051d, ground:0x0b0810, sun:0xd776ff, accent:0x49e7ff, texture:'./textures/obsidian-ground-lite.jpg' },
  warden: { name:'GRAND WARDEN ARENA', description:'Void gravity periodically hurls fighters out from the core',generator:'warden', sky:0x06020b, horizon:0x2a0838, fog:0x12051d, ground:0x0b0810, sun:0xd776ff, accent:0xc65cff, texture:'./textures/obsidian-ground-lite.jpg' },
  nexus: { name:'THE BURIED ARCHIVE', description:'Moving sand veils lanes and breaks long sightlines',generator:'archive', sky:0x21170e, horizon:0xc58a48, fog:0x6d4b2c, ground:0x8b6740, sun:0xffdda0, accent:0x4ee4d0, texture:'./textures/verdant-ground-lite.jpg' },
  earth: { name:'EARTH // DEPLOYMENT COMMAND', sky:0x080d14, horizon:0x263344, fog:0x111923, ground:0x41474c, sun:0xb8d5ee, accent:0x49b8ff, texture:'./textures/frost-ground-lite.jpg' },
};

export const BATTLE_ARENAS=['frost','glacier','verdant','grove','rift','caldera','warden','nexus'];

export const BOT_DIFFICULTY={
  easy:{sense:210,fov:1.08,vision:32,shieldChance:.42,decision:1550,jitter:900,move:.88,cooldown:1.22,aimError:.12,lead:0},
  normal:{sense:145,fov:1.3,vision:38,shieldChance:.64,decision:1200,jitter:650,move:1,cooldown:1,aimError:.065,lead:.12},
  hard:{sense:90,fov:1.48,vision:44,shieldChance:.8,decision:860,jitter:420,move:1.13,cooldown:.82,aimError:.032,lead:.24},
  nightmare:{sense:55,fov:1.65,vision:52,shieldChance:.92,decision:620,jitter:240,move:1.26,cooldown:.68,aimError:.012,lead:.38},
  boss:{sense:35,fov:1.9,vision:62,shieldChance:.98,decision:430,jitter:130,move:1.38,cooldown:.52,aimError:.006,lead:.52},
};

export const CAMPAIGN=[
  {id:'frost',map:'frost',name:'FROSTBOUND',objective:'DEFEAT 3 EASY ENEMIES',bots:3,difficulty:'easy',clear:true},
  {id:'verdant',map:'verdant',name:'VERDANT RUINS',objective:'DEFEAT 8 NORMAL ENEMIES',bots:8,difficulty:'normal',clear:true,hazards:{drones:0,lightningMin:12000,lightningJitter:3000,lightningBatch:1,cellCap:1,cellLife:4.5,trapDuration:1400,damage:6,introDelay:8000}},
  {id:'rift',map:'rift',name:'OBSIDIAN RIFT',objective:'DEFEAT 15 HARD ENEMIES',bots:15,difficulty:'hard',clear:true,hazards:{drones:1,droneEvery:3000,missileSpeed:18,missileDamage:7,lightningMin:9000,lightningJitter:2500,lightningBatch:1,cellCap:2,cellLife:5,trapDuration:1600,damage:7,introDelay:6500}},
  {id:'forest',map:'verdant',name:'THE TOWER APPROACH',objective:'BREACH FIVE ENTRANCES · SABOTAGE OPTIONAL DEFENSES',bots:5,difficulty:'hard',operation:'approach',botMix:['easy','normal','hard'],towerGate:true,towerLevel:0,hazards:{drones:1,droneEvery:2700,missileSpeed:18,missileDamage:7,lightningMin:8500,lightningJitter:2200,lightningBatch:1,cellCap:2,cellLife:5,trapDuration:1650,damage:7,introDelay:6000}},
  {id:'tower1',map:'verdant',name:'TOWER FLOOR I · TIDAL RELIQUARY',objective:'BREACH FOUR DEFENDED PORTAL CIRCUITS',bots:6,difficulty:'normal',operation:'portals',botMix:['easy','normal','hard'],towerGate:true,towerLevel:1,arenaTheme:'tide',crystals:0,hazards:{drones:2,droneEvery:2300,missileSpeed:19,missileDamage:8,lightningMin:7000,lightningJitter:1800,lightningBatch:1,cellCap:3,cellLife:5.5,trapDuration:1850,damage:8,introDelay:4500}},
  {id:'tower2',map:'verdant',name:'TOWER FLOOR II · INVERSION FORGE',objective:'SURVIVE THREE UNSTABLE FORGE CYCLES',bots:7,difficulty:'hard',operation:'crystals',botMix:['normal','hard'],towerGate:true,towerLevel:2,arenaTheme:'forge',crystals:0,hazards:{drones:3,droneEvery:1750,missileSpeed:20,missileDamage:9,lightningMin:5200,lightningJitter:1400,lightningBatch:1,cellCap:4,cellLife:6,trapDuration:2050,damage:9,introDelay:3500}},
  {id:'tower3',map:'verdant',name:'TOWER FLOOR III · CROWN ENGINE',objective:'SURVIVE THREE MINUTES OF ROTATING CROWN CHAMBERS',bots:8,difficulty:'nightmare',operation:'hazards',botMix:['hard','nightmare'],towerGate:true,towerLevel:3,arenaTheme:'crown',crystals:0,hazards:{drones:4,droneEvery:1250,missileSpeed:21,missileDamage:10,lightningMin:3900,lightningJitter:1000,lightningBatch:2,cellCap:6,cellLife:6.5,trapDuration:2250,damage:10,introDelay:2800}},
  {id:'boss',map:'hollow',name:'TOWER FLOOR IV · GRAND WARDEN ARENA',objective:'CLEAR THE ARENA TRIAL AND KILL THE WARDEN',bots:0,difficulty:'boss',boss:true,towerLevel:4,arenaTheme:'warden',crystals:3,hazards:{drones:8,droneEvery:1350,missileSpeed:22,missileDamage:11,lightningMin:4200,lightningJitter:900,lightningBatch:2,cellCap:6,cellLife:7,trapDuration:2350,damage:11,introDelay:3200}},
];

export const FINAL_WAVES=[{count:5,difficulty:'normal'},{count:7,difficulty:'hard'},{count:9,difficulty:'nightmare'}];

export const PLAYER_EYE_HEIGHT=1.72;
export const PLAYER_CHEST_DROP=.25;
export const PLAYER_HAND_DROP=.22;
export const BASE_SHIELD_ENERGY=100;
export const ENHANCED_SHIELD_ENERGY=150;
export const MIN_TERRAIN_Y=-1000000;
