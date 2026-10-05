export const ENEMY_ROLES = {
  vanguard: { label: 'VANGUARD', glyph: '◆', preferredRange: 6.5, spells: ['quake', 'fireball'], description: 'Closes distance and breaks formations.' },
  artillery: { label: 'ARTILLERY', glyph: '▲', preferredRange: 22, spells: ['missiles', 'fireball'], description: 'Keeps range and saturates exposed ground.' },
  jailer: { label: 'JAILER', glyph: '⊞', preferredRange: 14, spells: ['lightning', 'fireball'], description: 'Pins targets for the squad.' },
  veil: { label: 'VEIL', glyph: '●', preferredRange: 12, spells: ['fog', 'fireball'], description: 'Cuts sightlines and covers retreats.' },
  guardian: { label: 'GUARDIAN', glyph: '⬟', preferredRange: 9, spells: ['fireball', 'quake'], description: 'Screens fragile ranged units.' },
};

const ROTATION = ['vanguard', 'artillery', 'jailer', 'veil', 'guardian'];

export function roleForIndex(index, wave = 0){
  const unlocked = wave < 3 ? 2 : wave < 5 ? 3 : wave < 7 ? 4 : ROTATION.length;
  return ROTATION[index % unlocked];
}

export function roleData(role){ return ENEMY_ROLES[role] || ENEMY_ROLES.vanguard; }
