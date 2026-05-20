type TransporteurType = 'A' | 'B' | 'C'
type ChargeType = 'camion' | 'remorque' | 'les_deux'

const VISIBLE_TYPES: Record<TransporteurType, ChargeType[]> = {
  A: ['camion', 'les_deux'],
  B: ['remorque', 'les_deux'],
  C: ['camion', 'remorque', 'les_deux'],
}

export function getVisibleChargeTypes(type: TransporteurType): ChargeType[] {
  return VISIBLE_TYPES[type]
}
