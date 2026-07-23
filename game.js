(() => {
  const canvas = document.querySelector('#game-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const cols = 24;
  const rows = 16;
  const cell = canvas.width / cols;
  const directionMap = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const keyMap = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
  };

  const scoreElement = document.querySelector('#score');
  const highScoreElement = document.querySelector('#high-score');
  const statusElement = document.querySelector('#game-status');
  const messageElement = document.querySelector('#game-message');
  const startButton = document.querySelector('#start-game');
  const pauseButton = document.querySelector('#pause-game');
  const restartButton = document.querySelector('#restart-game');
  const directionButtons = document.querySelectorAll('[data-direction]');

  let snake;
  let food;
  let enemy;
  let direction;
  let queuedDirection;
  let score;
  let highScore = readHighScore();
  let running = false;
  let paused = false;
  let gameTimer = null;
  let enemyTimer = null;

  function readHighScore() {
    try { return Number.parseInt(localStorage.getItem('cyands-worm-high-score') || '0', 10); } catch { return 0; }
  }

  function writeHighScore() {
    try { localStorage.setItem('cyands-worm-high-score', String(highScore)); } catch { /* storage is optional */ }
  }

  function resetState() {
    snake = [{ x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }];
    direction = { ...directionMap.right };
    queuedDirection = { ...direction };
    score = 0;
    food = { x: 17, y: 8 };
    enemy = { x: 5, y: 5, direction: { ...directionMap.down } };
    updateHud();
    render();
  }

  function updateHud() {
    scoreElement.textContent = String(score);
    highScoreElement.textContent = String(highScore);
  }

  function setMessage(text, danger = false) {
    messageElement.textContent = text;
    messageElement.classList.toggle('is-danger', danger);
  }

  function setStatus(text) { statusElement.textContent = text; }

  function isSamePosition(a, b) { return a.x === b.x && a.y === b.y; }

  function isReverse(next) { return next.x === -direction.x && next.y === -direction.y; }

  function requestDirection(name) {
    const next = directionMap[name];
    if (next && !isReverse(next)) queuedDirection = { ...next };
  }

  function randomFreeCell() {
    const free = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const point = { x, y };
        if (!snake.some((part) => isSamePosition(part, point)) && !isSamePosition(enemy, point)) free.push(point);
      }
    }
    return free[Math.floor(Math.random() * free.length)] || { x: 17, y: 8 };
  }

  function startGame() {
    if (running) return;
    resetState();
    running = true;
    paused = false;
    setStatus('RUNNING');
    setMessage('게임 진행 중입니다.');
    pauseButton.disabled = false;
    gameTimer = window.setInterval(tick, 140);
    enemyTimer = window.setInterval(moveEnemy, 1000);
  }

  function stopTimers() {
    if (gameTimer !== null) window.clearInterval(gameTimer);
    if (enemyTimer !== null) window.clearInterval(enemyTimer);
    gameTimer = null;
    enemyTimer = null;
  }

  function gameOver(reason) {
    running = false;
    paused = false;
    stopTimers();
    if (score > highScore) { highScore = score; writeHighScore(); }
    updateHud();
    setStatus('GAME OVER');
    setMessage(reason, true);
    pauseButton.disabled = true;
    render();
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    setStatus(paused ? 'PAUSED' : 'RUNNING');
    setMessage(paused ? '일시정지했습니다.' : '게임을 계속합니다.');
  }

  function tick() {
    if (!running || paused) return;
    direction = { ...queuedDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) return gameOver('벽에 부딪혔습니다.');
    if (snake.some((part) => isSamePosition(part, head)) || isSamePosition(enemy, head)) return gameOver('충돌했습니다.');
    snake.unshift(head);
    if (isSamePosition(head, food)) {
      score += 10;
      food = randomFreeCell();
      updateHud();
    } else snake.pop();
    render();
  }

  function moveEnemy() {
    if (!running || paused) return;
    const choices = Object.values(directionMap).filter((candidate) => !isReverseForEnemy(candidate));
    const candidate = choices[Math.floor(Math.random() * choices.length)];
    const next = { x: enemy.x + candidate.x, y: enemy.y + candidate.y };
    if (next.x < 0 || next.x >= cols || next.y < 0 || next.y >= rows) return;
    enemy = { x: next.x, y: next.y, direction: { ...candidate } };
    if (snake.some((part) => isSamePosition(part, enemy))) gameOver('적과 부딪혔습니다.');
    render();
  }

  function isReverseForEnemy(candidate) {
    return enemy.direction && candidate.x === -enemy.direction.x && candidate.y === -enemy.direction.y;
  }

  function drawCell(point, color) {
    context.fillStyle = color;
    context.fillRect(point.x * cell + 1, point.y * cell + 1, cell - 2, cell - 2);
  }

  function render() {
    context.fillStyle = '#030603';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#102810';
    for (let x = 0; x <= cols; x += 1) { context.beginPath(); context.moveTo(x * cell, 0); context.lineTo(x * cell, canvas.height); context.stroke(); }
    for (let y = 0; y <= rows; y += 1) { context.beginPath(); context.moveTo(0, y * cell); context.lineTo(canvas.width, y * cell); context.stroke(); }
    drawCell(food, '#39ff14');
    drawCell(enemy, '#ff6b6b');
    snake.forEach((part, index) => drawCell(part, index === 0 ? '#b8ffb8' : '#6fa86f'));
  }

  document.addEventListener('keydown', (event) => {
    const name = keyMap[event.key] || keyMap[event.key.toLowerCase()];
    if (name) { event.preventDefault(); requestDirection(name); }
    if (event.key === ' ') { event.preventDefault(); togglePause(); }
  });
  directionButtons.forEach((button) => button.addEventListener('click', () => requestDirection(button.dataset.direction)));
  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', () => {
    stopTimers();
    running = false;
    startGame();
  });

  resetState();
})();
