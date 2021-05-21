const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreEl = document.querySelector(".score");

const projectiles = [];
const enemies = [];
const particles = [];

// drawing based this property : 중앙의 원
class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    // 뭔가를 그리기 시작함, 원을 그림 => D3처럼 명령형
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    // 위치(좌표값)
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity; // 얘는 움직이니까 속도
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  // 속도를 더한게 새로운 위치 => 전진하는 좌표 속도
  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}
const friction = 0.98;

class Particle {
  constructor(x, y, radius, color, velocity) {
    // 위치(좌표값)
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity; // 얘는 움직이니까 속도
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    // transition over time (save -> restore)
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    // 위치(좌표값)
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity; // 얘는 움직이니까 속도
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  // 속도를 더한게 새로운 위치 => 전진하는 좌표 속도
  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

const player = new Player(x, y, 10, "white");

player.draw();

function spawnEnemies() {
  setInterval(() => {
    // 크기도 랜덤으로
    const radius = Math.random() * (30 - 4) + 4;
    let x;
    let y;
    // 캔버스 바깥쪽에서부터 랜덤으로
    // 난수를 통해 첫 포지션을 랜덤으로 설정
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    // 랜덤컬러만들때 hsl을 주로 쓴다
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

    // x,y로 가게 만드는 각도를 구한다
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);

    // 해당 각도를 향해 나아가는 x,y velocity
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

spawnEnemies();
let animationId;
let score = 0;
function animate() {
  // 프레임에 번호를 준다(setInterval 처럼)
  animationId = requestAnimationFrame(animate); //재귀적으로 호출하면 계속 반복된다

  // 배경을 검정으로 칠하는데, 모든 요소들에게 0.1의 opacity를 줌
  // frame을 거듭하면서 잔상처럼 나타남(ㄷㄷ)
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  // 사각형 그리기
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();

  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  // 클릭을 안하면 배열이 비었기 때문에 총알을 안그림
  projectiles.forEach((projectile, index) => {
    projectile.update();
    // 화면 밖으로 나갔을때 총알을 없앰(최적화)
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });
  enemies.forEach((enemy, index) => {
    // 에네미를 그리면
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    if (dist - enemy.radius - player.radius < 1) {
      console.log("끝!");
      cancelAnimationFrame(animationId);
    }

    // 지금 있는 총알을 모두 순회하며 총알과 에너미와의 두 좌표 사이의 거리를 구함
    // 그게 0이 된다면 === 맞는것
    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      // 거리에서 두 원의 직경을 뺀 값이 1 이하라면 === 닿는거
      if (dist - enemy.radius - projectile.radius < 1) {
        // 맞았을때 8개의 particle을 배열에 넣음

        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2, // particle의 radius를 랜덤값으로
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() - 0.5 * 8),
                y: (Math.random() - 0.5) * (Math.random() - 0.5 * 8),
              }
            )
          );
        }
        // 맞았을때 맞은 에너미의 radius를 평가하여 크기를 줄이거나 없앰
        if (enemy.radius - 10 > 5) {
          // gsap 라이브러리를 사용하여 점차적인 에니메이션을 줌
          score += 100;
          scoreEl.innerText = score;
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });

          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          // 다 부셔버렸을때 보너스 제공
          score += 250;
          scoreEl.innerText = score;
          // 닿으면 제거
          // setImmediate => 동기 작업이 다 끝났을때 두개를 지움
          // 약간 nextTick같은 느낌이겟다...
          // 이 처리를 안해주면 닿을때 없어지기전에 깜빡임 == 배열에서 제거했지만 다음 애니메이션 프레임에서 다시 그리려고 시도하기 때문인듯??
          setTimeout(() => {
            enemies.splice(index, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

// 총알이 날라갈 각도, 삼각함수, x/y velocity
window.addEventListener("click", (event) => {
  // 탄젠트의 역함수
  // 마우스의 좌표와 원점간의 역탄젠트, 즉 각도를 구하는 atan2(아크탄젠트)
  // atan2는 상대좌표를 받아 절대각은 -파이 ~ 파이의 라디안 값으로 반환
  // tan()
  const angle = Math.atan2(
    event.clientY - canvas.height / 2, // 마우스 y좌표 - 원점
    event.clientX - canvas.width / 2 // 마우스 x 좌표 - 원점
  );

  // 각도를 알았으니 가야하는 좌표 전진속도를 코사인과 사인(각도)로 구함
  const velocity = {
    x: Math.cos(angle) * 4,
    y: Math.sin(angle) * 4,
  };

  projectiles.push(
    new Projectile(
      canvas.width / 2,
      canvas.height / 2,
      5, // diameter
      "white",
      velocity
    )
  );
});

animate();

console.log(player);
