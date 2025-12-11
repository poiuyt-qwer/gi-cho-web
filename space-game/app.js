// ==========================================
// 1. 유틸리티 및 상수 정의
// ==========================================

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
    KEY_EVENT_DASH: "KEY_EVENT_DASH",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    GAME_END_LOSS: "GAME_END_LOSS",
    GAME_END_WIN: "GAME_END_WIN",
};


// 이미지 로딩 헬퍼 함수
function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`이미지를 찾을 수 없습니다: ${path}`);
            resolve(null); // 이미지가 없어도 게임이 멈추지 않게 처리
        };
    });
}

// 사각형 충돌 감지 함수
function intersectRect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

// ==========================================
// 2. EventEmitter 클래스
// ==========================================
class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach((l) => l(message, payload));
        }
    }
    clear(){
        this.listeners = {};
    }
}

// ==========================================
// 3. 게임 객체 클래스 정의
// ==========================================

class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = "";
        this.width = 0;
        this.height = 0;
        this.img = undefined;
        this.dead = false;
    }
    draw(ctx) {
        if (this.img) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }
}

class Hero extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 99;
        this.height = 75;
        this.type = 'Hero';
        this.cooldown = 0;
        this.speed = 10;
        // 보조 비행선들을 관리하기 위한 배열
        this.sidekicks = [];
        this.life = 3;
        this.points = 0;

        this.canDash = true;
        this.dashCooldown = 2500 - (currentRound - 1) * 100;
        this.dashDistance = 150;
        this.lastDashTime = 0;
    }
    
    fire() {
        if (this.canFire()) {
            gameObjects.push(new Laser(this.x + 45, this.y - 10));
            this.cooldown = 500;
            let id = setInterval(() => {
                if (this.cooldown > 0) {
                    this.cooldown -= 100;
                } else {
                    clearInterval(id);
                }
            }, 100);
        }
    }
    
    canFire() {
        return this.cooldown === 0;
    }

    dash(){
        if (!this.canDash) return;

        this.canDash = false;
        this.lastDashTime = (typeof performance !== "undefined" ? performance.now() : Date.now());
        let moved = false;

        // keyState에 따라 4방향 대쉬
        if (keyState.ArrowUp) {
            this.y -= this.dashDistance;
            moved = true;
        } else if (keyState.ArrowDown) {
            this.y += this.dashDistance;
            moved = true;
        } else if (keyState.ArrowLeft) {
            this.x -= this.dashDistance;
            moved = true;
        } else if (keyState.ArrowRight) {
            this.x += this.dashDistance;
            moved = true;
        }

        // 방향키 입력이 없다면 기본 대쉬 → 위로
        if (!moved) {
            this.y -= this.dashDistance;
        }

        // 화면 경계 처리
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
        if (this.y > canvas.height - this.height) this.y = canvas.height - this.height;

        // 5초 후 다시 가능
        setTimeout(() => {
            this.canDash = true;
        }, this.dashCooldown);
    }

    decrementLife(){
        this.life--;
        if(this.life === 0){
            this.dead = true;
        }
    }

    incrementPoints(){
        this.points += getScorePerEnemy();
    }
}

class Sidekick extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 40;  // 본체보다 작게
        this.height = 30;
        this.type = 'Sidekick';
        this.img = heroImg; // 플레이어 이미지 재사용 (또는 별도 이미지 사용 가능)
        
        // 자동 발사 로직 (1초마다)
        setInterval(() => {
            if (!this.dead) {
                // 작은 레이저 발사
                const laser = new Laser(this.x + this.width / 2 - 2.5, this.y - 10);
                laser.width = 5; // 레이저도 작게
                laser.height = 15;
                gameObjects.push(laser);
            }
        }, 1000);
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = "Enemy";
        
        // 아래로 천천히 내려오는 로직
        let id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5;
            } else {
                clearInterval(id);
            }
        }, 300);
    }
}

// 폭발 효과
class Explosion extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = 'Explosion';
        this.img = explosionImg; // 폭발 이미지
        
        // 0.3초(300ms) 후에 사라짐
        setTimeout(() => {
            this.dead = true;
        }, 300);
    }
}

class Laser extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'Laser';
        this.img = laserImg;
        
        let id = setInterval(() => {
            if (this.y > 0) {
                this.y -= 15;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

class ReflectedLaser extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'ReflectedLaser';
        this.img = greenLaserImg;

        let id = setInterval(() => {
            if (this.y < canvas.height) {
                this.y += 15;  // 아래 방향으로 이동 (Hero 쪽으로)
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}


// ==========================================
// 4. 전역 변수 및 게임 초기화
// ==========================================

let heroImg, enemyImg, laserImg, explosionImg, lifeImg, greenLaserImg;
let canvas, ctx;
let gameObjects = [];
let hero;
let eventEmitter = new EventEmitter();
let currentRound = 1;
const maxRound = 10;

const keyState = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// 라운드별 적 스케일 (1라운드: 1.0, 10라운드: 0.55)
function getEnemyScale() {
    const scale = 1 - (currentRound - 1) * 0.05;  // 1, 0.95, 0.9, ..., 0.55
    return Math.max(scale, 0.55); // 혹시 모를 음수 방지용
}

// 라운드별 반사 확률 (임의 설정)
// 1라운드: 0.2, 10라운드: 0.2 + 9*0.05 = 0.65
function getReflectProbability() {
    const base = 0.2;
    const perRound = 0.05;
    const p = base + (currentRound - 1) * perRound;
    return Math.min(p, 0.8); // 상한 80% 정도
}

// 라운드별 적 1마리당 점수
// 1라운드: 100, 2라운드: 150, ..., 10라운드: 550
function getScorePerEnemy() {
    return 100 + (currentRound - 1) * 50;
}

function startNextRound() {
    // 적/레이저/폭발만 제거하고, Hero와 Sidekick은 유지
    gameObjects = gameObjects.filter(go => go.type === 'Hero' || go.type === 'Sidekick');

    currentRound++;
    createEnemies();
}

function handleEnemiesCleared() {
    if (currentRound < maxRound) {
        startNextRound();
    } else {
        // 마지막 라운드(10라운드)까지 모두 클리어 → 최종 승리
        eventEmitter.emit(Messages.GAME_END_WIN);
    }
}


function createEnemies() {
    const BASE_MONSTER_WIDTH = 98;
    const BASE_MONSTER_HEIGHT = 50;

    const scale = getEnemyScale();
    const monsterWidth = BASE_MONSTER_WIDTH * scale;
    const monsterHeight = BASE_MONSTER_HEIGHT * scale;

    // 기본 행/열 수
    const baseRows = 3;
    const baseCols = 5;

    // 라운드가 올라갈수록 행, 열 수 증가
    const rows = baseRows + (currentRound/3 - 1);
    const cols = baseCols + (currentRound/2 - 1);

    const horizontalSpacing = monsterWidth + 10;
    const verticalSpacing = monsterHeight + 10;

    const totalWidth = cols * horizontalSpacing;
    const offsetX = (canvas.width - totalWidth) / 2;
    const startY = 50;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * horizontalSpacing;
            const y = startY + row * verticalSpacing;

            const enemy = new Enemy(x, y);
            enemy.width = monsterWidth;
            enemy.height = monsterHeight;
            enemy.img = enemyImg;
            gameObjects.push(enemy);
        }
    }
}


// 영웅 생성 시 보조 비행선도 같이 생성
function createHero() {
    hero = new Hero(
        canvas.width / 2 - 45,
        canvas.height - canvas.height / 4
    );
    hero.img = heroImg;
    gameObjects.push(hero);

    // 보조 비행선 (왼쪽)
    const leftSidekick = new Sidekick(hero.x - 50, hero.y + 20);
    hero.sidekicks.push(leftSidekick);
    gameObjects.push(leftSidekick);

    // 보조 비행선 (오른쪽)
    const rightSidekick = new Sidekick(hero.x + hero.width + 10, hero.y + 20);
    hero.sidekicks.push(rightSidekick);
    gameObjects.push(rightSidekick);
}

function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

// 영웅 이동 시 보조 비행선도 같이 이동
function updateHeroMovement() {
    if (keyState.ArrowUp) hero.y -= hero.speed;
    if (keyState.ArrowDown) hero.y += hero.speed;
    if (keyState.ArrowLeft) hero.x -= hero.speed;
    if (keyState.ArrowRight) hero.x += hero.speed;

    // 보조 비행선 위치 동기화
    if (hero.sidekicks.length >= 2) {
        // 왼쪽 비행선 위치 갱신
        hero.sidekicks[0].x = hero.x - 50;
        hero.sidekicks[0].y = hero.y + 20;
        
        // 오른쪽 비행선 위치 갱신
        hero.sidekicks[1].x = hero.x + hero.width + 10;
        hero.sidekicks[1].y = hero.y + 20;
    }
}

function updateGameObjects() {
    const enemies = gameObjects.filter(go => go.type === "Enemy");
    const lasers = gameObjects.filter(go => go.type === "Laser");
    const enemyLasers = gameObjects.filter(go => go.type === "ReflectedLaser");

    // 플레이어 레이저 vs 적
    lasers.forEach((l) => {
        enemies.forEach((m) => {
            if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
                    first: l,
                    second: m,
                });
            }
        });
    });

    // 적 vs Hero
    enemies.forEach(enemy => {
        const heroRect = hero.rectFromGameObject();
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    });

    // 반사된 레이저 vs Hero
    enemyLasers.forEach(el => {
        if (intersectRect(hero.rectFromGameObject(), el.rectFromGameObject())) {
            el.dead = true;
            hero.decrementLife();
            if (isHeroDead()) {
                eventEmitter.emit(Messages.GAME_END_LOSS);
            }
        }
    });

    gameObjects = gameObjects.filter(go => !go.dead);
}


function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();

    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
        hero.y -=5 ;
    })
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
        hero.y += 5;
    });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
        hero.x -= 5;
    });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
        hero.x += 5;
    });
    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (hero.canFire()) {
            hero.fire();
        }
    });
    eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
        resetGame();
    });
    eventEmitter.on(Messages.KEY_EVENT_DASH, () => {
        if(hero){
            hero.dash();
        }
    });
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        const reflectChance = getReflectProbability();

        // 라운드에 따른 확률로 반사
        if (Math.random() < reflectChance) {
            first.dead = true; // 원래 레이저 제거

            const reflected = new ReflectedLaser(first.x, first.y);
            gameObjects.push(reflected);

            return; // 적은 살아있고, 점수/폭발/라운드 처리 없음
        }

        // 반사 안 되고 적이 죽는 경우
        first.dead = true;
        second.dead = true;

        const explosion = new Explosion(second.x, second.y);
        gameObjects.push(explosion);

        hero.incrementPoints();

        if (isEnemiesDead()) {
            handleEnemiesCleared();
        }
    });

    eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
        enemy.dead = true;
        hero.decrementLife();

        if (isHeroDead()) {
            eventEmitter.emit(Messages.GAME_END_LOSS);
            return;
        }

        if (isEnemiesDead()) {
            handleEnemiesCleared();
        }
    });

    eventEmitter.on(Messages.GAME_END_WIN, () => { // 추가
        endGame(true);
    });
    eventEmitter.on(Messages.GAME_END_LOSS, () => { // 추가
        endGame(false);
    });
}
let gameLoopId
window.onload = async () => {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    heroImg = await loadTexture("assets/png/player.png");
    enemyImg = await loadTexture("assets/png/enemyShip.png");
    laserImg = await loadTexture("assets/png/laserRed.png");
    explosionImg = await loadTexture("assets/png/laserRedShot.png");
    lifeImg = await loadTexture("assets/png/life.png");
    greenLaserImg = await loadTexture("assets/png/laserGreen.png");

    initGame();

    gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawRound();
        drawPoints();
        drawLife();
        updateHeroMovement(); 
        drawGameObjects(ctx);
        updateGameObjects();
        drawDashBar();
    }, 20); 
};

window.addEventListener("keyup", (evt) => {
    if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEY_EVENT_UP);
    } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    } else if (evt.key === "ArrowLeft") {
        eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    } else if (evt.key === "ArrowRight") {
        eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    } else if(evt.keyCode === 32) {
        eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    } else if(evt.key === "Enter"){
        eventEmitter.emit(Messages.KEY_EVENT_ENTER);
    } else if(evt.key === "Shift"){
        eventEmitter.emit(Messages.KEY_EVENT_DASH);
    }
    if(evt.key in keyState){
        keyState[evt.key] = false;
    }
});

let onKeyDown = function (e) {
    console.log(e.keyCode); // 눌린 키의 keyCode를 출력
    switch (e.keyCode) {
        case 37: // 왼쪽 화살표
        case 38: // 위쪽 화살표
        case 39: // 오른쪽 화살표
        case 40: // 아래쪽 화살표
        case 32: // 스페이스바
            e.preventDefault(); // 기본 동작 차단
            break;
        default:
            break; // 다른 키는 기본 동작 유지
    }
};
window.addEventListener('keydown', onKeyDown);
window.addEventListener("keydown", (evt) => {
    if (evt.key in keyState) {
        keyState[evt.key] = true;
    }
});
function drawLife() {
    const START_POS = canvas.width - 180;
    for(let i=0; i < hero.life; i++ ) {
    ctx.drawImage(
        lifeImg, 
        START_POS + (45 * (i+1) ), 
        canvas.height - 37);
    }
}
function drawRound() {
  ctx.font = "24px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  drawText("Round: " + currentRound, canvas.width - 10, 30);
}
function drawPoints() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "left";
    drawText("Points: " + hero.points, 10, canvas.height-20);
}
function drawText(message, x, y) {
    ctx.fillText(message, x, y);
}
function drawDashBar() {
    if (!hero) return;

    const barWidth = 80;
    const barHeight = 8;
    const x = hero.x + hero.width / 2 - barWidth / 2;
    const y = hero.y + hero.height + 10;

    // 배경 바 (쿨타임 전체 길이)
    ctx.fillStyle = "gray";
    ctx.fillRect(x, y, barWidth, barHeight);

    // 진행률 계산
    let ratio = 1;
    if (!hero.canDash) {
        const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
        const elapsed = now - hero.lastDashTime;
        ratio = Math.max(0, Math.min(elapsed / hero.dashCooldown, 1));
    }

    // 실제 채워지는 바
    // 쿨타임 중: 주황색, 준비 완료: 청록색
    ctx.fillStyle = hero.canDash ? "cyan" : "orange";
    ctx.fillRect(x, y, barWidth * ratio, barHeight);

    // 테두리
    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, barWidth, barHeight);
}

function isHeroDead() {
    return hero.life <= 0;
}
function isEnemiesDead() {
    const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
    return enemies.length === 0;
}
function displayMessage(message, color = "red") {
    ctx.font = "30px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}
function endGame(win) {
    clearInterval(gameLoopId);
    if (hero && hero.sidekicks) {
        hero.sidekicks.forEach(sk => {
        sk.dead = true;
        });
    }
    // 게임 화면이 겹칠 수 있으니, 200ms 지연
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (win) {
            displayMessage(
            "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
            "green"
            );
        } else {
            displayMessage(
            "You died !!! Press [Enter] to start a new game Captain Pew Pew"
            );
        }
        // 점수 출력 (메시지 아래쪽에 추가)
        ctx.font = "26px Arial";
        ctx.fillStyle = "yellow";
        ctx.textAlign = "center";
        ctx.fillText(
            "Final Score: " + hero.points,
            canvas.width / 2,
            canvas.height / 2 + 50
        );
    }, 200)  
}
function resetGame() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
    }

    eventEmitter.clear();  // 리스너 전부 날림
    currentRound = 1;
    initGame();            // 새 Hero/적 + 새 리스너들 등록

    gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawRound();
        drawPoints();
        drawLife();
        updateGameObjects();
        drawGameObjects(ctx);
        updateHeroMovement();
        drawDashBar();
    }, 20);
}
