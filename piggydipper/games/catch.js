/* Catch the Treats — Piggy Dipper arcade game (id: catch) */
(function(){
  'use strict';

  /* ---------- pixel sprites: one letter per pixel, '.' is empty ---------- */
  const POP_MAP=[
    '..MMM..',
    '.MHMMM.',
    'MHMMSMM',
    'MMMMMMM',
    'MSMMMTM',
    'MMMMMMM',
    'MMTMMSM',
    '.MMMMM.',
    '..MMM..',
    '...w...',
    '...w...',
    '...w...',
    '...w...'];
  const POP_COLS=[
    {M:'#ff4fa8',H:'#ffd6ec',S:'#3ff0ff',T:'#9dff4f'},
    {M:'#3ff0ff',H:'#e0fdff',S:'#ff4fa8',T:'#b48cff'},
    {M:'#b48cff',H:'#efe4ff',S:'#9dff4f',T:'#ffffff'},
    {M:'#9dff4f',H:'#eaffd6',S:'#ff4fa8',T:'#3ff0ff'},
    {M:'#f4ecff',H:'#ffffff',S:'#ff4fa8',T:'#3ff0ff'}];
  const SPR={
    cookie:{pal:{C:'#ffe1f0',c:'#ffb8da',b:'#3ff0ff',g:'#9dff4f',p:'#ff4fa8',l:'#b48cff'},map:[
      '..CCCC..','.CCcCCC.','CCpCCbCC','CgCCcCCC','CCCbCClC','CcCCCgCC','.CClCpC.','..CCCC..']},
    roll:{pal:{I:'#ffffff',l:'#b48cff',d:'#7d52d6'},map:[
      '..lllll..','.lIIIIIl.','lIlllllIl','lIlIIIlId','lIlIlIlId','lIlIllIId','lIllIIIld','.lIIIIld.','..ldddd..']},
    pig:{pal:{P:'#ff9ccf',p:'#ff6fb7',K:'#140b26',n:'#ff4fa8',k:'#7a1450',W:'#ffffff'},map:[
      '.pp......pp.','.pPp....pPp.','PPPPPPPPPPPP','PPWKPPPPWKPP','PPKKPPPPKKPP','PPPPnnnnPPPP','PpPPnknkPPpP','PPPPnnnnPPPP','.PPPPPPPPPP.','..pPPPPPPp..']},
    bomb:{pal:{K:'#ff4fa8',B:'#2a1650',D:'#1d1038',W:'#ffd6ec',f:'#b48cff'},map:[
      '.....f..','....f...','..KKKK..','.KBBBBK.','KBWBBBDK','KBBBDBBK','KBDBBBDK','KBBBBBBK','.KBBDBK.','..KKKK..']},
    pin:{pal:{V:'#b48cff',v:'#7d52d6',W:'#f4ecff',l:'#d8c8ff'},map:[
      '..WWWWWWWW..','VvWWWWWWWWvV','VvllllllllvV','..llllllll..']},
    wide:{pal:{B:'#3ff0ff',F:'#1d1038',X:'#9dff4f'},map:[
      'BBBBBBBBB','BFFFFFFFB','BFXFFFXFB','BXXFFFXXB','BXXXXXXXB','BXXFFFXXB','BFXFFFXFB','BFFFFFFFB','BBBBBBBBB']},
    slow:{pal:{B:'#3ff0ff',F:'#1d1038',X:'#9dff4f'},map:[
      'BBBBBBBBB','BFFXXXFFB','BFXFXFXFB','BXFFXFFXB','BXFFXXFXB','BXFFFFFXB','BFXFFFXFB','BFFXXXFFB','BBBBBBBBB']},
    magnet:{pal:{B:'#3ff0ff',F:'#1d1038',X:'#9dff4f',R:'#ff4fa8'},map:[
      'BBBBBBBBB','BRRFFFRRB','BXXFFFXXB','BXXFFFXXB','BXXFFFXXB','BXXFFFXXB','BFXXFXXFB','BFFXXXFFB','BBBBBBBBB']},
    heart:{pal:{H:'#ff4fa8',h:'#ffd6ec'},map:[
      '.HH.HH.','HhHHHHH','HHHHHHH','HHHHHHH','.HHHHH.','..HHH..','...H...']},
    hearto:{pal:{H:'#4a2a7a'},map:[
      '.HH.HH.','HHHHHHH','HHHHHHH','HHHHHHH','.HHHHH.','..HHH..','...H...']}
  };
  POP_COLS.forEach((c,i)=>{SPR['pop'+i]={pal:Object.assign({w:'#ffffff'},c),map:POP_MAP}});

  function sprite(name,s){const sp=SPR[name],h=sp.map.length,w=sp.map[0].length;const c=document.createElement('canvas');c.width=w*s;c.height=h*s;const x=c.getContext('2d');
    sp.map.forEach((row,j)=>{for(let i=0;i<row.length;i++){const col=sp.pal[row[i]];if(col){x.fillStyle=col;x.fillRect(i*s,j*s,s,s)}}});return c}

  /* ---------- levels ---------- */
  const LV=[
    {goal:20, time:40,v:1.0, gap:.85,hz:0,  haz:[],             pw:['wide'],                wob:0,   rainbow:false,
      intro:['CATCH 20 POINTS','IN 40 SECONDS'],nw:'NEW: WIDE PIG POWER-UP'},
    {goal:35, time:40,v:1.2, gap:.72,hz:.12,haz:['bomb'],       pw:['wide','slow'],         wob:0,   rainbow:false,
      intro:['CATCH 35 POINTS','IN 40 SECONDS'],nw:'NEW: SPRINKLE BOMBS + SLOW-MO'},
    {goal:55, time:45,v:1.4, gap:.62,hz:.16,haz:['bomb','pin'], pw:['wide','slow','magnet'],wob:.15, rainbow:false,
      intro:['CATCH 55 POINTS','IN 45 SECONDS'],nw:'NEW: ROLLING PINS + MAGNET'},
    {goal:80, time:45,v:1.65,gap:.54,hz:.2, haz:['bomb','pin'], pw:['wide','slow','magnet'],wob:.35, rainbow:false,
      intro:['CATCH 80 POINTS','IN 45 SECONDS'],nw:'TREATS WOBBLE. FASTER!'},
    {goal:110,time:50,v:1.9, gap:.46,hz:.24,haz:['bomb','pin'], pw:['wide','slow','magnet'],wob:.45, rainbow:true,
      intro:['CATCH 110 POINTS','IN 50 SECONDS'],nw:'RAINBOW POPS = 5 POINTS!'}
  ];
  const PW={wide:{d:8,t:'WIDE PIG!',s:'WIDE'},slow:{d:6,t:'SLOW-MO!',s:'SLOW'},magnet:{d:8,t:'MAGNET!',s:'MAGNET'}};
  const FX_COL={pop:'#ff4fa8',cookie:'#9dff4f',roll:'#3ff0ff',rainbow:'#ffffff'};

  function mount(host,api){
    api=api||{};
    const reduce=!!api.reduce;
    const store=api.store||{get(){return null},set(){}};
    host.classList.add('pdg','pdg-catch');
    host.innerHTML=
      '<div class="pdgc">'+
        '<div class="pdgc-hud">'+
          '<span class="pdgc-k">LVL<b data-h="lvl">1</b></span>'+
          '<span class="pdgc-k">GOAL<b data-h="goal">0/20</b></span>'+
          '<span class="pdgc-k">TIME<b data-h="time">40</b></span>'+
          '<span class="pdgc-hearts" data-h="hearts" role="img" aria-label="3 hearts"></span>'+
          '<button type="button" class="pdgc-pause" aria-label="Pause">II</button>'+
        '</div>'+
        '<div class="pdgc-screen">'+
          '<canvas tabindex="0" aria-label="Catch the Treats. Move the pig with your finger, your mouse or the arrow keys."></canvas>'+
          '<div class="pdgc-over" aria-live="polite"></div>'+
        '</div>'+
        '<p class="pdgc-help">DRAG or ◀ ▶ to move · P to pause</p>'+
      '</div>';
    const $=s=>host.querySelector(s);
    const cv=$('canvas'),scr=$('.pdgc-screen'),ov=$('.pdgc-over'),pbtn=$('.pdgc-pause');
    const hL=$('[data-h="lvl"]'),hG=$('[data-h="goal"]'),hT=$('[data-h="time"]'),hH=$('[data-h="hearts"]');
    const ctx=cv.getContext('2d');

    /* icons for overlays and hearts (fixed size) */
    const icon={};['pop0','pop1','pop3','cookie','roll','bomb','pin','wide','slow','magnet','heart','hearto'].forEach(n=>{try{icon[n]=sprite(n,3).toDataURL()}catch(e){icon[n]=''}});

    let W=0,H=0,px=4,spr={},raf=0,last=0,stars=[],tNow=0;
    let running=false,paused=false,destroyed=false,lvl=0,cfg=LV[0];
    let total=0,totalAtStart=0,lsc=0,time=0,hearts=3,combo=0,mult=1,items=[],fx=[],spawnT=0,powT=0,shake=0,flash=0,won=false;
    const pow={wide:0,slow:0,magnet:0};
    const pig={x:0,w:0,h:0,tx:null};const keys={l:false,r:false};let drag=false;

    const getN=(k,d)=>{const v=parseInt(store.get(k),10);return isNaN(v)?d:v};
    let unlocked=Math.min(5,Math.max(1,getN('pdg-catch-unlocked',1)));
    let best=getN('pdg-catch-best',0);

    /* ---------- HUD ---------- */
    function hud(){
      hL.textContent=String(lvl+1);
      hG.textContent=Math.min(lsc,cfg.goal)+'/'+cfg.goal;
      hT.textContent=String(Math.max(0,Math.ceil(time))).padStart(2,'0');
      let h='';for(let i=0;i<3;i++)h+='<img alt="" src="'+(i<hearts?icon.heart:icon.hearto)+'">';
      if(hH.dataset.n!==String(hearts)){hH.innerHTML=h;hH.dataset.n=String(hearts);hH.setAttribute('aria-label',hearts+(hearts===1?' heart':' hearts'))}
      hT.classList.toggle('pdgc-low',running&&time<=10);
    }

    /* ---------- sizing ---------- */
    function size(){
      const r=scr.getBoundingClientRect();if(!r.width||!r.height)return;
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const sx=W?r.width/W:1,sy=H?r.height/H:1;W=r.width;H=r.height;
      cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
      px=Math.max(3,Math.round(W/90));
      Object.keys(SPR).forEach(n=>{if(n!=='heart'&&n!=='hearto')spr[n]=sprite(n,px)});
      pig.w=spr.pig.width;pig.h=spr.pig.height;
      pig.x=pig.x?pig.x*sx:W/2;items.forEach(it=>{it.x*=sx;it.x0*=sx;it.y*=sy});clampPig();
      stars=[];for(let i=0;i<46;i++)stars.push([Math.random()*W,Math.random()*(H-px*8),Math.random()<.35]);
      draw();
    }
    const pigW=()=>pig.w*(pow.wide>0?1.7:1);
    function clampPig(){const hw=pigW()/2;pig.x=Math.min(Math.max(pig.x,hw),W-hw)}
    const floorY=()=>H-px*4;

    /* ---------- drawing ---------- */
    function txt(s,x,y,size,col,align){ctx.font=size+'px "Press Start 2P",monospace';ctx.textAlign=align||'left';ctx.textBaseline='top';
      ctx.fillStyle='#0d0719';ctx.fillText(s,x+Math.max(1,size/8),y+Math.max(1,size/8));ctx.fillStyle=col;ctx.fillText(s,x,y)}
    function itemSprite(it){
      if(it.k==='pop')return spr['pop'+it.c];
      if(it.k==='rainbow')return spr['pop'+((tNow*10|0)%5)];
      return spr[it.k];
    }
    function draw(){
      if(!W)return;
      ctx.save();
      if(shake>0&&!reduce){ctx.translate(Math.round((Math.random()-.5)*px*2),Math.round((Math.random()-.5)*px*2))}
      ctx.fillStyle='#0d0719';ctx.fillRect(-px*2,-px*2,W+px*4,H+px*4);
      const blink=(performance.now()/500|0)%2,sq=Math.max(2,Math.round(px*.6));
      stars.forEach((s,i)=>{if(s[2]&&blink&&i%2)return;ctx.fillStyle=i%5===0?'#3ff0ff':i%3===0?'#ff4fa8':'#b48cff';ctx.fillRect(Math.round(s[0]),Math.round(s[1]),sq,sq)});
      const fy=floorY();ctx.fillStyle='#2a1650';ctx.fillRect(0,fy,W,H-fy);
      for(let x=0;x<W;x+=px*4){ctx.fillStyle=((x/(px*4))|0)%2?'#ff4fa8':'#7a2a8a';ctx.fillRect(x,fy,px*4,px)}
      /* items */
      items.forEach(it=>{const s=itemSprite(it);if(!s)return;
        if(it.k==='pin'){ctx.save();ctx.translate(Math.round(it.x),Math.round(it.y+s.height/2));ctx.rotate(it.rot);ctx.drawImage(s,-s.width/2,-s.height/2);ctx.restore();return}
        const dx=Math.round(it.x-s.width/2),dy=Math.round(it.y);
        if(it.pw){ctx.globalAlpha=.55+.45*Math.abs(Math.sin(tNow*6));ctx.fillStyle='#3ff0ff';ctx.fillRect(dx-px,dy-px,s.width+px*2,s.height+px*2);ctx.globalAlpha=1}
        ctx.drawImage(s,dx,dy);
        if(it.k==='bomb'){const on=(tNow*12|0)%2;ctx.fillStyle=on?'#9dff4f':'#ffffff';ctx.fillRect(dx+px*6,dy-px,px,px);if(on){ctx.fillStyle='#3ff0ff';ctx.fillRect(dx+px*7,dy-px*2,px,px)}}
        if(it.k==='rainbow'&&!reduce){ctx.fillStyle=((tNow*8|0)%2)?'#ffffff':'#3ff0ff';ctx.fillRect(dx-px*2,dy+px*2,px,px);ctx.fillRect(dx+s.width+px,dy+px*5,px,px)}
      });
      /* magnet aura */
      const pw=pigW();
      if(pow.magnet>0){ctx.fillStyle='#3ff0ff';const n=6;for(let i=0;i<n;i++){const a=(tNow*3+i/n*Math.PI)%Math.PI;const rx=pw*.75,ry=pig.h*1.2;ctx.globalAlpha=.6;ctx.fillRect(Math.round(pig.x-Math.cos(a)*rx),Math.round(fy-pig.h*.5-Math.sin(a)*ry),px,px)}ctx.globalAlpha=1}
      ctx.drawImage(spr.pig,Math.round(pig.x-pw/2),Math.round(fy-pig.h),Math.round(pw),pig.h);
      if(pow.slow>0){ctx.globalAlpha=.12;ctx.fillStyle='#b48cff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
      /* canvas HUD: combo + power timers */
      const fs=Math.max(8,Math.round(px*2.2));
      if(running&&mult>1)txt('COMBO x'+mult,px*2,px*2,fs,mult>=5?'#9dff4f':'#ffd6ec');
      if(running){let y=px*2;['wide','slow','magnet'].forEach(k=>{if(pow[k]>0){txt(PW[k].s+' '+Math.ceil(pow[k]),W-px*2,y,fs,'#3ff0ff','right');y+=fs+px}})}
      /* floating text */
      fx.forEach(p=>{ctx.globalAlpha=Math.max(0,1-p.t);txt(p.s,p.x,p.y-p.t*px*9,p.big?fs+px:fs,p.c,'center')});ctx.globalAlpha=1;
      if(flash>0){ctx.globalAlpha=Math.min(.45,flash*2)*(reduce?.4:1);ctx.fillStyle='#ff4fa8';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
      ctx.restore();
    }

    /* ---------- spawning ---------- */
    function spawnItem(){
      let it;const r=Math.random();
      if(cfg.haz.length&&r<cfg.hz){
        const k=cfg.haz[Math.random()*cfg.haz.length|0];
        it={k,bad:true,v:H*(.3+Math.random()*.14)*cfg.v};
        if(k==='pin'){it.rot=Math.random()*6;it.spin=(Math.random()<.5?-1:1)*(4+Math.random()*4);it.vx=(Math.random()<.5?-1:1)*W*(.12+Math.random()*.18)}
      }else{
        let k;const q=Math.random();
        if(cfg.rainbow&&q<.07)k='rainbow';else{const q2=Math.random();k=q2<.5?'pop':q2<.82?'cookie':'roll'}
        it={k,c:Math.random()*5|0,v:H*(.26+Math.random()*.14)*cfg.v};
        if(cfg.wob&&Math.random()<cfg.wob){it.wa=px*(3+Math.random()*6);it.wf=2+Math.random()*2.5;it.ph=Math.random()*6}
      }
      place(it);
    }
    function spawnPower(){const k=cfg.pw[Math.random()*cfg.pw.length|0];place({k,pw:true,v:H*.24*cfg.v})}
    function place(it){const s=it.k==='pop'||it.k==='rainbow'?spr.pop0:spr[it.k];const hw=s.width/2+px;
      it.x=it.x0=hw+Math.random()*Math.max(1,W-hw*2);it.y=-s.height;it.w=s.width;it.h=s.height;items.push(it)}

    /* ---------- game step ---------- */
    function addFx(s,x,y,c,big){fx.push({s,x:Math.min(Math.max(x,px*10),W-px*10),y,c,t:0,big:!!big})}
    function catchIt(it){
      const top=floorY()-pig.h;
      if(it.pw){pow[it.k]=PW[it.k].d;addFx(PW[it.k].t,it.x,top-px*4,'#3ff0ff',true);clampPig();return}
      if(it.bad){hearts--;combo=0;mult=1;shake=.3;flash=.3;addFx('OUCH!',it.x,top-px*4,'#ff4fa8',true);hud();if(hearts<=0)fail('OUT OF HEARTS');return}
      combo++;const nm=Math.min(5,1+Math.floor(combo/5));
      if(nm>mult)addFx('COMBO x'+nm,pig.x,top-px*12,'#9dff4f',true);
      mult=nm;
      const base=it.k==='rainbow'?5:it.k==='roll'?2:1;const pts=base*mult;
      lsc+=pts;total+=pts;addFx('+'+pts,it.x,top,FX_COL[it.k]||'#ffd6ec');
      if(lsc>=cfg.goal)levelClear();
    }
    function step(dt){
      tNow+=dt;time-=dt;
      Object.keys(pow).forEach(k=>{if(pow[k]>0){pow[k]=Math.max(0,pow[k]-dt);if(k==='wide'&&!pow[k])clampPig()}});
      if(shake>0)shake-=dt;if(flash>0)flash-=dt;
      if(time<=0){time=0;hud();fail('TIME UP');return}
      spawnT-=dt;if(spawnT<=0){spawnT=cfg.gap*(.75+Math.random()*.5);spawnItem()}
      if(cfg.pw.length){powT-=dt;if(powT<=0){powT=9+Math.random()*5;spawnPower()}}
      if(keys.l||keys.r){pig.tx=null;pig.x+=((keys.r?1:0)-(keys.l?1:0))*W*1.1*dt}else if(pig.tx!=null){pig.x+=(pig.tx-pig.x)*Math.min(1,dt*16)}
      clampPig();
      const sf=pow.slow>0?.5:1,fy=floorY(),top=fy-pig.h,pw=pigW(),l=pig.x-pw/2-px,r=pig.x+pw/2+px;
      for(let i=items.length-1;i>=0;i--){
        const it=items[i];if(!running)break;
        it.y+=it.v*dt*sf;
        if(it.wa){it.x=it.x0+Math.sin(tNow*it.wf+it.ph)*it.wa}
        if(it.k==='pin'){it.rot+=it.spin*dt*sf;it.x+=it.vx*dt*sf;it.x0=it.x;if(it.x<it.w/2){it.x=it.w/2;it.vx=Math.abs(it.vx)}if(it.x>W-it.w/2){it.x=W-it.w/2;it.vx=-Math.abs(it.vx)}}
        if(pow.magnet>0&&!it.bad&&!it.pw&&it.y>H*.2){const nx=it.x+(pig.x-it.x)*Math.min(1,dt*3.2);if(it.wa)it.x0+=nx-it.x;it.x=nx}
        const bot=it.y+it.h,hw=it.k==='pin'?it.w*.4:it.w*.35;
        if(bot>=top+px*2&&it.y<top+pig.h*.6&&it.x+hw>l&&it.x-hw<r){items.splice(i,1);catchIt(it);continue}
        if(it.y>H){items.splice(i,1);if(!it.bad&&!it.pw&&running){if(combo>=5)addFx('MISS',it.x,fy-px*6,'#b48cff');combo=0;mult=1}}
      }
      fx.forEach(p=>p.t+=dt*1.6);fx=fx.filter(p=>p.t<1);
      if(running)hud();
    }
    function loop(t){raf=0;if(!running||paused||destroyed)return;const dt=Math.min(.05,Math.max(0,(t-last)/1000));last=t;step(dt);draw();if(running&&!paused)raf=requestAnimationFrame(loop)}
    function idleLoop(){raf=0;if(running||destroyed)return;tNow+=.016;draw();if(!reduce)raf=requestAnimationFrame(idleLoop)}
    function startIdle(){cancelAnimationFrame(raf);raf=0;if(!reduce)raf=requestAnimationFrame(idleLoop);else draw()}

    /* ---------- overlays ---------- */
    function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
    function over(o){
      let h='';
      if(o.title)h+='<p class="pdgc-t">'+esc(o.title)+'</p>';
      (o.lines||[]).forEach(l=>h+='<p class="pdgc-m">'+esc(l)+'</p>');
      if(o.nw)h+='<p class="pdgc-new">'+esc(o.nw)+'</p>';
      if(o.legend){
        h+='<div class="pdgc-leg">'+
          '<div><span>CATCH</span><img alt="Cake Pops" src="'+icon.pop0+'"><img alt="" src="'+icon.pop1+'"><img alt="Cookies" src="'+icon.cookie+'"><img alt="Cinnamon Rolls" src="'+icon.roll+'"></div>'+
          '<div><span>DODGE</span><img alt="Sprinkle bomb" src="'+icon.bomb+'"><img alt="Rolling pin" src="'+icon.pin+'"></div>'+
          '<div><span>GRAB</span><img alt="Wide pig" src="'+icon.wide+'"><img alt="Slow-mo" src="'+icon.slow+'"><img alt="Magnet" src="'+icon.magnet+'"></div>'+
        '</div>';
      }
      if(o.picker){
        h+='<p class="pdgc-m pdgc-pick-l">PICK A LEVEL</p><div class="pdgc-pick">';
        for(let i=0;i<5;i++){const lock=i>=unlocked;h+='<button type="button" data-lv="'+i+'"'+(lock?' disabled aria-label="Level '+(i+1)+' locked"':' aria-label="Level '+(i+1)+'"')+'>'+(lock?'<i aria-hidden="true">■</i>':(i+1))+'</button>'}
        h+='</div>';
        if(best)h+='<p class="pdgc-m pdgc-best">BEST '+best+'</p>';
      }
      if(o.buttons&&o.buttons.length){h+='<div class="pdgc-btns">';o.buttons.forEach((b,i)=>h+='<button type="button" class="pdgc-b'+(b.ghost?' pdgc-ghost':'')+'" data-b="'+i+'">'+esc(b.label)+'</button>');h+='</div>'}
      ov.innerHTML=h;ov.hidden=false;ov.className='pdgc-over'+(o.cls?' '+o.cls:'');
      ov.querySelectorAll('[data-b]').forEach(el=>el.addEventListener('click',()=>o.buttons[+el.dataset.b].fn()));
      ov.querySelectorAll('[data-lv]').forEach(el=>el.addEventListener('click',()=>{if(!el.disabled){total=0;startLevel(+el.dataset.lv)}}));
      const f=ov.querySelector('.pdgc-b:not(.pdgc-ghost)')||ov.querySelector('[data-lv]:not([disabled])');
      if(f&&o.focus!==false){try{f.focus({preventScroll:true})}catch(e){}}
      pbtn.hidden=!running;
    }
    function menu(){
      running=false;paused=false;items=[];fx=[];resetPow();lvl=Math.min(unlocked-1,4);cfg=LV[lvl];lsc=0;time=cfg.time;hearts=3;combo=0;mult=1;hud();
      over({title:'CATCH THE TREATS',legend:true,picker:true,focus:false});startIdle();
    }
    function resetPow(){pow.wide=pow.slow=pow.magnet=0}
    function startLevel(i){
      lvl=i;cfg=LV[i];totalAtStart=total;lsc=0;time=cfg.time;hearts=3;combo=0;mult=1;items=[];fx=[];resetPow();spawnT=.4;powT=4+Math.random()*3;
      running=false;paused=false;hud();
      over({title:'LEVEL '+(i+1),lines:cfg.intro,nw:cfg.nw,buttons:[{label:'GO!',fn:begin}]});startIdle();
    }
    function begin(){
      size();running=true;paused=false;keys.l=keys.r=false;ov.hidden=true;pbtn.hidden=false;hud();
      last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);try{cv.focus({preventScroll:true})}catch(e){}
    }
    function saveBest(){if(total>best){best=total;store.set('pdg-catch-best',String(best));return true}return false}
    function stopRun(){running=false;paused=false;cancelAnimationFrame(raf);raf=0;keys.l=keys.r=false;drag=false;items=[];resetPow();hud();draw()}
    function levelClear(){
      const bonus=Math.ceil(time);total+=bonus;stopRun();
      if(lvl+2>unlocked&&lvl<4){unlocked=lvl+2;store.set('pdg-catch-unlocked',String(unlocked))}
      const nb=saveBest();
      if(lvl===4){
        over({title:'YOU BEAT ALL 5 LEVELS!',cls:'pdgc-win',lines:['SCORE '+total,'TIME BONUS +'+bonus].concat(nb?['NEW BEST!']:[]),buttons:[{label:'PLAY AGAIN',fn:menu}]});
        if(!won){won=true;try{api.win&&api.win('catch',total)}catch(e){}}
        startIdle();return;
      }
      over({title:'LEVEL '+(lvl+1)+' CLEAR!',lines:['TIME BONUS +'+bonus,'SCORE '+total],buttons:[{label:'NEXT LEVEL',fn:()=>startLevel(lvl+1)},{label:'MENU',ghost:true,fn:menu}]});
      startIdle();
    }
    function fail(why){
      stopRun();const nb=saveBest();
      over({title:why,lines:['LEVEL '+(lvl+1),'SCORE '+total].concat(nb?['NEW BEST!']:[]),buttons:[{label:'TRY AGAIN',fn:()=>{total=totalAtStart;startLevel(lvl)}},{label:'MENU',ghost:true,fn:menu}]});
      startIdle();
    }
    function pause(){if(!running||paused)return;paused=true;cancelAnimationFrame(raf);raf=0;keys.l=keys.r=false;drag=false;
      over({title:'PAUSED',lines:['LEVEL '+(lvl+1)+' · '+Math.min(lsc,cfg.goal)+'/'+cfg.goal],buttons:[{label:'RESUME',fn:resume},{label:'QUIT',ghost:true,fn:menu}]});pbtn.hidden=true}
    function resume(){if(!running||!paused)return;paused=false;ov.hidden=true;pbtn.hidden=false;last=performance.now();raf=requestAnimationFrame(loop);try{cv.focus({preventScroll:true})}catch(e){}}

    /* ---------- input ---------- */
    const aim=e=>{const r=cv.getBoundingClientRect();pig.tx=Math.min(Math.max(e.clientX-r.left,0),r.width)};
    const onDown=e=>{if(!running||paused)return;drag=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}aim(e);e.preventDefault()};
    const onMove=e=>{if(!running||paused)return;if(drag||e.pointerType==='mouse')aim(e)};
    const onUp=e=>{drag=false;try{cv.releasePointerCapture(e.pointerId)}catch(_){}};
    const K={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r'};
    const onKey=e=>{
      if(destroyed||!running)return;
      if(e.type==='keydown'&&(e.key==='p'||e.key==='P'||e.key==='Escape')){e.preventDefault();paused?resume():pause();return}
      if(paused)return;const k=K[e.key];if(!k)return;e.preventDefault();keys[k]=e.type==='keydown';
    };
    const onVis=()=>{if(document.hidden)pause()};
    const onPause=()=>pause();
    cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',onUp);
    pbtn.addEventListener('click',onPause);
    addEventListener('keydown',onKey);addEventListener('keyup',onKey);document.addEventListener('visibilitychange',onVis);
    let io=null,ro=null;
    if('IntersectionObserver' in window){io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)pause()}),{threshold:.25});io.observe(scr)}
    if('ResizeObserver' in window){let rw=0,rh=0;ro=new ResizeObserver(es=>{const c=es[0].contentRect;if(c.width&&(Math.abs(c.width-rw)>1||Math.abs(c.height-rh)>1)){rw=c.width;rh=c.height;size()}});ro.observe(scr)}
    else addEventListener('resize',size);

    requestAnimationFrame(()=>{if(!destroyed){size();menu()}});
    hud();

    function destroy(){
      destroyed=true;running=false;paused=false;cancelAnimationFrame(raf);raf=0;
      cv.removeEventListener('pointerdown',onDown);cv.removeEventListener('pointermove',onMove);cv.removeEventListener('pointerup',onUp);cv.removeEventListener('pointercancel',onUp);
      pbtn.removeEventListener('click',onPause);
      removeEventListener('keydown',onKey);removeEventListener('keyup',onKey);document.removeEventListener('visibilitychange',onVis);removeEventListener('resize',size);
      if(io)io.disconnect();if(ro)ro.disconnect();
      host.innerHTML='';
    }
    return {pause,destroy};
  }

  window.PDGames=window.PDGames||{};
  window.PDGames['catch']={id:'catch',title:'Catch the Treats',blurb:'Catch treats. Dodge bombs.',mount};
})();
