const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: 100,
    y: 150,
    width: 20,
    height: 20,
    attack: 10,
    defense: 5,
    health: 100,
    maxHealth: 100,
    gold: 0,
    color: 'blue'
};

let enemy = null;
let stage = 1;
let maxStage = 1;
let isBattling = false;
let isSpinning = false;
let isTreasure = false;

let backgroundX = 0;

let upgradeCosts = {
    attack: 50,
    defense: 50,
    health: 50
};

let battleLog = document.getElementById('battle-log');

const spinButton = document.getElementById('spin-button');
const upgradeButtons = document.querySelectorAll('.upgrade-button');
const resetButton = document.getElementById('reset-button');

// 로컬 스토리지에서 데이터 로드
function loadGameData() {
    let savedPlayer = JSON.parse(localStorage.getItem('player'));
    if (savedPlayer) {
        player.attack = savedPlayer.attack;
        player.defense = savedPlayer.defense;
        player.maxHealth = savedPlayer.maxHealth;
        player.health = player.maxHealth;
        player.gold = savedPlayer.gold;
    }

    let savedUpgradeCosts = JSON.parse(localStorage.getItem('upgradeCosts'));
    if (savedUpgradeCosts) {
        upgradeCosts = savedUpgradeCosts;
    }

    let savedMaxStage = localStorage.getItem('maxStage');
    if (savedMaxStage) {
        maxStage = parseInt(savedMaxStage);
    }
}

// 로컬 스토리지에 데이터 저장
function saveGameData() {
    localStorage.setItem('player', JSON.stringify({
        attack: player.attack,
        defense: player.defense,
        maxHealth: player.maxHealth,
        gold: player.gold
    }));
    localStorage.setItem('upgradeCosts', JSON.stringify(upgradeCosts));
    localStorage.setItem('maxStage', maxStage);
}

// 게임 데이터 초기화
function resetGameData() {
    localStorage.clear();
    player.attack = 10;
    player.defense = 5;
    player.maxHealth = 100;
    player.health = player.maxHealth;
    player.gold = 0;
    upgradeCosts = {
        attack: 50,
        defense: 50,
        health: 50
    };
    stage = 1;
    maxStage = 1;
    enemy = null;
    isBattling = false;
    isSpinning = false;
    isTreasure = false;
    battleLog.innerHTML = '';
    updateGame();
}

// 초기화 버튼 이벤트 리스너
resetButton.addEventListener('click', function() {
    if (confirm('정말로 모든 데이터를 초기화하시겠습니까?')) {
        resetGameData();
    }
});

// 게임 시작 시 데이터 로드
loadGameData();

function drawBackground() {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#a0a0a0';
    for (let x = (backgroundX % 20); x < canvas.width; x += 20) {
        for (let y = 0; y < canvas.height; y += 20) {
            ctx.fillRect(x, y, 2, 2);
        }
    }
}

function drawCharacter(character) {
    ctx.fillStyle = character.color;
    ctx.fillRect(character.x, character.y - character.height, character.width, character.height);
    drawHealthBar(character);
}

function drawHealthBar(character) {
    let healthBarWidth = 50;
    let healthPercentage = character.health / character.maxHealth;
    let healthBarX = character.x + character.width / 2 - healthBarWidth / 2;
    ctx.fillStyle = 'red';
    ctx.fillRect(healthBarX, character.y - character.height - 15, healthBarWidth, 5);
    ctx.fillStyle = 'green';
    ctx.fillRect(healthBarX, character.y - character.height - 15, healthBarWidth * healthPercentage, 5);
}

function showDamage(character, damage) {
    let damageText = document.createElement('div');
    damageText.className = 'damage-text';
    damageText.style.left = (canvas.offsetLeft + character.x + character.width / 2) + 'px';
    damageText.style.top = (canvas.offsetTop + character.y - character.height - 30) + 'px';
    damageText.innerText = `-${damage}`;
    document.body.appendChild(damageText);

    setTimeout(() => {
        document.body.removeChild(damageText);
    }, 1000);
}

function createParticles(x, y, direction) {
    for (let i = 0; i < 10; i++) {
        let particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (canvas.offsetLeft + x) + 'px';
        particle.style.top = (canvas.offsetTop + y) + 'px';
        document.body.appendChild(particle);

        particle.style.transform = 'translate(0, 0)';
        particle.style.opacity = 1;

        let angle = Math.random() * Math.PI / 2 - Math.PI / 4;
        let speed = Math.random() * 30 + 20;

        if (direction === 'left') {
            angle += Math.PI;
        }

        let dx = Math.cos(angle) * speed;
        let dy = Math.sin(angle) * speed;

        setTimeout(() => {
            particle.style.transform = `translate(${dx}px, ${dy}px)`;
            particle.style.opacity = 0;
        }, 10);

        setTimeout(() => {
            document.body.removeChild(particle);
        }, 510);
    }
}

function updateStats() {
    document.getElementById('stage').innerText = stage;
    document.getElementById('max-stage').innerText = maxStage;
    document.getElementById('attack').innerText = player.attack;
    document.getElementById('defense').innerText = player.defense;
    document.getElementById('health').innerText = player.health;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('attack-cost').innerText = upgradeCosts.attack;
    document.getElementById('defense-cost').innerText = upgradeCosts.defense;
    document.getElementById('health-cost').innerText = upgradeCosts.health;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

spinButton.addEventListener('click', function() {
    if (isBattling || isSpinning) return;
    let actions = [
        { action: 'nothing', text: '이동', symbol: '⬆' },
        { action: 'battle', text: '전투', symbol: '⚔' },
        { action: 'treasure', text: '보물상자', symbol: '💰' },
        { action: 'heal', text: '체력 회복', symbol: '❤️' }
    ];
    let result = actions[Math.floor(Math.random() * actions.length)];
    animateSlots(result);
});

function animateSlots(result) {
    isSpinning = true;
    spinButton.disabled = true;
    const slots = document.querySelectorAll('.slot');
    let symbols = ['⬆', '⚔', '💰','❤️'];
    let iterations = 10;
    let index = 0;

    let interval = setInterval(() => {
        slots.forEach(slot => {
            slot.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        });
        index++;
        if (index > iterations) {
            clearInterval(interval);
            slots.forEach(slot => slot.innerText = result.symbol);
            document.getElementById('slot-result').innerText = `결과: ${result.text}`;
            performAction(result.action);
        }
    }, 100);
}

function performAction(action) {
    moveBackground(() => {
        if (action === 'battle') {
            initiateBattle();
        } else if (action === 'treasure') {
            isTreasure = true;
            treasureTimer = 1; // 보물상자 표시 시간 (프레임 수)
            let goldFound = Math.floor(Math.random() * 50) + 10;
            player.gold += goldFound;
            logMessage(`${goldFound} 골드를 찾았습니다!`);
            stageUp();
            saveGameData();
            updateGame();
            isSpinning = false;
            if (!isBattling) {
                spinButton.disabled = false;
            }
        } else if (action === 'heal') {
            // 체력 회복 로직
            let healAmount = Math.floor(player.maxHealth * 0.2); // 최대 체력의 20%만큼 회복
            player.health = Math.min(player.health + healAmount, player.maxHealth); // 최대 체력을 넘지 않도록 제한
            logMessage(`체력이 ${healAmount}만큼 회복되었습니다!`);
            updateGame();
            isSpinning = false;
            if (!isBattling) {
                spinButton.disabled = false;
            }
        } else {
            // 아무 일도 없음
            stageUp();
            updateGame();
            isSpinning = false;
            if (!isBattling) {
                spinButton.disabled = false;
            }
        }
    });
}

function moveBackground(callback) {
    let moveDistance = 200;
    let moved = 0;
    let moveSpeed = 5;
    let moveInterval = setInterval(() => {
        backgroundX -= moveSpeed;
        moved += moveSpeed;
        if (backgroundX <= -20) {
            backgroundX += 20;
        }
        updateGame();
        if (moved >= moveDistance) {
            clearInterval(moveInterval);
            if (callback) callback();
        }
    }, 20);
}

function stageUp() {
    stage++;
    if (stage > maxStage) {
        maxStage = stage;
        saveGameData();
    }
}

function initiateBattle() {
    isBattling = true;
    upgradeButtons.forEach(button => button.disabled = true);
    enemy = {
        x: canvas.width - 150,
        y: player.y,
        width: 20,
        height: 20,
        attack: Math.floor(5 + stage * 2),
        defense: Math.floor(3 + stage),
        health: Math.floor(50 + stage * 10),
        maxHealth: Math.floor(50 + stage * 10),
        color: 'red'
    };
    battle();
}

function battle() {
    let battleInterval = setInterval(() => {
        if (player.health <= 0 || enemy.health <= 0) {
            clearInterval(battleInterval);
            endBattle();
            return;
        }
        animateAttack(player, enemy, () => {
            let damageToEnemy = Math.max(player.attack - enemy.defense, 0);
            enemy.health -= damageToEnemy;
            showDamage(enemy, damageToEnemy);
            createParticles(enemy.x + enemy.width / 2, enemy.y - enemy.height / 2, 'right');
            logMessage(`당신이 적에게 ${damageToEnemy}의 피해를 입혔습니다.`);
            updateGame();
            if (enemy.health <= 0) {
                clearInterval(battleInterval);
                endBattle();
                return;
            }
            animateAttack(enemy, player, () => {
                let damageToPlayer = Math.max(enemy.attack - player.defense, 0);
                player.health -= damageToPlayer;
                showDamage(player, damageToPlayer);
                createParticles(player.x + player.width / 2, player.y - player.height / 2, 'left');
                logMessage(`적이 당신에게 ${damageToPlayer}의 피해를 입혔습니다.`);
                updateGame();
                if (player.health <= 0) {
                    clearInterval(battleInterval);
                    endBattle();
                }
            });
        });
    }, 500);
}

function animateAttack(attacker, defender, callback) {
    let originalX = attacker.x;
    let distance = (defender.x - attacker.x) / 2;
    let frames = 10;
    let step = distance / frames;
    let index = 0;

    let attackInterval = setInterval(() => {
        attacker.x += step;
        updateGame();
        index++;
        if (index >= frames) {
            clearInterval(attackInterval);
            let returnInterval = setInterval(() => {
                attacker.x -= step;
                updateGame();
                index--;
                if (index <= 0) {
                    clearInterval(returnInterval);
                    attacker.x = originalX;
                    updateGame();
                    callback();
                }
            }, 20);
        }
    }, 20);
}


function endBattle() {
    if (player.health <= 0) {
        logMessage('패배하였습니다. 스테이지 1부터 다시 시작합니다.');
        player.health = player.maxHealth; // 체력 회복
        stage = 1; // 스테이지 초기화
        isBattling = false;
        enemy = null; // 적 정보 초기화
        upgradeButtons.forEach(button => button.disabled = false);
        spinButton.disabled = false;
        isSpinning = false;
        saveGameData();
        updateGame();
    } else if (enemy.health <= 0) {
        let goldEarned = Math.floor(20 + stage * 5);
        player.gold += goldEarned;
        logMessage(`적을 물리쳤습니다! ${goldEarned} 골드를 획득했습니다.`);
        enemy = null;
        isBattling = false;
        upgradeButtons.forEach(button => button.disabled = false);
        stageUp();
        saveGameData();
        updateGame();
        isSpinning = false;
        spinButton.disabled = false;
    }
}

function upgradeStats(type) {
    if (isBattling) return;
    if (player.gold < upgradeCosts[type]) {
        logMessage('골드가 부족합니다!');
        return;
    }
    if (type === 'attack') {
        player.attack += 5;
    } else if (type === 'defense') {
        player.defense += 5;
    } else if (type === 'health') {
        player.maxHealth += 50;
        player.health += 50;
    }
    player.gold -= upgradeCosts[type];
    upgradeCosts[type] = Math.floor(upgradeCosts[type] * 1.5);
    saveGameData();
    updateGame();
}

upgradeButtons.forEach(button => {
    button.addEventListener('click', () => {
        let type = button.getAttribute('data-type');
        upgradeStats(type);
    });
});

function logMessage(message) {
    let logEntry = document.createElement('p');
    logEntry.innerText = message;
    battleLog.appendChild(logEntry);
    battleLog.scrollTop = battleLog.scrollHeight;
}

let treasureTimer = 0;

function drawTreasure() {
    let treasureX = canvas.width / 2;
    let treasureY = player.y - 40;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💰', treasureX, treasureY);
}

function updateGame() {
    clearCanvas();
    drawBackground();
    drawCharacter(player);
    if (enemy) drawCharacter(enemy);
    if (isTreasure) {
        drawTreasure();
        treasureTimer--;
        if (treasureTimer <= 0) {
            isTreasure = false;
        }
    }
    updateStats();
}

// 게임 시작
updateGame();
