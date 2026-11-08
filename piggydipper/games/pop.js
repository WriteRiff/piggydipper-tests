(function(){
'use strict';
/* ===== Sweet Pop: tap a group of 2+ matching treats to pop them ===== */

/* treat types: 0 cookie, 1 cinnamon roll, 2-5 cake pops */
const POPS={
  2:{c:'#ff4fa8',l:'#ffb3da',d:'#c2307e',deco:'drizzle'},
  3:{c:'#3ff0ff',l:'#c4fcff',d:'#139fb0',deco:'dots'},
  4:{c:'#9dff4f',l:'#dcffb8',d:'#4fae1c',deco:'stripes'},
  5:{c:'#b48cff',l:'#e6d8ff',d:'#7d52d6',deco:'stars'}
};
const SPARK={0:['#ffd6ec','#3ff0ff','#9dff4f'],1:['#ffffff','#b48cff'],2:['#ff4fa8','#ffd6ec'],3:['#3ff0ff','#ffffff'],4:['#9dff4f','#ffffff'],5:['#b48cff','#ffd6ec']};
/* levels: columns, rows, treat types, most treats you may leave, how clumpy the board starts */
const LV=[
  {c:6,r:8,n:3,t:8,clump:.25},
  {c:7,r:9,n:4,t:6,clump:.22},
  {c:8,r:10,n:5,t:7,clump:.28},
  {c:9,r:10,n:5,t:5,clump:.30},
  {c:9,r:11,n:6,t:5,clump:.36}
];

/* ---------- board logic on plain arrays (columns, bottom-up) ---------- */
function rawBoard(L,clump){
  const g=[];
  for(let c=0;c<L.c;c++){const col=[];for(let r=0;r<L.r;r++){
    let t=Math.random()*L.n|0;
    if(Math.random()<clump){const nb=[];if(c>0)nb.push(g[c-1][r]);if(r>0)nb.push(col[r-1]);if(nb.length)t=nb[Math.random()*nb.length|0]}
    col.push(t)}g.push(col)}
  return g}
function hasMove(g){
  for(let c=0;c<g.length;c++)for(let r=0;r<g[c].length;r++){const t=g[c][r];
    if(r+1<g[c].length&&g[c][r+1]===t)return true;
    if(c+1<g.length&&r<g[c+1].length&&g[c+1][r]===t)return true}
  return false}
function groupOf(g,c0,r0){
  const t=g[c0]&&g[c0][r0];if(t==null)return[];
  const seen=new Set([c0+','+r0]),out=[[c0,r0]],q=[[c0,r0]];
  while(q.length){const [c,r]=q.pop();
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr,k=nc+','+nr;
      if(nc<0||nc>=g.length||nr<0||nr>=g[nc].length||seen.has(k)||g[nc][nr]!==t)continue;
      seen.add(k);out.push([nc,nr]);q.push([nc,nr])}}
  return out}
function allGroups(g){
  const seen=g.map(col=>col.map(()=>false)),res=[];
  for(let c=0;c<g.length;c++)for(let r=0;r<g[c].length;r++){if(seen[c][r])continue;
    const grp=groupOf(g,c,r);grp.forEach(([a,b])=>seen[a][b]=true);if(grp.length>1)res.push(grp)}
  return res}
function removeCells(g,cells){
  const rm=new Set(cells.map(([c,r])=>c+','+r));
  return g.map((col,c)=>col.filter((_,r)=>!rm.has(c+','+r))).filter(col=>col.length)}
const count=g=>g.reduce((s,col)=>s+col.length,0);
/* random playouts: the best result proves the target can be reached */
function solve(g,K){
  let best=1e9;
  for(let k=0;k<K;k++){let b=g.map(a=>a.slice());const s=k%3;
    for(;;){const gs=allGroups(b);if(!gs.length)break;let pick;
      if(s===1){let m=1e9;gs.forEach(x=>{if(x.length<m||(x.length===m&&Math.random()<.5)){m=x.length;pick=x}})}
      else if(s===2){const big=gs.filter(x=>x.length>2);const arr=big.length&&Math.random()<.7?big:gs;pick=arr[Math.random()*arr.length|0]}
      else pick=gs[Math.random()*gs.length|0];
      b=removeCells(b,pick)}
    best=Math.min(best,count(b));if(best===0)return 0}
  return best}
function genBoard(L){
  let clump=L.clump,best=null,bestLeft=1e9;const t0=performance.now();
  for(let a=0;a<80;a++){const g=rawBoard(L,clump);if(!hasMove(g))continue;
    const left=solve(g,36);if(left<=L.t)return g;
    if(left<bestLeft){bestLeft=left;best=g}
    if(a%6===5)clump=Math.min(.62,clump+.04);
    if(performance.now()-t0>300)break}
  return best||rawBoard(L,.5)}

/* ---------- treat drawing (smooth, glossy) ---------- */
function rr(x,ctx,a,b,w,h,r){ctx.beginPath();ctx.moveTo(a+r,b);ctx.arcTo(a+w,b,a+w,b+h,r);ctx.arcTo(a+w,b+h,a,b+h,r);ctx.arcTo(a,b+h,a,b,r);ctx.arcTo(a,b,a+w,b,r);ctx.closePath()}
function drawCookie(g,S){
  const cx=S/2,cy=S/2,R=S*.4;
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(cx,cy+R*.12,R,R*.98,0,0,Math.PI*2);g.fill();
  g.beginPath();for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,k=1+(i%2?.035:-.02)+Math.sin(i*2.3)*.02;const x=cx+Math.cos(a)*R*k,y=cy+Math.sin(a)*R*k;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();
  const gr=g.createRadialGradient(cx-R*.35,cy-R*.4,R*.1,cx,cy,R*1.05);gr.addColorStop(0,'#fff6fb');gr.addColorStop(.55,'#ffd6ec');gr.addColorStop(1,'#ffa9d2');
  g.fillStyle=gr;g.fill();g.lineWidth=Math.max(1,S*.025);g.strokeStyle='#f27ab8';g.stroke();
  [[-.38,-.18,'#3ff0ff'],[.22,-.36,'#ff4fa8'],[.04,.02,'#b48cff'],[-.16,.38,'#9dff4f'],[.4,.18,'#3ff0ff'],[-.02,-.52,'#9dff4f'],[.18,.48,'#ff4fa8'],[-.5,.2,'#b48cff']].forEach(([dx,dy,col],i)=>{
    g.save();g.translate(cx+dx*R,cy+dy*R);g.rotate(i*.9);g.fillStyle=col;g.beginPath();g.ellipse(0,0,R*.12,R*.085,0,0,Math.PI*2);g.fill();
    g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(-R*.03,-R*.025,R*.04,R*.025,0,0,Math.PI*2);g.fill();g.restore()});
  g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=S*.035;g.lineCap='round';g.beginPath();g.arc(cx,cy,R*.78,Math.PI*1.08,Math.PI*1.42);g.stroke()}
function drawRoll(g,S){
  const cx=S/2,cy=S/2,R=S*.41;
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.arc(cx,cy+R*.12,R,0,Math.PI*2);g.fill();
  const gr=g.createRadialGradient(cx-R*.3,cy-R*.35,R*.1,cx,cy,R);gr.addColorStop(0,'#ffffff');gr.addColorStop(.7,'#f6f0ff');gr.addColorStop(1,'#dccbff');
  g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.fill();
  g.lineWidth=R*.14;g.strokeStyle='#b48cff';g.stroke();
  g.lineCap='round';g.lineWidth=R*.15;g.strokeStyle='#9a6cf0';g.beginPath();
  const turns=Math.PI*2*2.3;for(let t=0;t<=turns;t+=.12){const rad=R*.06+t/turns*R*.66;const x=cx+Math.cos(t)*rad,y=cy+Math.sin(t)*rad;t?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
  g.fillStyle='rgba(255,255,255,.95)';[[-.5,-.3,.13],[.42,-.4,.1],[.5,.32,.12],[-.3,.52,.1]].forEach(([dx,dy,s])=>{g.beginPath();g.arc(cx+dx*R,cy+dy*R,R*s,0,Math.PI*2);g.fill()});
  g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=S*.03;g.beginPath();g.arc(cx,cy,R*.86,Math.PI*1.1,Math.PI*1.4);g.stroke()}
function drawPop(g,S,p){
  const cx=S/2,cy=S*.4,rx=S*.27,ry=S*.33;
  g.fillStyle='#ffffff';rr(0,g,cx-S*.04,cy+ry*.7,S*.08,S*.95-(cy+ry*.7),S*.03);g.fill();
  g.fillStyle='#e3d8ff';g.fillRect(cx+S*.005,cy+ry*.75,S*.035,S*.95-(cy+ry*.75)-S*.02);
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(cx,cy+ry*.1,rx,ry,0,0,Math.PI*2);g.fill();
  const gr=g.createRadialGradient(cx-rx*.4,cy-ry*.45,rx*.1,cx,cy,ry*1.05);gr.addColorStop(0,p.l);gr.addColorStop(.5,p.c);gr.addColorStop(1,p.d);
  g.fillStyle=gr;g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.fill();
  g.save();g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.clip();
  g.fillStyle=g.strokeStyle='rgba(255,255,255,.92)';g.lineCap='round';g.lineJoin='round';
  if(p.deco==='drizzle'){g.lineWidth=S*.035;g.beginPath();for(let i=0;i<=6;i++){const x=cx-rx+i*rx/3,y=cy-ry*.05+(i%2?ry*.22:-ry*.12);i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
  else if(p.deco==='dots'){[[-.4,-.1],[.1,-.4],[.35,.05],[-.1,.3],[.2,.5],[-.45,.45],[0,0]].forEach(([dx,dy])=>{g.beginPath();g.arc(cx+dx*rx,cy+dy*ry,S*.025,0,Math.PI*2);g.fill()})}
  else if(p.deco==='stripes'){g.lineWidth=S*.03;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(cx+i*rx*.45-rx,cy+ry);g.lineTo(cx+i*rx*.45+rx,cy-ry);g.stroke()}}
  else{[[-.35,-.05],[.3,-.35],[.25,.35],[-.15,.45]].forEach(([dx,dy])=>{const x=cx+dx*rx,y=cy+dy*ry,s=S*.055;g.beginPath();g.moveTo(x,y-s);g.quadraticCurveTo(x,y,x+s,y);g.quadraticCurveTo(x,y,x,y+s);g.quadraticCurveTo(x,y,x-s,y);g.quadraticCurveTo(x,y,x,y-s);g.fill()})}
  g.restore();
  g.lineWidth=Math.max(1,S*.02);g.strokeStyle=p.d;g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.stroke();
  g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.ellipse(cx-rx*.38,cy-ry*.45,rx*.22,ry*.16,-.5,0,Math.PI*2);g.fill()}
function makeSprite(t,S){
  const c=document.createElement('canvas');c.width=c.height=Math.max(8,Math.round(S));const g=c.getContext('2d');
  if(t===0)drawCookie(g,c.width);else if(t===1)drawRoll(g,c.width);else drawPop(g,c.width,POPS[t]);return c}

/* ---------- the game ---------- */
function mount(host,api){
  api=api||{};
  const store=api.store||{get(){return null},set(){}};
  const reduce=!!api.reduce;
  const sget=k=>{try{return store.get(k)}catch(e){return null}};
  const sset=(k,v)=>{try{store.set(k,v)}catch(e){}};
  host.classList.add('pdg','pdg-pop');
  host.innerHTML=
    '<div class="pp-hud">'+
      '<span>LEVEL<b class="pp-lv">1</b></span>'+
      '<span>SCORE<b class="pp-sc">0000</b></span>'+
      '<span class="pp-goal">LEFT<b><i class="pp-left">0</i><small class="pp-tgt">/10</small></b></span>'+
    '</div>'+
    '<div class="pp-stage"><canvas class="pp-cv" tabindex="0" aria-label="Sweet Pop board. Tap two or more matching treats that touch to pop them. Arrow keys move, Enter pops."></canvas>'+
      '<div class="pp-ov" role="dialog" aria-live="polite"></div></div>'+
    '<div class="pp-bar">'+
      '<button type="button" class="pp-btn ghost" data-act="undo">UNDO</button>'+
      '<button type="button" class="pp-btn ghost" data-act="restart">RESTART</button>'+
      '<button type="button" class="pp-btn ghost" data-act="pause">PAUSE</button>'+
    '</div>';
  const $=s=>host.querySelector(s);
  const cv=$('.pp-cv'),ctx=cv.getContext('2d'),ov=$('.pp-ov'),stage=$('.pp-stage');
  const elLv=$('.pp-lv'),elSc=$('.pp-sc'),elLeft=$('.pp-left'),elTgt=$('.pp-tgt'),elGoal=$('.pp-goal');
  const bUndo=$('[data-act="undo"]'),bRestart=$('[data-act="restart"]'),bPause=$('[data-act="pause"]');

  let best=parseInt(sget('pdg-pop-best'),10)||0;
  let unlocked=Math.min(5,Math.max(1,parseInt(sget('pdg-pop-unlocked'),10)||1));
  let lv=0,L=LV[0],cols=[],init=null,score=0,lvStart=0,undoSnap=null,undoLeft=1;
  let playing=false,paused=false,pendingEnd=false,dead=false;
  let cs=40,dpr=1,BW=0,BH=0,spr={};
  let hl=null,hlOk=false,downCell=null,kb=null,dying=[],parts=[],floats=[],banner=null,raf=0,last=0;

  const pad=n=>String(n).padStart(4,'0');
  const toTiles=(g,drop)=>g.map((col,c)=>col.map((t,r)=>({t,x:c,y:drop?r+L.r+1+c*.35+r*.18:r,vy:0})));
  const types=()=>cols.map(col=>col.map(o=>o.t));
  const left=()=>cols.reduce((s,col)=>s+col.length,0);

  function hud(){elLv.textContent=(lv+1)+'/5';elSc.textContent=pad(score);const n=left();elLeft.textContent=n;elTgt.textContent='/'+L.t;
    elGoal.classList.toggle('met',playing&&n<=L.t);
    bUndo.disabled=!playing||paused||!undoSnap||undoLeft<1;bRestart.disabled=!playing||paused;bPause.disabled=!playing||paused}

  function size(){
    const W=host.clientWidth;if(!W)return;
    const hudH=$('.pp-hud').offsetHeight,barH=$('.pp-bar').offsetHeight;
    const maxH=Math.min(window.innerHeight*.78,680)-hudH-barH-20;
    cs=Math.floor(Math.min((W-4)/L.c,Math.max(150,maxH)/L.r));cs=Math.max(22,Math.min(64,cs));
    dpr=Math.min(window.devicePixelRatio||1,2);BW=cs*L.c;BH=cs*L.r;
    cv.style.width=BW+'px';cv.style.height=BH+'px';cv.width=Math.round(BW*dpr);cv.height=Math.round(BH*dpr);
    stage.style.minHeight=Math.max(BH,300)+'px';
    for(let t=0;t<6;t++)spr[t]=makeSprite(t,cs*dpr);
    draw()}

  /* ---------- overlays ---------- */
  function showOv(html){ov.innerHTML=html;ov.hidden=false;hud();const b=ov.querySelector('button:not([disabled])');if(b)try{b.focus({preventScroll:true})}catch(e){}}
  function hideOv(){ov.hidden=true;ov.innerHTML='';hud()}
  const btn=(act,txt,cls,extra)=>'<button type="button" class="pp-btn '+(cls||'')+'" data-act="'+act+'" '+(extra||'')+'>'+txt+'</button>';
  function menu(){playing=false;paused=false;pendingEnd=false;hl=null;
    let lv5='';for(let i=0;i<5;i++)lv5+=btn('lv'+i,i<unlocked?String(i+1):'<span aria-hidden="true">✕</span>','lvl'+(i<unlocked?'':' locked'),(i<unlocked?'':'disabled ')+'aria-label="Level '+(i+1)+(i<unlocked?'':' locked')+'"');
    showOv('<h3 class="pp-t">Sweet Pop</h3><p class="pp-m">Tap 2 or more matching treats that touch to pop them. Leave only a few on the board to clear the level.</p>'+
      '<p class="pp-k">PICK A LEVEL</p><div class="pp-lvls">'+lv5+'</div><p class="pp-best">BEST '+pad(best)+'</p>')}
  function startLevel(i,keepScore){
    lv=i;L=LV[i];if(!keepScore)score=0;lvStart=score;
    init=genBoard(L);cols=toTiles(init,!reduce);undoSnap=null;undoLeft=1;dying=[];parts=[];floats=[];hl=null;kb=null;
    playing=true;paused=false;pendingEnd=false;hideOv();size();
    banner={t:0,a:'LEVEL '+(i+1),b:'LEAVE '+L.t+' OR FEWER'};kick();try{cv.focus({preventScroll:true})}catch(e){}}
  function restart(){if(!playing)return;score=lvStart;cols=toTiles(init,!reduce);undoSnap=null;undoLeft=1;dying=[];hl=null;pendingEnd=false;hideOv();
    banner={t:0,a:'LEVEL '+(lv+1),b:'LEAVE '+L.t+' OR FEWER'};kick()}
  function undo(){if(!undoSnap||undoLeft<1)return;cols=undoSnap.g.map((col,c)=>col.map((t,r)=>({t,x:c,y:r,vy:0})));score=undoSnap.score;undoSnap=null;undoLeft--;
    playing=true;paused=false;pendingEnd=false;hl=null;hideOv();kick()}
  function pause(){if(!playing||paused||!ov.hidden||pendingEnd)return;paused=true;hl=null;
    showOv('<h3 class="pp-t">PAUSED</h3><div class="pp-row">'+btn('resume','RESUME')+btn('menu','MENU','ghost')+'</div>')}
  function resume(){paused=false;hideOv();kick();try{cv.focus({preventScroll:true})}catch(e){}}
  function endLevel(){
    pendingEnd=false;const n=left();
    if(n<=L.t){
      const bonus=n===0?1000*(lv+1):(L.t-n+1)*50*(lv+1);score+=bonus;playing=false;
      if(lv+2>unlocked&&lv<4){unlocked=lv+2;sset('pdg-pop-unlocked',unlocked)}
      if(score>best){best=score;sset('pdg-pop-best',best)}
      const line=(n===0?'BOARD CLEARED!':n+' LEFT')+' · BONUS +'+bonus;
      if(lv===4){
        showOv('<h3 class="pp-t big">YOU BEAT SWEET POP!</h3><p class="pp-m">'+line+'</p><p class="pp-best">SCORE '+pad(score)+'</p><div class="pp-row">'+btn('lv0','PLAY AGAIN')+btn('menu','MENU','ghost')+'</div>');
        try{api.win&&api.win('pop',score)}catch(e){}
      }else showOv('<h3 class="pp-t">LEVEL '+(lv+1)+' CLEAR!</h3><p class="pp-m">'+line+'</p><p class="pp-best">SCORE '+pad(score)+'</p><div class="pp-row">'+btn('next','NEXT LEVEL')+btn('menu','MENU','ghost')+'</div>');
    }else{
      playing=false;
      showOv('<h3 class="pp-t">NO MOVES LEFT</h3><p class="pp-m">'+n+' left · needed '+L.t+' or fewer</p><div class="pp-row">'+
        (undoSnap&&undoLeft>0?btn('undo2','UNDO LAST POP'):'')+btn('retry','TRY AGAIN',undoSnap&&undoLeft>0?'ghost':'')+btn('menu','MENU','ghost')+'</div>')}
    hud()}

  /* ---------- popping ---------- */
  function groupAtCell(c,r){if(!cols[c]||!cols[c][r])return null;const g=groupOf(types(),c,r);return g}
  function setHl(c,r){const g=c==null?null:groupAtCell(c,r);hl=g&&g.length?g:null;hlOk=!!(hl&&hl.length>1);kick()}
  function popGroup(g){
    if(!g||g.length<2)return;
    undoSnap={g:types(),score};
    const n=g.length,gain=n*(n-1)*5;score+=gain;
    const rm=new Set(g.map(([c,r])=>cols[c][r]));
    let sx=0,sy=0;
    g.forEach(([c,r])=>{const o=cols[c][r];const px=(o.x+.5)*cs,py=(L.r-o.y-.5)*cs;sx+=px;sy+=py;
      dying.push({t:o.t,px,py,s:1});
      const k=reduce?2:Math.min(7,Math.max(3,Math.round(26/n)+2));const pal=SPARK[o.t];
      for(let i=0;i<k&&parts.length<260;i++){const a=Math.random()*Math.PI*2,v=cs*(2+Math.random()*4);
        parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v-cs*2,rot:Math.random()*6,vr:(Math.random()-.5)*14,c:pal[i%pal.length],life:1})}});
    floats.push({x:sx/n,y:sy/n,txt:'+'+gain,t:0,big:n>=8});
    cols=cols.map(col=>col.filter(o=>!rm.has(o))).filter(col=>col.length);
    hl=null;
    if(!hasMove(types()))pendingEnd=true;
    hud();kick()}

  /* ---------- input ---------- */
  function cellAt(e){const r=cv.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;
    const c=Math.floor(x/cs),row=L.r-1-Math.floor(y/cs);if(c<0||row<0||!cols[c]||!cols[c][row])return null;return [c,row]}
  const canPlay=()=>playing&&!paused&&ov.hidden&&!pendingEnd&&!busyFall();
  const onDown=e=>{if(!canPlay())return;e.preventDefault();kb=null;try{cv.setPointerCapture(e.pointerId)}catch(_){}
    const cell=cellAt(e);downCell=cell;if(cell)setHl(cell[0],cell[1]);else setHl()};
  const onMove=e=>{if(!playing||paused||!ov.hidden)return;
    if(downCell||e.pointerType==='mouse'){const cell=cellAt(e);
      if(downCell)downCell=cell;
      if(!cell){if(hl){hl=null;kick()}return}
      if(!hl||!hl.some(([c,r])=>c===cell[0]&&r===cell[1]))setHl(cell[0],cell[1])}};
  const onUp=e=>{try{cv.releasePointerCapture(e.pointerId)}catch(_){}
    const cell=downCell?cellAt(e):null;const was=downCell;downCell=null;
    if(!was||!canPlay()){if(e.pointerType!=='mouse'){hl=null;kick()}return}
    if(cell&&hl&&hlOk&&hl.some(([c,r])=>c===cell[0]&&r===cell[1]))popGroup(hl);
    else if(e.pointerType!=='mouse'){hl=null;kick()}};
  const onCancel=()=>{downCell=null;hl=null;kick()};
  const onLeave=e=>{if(e.pointerType==='mouse'&&!downCell){hl=null;kick()}};
  const onKey=e=>{
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(playing&&!paused&&ov.hidden){e.preventDefault();pause()}return}
    if(!canPlay())return;
    if(e.key==='u'||e.key==='U'){e.preventDefault();undo();return}
    if(e.key==='r'||e.key==='R'){e.preventDefault();restart();return}
    const mv={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];
    if(mv){e.preventDefault();if(!kb)kb=[0,0];kb=[Math.max(0,Math.min(cols.length-1,kb[0]+mv[0])),Math.max(0,kb[1]+mv[1])];
      kb[1]=Math.min(kb[1],(cols[kb[0]]||[]).length-1);if(kb[1]<0)kb[1]=0;setHl(kb[0],kb[1]);return}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!kb){kb=[0,0];setHl(0,0);return}
      if(hl&&hlOk)popGroup(hl);
      kb[0]=Math.min(kb[0],cols.length-1);if(kb[0]<0){kb=null;return}kb[1]=Math.min(kb[1],cols[kb[0]].length-1);setHl(kb[0],kb[1])}};
  const onOv=e=>{const b=e.target.closest('button[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;
    if(a.startsWith('lv'))startLevel(+a.slice(2));else if(a==='next')startLevel(lv+1,true);else if(a==='retry'){score=lvStart;startLevel(lv,true)}
    else if(a==='undo2')undo();else if(a==='menu')menu();else if(a==='resume')resume()};
  const onBar=e=>{const b=e.target.closest('button[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;
    if(a==='undo')undo();else if(a==='restart')restart();else if(a==='pause')pause()};
  const onVis=()=>{if(document.hidden)pause()};
  cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);
  cv.addEventListener('pointercancel',onCancel);cv.addEventListener('pointerleave',onLeave);cv.addEventListener('keydown',onKey);
  ov.addEventListener('click',onOv);$('.pp-bar').addEventListener('click',onBar);
  document.addEventListener('visibilitychange',onVis);
  let ro=null,io=null,rw=0;
  if('ResizeObserver' in window){ro=new ResizeObserver(es=>{const w=es[0].contentRect.width;if(w&&Math.abs(w-rw)>1){rw=w;size()}});ro.observe(host)}
  if('IntersectionObserver' in window){io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)pause()}),{threshold:.2});io.observe(cv)}

  /* ---------- animation ---------- */
  function busyFall(){for(let c=0;c<cols.length;c++)for(let r=0;r<cols[c].length;r++){const o=cols[c][r];if(o.y!==r||o.x!==c)return true}return false}
  function update(dt){
    for(let c=0;c<cols.length;c++)for(let r=0;r<cols[c].length;r++){const o=cols[c][r];
      if(o.y>r){o.vy+=46*dt;o.y-=o.vy*dt;if(o.y<=r){o.y=r;o.vy=0}}else{o.y=r;o.vy=0}
      if(o.x!==c){o.x+=(c-o.x)*Math.min(1,dt*13);if(Math.abs(o.x-c)<.004)o.x=c}}
    dying.forEach(d=>d.s-=dt*5.5);dying=dying.filter(d=>d.s>0);
    parts.forEach(p=>{p.vy+=cs*16*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.life-=dt*1.3});parts=parts.filter(p=>p.life>0&&p.y<BH+cs);
    floats.forEach(f=>f.t+=dt*1.25);floats=floats.filter(f=>f.t<1);
    if(banner){if(!banner.s)banner.s=performance.now();banner.t=(performance.now()-banner.s)/1000;if(banner.t>1.7)banner=null}
    if(pendingEnd&&!busyFall()&&!dying.length){if(!pendingEnd.t)pendingEnd={t:performance.now()};else if(performance.now()-pendingEnd.t>420)endLevel()}}
  function draw(){
    if(!BW)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,BW,BH);
    const bg=ctx.createLinearGradient(0,0,0,BH);bg.addColorStop(0,'#1d1038');bg.addColorStop(1,'#140b26');ctx.fillStyle=bg;rr(0,ctx,0,0,BW,BH,14);ctx.fill();
    ctx.fillStyle='rgba(42,22,80,.55)';
    for(let c=0;c<L.c;c++)for(let r=0;r<L.r;r++){rr(0,ctx,c*cs+2,r*cs+2,cs-4,cs-4,cs*.22);ctx.fill()}
    const now=performance.now();
    const hs=hl?new Set(hl.map(([c,r])=>c+','+r)):null;
    const pulse=reduce?0:Math.sin(now/130)*.05;
    for(let c=0;c<cols.length;c++)for(let r=0;r<cols[c].length;r++){const o=cols[c][r];const X=o.x*cs,Y=(L.r-1-o.y)*cs;
      if(Y<-cs)continue;
      const on=hs&&hs.has(c+','+r);
      if(on){ctx.save();ctx.fillStyle=hlOk?'rgba(63,240,255,.22)':'rgba(255,79,168,.18)';ctx.shadowColor=hlOk?'#3ff0ff':'#ff4fa8';ctx.shadowBlur=cs*.35;
        rr(0,ctx,X+2,Y+2,cs-4,cs-4,cs*.22);ctx.fill();ctx.restore();
        ctx.strokeStyle=hlOk?'rgba(255,255,255,.9)':'rgba(255,79,168,.8)';ctx.lineWidth=2;rr(0,ctx,X+2.5,Y+2.5,cs-5,cs-5,cs*.22);ctx.stroke()}
      const s=on&&hlOk?1.04+pulse:1;const d=cs*s;
      ctx.drawImage(spr[o.t],X+(cs-d)/2,Y+(cs-d)/2,d,d)}
    dying.forEach(dd=>{const d=cs*(1+(1-dd.s)*.35)*dd.s;ctx.globalAlpha=Math.max(0,dd.s);ctx.drawImage(spr[dd.t],dd.px-d/2,dd.py-d/2,d,d)});ctx.globalAlpha=1;
    parts.forEach(p=>{ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,p.life*1.5));ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;rr(0,ctx,-cs*.07,-cs*.025,cs*.14,cs*.05,cs*.025);ctx.fill();ctx.restore()});
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(hl&&hlOk){const n=hl.length;let sx=0,sy=0;hl.forEach(([c,r])=>{sx+=c;sy+=r});const X=(sx/n+.5)*cs,Y=(L.r-sy/n-.5)*cs;
      const txt='+'+(n*(n-1)*5);ctx.font='700 '+Math.round(cs*.36)+'px Silkscreen,monospace';const w=ctx.measureText(txt).width+cs*.4;
      ctx.fillStyle='rgba(13,7,25,.85)';rr(0,ctx,X-w/2,Y-cs*.28,w,cs*.56,cs*.28);ctx.fill();ctx.strokeStyle='#3ff0ff';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#ffffff';ctx.fillText(txt,X,Y+1)}
    floats.forEach(f=>{ctx.globalAlpha=Math.max(0,1-f.t);ctx.font='700 '+Math.round(cs*(f.big?.6:.45))+'px Silkscreen,monospace';
      ctx.lineWidth=4;ctx.strokeStyle='#140b26';ctx.strokeText(f.txt,f.x,f.y-f.t*cs*1.2);ctx.fillStyle=f.big?'#9dff4f':'#ffd6ec';ctx.fillText(f.txt,f.x,f.y-f.t*cs*1.2)});ctx.globalAlpha=1;
    if(kb&&cols[kb[0]]&&cols[kb[0]][kb[1]]){const X=kb[0]*cs,Y=(L.r-1-kb[1])*cs;ctx.setLineDash([5,4]);ctx.strokeStyle='#9dff4f';ctx.lineWidth=2;rr(0,ctx,X+1,Y+1,cs-2,cs-2,cs*.25);ctx.stroke();ctx.setLineDash([])}
    if(banner){const t=banner.t,a=t<.25?t/.25:t>1.35?Math.max(0,(1.7-t)/.35):1;ctx.globalAlpha=a;
      ctx.fillStyle='rgba(13,7,25,.82)';ctx.fillRect(0,BH/2-cs*.95,BW,cs*1.9);
      ctx.fillStyle='#ff4fa8';ctx.fillRect(0,BH/2-cs*.95,BW,3);ctx.fillRect(0,BH/2+cs*.95-3,BW,3);
      ctx.font='700 '+Math.round(Math.min(cs*.62,BW/9))+'px Silkscreen,monospace';ctx.fillStyle='#ffffff';ctx.fillText(banner.a,BW/2,BH/2-cs*.28);
      ctx.font=Math.round(Math.min(cs*.5,BW/13))+'px VT323,monospace';ctx.fillStyle='#3ff0ff';ctx.fillText(banner.b,BW/2,BH/2+cs*.38);ctx.globalAlpha=1}
    if(!playing&&!ov.hidden){ctx.fillStyle='rgba(13,7,25,.25)';ctx.fillRect(0,0,BW,BH)}}
  const busy=()=>!dead&&(busyFall()||dying.length||parts.length||floats.length||banner||(hl&&hlOk&&!reduce)||pendingEnd);
  function loop(t){raf=0;if(dead)return;const dt=Math.min(.05,Math.max(0,(t-last)/1000));last=t;update(dt);draw();if(busy())raf=requestAnimationFrame(loop);else draw()}
  function kick(){if(dead)return;if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}}

  /* start on the menu with a sample board behind it */
  L=LV[0];cols=toTiles(rawBoard(L,.35),false);hud();
  requestAnimationFrame(()=>{size();menu()});

  return {
    pause,
    destroy(){dead=true;cancelAnimationFrame(raf);raf=0;
      cv.removeEventListener('pointerdown',onDown);cv.removeEventListener('pointermove',onMove);cv.removeEventListener('pointerup',onUp);
      cv.removeEventListener('pointercancel',onCancel);cv.removeEventListener('pointerleave',onLeave);cv.removeEventListener('keydown',onKey);
      ov.removeEventListener('click',onOv);document.removeEventListener('visibilitychange',onVis);
      if(ro)ro.disconnect();if(io)io.disconnect();host.innerHTML='';host.classList.remove('pdg-pop')}
  };
}

window.PDGames=window.PDGames||{};
window.PDGames.pop={id:'pop',title:'Sweet Pop',blurb:'Tap 2 or more matching treats to pop them.',mount};
})();
