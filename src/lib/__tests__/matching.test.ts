import { getVisibleChargeTypes } from '../matching'

describe('getVisibleChargeTypes', () => {
  it('Type A (camion seul) voit camion et les_deux', () => {
    const result = getVisibleChargeTypes('A')
    expect(result).toContain('camion')
    expect(result).toContain('les_deux')
    expect(result).not.toContain('remorque')
  })

  it('Type B (remorque seule) voit remorque et les_deux', () => {
    const result = getVisibleChargeTypes('B')
    expect(result).toContain('remorque')
    expect(result).toContain('les_deux')
    expect(result).not.toContain('camion')
  })

  it('Type C (complet) voit tout', () => {
    const result = getVisibleChargeTypes('C')
    expect(result).toContain('camion')
    expect(result).toContain('remorque')
    expect(result).toContain('les_deux')
  })

  it('retourne un tableau de strings', () => {
    const result = getVisibleChargeTypes('A')
    expect(Array.isArray(result)).toBe(true)
    result.forEach(t => expect(typeof t).toBe('string'))
  })
})
