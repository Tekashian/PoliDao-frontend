import routerAbi from './routerAbi';

// Compatibility shim: legacy POLIDAO_ABI now points to the Router ABI only.
export const POLIDAO_ABI = routerAbi;
export default POLIDAO_ABI;