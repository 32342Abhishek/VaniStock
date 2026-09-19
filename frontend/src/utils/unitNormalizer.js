// VaaniStock — Unit Normalizer (frontend)
export const UNIT_MAP = {
  bag: 'bags', bori: 'bags', boree: 'bags', theli: 'bags',
  carton: 'cartons', ctn: 'cartons', cartoon: 'cartons',
  box: 'boxes', dabba: 'boxes',
  dozen: 'dozens', doz: 'dozens',
  litre: 'litres', liter: 'litres', l: 'litres', ltr: 'litres',
  millilitre: 'ml', milliliter: 'ml',
  kg: 'kg', kgs: 'kg', kilogram: 'kg', kilograms: 'kg',
  gram: 'g', grams: 'g', gm: 'g', gms: 'g',
  piece: 'pieces', pc: 'pieces', pcs: 'pieces', no: 'pieces', nos: 'pieces',
  packet: 'packets', pack: 'packets', pkt: 'packets',
  bottle: 'bottles', btl: 'bottles',
  bundle: 'bundles',
  quintal: 'quintals', qtl: 'quintals',
  tonne: 'tonnes', ton: 'tonnes',
  roll: 'rolls',
}

export const normalizeUnit = (unit) => {
  if (!unit) return 'pieces'
  return UNIT_MAP[unit.toLowerCase().trim()] || unit
}

export const ALL_UNITS = [
  'pieces', 'kg', 'g', 'bags', 'cartons', 'boxes', 'dozens',
  'litres', 'ml', 'packets', 'bottles', 'bundles', 'quintals',
  'tonnes', 'rolls',
]
