import type { DishEntry, CuisineTag, StatusFilter } from '../types';
export function filterEntries(entries:DishEntry[], activeCuisine:CuisineTag|null, status:StatusFilter):DishEntry[]{
  return entries.filter(e=>{
    const cuisineOk=!activeCuisine || e.cuisineTag===activeCuisine;
    const statusOk=status==='All' || (status==='Tried'? e.tried : !e.tried);
    return cuisineOk && statusOk;
  });
}
