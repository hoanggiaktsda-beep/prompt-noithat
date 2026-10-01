export const REFERENCE_LAYERS=["architecture","furniture","material","lighting","color","style"];
export const PRESERVATION=["walls","openings","ceiling_height","floor_geometry","camera","perspective"];
export function buildTransfer(selected){return {selected,locked:PRESERVATION,rule:"Transfer selected visual attributes without changing target geometry."};}
