import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from './app';
describe('add dish UI', ()=>{
  beforeEach(()=>{ localStorage.clear(); document.body.innerHTML='<div id="app"></div>'; });
  it('adds dish via form submit', async ()=>{
    const root=document.getElementById('app')!;
    createApp(root);
    const addBtn=root.querySelector('[data-testid="add-dish-btn"]') as HTMLButtonElement;
    expect(addBtn).toBeTruthy();
    addBtn.click();
    // dialog should be open
    let dlg=root.querySelector('dialog') as HTMLDialogElement;
    expect(dlg).toBeTruthy();
    // jsdom dialog open attr or open prop
    // fill form
    (dlg.querySelector('#f-dish') as HTMLInputElement).value='Ramen';
    (dlg.querySelector('#f-rest') as HTMLInputElement).value='Ichiran';
    (dlg.querySelector('#f-neighborhood') as HTMLInputElement).value='Shinjuku';
    const sel=dlg.querySelector('#f-cuisine') as HTMLSelectElement;
    sel.value='Japanese';
    sel.dispatchEvent(new Event('change', {bubbles:true}));
    (dlg.querySelector('#f-note') as HTMLTextAreaElement).value='friend tip';
    const form=dlg.querySelector('form') as HTMLFormElement;
    // debug validate
    const inputs={dishName:'Ramen', restaurantName:'Ichiran', neighborhood:'Shinjuku', cuisineTag:'Japanese', customCuisine:''};
    console.log('form submit start');
    try{
      form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
    } catch(e){ console.error('submit threw', e); throw e; }
    await new Promise(r=>setTimeout(r,20));
    const cards=root.querySelectorAll('[data-testid="dish-card"]');
    console.log('cards after submit', cards.length, document.body.innerHTML.slice(0,500));
    if(cards.length===0) console.log('errors:', dlg.querySelectorAll('.error'));
    expect(cards.length).toBe(1);
    expect(localStorage.getItem('wandering-palate-entries')).toContain('Ramen');
  });
});
