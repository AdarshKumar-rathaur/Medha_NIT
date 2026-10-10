export const LOCALITIES = [
  'Koramangala',
  'Indiranagar',
  'HSR Layout',
  'Electronic City',
  'Whitefield',
  'Jayanagar',
] as const

export type LocalityName = (typeof LOCALITIES)[number]
