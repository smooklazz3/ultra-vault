// Integration checks for the static app's draw state and opening lifecycle.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),test=require('node:test');
const root=path.resolve(__dirname,'..');
async function fixture(){
 const listeners=new Map(),elements=new Map(),tasks=[],notes=[],store=new Map([['ultra-vault-v1',JSON.stringify({0:2,12:1,120:1})]]);
 let contexts=0,reduced=false;
 function el(key){if(!elements.has(key))elements.set(key,{style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this[k]=v},appendChild(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false},innerHTML:'',textContent:'',value:''});return elements.get(key)}
 class AudioMock{constructor(){contexts++;this.currentTime=0;this.destination={}}resume(){return Promise.resolve()}createOscillator(){const n={};return{frequency:{setValueAtTime(v,t){n.frequency=v;n.time=t}},connect(){},start(t){n.start=t;notes.push(n)},stop(t){n.stop=t}}}createGain(){return{connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}}}
 const context={console,crypto:require('node:crypto').webcrypto,window:{scrollTo(){},AudioContext:AudioMock},document:{addEventListener:(type,fn)=>listeners.set(type,fn),querySelector:el,querySelectorAll(){return[]},createElement(){return el(Symbol())},body:{dataset:{}}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:(fn,ms)=>{const timer={fn,ms,cancelled:false};tasks.push(timer);return timer},clearTimeout:t=>{if(t)t.cancelled=true},matchMedia:()=>({matches:reduced}),fetch:async p=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))})};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'experience.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8')+'\nglobalThis.hooks={draw,pickCard,setUniverse,setDrawFormat,previewRarity,closeModal,resultSound,cardFace,effects:CardExperience.effects,get cards(){return cards},get collection(){return collection},get drawing(){return drawing},get sound(){return sound}};',context);
 await new Promise(setImmediate);
 return {h:context.hooks,el,tasks,notes,store,listeners,setReduced:v=>{reduced=v},contexts:()=>contexts};
}
test('new landscape editions preserve every existing card and balanced tier pools',async()=>{
 const {h}=await fixture();assert.equal(h.cards.length,156);
 const horizontal=h.cards.filter(c=>c.layout==='landscape');assert.equal(horizontal.length,12);
 assert.equal(new Set(h.cards.map(c=>c.id)).size,156);
 for(const tier of ['R','SR','UR'])assert.equal(horizontal.filter(c=>c.rarity===tier).length,4);
 for(const c of horizontal){assert(c.id>=144);assert(fs.existsSync(path.join(root,c.image)));assert(h.cardFace(c).includes('landscape-face'));}
 for(let i=0;i<1000;i++)assert(h.pickCard().id>=120);
 h.setDrawFormat('landscape');for(let i=0;i<1000;i++)assert(h.pickCard().id>=144);
 h.setUniverse('ultra');for(let i=0;i<1000;i++)assert(h.pickCard().id<120);
});
test('ten draws, skip and stale timers award exactly once and retain old collections',async()=>{
 const {h,el,tasks}=await fixture();h.setDrawFormat('landscape');await h.draw(10);
 assert.equal(h.collection[0],2);assert.equal(h.collection[12],1);assert.equal(h.collection[120],1);
 const count=()=>Object.entries(h.collection).filter(([id])=>+id>=144).reduce((n,[,v])=>n+v,0);
 assert.equal(count(),10);assert.equal(h.drawing,true);
 const timer=tasks.find(t=>t.ms===1950);el('#skip-reveal').onclick();
 assert.equal(h.drawing,false);assert.equal((el('#modal-content').innerHTML.match(/data-rarity="/g)||[]).length,10);
 assert(el('#modal-content').innerHTML.includes('motion-still'));
 timer.fn();assert.equal(count(),10);
 await h.draw(1);const last=tasks.filter(t=>t.ms===1950).at(-1);h.closeModal();
 assert.equal(h.drawing,false);assert.equal(el('#modal').open,false);last.fn();assert.equal(el('#modal').open,false);assert.equal(count(),11);
});
test('rarity previews have distinct effects and never change collected cards',async()=>{
 const {h,el,tasks}=await fixture();const before=JSON.stringify(h.collection);
 for(const [tier,particles]of [['R',10],['SR',22],['UR',36]]){
  assert.equal((h.effects(tier).match(/class="reveal-spark"/g)||[]).length,particles);
  h.previewRarity(tier);tasks.filter(t=>t.ms===1950).at(-1).fn();
  assert(el('#modal-content').innerHTML.includes('result-stage rarity-'+tier));
  assert(el('#modal-content').innerHTML.includes('特效预览 · 不计入收藏'));
 }
 assert.equal(JSON.stringify(h.collection),before);
});
test('reduced motion skips the opening; default sound unlocks on gesture and mute persists',async()=>{
 const {h,el,tasks,notes,store,contexts,setReduced}=await fixture();assert.equal(h.sound,true);assert.equal(contexts(),0);
 setReduced(true);h.previewRarity('UR');assert.equal(contexts(),1);tasks.filter(t=>t.ms===0).at(-1).fn();
 assert(el('#modal-content').innerHTML.includes('motion-still'));assert(!el('#modal-content').innerHTML.includes('class="reveal-effects'));
 el('#sound').onclick();assert.equal(h.sound,false);assert.equal(store.get('ultra-vault-sound'),'off');
 const n=notes.length;h.resultSound('UR');assert.equal(notes.length,n);assert.equal(el('#sound-mobile')['aria-label'],'开启音效');
 assert.equal(h.effects('UR',false),'');
});

test('ordinary button clicks do not treat the themed body as a category switch',async()=>{
 const {h,el,listeners}=await fixture();
 const target={closest(selector){if(selector==='[data-draw-format]')return{dataset:{drawFormat:'landscape'}};if(selector==='[data-universe]')return{dataset:{universe:'football'}};return null}};
 listeners.get('click')({target});
 assert(el('#selected-label').innerHTML.includes('仅横版典藏'));
 for(let i=0;i<100;i++)assert(h.pickCard().id>=144);
});
