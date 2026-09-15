export type CuisineTag = 'Japanese'|'Italian'|'Mexican'|'Thai'|'Chinese'|'Indian'|'French'|'Korean'|'Vietnamese'|'American'|'Mediterranean'|'Spanish'|'Greek'|'Ethiopian'|'Peruvian'|'Middle Eastern'|string;
export interface DishEntry{id:string;dishName:string;restaurantName:string;neighborhood:string;note?:string;cuisineTag:CuisineTag;dateAdded:string;tried:boolean;}
export type StatusFilter='All'|'Untried'|'Tried';
export type SortOrder='Newest'|'Oldest';
export interface AppState{entries:DishEntry[];activeCuisineTag:CuisineTag|null;statusFilter:StatusFilter;sortOrder:SortOrder;isFormOpen:boolean;editingEntry:DishEntry|null;}
