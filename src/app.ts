import type { DishEntry, CuisineTag, StatusFilter, SortOrder, AppState } from './types';
import { CUISINES } from './constants';
import { loadEntries, saveEntries } from './utils/storage';
import { filterEntries } from './utils/filters';
import { sortEntries } from './utils/sorting';
import { validateEntry } from './utils/validation';

const CUISINE_ALL = [...CUISINES, 'Other'] as const;

export function createApp(root: HTMLElement) {
  let state: AppState = {
    entries: loadEntries(),
    activeCuisineTag: null,
    statusFilter: 'All',
    sortOrder: 'Newest',
    isFormOpen: false,
    editingEntry: null,
  };

  let lastFocus: HTMLElement | null = null;

  const el = {
    header: null as HTMLElement|null,
    count: null as HTMLElement|null,
    filterBar: null as HTMLElement|null,
    grid: null as HTMLElement|null,
    empty: null as HTMLElement|null,
    dialog: null as HTMLDialogElement|null,
    form: null as HTMLFormElement|null,
  };

  function persist() { saveEntries(state.entries); }

  function derived(): DishEntry[] {
    const f = filterEntries(state.entries, state.activeCuisineTag, state.statusFilter);
    return sortEntries(f, state.sortOrder);
  }

  function render() {
    root.replaceChildren();
    // header
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="header-inner">
        <div class="brand">
          <h1>Wandering Palate</h1>
          <p>Dishes worth chasing</p>
        </div>
        <div class="spacer"></div>
        <div class="count" data-testid="count" aria-live="polite">${state.entries.length} dishes · ${state.entries.filter(e=>e.tried).length} tried</div>
        <button class="btn btn-primary header-cta" data-testid="add-dish-btn" aria-label="Add dish">+ Add Dish</button>
      </div>`;
    root.appendChild(header);
    el.count = header.querySelector('[data-testid="count"]')!;

    // filter bar
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    const cuisineChips = (['All', ...CUISINE_ALL] as string[]).map(c => {
      const active = (c==='All' && !state.activeCuisineTag) || state.activeCuisineTag===c;
      return `<button class="chip" data-cuisine="${c}" aria-pressed="${active}" data-testid="filter-${c}">${c}</button>`;
    }).join('');
    bar.innerHTML = `
      <div class="filter-inner">
        <div class="filter-scroll" role="group" aria-label="Cuisine filter">${cuisineChips}</div>
        <div class="filter-scroll" role="group" aria-label="Status filter">
          ${(['All','Untried','Tried'] as StatusFilter[]).map(s=>`<button class="chip" data-status="${s}" aria-pressed="${state.statusFilter===s}" data-testid="status-${s}">${s}</button>`).join('')}
        </div>
        <div class="sort-wrap">
          <label for="sort">Sort</label>
          <select id="sort" data-testid="sort-select">
            <option value="Newest" ${state.sortOrder==='Newest'?'selected':''}>Newest first</option>
            <option value="Oldest" ${state.sortOrder==='Oldest'?'selected':''}>Oldest first</option>
          </select>
        </div>
      </div>`;
    root.appendChild(bar);

    // main
    const main = document.createElement('main');
    main.className = 'main';
    const list = derived();
    if (state.entries.length===0) {
      main.innerHTML = `
        <div class="empty" data-testid="empty-state">
          <div class="doodle">🍽️</div>
          <h2>Nothing on your list yet</h2>
          <p>Save the dishes you’re chasing — the ramen, the taco, the perfect slice.</p>
          <button class="btn btn-primary" data-testid="empty-cta">Add your first dish</button>
        </div>`;
    } else if (list.length===0) {
      main.innerHTML = `
        <div class="empty" data-testid="filtered-empty">
          <h2>No dishes match these filters</h2>
          <p>Try adjusting your filters or add something new.</p>
          <button class="btn btn-ghost" data-testid="clear-filters">Clear filters</button>
        </div>`;
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.setAttribute('data-testid','dish-grid');
      for (const e of list) grid.appendChild(renderCard(e));
      main.appendChild(grid);
      el.grid = grid;
    }
    root.appendChild(main);

    // mobile CTA
    const mcta = document.createElement('div');
    mcta.className = 'mobile-cta';
    mcta.innerHTML = `<button class="btn btn-primary" style="width:100%" data-testid="add-dish-btn-mobile">+ Add Dish</button>`;
    root.appendChild(mcta);

    // dialog
    const dlg = document.createElement('dialog');
    dlg.setAttribute('aria-labelledby','dlg-title');
    dlg.innerHTML = `
      <div class="modal-head"><h2 id="dlg-title">${state.editingEntry?'Edit dish':'Add a dish'}</h2><button type="button" class="btn btn-ghost btn-sm" data-testid="close-dialog" aria-label="Close">✕</button></div>
      <form class="modal-body" data-testid="dish-form" novalidate>
        <div class="field" data-field="dishName">
          <label for="f-dish">Dish name *</label>
          <input id="f-dish" name="dishName" placeholder="e.g. Tonkotsu ramen" required aria-describedby="err-dishName" />
          <div class="error" id="err-dishName" data-testid="err-dishName"></div>
        </div>
        <div class="field" data-field="restaurantName">
          <label for="f-rest">Restaurant *</label>
          <input id="f-rest" name="restaurantName" placeholder="e.g. Ichiran" required aria-describedby="err-restaurantName" />
          <div class="error" id="err-restaurantName" data-testid="err-restaurantName"></div>
        </div>
        <div class="field" data-field="neighborhood">
          <label for="f-neighborhood">Neighborhood *</label>
          <input id="f-neighborhood" name="neighborhood" placeholder="e.g. Shinjuku, NYC" required aria-describedby="err-neighborhood" />
          <div class="error" id="err-neighborhood" data-testid="err-neighborhood"></div>
        </div>
        <div class="field" data-field="cuisineTag">
          <label for="f-cuisine">Cuisine *</label>
          <select id="f-cuisine" name="cuisineTag" required aria-describedby="err-cuisineTag" data-testid="cuisine-select">
            <option value="">Select cuisine</option>
            ${CUISINE_ALL.map(c=>`<option value="${c}">${c}</option>`).join('')}
          </select>
          <div class="error" id="err-cuisineTag" data-testid="err-cuisineTag"></div>
        </div>
        <div class="field" data-field="customCuisine" id="custom-wrap" style="display:none">
          <label for="f-custom">Custom cuisine *</label>
          <input id="f-custom" name="customCuisine" placeholder="e.g. Scandinavian" aria-describedby="err-customCuisine" />
          <div class="error" id="err-customCuisine" data-testid="err-customCuisine"></div>
        </div>
        <div class="field" data-field="note">
          <label for="f-note">Note</label>
          <textarea id="f-note" name="note" placeholder="Why do you want this? Friend tip, craving..." rows="3"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-testid="cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary" data-testid="submit-btn">${state.editingEntry?'Save changes':'Add dish'}</button>
        </div>
      </form>`;
    root.appendChild(dlg);
    el.dialog = dlg;
    el.form = dlg.querySelector('form')!;

    // prefill if editing
    if (state.editingEntry) {
      const e = state.editingEntry;
      (dlg.querySelector('#f-dish') as HTMLInputElement).value = e.dishName;
      (dlg.querySelector('#f-rest') as HTMLInputElement).value = e.restaurantName;
      (dlg.querySelector('#f-neighborhood') as HTMLInputElement).value = e.neighborhood;
      const sel = dlg.querySelector('#f-cuisine') as HTMLSelectElement;
      const wrap = dlg.querySelector('#custom-wrap') as HTMLElement;
      const customInput = dlg.querySelector('#f-custom') as HTMLInputElement;
      if ((CUISINES as readonly string[]).includes(e.cuisineTag)) sel.value = e.cuisineTag;
      else { sel.value='Other'; wrap.style.display='grid'; customInput.value=e.cuisineTag; }
      (dlg.querySelector('#f-note') as HTMLTextAreaElement).value = e.note ?? '';
    }

    bindEvents();
    if (state.isFormOpen) openDialog();
  }

  function renderCard(e: DishEntry): HTMLElement {
    const card = document.createElement('article');
    card.className = 'card' + (e.tried ? ' tried' : '');
    card.setAttribute('data-testid', 'dish-card');
    card.setAttribute('data-id', e.id);
    const stamp = e.tried ? `<div class="stamp" aria-hidden="true">TRIED ✓</div>` : '';
    const note = e.note ? `<div class="note">${escapeHtml(e.note)}</div>` : '';
    const date = new Date(e.dateAdded).toLocaleDateString('en-US',{month:'short', year:'numeric'});
    card.innerHTML = `
      ${stamp}
      <h3 class="dish-name">${escapeHtml(e.dishName)}</h3>
      <div class="restaurant-line card-secondary">${escapeHtml(e.restaurantName)} <span>·</span> ${escapeHtml(e.neighborhood)}</div>
      <div class="badge">${escapeHtml(e.cuisineTag.toUpperCase())}</div>
      ${note}
      <div class="meta card-secondary"><span>Added ${date}</span></div>
      <div class="actions">
        <button class="btn ${e.tried?'btn-primary':'btn-ghost'} btn-sm" data-testid="tried-toggle" aria-pressed="${e.tried}" aria-label="${e.tried?'Mark as untried':'Mark as tried'}">${e.tried?'Tried ✓':'Tried it?'}</button>
        <div class="actions-right">
          <button class="btn btn-ghost btn-sm" data-testid="edit-btn" aria-label="Edit ${escapeHtml(e.dishName)}">Edit</button>
          <button class="btn btn-danger btn-sm" data-testid="delete-btn" aria-label="Delete ${escapeHtml(e.dishName)}">Delete</button>
        </div>
      </div>`;
    // bind card actions
    card.querySelector('[data-testid="tried-toggle"]')!.addEventListener('click',()=>{ e.tried=!e.tried; const idx=state.entries.findIndex(x=>x.id===e.id); if(idx>=0) state.entries[idx]= {...e}; persist(); render(); });
    card.querySelector('[data-testid="edit-btn"]')!.addEventListener('click',()=>{ state.editingEntry={...e}; state.isFormOpen=true; render(); });
    card.querySelector('[data-testid="delete-btn"]')!.addEventListener('click',()=>{
      if(!confirm(`Delete "${e.dishName}"? This cannot be undone.`)) return;
      state.entries = state.entries.filter(x=>x.id!==e.id); persist(); render();
    });
    return card;
  }

  function escapeHtml(s:string){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  function openDialog(){
    if(!el.dialog) return;
    lastFocus = document.activeElement as HTMLElement;
    if(typeof el.dialog.showModal==='function') el.dialog.showModal(); else el.dialog.setAttribute('open','');
    // focus first input
    setTimeout(()=> (el.dialog!.querySelector('#f-dish') as HTMLElement)?.focus(), 0);
    // esc
    el.dialog.oncancel = (e)=>{ e.preventDefault(); closeDialog(); };
  }
  function closeDialog(){
    state.isFormOpen=false; state.editingEntry=null;
    if(el.dialog?.open && typeof el.dialog.close==='function') el.dialog.close();
    el.dialog?.removeAttribute('open');
    render();
    lastFocus?.focus();
  }

  function bindEvents(){
    // add dish
    for(const sel of (['[data-testid="add-dish-btn"]','[data-testid="add-dish-btn-mobile"]','[data-testid="empty-cta"]'] as const)){
      const b=root.querySelector(sel);
      if(b) b.addEventListener('click',()=>{ state.editingEntry=null; state.isFormOpen=true; render(); });
    }
    root.querySelector('[data-testid="clear-filters"]')?.addEventListener('click',()=>{ state.activeCuisineTag=null; state.statusFilter='All'; render(); });
    // cuisine
    for(const chip of Array.from(root.querySelectorAll('[data-cuisine]'))){
      chip.addEventListener('click',()=>{
        const v=(chip as HTMLElement).dataset.cuisine!;
        state.activeCuisineTag = v==='All' ? null : v as CuisineTag;
        render();
      });
    }
    for(const chip of Array.from(root.querySelectorAll('[data-status]'))){
      chip.addEventListener('click',()=>{
        state.statusFilter=(chip as HTMLElement).dataset.status as StatusFilter;
        render();
      });
    }
    const sortSel=root.querySelector('#sort') as HTMLSelectElement|null;
    if(sortSel) sortSel.addEventListener('change',()=>{ state.sortOrder=sortSel.value as SortOrder; render(); });
    // dialog controls
    if(el.dialog && el.form){
      const dlg=el.dialog, form=el.form;
      const cuisineSel=form.querySelector('#f-cuisine') as HTMLSelectElement;
      const wrap=form.querySelector('#custom-wrap') as HTMLElement;
      cuisineSel.addEventListener('change',()=>{ wrap.style.display = cuisineSel.value==='Other' ? 'grid' : 'none'; });
      // trigger display if Other initially
      if(cuisineSel.value==='Other') wrap.style.display='grid';
      dlg.querySelector('[data-testid="close-dialog"]')?.addEventListener('click',closeDialog);
      form.querySelector('[data-testid="cancel-btn"]')?.addEventListener('click',closeDialog);
      dlg.addEventListener('click',(e)=>{
        if(e.target===dlg) closeDialog();
      });
      form.addEventListener('submit',(e)=>{
        e.preventDefault();
        const fd=new FormData(form);
        const dishName=String(fd.get('dishName')??'');
        const restaurantName=String(fd.get('restaurantName')??'');
        const neighborhood=String(fd.get('neighborhood')??'');
        const cuisineTag=String(fd.get('cuisineTag')??'');
        const customCuisine=String(fd.get('customCuisine')??'');
        const noteRaw=String(fd.get('note')??'').trim();
        const result=validateEntry({dishName,restaurantName,neighborhood,cuisineTag,customCuisine});
        // clear errors
        for(const f of Array.from(form.querySelectorAll('.field'))){ f.classList.remove('invalid'); const er=f.querySelector('.error') as HTMLElement|null; if(er) er.textContent=''; }
        if(!result.valid){
          for(const [k,msg] of Object.entries(result.errors) as [string,string][]){
            const key=k==='customCuisine'?'customCuisine':k;
            const field=form.querySelector(`[data-field="${key}"]`) as HTMLElement|null;
            if(field){ field.classList.add('invalid'); const err=field.querySelector('.error') as HTMLElement; if(err) err.textContent=msg; }
          }
          return;
        }
        const finalCuisine = cuisineTag==='Other' ? customCuisine.trim() : cuisineTag;
        if(state.editingEntry){
          const idx=state.entries.findIndex(x=>x.id===state.editingEntry!.id);
          if(idx>=0){
            state.entries[idx]={ ...state.entries[idx], dishName:dishName.trim(), restaurantName:restaurantName.trim(), neighborhood:neighborhood.trim(), cuisineTag:finalCuisine, note: noteRaw||undefined };
          }
        } else {
          const entry:DishEntry={ id: crypto.randomUUID(), dishName:dishName.trim(), restaurantName:restaurantName.trim(), neighborhood:neighborhood.trim(), cuisineTag:finalCuisine, note: noteRaw||undefined, dateAdded:new Date().toISOString(), tried:false };
          state.entries.unshift(entry);
        }
        persist();
        closeDialog();
      });
    }
  }

  // keyboard N shortcut
  document.addEventListener('keydown',(e)=>{
    if(e.key==='n' && !e.metaKey && !e.ctrlKey && !e.altKey){
      const tag=(document.activeElement as HTMLElement)?.tagName;
      if(tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;
      if(!state.isFormOpen){ state.editingEntry=null; state.isFormOpen=true; render(); }
    }
  });

  render();
  return { getState:()=>state, render };
}
