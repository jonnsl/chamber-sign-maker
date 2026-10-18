import type { IconId } from './atlas'

/**
 * Short, user-facing description of each icon, shown in the icon picker.
 *
 * PLACEHOLDER TEXT: real descriptions will be written later. Keep one
 * sentence per icon. The Record type makes TypeScript flag any icon id
 * missing here.
 */
export const iconDescriptions: Readonly<Record<IconId, string>> = {
  'cube-dispenser': 'Placeholder: a cube is dispensed in this chamber.',
  'cube-hazard': 'Placeholder: falling or moving cubes may cause harm.',
  'pellet-hazard': 'Placeholder: high-energy pellets are present.',
  'pellet-catcher': 'Placeholder: a receptacle that catches energy pellets.',
  'water-hazard': 'Placeholder: contact with the liquid is hazardous.',
  'fling-enter': 'Placeholder: enter a portal at speed to build momentum.',
  'fling-exit': 'Placeholder: momentum carries you out of the exit portal.',
  'turret-hazard': 'Placeholder: sentry turrets are active.',
  'dirty-water': 'Placeholder: water here is not suitable for drinking.',
  cake: 'Placeholder: cake is promised upon completion.',
}

/** Description for the "Empty" picker option. */
export const emptyDescription = 'Leave this slot blank.'
