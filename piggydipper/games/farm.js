/* Piggy Dipper arcade: Escape the Farm (id "farm")
   Side-scrolling platformer. Pig escapes the farm, reaches the Piggy Dipper Bakery (level 5), then heads home (levels 6-10).
   All art is drawn in code. */
(function(){
'use strict';
window.PDGames=window.PDGames||{};

/* ------------------------------------------------------------------ constants */
var W=240,H=160,T=16,ROWS=10,SS=2;           // logical size, tile size, rows, buffer supersample
var P={grav:.24,maxFall:5,acc:.13,dec:.2,air:.09,max:1.45,jump:-4.55,cut:.45,coyote:6,buffer:7,bounce:-3.4};
/* two pigs to pick from: pink floats and jumps higher, purple runs faster and grips better */
var PIGS={
 pink:{name:'PINK PIG',trait:'HIGH JUMPER',grav:.215,maxFall:4.3,jump:-4.72,max:1.36,acc:.115,dec:.16,air:.085},
 purple:{name:'PURPLE PIG',trait:'QUICK FEET',grav:.245,maxFall:5,jump:-4.42,max:1.62,acc:.17,dec:.34,air:.1}
};
function pigPhys(k){var o={},n,d=PIGS[k]||PIGS.pink;for(n in P)o[n]=P[n];for(n in d)if(typeof d[n]==='number')o[n]=d[n];return o}

/* ------------------------------------------------------------------ level chunks (bottom rows; padded on top) */
var CH={
start:["........","..@.....","GGGGGGGG","########"],
goal:["..................","..................","....>.............","GGGGGGGGGGGGGGGGGG","##################"],
flat:["..o.o.o.","........","GGGGGGGG","########"],
flat2:["..........","...o..o...","GGGGGGGGGG","##########"],
chk:["......","..k...","GGGGGG","######"],
gap2:["...oo...","........","........","GG..GGGG","##ww####"],
gap3:["...r.....","...o.....","..o.o....","GG...GGGG","##www####"],
gap4:["....o.....","...o.o....","..........","GG....GGGG","##wwww####"],
stairs:[".....o....","....o.o...",".....HH...","...HHHH...","GGGGGGGGGG","##########"],
rails:["........o...",".......===..","..o.........",".====.......","............","GGGGGGGGGGGG","############"],
pitplat:[".....p.....","...........","....===....","...........","GG.......GG","##wwwwwww##"],
enemy:["..........","......e...","GGGGGGGGGG","##########"],
enemy2:["..o..o..o...","........f...","GGGGGGGGGGGG","############"],
hazard:["....o.....","....o.....","..........","...xx.....","GGGGGGGGGG","##########"],
hill:["....o.o.o...","............","...GGGGGG...","GGG######GGG","############"],
hillE:["....o...o...","......e.....","...GGGGGG...","GGG######GGG","############"],
tower:[".....p.....",".....C.....","....CC.....","...CCC.....","..CCCC.....","GGGGGGGGGGG","###########"],
lane:["..............","...........t..","GGGGGGGGGGGGGG","##############"],
cratepit:[".....o......","....CC......","....CC......","GG..CC...GGG","##wwCCwww###"],
loft:["........ooo...",".......=====..","..............","..=====.......","..........f...","GGGGGGGGGGGGGG","##############"],
awnings:[".......o......","......===.....","...o..........","..====........","............f.","GGGGGGGGGGGGGG","##############"],
thorns:["...o.....o....","..............","..xx....xx....","GGGGGGGGGGGGGG","##############"],
islands:["....o....o....","...HH...HH....","GG..........GG","##wwwwwwwwww##"],
bigpit:[".......r.......","...............","....==...==....","...............","GG...........GG","##wwwwwwwwwww##"],
double:["..o.......o...","...e....e.....","GGGGGGGGGGGGGG","##############"],
humans:["...o...o...o...o","....f.......f...","GGGGGGGGGGGGGGGG","################"],
rollhi:["....r.....","...===....","..........",".===......","..........","GGGGGGGGGG","##########"],
crates:["...o..o.....","..CCC.CC....","............","GGGGGGGGGGGG","############"]
};

/* ------------------------------------------------------------------ levels */
var LEVELS=[
 {name:'FARMYARD',theme:'farm',goal:'barn',en:{e:'goose',f:'farmer',t:'sheepdog'},
  seq:['start','flat','gap2','flat2','enemy','stairs','flat','pitplat','chk','hill','lane','enemy','gap2','crates','rails','goal']},
 {name:'THE BIG BARN',theme:'barn',goal:'barnout',en:{e:'goat',f:'farmer',t:'goat'},
  seq:['start','flat','loft','enemy','tower','gap2','chk','islands','enemy2','stairs','loft','lane','crates','goal']},
 {name:'BACK PASTURE',theme:'farm',goal:'gate',en:{e:'sheepdog',f:'farmer',t:'fox'},
  seq:['start','flat2','enemy','gap3','hillE','rails','chk','pitplat','enemy2','thorns','lane','cratepit','chk','hill','double','goal']},
 {name:'THE NEIGHBORHOOD',theme:'houses',goal:'signTown',en:{e:'dog',f:'officer',t:'dog'},
  seq:['start','flat','enemy','rails','gap3','enemy2','chk','hazard','tower','islands','double','chk','hillE','awnings','goal']},
 {name:'MAIN STREET',theme:'town',goal:'bakery',en:{e:'dog',f:'officer',t:'officer'},
  seq:['start','flat2','awnings','enemy2','gap3','pitplat','chk','double','cratepit','humans','stairs','chk','awnings','gap4','enemy2','goal']},
 {name:'TOWN AT NIGHT',theme:'townNight',goal:'signHome',en:{e:'dog',f:'officer',t:'officer'},
  seq:['start','flat','humans','gap4','awnings','chk','cratepit','double','tower','chk','bigpit','enemy2','thorns','awnings','humans','goal']},
 {name:'THE WOODS',theme:'woods',goal:'signHome',en:{e:'fox',f:'wolf',t:'wolf'},
  seq:['start','flat2','enemy','gap3','lane','islands','chk','hillE','bigpit','double','chk','thorns','cratepit','lane','rollhi','enemy2','goal']},
 {name:'BACKYARDS',theme:'yards',goal:'signHome',en:{e:'dog',f:'officer',t:'sheepdog'},
  seq:['start','flat','rails','double','gap4','enemy2','chk','tower','islands','hazard','humans','chk','pitplat','bigpit','lane','awnings','double','goal']},
 {name:'BACK ROADS',theme:'corn',goal:'signHome',en:{e:'fox',f:'farmer',t:'wolf'},
  seq:['start','flat2','lane','gap4','hillE','thorns','chk','enemy2','bigpit','double','cratepit','chk','islands','lane','humans','gap4','rollhi','goal']},
 {name:'HOME FARM',theme:'home',goal:'home',en:{e:'sheepdog',f:'farmer',t:'goat'},
  seq:['start','flat','double','gap4','loft','chk','lane','bigpit','humans','tower','chk','thorns','islands','double','cratepit','chk','hillE','lane','goal']}
];

var SOLID={G:1,'#':1,H:1,C:1};
function buildLevel(i){
  var L=LEVELS[i],rows=[],r,c;
  for(r=0;r<ROWS;r++)rows.push('');
  L.seq.forEach(function(name){
    var ch=CH[name];if(!ch)throw new Error('no chunk '+name);
    var w=ch[0].length,pad=ROWS-ch.length;
    for(r=0;r<ROWS;r++){
      var s=r<pad?new Array(w+1).join('.'):ch[r-pad];
      if(s.length!==w)throw new Error('chunk '+name+' row '+r+' width');
      rows[r]+=s}});
  var lv={i:i,name:L.name,theme:L.theme,goalType:L.goal,w:rows[0].length,grid:[],items:[],enemies:[],chks:[],start:null,goal:null};
  for(r=0;r<ROWS;r++){
    var line=rows[r].split('');
    for(c=0;c<line.length;c++){
      var k=line[c],x=c*T,y=r*T;
      if(k==='@'){lv.start={x:x+2,y:y+4};line[c]='.'}
      else if(k==='>'){lv.goal={x:x,y:(r+1)*T};line[c]='.'}
      else if(k==='k'){lv.chks.push({x:x+8,y:(r+1)*T,on:false});line[c]='.'}
      else if(k==='o'||k==='r'||k==='p'){lv.items.push({t:k,x:x+8,y:y+8,got:false});line[c]='.'}
      else if(k==='e'||k==='f'||k==='t'){lv.enemies.push({type:L.en[k],tx:x,ty:(r+1)*T});line[c]='.'}
    }
    lv.grid.push(line)}
  if(!lv.start||!lv.goal)throw new Error('level '+i+' missing start/goal');
  return lv}

/* shared tile physics (module level so the smoke test can simulate jumps) */
function tAt(lv,c,r){if(c<0||c>=lv.w||r<0||r>=ROWS)return '.';return lv.grid[r][c]}
function solAt(lv,c,r){if(c<0||c>=lv.w)return true;if(r<0||r>=ROWS)return false;return !!SOLID[lv.grid[r][c]]}
function moveBodyLv(lv,o,oneWay){
  o.x+=o.vx;var hitX=false,c,r;
  var top=Math.floor(o.y/T),bot=Math.floor((o.y+o.h-1)/T);
  if(o.vx>0){c=Math.floor((o.x+o.w)/T);for(r=top;r<=bot;r++)if(solAt(lv,c,r)){o.x=c*T-o.w-.001;hitX=true;break}}
  else if(o.vx<0){c=Math.floor(o.x/T);for(r=top;r<=bot;r++)if(solAt(lv,c,r)){o.x=(c+1)*T+.001;hitX=true;break}}
  if(hitX)o.vx=0;
  var prevBot=o.y+o.h;o.y+=o.vy;o.ground=false;var head=null;
  var l=Math.floor(o.x/T),rr=Math.floor((o.x+o.w-.01)/T);
  if(o.vy>=0){r=Math.floor((o.y+o.h)/T);
    for(c=l;c<=rr;c++){var t=tAt(lv,c,r);if(SOLID[t]||(oneWay&&t==='='&&prevBot<=r*T+.5)){o.y=r*T-o.h;o.vy=0;o.ground=true;break}}}
  else{r=Math.floor(o.y/T);for(c=l;c<=rr;c++)if(r>=0&&solAt(lv,c,r)){o.y=(r+1)*T;o.vy=0;head={c:c,r:r};break}}
  return {hitX:hitX,head:head}}
function physStep(lv,p,inp,Q){
  if(inp.J&&!p.jw)p.buf=Q.buffer;p.jw=inp.J;p.hold=inp.J;
  var want=(inp.R?1:0)-(inp.L?1:0),a=p.ground?Q.acc:Q.air,jumped=false;
  if(want){p.vx+=want*a;if(want!==Math.sign(p.vx)&&p.ground)p.vx+=want*Q.dec*.5;p.dir=want}
  else if(p.ground){if(Math.abs(p.vx)<=Q.dec)p.vx=0;else p.vx-=Math.sign(p.vx)*Q.dec}
  else p.vx*=.98;
  if(p.vx>Q.max)p.vx=Q.max;if(p.vx<-Q.max)p.vx=-Q.max;
  if(p.ground)p.coy=Q.coyote;else if(p.coy>0)p.coy--;
  if(p.buf>0){p.buf--;if(p.coy>0){p.vy=Q.jump;p.coy=0;p.buf=0;p.ground=false;jumped=true}}
  if(!inp.J&&p.vy<-1.2)p.vy*=Q.cut;
  p.vy+=Q.grav;if(p.vy>Q.maxFall)p.vy=Q.maxFall;
  var res=moveBodyLv(lv,p,true);res.jumped=jumped;return res}
/* widest gap (in tiles) a pig can clear when landing `up` tiles higher (negative = lower), by running the real physics */
function simGap(pigKey,up,big){
  var Q=pigPhys(pigKey),best=0;
  for(var gap=1;gap<=8;gap++){if(trySim(Q,gap,up,big))best=gap;else break}
  return best}
function trySim(Q,gap,up,big){
  var base=7,land=base-up,w=10+gap+10,grid=[],r,c;
  for(r=0;r<ROWS;r++){var row=[];for(c=0;c<w;c++)row.push(c<10?(r>=base?'#':'.'):(c<10+gap?'.':(r>=land?'#':'.')));grid.push(row)}
  var lv={w:w,grid:grid},pw=big?16:12,ph=big?19:12;
  for(var jt=0;jt<90;jt++){
    var p={x:10*T-pw-70,y:base*T-ph,w:pw,h:ph,vx:0,vy:0,dir:1,ground:true,coy:0,buf:0,jw:false};
    for(var t=0;t<300;t++){
      physStep(lv,p,{L:false,R:true,J:t>=jt&&t<jt+45},Q);
      if(p.y>H+10)break;
      if(p.ground&&t>jt){if(p.x+p.w-.01>=(10+gap)*T&&Math.abs(p.y+p.h-land*T)<.5)return true;if(p.x<10*T)break}
    }}
  return false}
function gapTable(pigKey,big){var t={};for(var u=-2;u<=3;u++)t[u]=simGap(pigKey,u,big);return t}

/* reachability check used by the smoke test: standable spots linked by walk/jump rules.
   tbl maps "tiles up" (-2..3) to the widest gap allowed; drops deeper than 2 use tbl[-2] */
var SAFE_TBL={'-2':4,'-1':4,'0':4,'1':3,'2':2};
function reach(lv,tbl){
  tbl=tbl||SAFE_TBL;
  var g=lv.grid,w=lv.w,stand=[],c,r;
  function sol(c,r){return r>=0&&r<ROWS&&c>=0&&c<w&&(SOLID[g[r][c]]||g[r][c]==='=')}
  function free(c,r){return r<0||!(SOLID[g[r][c]])}
  for(c=0;c<w;c++)for(r=1;r<ROWS;r++)if(sol(c,r)&&free(c,r-1)&&g[r-1][c]!=='x')stand.push(c+','+(r-1));
  var set={};stand.forEach(function(s){set[s]=1});
  var sc=Math.floor((lv.start.x)/T),sr=null;
  for(r=0;r<ROWS;r++)if(set[sc+','+r]){sr=r;break}
  var seen={},q=[[sc,sr]];seen[sc+','+sr]=1;
  var byCol={};stand.forEach(function(s){var p=s.split(',');(byCol[p[0]]=byCol[p[0]]||[]).push(+p[1])});
  while(q.length){var cur=q.shift(),cc=cur[0],cr=cur[1];
    for(var dc=-9;dc<=9;dc++){var nc=cc+dc,list=byCol[nc];if(!list)continue;
      list.forEach(function(nr){var key=nc+','+nr;if(seen[key])return;
        var up=cr-nr,gap=Math.abs(dc)-1,ok=false,lim=tbl[Math.max(-2,up)];
        if(Math.abs(dc)<=1&&up<=0)ok=true;           // walk or drop
        else if(lim!=null)ok=gap<=lim;
        if(ok){seen[key]=1;q.push([nc,nr])}})}}
  var gc=Math.floor(lv.goal.x/T)+1,gr=Math.floor(lv.goal.y/T)-1;
  return !!seen[gc+','+gr]}

/* ------------------------------------------------------------------ themes */
var TH={
 farm:{sky:['#6fcfff','#d8f5ff'],sun:'sun',far:['#b9f0d8','#93e2c0'],mid:'farm',grass:['#45d494','#24a56f'],soil:['#6a4fa8','#4f3a86','#8f78c8'],block:'hay',plat:'rail',haz:'thistle',water:['#3fa8ff','#a8e4ff']},
 barn:{sky:['#5c2449','#3b1735'],sun:'none',far:['#6e2c56','#5a2347'],mid:'barn',floor:true,grass:['#b2a2cf','#8a7aaa'],soil:['#6a5a8c','#54467a','#7f70a4'],block:'hay',plat:'plank',haz:'fork',water:['#3fa8ff','#a8e4ff']},
 houses:{sky:['#86d8ff','#e6f7ff'],sun:'sun',far:['#bdeedd','#a0e2c8'],mid:'houses',grass:['#45d494','#24a56f'],soil:['#6a4fa8','#4f3a86','#8f78c8'],block:'hedge',plat:'picket',haz:'roses',water:['#3fa8ff','#a8e4ff']},
 town:{sky:['#9fe0ff','#f2fbff'],sun:'sun',far:['#cfdcf2','#b9c8e6'],mid:'town',walk:true,grass:['#dcd8ec','#b6b0d0'],soil:['#4d4864','#3c3852','#5f5a78'],block:'planter',plat:'awning',haz:'roses',water:['#3fa8ff','#a8e4ff']},
 townNight:{sky:['#120a26','#3c2163'],sun:'moon',stars:true,far:['#2a2048','#231a3e'],mid:'town',night:true,walk:true,grass:['#8e88aa','#6c6690'],soil:['#2c2840','#221f34','#3b3654'],block:'planter',plat:'awning',haz:'roses',water:['#2f7fd0','#6fb8ff']},
 woods:{sky:['#0d0719','#2c1856'],sun:'moon',stars:true,far:['#2a1c50','#211640'],mid:'woods',night:true,grass:['#1f9a74','#167257'],soil:['#3f2a6a','#2f1f54','#55408a'],block:'hedge',plat:'log',haz:'thistle',water:['#2f7fd0','#6fb8ff']},
 yards:{sky:['#6a4fb8','#ffb6d6'],sun:'sunset',far:['#9a78d0','#8364c0'],mid:'yards',grass:['#3cc48a','#22986a'],soil:['#5a3f98','#443078','#7d66b8'],block:'hedge',plat:'picket',haz:'roses',water:['#3f98ff','#a0d8ff']},
 corn:{sky:['#2e1a5e','#ff86b8'],sun:'sunset',far:['#5a3a90','#4a2f7a'],mid:'corn',grass:['#a69cc4','#857aa6'],soil:['#5a4a80','#463a68','#7266a0'],block:'hay',plat:'rail',haz:'thistle',water:['#3f98ff','#a0d8ff']},
 home:{sky:['#7a46c8','#ffc6e0'],sun:'sunset',far:['#c08ae0','#a874d0'],mid:'farm',home:true,grass:['#45d494','#24a56f'],soil:['#6a4fa8','#4f3a86','#8f78c8'],block:'hay',plat:'rail',haz:'thistle',water:['#3fa8ff','#a8e4ff']}
};

/* ------------------------------------------------------------------ sprites */
var PIG_TOP=["..........kk....",".........kPPk...","...kkkkkkkPPk...","..kllppppppppk..",".kllppppppppekk.","kPkpppppppppppnk","kPkppppppppppnkn".replace(/nkn$/,'nnk'),".kkppppppppppnkk","..kppppppppppk..","..kpPpppppPppk.."];
PIG_TOP[6]="kPkpppppppppnnnk";
var PIG_LEGS={idle:["...kPPkkkkPPk...","...kPk....kPk...","...kk.....kk...."],
 a:["..kPPk...kPPk...","..kPk.....kPk...","..kk.......kk..."],
 b:["....kPPkkPPk....","....kPk.kPk.....","....kk..kk......"],
 jump:["...kPPkkkkPPk...","....kk....kk....","................"]};
var PIG_PALS={pink:{k:'#4a1d4f',p:'#ff9cc2',P:'#e0609a',l:'#ffd3e6',n:'#ff6fa6',e:'#140b26'},
 purple:{k:'#2a1650',p:'#b48cff',P:'#8456d6',l:'#e4d6ff',n:'#ff8fc8',e:'#140b26'}};
var GOOSE=["................",".........kkk....","........kwwwk...","........kwekoo..","........kwwkoo..",".........kwk....",".........kwk....","..kk.....kwk....",".kwwkkkkkwwk....","kwwwwwwwwwwk....","kwggwwwwwwwk....",".kwgggwwwwk.....","..kwwwwwwk......","...kkkkkk......."];
var GOOSE_L={a:["....o...o.......","...oo..oo......."],b:[".....o.o........","....oo.oo......."]};
var DOG=["..........ddd...",".........dwwwd..","d........dwewwdd","dd..dddddddwwwwd",".dddwwwwwdddwwt.","..dwwwwwwwddd...","..ddwwwwwwwdd...","...dddddddddd..."];
var DOG_L={a:["...dw.dw..dw.dw.","...dd.dd..dd.dd."],b:["....dw.dw.dw.dw.","....dd.dd.dd.dd."]};
var FOX=["...........f..f.","..........ffffff","ww........ffeffd","fww.fffffffwwff.",".fffFffffffwww..","..ffFffffffww...","...ffffffffff..."];
var FOX_L={a:["...fd.fd..fd.fd.","...dd.dd..dd.dd."],b:["....fd.fdfd.fd..","....dd.dddd.dd.."]};
var WOLF=["............g.g.","...........gggg.","...........gegGd","g.........gggww.","gg..gggggggggw..",".gggGggggggGgg..","..gGGgggggGGgg..","..gwwggggggwwg..","...ggggggggggg.."];
var WOLF_L={a:["...gd.gd..gd.gd.","...dd.dd..dd.dd."],b:["....gd.gdgd.gd..","....dd.dddd.dd.."]};
var GOAT=["..........h.h...",".........hh.hh..","..........wwww..","..........wewwd.","w........wwwwgw.","ww.wwwwwwwwww.g.",".wwwwwwwwwwww...",".wwgwwwwwwgww...","..wwwwwwwwww...."];
var GOAT_L={a:["..wd.wd..wd.wd..","..dd.dd..dd.dd.."],b:["...wd.wdwd.wd...","...dd.dddd.dd..."]};
var HUM=["................",".....kkkkkk.....","....kccccccck...","....kcccccccckk.","....kssssssk....","....ksssseskk...","....kssssssssk..",".....kSSSSSk....","....kggggggk....","...kggggggggk...","...kgoggggogk...","...kgoooooogk...","...ksoooooosk...","...kkoooooookk..","....kooooook....","....kOOOOOOk...."];
var HUM_L={a:["....kook.kook...","....kook.kook...","....kook.kook...","....kOOk.kOOk...","....kbbk.kbbbk..","....kbbbkkbbbk..","....kkkkkkkkkk..","................"],
 b:["...kook..kook...","...kook...kook..","..kook....kook..","..kOOk....kOOk..",".kbbbk....kbbbk.",".kkkkk....kkkkk.","................","................"]};
var COOKIE=["....llll....","..llllllll..",".llcllllvll.",".llllllllll.","lllllpllllll","llvllllllcll","llllllllllll",".lllcllllll.",".lllllllvll.","..llllllll..","....llll...."];
var ROLL=["...wwwwww...",".wwvvvvvvww.","wwvwwwwwwvww","wvwwvvvvwwvw","wvwvwwwwvwvw","wvwvwvvwvwvw","wvwvwwvwvwvw","wvwwvvvwwwvw","wwvwwwwwwvww",".wwvvvvvvww.","...wwwwww..."];
var POP=["..pppp..",".phhppp.","phhppppp","phpppcpp","pcpppPpp","pppppPpp",".ppPPcp.",".pppppp.","..pppp..","...ww...","...ww...","...ww...","...ww...","...ww..."];

var ENEMY={
 goose:{w:12,h:12,body:GOOSE,legs:GOOSE_L,pal:{k:'#3a2a5a',w:'#ffffff',g:'#c8c0e0',e:'#140b26',o:'#ff5f97'},spd:.55},
 sheepdog:{w:14,h:10,body:DOG,legs:DOG_L,pal:{d:'#26203a',w:'#ffffff',e:'#140b26',t:'#ff6fa6'},spd:.9},
 dog:{w:13,h:10,body:DOG,legs:DOG_L,pal:{d:'#a49cc8',w:'#ffffff',e:'#140b26',t:'#ff6fa6'},spd:.7},
 fox:{w:14,h:9,body:FOX,legs:FOX_L,pal:{f:'#ec4a72',F:'#b8305a',w:'#ffffff',e:'#140b26',d:'#2a2438'},spd:.8},
 wolf:{w:15,h:11,body:WOLF,legs:WOLF_L,pal:{g:'#9a93b4',G:'#69618a',w:'#ece8f6',e:'#3ff0ff',d:'#2a2438'},spd:.5},
 goat:{w:14,h:11,body:GOAT,legs:GOAT_L,pal:{w:'#f6f2fc',g:'#b8b0cc',h:'#6a6080',e:'#140b26',d:'#4a4266'},spd:.35},
 farmer:{w:10,h:22,body:HUM,legs:HUM_L,pal:{k:'#2a1d3a',c:'#3a6fd8',s:'#ffcfd2',S:'#ec9cb0',e:'#140b26',g:'#2fbf71',o:'#2f5fb8',O:'#244a90',b:'#3a2a5a'},spd:.4,human:true},
 officer:{w:10,h:22,body:HUM,legs:HUM_L,pal:{k:'#1f1a30',c:'#4a5878',s:'#f6b6c4',S:'#d88aa2',e:'#140b26',g:'#a8bce0',o:'#4a5878',O:'#353f5a',b:'#1f1a30'},spd:.55,human:true}
};

/* ------------------------------------------------------------------ game */
function mount(host,api){
  api=api||{};var store=api.store||{get:function(){return null},set:function(){}};
  var reduce=!!api.reduce;
  var doc=host.ownerDocument||document;
  function el(tag,cls,html){var e=doc.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}

  /* ---- DOM ---- */
  host.innerHTML='';try{host.classList.add('pdg','pdg-farm')}catch(e){}
  var wrap=el('div','fm');host.appendChild(wrap);
  var hud=el('div','fm-hud');
  hud.innerHTML='<span class="fm-lv">LVL <b class="fm-lvn">1</b>/10</span><span class="fm-ck"><i class="fm-ckico" aria-hidden="true"></i><b class="fm-ckn">0</b></span><span class="fm-hp" aria-label="Hearts"></span><button type="button" class="fm-pause" aria-label="Pause">II</button>';
  wrap.appendChild(hud);
  var prog=el('div','fm-prog','<i></i>');wrap.appendChild(prog);
  var stage=el('div','fm-stage');wrap.appendChild(stage);
  var cv=el('canvas','fm-cv');cv.setAttribute('tabindex','0');cv.setAttribute('aria-label','Escape the Farm game');stage.appendChild(cv);
  var pad=el('div','fm-pad');
  pad.innerHTML='<div class="fm-lr"><button type="button" class="fm-key" data-k="L" aria-label="Left">◀</button><button type="button" class="fm-key" data-k="R" aria-label="Right">▶</button></div><button type="button" class="fm-key fm-jump" data-k="J" aria-label="Jump">JUMP</button>';
  wrap.appendChild(pad);
  var ov=el('div','fm-over');ov.hidden=true;wrap.appendChild(ov);
  var help=el('p','fm-help','ARROWS MOVE · SPACE JUMPS · P PAUSES');wrap.appendChild(help);
  var lvB=hud.querySelector('.fm-lvn'),ckB=hud.querySelector('.fm-ckn'),hpS=hud.querySelector('.fm-hp'),pauseB=hud.querySelector('.fm-pause'),progI=prog.firstChild||prog.querySelector('i');

  var ctx=cv.getContext('2d');
  var buf=doc.createElement('canvas');buf.width=W*SS;buf.height=H*SS;var b=buf.getContext('2d');

  /* ---- sprite factory ---- */
  function mk(rows,pal,outline){
    var h=rows.length,w=rows[0].length,o=outline?1:0;
    var c=doc.createElement('canvas');c.width=w+o*2;c.height=h+o*2;var x=c.getContext('2d');
    var r,i,ch;
    if(outline){x.fillStyle=typeof outline==='string'?outline:'#2a1d3a';
      for(r=0;r<h;r++)for(i=0;i<w;i++){ch=rows[r][i];if(pal[ch]){x.fillRect(i,r+1,1,1);x.fillRect(i+2,r+1,1,1);x.fillRect(i+1,r,1,1);x.fillRect(i+1,r+2,1,1)}}}
    for(r=0;r<h;r++)for(i=0;i<w;i++){ch=rows[r][i];if(pal[ch]){x.fillStyle=pal[ch];x.fillRect(i+o,r+o,1,1)}}
    return c}
  function padTop(rows,n){var out=[];for(var i=0;i<n;i++)out.push(new Array(rows[0].length+1).join('.'));return out.concat(rows)}
  var SPR={pig:{}};
  Object.keys(PIG_PALS).forEach(function(c){SPR.pig[c]={};['idle','a','b','jump'].forEach(function(k){SPR.pig[c][k]=mk(padTop(PIG_TOP.concat(PIG_LEGS[k]),3),PIG_PALS[c],false)})});
  var ICON={};function pigIcon(c){if(ICON[c]!=null)return ICON[c];try{ICON[c]=SPR.pig[c].idle.toDataURL()}catch(e){ICON[c]=''}return ICON[c]}
  Object.keys(ENEMY).forEach(function(k){var d=ENEMY[k];SPR[k]={a:mk(d.body.concat(d.legs.a),d.pal,!d.human&&'#2a1d3a'),b:mk(d.body.concat(d.legs.b),d.pal,!d.human&&'#2a1d3a')}});
  SPR.o=mk(COOKIE,{l:'#ffd6ec',c:'#21c8e0',v:'#9a6ae8',p:'#ff4fa8'},'#7a2a6a');
  SPR.r=mk(ROLL,{w:'#ffffff',v:'#9a6ae8'},'#5a3a8a');
  SPR.p=mk(POP,{p:'#ff4fa8',P:'#d62d84',h:'#ffd6ec',c:'#3ff0ff',w:'#ffffff'},'#5a1d4a');

  /* ---- theme art (tiles + backgrounds), cached per theme ---- */
  var ART={};
  function rng(seed){var s=seed>>>0||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%10000)/10000}}
  function cnv(w,h){var c=doc.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')]}
  function R(x,c,X,Y,w,h){x.fillStyle=c;x.fillRect(X,Y,w,h)}
  function tiles(th,seed){
    var t={},rnd=rng(seed),a,x,i,j;
    // ground top
    a=cnv(T,T);x=a[1];
    if(th.walk){R(x,th.grass[0],0,0,16,16);R(x,th.grass[1],0,0,16,1);R(x,th.grass[1],15,0,1,16);R(x,'#ffffff',0,1,15,1);R(x,th.grass[1],0,12,16,4);R(x,th.soil[0],0,13,16,3)}
    else if(th.floor){R(x,th.grass[0],0,0,16,16);for(j=0;j<16;j+=4)R(x,th.grass[1],0,j+3,16,1);R(x,th.grass[1],7,0,1,4);R(x,th.grass[1],12,4,1,4);R(x,th.grass[1],4,8,1,4);R(x,'#c9f7dd',3,2,3,1);R(x,'#c9f7dd',10,6,2,1)}
    else{R(x,th.soil[0],0,0,16,16);R(x,th.grass[0],0,0,16,5);R(x,th.grass[1],0,5,16,1);
      for(i=0;i<16;i+=2){var hgt=1+Math.floor(rnd()*3);R(x,th.grass[0],i,5,1,hgt);}
      R(x,'#ffffff',2,1,1,1);R(x,'#c8ffe6',9,0,2,1);for(i=0;i<3;i++)R(x,th.soil[2],Math.floor(rnd()*14),9+Math.floor(rnd()*6),2,1)}
    t.G=a[0];
    a=cnv(T,T);x=a[1];R(x,th.soil[0],0,0,16,16);
    for(i=0;i<5;i++)R(x,th.soil[1],Math.floor(rnd()*14),Math.floor(rnd()*15),2+Math.floor(rnd()*2),1);
    for(i=0;i<3;i++)R(x,th.soil[2],Math.floor(rnd()*15),Math.floor(rnd()*15),1,1);
    if(th.walk){R(x,th.soil[2],0,7,6,1);}
    t['#']=a[0];
    // block
    a=cnv(T,T);x=a[1];
    if(th.block==='hay'){R(x,'#9be8c4',0,0,16,16);R(x,'#c9f7dd',1,1,14,14);for(j=3;j<15;j+=3)R(x,'#a8ecc8',1,j,14,1);R(x,'#ff7fb0',0,4,16,1);R(x,'#ff7fb0',0,11,16,1);R(x,'#6fcfa0',0,15,16,1);R(x,'#6fcfa0',15,0,1,16)}
    else if(th.block==='hedge'){R(x,'#1f8f5a',0,0,16,16);for(i=0;i<14;i++)R(x,i%2?'#2fbf71':'#46d68a',Math.floor(rnd()*14),Math.floor(rnd()*14),3,2);R(x,'#7ff0b0',3,2,2,1);R(x,'#7ff0b0',10,5,2,1);R(x,'#157048',0,15,16,1)}
    else{R(x,'#a59dc4',0,0,16,16);R(x,'#c8c2e0',1,4,14,11);R(x,'#857ca8',0,15,16,1);R(x,'#2fbf71',1,1,14,3);R(x,'#ff6fa3',3,0,2,2);R(x,'#ffd6ec',8,1,2,2);R(x,'#b48cff',12,0,2,2)}
    t.H=a[0];
    // crate
    a=cnv(T,T);x=a[1];R(x,'#6f62a0',0,0,16,16);R(x,'#9a8cc4',1,1,14,14);R(x,'#b6aad8',2,2,12,2);R(x,'#6f62a0',2,7,12,1);R(x,'#6f62a0',7,2,2,12);R(x,'#b6aad8',2,12,12,1);R(x,'#ffffff',3,3,1,1);
    t.C=a[0];
    // one-way platform
    a=cnv(T,T);x=a[1];
    if(th.plat==='rail'||th.plat==='picket'){R(x,'#ffffff',0,0,16,3);R(x,'#d8d0ec',0,3,16,1);R(x,'#ffffff',2,3,2,13);R(x,'#ffffff',12,3,2,13);R(x,'#d8d0ec',4,3,1,13);R(x,'#d8d0ec',14,3,1,13);if(th.plat==='picket'){R(x,'#ffffff',7,0,2,10);}}
    else if(th.plat==='plank'){R(x,'#b2a2cf',0,0,16,4);R(x,'#8a7aaa',0,4,16,1);R(x,'#8a7aaa',5,0,1,4);R(x,'#d0c6e6',0,0,16,1);R(x,'#8a7aaa',2,5,2,6);R(x,'#8a7aaa',12,5,2,6)}
    else if(th.plat==='log'){R(x,'#6a6090',0,0,16,5);R(x,'#8a80b0',0,1,16,1);R(x,'#4f4672',0,5,16,1);R(x,'#4f4672',6,2,3,1)}
    else{for(i=0;i<16;i+=4){R(x,'#ff4fa8',i,0,2,5);R(x,'#ffffff',i+2,0,2,5)}R(x,'#d62d84',0,5,16,1);for(i=0;i<16;i+=4){R(x,'#ff4fa8',i+1,6,2,1);}}
    t['=']=a[0];
    // hazard
    a=cnv(T,T);x=a[1];
    if(th.haz==='fork'){for(i=1;i<16;i+=4){R(x,'#d8d2ea',i,4,2,10);R(x,'#ffffff',i,4,1,2);R(x,'#d8d2ea',i,3,1,1)}R(x,'#8a80b0',0,13,16,3)}
    else if(th.haz==='roses'){R(x,'#1f8f5a',1,6,14,10);for(i=0;i<8;i++)R(x,'#2fbf71',Math.floor(rnd()*13)+1,6+Math.floor(rnd()*9),2,2);for(i=0;i<6;i++)R(x,'#ffffff',1+Math.floor(rnd()*14),5+Math.floor(rnd()*10),1,1);R(x,'#ff4fa8',2,3,4,4);R(x,'#ffd6ec',3,4,1,1);R(x,'#ff4fa8',10,5,4,4);R(x,'#ff9cc8',11,6,1,1)}
    else{for(i=0;i<5;i++){var px=1+i*3;R(x,'#1f9a5a',px,8,1,8);R(x,'#2fbf71',px-1,10,3,1);R(x,'#b48cff',px-1,5,3,3);R(x,'#e0c8ff',px,5,1,1);R(x,'#ffffff',px-1,9,1,1);R(x,'#ffffff',px+1,12,1,1)}}
    t.x=a[0];
    // water (2 frames)
    t.w=[];for(var f=0;f<2;f++){a=cnv(T,T);x=a[1];R(x,th.water[0],0,0,16,16);for(i=0;i<16;i+=4)R(x,th.water[1],(i+f*2)%16,2,2,1);R(x,th.water[1],(5+f*3)%16,8,3,1);t.w.push(a[0])}
    return t}

  function bgFar(th,seed){
    var a=cnv(480,H),x=a[1],rnd=rng(seed),i,X;
    if(th.mid==='barn'){R(x,th.far[0],0,0,480,H);for(X=0;X<480;X+=12){R(x,th.far[1],X,0,1,H)}for(X=0;X<480;X+=96){R(x,'#4a1d3d',X,0,8,H);R(x,'#4a1d3d',X-40,22,96,6)}
      for(i=0;i<5;i++){X=i*96+30;x.fillStyle='rgba(255,230,245,.08)';x.beginPath();x.moveTo(X,0);x.lineTo(X+18,0);x.lineTo(X+60,H);x.lineTo(X+24,H);x.fill()}return a[0]}
    if(th.mid==='town'){for(X=0;X<480;){var bw=20+Math.floor(rnd()*30),bh=40+Math.floor(rnd()*60);R(x,th.far[i=(X/7|0)%2],X,H-bh,bw,bh);
        for(var wy=H-bh+6;wy<H-4;wy+=8)for(var wx=X+3;wx<X+bw-3;wx+=6)R(x,th.night?(rnd()<.4?'#ffd6ec':'#3a2c5e'):'#e6eefc',wx,wy,3,4);X+=bw+2}return a[0]}
    function hills(col,base,amp,f1,f2,ph){x.fillStyle=col;x.beginPath();x.moveTo(0,H);for(X=0;X<=480;X+=4){var y=base-amp*Math.sin(X/480*Math.PI*2*f1+ph)-amp*.5*Math.sin(X/480*Math.PI*2*f2+ph*2);x.lineTo(X,y)}x.lineTo(480,H);x.fill()}
    hills(th.far[0],92,14,2,5,seed%7);hills(th.far[1],108,10,3,7,seed%5+1);
    if(th.mid==='woods'){for(X=0;X<480;X+=14){var hh=40+rnd()*50;x.fillStyle='#1a1240';x.beginPath();x.moveTo(X,H);x.lineTo(X+7,H-hh-30);x.lineTo(X+14,H);x.fill()}}
    return a[0]}
  function house(x,X,base,w,h,wall,roof,night,rnd){
    R(x,wall,X,base-h,w,h);x.fillStyle=roof;x.beginPath();x.moveTo(X-3,base-h);x.lineTo(X+w/2,base-h-w*.42);x.lineTo(X+w+3,base-h);x.fill();
    R(x,'#ffffff',X,base-h,w,1);
    var lit=night?'#ffe3f2':'#9fe0ff';
    R(x,'#ffffff',X+4,base-h+6,8,7);R(x,lit,X+5,base-h+7,6,5);R(x,'#ffffff',X+w-12,base-h+6,8,7);R(x,lit,X+w-11,base-h+7,6,5);
    R(x,roof,X+w/2-4,base-13,8,13);R(x,'#ffffff',X+w/2+2,base-7,1,1)}
  function tree(x,X,base,s,c1,c2,trunk){R(x,trunk,X-1,base-s,3,s);x.fillStyle=c2;x.beginPath();x.arc(X,base-s-4,s*.7,0,7);x.fill();x.fillStyle=c1;x.beginPath();x.arc(X-2,base-s-6,s*.55,0,7);x.fill()}
  function barnShape(x,X,base,w,h){R(x,'#e8457a',X,base-h,w,h);x.fillStyle='#b8305a';x.beginPath();x.moveTo(X-4,base-h);x.lineTo(X+w*.25,base-h-w*.3);x.lineTo(X+w*.75,base-h-w*.3);x.lineTo(X+w+4,base-h);x.fill();
    R(x,'#ffffff',X+w/2-9,base-18,18,18);R(x,'#e8457a',X+w/2-8,base-17,16,16);x.strokeStyle='#ffffff';x.lineWidth=1;x.beginPath();x.moveTo(X+w/2-8,base-17);x.lineTo(X+w/2+8,base-1);x.moveTo(X+w/2+8,base-17);x.lineTo(X+w/2-8,base-1);x.stroke();
    R(x,'#ffffff',X+w/2-4,base-h+4,8,6);R(x,'#5a2349',X+w/2-3,base-h+5,6,4)}
  function bgMid(th,seed){
    var a=cnv(480,H),x=a[1],rnd=rng(seed*3+1),X,i,base=122;
    if(th.mid==='farm'){
      for(X=10;X<480;X+=160){barnShape(x,X,base,56,34);R(x,'#d8d0f0',X+70,base-52,18,52);x.fillStyle='#a89cd0';x.beginPath();x.arc(X+79,base-52,9,Math.PI,0);x.fill();R(x,'#b8acd8',X+70,base-40,18,2);R(x,'#b8acd8',X+70,base-26,18,2)}
      for(X=0;X<480;X+=40)tree(x,X+rnd()*20+100,base,10+rnd()*6,'#3fd69a','#22a874','#7a6a9a');
      if(th.home){house(x,300,base,52,30,'#ffd6ec','#b48cff',false,rnd);R(x,'#ffffff',356,base-6,40,1)}
      for(X=0;X<480;X+=8){R(x,'#ffffff',X,base-8,2,8)}R(x,'#ffffff',0,base-7,480,1);R(x,'#ffffff',0,base-4,480,1)}
    else if(th.mid==='barn'){
      for(X=0;X<480;X+=120){R(x,'#9be8c4',X+10,base-26,30,26);R(x,'#c9f7dd',X+12,base-24,26,22);R(x,'#ff7fb0',X+10,base-16,30,2);
        R(x,'#8a3a6a',X+56,base-30,40,30);R(x,'#a84a80',X+58,base-28,17,28);R(x,'#a84a80',X+77,base-28,17,28);x.strokeStyle='#ffd6ec';x.beginPath();x.moveTo(X+58,base-28);x.lineTo(X+75,base);x.moveTo(X+77,base-28);x.lineTo(X+94,base);x.stroke();
        R(x,'#b8acd8',X+104,base-70,2,70);R(x,'#b8acd8',X+114,base-70,2,70);for(i=0;i<70;i+=9)R(x,'#b8acd8',X+104,base-70+i,12,2);
        R(x,'#d8d0f0',X+40,10,1,22);R(x,'#3ff0ff',X+37,32,7,8);x.fillStyle='rgba(63,240,255,.18)';x.beginPath();x.arc(X+40,36,14,0,7);x.fill()}}
    else if(th.mid==='houses'||th.mid==='yards'){
      var walls=['#ffd6ec','#dcd0ff','#c8f5e4','#ffffff'],roofs=['#b48cff','#ff6fa3','#4fb8c8','#7a6aa8'];
      for(X=6,i=0;X<480;X+=80,i++){house(x,X,base-(th.mid==='yards'?14:0),46,28,walls[i%4],roofs[(i+1)%4],th.night,rnd);tree(x,X+64,base,12,'#3fd69a','#22a874','#7a6a9a')}
      if(th.mid==='yards'){R(x,'#8a80b0',0,base-26,480,26);for(X=0;X<480;X+=6)R(x,'#6f6698',X,base-26,1,26);R(x,'#a59dc4',0,base-27,480,2);
        for(X=40;X<480;X+=160){R(x,'#c8c0e0',X,base-60,1,34);R(x,'#c8c0e0',X+50,base-60,1,34);R(x,'#ffffff',X,base-58,50,1);R(x,'#ff9cc8',X+8,base-58,8,9);R(x,'#9fe0ff',X+22,base-58,7,11);R(x,'#ffffff',X+34,base-58,9,8)}}
      else for(X=0;X<480;X+=6)R(x,'#ffffff',X,base-8,3,8),R(x,'#ffffff',0,base-5,480,1)}
    else if(th.mid==='town'){
      var fronts=['#ff9cc8','#c6b4ff','#9fe8d0','#ffd6ec','#b8d4ff'];
      for(X=0,i=0;X<480;X+=60,i++){var hh=48+(i%3)*10,c=fronts[i%5];R(x,c,X,base-hh,58,hh);R(x,'#ffffff',X,base-hh,58,2);
        var win=th.night?'#ffe3f2':'#d8f2ff';R(x,'#ffffff',X+6,base-26,22,18);R(x,win,X+7,base-25,20,16);R(x,'#5a5478',X+36,base-24,14,24);R(x,'#ffffff',X+46,base-12,1,1);
        for(var s=0;s<58;s+=6)R(x,s%12?'#ffffff':(i%2?'#ff4fa8':'#4fb8c8'),X+s,base-34,6,6);
        R(x,'#ffffff',X+8,base-hh+8,42,8);R(x,i%2?'#ff4fa8':'#9a6ae8',X+10,base-hh+10,38,4);
        R(x,'#ffffff',X+6,base-hh+22,10,8);R(x,win,X+7,base-hh+23,8,6);R(x,'#ffffff',X+40,base-hh+22,10,8);R(x,win,X+41,base-hh+23,8,6);
        R(x,'#5a5478',X+56,base-50,2,50);R(x,th.night?'#ffe3f2':'#ffffff',X+53,base-54,8,5);if(th.night){x.fillStyle='rgba(255,214,236,.18)';x.beginPath();x.arc(X+57,base-50,16,0,7);x.fill()}}}
    else if(th.mid==='woods'){
      for(X=0;X<480;X+=22){var hgt=50+rnd()*40,cx=X+rnd()*10;x.fillStyle='#164f52';x.beginPath();x.moveTo(cx-14,base);x.lineTo(cx,base-hgt);x.lineTo(cx+14,base);x.fill();x.fillStyle='#1f6f6a';x.beginPath();x.moveTo(cx-9,base-hgt*.45);x.lineTo(cx,base-hgt);x.lineTo(cx+5,base-hgt*.45);x.fill()}
      for(i=0;i<16;i++){R(x,'#c8ff9a',Math.floor(rnd()*480),60+Math.floor(rnd()*50),1,1)}}
    else if(th.mid==='corn'){
      for(X=0;X<480;X+=5){var ch=34+rnd()*12;R(x,'#2fa865',X,base-ch,2,ch);R(x,'#1f8f5a',X-2,base-ch+8,3,1);R(x,'#45d494',X+2,base-ch+14,3,1);if(rnd()<.3)R(x,'#eaffd8',X+2,base-ch+10,2,4);R(x,'#c8a8ff',X,base-ch-2,2,2)}
      for(X=30;X<480;X+=120){R(x,'#8a80b0',X,base-90,3,90);R(x,'#8a80b0',X-8,base-84,19,2)}
      x.strokeStyle='#5a4a88';x.lineWidth=1;x.beginPath();for(X=30;X<480;X+=120){x.moveTo(X-7,base-83);x.quadraticCurveTo(X+53,base-74,X+113,base-83)}x.stroke()}
    return a[0]}
  function sky(th,seed){
    var a=cnv(W,H),x=a[1],g=x.createLinearGradient(0,0,0,H),rnd=rng(seed+9),i;
    g.addColorStop(0,th.sky[0]);g.addColorStop(1,th.sky[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
    if(th.stars)for(i=0;i<50;i++)R(x,rnd()<.3?'#3ff0ff':'#ffffff',Math.floor(rnd()*W),Math.floor(rnd()*90),1,1);
    if(th.sun==='sun'){x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(196,30,16,0,7);x.fill();x.fillStyle='#ffffff';x.beginPath();x.arc(196,30,10,0,7);x.fill()}
    else if(th.sun==='moon'){x.fillStyle='#fff4fb';x.beginPath();x.arc(190,28,10,0,7);x.fill();x.fillStyle=th.sky[0];x.beginPath();x.arc(195,25,9,0,7);x.fill()}
    else if(th.sun==='sunset'){x.fillStyle='rgba(255,214,236,.5)';x.beginPath();x.arc(170,92,26,0,7);x.fill();x.fillStyle='#ffe8f4';x.beginPath();x.arc(170,92,17,0,7);x.fill()}
    if(!th.night&&th.mid!=='barn')for(i=0;i<3;i++){var cx=20+i*80+rnd()*30,cy=18+rnd()*30;x.fillStyle='rgba(255,255,255,.85)';x.fillRect(cx,cy,26,6);x.fillRect(cx+6,cy-4,12,4)}
    return a[0]}
  function themeArt(name){if(ART[name])return ART[name];var th=TH[name],seed=name.length*97+name.charCodeAt(0);
    ART[name]={th:th,t:tiles(th,seed),far:bgFar(th,seed),mid:bgMid(th,seed),sky:sky(th,seed)};return ART[name]}

  /* ---- state ---- */
  var unlocked=Math.min(10,Math.max(1,parseInt(store.get('pdg-farm-unlocked'),10)||1));
  var best=parseInt(store.get('pdg-farm-best'),10)||0;
  var state='menu',lvI=0,lv=null,art=null,pl=null,cam=0,tick=0,cookies=0,lvStartCookies=0,won=false,parts=[],deadT=0,clearT=0,respawn=null,dead=false;
  var keys={L:false,R:false,J:false},kb={L:false,R:false,J:false},ptr={},tapT=0;
  var pigKey=store.get('pdg-farm-pig');if(!PIGS[pigKey])pigKey='pink';var Q=pigPhys(pigKey);

  function newPlayer(x,y){return {x:x,y:y,w:12,h:12,vx:0,vy:0,dir:1,ground:false,coy:0,buf:0,inv:0,big:false,anim:0,hearts:3,hold:false}}

  function tileAt(c,r){return tAt(lv,c,r)}
  function moveBody(o,oneWay){return moveBodyLv(lv,o,oneWay)}

  /* ---- physics ---- */
  function stepPlayer(){
    var p=pl;if(tapT>0)tapT--;
    var res=physStep(lv,p,{L:keys.L||kb.L,R:keys.R||kb.R,J:keys.J||kb.J||tapT>0},Q);
    if(res.jumped)puff(p.x+p.w/2,p.y+p.h,3,'#ffffff');
    if(res.head&&lv.grid[res.head.r][res.head.c]==='C'){
      if(p.big){lv.grid[res.head.r][res.head.c]='.';crateBits(res.head.c*T+8,res.head.r*T+8);cookies++;hudCk()}
      else puff(res.head.c*T+8,res.head.r*T+16,3,'#b6aad8')}
    if(p.inv>0)p.inv--;
    p.anim+=Math.abs(p.vx)*.12;
    // hazards
    var l=Math.floor((p.x+3)/T),r2=Math.floor((p.x+p.w-3)/T),t1=Math.floor((p.y+3)/T),b1=Math.floor((p.y+p.h-2)/T),c,r;
    for(c=l;c<=r2;c++)for(r=t1;r<=b1;r++)if(tileAt(c,r)==='x'){hurt(c*T+8);break}
    // pit
    if(p.y>H+10)fall();
  }
  function setBig(on){var p=pl,cx=p.x+p.w/2,bt=p.y+p.h;p.big=on;p.w=on?16:12;p.h=on?19:12;p.x=cx-p.w/2;p.y=bt-p.h}
  function hurt(fromX){var p=pl;if(p.inv>0||state!=='play')return;
    if(p.big){setBig(false);p.inv=100;puff(p.x+6,p.y,8,'#ff9cc2');p.vy=-2;return}
    p.hearts--;hudHp();p.inv=110;p.vy=-2.6;p.vx=(p.x+p.w/2<fromX?-1:1)*1.6;puff(p.x+6,p.y+6,10,'#ff4fa8');
    if(p.hearts<=0)die()}
  function fall(){var p=pl;p.hearts--;hudHp();if(p.big)setBig(false);
    if(p.hearts<=0){die(true);return}
    var cp=respawn;p.x=cp.x-p.w/2;p.y=cp.y-p.h-1;p.vx=0;p.vy=0;p.inv=110;cam=Math.max(0,Math.min(lv.w*T-W,p.x-96))}
  function die(pit){state='dying';deadT=0;pl.vy=pit?0:-3.5;pl.vx=0}

  /* ---- enemies ---- */
  function makeEnemies(){lv.ens=lv.enemies.map(function(d){var D=ENEMY[d.type];return {type:d.type,D:D,w:D.w,h:D.h,x:d.tx+(T-D.w)/2,y:d.ty-D.h,vx:-D.spd,vy:0,dir:-1,st:'walk',t:0,cd:0,anim:0,ground:false,alive:true,ko:0}})}
  function ledgeAhead(e){var fx=e.dir>0?e.x+e.w+1:e.x-1,c=Math.floor(fx/T),r=Math.floor((e.y+e.h+2)/T);var t=tileAt(c,r);return !(SOLID[t]||t==='=')}
  function stepEnemy(e){
    if(!e.alive)return;
    if(e.ko){e.ko++;e.vy+=P.grav;e.y+=e.vy;if(e.y>H+40)e.alive=false;return}
    var D=e.D,p=pl,dx=(p.x+p.w/2)-(e.x+e.w/2),dy=(p.y+p.h)-(e.y+e.h),adx=Math.abs(dx),facing=Math.sign(dx)===e.dir;
    if(Math.abs(e.x-p.x)>W*1.2){return}           // asleep until near the camera
    if(e.cd>0)e.cd--;e.t++;
    var spd=D.spd;
    switch(e.type){
      case 'goose':if(adx<70&&Math.abs(dy)<20){e.dir=Math.sign(dx)||e.dir;spd=1.15}break;
      case 'sheepdog':if(adx<90&&Math.abs(dy)<24){e.dir=Math.sign(dx)||e.dir;spd=1.6}break;
      case 'dog':if(e.ground&&e.t%70===0)e.vy=-2.6;break;
      case 'fox':if(e.ground&&e.cd===0&&adx<80&&Math.abs(dy)<30){e.dir=Math.sign(dx)||e.dir;e.vy=-3;e.st='hop';e.cd=60}
        if(e.st==='hop')spd=1.6;if(e.ground&&e.st==='hop'&&e.vy>=0&&e.cd<55)e.st='walk';break;
      case 'wolf':
        if(e.st==='walk'&&e.cd===0&&adx<100&&Math.abs(dy)<30&&e.ground){e.st='crouch';e.t=0;e.dir=Math.sign(dx)||e.dir}
        if(e.st==='crouch'){spd=0;if(e.t>18){e.st='pounce';e.vy=-3.6}}
        else if(e.st==='pounce'){spd=2.2;if(e.ground&&e.vy>=0&&e.t>22){e.st='walk';e.cd=80}}
        break;
      case 'goat':
        if(e.st==='walk'&&e.cd===0&&facing&&adx<100&&Math.abs(dy)<14){e.st='wind';e.t=0}
        if(e.st==='wind'){spd=0;if(e.t>22){e.st='charge';e.t=0}}
        else if(e.st==='charge'){spd=2.1;if(e.t>70){e.st='walk';e.cd=50}}
        break;
      default: // farmer, officer
        var range=e.type==='officer'?44:36;
        if(e.st==='walk'&&e.cd===0&&facing&&adx<range&&Math.abs(dy)<20){e.st='lunge';e.t=0}
        if(e.st==='lunge'){spd=e.t<10?0:(e.t<20?1.2:0);if(e.t>32){e.st='walk';e.cd=60}}
    }
    var turn=false;
    if(e.ground&&ledgeAhead(e)&&e.st!=='hop'&&e.st!=='pounce')turn=true;
    e.vx=spd*e.dir;
    e.vy+=P.grav;if(e.vy>P.maxFall)e.vy=P.maxFall;
    var res=moveBody(e,true);
    if(res.hitX)turn=true;
    if(turn){if(e.st==='charge'){e.st='walk';e.cd=50}e.dir*=-1}
    if(e.y>H+20)e.alive=false;
    e.anim+=Math.abs(e.vx)*.15+.02;
    // contact with pig
    if(state!=='play')return;
    var ov=overlap(p,e);
    if(ov){
      if(p.vy>0&&(p.y+p.h)-e.y<9){e.ko=1;e.vy=-2;cookies+=0;p.vy=p.hold?Q.jump*.95:P.bounce;puff(e.x+e.w/2,e.y,8,'#ffffff');stars(e.x+e.w/2,e.y)}
      else hurt(e.x+e.w/2)}
    else if(D.human&&e.st==='lunge'&&e.t>=8&&e.t<=26){
      var nx=e.dir>0?e.x+e.w:e.x-16,net={x:nx,y:e.y+4,w:16,h:12};if(overlap(p,net))hurt(e.x+e.w/2)}
  }
  function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

  /* ---- particles ---- */
  function puff(x,y,n,c){if(reduce)n=Math.min(n,3);for(var i=0;i<n;i++)parts.push({x:x,y:y,vx:(Math.random()-.5)*2,vy:-Math.random()*1.6,l:30+Math.random()*20,c:c,s:1+(Math.random()<.4?1:0)})}
  function stars(x,y){for(var i=0;i<5;i++)parts.push({x:x,y:y,vx:Math.cos(i*1.26)*1.4,vy:Math.sin(i*1.26)*1.4-1,l:36,c:i%2?'#3ff0ff':'#ffd6ec',s:2})}
  function crateBits(x,y){for(var i=0;i<8;i++)parts.push({x:x,y:y,vx:(Math.random()-.5)*3,vy:-1-Math.random()*2.5,l:50,c:i%2?'#9a8cc4':'#6f62a0',s:3,g:1})}
  function stepParts(){for(var i=parts.length-1;i>=0;i--){var q=parts[i];q.x+=q.vx;q.y+=q.vy;q.vy+=q.g?.18:.04;if(--q.l<=0)parts.splice(i,1)}}

  /* ---- items, checkpoints, goal ---- */
  function stepItems(){var p=pl;
    lv.items.forEach(function(it){if(it.got)return;var box={x:it.x-6,y:it.y-6,w:12,h:12};if(it.t==='p')box={x:it.x-5,y:it.y-7,w:10,h:14};
      if(overlap(p,box)){it.got=true;
        if(it.t==='o'){cookies+=1;puff(it.x,it.y,4,'#ffd6ec')}
        else if(it.t==='r'){cookies+=5;puff(it.x,it.y,8,'#ffffff')}
        else{if(!p.big)setBig(true);p.inv=Math.max(p.inv,30);stars(it.x,it.y);puff(it.x,it.y,10,'#ff4fa8')}
        hudCk()}});
    lv.chks.forEach(function(k){if(!k.on&&p.x+p.w>k.x-4&&p.x<k.x+4){k.on=true;respawn={x:k.x,y:k.y};puff(k.x,k.y-20,8,'#3ff0ff')}});
    if(p.x+p.w/2>=lv.goal.x+26&&state==='play'){state='clearing';clearT=0}}

  /* ---- drawing ---- */
  function draw(){
    var A=art,th=A.th,cx=Math.round(cam);
    b.setTransform(SS,0,0,SS,0,0);b.imageSmoothingEnabled=false;
    b.drawImage(A.sky,0,0);
    var f=-((cx*.25)%480);b.drawImage(A.far,f,0);b.drawImage(A.far,f+480,0);
    var m=-((cx*.55)%480);b.drawImage(A.mid,m,0);b.drawImage(A.mid,m+480,0);
    drawGoal(lv.goal.x-cx,lv.goal.y,lv.goalType,th);
    var c0=Math.floor(cx/T),c1=c0+Math.ceil(W/T)+1,c,r,t,img;
    for(r=0;r<ROWS;r++)for(c=c0;c<=c1&&c<lv.w;c++){t=lv.grid[r][c];if(t==='.')continue;
      if(t==='w'){img=A.t.w[(tick>>4)&1];if(r>0&&lv.grid[r-1][c]!=='w'){b.drawImage(img,c*T-cx,r*T+4,T,T-4)}else b.drawImage(img,c*T-cx,r*T)}
      else if(t==='G'&&r>0&&tileAt(c,r-1)==='G'){b.drawImage(A.t['#'],c*T-cx,r*T)}
      else{img=A.t[t];if(img)b.drawImage(img,c*T-cx,r*T)}}
    lv.chks.forEach(function(k){var x=k.x-cx;if(x<-20||x>W+20)return;R(b,'#d8d0ec',x,k.y-26,2,26);R(b,'#8a80b0',x-3,k.y-2,8,2);
      var bob=reduce?0:Math.sin(tick/20)*1.5,col=k.on?'#3ff0ff':'#ff4fa8';b.strokeStyle='#ffffff';b.lineWidth=.5;b.beginPath();b.moveTo(x+1,k.y-26);b.lineTo(x+1,k.y-30+bob);b.stroke();
      b.fillStyle=col;b.beginPath();b.ellipse(x+1,k.y-36+bob,5,6.5,0,0,7);b.fill();R(b,'#ffffff',x-1,k.y-40+bob,2,2);R(b,col,x,k.y-30+bob,2,1)});
    lv.items.forEach(function(it){if(it.got)return;var x=it.x-cx;if(x<-16||x>W+16)return;var bob=reduce?0:Math.round(Math.sin((tick+it.x)/14)*1.5),s=SPR[it.t];
      if(it.t==='o')b.drawImage(s,x-5,it.y-5+bob,10,10);else b.drawImage(s,x-s.width/2,it.y-s.height/2+bob)});
    lv.ens.forEach(function(e){if(!e.alive)return;var x=e.x-cx;if(x<-30||x>W+30)return;drawEnemy(e,x)});
    drawPig();
    parts.forEach(function(q){R(b,q.c,q.x-cx,q.y,q.s,q.s)});
    if(th.night){b.fillStyle='rgba(20,8,50,.18)';b.fillRect(0,0,W,H)}
    // to screen
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(buf,0,0,cv.width,cv.height)}
  function drawEnemy(e,x){
    var s=SPR[e.type],img=(Math.floor(e.anim)%2)?s.b:s.a,D=e.D;
    var iw=img.width,ih=img.height,dx=x+e.w/2-iw/2,dy=e.y+e.h-ih+(D.human?1:1);
    b.save();
    if(e.ko){b.translate(dx+iw/2,dy+ih/2);b.scale(e.dir>0?1:-1,-1);b.drawImage(img,-iw/2,-ih/2)}
    else{
      var sq=(e.st==='crouch'||e.st==='wind')?1:0;
      if(e.dir<0){b.translate(dx+iw,dy+sq);b.scale(-1,1);b.drawImage(img,0,0,iw,ih-sq)}else{b.translate(dx,dy+sq);b.drawImage(img,0,0,iw,ih-sq)}
    }
    b.restore();
    if(D.human&&!e.ko){ // net on a pole
      var hx=x+e.w/2+e.dir*5,hy=e.y+12,ext=e.st==='lunge'&&e.t>=8&&e.t<=26;
      b.strokeStyle='#d8d0ec';b.lineWidth=1;b.beginPath();
      var ex=ext?hx+e.dir*18:hx+e.dir*4,ey=ext?hy-2:hy-16;b.moveTo(hx,hy);b.lineTo(ex,ey);b.stroke();
      b.strokeStyle='#ffffff';b.beginPath();b.ellipse(ex+e.dir*4,ey-(ext?0:4),5,ext?5:4,0,0,7);b.stroke();
      b.strokeStyle='rgba(255,255,255,.55)';b.beginPath();b.moveTo(ex+e.dir*4-4,ey-(ext?0:4));b.lineTo(ex+e.dir*4+4,ey-(ext?0:4));b.moveTo(ex+e.dir*4,ey-(ext?5:8));b.lineTo(ex+e.dir*4,ey+(ext?5:0));b.stroke()}
    if(e.st==='crouch'||e.st==='wind'){R(b,'#ffffff',x+e.w/2-1,e.y-8,2,4);R(b,'#ffffff',x+e.w/2-1,e.y-3,2,1)}
  }
  function drawPig(){
    var p=pl;if(!p)return;if(p.inv>0&&state==='play'&&(p.inv>>2)%2)return;
    var k=!p.ground?'jump':(Math.abs(p.vx)>.15?((Math.floor(p.anim)%2)?'a':'b'):'idle'),img=SPR.pig[pigKey][k];
    var sc=p.big?1.5:1,iw=16*sc,ih=16*sc,dx=Math.round((p.x+p.w/2-iw/2-cam)*2)/2,dy=p.y+p.h-ih+ (p.big?0:0);
    b.save();
    if(state==='dying'){b.translate(dx+iw/2,dy+ih/2);b.scale(p.dir,-1);b.drawImage(img,-iw/2,-ih/2,iw,ih)}
    else if(p.dir<0){b.translate(dx+iw,dy);b.scale(-1,1);b.drawImage(img,0,0,iw,ih)}
    else b.drawImage(img,dx,dy,iw,ih);
    b.restore()}
  function sign(x,base,label){R(b,'#8a80b0',x+18,base-34,3,34);b.fillStyle='#d8d0ec';b.beginPath();b.moveTo(x,base-40);b.lineTo(x+36,base-40);b.lineTo(x+44,base-33);b.lineTo(x+36,base-26);b.lineTo(x,base-26);b.fill();
    R(b,'#ffffff',x,base-40,36,1);b.fillStyle='#4a2a6a';b.font='8px Silkscreen, monospace';b.textBaseline='middle';b.textAlign='left';b.fillText(label,x+4,base-32.5)}
  function drawGoal(x,base,type,th){
    if(x<-120||x>W+20)return;
    if(type==='barn'){var w=88,h=56;R(b,'#e8457a',x,base-h,w,h);b.fillStyle='#b8305a';b.beginPath();b.moveTo(x-6,base-h);b.lineTo(x+w*.22,base-h-26);b.lineTo(x+w*.78,base-h-26);b.lineTo(x+w+6,base-h);b.fill();
      R(b,'#ffffff',x,base-h,w,2);R(b,'#ffffff',x+30,base-36,30,36);R(b,'#2a1030',x+32,base-34,26,34);R(b,'#ffffff',x+38,base-h-14,12,10);R(b,'#5a2349',x+40,base-h-12,8,6);
      R(b,'#c9f7dd',x+36,base-8,18,8);R(b,'#ff7fb0',x+36,base-5,18,1)}
    else if(type==='barnout'){R(b,'#4a1d3d',x+18,base-70,64,70);R(b,'#dff7ff',x+24,base-64,52,64);
      var g=b.createLinearGradient(0,base-64,0,base);g.addColorStop(0,'#9fe0ff');g.addColorStop(.75,'#e6fbff');g.addColorStop(.76,'#45d494');g.addColorStop(1,'#24a56f');b.fillStyle=g;b.fillRect(x+24,base-64,52,64);
      R(b,'#ffffff',x+60,base-56,8,8);b.fillStyle='rgba(255,255,240,.15)';b.beginPath();b.moveTo(x+24,base-64);b.lineTo(x+76,base-64);b.lineTo(x+40,base);b.lineTo(x-10,base);b.fill();
      R(b,'#a84a80',x+6,base-66,14,66);R(b,'#a84a80',x+80,base-66,14,66)}
    else if(type==='gate'){R(b,'#ffffff',x+10,base-30,4,30);R(b,'#ffffff',x+54,base-30,4,30);R(b,'#ffffff',x+14,base-26,10,2);R(b,'#ffffff',x+14,base-14,10,2);
      for(var i=0;i<3;i++)R(b,'#ffffff',x+58+i*5,base-28+i*2,2,28-i*2);R(b,'#ffffff',x+58,base-26,14,2);R(b,'#ffffff',x+58,base-14,14,2);
      R(b,'#ff4fa8',x+30,base-50,10,12);R(b,'#ffffff',x+32,base-48,2,2);R(b,'#ffffff',x+34,base-38,1,8)}
    else if(type==='signTown')sign(x,base,'TOWN');
    else if(type==='signHome')sign(x,base,'HOME');
    else if(type==='bakery'){var bw=110,bh=74;R(b,'#ffd6ec',x,base-bh,bw,bh);R(b,'#ffffff',x,base-bh,bw,3);
      R(b,'#ff4fa8',x+6,base-bh+8,bw-12,16);R(b,'#ffffff',x+8,base-bh+10,bw-16,12);b.fillStyle='#d62d84';b.font='8px "Press Start 2P", Silkscreen, monospace';b.textAlign='center';b.textBaseline='middle';b.fillText('PIGGY DIPPER',x+bw/2,base-bh+16.5);
      for(var s=0;s<bw;s+=8)R(b,(s/8)%2?'#ffffff':'#ff4fa8',x+s,base-46,8,8);for(s=0;s<bw;s+=8){b.fillStyle=(s/8)%2?'#ffffff':'#ff4fa8';b.beginPath();b.arc(x+s+4,base-38,4,0,Math.PI);b.fill()}
      R(b,'#ffffff',x+8,base-32,46,26);R(b,'#e6f6ff',x+10,base-30,42,22);
      for(i=0;i<4;i++){R(b,'#ffffff',x+15+i*10,base-14,1,6);R(b,i%2?'#b48cff':'#ff4fa8',x+13+i*10,base-21,5,7)}
      R(b,'#c8f0ff',x+10,base-10,42,2);R(b,'#ff4fa8',x+66,base-34,30,34);R(b,'#ffd6ec',x+69,base-31,24,28);R(b,'#ff4fa8',x+88,base-17,2,2);
      R(b,'#ffffff',x+bw-14,base-bh+28,8,8);R(b,'#3ff0ff',x+bw-12,base-bh+30,4,4)}
    else if(type==='home'){R(b,'#ffd6ec',x,base-46,62,46);b.fillStyle='#b48cff';b.beginPath();b.moveTo(x-5,base-46);b.lineTo(x+31,base-72);b.lineTo(x+67,base-46);b.fill();R(b,'#ffffff',x,base-46,62,2);
      R(b,'#ffffff',x+6,base-36,14,12);R(b,'#ffe3f2',x+7,base-35,12,10);R(b,'#9a6ae8',x+38,base-28,14,28);R(b,'#ffffff',x+48,base-14,1,1);
      for(i=0;i<5;i++)R(b,'#ffffff',x+70+i*8,base-14,2,14);R(b,'#ffffff',x+70,base-11,34,1);R(b,'#ffffff',x+70,base-5,34,1);
      b.fillStyle='#ff4fa8';b.beginPath();b.arc(x+84,base-24,3,0,7);b.arc(x+89,base-24,3,0,7);b.fill();b.beginPath();b.moveTo(x+81,base-23);b.lineTo(x+86.5,base-17);b.lineTo(x+92,base-23);b.fill()}
  }

  /* ---- HUD ---- */
  function hudHp(){var n=pl?Math.max(0,pl.hearts):3,s='';for(var i=0;i<3;i++)s+='<i class="fm-h'+(i<n?'':' fm-off')+'" aria-hidden="true"></i>';hpS.innerHTML=s;hpS.setAttribute('aria-label',n+' hearts')}
  function hudCk(){ckB.textContent=String(cookies)}
  function hudLv(){lvB.textContent=String(lvI+1)}
  function hudProg(){if(!lv||!pl)return;var f=Math.max(0,Math.min(1,(pl.x-lv.start.x)/(lv.goal.x+26-lv.start.x)));progI.style.width=(f*100).toFixed(1)+'%'}

  /* ---- overlays ---- */
  function btn(label,act,cls){return '<button type="button" class="fm-btn'+(cls?' '+cls:'')+'" data-act="'+act+'">'+label+'</button>'}
  function showOv(html){ov.innerHTML=html;ov.hidden=false;wrap.classList.remove('fm-live');pauseB.classList.add('fm-off');
    var f=ov.querySelector('button:not([disabled])');if(f)try{f.focus({preventScroll:true})}catch(e){}}
  function hideOv(){ov.hidden=true;ov.innerHTML='';wrap.classList.add('fm-live');pauseB.classList.remove('fm-off');try{cv.focus({preventScroll:true})}catch(e){}}
  function menu(){state='menu';
    var h='<h3 class="fm-title">ESCAPE<br>THE FARM</h3><p class="fm-sub">Get to the bakery, then home!</p>';
    h+='<p class="fm-legend"><span><i class="fm-ico fm-ico-o"></i>1</span><span><i class="fm-ico fm-ico-r"></i>5</span><span><i class="fm-ico fm-ico-p"></i>BIG PIG</span></p>';
    h+='<div class="fm-pigs" role="group" aria-label="Pick your pig">';
    Object.keys(PIGS).forEach(function(k){var sel=k===pigKey,ic=pigIcon(k);h+='<button type="button" class="fm-pigb'+(sel?' fm-sel':'')+'" data-pig="'+k+'" aria-pressed="'+sel+'">'+(ic?'<img src="'+ic+'" alt="" width="32" height="32">':'')+'<span><b>'+PIGS[k].name+'</b><em>'+PIGS[k].trait+'</em></span></button>'});
    h+='</div><p class="fm-pick">PICK A LEVEL</p><div class="fm-lvs">';
    for(var i=0;i<10;i++){var lock=i>=unlocked;h+='<button type="button" class="fm-lvb" data-lv="'+i+'"'+(lock?' disabled aria-label="Level '+(i+1)+' locked"':' aria-label="Level '+(i+1)+'"')+'>'+(lock?'<i aria-hidden="true">■</i>':(i+1))+'</button>'}
    h+='</div><p class="fm-best">BEST '+best+'</p>';showOv(h);drawPreview()}
  function intro(i,keepCookies){lvI=i;lv=buildLevel(i);art=themeArt(lv.theme);makeEnemies();
    if(!keepCookies)cookies=0;lvStartCookies=cookies;
    pl=newPlayer(lv.start.x,lv.start.y);respawn={x:lv.start.x+6,y:lv.start.y+12};cam=0;parts=[];tick=0;Q=pigPhys(pigKey);tapT=0;
    hudLv();hudHp();hudCk();hudProg();state='intro';
    var h='<p class="fm-big">LEVEL '+(i+1)+'</p><p class="fm-place">'+lv.name+'</p>';
    h+='<p class="fm-note">'+(i===4?'Reach the Piggy Dipper Bakery!':(i===9?'Make it all the way home!':(i<4?'Escape to the next stop.':'Head back home.')))+'</p>';
    h+=btn('GO!','go','fm-go');showOv(h);draw()}
  function clearScreen(){
    var i=lvI;cookies+=0;
    if(cookies>best){best=cookies;store.set('pdg-farm-best',String(best))}
    if(i<9&&unlocked<i+2){unlocked=i+2;store.set('pdg-farm-unlocked',String(unlocked))}
    if(i===9){state='final';showOv('<p class="fm-big fm-gold">YOU BEAT<br>ALL 10!</p><p class="fm-place">THE PIG MADE IT HOME</p><p class="fm-note">Cookies: '+cookies+'</p>'+btn('PLAY AGAIN','again','fm-go')+btn('LEVELS','levels'));return}
    state='clear';
    var h='<p class="fm-big'+(i===4?' fm-gold':'')+'">LEVEL '+(i+1)+'<br>CLEAR!</p>';
    if(i===4)h+='<p class="fm-place">YOU MADE IT TO THE<br>PIGGY DIPPER BAKERY!</p><p class="fm-note">Now get the pig back home.</p>';
    h+='<p class="fm-note">Cookies: '+cookies+'</p>'+btn('NEXT LEVEL','next','fm-go')+btn('LEVELS','levels');
    showOv(h);
    if(i===4&&!won){won=true;try{api.win&&api.win('farm',cookies)}catch(e){}}}
  function overScreen(){state='over';showOv('<p class="fm-big">CAUGHT!</p><p class="fm-note">Cookies: '+cookies+'</p>'+btn('TRY AGAIN','retry','fm-go')+btn('LEVELS','levels'))}
  function pauseScreen(){showOv('<p class="fm-big">PAUSED</p>'+btn('RESUME','resume','fm-go')+btn('LEVELS','levels'))}
  function drawPreview(){if(!lv){lv=buildLevel(0);art=themeArt(lv.theme);makeEnemies();pl=newPlayer(lv.start.x,lv.start.y)}draw()}

  ov.addEventListener('click',function(e){var t=e.target.closest?e.target.closest('button'):null;if(!t||t.disabled)return;
    var pg=t.getAttribute('data-pig');if(pg&&PIGS[pg]){pigKey=pg;Q=pigPhys(pigKey);store.set('pdg-farm-pig',pigKey);menu();var sb=ov.querySelector('.fm-sel');if(sb)try{sb.focus({preventScroll:true})}catch(_){}return}
    var lvAttr=t.getAttribute('data-lv');if(lvAttr!=null){intro(+lvAttr,false);return}
    var a=t.getAttribute('data-act');
    if(a==='go'){hideOv();state='play';last=now();kick()}
    else if(a==='next')intro(lvI+1,true);
    else if(a==='retry'){cookies=lvStartCookies;intro(lvI,true)}
    else if(a==='again')intro(0,false);
    else if(a==='levels')menu();
    else if(a==='resume'){hideOv();state='play';last=now();kick()}});
  pauseB.addEventListener('click',function(){pause()});

  /* ---- input ---- */
  function now(){return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now()}
  var KEYS={ArrowLeft:'L',a:'L',A:'L',ArrowRight:'R',d:'R',D:'R',' ':'J',ArrowUp:'J',w:'J',W:'J',z:'J',Z:'J'};
  function onKey(e){
    var ae=doc.activeElement,mine=(wrap.contains&&ae&&wrap.contains(ae))||((!ae||ae===doc.body)&&state==='play');
    if(!mine)return;
    if(e.type==='keydown'&&(e.key==='p'||e.key==='P'||e.key==='Escape')){
      if(state==='play'){e.preventDefault();pause()}else if(state==='paused'&&e.key!=='Escape'){e.preventDefault();hideOv();state='play';last=now();kick()}return}
    var k=KEYS[e.key];if(!k)return;
    if(state==='play'){e.preventDefault();kb[k]=e.type==='keydown'}else if(e.type==='keyup')kb[k]=false}
  doc.addEventListener('keydown',onKey);doc.addEventListener('keyup',onKey);
  function keyFromPoint(x,y,target){
    var elx=null;try{elx=doc.elementFromPoint?doc.elementFromPoint(x,y):null}catch(e){}
    var bt=(elx&&elx.closest)?elx.closest('.fm-key'):null;if(!bt&&target&&target.closest)bt=target.closest('.fm-key');
    return bt&&pad.contains(bt)?bt.getAttribute('data-k'):null}
  function syncKeys(){keys.L=false;keys.R=false;keys.J=false;for(var id in ptr)if(ptr[id])keys[ptr[id]]=true;
    [].forEach.call(pad.querySelectorAll('.fm-key'),function(bt){bt.classList.toggle('on',!!keys[bt.getAttribute('data-k')])})}
  function pDown(e){var k=keyFromPoint(e.clientX,e.clientY,e.target);if(!k)return;e.preventDefault();try{pad.setPointerCapture(e.pointerId)}catch(_){}
    ptr[e.pointerId]=k;syncKeys()}
  function pMove(e){if(!(e.pointerId in ptr))return;var k=keyFromPoint(e.clientX,e.clientY,null);
    // jump stays held while that finger is down; left/right follow the finger
    if(ptr[e.pointerId]==='J')return;if(k&&k!=='J'&&k!==ptr[e.pointerId]){ptr[e.pointerId]=k;syncKeys()}}
  function pUp(e){if(!(e.pointerId in ptr))return;delete ptr[e.pointerId];syncKeys()}
  pad.addEventListener('pointerdown',pDown);pad.addEventListener('pointermove',pMove);pad.addEventListener('pointerup',pUp);pad.addEventListener('pointercancel',pUp);pad.addEventListener('lostpointercapture',pUp);
  pad.addEventListener('contextmenu',function(e){e.preventDefault()});
  // stop the page from scrolling or zooming while playing (iOS Safari)
  function tBlock(e){
    var onPad=pad.contains(e.target);
    if(onPad){e.preventDefault();return}
    if(state!=='play')return;
    if(e.target&&e.target.closest&&e.target.closest('button'))return;
    e.preventDefault()}
  wrap.addEventListener('touchstart',tBlock,{passive:false});wrap.addEventListener('touchmove',tBlock,{passive:false});
  // tapping the canvas jumps too (handy on tablets)
  cv.addEventListener('pointerdown',function(e){if(state!=='play')return;e.preventDefault();tapT=10});

  /* ---- loop ---- */
  var raf=0,last=0,acc=0;
  function kick(){if(!raf&&!dead)raf=requestAnimationFrame(loop)}
  function loop(ts){raf=0;if(dead)return;
    var t=now(),dt=Math.min(500,Math.max(0,t-last));last=t;acc+=dt;var steps=0;
    while(acc>=1000/60&&steps<40){acc-=1000/60;steps++;step()}
    if(steps>=40)acc=0;
    draw();hudProg();
    if(state==='play'||state==='dying'||state==='clearing')raf=requestAnimationFrame(loop)}
  function step(){tick++;
    if(state==='play'){stepPlayer();if(state==='play'||state==='dying'){lv.ens.forEach(stepEnemy);stepItems()}}
    else if(state==='dying'){deadT++;pl.vy+=P.grav;pl.y+=pl.vy;lv.ens.forEach(function(e){if(e.ko)stepEnemy(e)});if(deadT>70){overScreen();return}}
    else if(state==='clearing'){clearT++;pl.vx=.8;pl.dir=1;pl.vy+=P.grav;moveBody(pl,true);pl.anim+=.1;if(clearT>45){clearScreen();return}}
    stepParts();
    var target=Math.max(0,Math.min(lv.w*T-W,pl.x+pl.w/2-104));cam+=(target-cam)*.18;if(Math.abs(target-cam)<.05)cam=target}

  /* ---- pause / sizing / visibility ---- */
  function pause(){if(state!=='play')return;state='paused';ptr={};syncKeys();kb={L:false,R:false,J:false};pauseScreen()}
  function size(){var w=stage.clientWidth||host.clientWidth||340;if(!w)return;var h=Math.round(w*H/W);
    var dpr=Math.min(2,(typeof window!=='undefined'&&window.devicePixelRatio)||1);
    cv.style.height=h+'px';stage.style.height=h+'px';ov.style.top=(stage.offsetTop||0)+'px';cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);if(lv)draw()}
  var ro=null,io=null;
  if(typeof ResizeObserver!=='undefined'){ro=new ResizeObserver(function(){size()});ro.observe(stage)}
  else if(typeof addEventListener!=='undefined')addEventListener('resize',size);
  if(typeof IntersectionObserver!=='undefined'){io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)pause()})},{threshold:.25});io.observe(stage)}
  function onVis(){if(doc.hidden)pause()}
  doc.addEventListener('visibilitychange',onVis);
  function refont(){if(lv)draw()}
  try{if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(refont)}catch(e){}

  size();menu();

  return {
    pause:pause,
    destroy:function(){dead=true;if(raf)cancelAnimationFrame(raf);raf=0;
      if(ro)ro.disconnect();else if(typeof removeEventListener!=='undefined')removeEventListener('resize',size);if(io)io.disconnect();
      doc.removeEventListener('visibilitychange',onVis);doc.removeEventListener('keydown',onKey);doc.removeEventListener('keyup',onKey);
      host.innerHTML=''},
    _test:{state:function(){return state},level:function(){return lvI},
      finish:function(){if(state!=='play')return;pl.x=lv.goal.x+30;state='clearing';clearT=0},
      player:function(){return pl},lv:function(){return lv},step:function(n){for(var i=0;i<n;i++)step()},keys:kb}
  };
}

window.PDGames.farm={id:'farm',title:'Escape the Farm',blurb:'Run, jump and get the pig to the bakery.',mount:mount,
  _t:{LEVELS:LEVELS,CH:CH,buildLevel:buildLevel,reach:reach,P:P,PIGS:PIGS,pigPhys:pigPhys,simGap:simGap,gapTable:gapTable,SAFE_TBL:SAFE_TBL}};
})();
