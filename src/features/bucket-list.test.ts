import { describe, it, expect, beforeEach } from 'vitest';
import { validateEntry, sanitizeEntry } from '../utils/validation';
import { filterEntries } from '../utils/filters';
import { sortEntries } from '../utils/sorting';
import { loadEntries, saveEntries } from '../utils/storage';
import { STORAGE_KEY } from '../constants';
import type { DishEntry } from '../types';

describe('validation',()=>{
  it('requires fields',()=>{
    const r=validateEntry({dishName:'', restaurantName:'  ', neighborhood:'', cuisineTag:''});
    expect(r.valid).toBe(false);
    expect(r.errors.dishName).toBeTruthy();
    expect(r.errors.restaurantName).toBeTruthy();
  });
  it('whitespace is empty',()=>{
    const r=validateEntry({dishName:'   ', restaurantName:'a', neighborhood:'b', cuisineTag:'Japanese'});
    expect(r.valid).toBe(false);
  });
  it('Other requires custom',()=>{
    const r=validateEntry({dishName:'a', restaurantName:'b', neighborhood:'c', cuisineTag:'Other', customCuisine:''});
    expect(r.valid).toBe(false);
    expect(r.errors.customCuisine).toBeTruthy();
  });
  it('valid entry',()=>{
    const r=validateEntry({dishName:'Ramen', restaurantName:'Ichiran', neighborhood:'Shibuya', cuisineTag:'Japanese'});
    expect(r.valid).toBe(true);
  });
});

describe('sanitizeEntry',()=>{
  it('rejects invalid',()=> expect(sanitizeEntry({id:1})).toBeNull());
  it('trims and keeps',()=>{
    const e=sanitizeEntry({id:'1',dishName:'  ramen ',restaurantName:' x ',neighborhood:'y',cuisineTag:'Japanese',dateAdded:new Date().toISOString(),tried:false});
    expect(e?.dishName).toBe('ramen');
  });
});

describe('filters',()=>{
  const a:DishEntry={id:'1',dishName:'Ramen',restaurantName:'Ichiran',neighborhood:'Shibuya',cuisineTag:'Japanese',dateAdded:new Date().toISOString(),tried:false,note:''};
  const b:DishEntry={id:'2',dishName:'Pizza',restaurantName:'Lu',neighborhood:'NYC',cuisineTag:'Italian',dateAdded:new Date().toISOString(),tried:true,note:''};
  it('cuisine filter',()=> expect(filterEntries([a,b],'Japanese','All')).toEqual([a]));
  it('status filter',()=> expect(filterEntries([a,b],null,'Tried')).toEqual([b]));
  it('AND logic',()=> expect(filterEntries([a,b],'Japanese','Tried')).toEqual([]));
});

describe('sorting',()=>{
  const old:DishEntry={id:'1',dishName:'a',restaurantName:'r',neighborhood:'n',cuisineTag:'Japanese',dateAdded:'2020-01-01T00:00:00.000Z',tried:false};
  const nw:DishEntry={id:'2',dishName:'b',restaurantName:'r',neighborhood:'n',cuisineTag:'Japanese',dateAdded:'2025-01-01T00:00:00.000Z',tried:false};
  it('Newest first',()=> expect(sortEntries([old,nw],'Newest')[0].id).toBe('2'));
  it('does not mutate',()=>{ const arr=[old,nw]; sortEntries(arr,'Newest'); expect(arr[0].id).toBe('1'); });
});

describe('storage',()=>{
  beforeEach(()=> localStorage.clear());
  it('roundtrip',()=>{
    const e:DishEntry={id:'x',dishName:'Ramen',restaurantName:'Ichiran',neighborhood:'Shibuya',cuisineTag:'Japanese',dateAdded:new Date().toISOString(),tried:false};
    saveEntries([e]);
    expect(loadEntries()).toEqual([expect.objectContaining({id:'x'})]);
  });
  it('malformed fallback',()=>{
    localStorage.setItem(STORAGE_KEY,'not json');
    expect(loadEntries()).toEqual([]);
  });
  it('skips invalid entries',()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{id:'ok',dishName:'a',restaurantName:'b',tried:false,dateAdded:new Date().toISOString()}, {bad:true}]));
    expect(loadEntries().length).toBe(1);
  });
});
