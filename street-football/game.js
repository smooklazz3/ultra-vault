const root = document.getElementById('yakar-gol');
const play = document.getElementById('yg-start');

try {
  const { start } = await import('./src/main.js');
  start(root);
  play.disabled = false;
  play.textContent = '开始比赛 →';
} catch (error) {
  document.getElementById('game-error').hidden = false;
  console.error(error);
}
