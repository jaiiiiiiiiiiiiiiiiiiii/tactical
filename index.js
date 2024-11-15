const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1080;
canvas.height = 576;

const shootingeffect = new Audio('bloody-gunshot-230516.mp3');
shootingeffect.preload = 'auto';  // Preload the sound to avoid delays
const hiteffect = new Audio('hit-swing-sword-small-2-95566.mp3');
const metalhiteffect = new Audio('metal-hit-94-200422.mp3');
const winsound = new Audio('mixkit-game-level-completed-2059.wav')

function drawBackground() {
    c.fillStyle = '#ECDFCC';
    c.fillRect(0, 0, 156, canvas.height); // Left area
    c.fillRect(922, 0, 158, canvas.height); // Right area
    c.fillStyle = '#3C3D37';
    c.fillRect(156, 0, 766, canvas.height); // Middle area
}

function drawRectangles() {
    c.fillStyle = '#697565';
    rectangles.forEach(rect => c.fillRect(rect.x, rect.y, rect.width, rect.height));
}

function drawLines() {
    c.strokeStyle = 'black';
    c.beginPath();
    c.moveTo(156, 0);
    c.lineTo(156, canvas.height);
    c.moveTo(922, 0);
    c.lineTo(922, canvas.height);
    c.stroke();
}

class Player {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = 21.75;
        this.color = color;
        this.speed = 2;
        this.dx = 0;
        this.dy = 0;
        this.lastDirection = { dx: 0, dy: 0 };
        this.bullets = [];
        this.health = 100; // Starting health
        this.isDead = false; // Player is alive at the start
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        
        // Draw health bar above the player
        c.fillStyle = 'red';
        c.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2, 5);
        c.fillStyle = 'green';
        c.fillRect(this.x - this.radius, this.y - this.radius - 10, (this.health / 100) * this.radius * 2, 5);

        this.bullets.forEach(bullet => bullet.draw());
    }

    move() {
        const newX = this.x + this.dx;
        const newY = this.y + this.dy;

        if (!this.isColliding(newX, newY)) {
            if (newX - this.radius >= 0 && newX + this.radius <= canvas.width) {
                this.x = newX;
            }
            if (newY - this.radius >= 0 && newY + this.radius <= canvas.height) {
                this.y = newY;
            }
        }
    }

    isColliding(newX, newY) {
        return rectangles.some(rect =>
            newX + this.radius > rect.x &&
            newX - this.radius < rect.x + rect.width &&
            newY + this.radius > rect.y &&
            newY - this.radius < rect.y + rect.height
        );
    }

    shoot() {
        if (this.lastDirection.dx !== 0 || this.lastDirection.dy !== 0) {
            const bullet = new Bullet(this.x, this.y, this.lastDirection.dx, this.lastDirection.dy);
            this.bullets.push(bullet);
            shootingeffect.play();
        }
    }

    checkBulletCollision(opponent) {
        this.bullets.forEach(bullet => {
            const dist = Math.hypot(bullet.x - opponent.x, bullet.y - opponent.y);
    
            // Bullet collision check: if distance is small enough, it's a hit
            if (dist - opponent.radius - bullet.radius < 1) {
                if (!bullet.isDestroyed) {
                    bullet.isDestroyed = true; // Destroy the bullet upon hit
                    createPlayerHitEffect(bullet.x, bullet.y); // Original rectangle hit effect (optional)
                    opponent.takeDamage(25); // Decrease opponent's health by 25
    
                    // Create a new player hit effect
                    createPlayerHitEffect(opponent.x, opponent.y); 
                    hiteffect.currentTime = 0;
                    hiteffect.play();
                }
            }
        });
    }
        
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true; // Player is dead
        }
    }    

    isDead() {
        return this.health === 0;
    }
}

class Bullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = 'yellow';
        this.dx = dx * 5; // Adjust speed of bullet
        this.dy = dy * 5; // Adjust speed of bullet
        this.isDestroyed = false;
    }

    draw() {
        if (!this.isDestroyed) {
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
            this.update();
        }
    }

    update() {
        if (this.isDestroyed) return; // Prevent further updates if the bullet is destroyed
        const newX = this.x + this.dx;
        const newY = this.y + this.dy;

        if (this.isCollidingWithRectangle(newX, newY)) {
            this.isDestroyed = true; // Destroy bullet on collision with rectangle
            createEffect(this.x, this.y); // Trigger effect on collision

            metalhiteffect.currentTime = 0;  // Reset to avoid delay
            metalhiteffect.play(); // Play sound on collision
        } else {
            this.x = newX;
            this.y = newY;
        }

    }

    isCollidingWithRectangle(newX, newY) {
       
        return rectangles.some(rect =>
            newX + this.radius > rect.x &&
            newX - this.radius < rect.x + rect.width &&
            newY + this.radius > rect.y &&
            newY - this.radius < rect.y + rect.height
        );
    }
}
class Effect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.alpha = 1; // Transparency
    }

    draw() {
        if (this.alpha > 0) {
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = `rgba(255, 165, 0, ${this.alpha})`; // Fading orange effect
            c.fill();
            this.update();
        }
    }

    update() {
        this.alpha -= 0.02; // Gradually fade
        this.radius += 0.5; // Gradually grow
    }
}

class PlayerHitEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.alpha = 1; // Transparency
        this.scale = 1; // Starting size of the effect
    }

    draw() {
        if (this.alpha > 0) {
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = `rgba(255, 67, 0, ${this.alpha})`; // Red flash effect
            c.fill();
            this.update();
        }
    }

    update() {
        this.alpha -= 0.05; // Gradually fade
        this.radius += 0.5; // Expand the effect
    }
}

const playerHitEffects = [];

function createPlayerHitEffect(x, y) {
    playerHitEffects.push(new PlayerHitEffect(x, y));
}

const effects = [];
function createEffect(x, y) {
    effects.push(new Effect(x, y));
}

const rectangles = [
    { x: 293, y: 103, width: 221, height: 151 },
    { x: 365, y: 365, width: 96, height: 57 },
    { x: 666, y: 138, width: 96, height: 57 },
    { x: 576, y: 321, width: 221, height: 151 },
];

const player1 = new Player(223.5, 167, 'black');
const player2 = new Player(870, 396, 'red');
let winner = null;
let winner2 = null;

function displayWinMessage() {
    c.fillStyle = 'rgba(0, 0, 0, 0.5)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = 'white';
    c.font = 'bold 64px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`${winner} Wins!`, canvas.width / 2, canvas.height / 2);
}

function displayWinMessage2() {
    c.fillStyle = 'rgba(0, 0, 0, 0.5)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = 'white';
    c.font = 'bold 64px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`${winner2} captures the area!`, canvas.width / 2, canvas.height / 2);
}

function checkWin() {
    // Player 1 wins if their health reaches 0
    if (player1.health <= 0) {
        winsound.play();
        winner = 'Player 2';
    }
    // Player 2 wins if their health reaches 0
    else if (player2.health <= 0) {
        winsound.play();
        winner = 'Player 1';
    }
    // Check if player 1 crosses the right side of the canvas
    else if (player1.x + player1.radius >= 922) {
        winsound.play();
        winner2 = 'Player 1';
    }

    // Check if player 2 crosses the left side of the canvas
    else if (player2.x - player2.radius <= 156) {
        winsound.play();
        winner2 = 'Player 2';
    }

    // Check bullet collisions between players
    else {
        player1.checkBulletCollision(player2);
        player2.checkBulletCollision(player1);
    }
}

function drawHealthBar(player) {
    c.fillStyle = 'red';
    c.fillRect(player.x - 25, player.y - 30, 50, 10); // Draw the background bar
    c.fillStyle = 'green';
    c.fillRect(player.x - 25, player.y - 30, (player.health / 100) * 50, 10); // Fill bar based on health
}

function drawHealthBar(player) {
    c.fillStyle = 'red';
    c.fillRect(player.x - 25, player.y - 30, 50, 10); // Background bar
    c.fillStyle = 'green';
    c.fillRect(player.x - 25, player.y - 30, (player.health / 100) * 50, 10); // Health based on current value
}

function animate() {
    if (winner) {
        displayWinMessage();
        return;
    }
    if (winner2) {
        displayWinMessage2();
        return;
    }

    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawRectangles();
    drawLines();
    player1.draw();
    player2.draw();
    effects.forEach(effect => effect.draw()); // Draw the rectangle collision effects
    playerHitEffects.forEach(effect => effect.draw()); // Draw player hit effects
    drawHealthBar(player1); // Draw player 1 health bar
    drawHealthBar(player2); // Draw player 2 health bar
    player1.move();
    player2.move();
    checkWin();
}

window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w': player1.dy = -player1.speed; player1.lastDirection = { dx: 0, dy: -1 }; break;
        case 's': player1.dy = player1.speed; player1.lastDirection = { dx: 0, dy: 1 }; break;
        case 'a': player1.dx = -player1.speed; player1.lastDirection = { dx: -1, dy: 0 }; break;
        case 'd': player1.dx = player1.speed; player1.lastDirection = { dx: 1, dy: 0 }; break;
        case ' ': player1.shoot();shootingeffect.currentTime = 0;shootingeffect.play(); break;
        case 'ArrowUp': player2.dy = -player2.speed; player2.lastDirection = { dx: 0, dy: -1 }; break;
        case 'ArrowDown': player2.dy = player2.speed; player2.lastDirection = { dx: 0, dy: 1 }; break;
        case 'ArrowLeft': player2.dx = -player2.speed; player2.lastDirection = { dx: -1, dy: 0 }; break;
        case 'ArrowRight': player2.dx = player2.speed; player2.lastDirection = { dx: 1, dy: 0 }; break;
        case 'Enter': player2.shoot();shootingeffect.currentTime = 0;shootingeffect.play(); break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
        case 's': player1.dy = 0; break;
        case 'a':
        case 'd': player1.dx = 0; break;
        case 'ArrowUp':
        case 'ArrowDown': player2.dy = 0; break;
        case 'ArrowLeft':
        case 'ArrowRight': player2.dx = 0; break;
    }
});

animate();
//completed//