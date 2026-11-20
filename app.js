'use strict';
const $=(s)=>document.querySelector(s);
const ultraPacks=[{name:'星云启程',en:'NEBULA ORIGIN',desc:'一切传奇，都从第一束光开始',badge:'经典英雄 · 轻松入藏',rates:[70,25,5]},{name:'时空回响',en:'ECHOES OF TIME',desc:'穿越时空，唤醒心中的英雄',badge:'SR 出现率 40%',rates:[50,40,10]},{name:'光之传说',en:'LEGEND OF LIGHT',desc:'让宇宙见证，属于你的闪耀时刻',badge:'UR 出现率 20%',rates:[30,50,20]}];
const names={'Ultraman Tiga':'迪迦奥特曼','Ultraman Arc':'亚刻奥特曼','Ultraman Mebius':'梦比优斯奥特曼','Ultraman Decker':'德凯奥特曼','Ultraman Blazar':'布莱泽奥特曼','Ultraman Gaia':'盖亚奥特曼','Ultraman Zero':'赛罗奥特曼','Tector Gear Zero':'赛罗 · 修行装甲','Ultraman Geed':'捷德奥特曼','Ultraman Z':'泽塔奥特曼'};
Object.assign(names,{"Ultraman Dyna": "戴拿奥特曼", "Ultraman Agul": "阿古茹奥特曼", "Ultraman Belial": "贝利亚奥特曼", "Ultraman Blu": "布鲁奥特曼", "Ultraman Rosso": "罗索奥特曼", "Ultraman Ginga": "银河奥特曼", "Ultraman Hikari": "希卡利奥特曼", "Ultraman Nexus": "奈克瑟斯奥特曼", "Ultraman Omega": "欧米伽奥特曼", "Ultraman Orb": "欧布奥特曼", "Ultraman Trigger": "特利迦奥特曼", "Ultraman X": "艾克斯奥特曼", "Ultraman Z ": "泽塔奥特曼", "Ultraman Zero Beyond": "赛罗 · 超越形态", "Ultimate Zero": "究极赛罗", "Dark Lugiel": "黑暗路基艾尔", "Dark Mephisto": "黑暗梅菲斯特", "Darklops Zero": "黑暗洛普斯赛罗", "Guil Arc": "吉尔亚刻", "Hunter Knight Tsurugi": "猎手骑士剑", "Jugglus Juggler": "伽古拉斯·伽古拉", "A Sword Master from Space": "来自宇宙的剑豪", "Arc to the Future": "奔向未来的亚刻", "Chant My Name!": "喊出我的名字！", "Farewell Icarus": "再见，伊卡洛斯", "For Smiles": "为了笑容", "From Today We Are Ultraman": "从今天起，我们是奥特曼", "Going Beyond Fate": "超越命运", "In the Name of Ultraman": "以奥特曼之名", "Juggler Dies!": "伽古拉之死！", "Labyrinth": "迷宫", "Legend of the Stone": "石之传说", "Light and Darkness, Again": "光与暗，再次相逢", "Live Coverage! The Monster Transport Operation": "怪兽运输作战直播", "Man and Monster": "人与怪兽", "Mega Monster Battle Ultra Galaxy: The Movie": "大怪兽之战 · 超银河传说", "My Name": "我的名字", "Pride of GUYS": "GUYS 的骄傲", "Rainbow Appears: Part 2": "彩虹出现了 · 后篇", "Resurrection of Agul": "阿古茹复活", "So That I Can Be Me": "为了成为我自己", "The Ancient Monster Gomora": "古代怪兽 · 哥莫拉", "The Ancient MonsterGomora": "古代怪兽 · 哥莫拉", "The Armored Shell Beast Shagong": "甲壳怪兽 · 沙贡", "The Artes Tiger Monster Izac (Izac Platiard)": "阿尔特虎怪兽 · 伊扎克", "The Battle for Dreams": "为梦想而战", "The Belial Fusion Monster Pedanium Zetton": "贝利亚融合兽 · 佩丹尼姆杰顿", "The Belial Fusion Monster Skull Gomora": "贝利亚融合兽 · 骷髅哥莫拉", "The Belial Fusion Monster Thunder Killer": "贝利亚融合兽 · 雷霆杀手", "The Champion of the Fierce Fight": "激战的王者", "The Dynamic Fusion Monster Spheresaurus": "斯菲亚合成兽 · 斯菲亚扎沃尔斯", "The Evil God Gatanothor": "邪神 · 加坦杰厄", "The Ferocious Space Shark Genegarg": "凶暴宇宙鲛 · 盖内伽古", "The Final Resolution": "最后的决意", "The First Day of the End of the World": "世界终结的第一天", "The Flame Bone Monster Grigio Bone": "火炎骨兽 · 格尔吉欧博恩", "The Galactic Beast Zadime": "银河兽 · 扎迪姆", "The Geed Identity": "捷德的身份", "The Infernal Warrior Kyrieloid": "炎魔战士 · 基里艾洛德人", "The Infernal Warrior Kyrieloid II": "炎魔战士 · 基里艾洛德人 II", "The Infinite Phantom Jugglus Juggler": "无幻魔人 · 伽古拉", "The Infinite PhantomJugglus Juggler": "无幻魔人 · 伽古拉", "The Man who Created SKaRD": "创造 SKaRD 的男人", "The Silver Eyes of Izak": "伊扎克的银色之眼", "The Space Combat Beast C.O.V.": "宇宙战斗兽 · 戈布", "The Space Crustacean Kaiju Bazanga": "宇宙甲壳怪兽 · 巴赞甲", "The Space Dinosaur Zetton": "宇宙恐龙 · 杰顿", "The Space DinosaurZetton": "宇宙恐龙 · 杰顿", "The Space Electromagnetic Kaiju Gebalga": "宇宙电磁怪兽 · 盖巴尔加", "The Space Iron-Slashing Monster Dinozole": "宇宙斩铁怪兽 · 帝诺佐鲁", "The Space Monster Eleking": "宇宙怪兽 · 艾雷王", "The Space MonsterEleking": "宇宙怪兽 · 艾雷王", "The Space Ninja Alien Baltan": "宇宙忍者 · 巴尔坦星人", "The Space Swordsman Zamsher": "宇宙剑豪 · 扎姆夏", "The Space SwordsmanZamsher": "宇宙剑豪 · 扎姆夏", "The Sunset Wanderer": "落日的流浪者", "The Super Synthetic Monster Neo Darambia": "超合成兽 · 新达兰比尔", "The Ultra-Ancient Dark Monster": "超古代黑暗怪兽", "The Ultra-Ancient Monster Golza": "超古代怪兽 · 哥尔赞", "The Wandering Future": "彷徨的未来", "Ultraman Arc the Movie: The Clash of Light and Evil": "亚刻奥特曼 · 光与暗的对决", "Ultraman Zero: The Revenge of Belial": "赛罗奥特曼 · 超决战！贝利亚银河帝国", "What We Have to Protect": "我们必须守护的东西", "Winning Shot": "决胜一击"});
let cards=[],selectedPack=0,collection={},drawing=false,sound=true,filter='ALL',audioCtx,toastTimer,storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem('ultra-vault-v1')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const [k,v]of Object.entries(saved))if(/^\d+$/.test(k)&&Number.isSafeInteger(v)&&v>0)collection[k]=v;}catch{}
const modal=$('#modal');

const footballPacks=[{name:'绿茵新星',en:'STADIUM RISING',desc:'球场的下一束聚光，为你亮起',badge:'球星集结 · 自由收集',rates:[70,25,5]},{name:'巨星时刻',en:'SUPERSTAR MOMENTS',desc:'把闪耀的瞬间，珍藏成一张卡',badge:'SR 出现率 40%',rates:[50,40,10]},{name:'金球殿堂',en:'GOLDEN LEGENDS',desc:'开启金色卡包，让巨星为你登场',badge:'UR 出现率 20%',rates:[30,50,20]}];
let universe='football',packs=footballPacks;
let drawFormat='all',formatFilter='all',activeOpening=null;
try{sound=localStorage.getItem('ultra-vault-sound')!=='off';const savedUniverse=localStorage.getItem('ultra-vault-universe');if(['ultra','football'].includes(savedUniverse))universe=savedUniverse;}catch{}
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function activeCards(){return cards.filter(c=>c.category===universe)}
function cardFace(c,eager=false){
 if(c.artwork==='complete')return `<img class="complete-card-art" src="${c.image}" alt="${escapeHTML(c.cn)}完整卡面" loading="${eager?'eager':'lazy'}">`;
 if(c.layout==='landscape')return CardExperience.landscapeFace(c,eager);
 if(c.category!=='football')return `<img src="${c.image}" alt="${escapeHTML(c.cn)}卡片" loading="${eager?'eager':'lazy'}">`;
 const name=c.name.split(' ').slice(-1)[0];
 return `<div class="football-face tier-${c.rarity} ${c.cutout?'cutout':'portrait'}"><div class="pitch-lines"></div><span class="football-tier">${c.rarity}<small>STAR</small></span><span class="football-crest">✦</span><img src="${c.image}" alt="${escapeHTML(c.cn)}球员照片" loading="${eager?'eager':'lazy'}"><div class="football-caption"><strong>${escapeHTML(name.toUpperCase())}</strong><span>${escapeHTML(c.cn)}</span><small>${escapeHTML(c.country)} · FAN EDITION</small></div><div class="football-card-footer">ULTRA VAULT / FOOTBALL COLLECTION</div></div>`;
}
function renderUniverse(){
 document.body.dataset.universe=universe;packs=universe==='football'?footballPacks:ultraPacks;
 document.querySelectorAll('button[data-universe]').forEach(b=>{b.classList.toggle('active',b.dataset.universe===universe);b.setAttribute('aria-pressed',String(b.dataset.universe===universe))});
 const football=universe==='football',pool=activeCards();$('#football-count').textContent=cards.filter(c=>c.category==='football').length;
 $('#hero-eyebrow').innerHTML=football?'<span></span> FOOTBALL ALL-STARS · 绿茵巨星集结':'<span></span> M78 · 光之国传来神秘信号';
 $('#hero-headline').innerHTML=football?'把热爱，<br>变成<span class="holo-text">传奇。</span><i>✦</i>':'把光，<br>握在<span class="holo-text">手里。</span><i>✦</i>';
 $('#hero-description').innerHTML=football?`聚光灯下，每一位球星都有自己的传奇。<br>${new Set(pool.map(c=>c.sourcePage||c.name)).size} 位球员 · ${pool.length} 张卡面，等你组建梦幻阵容。`:'每一次开启，都是一次与光的相遇。<br>唤醒传奇英雄，让下一张奇迹为你而来。';
 $('#pool-size').textContent=`◈ ${pool.length} 张${football?'球星':'奥特曼'}卡`;
 $('.floating-label div').innerHTML=football?'你的梦幻阵容，从这里开始<small>THE STADIUM IS CALLING</small>':'下一张，会是传说吗？<small>THE LIGHT IS CALLING</small>';
 $('#featured-heading').textContent=football?'巨星，值得被珍藏。':'光芒，值得被珍藏。';
 $('#pack-heading').innerHTML=(football?'选择你的球星卡包':'选择你的命运卡包')+'<span>01 — 03</span>';
 const hero=football?[pool[2],pool[3],pool[0]]:[pool[9],pool[14],pool[1]];
 $('#card-fan').innerHTML=hero.filter(Boolean).map(c=>`<div class="hero-card ${football?'football-hero':''}">${cardFace(c,true)}${football?'':`<span class="hero-rarity">${c.rarity}</span>`}</div>`).join('');
 const latest=pool.map(c=>c.addedOn||'').sort().at(-1),recent=latest?pool.filter(c=>c.addedOn===latest):[];
 $('#featured-cards').innerHTML=(football?(recent.length?recent:pool).slice(0,6):[pool[0],pool[5],pool[8],pool[10],pool[12],pool[16]]).filter(Boolean).map(c=>cardHTML(c)).join('');
 renderPacks();renderDrawFormat();renderLandscapeShowcase();updateCounts();renderAtlas();renderCollection();
}
function setUniverse(next){if(drawing||!['ultra','football'].includes(next))return;universe=next;filter='ALL';drawFormat='all';formatFilter='all';$('#search').value='';try{localStorage.setItem('ultra-vault-universe',next)}catch{}renderUniverse()}
function updateSoundUI(){const b=$('#sound');b.style.color=sound?'var(--accent)':'';b.setAttribute('aria-label',sound?'关闭音效':'开启音效');b.title=sound?'关闭音效':'开启音效';b.setAttribute('aria-pressed',String(sound));const m=$('#sound-mobile');m.textContent=sound?'♫ 音效开':'♫ 音效关';m.setAttribute('aria-label',sound?'关闭音效':'开启音效');m.setAttribute('aria-pressed',String(sound))}
function ensureAudio(){if(!sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume()}catch{sound=false;updateSoundUI()}}
function resultSound(tier){CardExperience.sound(tier,tone)}

function notify(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600)}
function openModal(html){delete modal.dataset.rarity;$('#modal-content').innerHTML=html;if(!modal.open)modal.showModal()}
function updateCounts(){const pool=activeCards(),valid=cards.filter(c=>collection[c.id]),owned=pool.filter(c=>collection[c.id]);$('#nav-count').textContent=valid.length;$('#collection-summary').textContent=`${owned.length} / ${pool.length} 已点亮`;$('#atlas-summary').textContent=`${pool.length} 张${universe==='football'?'球星':'奥特曼'}卡片 · 总计 ${cards.length} 张`}
function save(){try{localStorage.setItem('ultra-vault-v1',JSON.stringify(collection))}catch{storageAvailable=false}updateCounts()}
function tone(freq=440,duration=.15,delay=0){if(!sound||!audioCtx)return;try{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),start=audioCtx.currentTime+delay;osc.connect(gain);gain.connect(audioCtx.destination);osc.type='sine';osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.065,start);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.start(start);osc.stop(start+duration)}catch{}}
function cardHTML(c,opts={}){
 const horizontal=c.layout==='landscape',title=c.cn+(horizontal?' · '+c.edition:'');
 return `<button class="card-item ${horizontal?'landscape-item':''} ${opts.locked?'locked':''}" data-card="${c.id}" aria-label="查看${escapeHTML(title)}，${c.rarity}体验等级"><div class="card-shell ${horizontal?'landscape-shell':' '+(c.category==='football'?'football-shell':'')} tier-${c.rarity}">${opts.qty?`<span class="quantity">×${opts.qty}</span>`:''}${cardFace(c,opts.eager)}</div><div class="card-name">${escapeHTML(title)}</div><div class="card-code"><span>${horizontal?'横版典藏':c.category==='football'?'FOOTBALL':'ARCHIVE'} ${String(horizontal?c.editionNo:c.category==='football'?c.id-119:c.id+1).padStart(3,'0')}</span><span class="rarity ${c.rarity}">${c.rarity}</span></div></button>`;
}
function drawingPool(){return activeCards().filter(c=>drawFormat!=='landscape'||c.layout==='landscape')}
function renderDrawFormat(){
 const count=activeCards().filter(c=>c.layout==='landscape').length;
 $('#draw-format').hidden=!count;
 $('#landscape-draw-count').textContent=count;
 $('#landscape-showcase-count').textContent=`${count} 张横版`;
 document.querySelectorAll('[data-draw-format]').forEach(button=>{
  const selected=button.dataset.drawFormat===drawFormat;
  button.classList.toggle('active',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
}
function renderLandscapeShowcase(){
 const pool=activeCards().filter(c=>c.layout==='landscape');
 const featured=pool.find(c=>c.artwork==='complete');
 $('#landscape-showcase').hidden=!pool.length;
 $('#landscape-gallery').innerHTML=[featured||pool[0],pool[1],pool[4],pool[8]].filter(Boolean).map(c=>cardHTML(c)).join('');
}
function setDrawFormat(next){if(drawing||!['all','landscape'].includes(next))return;if(next==='landscape'&&!activeCards().some(c=>c.layout==='landscape'))return;drawFormat=next;renderDrawFormat();renderPacks()}
function renderPacks(){ $('#packs').innerHTML=packs.map((p,i)=>`<button class="pack-option ${i===selectedPack?'selected':''}" data-pack="${i}" aria-pressed="${i===selectedPack}"><div class="pack-index">0${i+1} / ${p.en}</div><h3>${p.name}</h3><p>${p.desc}</p><span class="pack-badge">${p.badge}</span><div class="pack-mini" aria-hidden="true"><span>✦</span><b>ULTRA VAULT</b></div></button>`).join('');$('#selected-label').innerHTML=`${packs[selectedPack].name}<small>${drawFormat==='landscape'?'仅横版典藏':'全部卡面'} · 每包 1 张</small>` }
function renderCollection(){updateCounts();$('#collection-filters').innerHTML=['ALL','UR','SR','R'].map(r=>`<button class="filter ${filter===r?'active':''}" data-filter="${r}">${r==='ALL'?'全部收藏':r}</button>`).join('');const owned=activeCards().filter(c=>collection[c.id]&&(filter==='ALL'||c.rarity===filter));$('#collection-grid').innerHTML=owned.length?owned.map(c=>cardHTML(c,{qty:collection[c.id]})).join(''):`<div class="empty"><div class="empty-star">✧</div><h3>${filter==='ALL'?'你的宇宙，等待第一束光':'这个等级的光，还在路上'}</h3><p>开启卡包，与你的英雄相遇。</p><button class="primary" data-action="go-draw">去开启卡包 ↗</button></div>`}
function renderAtlas(){
 const pool=activeCards(),horizontal=pool.filter(c=>c.layout==='landscape').length,latest=pool.map(c=>c.addedOn||'').sort().at(-1),newCount=latest?pool.filter(c=>c.addedOn===latest).length:0;
 $('#format-filters').innerHTML=[['all','全部卡面',pool.length],['new','新加入',newCount],['landscape','横版典藏',horizontal],['portrait','经典竖版',pool.length-horizontal]].map(([key,label,n])=>`<button class="filter ${formatFilter===key?'active':''}" data-format-filter="${key}" aria-pressed="${formatFilter===key}" ${!n?'disabled':''}>${label} <span>${n}</span></button>`).join('');
 const q=$('#search').value.trim().toLowerCase();
 const matches=pool.filter(c=>(formatFilter==='all'||(formatFilter==='new'?Boolean(latest)&&c.addedOn===latest:(c.layout==='landscape'?'landscape':'portrait')===formatFilter))&&`${c.cn} ${c.name} ${c.rarity} ${c.edition||''} ${c.layout==='landscape'?'横版':''}`.toLowerCase().includes(q)).sort((a,b)=>Number(b.layout==='landscape')-Number(a.layout==='landscape'));
 $('#atlas-grid').innerHTML=matches.length?matches.map(c=>cardHTML(c,{qty:collection[c.id]})).join(''):'<p class="empty">没有找到卡片，试试“梅西”“横版”或“迪迦”，也可以切换卡池。</p>';
}
function changeView(view){for(const v of ['draw','collection','atlas'])$(`#${v}-view`).hidden=v!==view;document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view));if(view==='collection')renderCollection();if(view==='atlas')renderAtlas();window.scrollTo({top:0,behavior:'smooth'})}
function random(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}
function pickCard(){const n=random()*100,[r,s]=packs[selectedPack].rates;const rarity=n<r?'R':n<r+s?'SR':'UR';const pool=drawingPool().filter(c=>c.rarity===rarity);return pool[Math.floor(random()*pool.length)]}
function highestRarity(result){return result.some(c=>c.rarity==='UR')?'UR':result.some(c=>c.rarity==='SR')?'SR':'R'}
function renderResults(result,fresh,{preview=false,skipMotion=false,silent=false}={}){
 const tier=highestRarity(result),motion=!skipMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const horizontal=result.every(c=>c.layout==='landscape');
 const best=preview?`${tier} · ${CardExperience.tiers[tier].label}`:universe==='football'?(tier==='UR'?'巨星登场，属于你的主场。':'你的梦幻阵容，再添新星。'):(tier==='UR'?'传说之光，回应了你。':'每一束光，都独一无二。');
 openModal(`<section class="result-stage rarity-${tier} ${motion?'':'motion-still'}">${CardExperience.effects(tier,motion)}<div class="modal-kicker">${preview?'VISUAL PREVIEW':'SUMMONING COMPLETE'} · ${packs[selectedPack].en}</div><h2>${best}</h2>${preview?'<p class="preview-notice">特效预览 · 不计入收藏 · 正式抽卡概率不变</p>':`<p class="muted">获得 ${result.length} 张卡片 · 解锁 ${fresh.size} 张新收藏${storageAvailable?' · 已自动保存':' · 浏览器存储不可用，本次仅暂存'}</p>`}<div class="result-grid ${result.length===1?'single':''} ${horizontal?'landscape-results':''}">${result.map((c,i)=>`<div class="result-card rarity-${c.rarity} ${c.layout==='landscape'?'landscape-result':''}" data-rarity="${c.rarity}" style="--delay:${i*.1}s;--flight-x:${(i%2===0?-1:1)*(20+i*2)}px"><div class="result-card-content">${cardHTML(c,{eager:true})}<span class="reveal-grade">${c.rarity} · ${CardExperience.tiers[c.rarity].label}</span>${fresh.has(c.id)?'<span class="new-badge">NEW</span>':''}</div></div>`).join('')}</div><div class="modal-actions">${preview?'<button class="secondary" data-action="preview-options">切换等级 ↗</button><button class="primary" data-action="real-draw">正式抽卡 ✦</button>':`<button class="secondary" data-action="collection">查看收藏 ↗</button><button class="primary" data-action="again" data-count="${result.length}">再开${result.length===1?'一包':'十包'} ✦</button>`}</div></section>`);
 modal.dataset.rarity=tier;
 if(!silent)resultSound(tier);
}
function playOpening(result,fresh,preview=false){
 if(drawing)return;ensureAudio();drawing=true;$('#draw-one').disabled=true;$('#draw-ten').disabled=true;
 const tier=highestRarity(result),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let finished=false;const timers=[];
 const finish=(options={})=>{if(finished)return;finished=true;timers.forEach(clearTimeout);activeOpening=null;drawing=false;$('#draw-one').disabled=false;$('#draw-ten').disabled=false;renderResults(result,fresh,{preview,...options})};
 activeOpening={finish};
 openModal(`<div class="modal-kicker">${preview?'EFFECT PREVIEW':universe==='football'?'WELCOME TO THE STADIUM':'CONNECTING TO M78'}</div>${CardExperience.opening(tier,result.every(c=>c.layout==='landscape'))}<button class="text-button skip-opening" id="skip-reveal">跳过动画，直接查看 ↗</button>`);modal.dataset.rarity=tier;
 tone(160,.25);tone(240,.2,.3);
 if(!reduced){[[600,'02 / 卡包封印正在解开'],[1250,'03 / 卡片即将揭晓']].forEach(([ms,text])=>timers.push(setTimeout(()=>{const node=$('#opening-step');if(node&&!finished)node.textContent=text},ms)))}
 $('#skip-reveal').onclick=()=>finish({skipMotion:true});
 timers.push(setTimeout(()=>finish(),reduced?0:1950));
}
async function draw(count){
 if(drawing||!drawingPool().length||![1,10].includes(count))return;
 const result=Array.from({length:count},()=>pickCard()),fresh=new Set();
 for(const c of result){if(!collection[c.id])fresh.add(c.id);collection[c.id]=(collection[c.id]||0)+1}
 save();playOpening(result,fresh);
}
function openEffectsPreview(){if(drawing)return;openModal(`<div class="modal-kicker">RARITY LIGHT SHOW</div><h2>每一个等级，都有专属高光。</h2><p class="muted">预览不会获得卡片或修改收藏，正式抽卡概率保持不变。</p><div class="rarity-preview-options">${['R','SR','UR'].map(t=>`<button class="rarity-preview rarity-${t}" data-preview-tier="${t}"><strong>${t}</strong><span>${CardExperience.tiers[t].label}</span><small>点击预览开卡效果 ↗</small></button>`).join('')}</div>`)}
function previewRarity(tier){if(drawing||!CardExperience.tiers[tier])return;const pool=drawingPool().filter(c=>c.rarity===tier),card=pool.find(c=>c.layout==='landscape')||pool[0];if(card)playOpening([card],new Set(),true)}
function closeModal(){if(activeOpening)activeOpening.finish({silent:true,skipMotion:true});modal.close()}
function showCard(id){const c=cards.find(c=>c.id===Number(id));if(!c)return;openModal(`<div class="card-detail ${c.layout==='landscape'?'detail-landscape':''}"><div class="detail-image ${c.layout==='landscape'?'landscape-detail':''}">${cardFace(c,true)}</div><div class="detail-copy"><div class="modal-kicker">${c.category==='football'?'FOOTBALL ARCHIVE':'ULTRA ARCHIVE'} · ${String(c.editionNo ?? (c.category==='football'?c.id-119:c.id+1)).padStart(3,'0')}</div><h2>${escapeHTML(c.cn)}${c.edition?' · '+escapeHTML(c.edition):''}</h2><p>${escapeHTML(c.name)}</p>${c.license?`<p class="photo-credit">照片：${escapeHTML(c.author||'Wikimedia Commons')}<br>许可：<a href="${escapeHTML(c.licenseUrl||c.sourcePage)}" target="_blank" rel="noopener">${escapeHTML(c.license)}</a><br>图片已缩放并压缩为 WebP</p>`:''}${c.country?`<p>${escapeHTML(c.country)} · 球星主题卡<br>本站设计卡面 · 非官方发行卡</p>`:''}<div class="rarity ${c.rarity}">${c.rarity} <small style="font:10px Arial;color:#91a7ac">本站体验等级</small></div><p>${collection[c.id]?`已收藏 ${collection[c.id]} 张 · 光已回应你的召唤`:'尚未收藏 · 在卡包中遇见这位英雄'}</p>${c.artwork==='complete'?'<a class="text-button" href="street-football/">玩 14 号 · 街头足球</a>':`<a class="text-button" href="${c.sourcePage||c.source}" target="_blank" rel="noopener">查看图片来源 ↗</a>`}</div></div>`)}
document.addEventListener('click',e=>{const demo=e.target.closest('[data-preview-tier]');if(demo){previewRarity(demo.dataset.previewTier);return}const drawType=e.target.closest('[data-draw-format]');if(drawType)setDrawFormat(drawType.dataset.drawFormat);const formatButton=e.target.closest('[data-format-filter]');if(formatButton){formatFilter=formatButton.dataset.formatFilter;renderAtlas()}if(e.target.closest('.brand'))changeView('draw');const universeButton=e.target.closest('button[data-universe]');if(universeButton)setUniverse(universeButton.dataset.universe);const view=e.target.closest('[data-view]');if(view)changeView(view.dataset.view);const pack=e.target.closest('[data-pack]');if(pack&&!drawing){selectedPack=Number(pack.dataset.pack);renderPacks();tone(330,.1)}const c=e.target.closest('[data-card]');if(c)showCard(c.dataset.card);const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;renderCollection()}const a=e.target.closest('[data-action]');if(a){if(a.dataset.action==='preview-options')openEffectsPreview();else if(a.dataset.action==='real-draw')draw(1);else if(a.dataset.action==='again')draw(Number(a.dataset.count));else{modal.close();changeView(a.dataset.action==='collection'?'collection':'draw')}}});
$('#draw-one').onclick=()=>draw(1);$('#draw-ten').onclick=()=>draw(10);$('#close-modal').onclick=closeModal;
modal.addEventListener('cancel',e=>{e.preventDefault();closeModal()});modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
$('#go-draw').onclick=()=>changeView('draw');$('#view-atlas').onclick=()=>changeView('atlas');$('#search').oninput=renderAtlas;
$('#effects-preview').onclick=openEffectsPreview;$('#browse-landscape').onclick=()=>{formatFilter='landscape';$('#search').value='';changeView('atlas')};
$('#sound').onclick=()=>{sound=!sound;if(sound){ensureAudio();tone(660,.2)}updateSoundUI();try{localStorage.setItem('ultra-vault-sound',sound?'on':'off')}catch{}notify(sound?'音效已开启':'音效已关闭')};
$('#sound-mobile').onclick=$('#sound').onclick;
$('#rates').onclick=()=>openModal(`<div class="modal-kicker">TRANSPARENT BY DESIGN</div><h2>每一份期待，都有迹可循。</h2><p class="muted">以下为本站模拟抽卡规则，与实体卡包官方概率无关。</p><table class="rates-table"><thead><tr><th>卡包</th><th>R · 星辉</th><th>SR · 闪耀</th><th>UR · 传说</th></tr></thead><tbody>${packs.map(p=>`<tr><td>${p.name}</td>${p.rates.map(r=>`<td>${r}%</td>`).join('')}</tr>`).join('')}</tbody></table><p class="muted">每张独立随机，同等级卡片等概率。十连为十次独立抽取，无保底。<br>免费体验，卡片可重复获得；R / SR / UR 为本站自设等级。</p>`);
for(let i=0;i<55;i++){const star=document.createElement('i');star.style.left=`${Math.random()*100}%`;star.style.top=`${Math.random()*100}%`;$('#stars').appendChild(star)}
async function init(){try{const responses=await Promise.all([fetch('cards.json'),fetch('football.json?v=stars-60'),fetch('landscape.json?v=future-star')]);if(responses.some(r=>!r.ok))throw Error('卡图清单不可用');const [ultra,football,landscape]=await Promise.all(responses.map(r=>r.json()));cards=[...ultra.map((c,i)=>({...c,category:'ultra',cn:names[c.name]||c.name,rarity:c.rarity||(i%3===0?'UR':i%3===1?'SR':'R')})),...football,...landscape];if(!cards.length||!football.length)throw Error('卡片为空');renderUniverse();updateSoundUI();}catch(err){$('#packs').innerHTML='<p class="muted">卡片加载失败，请刷新重试。</p>';$('#draw-one').disabled=true;$('#draw-ten').disabled=true;notify('卡图加载失败，请刷新网页')}}
init();
