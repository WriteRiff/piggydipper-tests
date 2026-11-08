(function(){
'use strict';
window.PDGames = window.PDGames || {};

/* ===== Treat Stack: falling bakery pieces on a cooling rack ===== */
const COLS = 10, ROWS = 16;
/* 10 levels: rows to clear, seconds per row, leftover rows at the start */
const NLV = 10;
const TARGETS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const SPEED = [1.00, 0.80, 0.68, 0.58, 0.50, 0.43, 0.37, 0.32, 0.28, 0.25];
const JUNK = [0, 0, 0, 0, 0, 0, 1, 2, 2, 3];

/* Look of the L-shaped piece and its mirror. 0 = piping bag (now).
   1 = candy cane, 2 = cake pop & cookie, 3 = cookie stack, 4 = dipping spoon, 5 = mini rolls.
   Change this one number to swap the look. */
const L_STYLE = 0;
const L_NAMES = ['Piping bag', 'Candy cane', 'Cake pop & cookie', 'Cookie stack', 'Dipping spoon', 'Mini rolls'];
const LINE_PTS = [0, 100, 300, 500, 800];

/* cake pop coatings: base, highlight/drizzle, shade */
const POPC = [
  ['#ff4fa8', '#ffd6ec', '#c2307f'],
  ['#b48cff', '#efe3ff', '#7d52d6'],
  ['#3ff0ff', '#d9fdff', '#1fa8c4'],
  ['#ffd6ec', '#ffffff', '#ff8cc6']
];
const SPRINK = ['#3ff0ff', '#9dff4f', '#ffffff', '#b48cff', '#ff4fa8'];

/* canonical shapes (cells as [x,y]) */
const SHAPES = {
  pretzel: { cells: [[0,0],[1,0],[2,0],[3,0]], w: 4, h: 1, wt: 1 },
  pop:     { cells: [[0,0],[0,1],[0,2]],       w: 1, h: 3, wt: 1.1 },
  roll:    { cells: [[0,0],[1,0],[0,1],[1,1]], w: 2, h: 2, wt: 1, still: true },
  cookie:  { cells: [[0,0]],                   w: 1, h: 1, wt: .55, still: true },
  pig:     { cells: [[0,0],[1,0],[2,0],[1,1]], w: 3, h: 2, wt: 1 },
  /* the L and its mirror are one rarer family: about half a normal piece between them */
  bagL:    { cells: [[0,0],[0,1],[0,2],[1,2]], w: 2, h: 3, wt: .28 },
  bagJ:    { cells: [[1,0],[1,1],[1,2],[0,2]], w: 2, h: 3, wt: .28 },
  twistS:  { cells: [[1,0],[2,0],[0,1],[1,1]], w: 3, h: 2, wt: .9 },
  twistZ:  { cells: [[0,0],[1,0],[1,1],[2,1]], w: 3, h: 2, wt: .9 }
};
const TYPES = Object.keys(SHAPES);

/* the cookie sprite from the arcade (8x8) */
const COOKIE = {
  pal: { C:'#ffe1f0', c:'#ffb8da', b:'#3ff0ff', g:'#9dff4f', p:'#ff4fa8', l:'#b48cff' },
  map: ['..CCCC..','.CCcCCC.','CCpCCbCC','CgCCcCCC','CCCbCClC','CcCCCgCC','.CClCpC.','..CCCC..']
};

function hash(a, b, c) {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function memb(t, cx, cy) { return SHAPES[t].cells.some(c => c[0] === cx && c[1] === cy); }
const inE = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/* colour of one art pixel, in the piece's unrotated frame (8 units per cell) */
function art(t, U, V, pal, ls) {
  const x = U + .5, y = V + .5;
  switch (t) {
    case 'pretzel': {
      if (V < 2 || V > 5) return null;
      if ((U === 0 || U === 31) && (V === 2 || V === 5)) return null;
      if (V === 2) return '#ffd6ec';
      if (V === 5) return '#c2307f';
      const h = hash(U, V, 7);
      if (h < .16) return SPRINK[(hash(V, U, 3) * 4) | 0];
      return '#ff4fa8';
    }
    case 'pop': {
      const c = POPC[pal % 4];
      if (inE(x, y, 4, 8, 3.95, 7.7)) {
        if (inE(x, y, 2.6, 4.6, 1.1, 2.1)) return c[1];
        if (Math.abs(y - (9.2 + Math.sin(x * 1.4) * 1.1)) < .62) return c[1];
        const d = ((x - 4) / 3.95) ** 2 + ((y - 8) / 7.7) ** 2;
        if (d > .62 && x > 4.4 && y > 7) return c[2];
        const h = hash(U, V, pal + 11);
        if (h < .07) { const s = SPRINK[(hash(V, U, pal) * 5) | 0]; if (s !== c[0]) return s; }
        return c[0];
      }
      if (V >= 15 && V < 23 && (U === 3 || U === 4)) return U === 3 ? '#f4ecff' : '#c9b8e8';
      return null;
    }
    case 'roll': {
      const r = Math.hypot(x - 8, y - 8);
      if (r > 7.9) return null;
      if (r > 7.05) return '#7d52d6';
      if (r < 1.1) return '#ffffff';
      const a = Math.atan2(y - 8, x - 8) / (Math.PI * 2) + 1;
      const s = (r + a * 2.6) % 2.6;
      return s < 1.25 ? '#ffffff' : '#b48cff';
    }
    case 'cookie': {
      const k = COOKIE.map[V] && COOKIE.map[V][U];
      return k && k !== '.' ? COOKIE.pal[k] : null;
    }
    case 'pig': {
      if (V < 3 && (Math.abs(x - 4.5) < y * .9 + .3 || Math.abs(x - 19.5) < y * .9 + .3) && y > .4) return '#ff6fb7';
      if (inE(x, y, 12, 11.6, 3.6, 2.9)) {
        if (inE(x, y, 10.6, 11.6, .9, 1.1) || inE(x, y, 13.4, 11.6, .9, 1.1)) return '#7a1450';
        return '#ff4fa8';
      }
      if (U >= 8 && U < 16 && V >= 8 && V < 10 && Math.abs(x - 12) < 4.6) return '#ff9ccf';
      if (inE(x, y, 12, 4.8, 11.7, 4.6)) {
        if (inE(x, y, 7.5, 4.4, 1.15, 1.25) || inE(x, y, 16.5, 4.4, 1.15, 1.25)) return (U === 7 || U === 16) && V === 3 ? '#ffffff' : '#140b26';
        if (inE(x, y, 4.6, 6.6, 1.3, .9) || inE(x, y, 19.4, 6.6, 1.3, .9)) return '#ff6fb7';
        if (y > 7.6) return '#ff6fb7';
        return '#ff9ccf';
      }
      return null;
    }
    case 'bagL': case 'bagJ': {
      /* draw in the L frame (16 x 24 art pixels); the J is the L mirrored */
      const UU = t === 'bagJ' ? 15 - U : U;
      return lArt(ls == null ? L_STYLE : ls, UU, V, pal);
    }
    case 'twistS': case 'twistZ': {
      const cx = U >> 3, cy = V >> 3, lx = U & 7, ly = V & 7;
      if (lx === 0 && !memb(t, cx - 1, cy)) return null;
      if (lx === 7 && !memb(t, cx + 1, cy)) return null;
      if (ly === 0 && !memb(t, cx, cy - 1)) return null;
      if (ly === 7 && !memb(t, cx, cy + 1)) return null;
      const main = t === 'twistS' ? '#9dff4f' : '#3ff0ff';
      const dark = t === 'twistS' ? '#4fae2a' : '#1fa8c4';
      const edge = (lx === 1 && !memb(t, cx - 1, cy)) || (lx === 6 && !memb(t, cx + 1, cy)) ||
                   (ly === 1 && !memb(t, cx, cy - 1)) || (ly === 6 && !memb(t, cx, cy + 1));
      if (edge) return dark;
      if (hash(U, V, t === 'twistS' ? 5 : 9) < .07) return '#ff4fa8';
      return ((U + V) % 6 < 3) ? main : '#ffffff';
    }
  }
  return null;
}

/* colour of one art pixel of the L piece, in the L's own frame:
   column 0 (U 0-7) runs down three cells (V 0-23), the foot is U 8-15, V 16-23 */
function lArt(style, UU, V, pal) {
  const U = UU, x = UU + .5, y = V + .5;
  switch (style) {
    case 1: { /* candy cane: pink and white stripes, bending into the foot */
      /* centre line: down x=4 to y=16, quarter turn of radius 4 round (8,16)... then along y=20 to x=14, hooked up at the end */
      let d;
      if (y <= 16) d = Math.abs(x - 4);
      else if (x <= 8) d = Math.abs(Math.hypot(x - 8, y - 16) - 4);
      else if (x <= 12.5) d = Math.abs(y - 20);
      else d = Math.abs(Math.hypot(x - 12.5, y - 17) - 3);
      if (x > 12.5 && y < 17) return null;
      if (d > 2.6) return null;
      if (d > 2.0) return '#c2307f';
      const k = Math.floor((x + y) / 2.6) % 2;
      if (d < .7 && x < 6 && y < 14) return '#ffffff';
      return k ? '#ff4fa8' : '#ffffff';
    }
    case 2: { /* tall cake pop (head over 2 cells, stick in the 3rd) with a cookie at its foot */
      if (U < 8) {
        const c = POPC[pal % 4];
        if (inE(x, y, 4, 8, 3.95, 7.7)) {
          if (inE(x, y, 2.6, 4.6, 1.1, 2.1)) return c[1];
          if (Math.abs(y - (9.2 + Math.sin(x * 1.4) * 1.1)) < .62) return c[1];
          const dd = ((x - 4) / 3.95) ** 2 + ((y - 8) / 7.7) ** 2;
          if (dd > .62 && x > 4.4 && y > 7) return c[2];
          if (hash(U, V, pal + 11) < .07) { const sp = SPRINK[(hash(V, U, pal) * 5) | 0]; if (sp !== c[0]) return sp; }
          return c[0];
        }
        if (V >= 15 && V < 23 && (U === 3 || U === 4)) return U === 3 ? '#f4ecff' : '#c9b8e8';
        return null;
      }
      const k = COOKIE.map[V - 16] && COOKIE.map[V - 16][U - 8];
      return k && k !== '.' ? COOKIE.pal[k] : null;
    }
    case 3: { /* four cookies: three stacked and one beside */
      const lx = U & 7, ly = V & 7, cx = U >> 3, cy = V >> 3;
      const k = COOKIE.map[ly] && COOKIE.map[ly][(cx + cy) % 2 ? 7 - lx : lx];
      return k && k !== '.' ? COOKIE.pal[k] : null;
    }
    case 4: { /* dipping spoon: violet handle down, bowl of pink candy coating in the foot */
      if (inE(x, y, 11.4, 20.2, 4.2, 3.3)) {
        if (y < 19.2 && inE(x, y, 11.4, 20.2, 3.3, 2.5)) return y < 18.1 ? '#ffd6ec' : '#ff4fa8';
        if (inE(x, y, 11.4, 20.2, 3.3, 2.5)) return '#ff4fa8';
        return y < 20 ? '#efe3ff' : '#b9a8e8';
      }
      if (y < 13 && Math.abs(x - 4) < 2.1) { if (y < 1) return null; return Math.abs(x - 4) > 1.3 ? '#7d52d6' : '#b48cff'; }
      /* metal neck curving from the handle into the bowl */
      if (y >= 13 && y <= 20 && x < 8.5) { const dd = Math.abs(Math.hypot(x - 9, y - 13) - 5); if (dd < 1.5 && x < 9) return dd < .6 ? '#ffffff' : '#c9b8e8'; }
      if (y >= 17.6 && y <= 19.6 && x >= 8 && x < 8.6) return '#c9b8e8';
      if (V === 23 && U >= 8 && U <= 14 && hash(U, V, 4) < .5) return '#ff4fa8';
      return null;
    }
    case 5: { /* four mini cinnamon rolls */
      const lx = (U & 7) + .5, ly = (V & 7) + .5;
      const r = Math.hypot(lx - 4, ly - 4);
      if (r > 3.9) return null;
      if (r > 3.25) return '#7d52d6';
      if (r < .8) return '#ffffff';
      const a = Math.atan2(ly - 4, lx - 4) / (Math.PI * 2) + 1;
      const sp = (r + a * 1.6) % 1.6;
      return sp < .8 ? '#ffffff' : '#b48cff';
    }
    default: { /* 0: piping bag with a frosting swirl */
      const xx = x;
      if (UU < 8) {
        if (y < 2.6) { if (Math.abs(xx - 4) < 3.4) return V === 2 ? '#b48cff' : '#ffffff'; return null; }
        if (y < 19.2) {
          const hw = 3.6 - (y - 2.6) * .17;
          const d = Math.abs(xx - 4);
          if (d < hw) { if (d > hw - 1) return '#1fa8c4'; return ((V + UU) % 4 < 2) ? '#3ff0ff' : '#bff8ff'; }
          return null;
        }
        if (y < 22.2 && Math.abs(xx - 4) < 1.3) return UU === 3 ? '#f4ecff' : '#c9b8e8';
        if (V === 22 && UU >= 5) return '#ff4fa8';
        return null;
      }
      if (V === 22 && UU < 9) return '#ff4fa8';
      const layers = [[12, 22.2, 3.9, 1.7], [12, 20.2, 3, 1.5], [12, 18.4, 1.9, 1.2], [12.6, 17.1, .8, .8]];
      for (let i = 0; i < layers.length; i++) {
        const L = layers[i];
        if (inE(xx, y, L[0], L[1], L[2], L[3])) {
          return (y < L[1] - L[3] * .45) ? '#ffd6ec' : '#ff4fa8';
        }
      }
      return null;
    }
  }
}

/* rotate a canonical cell r quarter-turns clockwise */
function rotCell(cx, cy, w, h, r) {
  switch (r & 3) {
    case 0: return [cx, cy];
    case 1: return [h - 1 - cy, cx];
    case 2: return [w - 1 - cx, h - 1 - cy];
    default: return [cy, w - 1 - cx];
  }
}

window.PDGames.stack = {
  id: 'stack',
  _lArt: lArt, _lNames: L_NAMES,
  title: 'Treat Stack',
  blurb: 'Stack the treats. Fill a row to clear it.',
  mount(host, api) {
    api = api || {};
    const reduce = !!api.reduce;
    const store = api.store || { get() { return null; }, set() {} };
    host.innerHTML = '';
    host.classList.add('pdg', 'pdg-stack');

    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

    /* ---------- DOM ---------- */
    const wrap = el('div', 'pdg-stack-wrap');
    const hud = el('div', 'pdg-stack-hud');
    const hLvl = el('b', null, '1'), hRows = el('b', null, '0/6'), hScore = el('b', null, '0');
    const sp1 = el('span', null, 'LVL '); sp1.appendChild(hLvl);
    const sp2 = el('span', null, 'ROWS '); sp2.appendChild(hRows);
    const sp3 = el('span', null, 'SCORE '); sp3.appendChild(hScore);
    const pauseBtn = el('button', 'pdg-stack-pause', 'II');
    pauseBtn.type = 'button'; pauseBtn.setAttribute('aria-label', 'Pause');
    hud.append(sp1, sp2, sp3, pauseBtn);

    const stage = el('div', 'pdg-stack-stage');
    const cv = el('canvas', 'pdg-stack-cv');
    cv.setAttribute('tabindex', '0');
    cv.setAttribute('aria-label', 'Treat Stack board. Swipe or use the buttons to move, tap to turn.');
    const ov = el('div', 'pdg-stack-ov');
    stage.append(cv, ov);

    const pad = el('div', 'pdg-stack-pad');
    const mkPad = (txt, act, label, cls) => { const b = el('button', 'pdg-stack-key' + (cls ? ' ' + cls : ''), txt); b.type = 'button'; b.dataset.act = act; b.setAttribute('aria-label', label); pad.appendChild(b); return b; };
    mkPad('◀', 'left', 'Move left');
    mkPad('⟳', 'rot', 'Turn');
    mkPad('▶', 'right', 'Move right');
    mkPad('▼', 'down', 'Move down');
    mkPad('DROP', 'drop', 'Drop', 'pdg-stack-drop');

    wrap.append(hud, stage, pad);
    host.appendChild(wrap);

    const ctx = cv.getContext('2d');

    /* ---------- state ---------- */
    let u = 3, cell = 24, su = 2, F = 6, boardX = 0, boardY = 0, sideX = 0, cw = 0, ch = 0;
    let state = 'menu', prevState = null;
    let level = 0, rowsDone = 0, score = 0, levelStartScore = 0, best = parseInt(store.get('pdg-stack-best'), 10) || 0;
    let unlocked = Math.min(NLV, Math.max(1, parseInt(store.get('pdg-stack-unlocked'), 10) || 1));
    let grid = [], piece = null, next = null, uidN = 1, hist = [];
    let acc = 0, lockT = 0, lockMoves = 0, soft = false, clearRows = [], clearT = 0, introT = 0;
    let parts = [], raf = 0, last = 0, boardDirty = true, won = false, destroyed = false;
    const cache = new Map();
    const boardCv = document.createElement('canvas'); const bctx = boardCv.getContext('2d');

    function emptyGrid() { grid = []; for (let y = 0; y < ROWS; y++) grid.push(new Array(COLS).fill(null)); }
    emptyGrid();

    /* ---------- art cache ---------- */
    function cellImg(c, uu) {
      const key = c.t + '|' + c.rot + '|' + c.cx + '|' + c.cy + '|' + c.pal + '|' + uu;
      let img = cache.get(key);
      if (img) return img;
      img = document.createElement('canvas'); img.width = img.height = uu * 8;
      const x = img.getContext('2d');
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        let a, b;
        switch (c.rot & 3) { case 0: a = i; b = j; break; case 1: a = j; b = 7 - i; break; case 2: a = 7 - i; b = 7 - j; break; default: a = 7 - j; b = i; }
        const col = art(c.t, c.cx * 8 + a, c.cy * 8 + b, c.pal);
        if (col) { x.fillStyle = col; x.fillRect(i * uu, j * uu, uu, uu); }
      }
      cache.set(key, img);
      return img;
    }

    /* ---------- pieces ---------- */
    function pickType() {
      for (let tries = 0; tries < 8; tries++) {
        let tot = 0; TYPES.forEach(t => tot += SHAPES[t].wt);
        let r = Math.random() * tot, t = TYPES[0];
        for (const k of TYPES) { r -= SHAPES[k].wt; if (r <= 0) { t = k; break; } }
        if (!(hist.length >= 2 && hist[hist.length - 1] === t && hist[hist.length - 2] === t)) { hist.push(t); if (hist.length > 4) hist.shift(); return t; }
      }
      return TYPES[(Math.random() * TYPES.length) | 0];
    }
    function newPiece() { const t = pickType(); return { t, uid: uidN++, rot: 0, x: 0, y: 0, pal: (Math.random() * 4) | 0 }; }
    function dims(p, r) { const s = SHAPES[p.t]; return (r & 1) ? [s.h, s.w] : [s.w, s.h]; }
    function cellsOf(p, r, ox, oy) {
      const s = SHAPES[p.t]; r = r == null ? p.rot : r; ox = ox == null ? p.x : ox; oy = oy == null ? p.y : oy;
      return s.cells.map(c => { const q = rotCell(c[0], c[1], s.w, s.h, r); return { x: ox + q[0], y: oy + q[1], cx: c[0], cy: c[1] }; });
    }
    function fits(p, r, ox, oy) {
      return cellsOf(p, r, ox, oy).every(c => c.x >= 0 && c.x < COLS && c.y < ROWS && (c.y < 0 || !grid[c.y][c.x]));
    }
    function grounded() { return !fits(piece, piece.rot, piece.x, piece.y + 1); }
    function touched() { if (grounded() && lockMoves < 14) { lockT = 0; lockMoves++; } }

    function move(dx) { if (state !== 'play' || !piece) return; if (fits(piece, piece.rot, piece.x + dx, piece.y)) { piece.x += dx; touched(); } }
    function rotate() {
      if (state !== 'play' || !piece || SHAPES[piece.t].still) return;
      const r = (piece.rot + 1) & 3;
      const [w0, h0] = dims(piece, piece.rot), [w1, h1] = dims(piece, r);
      const bx = piece.x + Math.floor((w0 - w1) / 2), by = piece.y + Math.floor((h0 - h1) / 2);
      const kicks = [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1]];
      for (const k of kicks) { if (fits(piece, r, bx + k[0], by + k[1])) { piece.rot = r; piece.x = bx + k[0]; piece.y = by + k[1]; touched(); return; } }
    }
    function stepDown(byPlayer) {
      if (fits(piece, piece.rot, piece.x, piece.y + 1)) { piece.y++; if (byPlayer) { score += 1; hudUp(); } return true; }
      return false;
    }
    function hardDrop() {
      if (state !== 'play' || !piece) return;
      let n = 0; while (fits(piece, piece.rot, piece.x, piece.y + 1)) { piece.y++; n++; }
      score += n * 2; lock();
    }
    function ghostY() { let y = piece.y; while (fits(piece, piece.rot, piece.x, y + 1)) y++; return y; }

    function spawn() {
      piece = next || newPiece(); next = newPiece();
      const [w] = dims(piece, 0);
      piece.x = Math.floor((COLS - w) / 2); piece.y = 0; piece.rot = 0;
      acc = 0; lockT = 0; lockMoves = 0;
      if (!fits(piece, 0, piece.x, piece.y)) { piece.y = -1; if (!fits(piece, 0, piece.x, piece.y)) { gameOver(); } }
    }
    function lock() {
      let top = false;
      cellsOf(piece).forEach(c => { if (c.y < 0) { top = true; return; } grid[c.y][c.x] = { t: piece.t, rot: piece.rot, cx: c.cx, cy: c.cy, pal: piece.pal }; });
      piece = null; boardDirty = true;
      if (top) { gameOver(); return; }
      clearRows = [];
      for (let y = 0; y < ROWS; y++) if (grid[y].every(Boolean)) clearRows.push(y);
      if (clearRows.length) {
        const n = clearRows.length;
        score += LINE_PTS[Math.min(4, n)] * (level + 1);
        clearT = reduce ? .12 : .32;
        state = 'clearing';
        if (!reduce) clearRows.forEach(y => { for (let x = 0; x < COLS; x++) for (let k = 0; k < 3; k++) parts.push({ x: boardX + (x + .5) * cell, y: boardY + (y + .5) * cell, vx: (Math.random() - .5) * cell * 9, vy: -Math.random() * cell * 9 - cell * 2, c: SPRINK[(Math.random() * 5) | 0], t: 0 }); });
        hudUp();
      } else { hudUp(); spawn(); }
    }
    function finishClear() {
      const n = clearRows.length;
      clearRows.sort((a, b) => a - b).forEach(y => { grid.splice(y, 1); grid.unshift(new Array(COLS).fill(null)); });
      clearRows = []; boardDirty = true; rowsDone += n;
      if (rowsDone >= TARGETS[level]) { rowsDone = TARGETS[level]; hudUp(); levelClear(); return; }
      state = 'play'; hudUp(); spawn();
    }

    /* ---------- flow ---------- */
    function hudUp() {
      hLvl.textContent = String(level + 1);
      hRows.textContent = rowsDone + '/' + TARGETS[level];
      hScore.textContent = String(score);
      if (score > best) { best = score; store.set('pdg-stack-best', String(best)); }
    }
    function addJunk(n) {
      for (let k = 0; k < n; k++) {
        const y = ROWS - 1 - k;
        const gaps = new Set(); while (gaps.size < 2) gaps.add((Math.random() * COLS) | 0);
        for (let x = 0; x < COLS; x++) if (!gaps.has(x)) grid[y][x] = { t: 'cookie', rot: 0, cx: 0, cy: 0, pal: 0 };
      }
    }
    function startLevel(l, fresh) {
      level = l; rowsDone = 0;
      if (fresh) score = 0;
      levelStartScore = score;
      emptyGrid(); addJunk(JUNK[l]); parts = []; clearRows = [];
      piece = null; next = newPiece(); boardDirty = true;
      hudUp();
      state = 'intro'; introT = 1.2;
      showOv([['t', 'LEVEL ' + (l + 1)], ['m', 'CLEAR ' + TARGETS[l] + ' ROWS'], ['h', 'TAP TO GO']], [], true);
      kick();
    }
    function play() { hideOv(); state = 'play'; spawn(); last = performance.now(); kick(); try { cv.focus({ preventScroll: true }); } catch (e) {} }
    function levelClear() {
      state = 'levelclear'; piece = null;
      if (level >= NLV - 1) {
        state = 'won';
        showOv([['t', 'YOU BEAT ALL 10!'], ['m', 'SCORE ' + score], ['m', 'BEST ' + best]], [['PLAY AGAIN', () => startLevel(0, true)], ['LEVELS', menu]]);
        return;
      }
      if (unlocked < level + 2) { unlocked = level + 2; store.set('pdg-stack-unlocked', String(unlocked)); }
      /* level 5 earns the prize once per visit; the hub shows it on top of this screen */
      if (level === 4 && !won) { won = true; try { api.win && api.win('stack', score); } catch (e) {} }
      showOv([['t', 'LEVEL ' + (level + 1) + ' CLEAR!'], ['m', 'SCORE ' + score]], [['NEXT LEVEL', () => startLevel(level + 1, false)], ['LEVELS', menu]]);
    }
    function gameOver() {
      state = 'over'; piece = null;
      showOv([['t', 'TOPPED OUT'], ['m', 'SCORE ' + score], ['m', 'BEST ' + best]], [['TRY AGAIN', () => { score = levelStartScore; startLevel(level, false); }], ['LEVELS', menu]]);
    }
    function pause() {
      if (state !== 'play' && state !== 'clearing') return;
      prevState = state; state = 'paused'; soft = false; stopRepeat();
      showOv([['t', 'PAUSED'], ['m', 'SCORE ' + score]], [['RESUME', resume], ['LEVELS', menu]]);
    }
    function resume() { if (state !== 'paused') return; hideOv(); state = prevState || 'play'; last = performance.now(); kick(); try { cv.focus({ preventScroll: true }); } catch (e) {} }
    function menu() {
      state = 'menu'; piece = null; stopRepeat();
      emptyGrid(); boardDirty = true;
      const lv = el('div', 'pdg-stack-levels');
      for (let i = 0; i < NLV; i++) {
        const b = el('button', 'pdg-stack-lv', String(i + 1)); b.type = 'button';
        if (i >= unlocked) { b.disabled = true; b.setAttribute('aria-label', 'Level ' + (i + 1) + ' locked'); }
        else { b.setAttribute('aria-label', 'Start level ' + (i + 1)); b.addEventListener('click', () => startLevel(i, true)); }
        lv.appendChild(b);
      }
      showOv([['t', 'TREAT STACK'], ['m', 'PICK A LEVEL'], ['node', lv], ['h', 'BEST ' + best]], []);
      draw();
    }

    function showOv(lines, btns, tapToSkip) {
      ov.innerHTML = '';
      lines.forEach(([k, v]) => {
        if (k === 'node') { ov.appendChild(v); return; }
        ov.appendChild(el('p', 'pdg-stack-ov-' + k, v));
      });
      if (btns.length) {
        const row = el('div', 'pdg-stack-ov-btns');
        btns.forEach(([txt, fn], i) => { const b = el('button', 'pdg-stack-btn' + (i ? ' alt' : ''), txt); b.type = 'button'; b.addEventListener('click', fn); row.appendChild(b); });
        ov.appendChild(row);
        setTimeout(() => { const f = ov.querySelector('button'); if (f && !destroyed) try { f.focus({ preventScroll: true }); } catch (e) {} }, 30);
      }
      ov.classList.toggle('skip', !!tapToSkip);
      ov.hidden = false;
    }
    function hideOv() { ov.hidden = true; ov.innerHTML = ''; }
    ov.addEventListener('click', () => { if (state === 'intro') play(); });

    /* ---------- layout ---------- */
    function layout() {
      const W = host.clientWidth || 340;
      const vh = window.innerHeight || 700;
      const maxH = Math.min(vh * .78, 680) - 30 - 58 - 12;
      let uu = 6;
      for (; uu > 2; uu--) {
        const c = uu * 8, s = Math.max(2, uu - 1), f = uu * 2;
        const total = f * 2 + COLS * c + uu * 3 + (4 * 8 * s + s * 6);
        const h = f * 2 + ROWS * c;
        if (total <= W && h <= maxH) break;
      }
      u = uu; cell = u * 8; su = Math.max(2, u - 1); F = u * 2;
      boardX = F; boardY = F;
      sideX = F * 2 + COLS * cell + u * 3;
      cw = sideX + 4 * 8 * su + su * 6;
      ch = F * 2 + ROWS * cell;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
      boardCv.width = Math.round((F * 2 + COLS * cell) * dpr); boardCv.height = Math.round(ch * dpr);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.imageSmoothingEnabled = false;
      cache.clear(); boardDirty = true;
      pad.style.maxWidth = Math.max(cw, 300) + 'px';
      draw();
    }

    /* ---------- drawing ---------- */
    function frame(c, x, y, w, h, t) {
      c.fillStyle = '#b48cff'; c.fillRect(x + t, y, w - t * 2, h); c.fillRect(x, y + t, w, h - t * 2);
      c.fillStyle = '#ff4fa8'; c.fillRect(x + t, y + t, w - t * 2, h - t * 2);
      const i = Math.max(1, t >> 1);
      c.fillStyle = '#140b26'; c.fillRect(x + t + i, y + t + i, w - (t + i) * 2, h - (t + i) * 2);
    }
    function drawBoard() {
      const c = bctx, bw = COLS * cell, bh = ROWS * cell;
      c.clearRect(0, 0, F * 2 + bw, ch);
      frame(c, 0, 0, F * 2 + bw, ch, Math.max(2, u));
      c.fillStyle = '#140b26'; c.fillRect(boardX, boardY, bw, bh);
      const wl = Math.max(1, u >> 1);
      c.fillStyle = '#231342';
      for (let x = 1; x < COLS; x++) c.fillRect(boardX + x * cell - (wl >> 1), boardY, wl, bh);
      for (let y = 1; y < ROWS; y++) c.fillRect(boardX, boardY + y * cell - (wl >> 1), bw, wl);
      c.fillStyle = '#2f1a58';
      for (let y = 0; y < ROWS; y += 3) c.fillRect(boardX, boardY + y * cell + (cell >> 1), bw, wl);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const g = grid[y][x]; if (g) c.drawImage(cellImg(g, u), boardX + x * cell, boardY + y * cell, cell, cell);
      }
      boardDirty = false;
    }
    function drawPieceAt(p, cells, alpha) {
      ctx.globalAlpha = alpha;
      cells.forEach(c => { if (c.y < 0) return; ctx.drawImage(cellImg({ t: p.t, rot: p.rot, cx: c.cx, cy: c.cy, pal: p.pal }, u), boardX + c.x * cell, boardY + c.y * cell, cell, cell); });
      ctx.globalAlpha = 1;
    }
    function txt(s, x, y, size, col, align) {
      ctx.font = size + 'px "Press Start 2P", monospace'; ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top'; ctx.fillText(s, x, y);
    }
    function drawSide() {
      const sw = 4 * 8 * su + su * 6, x0 = sideX;
      const fs = Math.max(7, u * 3 - 1);
      frame(ctx, x0, 0, sw, 4 * 8 * su + fs + su * 10, Math.max(2, su));
      txt('NEXT', x0 + sw / 2, su * 4, fs, '#3ff0ff', 'center');
      if (next) {
        const s = SHAPES[next.t], c8 = su * 8;
        const ox = x0 + (sw - s.w * c8) / 2, oy = su * 6 + fs + (4 * c8 - s.h * c8) / 2;
        s.cells.forEach(c => ctx.drawImage(cellImg({ t: next.t, rot: 0, cx: c[0], cy: c[1], pal: next.pal }, su), Math.round(ox + c[0] * c8), Math.round(oy + c[1] * c8)));
      }
      /* rows progress bar */
      const by = 4 * 8 * su + fs + su * 14, bh = ch - by - su * 2;
      if (bh > su * 20) {
        const bw = Math.max(su * 6, Math.round(sw * .32)), bx = x0 + (sw - bw) / 2;
        txt('ROWS', x0 + sw / 2, by, fs, '#ffd6ec', 'center');
        const ty = by + fs + su * 3, th = bh - fs - su * 3;
        frame(ctx, bx, ty, bw, th, Math.max(2, su - 1));
        const inner = Math.max(2, su - 1) + Math.max(1, (su - 1) >> 1);
        const ih = th - inner * 2, fill = Math.round(ih * Math.min(1, rowsDone / TARGETS[level]));
        ctx.fillStyle = '#9dff4f'; ctx.fillRect(bx + inner, ty + inner + ih - fill, bw - inner * 2, fill);
        ctx.fillStyle = '#ffffff';
        for (let k = 1; k < TARGETS[level]; k++) { const yy = ty + inner + Math.round(ih * k / TARGETS[level]); ctx.fillRect(bx + inner, yy, Math.max(1, su >> 1), 1); }
      }
    }
    function draw() {
      if (!cw) return;
      ctx.clearRect(0, 0, cw, ch);
      if (boardDirty) drawBoard();
      ctx.drawImage(boardCv, 0, 0, F * 2 + COLS * cell, ch);
      ctx.save(); ctx.beginPath(); ctx.rect(boardX, boardY, COLS * cell, ROWS * cell); ctx.clip();
      if (piece && state !== 'menu') {
        const gy = ghostY();
        if (gy !== piece.y) drawPieceAt(piece, cellsOf(piece, piece.rot, piece.x, gy), .22);
        drawPieceAt(piece, cellsOf(piece), 1);
      }
      if (state === 'clearing' || (state === 'paused' && clearRows.length)) {
        const k = reduce ? .5 : (Math.sin(performance.now() / 40) * .5 + .5);
        ctx.fillStyle = 'rgba(255,255,255,' + (.35 + k * .45).toFixed(2) + ')';
        clearRows.forEach(y => ctx.fillRect(boardX, boardY + y * cell, COLS * cell, cell));
      }
      ctx.restore();
      const ps = Math.max(2, u);
      parts.forEach(p => { ctx.globalAlpha = Math.max(0, 1 - p.t / .8); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), ps, ps * 2); });
      ctx.globalAlpha = 1;
      drawSide();
    }

    /* ---------- loop ---------- */
    function step(dt) {
      if (parts.length) { parts.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += cell * 30 * dt; }); parts = parts.filter(p => p.t < .8); }
      if (state === 'intro') { introT -= dt; if (introT <= 0) play(); return; }
      if (state === 'clearing') { clearT -= dt; if (clearT <= 0) finishClear(); return; }
      if (state !== 'play' || !piece) return;
      const iv = soft ? Math.min(SPEED[level], .045) : SPEED[level];
      acc += dt;
      while (acc >= iv && piece) { acc -= iv; if (!stepDown(soft)) { break; } else if (!grounded()) lockT = 0; }
      if (piece && grounded()) { lockT += dt; if (lockT >= .45) lock(); }
    }
    function loop(t) {
      raf = 0; if (destroyed) return;
      const dt = Math.min(.05, Math.max(0, (t - last) / 1000)); last = t;
      step(dt); draw();
      if (state === 'play' || state === 'clearing' || state === 'intro' || parts.length) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && !destroyed) { last = performance.now(); raf = requestAnimationFrame(loop); } }

    /* ---------- input: buttons with auto-repeat ---------- */
    let repT = 0, repI = 0;
    function act(a) {
      if (state === 'intro') { play(); return; }
      if (state !== 'play') return;
      if (a === 'left') move(-1); else if (a === 'right') move(1); else if (a === 'rot') rotate();
      else if (a === 'down') { if (piece && !stepDown(true)) { lockT = .45; } acc = 0; }
      else if (a === 'drop') hardDrop();
      draw();
    }
    function stopRepeat() { clearTimeout(repT); clearInterval(repI); repT = repI = 0; }
    const onPadDown = e => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      e.preventDefault(); const a = b.dataset.act; act(a); b.classList.add('on');
      stopRepeat();
      if (a === 'left' || a === 'right' || a === 'down') repT = setTimeout(() => { repI = setInterval(() => act(a), a === 'down' ? 45 : 70); }, 170);
    };
    const onPadUp = () => { stopRepeat(); pad.querySelectorAll('.on').forEach(b => b.classList.remove('on')); };
    pad.addEventListener('pointerdown', onPadDown);
    pad.addEventListener('pointerup', onPadUp);
    pad.addEventListener('pointercancel', onPadUp);
    pad.addEventListener('pointerleave', onPadUp);
    pad.addEventListener('contextmenu', e => e.preventDefault());
    pauseBtn.addEventListener('click', () => { if (state === 'paused') resume(); else pause(); });

    /* ---------- input: swipes on the board ---------- */
    let sw = null;
    const onCvDown = e => {
      if (state === 'intro') { play(); return; }
      if (state !== 'play') return;
      e.preventDefault();
      sw = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ax: e.clientX, ay: e.clientY, t: performance.now(), moved: false };
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const onCvMove = e => {
      if (!sw || e.pointerId !== sw.id || state !== 'play') return;
      const step = cell * .9;
      while (e.clientX - sw.ax >= step) { move(1); sw.ax += step; sw.moved = true; }
      while (sw.ax - e.clientX >= step) { move(-1); sw.ax -= step; sw.moved = true; }
      while (e.clientY - sw.ay >= step) { if (piece) stepDown(true); sw.ay += step; sw.moved = true; acc = 0; }
      draw();
    };
    const onCvUp = e => {
      if (!sw || e.pointerId !== sw.id) return;
      const dt = performance.now() - sw.t, dx = e.clientX - sw.sx, dy = e.clientY - sw.sy;
      if (state === 'play') {
        if (!sw.moved && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 320) rotate();
        else if (dy > cell * 2.5 && dt < 260 && Math.abs(dy) > Math.abs(dx) * 1.5) hardDrop();
        else if (dy < -cell * 2 && Math.abs(dy) > Math.abs(dx)) rotate();
      }
      try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
      sw = null; draw();
    };
    cv.addEventListener('pointerdown', onCvDown);
    cv.addEventListener('pointermove', onCvMove);
    cv.addEventListener('pointerup', onCvUp);
    cv.addEventListener('pointercancel', onCvUp);

    /* ---------- input: keys ---------- */
    const onKey = e => {
      if (destroyed) return;
      const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
      const down = e.type === 'keydown';
      if (state === 'paused' && down && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); resume(); return; }
      if (state !== 'play' && state !== 'clearing') return;
      const k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); soft = down; if (down) acc = Math.max(acc, .045); return; }
      if (!down) return;
      if (k === 'ArrowLeft') { e.preventDefault(); move(-1); }
      else if (k === 'ArrowRight') { e.preventDefault(); move(1); }
      else if (k === 'ArrowUp' || k === 'x' || k === 'X') { e.preventDefault(); rotate(); }
      else if (k === ' ' || k === 'Spacebar') { e.preventDefault(); hardDrop(); }
      else if (k === 'p' || k === 'P' || k === 'Escape') { e.preventDefault(); pause(); }
      else return;
      draw();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    const onVis = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVis);
    let io = null, ro = null;
    if ('IntersectionObserver' in window) { io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) pause(); }), { threshold: .3 }); io.observe(cv); }
    if ('ResizeObserver' in window) { let rw = 0; ro = new ResizeObserver(es => { const w = es[0].contentRect.width; if (w && Math.abs(w - rw) > 1) { rw = w; layout(); } }); ro.observe(host); }
    const onWinResize = () => layout();
    window.addEventListener('orientationchange', onWinResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!destroyed) draw(); });

    layout();
    menu();

    return {
      pause,
      destroy() {
        destroyed = true; cancelAnimationFrame(raf); raf = 0; stopRepeat();
        window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
        window.removeEventListener('orientationchange', onWinResize);
        document.removeEventListener('visibilitychange', onVis);
        if (io) io.disconnect(); if (ro) ro.disconnect();
        cache.clear(); host.innerHTML = ''; host.classList.remove('pdg-stack');
      }
    };
  }
};
})();
