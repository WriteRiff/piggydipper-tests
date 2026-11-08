(function(){
'use strict';
window.PDGames = window.PDGames || {};

/* ===================== Road Hog =====================
   Grid hopper: the pig crosses neon Main Street to reach treats.
   11 x 11 board. Row 0 = treat shop fronts, row 10 = start sidewalk. */
const COLS = 11, ROWS = 11, PERIOD = COLS + 6, PAD = PERIOD - COLS;
const HOP = 0.13, DEATH = 0.9;
const C = {
  bg:'#0d0719', bg2:'#140b26', bg3:'#1d1038', bg4:'#2a1650',
  pink:'#ff4fa8', lp:'#ffd6ec', cyan:'#3ff0ff', lime:'#9dff4f', vio:'#b48cff',
  dvio:'#7d52d6', white:'#ffffff', hot:'#ff6fb7', shake:'#ff7cc0', shake2:'#ff9fd2'
};

/* pixel sprites: one letter per pixel, '.' is empty */
const SPR = {
  pig:{pal:{P:'#ff9ccf',p:'#ff6fb7',K:'#140b26',n:'#ff4fa8',k:'#7a1450',W:'#ffffff'},map:[
    '.pp......pp.','.pPp....pPp.','PPPPPPPPPPPP','PPWKPPPPWKPP','PPKKPPPPKKPP','PPPPnnnnPPPP','PpPPnknkPPpP','PPPPnnnnPPPP','.PPPPPPPPPP.','..pPPPPPPp..']},
  pigx:{pal:{P:'#ff9ccf',p:'#ff6fb7',K:'#140b26',n:'#ff4fa8',k:'#7a1450'},map:[
    '.pp......pp.','.pPp....pPp.','PPPPPPPPPPPP','PPKPKPPKPKPP','PPPKPPPPKPPP','PPKPKnnKPKPP','PpPPnknkPPpP','PPPPnnnnPPPP','.PPPPPPPPPP.','..pPPPPPPp..']},
  /* oval cake pop (taller than wide) on a white stick */
  pop:{pal:{P:'#ff4fa8',W:'#ffd6ec',L:'#9dff4f',C:'#3ff0ff',w:'#f4ecff'},map:[
    '..PP..','.PPPP.','PWPPPP','PWPPLP','PPCPPP','PPPPPP','PLPPCP','.PPPP.','..PP..','..ww..','..ww..','..ww..']},
  cookie:{pal:{C:'#ffe1f0',c:'#ffb8da',b:'#3ff0ff',g:'#9dff4f',p:'#ff4fa8',l:'#b48cff'},map:[
    '..CCCC..','.CCcCCC.','CCpCCbCC','CgCCcCCC','CCCbCClC','CcCCCgCC','.CClCpC.','..CCCC..']},
  roll:{pal:{I:'#ffffff',l:'#b48cff',d:'#7d52d6'},map:[
    '..lllll..','.lIIIIIl.','lIlllllIl','lIlIIIlId','lIlIlIlId','lIlIllIId','lIllIIIld','.lIIIIld.','..ldddd..']}
};
function sprite(name, s){
  const sp = SPR[name], h = sp.map.length, w = sp.map[0].length;
  const c = document.createElement('canvas'); c.width = w*s; c.height = h*s;
  const x = c.getContext('2d');
  sp.map.forEach((row,j)=>{ for(let i=0;i<row.length;i++){ const col = sp.pal[row[i]]; if(col){ x.fillStyle = col; x.fillRect(i*s, j*s, s, s); } } });
  return c;
}

/* vehicles (length in cells) */
const VEH = { scooter:1, bike:1, van:2, sweeper:2, truck:3, float:2 };
const VCOL = { scooter:[C.pink,C.hot], bike:[C.lime,'#6fd62f'], van:[C.cyan,'#1fb8c9'], sweeper:[C.vio,C.dvio], truck:[C.white,C.pink], float:[C.pink,C.lp] };

function R(dir,speed,types,gap,o){ return Object.assign({k:'road',dir,speed,types:types.split(','),gap}, o||{}); }
function S(dir,speed,lens,gap){ return {k:'shake',dir,speed,lens,gap}; }
function PA(dir,speed){ return {k:'parade',dir,speed}; }

const LEVELS = [
  {name:'MAIN STREET', time:35, rows:['goal','walk',
    R(1,.9,'scooter,bike',[3,5]), R(-1,1.15,'van',[3.5,5]), R(1,1,'bike,scooter',[3,4.5]),
    'walk','walk',
    R(-1,1.25,'van,sweeper',[3.5,5]), R(1,.9,'scooter,bike',[2.5,4]),
    'walk','start']},
  {name:'RUSH HOUR', time:32, rows:['goal','walk',
    R(-1,1.55,'scooter,bike',[2.5,4]), R(1,1.3,'van,truck',[3,4.5]), R(-1,1.75,'scooter',[2.5,4]),
    'walk',
    R(1,1.4,'van,sweeper',[2.5,4]), R(-1,1.2,'truck,van',[3,4]), R(1,1.85,'bike,scooter',[2.5,3.5]),
    'walk','start']},
  {name:'SHAKE CANAL', time:32, rows:['goal','walk',
    S(1,1,[3,4],[1.5,2.4]), S(-1,1.3,[2,4],[1.5,2.4]), S(1,.9,[3,4],[1.5,2.2]),
    'walk',
    R(-1,1.6,'van,sweeper',[2.5,4]), R(1,1.8,'scooter,bike',[2.5,3.5]), R(-1,1.4,'truck',[3,4.5]),
    'walk','start']},
  {name:'FAST LANES', time:30, rows:['goal','walk',
    S(-1,1.4,[2,3],[1.5,2.4]), S(1,1.7,[2,4],[1.6,2.5]), S(-1,1.2,[2,3],[1.4,2.3]),
    'walk',
    R(1,1.5,'van,truck',[2.6,4],{rush:true}), R(-1,2,'scooter,bike',[2.5,3.5]), R(1,1.45,'sweeper,van',[2.6,3.6],{rush:true}), R(-1,2.15,'bike,scooter',[2.3,3.2]),
    'start']},
  {name:'PARADE NIGHT', time:30, rows:['goal','walk',
    PA(1,1.1), S(-1,1.6,[2,3],[1.5,2.4]), S(1,1.85,[2,3],[1.6,2.5]),
    'walk',
    R(-1,2,'van,truck',[2.5,3.6],{rush:true}), R(1,2.35,'scooter,bike',[2.3,3.2]), R(-1,1.8,'sweeper,van',[2.5,3.4],{rush:true}), R(1,2.55,'bike,scooter',[2.3,3]),
    'start']}
];
const SPOT_COLS = [1,5,9];
const rnd = (a,b)=>a+Math.random()*(b-a);
const mod = (a,n)=>((a%n)+n)%n;

function buildLane(spec){
  if(typeof spec === 'string') return {k:spec};
  const L = Object.assign({}, spec, {items:[], shift:Math.random()*PERIOD, phase:Math.random()*6.283, mult:1});
  let pos = 0, guard = 0;
  if(spec.k === 'road'){
    while(guard++ < 30){
      const t = spec.types[Math.random()*spec.types.length|0], len = VEH[t];
      if(pos + len + spec.gap[0] > PERIOD) break;
      L.items.push({x:pos, len, t});
      pos += len + rnd(spec.gap[0], spec.gap[1]);
    }
  } else if(spec.k === 'shake'){
    while(guard++ < 30){
      const len = Math.round(rnd(spec.lens[0], spec.lens[1]));
      if(pos + len + spec.gap[0] > PERIOD) break;
      L.items.push({x:pos, len, t:'tray'});
      pos += len + rnd(spec.gap[0], spec.gap[1]);
    }
    if(!L.items.length) L.items.push({x:0, len:3, t:'tray'});
  } else if(spec.k === 'parade'){
    while(guard++ < 30){
      const n = 2 + (Math.random()*2|0);
      const need = n*2 + (n-1)*.25;
      if(pos + need + 1.9 > PERIOD) break;
      for(let i=0;i<n;i++){ L.items.push({x:pos, len:2, t:'float', hue:i}); pos += 2.25; }
      pos += rnd(1.9, 2.5) - .25;
    }
  }
  return L;
}

window.PDGames.road = {
  id:'road', title:'Road Hog', blurb:'Hop the pig across Main Street to all 3 treats.',
  mount(host, api){
    api = api || {};
    const store = api.store || {get(){return null}, set(){}};
    const reduce = !!api.reduce;
    host.classList.add('pdg', 'pdg-road');
    host.innerHTML =
      '<div class="rh-hud">' +
        '<span class="rh-stat">LVL <b class="rh-lvl">1</b>/5</span>' +
        '<span class="rh-stat">SCORE <b class="rh-score">00000</b></span>' +
        '<span class="rh-lives" aria-label="Lives"></span>' +
      '</div>' +
      '<div class="rh-timebar" aria-hidden="true"><i></i></div>' +
      '<div class="rh-stage">' +
        '<canvas class="rh-canvas" tabindex="0" aria-label="Road Hog game board. Swipe, tap, use the arrow buttons or the arrow keys to hop."></canvas>' +
        '<div class="rh-over" role="dialog" aria-live="polite"></div>' +
      '</div>' +
      '<div class="rh-pad" aria-label="Controls">' +
        '<button type="button" class="rh-btn rh-up" data-dir="up" aria-label="Hop up"><svg viewBox="0 0 10 10"><path d="M5 1.5 9 7.5H1z"/></svg></button>' +
        '<button type="button" class="rh-btn rh-left" data-dir="left" aria-label="Hop left"><svg viewBox="0 0 10 10"><path d="M1.5 5 7.5 1v8z"/></svg></button>' +
        '<button type="button" class="rh-btn rh-pause" data-dir="pause" aria-label="Pause"><svg viewBox="0 0 10 10"><path d="M2.5 2h2v6h-2zM5.5 2h2v6h-2z"/></svg></button>' +
        '<button type="button" class="rh-btn rh-right" data-dir="right" aria-label="Hop right"><svg viewBox="0 0 10 10"><path d="M8.5 5 2.5 9V1z"/></svg></button>' +
        '<button type="button" class="rh-btn rh-down" data-dir="down" aria-label="Hop down"><svg viewBox="0 0 10 10"><path d="M5 8.5 1 2.5h8z"/></svg></button>' +
      '</div>';

    const $ = s => host.querySelector(s);
    const cv = $('.rh-canvas'), ctx = cv.getContext('2d'), over = $('.rh-over'), stage = $('.rh-stage');
    const elLvl = $('.rh-lvl'), elScore = $('.rh-score'), elLives = $('.rh-lives'), elTime = $('.rh-timebar i'), elTimeBar = $('.rh-timebar');
    const hud = $('.rh-hud'), pad = $('.rh-pad');

    let cell = 30, ps = 2, dpr = 1, spr = {}, lifeIcon = '';
    let state = 'menu', level = 0, lanes = [], spots = [], score = 0, levelStartScore = 0, lives = 3, timer = 30, bestRow = 10;
    let pig = null, queued = null, fx = [], bonus = null, shakeT = 0, clock = 0, wonCalled = false;
    let raf = 0, last = 0, visible = true, introT = 0, clearT = 0, destroyed = false;
    let picked = 1;

    const getNum = (k, d) => { const v = parseInt(store.get(k), 10); return isNaN(v) ? d : v; };
    let unlocked = Math.min(5, Math.max(1, getNum('pdg-road-unlocked', 1)));
    let best = Math.max(0, getNum('pdg-road-best', 0));
    picked = unlocked;

    /* ---------- layout ---------- */
    function layout(){
      if(destroyed) return;
      const w = stage.clientWidth || host.clientWidth || 340;
      const vh = window.innerHeight || 700;
      const avail = Math.min(vh*0.78, 680) - hud.offsetHeight - elTimeBar.offsetHeight - pad.offsetHeight - 26;
      cell = Math.max(16, Math.floor(Math.min(w/COLS, Math.max(180, avail)/ROWS)));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.style.width = (COLS*cell) + 'px'; cv.style.height = (ROWS*cell) + 'px';
      cv.width = Math.round(COLS*cell*dpr); cv.height = Math.round(ROWS*cell*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.imageSmoothingEnabled = false;
      over.style.width = cv.style.width; over.style.height = cv.style.height;
      ps = Math.max(1, Math.floor(cell*0.9/12));
      ['pig','pigx','pop','cookie','roll'].forEach(n => spr[n] = sprite(n, ps));
      try{ lifeIcon = sprite('pig', 2).toDataURL(); }catch(e){ lifeIcon = ''; }
      updHud(); draw();
    }

    /* ---------- level setup ---------- */
    function setupLevel(n){
      level = n;
      const L = LEVELS[n-1];
      lanes = L.rows.map(buildLane);
      const kinds = ['pop','cookie','roll'].sort(()=>Math.random()-.5);
      spots = SPOT_COLS.map((c,i)=>({c, k:kinds[i], done:false, glow:0}));
      lives = 3; fx = []; queued = null;
      respawn(true);
    }
    function respawn(fresh){
      pig = {fx:5, r:ROWS-1, hop:null, dead:0, dtype:'', bump:0};
      timer = LEVELS[level-1].time; bestRow = ROWS-1; queued = null;
      bonus = null;
      if(!fresh || Math.random() < .6){
        const walks = []; lanes.forEach((l,i)=>{ if(l.k === 'walk') walks.push(i); });
        if(walks.length && Math.random() < .7){
          const r = walks[Math.random()*walks.length|0];
          bonus = {r, c: Math.random()*COLS|0, k:['pop','cookie','roll'][Math.random()*3|0], t:0};
        }
      }
    }

    /* ---------- HUD ---------- */
    function updHud(){
      elLvl.textContent = String(level || picked);
      elScore.textContent = String(score).padStart(5,'0');
      let h = '';
      for(let i=0;i<3;i++) h += '<i class="' + (i < lives ? 'on' : 'off') + '"' + (lifeIcon ? ' style="background-image:url(' + lifeIcon + ')"' : '') + '></i>';
      elLives.innerHTML = h;
      elLives.setAttribute('aria-label', lives + ' lives');
      const full = level ? LEVELS[level-1].time : 1;
      const p = level ? Math.max(0, timer/full) : 1;
      elTime.style.width = (p*100).toFixed(1) + '%';
      elTimeBar.classList.toggle('low', level > 0 && timer < 8 && state === 'play');
    }

    /* ---------- overlays ---------- */
    function showOver(html){ over.innerHTML = html; over.hidden = false; const b = over.querySelector('[data-focus]'); if(b && host.contains(document.activeElement)){ try{ b.focus({preventScroll:true}); }catch(e){} } }
    function hideOver(){ const had = host.contains(document.activeElement); over.hidden = true; over.innerHTML = ''; if(had){ try{ cv.focus({preventScroll:true}); }catch(e){} } }
    function levelPicker(){
      let h = '<div class="rh-levels" role="group" aria-label="Pick a level">';
      for(let i=1;i<=5;i++){
        const lock = i > unlocked;
        h += '<button type="button" class="rh-lv' + (i === picked ? ' sel' : '') + '" data-act="pick" data-n="' + i + '"' + (lock ? ' disabled aria-label="Level ' + i + ' locked"' : ' aria-label="Level ' + i + '"') + '>' + (lock ? '<span class="rh-lock" aria-hidden="true"></span>' : i) + '</button>';
      }
      return h + '</div>';
    }
    function menu(){
      state = 'menu'; level = 0; score = 0;
      if(!lanes.length) lanes = LEVELS[0].rows.map(buildLane);
      if(!spots.length) spots = SPOT_COLS.map((c,i)=>({c, k:['pop','cookie','roll'][i], done:false, glow:0}));
      pig = null; updHud();
      showOver(
        '<p class="rh-title">ROAD HOG</p>' +
        '<p class="rh-msg">Get the pig to all 3 treats</p>' +
        levelPicker() +
        '<button type="button" class="rh-go" data-act="start" data-focus>START</button>' +
        '<p class="rh-best">BEST ' + String(best).padStart(5,'0') + '</p>' +
        '<p class="rh-hint">SWIPE · TAP · D-PAD · ARROW KEYS</p>');
    }
    function intro(n, keepScore){
      if(!keepScore) score = 0;
      levelStartScore = score;
      setupLevel(n);
      state = 'intro'; updHud();
      showOver('<p class="rh-kicker">LEVEL ' + n + '</p><p class="rh-title rh-sm">' + LEVELS[n-1].name + '</p><p class="rh-msg">' + introMsg(n) + '</p><p class="rh-hint">TAP TO GO</p>');
      over.dataset.tapgo = '1';
      clearTimeout(introT);
      introT = setTimeout(go, 1700);
    }
    function introMsg(n){
      return ['Watch the traffic','More lanes, faster cars','Ride the trays across the shake','Some lanes speed up','Mind the parade'][n-1];
    }
    function go(){
      clearTimeout(introT); introT = 0;
      if(state !== 'intro') return;
      delete over.dataset.tapgo;
      state = 'play'; hideOver(); updHud();
    }
    function pauseGame(){
      if(state !== 'play') return;
      state = 'paused'; updHud();
      showOver('<p class="rh-title rh-sm">PAUSED</p><p class="rh-msg">SCORE ' + String(score).padStart(5,'0') + '</p><button type="button" class="rh-go" data-act="resume" data-focus>RESUME</button><button type="button" class="rh-alt" data-act="menu">LEVELS</button>');
    }
    function resume(){
      if(state !== 'paused') return;
      state = 'play'; hideOver(); last = performance.now();
    }
    function levelClear(){
      state = 'clear';
      const bonusPts = 250*level;
      score += bonusPts;
      if(level < 5 && unlocked < level+1){ unlocked = level+1; store.set('pdg-road-unlocked', String(unlocked)); }
      saveBest(); updHud();
      if(level === 5){
        if(!wonCalled){ wonCalled = true; try{ api.win && api.win('road', score); }catch(e){} }
        picked = 1;
        showOver('<p class="rh-kicker">ALL 5 LEVELS CLEARED</p><p class="rh-title">YOU WIN!</p><p class="rh-msg">SCORE ' + String(score).padStart(5,'0') + '</p><button type="button" class="rh-go" data-act="again" data-focus>PLAY AGAIN</button><button type="button" class="rh-alt" data-act="menu">LEVELS</button>');
        burst(COLS*cell/2, ROWS*cell/2, 40, [C.pink,C.cyan,C.lime,C.vio,C.white]);
        return;
      }
      picked = level+1;
      showOver('<p class="rh-kicker">LEVEL ' + level + '</p><p class="rh-title rh-sm">CLEAR!</p><p class="rh-msg">BONUS +' + bonusPts + '</p><button type="button" class="rh-go" data-act="next" data-focus>NEXT LEVEL</button><button type="button" class="rh-alt" data-act="menu">LEVELS</button>');
    }
    function gameOver(){
      state = 'over'; saveBest(); updHud();
      picked = level;
      showOver('<p class="rh-title rh-sm">GAME OVER</p><p class="rh-msg">SCORE ' + String(score).padStart(5,'0') + '</p><button type="button" class="rh-go" data-act="retry" data-focus>RETRY LEVEL ' + level + '</button><button type="button" class="rh-alt" data-act="menu">LEVELS</button>');
    }
    function saveBest(){ if(score > best){ best = score; store.set('pdg-road-best', String(best)); } }

    over.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if(!b){ if(over.dataset.tapgo) go(); return; }
      const a = b.dataset.act;
      if(a === 'pick'){ picked = +b.dataset.n; over.querySelectorAll('.rh-lv').forEach(x => x.classList.toggle('sel', x === b)); updHud(); }
      else if(a === 'start'){ wonCalled = false; intro(picked, false); }
      else if(a === 'resume') resume();
      else if(a === 'menu'){ clearTimeout(clearT); menu(); }
      else if(a === 'next') intro(level+1, true);
      else if(a === 'retry'){ score = levelStartScore; intro(level, true); }
      else if(a === 'again'){ wonCalled = false; intro(1, false); }
    });

    /* ---------- movement ---------- */
    function tryMove(dx, dy){
      if(state !== 'play' || !pig || pig.dead) return;
      if(pig.hop){ queued = [dx, dy]; return; }
      let nfx = pig.fx + dx, nr = pig.r + dy;
      if(nr > ROWS-1 || nr < 0) return bump();
      if(nfx < -0.01 || nfx > COLS-1+0.01) return bump();
      const tl = lanes[nr];
      if(nr === 0){
        const col = Math.round(nfx);
        const s = spots.find(sp => sp.c === col);
        if(!s || s.done) return bump();
        nfx = col;
      } else if(tl.k !== 'shake'){
        nfx = Math.min(COLS-1, Math.max(0, Math.round(nfx)));
      }
      pig.hop = {fx0:pig.fx, r0:pig.r, fx1:nfx, r1:nr, t:0};
    }
    function bump(){ if(pig) pig.bump = .16; }
    function landed(){
      const h = pig.hop; pig.hop = null;
      pig.fx = h.fx1; pig.r = h.r1;
      if(pig.r < bestRow){ score += 10*(bestRow - pig.r); bestRow = pig.r; }
      if(pig.r === 0){ deliver(); return; }
      if(bonus && pig.r === bonus.r && Math.round(pig.fx) === bonus.c){
        score += 50; pop('+50', (bonus.c+.5)*cell, (bonus.r+.2)*cell, C.lime);
        burst((bonus.c+.5)*cell, (bonus.r+.5)*cell, 10, [C.lime,C.white,C.cyan]);
        bonus = null;
      }
      updHud();
      if(queued){ const q = queued; queued = null; tryMove(q[0], q[1]); }
    }
    function deliver(){
      const col = Math.round(pig.fx), s = spots.find(sp => sp.c === col);
      if(!s) return;
      s.done = true; s.glow = 1;
      const tb = Math.ceil(timer)*5;
      score += 100 + tb;
      pop('+' + (100+tb), (col+.5)*cell, .1*cell, C.cyan);
      burst((col+.5)*cell, .5*cell, 18, [C.cyan,C.pink,C.white,C.lime]);
      updHud();
      if(spots.every(sp => sp.done)){
        pig = null; state = 'clearing';
        clearT = setTimeout(levelClear, 700);
      } else {
        respawn(false);
      }
    }
    function die(type){
      if(!pig || pig.dead) return;
      pig.dead = DEATH; pig.dtype = type; pig.hop = null; queued = null;
      lives--; updHud();
      if(!reduce) shakeT = .35;
      const cx = (pig.fx+.5)*cell, cy = (pig.r+.5)*cell;
      if(type === 'splash') burst(cx, cy, 16, [C.lp, C.white, C.shake2]);
      else if(type === 'time') burst(cx, cy, 10, [C.vio, C.white]);
      else burst(cx, cy, 16, [C.pink, C.white, C.cyan]);
    }

    /* ---------- particles ---------- */
    function burst(x, y, n, cols){
      if(reduce) n = Math.ceil(n/3);
      for(let i=0;i<n;i++){
        const a = Math.random()*6.283, sp = rnd(40, 160);
        fx.push({kind:'sq', x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 40, t:0, life:rnd(.4,.8), c:cols[i%cols.length]});
      }
    }
    function pop(txt, x, y, c){ fx.push({kind:'txt', txt, x, y, t:0, life:.9, c}); }

    /* ---------- update ---------- */
    function laneAt(r){ return lanes[r]; }
    function itemX(L, it){ return mod(it.x + L.shift, PERIOD) - PAD; }
    function update(dt){
      clock += dt;
      const moveLanes = state !== 'paused';
      if(moveLanes){
        lanes.forEach(L => {
          if(!L.items) return;
          let m = 1;
          if(L.rush){ const s = Math.sin(clock*.85 + L.phase); m = 1 + 1.1*Math.max(0, s)*Math.max(0, s); }
          L.mult = m;
          L.shift += L.dir*L.speed*m*dt;
        });
      }
      spots.forEach(s => { if(s.glow > 0) s.glow = Math.max(0, s.glow - dt*.8); });
      if(state === 'play' && pig){
        if(pig.bump > 0) pig.bump = Math.max(0, pig.bump - dt);
        if(pig.dead){
          pig.dead -= dt;
          if(pig.dead <= 0){
            if(lives <= 0){ pig = null; gameOver(); }
            else respawn(false);
          }
        } else {
          timer -= dt;
          if(timer <= 0){ timer = 0; die('time'); }
          else if(pig.hop){
            pig.hop.t += dt/HOP;
            if(pig.hop.t >= 1) landed();
          }
          if(pig && !pig.dead && !pig.hop && state === 'play'){
            const L = laneAt(pig.r);
            if(L.k === 'shake'){
              let on = null;
              const cx = pig.fx + .5;
              for(const it of L.items){ const x = itemX(L, it); if(cx >= x + .05 && cx <= x + it.len - .05){ on = it; break; } }
              if(!on) die('splash');
              else {
                pig.fx += L.dir*L.speed*L.mult*dt;
                if(pig.fx < -.45 || pig.fx > COLS - .55) die('swept');
              }
            } else if(L.k === 'road' || L.k === 'parade'){
              const pl = pig.fx + .2, pr = pig.fx + .8;
              for(const it of L.items){ const x = itemX(L, it); if(pl < x + it.len - .08 && pr > x + .08){ die('hit'); break; } }
            }
          }
        }
        updTimeOnly();
      }
      if(shakeT > 0) shakeT = Math.max(0, shakeT - dt);
      for(const p of fx){
        p.t += dt;
        if(p.kind === 'sq'){ p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 260*dt; }
      }
      fx = fx.filter(p => p.t < p.life);
      if(bonus) bonus.t += dt;
    }
    let lastTimeDraw = -1;
    function updTimeOnly(){
      const full = LEVELS[level-1].time, p = Math.max(0, timer/full);
      const w = (p*100).toFixed(1);
      if(w !== lastTimeDraw){ elTime.style.width = w + '%'; lastTimeDraw = w; }
      elTimeBar.classList.toggle('low', timer < 8);
    }

    /* ---------- drawing ---------- */
    function rr(x, y, w, h, c){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    function drawRow(r){
      const L = lanes[r], y = r*cell, W = COLS*cell, u = cell/8;
      if(!L) return;
      if(L.k === 'goal'){
        rr(0, y, W, cell, C.bg2);
        for(let c=0;c<COLS;c++){
          const x = c*cell;
          const spot = spots.find(s => s.c === c);
          if(spot){
            /* glowing shop doorway */
            const gl = .55 + .35*Math.sin(clock*3 + c);
            rr(x+u*.5, y+u*1.5, cell-u, cell-u*1.5, spot.done ? C.bg4 : C.bg3);
            ctx.globalAlpha = spot.done ? .5 : gl;
            rr(x+u*.5, y+u*1.5, cell-u, u*.6, C.cyan);
            rr(x+u*.5, y+u*1.5, u*.6, cell-u*1.5, C.cyan);
            rr(x+cell-u*1.1, y+u*1.5, u*.6, cell-u*1.5, C.cyan);
            ctx.globalAlpha = 1;
          } else {
            /* storefront panel with neon trim */
            rr(x, y+u, cell, cell-u, (c%2) ? C.bg3 : C.bg4);
            rr(x+u*1.5, y+u*3, cell-u*3, u*2.5, '#311a5c');
            ctx.globalAlpha = .7 + .3*Math.sin(clock*2 + c*1.7);
            rr(x+u*1.5, y+u*3, cell-u*3, u*.5, (c%3===0) ? C.pink : (c%3===1 ? C.vio : C.lime));
            ctx.globalAlpha = 1;
          }
          /* awning stripes */
          for(let k=0;k<4;k++) rr(x + k*cell/4, y, cell/4, u*1.2, k%2 ? C.lp : C.pink);
        }
        rr(0, y+cell-u*.4, W, u*.4, C.pink);
      } else if(L.k === 'walk' || L.k === 'start'){
        rr(0, y, W, cell, C.bg4);
        ctx.fillStyle = '#3a2070';
        for(let c=0;c<=COLS*2;c++) ctx.fillRect(Math.round(c*cell/2), y, 1, cell);
        ctx.fillRect(0, Math.round(y+cell/2), W, 1);
        rr(0, y, W, Math.max(1,u*.4), C.pink);
        rr(0, y+cell-Math.max(1,u*.4), W, Math.max(1,u*.4), C.pink);
        /* street lamps */
        if(L.k === 'walk'){
          [0, COLS-1].forEach(c => {
            const x = c*cell + cell/2;
            ctx.globalAlpha = .18; rr(x - cell*.45, y + u, cell*.9, cell - u*2, C.cyan); ctx.globalAlpha = 1;
            rr(x - u*.3, y + u*2, u*.6, cell - u*3, C.vio);
            rr(x - u, y + u*1.2, u*2, u, C.cyan);
          });
        }
      } else if(L.k === 'road' || L.k === 'parade'){
        rr(0, y, W, cell, C.bg2);
        const prev = lanes[r-1];
        if(prev && (prev.k === 'road' || prev.k === 'parade')){
          ctx.fillStyle = C.dvio;
          for(let x=0;x<W;x+=cell) ctx.fillRect(Math.round(x + cell*.2), y, Math.round(cell*.45), Math.max(1, Math.round(u*.35)));
        }
        if(L.k === 'parade'){
          for(let i=0;i<14;i++){
            const cx = mod(i*37.3 + clock*12, W), cy = y + u + ((i*13)%6)*u;
            rr(cx, cy, Math.max(1,u*.5), Math.max(1,u*.5), [C.pink,C.cyan,C.lime,C.vio][i%4]);
          }
        }
        if(L.rush){
          const hot = L.mult > 1.35;
          ctx.globalAlpha = hot ? .95 : .35;
          const ch = L.dir > 0 ? '▶' : '◀';
          ctx.fillStyle = hot ? C.pink : C.vio;
          ctx.font = Math.round(cell*.35) + 'px "Press Start 2P",monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(ch, cell*.3, y + cell/2); ctx.fillText(ch, W - cell*.3, y + cell/2);
          ctx.globalAlpha = 1;
        }
        L.items.forEach(it => { const x = itemX(L, it); if(x > -it.len - .5 && x < COLS + .5) drawVeh(it, x*cell, y, L.dir); });
      } else if(L.k === 'shake'){
        rr(0, y, W, cell, C.shake);
        ctx.fillStyle = C.shake2;
        for(let i=0;i<COLS*2;i++){
          const wx = mod(i*cell*.55 + clock*cell*.4*(r%2 ? 1 : -1), W + cell) - cell*.5;
          const wy = y + u*(2 + (i%3)*2);
          ctx.fillRect(Math.round(wx), Math.round(wy), Math.round(cell*.35), Math.max(1, Math.round(u*.5)));
        }
        L.items.forEach(it => { const x = itemX(L, it); if(x > -it.len - .5 && x < COLS + .5) drawTray(x*cell, y, it.len); });
      }
    }
    function drawTray(x, y, len){
      const u = cell/8, w = len*cell;
      rr(x + u*.4, y + u*1.6, w - u*.8, cell - u*3.2, '#f4ecff');
      rr(x + u*.4, y + u*1.6, w - u*.8, u*.7, C.cyan);
      rr(x + u*.4, y + cell - u*2.3, w - u*.8, u*.7, '#c9b6f0');
      rr(x + u*.4, y + u*1.6, u*.7, cell - u*3.2, C.cyan);
      rr(x + w - u*1.1, y + u*1.6, u*.7, cell - u*3.2, C.cyan);
      const cols = [C.pink, C.lime, C.vio, C.cyan];
      for(let i=0;i<len*3;i++) rr(x + u*1.6 + i*(w - u*3.2)/(len*3), y + u*(3 + (i%2)*1.6), Math.max(1,u*.6), Math.max(1,u*.6), cols[i%4]);
    }
    function drawVeh(it, x, y, dir){
      const u = cell/8, w = it.len*cell, t = it.t, col = VCOL[t] || [C.cyan, C.vio];
      const front = dir > 0 ? x + w : x;
      const fs = dir > 0 ? -1 : 1; /* direction from front toward back */
      const wheel = (wx) => { rr(wx - u*.8, y + cell - u*2.3, u*1.6, u*1.6, '#0d0719'); rr(wx - u*.3, y + cell - u*1.8, u*.6, u*.6, C.vio); };
      if(t === 'van' || t === 'truck'){
        rr(x + u*.4, y + u*1.4, w - u*.8, cell - u*3.2, col[0]);
        rr(x + u*.4, y + u*1.4, w - u*.8, u*.8, col[1]);
        const cabW = cell*.6;
        const cabX = dir > 0 ? x + w - cabW - u*.4 : x + u*.4;
        rr(cabX, y + u*1.4, cabW, cell - u*3.2, t === 'truck' ? C.pink : col[1]);
        rr(dir > 0 ? cabX + cabW*.35 : cabX + u*.4, y + u*2.2, cabW*.5, u*1.6, C.lp);
        if(t === 'truck'){
          const cols = [C.pink, C.cyan, C.lime, C.vio];
          const bx0 = dir > 0 ? x + u : cabX + cabW + u*.6, bx1 = dir > 0 ? cabX - u*.6 : x + w - u;
          for(let i=0;i<10;i++) rr(bx0 + (i*(bx1-bx0)/10), y + u*(2.4 + (i%3)*1.1), Math.max(1,u*.7), Math.max(1,u*.4), cols[i%4]);
        } else {
          rr(x + w*.25, y + u*3.3, w*.3, u*.9, C.white);
        }
        wheel(x + cell*.35); wheel(x + w - cell*.35);
        rr(front + fs*u*.5 - u*.25, y + u*3.6, u*.5, u, C.white);
        rr(front + fs*(w - u*.5) - u*.25, y + u*3.6, u*.5, u, C.pink);
      } else if(t === 'sweeper'){
        rr(x + u*.6, y + u*1.8, w - u*1.2, cell - u*3.6, col[0]);
        rr(x + u*.6, y + u*1.8, w - u*1.2, u*.8, col[1]);
        rr(dir > 0 ? x + w - cell*.55 : x + cell*.15, y + u*2.4, cell*.4, u*1.6, C.lp);
        /* spinning brush */
        const bx = dir > 0 ? x + w - u*.6 : x + u*.6, by = y + cell - u*2.2;
        const a = clock*14;
        ctx.strokeStyle = C.cyan; ctx.lineWidth = Math.max(1, u*.5);
        for(let k=0;k<3;k++){ const aa = a + k*2.09; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(aa)*u*1.6, by + Math.sin(aa)*u*1.6); ctx.stroke(); }
        wheel(x + cell*.45); wheel(x + w - cell*.75);
      } else if(t === 'scooter'){
        rr(x + u*1.5, y + u*3.6, w - u*3, u*1.6, col[0]);
        rr(dir > 0 ? x + w - u*2.4 : x + u*1.6, y + u*1.6, u*.8, u*2.2, C.lp);
        rr(dir > 0 ? x + u*2 : x + w - u*3.6, y + u*2.6, u*1.6, u*1.2, C.vio);
        rr(dir > 0 ? x + u*2.2 : x + w - u*3.4, y + u*1.2, u*1.2, u*1.4, C.cyan);
        wheel(x + u*2); wheel(x + w - u*2);
        rr(front + fs*u*.9 - u*.25, y + u*2, u*.5, u*.6, C.white);
      } else if(t === 'bike'){
        ctx.strokeStyle = col[0]; ctx.lineWidth = Math.max(1, u*.55);
        const w1 = x + u*2, w2 = x + w - u*2, wy = y + cell - u*2.2;
        ctx.beginPath(); ctx.moveTo(w1, wy); ctx.lineTo(x + w/2, y + u*3.4); ctx.lineTo(w2, wy); ctx.moveTo(x + w/2, y + u*3.4); ctx.lineTo(dir > 0 ? w2 - u : w1 + u, y + u*2.4); ctx.stroke();
        ctx.beginPath(); ctx.arc(w1, wy, u*1.3, 0, 6.283); ctx.arc(w2, wy, u*1.3, 0, 6.283); ctx.strokeStyle = C.lp; ctx.stroke();
        rr(x + w/2 - u*.8, y + u*1, u*1.6, u*1.6, C.pink);
        rr(x + w/2 - u*.5, y + u*2.4, u, u*1.4, C.vio);
      } else if(t === 'float'){
        rr(x + u*.3, y + u*3.2, w - u*.6, cell - u*4.6, it.hue % 2 ? C.vio : C.pink);
        for(let k=0;k<6;k++) rr(x + u*.3 + k*(w - u*.6)/6, y + cell - u*1.9, (w - u*.6)/12, u*.6, k%2 ? C.lp : C.white);
        const bc = [C.cyan, C.lime, C.lp];
        for(let k=0;k<3;k++){
          const bx = x + w*(.22 + k*.28), by = y + u*(1.6 + Math.sin(clock*4 + k + it.x)*.4);
          rr(bx - u, by - u, u*2, u*2, bc[(k + it.hue)%3]);
          rr(bx - u*.15, by + u, u*.3, u*1.3, C.white);
        }
        wheel(x + cell*.4); wheel(x + w - cell*.4);
      }
    }
    function drawSprite(name, cx, cy, sc){
      const s = spr[name]; if(!s) return;
      const w = s.width*(sc||1), h = s.height*(sc||1);
      ctx.drawImage(s, Math.round(cx - w/2), Math.round(cy - h/2), Math.round(w), Math.round(h));
    }
    function treatScale(k){
      const s = spr[k]; if(!s) return 1;
      const target = cell*.78; return Math.min(1, target/Math.max(s.width, s.height));
    }
    function draw(){
      if(!lanes.length) return;
      const W = COLS*cell, H = ROWS*cell;
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      if(shakeT > 0){ const m = shakeT*cell*.25; ctx.translate(rnd(-m,m), rnd(-m,m)); }
      for(let r=0;r<ROWS;r++) drawRow(r);
      /* treats in the doorways */
      spots.forEach(s => {
        const cx = (s.c+.5)*cell, cy = cell*.62;
        if(s.done){
          drawSprite('pig', cx, cy + cell*.08, Math.min(1, cell*.62/spr.pig.width));
          drawSprite(s.k, cx + cell*.3, cy - cell*.08, treatScale(s.k)*.55);
        } else {
          const bob = reduce ? 0 : Math.sin(clock*3 + s.c)*cell*.04;
          drawSprite(s.k, cx, cy + bob, treatScale(s.k)*.85);
        }
        if(s.glow > 0){ ctx.globalAlpha = s.glow*.6; rr(s.c*cell, 0, cell, cell, C.white); ctx.globalAlpha = 1; }
      });
      if(bonus){
        const cx = (bonus.c+.5)*cell, cy = (bonus.r+.5)*cell + (reduce ? 0 : Math.sin(bonus.t*5)*cell*.05);
        ctx.globalAlpha = .35 + .2*Math.sin(bonus.t*6); rr(bonus.c*cell + cell*.15, bonus.r*cell + cell*.15, cell*.7, cell*.7, C.lime); ctx.globalAlpha = 1;
        drawSprite(bonus.k, cx, cy, treatScale(bonus.k)*.7);
      }
      if(pig){
        let vx = pig.fx, vr = pig.r, lift = 0, sx = 1, sy = 1;
        if(pig.hop){
          const t = Math.min(1, pig.hop.t);
          vx = pig.hop.fx0 + (pig.hop.fx1 - pig.hop.fx0)*t;
          vr = pig.hop.r0 + (pig.hop.r1 - pig.hop.r0)*t;
          lift = Math.sin(Math.PI*t)*cell*.28;
          sx = 1 - .12*Math.sin(Math.PI*t); sy = 1 + .14*Math.sin(Math.PI*t);
        }
        let bx = 0; if(pig.bump > 0) bx = Math.sin(pig.bump*60)*cell*.06;
        const base = Math.min(1, cell*.86/spr.pig.width);
        const cx = (vx+.5)*cell + bx, cy = (vr+.5)*cell - lift;
        if(pig.dead){
          const blink = ((pig.dead*10)|0) % 2;
          if(pig.dtype === 'splash'){
            ctx.globalAlpha = Math.max(0, pig.dead/DEATH);
            ctx.strokeStyle = C.white; ctx.lineWidth = Math.max(1, cell*.06);
            const rad = (1 - pig.dead/DEATH)*cell*.6 + cell*.1;
            ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad*.5, 0, 0, 6.283); ctx.stroke();
            ctx.globalAlpha = 1;
            if(blink) drawSprite('pigx', cx, cy + cell*.1, base*.8);
          } else if(blink || reduce){
            drawSprite('pigx', cx, cy, base);
          }
        } else {
          /* shadow */
          ctx.globalAlpha = .35; rr(cx - cell*.3, (vr+.5)*cell + cell*.3, cell*.6, cell*.1, '#000'); ctx.globalAlpha = 1;
          const s = spr.pig, w = s.width*base*sx, h = s.height*base*sy;
          ctx.drawImage(s, Math.round(cx - w/2), Math.round(cy - h/2), Math.round(w), Math.round(h));
        }
      }
      /* particles */
      for(const p of fx){
        const a = Math.max(0, 1 - p.t/p.life);
        ctx.globalAlpha = a;
        if(p.kind === 'sq'){ const s = Math.max(2, cell*.12); rr(p.x - s/2, p.y - s/2, s, s, p.c); }
        else {
          ctx.fillStyle = p.c; ctx.font = Math.max(8, Math.round(cell*.3)) + 'px "Press Start 2P",monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(p.txt, Math.min(W - cell, Math.max(cell, p.x)), p.y + cell*.4 - p.t*cell*.9);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    /* ---------- loop ---------- */
    function loop(t){
      raf = 0;
      if(destroyed) return;
      const dt = Math.min(.05, Math.max(0, (t - last)/1000)); last = t;
      update(dt); draw();
      if(visible && !document.hidden) raf = requestAnimationFrame(loop);
    }
    function kick(){ if(!raf && !destroyed && visible && !document.hidden){ last = performance.now(); raf = requestAnimationFrame(loop); } }

    /* ---------- input ---------- */
    const DIRS = {up:[0,-1], down:[0,1], left:[-1,0], right:[1,0]};
    function onPad(e){
      const b = e.target.closest('[data-dir]'); if(!b) return;
      if(e.type === 'pointerdown'){ e.preventDefault(); act(b.dataset.dir); }
      else if(e.type === 'click' && e.detail === 0){ act(b.dataset.dir); }
    }
    function act(d){
      if(d === 'pause'){ if(state === 'play') pauseGame(); else if(state === 'paused') resume(); return; }
      const v = DIRS[d]; if(v) tryMove(v[0], v[1]);
    }
    let sw = null;
    function onDown(e){ if(state !== 'play') return; e.preventDefault(); sw = {x:e.clientX, y:e.clientY, id:e.pointerId}; try{ cv.setPointerCapture(e.pointerId); }catch(_){} }
    function onUp(e){
      if(!sw || e.pointerId !== sw.id) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
      try{ cv.releasePointerCapture(e.pointerId); }catch(_){}
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if(Math.max(ax, ay) < 14){ tryMove(0, -1); return; }
      if(ax > ay) tryMove(dx > 0 ? 1 : -1, 0); else tryMove(0, dy > 0 ? 1 : -1);
    }
    function onCancel(){ sw = null; }
    const KEYS = {ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down', ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right'};
    function onKey(e){
      if(destroyed || !host.isConnected) return;
      const tag = (e.target && e.target.tagName) || '';
      if(/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if(state === 'play'){
        if(e.key === 'p' || e.key === 'P' || e.key === 'Escape'){ e.preventDefault(); pauseGame(); return; }
        const d = KEYS[e.key]; if(!d) return;
        e.preventDefault(); if(e.repeat) return;
        act(d);
      } else if(state === 'paused' && (e.key === 'p' || e.key === 'P')){ e.preventDefault(); resume(); }
      else if(state === 'intro' && (e.key === ' ' || e.key === 'Enter')){ e.preventDefault(); go(); }
    }
    function onVis(){ if(document.hidden){ pauseGame(); } else kick(); }

    pad.addEventListener('pointerdown', onPad);
    pad.addEventListener('click', onPad);
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    const onResize = () => layout();
    window.addEventListener('resize', onResize);
    let io = null, ro = null;
    if('IntersectionObserver' in window){
      io = new IntersectionObserver(es => es.forEach(en => {
        visible = en.isIntersecting;
        if(!visible) pauseGame(); else kick();
      }), {threshold:.15});
      io.observe(host);
    }
    if('ResizeObserver' in window){
      let rw = 0;
      ro = new ResizeObserver(es => { const w = es[0].contentRect.width; if(w && Math.abs(w - rw) > 1){ rw = w; layout(); } });
      ro.observe(host);
    }

    menu();
    requestAnimationFrame(() => { layout(); kick(); });

    return {
      pause(){ pauseGame(); },
      destroy(){
        destroyed = true;
        cancelAnimationFrame(raf); raf = 0;
        clearTimeout(introT); clearTimeout(clearT);
        pad.removeEventListener('pointerdown', onPad);
        pad.removeEventListener('click', onPad);
        cv.removeEventListener('pointerdown', onDown);
        cv.removeEventListener('pointerup', onUp);
        cv.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey);
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('resize', onResize);
        if(io) io.disconnect(); if(ro) ro.disconnect();
        host.innerHTML = '';
        host.classList.remove('pdg-road');
      }
    };
  }
};
})();
