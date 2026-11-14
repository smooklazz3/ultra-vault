'use strict';
const CardExperience=(()=>{
 const tiers={
  R:{label:'冰蓝星尘',color:'#9bdeff',particles:10,notes:[523.25,783.99,1046.5]},
  SR:{label:'紫晶极光',color:'#d5adff',particles:22,notes:[523.25,622.25,783.99,1244.51]},
  UR:{label:'金色光爆',color:'#ffdc8b',particles:36,notes:[392,523.25,659.25,783.99,1046.5,1567.98]}
 };
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function landscapeFace(c,eager=false){
  const surname=c.name.split(' ').slice(-1)[0].toUpperCase(),size=Math.min(12,100/surname.length);
  return `<div class="landscape-face rarity-${c.rarity}" style="--name-size:${size}cqw"><div class="landscape-orbit" aria-hidden="true"></div><div class="landscape-grid" aria-hidden="true"></div><div class="landscape-topline"><span>ULTRA VAULT / COLLECTOR’S CUT</span><span>NO. ${String(c.editionNo).padStart(3,'0')}</span></div><div class="landscape-rank"><b>${c.rarity}</b><span>${esc(c.edition)}</span></div><div class="landscape-lettering" aria-hidden="true">${esc(surname)}</div><img class="landscape-player" src="${c.image}" alt="${esc(c.cn)}横版典藏卡球员照片" loading="${eager?'eager':'lazy'}"><div class="landscape-title"><strong>${esc(surname)}</strong><span>${esc(c.cn)}</span><small>${esc(c.country)} / FOOTBALL COLLECTION</small></div><div class="landscape-bottomline"><span>THE BEAUTIFUL GAME. FOREVER COLLECTED.</span><span>FAN EDITION ✦ VOL.01</span></div></div>`;
 }
 function opening(tier,landscape){return `<div class="opening-cinema rarity-${tier} ${landscape?'opening-landscape':''}" aria-label="卡包开启动画"><div class="opening-orbit" aria-hidden="true"></div><div class="opening-charge" aria-hidden="true"></div><div class="opening-flight" aria-hidden="true">${[0,1,2].map(i=>`<div class="flying-card flying-card-${i}"><span>✦</span><small>ULTRA VAULT</small></div>`).join('')}</div><div class="sealed-pack" aria-hidden="true"><div class="pack-half pack-left"></div><div class="pack-half pack-right"></div><div class="pack-emblem">✦<small>ULTRA VAULT</small></div><div class="pack-seam"></div></div><div class="opening-stage-copy"><span id="opening-step" role="status">01 / 汇聚星光</span><div class="opening-progress"><i></i><i></i><i></i></div></div></div>`}
 function effects(tier,motion=true){if(!motion)return '';const t=tiers[tier];return `<div class="reveal-effects rarity-${tier}" aria-hidden="true"><div class="reveal-bloom"></div><div class="reveal-ring"></div>${tier==='UR'?'<div class="reveal-rays"></div>':''}<div class="spark-origin">${Array.from({length:t.particles},(_,i)=>`<i class="reveal-spark" style="--angle:${i*137.508}deg;--travel:${80+(i%8)*24}px;--size:${2+i%3}px;--spark-delay:${i%5*.025}s"></i>`).join('')}</div></div>`}
 function sound(tier,tone){const notes=tiers[tier].notes;notes.forEach((n,i)=>tone(n,i===notes.length-1 ? .6 : .2,i*.085))}
 return {tiers,landscapeFace,opening,effects,sound};
})();
