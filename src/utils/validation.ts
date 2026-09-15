import type { DishEntry } from '../types';
export interface ValidationResult{valid:boolean;errors:Record<string,string>}
export function validateEntry(input:{dishName:string;restaurantName:string;neighborhood:string;cuisineTag:string;customCuisine?:string}):ValidationResult{
  const e:Record<string,string>={};
  if(!input.dishName.trim()) e.dishName='Dish name is required';
  if(!input.restaurantName.trim()) e.restaurantName='Restaurant is required';
  if(!input.neighborhood.trim()) e.neighborhood='Neighborhood is required';
  if(!input.cuisineTag) e.cuisineTag='Cuisine is required';
  if(input.cuisineTag==='Other' && !input.customCuisine?.trim()) e.customCuisine='Custom cuisine is required';
  return {valid:Object.keys(e).length===0,errors:e};
}
export function isValidPersistedEntry(v:any):v is DishEntry{
  return v && typeof v.id==='string' && typeof v.dishName==='string' && typeof v.restaurantName==='string' && typeof v.tried==='boolean' && typeof v.dateAdded==='string' && !isNaN(Date.parse(v.dateAdded));
}
export function sanitizeEntry(raw:any):DishEntry|null{
  if(!isValidPersistedEntry(raw)) return null;
  return {
    id: String(raw.id),
    dishName: String(raw.dishName).trim(),
    restaurantName: String(raw.restaurantName).trim(),
    neighborhood: String(raw.neighborhood ?? '').trim(),
    note: raw.note? String(raw.note).trim() : undefined,
    cuisineTag: String(raw.cuisineTag ?? 'Other').trim() || 'Other',
    dateAdded: new Date(raw.dateAdded).toISOString(),
    tried: !!raw.tried,
  };
}
