export const STUDIO_PRESETS = {
  snake: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Retro Cyber Snake</title>
  <style>
    body { background: #0b0f19; color: #00f0ff; font-family: 'Courier New', monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    h2 { margin-bottom: 10px; text-shadow: 0 0 10px #00f0ff; }
    #score { font-size: 18px; margin-bottom: 15px; }
    canvas { border: 2px solid #00f0ff; box-shadow: 0 0 20px rgba(0,240,255,0.3); background: #111827; border-radius: 8px; }
    p { color: #94a3b8; font-size: 12px; margin-top: 15px; }
  </style>
</head>
<body>
  <h2>NEXUS SNAKE v1.0</h2>
  <div id="score">SCORE: 0</div>
  <canvas id="gc" width="360" height="360"></canvas>
  <p>Use WASD or Arrow Keys to Play</p>
  <script>
    px=py=10; gs=18; tc=20; ax=ay=15; xv=yv=0; trail=[]; tail = 5; score = 0;
    window.onload=function() {
      canv=document.getElementById("gc"); ctx=canv.getContext("2d");
      document.addEventListener("keydown",keyPush);
      setInterval(game, 1000/12);
    }
    function game() {
      px+=xv; py+=yv;
      if(px<0) px= tc-1; if(px>tc-1) px= 0;
      if(py<0) py= tc-1; if(py>tc-1) py= 0;
      ctx.fillStyle="#111827"; ctx.fillRect(0,0,canv.width,canv.height);
      ctx.fillStyle="#00f0ff";
      for(var i=0;i<trail.length;i++) {
        ctx.fillRect(trail[i].x*gs,trail[i].y*gs,gs-2,gs-2);
        if(trail[i].x==px && trail[i].y==py) { tail = 5; score=0; document.getElementById('score').innerText='SCORE: 0'; }
      }
      trail.push({x:px,y:py});
      while(trail.length>tail) trail.shift();
      if(ax==px && ay==py) {
        tail++; score += 10; document.getElementById('score').innerText='SCORE: '+score;
        ax=Math.floor(Math.random()*tc); ay=Math.floor(Math.random()*tc);
      }
      ctx.fillStyle="#ff007f"; ctx.fillRect(ax*gs,ay*gs,gs-2,gs-2);
    }
    function keyPush(evt) {
      switch(evt.keyCode) {
        case 37: case 65: xv=-1;yv=0;break;
        case 38: case 87: xv=0;yv=-1;break;
        case 39: case 68: xv=1;yv=0;break;
        case 40: case 83: xv=0;yv=1;break;
      }
    }
  </script>
</body>
</html>`,

  space: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cyber Space Shooter</title>
  <style>
    body { background: #050811; color: #a5b4fc; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }
    canvas { border: 2px solid #6366f1; background: #020617; border-radius: 12px; box-shadow: 0 0 30px rgba(99,102,241,0.3); }
    .info { margin-bottom: 12px; font-weight: bold; font-size: 16px; color: #38bdf8; }
  </style>
</head>
<body>
  <div class="info">NEXUS DEFENDER — Score: <span id="sc">0</span></div>
  <canvas id="c" width="360" height="420"></canvas>
  <p style="font-size:12px; color:#64748b; margin-top:8px;">Arrow Keys / WASD to Move, Spacebar to Shoot</p>
  <script>
    const canv = document.getElementById("c");
    const ctx = canv.getContext("2d");
    let px = 160, bullets = [], enemies = [], score = 0;
    document.addEventListener("keydown", (e) => {
      if(e.key === "ArrowLeft" || e.key === "a") px = Math.max(10, px - 20);
      if(e.key === "ArrowRight" || e.key === "d") px = Math.min(310, px + 20);
      if(e.key === " " || e.key === "Spacebar") bullets.push({x: px + 18, y: 380});
    });
    setInterval(() => {
      if(Math.random() < 0.3) enemies.push({x: Math.random() * 320, y: 0});
    }, 800);
    function loop() {
      ctx.fillStyle = "#020617"; ctx.fillRect(0,0,360,420);
      ctx.fillStyle = "#38bdf8"; ctx.fillRect(px, 390, 40, 15); // Player
      
      ctx.fillStyle = "#f43f5e";
      bullets.forEach((b, bi) => {
        b.y -= 7; ctx.fillRect(b.x, b.y, 4, 10);
        if(b.y < 0) bullets.splice(bi, 1);
      });
      
      ctx.fillStyle = "#a855f7";
      enemies.forEach((en, ei) => {
        en.y += 2.5; ctx.fillRect(en.x, en.y, 25, 25);
        bullets.forEach((b, bi) => {
          if(b.x > en.x && b.x < en.x + 25 && b.y > en.y && b.y < en.y + 25) {
            enemies.splice(ei, 1); bullets.splice(bi, 1); score += 10;
            document.getElementById("sc").innerText = score;
          }
        });
      });
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`,

  calculator: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neon Glass Calculator</title>
  <style>
    body { background: #090d16; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .calc { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); width: 280px; }
    #display { width: 100%; height: 50px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #38bdf8; font-size: 24px; text-align: right; padding: 10px; box-sizing: border-box; margin-bottom: 20px; font-weight: bold; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    button { height: 50px; border-radius: 12px; border: none; background: rgba(255,255,255,0.05); color: #f8fafc; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    button:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
    button.op { background: #6366f1; color: white; }
    button.op:hover { background: #4f46e5; }
    button.eq { background: #10b981; color: white; grid-column: span 2; }
  </style>
</head>
<body>
  <div class="calc">
    <input type="text" id="display" readonly value="0">
    <div class="grid">
      <button onclick="clearDisplay()" style="color:#f43f5e">C</button>
      <button onclick="append('/')" class="op">÷</button>
      <button onclick="append('*')" class="op">×</button>
      <button onclick="append('-')" class="op">-</button>
      <button onclick="append('7')">7</button>
      <button onclick="append('8')">8</button>
      <button onclick="append('9')">9</button>
      <button onclick="append('+')" class="op">+</button>
      <button onclick="append('4')">4</button>
      <button onclick="append('5')">5</button>
      <button onclick="append('6')">6</button>
      <button onclick="append('1')">1</button>
      <button onclick="append('2')">2</button>
      <button onclick="append('3')">3</button>
      <button onclick="append('0')">0</button>
      <button onclick="append('.')">.</button>
      <button onclick="calculate()" class="eq">=</button>
    </div>
  </div>
  <script>
    let d = document.getElementById('display');
    function append(v) { if(d.value==='0') d.value=''; d.value += v; }
    function clearDisplay() { d.value = '0'; }
    function calculate() { try { d.value = eval(d.value); } catch(e) { d.value = 'Error'; } }
  </script>
</body>
</html>`,

  brickBreaker: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cyber Brick Breaker</title>
  <style>
    body { background: #030712; color: #ec4899; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    canvas { border: 2px solid #ec4899; background: #0f172a; border-radius: 12px; box-shadow: 0 0 25px rgba(236,72,153,0.3); }
    .header { font-[900]; font-size: 18px; margin-bottom: 10px; text-shadow: 0 0 10px #ec4899; }
  </style>
</head>
<body>
  <div class="header">BRICK BREAKER ARCADE — Score: <span id="sc">0</span></div>
  <canvas id="bc" width="400" height="350"></canvas>
  <p style="color:#64748b; font-size:12px; margin-top:8px;">Move mouse or touch to control paddle</p>
  <script>
    const canv = document.getElementById("bc");
    const ctx = canv.getContext("2d");
    let paddleX = 160, ballX = 200, ballY = 250, dx = 3, dy = -3, score = 0;
    const paddleW = 75, paddleH = 10, r = 6;
    const rowCount = 4, colCount = 6, brickW = 55, brickH = 15, padding = 8, offsetTop = 30, offsetLeft = 15;
    let bricks = [];
    for(let c=0; c<colCount; c++) {
      bricks[c] = [];
      for(let r=0; r<rowCount; r++) bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
    canv.addEventListener("mousemove", (e) => {
      const rect = canv.getBoundingClientRect();
      paddleX = e.clientX - rect.left - paddleW/2;
    });
    function draw() {
      ctx.fillStyle = "#0f172a"; ctx.fillRect(0,0,400,350);
      for(let c=0; c<colCount; c++) {
        for(let r=0; r<rowCount; r++) {
          if(bricks[c][r].status === 1) {
            let bx = (c*(brickW+padding))+offsetLeft;
            let by = (r*(brickH+padding))+offsetTop;
            bricks[c][r].x = bx; bricks[c][r].y = by;
            ctx.fillStyle = r%2===0 ? "#ec4899" : "#a855f7";
            ctx.fillRect(bx, by, brickW, brickH);
            if(ballX > bx && ballX < bx+brickW && ballY > by && ballY < by+brickH) {
              dy = -dy; bricks[c][r].status = 0; score += 20;
              document.getElementById("sc").innerText = score;
            }
          }
        }
      }
      ctx.fillStyle = "#38bdf8"; ctx.fillRect(paddleX, 330, paddleW, paddleH);
      ctx.beginPath(); ctx.arc(ballX, ballY, r, 0, Math.PI*2); ctx.fillStyle = "#facc15"; ctx.fill(); ctx.closePath();
      if(ballX + dx > 400 - r || ballX + dx < r) dx = -dx;
      if(ballY + dy < r) dy = -dy;
      else if(ballY + dy > 330 - r) {
        if(ballX > paddleX && ballX < paddleX + paddleW) dy = -dy;
        else if(ballY + dy > 350 - r) { ballX=200; ballY=250; dx=3; dy=-3; score=0; document.getElementById("sc").innerText=0; }
      }
      ballX += dx; ballY += dy;
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>`,

  paint: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neon Paint Studio</title>
  <style>
    body { background: #090d16; color: white; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .toolbar { display: flex; gap: 10px; margin-bottom: 12px; background: rgba(30,41,59,0.8); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
    canvas { border: 2px solid #6366f1; background: #020617; border-radius: 12px; cursor: crosshair; }
    button { background: rgba(255,255,255,0.1); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; }
    button:hover { background: #6366f1; }
    input[type=color] { border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; background: transparent; }
  </style>
</head>
<body>
  <div class="toolbar">
    <input type="color" id="clr" value="#00f0ff">
    <button onclick="setLineWidth(2)">Thin</button>
    <button onclick="setLineWidth(6)">Medium</button>
    <button onclick="setLineWidth(14)">Thick</button>
    <button onclick="clearCanvas()" style="background:#f43f5e">Clear Canvas</button>
  </div>
  <canvas id="pnt" width="400" height="350"></canvas>
  <script>
    const canv = document.getElementById("pnt");
    const ctx = canv.getContext("2d");
    let painting = false, color = "#00f0ff", lw = 4;
    document.getElementById("clr").addEventListener("input", (e) => color = e.target.value);
    function setLineWidth(w) { lw = w; }
    function clearCanvas() { ctx.clearRect(0, 0, 400, 350); }
    canv.addEventListener("mousedown", (e) => { painting = true; draw(e); });
    canv.addEventListener("mouseup", () => { painting = false; ctx.beginPath(); });
    canv.addEventListener("mousemove", draw);
    function draw(e) {
      if(!painting) return;
      const rect = canv.getBoundingClientRect();
      ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.strokeStyle = color;
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke(); ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  </script>
</body>
</html>`,
};