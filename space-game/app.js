function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}


function createEnemies2(ctx, canvas, enemyImg) {
  const numRows = 5;
  const startY = 50;
  const rowSpacing = 10;
  const enemyHeight = enemyImg.height;
  const enemyWidth = enemyImg.width;

  const maxEnemies = 1 + (numRows - 1) * 2;

  for (let r = 0; r < numRows; r++) {
    const numEnemiesInRow = maxEnemies - r * 2;
    const y = startY + r * (enemyHeight + rowSpacing);

    const rowWidth = numEnemiesInRow * enemyWidth;
    const startX = (canvas.width - rowWidth) / 2;

    for (let e = 0; e < numEnemiesInRow; e++) {
      const x = startX + e * enemyWidth;
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

window.onload = async () => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  // 이미지 로드
  const heroImg = await loadTexture("assets/png/player.png");
  const enemyImg = await loadTexture("assets/png/enemyShip.png");
  
  // 배경 이미지 로드
  const bgImg = await loadTexture("assets/png/background/starBackground.png");

  // 캔버스 배경 설정
  const bgPattern = ctx.createPattern(bgImg, "repeat");
  ctx.fillStyle = bgPattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 적군 그리기
  createEnemies2(ctx, canvas, enemyImg);

  const heroX = canvas.width / 2 - heroImg.width / 2;
  const heroY = canvas.height - canvas.height / 4;
  ctx.drawImage(heroImg, heroX, heroY);

  const auxWidth = heroImg.width * 0.5;
  const auxHeight = heroImg.height * 0.5;
  const spacing = 10;

  // 메인 우주선과 세로 중앙 정렬
  const auxY = heroY + (heroImg.height - auxHeight) / 2;

  // 왼쪽 보조 우주선
  const leftAuxX = heroX - auxWidth - spacing;
  ctx.drawImage(heroImg, leftAuxX, auxY, auxWidth, auxHeight);

  // 오른쪽 보조 우주선
  const rightAuxX = heroX + heroImg.width + spacing;
  ctx.drawImage(heroImg, rightAuxX, auxY, auxWidth, auxHeight);
};