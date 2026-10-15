// 건폐율·용적률 조례 적용 계산기 매뉴얼 화면 캡처 — usage: node capture_lu.js <repoDir> <outDir>
// 규격: 1440×900 · DSF 1.25 (영상용 좁은 화면: MM_VW=720 MM_VH=1280 MM_DSF=2) · serviceWorkers block · _marks.json · _example.json(앱 계산 결과)
// 예제 값은 손으로 옮기지 않는다 — 계산 뒤 앱 화면의 표시값과 mmSnap() 결과를 읽어 _example.json 에 기록한다.
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=+(process.env.MM_VW||1440),VH=+(process.env.MM_VH||900),DSF=+(process.env.MM_DSF||1.25),PORT=8902;
/* 예제 A = 익산시 준주거지역 대지 500㎡ — 시행령 70 % · 500 % ↔ 익산시 도시계획 조례 70 % · 350 % (조례가 더 엄격)
   예제 B = 익산시 계획관리지역 대지 1,000㎡ — 40 % · 100 % 동일 · 조례 단서(성장관리계획 125 %) · 시행령 제47조 안내
   예제 C = 전주시 일반상업지역 대지 800㎡ — 시행령 80 % · 1,300 % ↔ 전주시 도시계획 조례 70 % · 900 % */
const EX={
 A:{pn:'익산시 ○○동 근린생활시설 신축공사',au:'김만민',sido:'전북',sgg:'익산시',tab:'urban',maj:'주거',key:'준주거',sqm:500},
 B:{pn:'익산시 ○○면 제조업소 신축공사',au:'김만민',sido:'전북',sgg:'익산시',tab:'manage',key:'계획관리',sqm:1000},
 C:{pn:'전주시 ○○동 업무시설 신축공사',au:'김만민',sido:'전북',sgg:'전주시',tab:'urban',maj:'상업',key:'일반상업',sqm:800},
};
const FREEZE=`(()=>{const T=new Date(2026,9,15,10,0,0).getTime();const D=Date;class F extends D{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}window.Date=F;window.alert=()=>{};window.confirm=()=>true;try{localStorage.clear();localStorage.setItem('pwa-dismissed','1');}catch(e){}})()`;
const HIDE='#toast,.toast,#pwa-banner,#ios-guide-modal,#pwa-install-bar{display:none!important}.result-panel{position:static!important;max-height:none!important;overflow:visible!important}#rcard,#cmp-banner{animation:none!important}';
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__find=sel=>{if(sel.startsWith('nth:')){const [q,i]=sel.slice(4).split('|');return [...document.querySelectorAll(q)].filter(__vis)[+i]||null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__EX=${JSON.stringify(EX)};
window.__run=k=>{const e=__EX[k];closeLaw();resetAll();goTab('main');
 const sv=(id,v)=>{const x=document.getElementById(id);x.value=v;};sv('a4ProjName',e.pn);sv('a4Author',e.au);
 sv('sel-sido',e.sido);onSido();sv('sel-sigungu',e.sgg);onSigungu();
 switchTab(e.tab);if(e.tab==='urban'){sv('maj-urban',e.maj);onMaj();sv('min-urban',e.key);onMin();}else{sv('min-'+e.tab,e.key);onDirect(e.tab);}
 sv('inp-sqm',e.sqm);syncPy();calculate();setStep(4);window.scrollTo(0,0);};
window.__ex=()=>{const d=mmSnap();const t=id=>{const x=document.getElementById(id);return x?x.innerText.replace(/\\s+/g,' ').trim():'';};
 return {key:d.key,name:d.z.name,law:{cov:d.z.cov,far:d.z.far},ord:d.ord,ref:d.meta&&d.meta._ref,date:d.meta&&d.meta._date,cond:d.meta&&d.meta._cond&&d.meta._cond[d.key]||null,
  sido:d.sido,sigungu:d.sigungu,sqm:d.sqm,effCov:d.effCov,effFar:d.effFar,bld:d.bld,gfa:d.gfa,
  ui:{site:t('r-site'),bld:t('r-bld'),gfa:t('r-gfa'),flr:t('r-flr'),diff:t('c-diff'),py:document.getElementById('inp-py').value,region:t('region-note'),od:t('ord-date-info'),sp:t('special-note')}};};`;
const IN='.page > div:first-child > .card';
const SHOTS=[
 {id:'s01_overview',pre:"__run('A')",clip:'viewport',m:[['.tab-bar-inner','작업 탭 · 매뉴얼'],['.sum-bar','요약 스트립'],['.step-bar','진행 단계'],[IN,'입력 패널'],['#cmp-banner','법령 vs 조례 비교'],['#rcard','판정 결과'],['#fab-group','초기화 · 이용안내']]},
 {id:'s02_tabs',clip:'header.app-header',m:[['nth:.tab-bar-inner .tb|0','검토 입력 · 결과'],['nth:.tab-bar-inner .tb|1','A4 계산서'],['.tb-manual','매뉴얼'],['.hdr-right','근거 · 시행일']]},
 {id:'s03_project',clip:'nth:.region-panel|0',m:[['#a4ProjName','공사명'],['#a4Author','작성자']]},
 {id:'s04_region',clip:'nth:.region-panel|1',m:[['#sel-sido','광역시 · 도'],['#sel-sigungu','시 · 군 (전북 14곳)'],['#region-note','조례 적용 안내 — 조문 · 시행일']]},
 {id:'s05_zone',clip:'.tabrow',union:'.calc-btn',m:[['nth:.tabrow .tab|0','도시지역'],['nth:.tabrow .tab|1','관리지역'],['nth:.tabrow .tab|2','농림 · 자연'],['#maj-urban','대분류'],['#min-urban','세부 용도지역'],['#inp-sqm','대지면적 ㎡'],['#inp-py','평 환산'],['.calc-btn','계산']]},
 {id:'s06_compare',clip:'#cmp-banner',m:[['nth:.cb-col|0','국토계획법(시행령) 최대치'],['nth:.cb-col|1','조례 적용값'],['#c-diff','판정 — 조례가 더 엄격']]},
 {id:'s07_result',clip:'#rcard',crop:900,m:[['.zone-row','용도지역'],['nth:.rbox|0','건폐율 — 시행령 · 조례'],['nth:.rbox|1','용적률 — 시행령 · 조례'],['#area-calc','대지면적 기준 계산'],['#r-note','적용 기준']]},
 {id:'s08_notes',clip:'#r-note',union:'#r-tags',m:[['#ord-date-info','조례 근거 — 조문 · 시행일'],['#ord-warn','조례 강화 경고']]},
 {id:'s09_planned',pre:"__run('B')",wait:800,clip:'#rcard',crop:1100,m:[['nth:.rbox|0','건폐율 40 %'],['nth:.rbox|1','용적률 100 %'],['#special-note','2024.5.28 완화 — 제84조④ · 제47조①'],['#ord-date-info','조건부 값 — 성장관리계획 125 %']]},
 {id:'s10_jeonju',pre:"__run('C')",wait:800,clip:'#cmp-banner',union:'#area-calc',m:[['nth:.cb-col|0','시행령 80 % · 1,300 %'],['nth:.cb-col|1','전주시 조례 70 % · 900 %'],['#area-calc','대지 800㎡ 기준']]},
 {id:'s11_table',pre:"__run('A');document.getElementById('tbl-wrap').classList.add('open');document.getElementById('tbl-ico').classList.add('open')",wait:800,clip:'.tbl-card',crop:1500,m:[['.tbl-toggle','일람표 펼치기'],['#tbl-region-label','적용 조례 표시'],['nth:#tbl-body tr|1','법령 · 조례 나란히']]},
 {id:'s12_modal',pre:"document.getElementById('tbl-wrap').classList.remove('open');openLaw()",wait:700,fixed:true,clip:'#law-ov .modal-box',m:[]},
 {id:'s13_modal_law',pre:"(()=>{const bx=document.querySelector('#law-ov .modal-box');const t=[...bx.querySelectorAll('.msec-title')].find(x=>x.textContent.includes('근거'));bx.scrollTop+=t.getBoundingClientRect().top-bx.getBoundingClientRect().top-70;})()",wait:500,fixed:true,clip:'#law-ov .modal-box',post:"closeLaw()",m:[]},
 {id:'s14_a4',pre:"__run('A');goTab('print');scrollTo(0,0)",wait:1500,clip:'viewport',m:[['.mm-btn-print','인쇄 / PDF'],['.mm-btn-jpg','JPG 저장'],['#a4Page','A4 계산서']]},
 {id:'s15_a4page',clip:'#a4Page',crop:2600,m:[['.a4-head2','공사명 · 근거 · 작성일'],['nth:#a4Page .a4-sub|0','1. 검토 조건'],['nth:#a4Page .a4-sub|1','2. 법령 vs 조례'],['nth:#a4Page .a4-sub|2','3. 대지면적 기준 산정'],['nth:#a4Page .a4-sub|3','4. 용도지역별 법정 상한'],['nth:#a4Page .a4-sub|4','5. 적용 기준 · 유의사항']]},
];
(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch({args:['--lang=ko-KR'],env:{...process.env,LANG:'ko_KR.UTF-8',LANGUAGE:'ko',LC_ALL:'ko_KR.UTF-8'}});
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(FREEZE);
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(2500);
 await pg.addStyleTag({content:HIDE});await pg.evaluate(HELP);
 const ex={};const meta={};
 for(const S of SHOTS){
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||700);
  if(S.clip!=='viewport'&&!S.fixed){await pg.evaluate(c=>{const e=__find(c);if(e){window.scrollTo(0,e.getBoundingClientRect().top+scrollY-40);}},S.clip);await pg.waitForTimeout(500);}
  await pg.evaluate(v=>{const f=document.getElementById('fab-group');if(f)f.style.visibility=v?'':'hidden';},S.clip==='viewport');
  if(S.id==='s01_overview')ex.A=await pg.evaluate('__ex()');
  if(S.id==='s09_planned')ex.B=await pg.evaluate('__ex()');
  if(S.id==='s10_jeonju')ex.C=await pg.evaluate('__ex()');
  if(S.id==='s15_a4page')ex.A_a4=await pg.evaluate(()=>document.getElementById('a4Page').innerText.replace(/\s+/g,' '));
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);clip={x:a.x,y:a.y,width:a.w,height:a.h};
     if(S.union){const e2=__find(S.union);if(e2){const a2=abs(e2);const x0=Math.min(clip.x,a2.x),y0=Math.min(clip.y,a2.y),x1=Math.max(clip.x+clip.width,a2.x+a2.w),y1=Math.max(clip.y+clip.height,a2.y+a2.h);clip={x:x0,y:y0,width:x1-x0,height:y1-y0};}}
     const P=12;clip={x:Math.max(0,clip.x-P),y:Math.max(0,clip.y-P),width:clip.width+2*P,height:clip.height+2*P};
     if(S.crop&&clip.height>S.crop)clip.height=S.crop;}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(Math.min(a.w,clip.x+clip.width-a.x)/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW-Math.max(0,c.x)),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){const sx=await pg.evaluate(()=>scrollX),sy=await pg.evaluate(()=>scrollY);await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:Math.max(0,c.x-sx),y:Math.max(0,c.y-sy),width:Math.min(c.width,VW),height:Math.min(c.height,VH-Math.max(0,c.y-sy))}});}
  else{try{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}catch(e){errs.push(S.id+' shot '+JSON.stringify(cl));continue;}}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(Math.min(cl.height,S.fixed?VH:1e9)),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(400);}
 }
 await pg.evaluate("__run('A')");await pg.waitForTimeout(600);ex.after=await pg.evaluate('__ex()');
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true,locale:'ko-KR'});await setup(mctx);
 const mp=await mctx.newPage();await mp.addInitScript(FREEZE);
 await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForTimeout(2500);
 await mp.addStyleTag({content:HIDE});await mp.evaluate(HELP);await mp.evaluate("__run('A')");await mp.waitForTimeout(800);
 await mp.evaluate(()=>{const e=document.querySelectorAll('.region-panel')[1];window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(600);
 await mp.screenshot({path:path.join(out,'s16_mobile_main.png')});meta['s16_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{const e=document.getElementById('cmp-banner');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(800);
 await mp.screenshot({path:path.join(out,'s17_mobile_result.png')});meta['s17_mobile_result']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{goTab('print');window.scrollTo(0,0);});await mp.waitForTimeout(1500);
 await mp.screenshot({path:path.join(out,'s18_mobile_a4.png')});meta['s18_mobile_a4']={w:390,h:844,marks:[]};
 ex.mobile=await mp.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(ex,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5||m.w<=0||m.h<=0)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 const sh=o=>o&&{key:o.key,law:o.law,ord:o.ord,eff:[o.effCov,o.effFar],bld:o.bld,gfa:o.gfa,diff:o.ui.diff,cond:o.cond};
 console.log(JSON.stringify({A:sh(ex.A),B:sh(ex.B),C:sh(ex.C),same:JSON.stringify(ex.A)===JSON.stringify(ex.after),mobile:ex.mobile,sizes:Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,v.w+'x'+v.h])),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
