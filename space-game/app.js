// ==========================================
// 1. 유틸리티 및 상수 정의
// ==========================================

const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
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
}

// ★ 신규 추가: 보조 비행선 (Sidekick)
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

// ★ 신규 추가: 폭발 효과 (Explosion)
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

// ==========================================
// 4. 전역 변수 및 게임 초기화
// ==========================================

let heroImg, enemyImg, laserImg, explosionImg;
let canvas, ctx;
let gameObjects = [];
let hero;
let eventEmitter = new EventEmitter();

const keyState = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// ★ 수정됨: 적군을 피라미드(삼각형) 형태로 배치
function createEnemies() {
    const MONSTER_WIDTH = 98;
    const MONSTER_HEIGHT = 50;
    const ROWS = 5; 
    const SCREEN_CENTER_X = canvas.width / 2;

    for (let row = 0; row < ROWS; row++) {
        const enemiesInRow = row + 1; 
        const rowWidth = enemiesInRow * MONSTER_WIDTH;
        const startX = SCREEN_CENTER_X - (rowWidth / 2);

        for (let i = 0; i < enemiesInRow; i++) {
            const x = startX + i * MONSTER_WIDTH;
            const y = row * MONSTER_HEIGHT + 50; 
            const enemy = new Enemy(x, y);
            enemy.img = enemyImg;
            gameObjects.push(enemy);
        }
    }
}

// ★ 수정됨: 영웅 생성 시 보조 비행선도 같이 생성
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

// ★ 수정됨: 영웅 이동 시 보조 비행선도 같이 이동
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

    gameObjects = gameObjects.filter(go => !go.dead);
}

function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();

    // eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    //     if (hero.canFire()) {
    //         hero.fire();
    //     }
    // });
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

    // 충돌 처리: 적이 죽을 때 폭발 효과 생성
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.dead = true;  // 레이저 제거
        second.dead = true; // 적 제거
        
        const explosion = new Explosion(second.x, second.y);
        gameObjects.push(explosion);
    });
}

window.onload = async () => {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    heroImg = await loadTexture("assets/png/player.png");
    enemyImg = await loadTexture("assets/png/enemyShip.png");
    laserImg = await loadTexture("assets/png/laserRed.png");
    explosionImg = await loadTexture("assets/png/laserRedShot.png");

    initGame();

    setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        updateHeroMovement(); 
        drawGameObjects(ctx);
        updateGameObjects();
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
