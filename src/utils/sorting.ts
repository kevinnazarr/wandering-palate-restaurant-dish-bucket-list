import type { DishEntry, SortOrder } from '../types';
export function sortEntries(entries:DishEntry[], order:SortOrder):DishEntry[]{
  const copy=[...entries];
  copy.sort((a,b)=>{
    const da=new Date(a.dateAdded).getTime(), db=new Date(b.dateAdded).getTime();
    return order==='Newest'? db-da : da-db;
  });
  return copy;
}
