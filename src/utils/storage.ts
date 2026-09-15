import { STORAGE_KEY } from '../constants';
import type { DishEntry } from '../types';
import { sanitizeEntry } from './validation';
export function loadEntries():DishEntry[]{
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed)) return [];
    const out:DishEntry[]=[];
    for(const r of parsed){ const s=sanitizeEntry(r); if(s) out.push(s); }
    return out;
  }catch{ return []; }
}
export function saveEntries(entries:DishEntry[]):void{
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }catch{}
}
