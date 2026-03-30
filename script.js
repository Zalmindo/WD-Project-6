const startScreen = document.getElementById('start-screen');
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');

const showSetupButton = document.getElementById('show-setup-btn');
const beginGameButton = document.getElementById('begin-game-btn');

const timerChoiceButtons = document.querySelectorAll('#timer-choices .choice-btn');
const difficultyChoiceButtons = document.querySelectorAll('#difficulty-choices .choice-btn');

const timeDisplay = document.getElementById('time-display');
const scoreDisplay = document.getElementById('score-display');
const gameArea = document.getElementById('game-area');
const dropsLayer = document.getElementById('drops-layer');
const jerryCan = document.getElementById('jerry-can');
const wordInput = document.getElementById('word-input');
const typingForm = document.getElementById('typing-form');
const resetGameButton = document.getElementById('reset-game-btn');

const wordBank = [
	'water',
	'clean',
	'hope',
	'health',
	'wells',
	'village',
	'river',
	'pump',
	'future',
	'care',
	'safe',
	'world'
];

const fallSpeedByDifficulty = {
	easy: 3,
	medium: 4.5,
	hard: 6
};

const spawnRateByDifficulty = {
	easy: 1200,
	medium: 900,
	hard: 700
};

let selectedTime = 30;
let selectedDifficulty = 'easy';

let score = 0;
let timeLeft = 0;
let activeDrops = [];

let spawnIntervalId = null;
let gameLoopIntervalId = null;
let countdownIntervalId = null;
let isGameRunning = false;

showSetupButton.addEventListener('click', () => {
	startScreen.classList.add('hidden');
	setupScreen.classList.remove('hidden');
});

timerChoiceButtons.forEach((button) => {
	button.addEventListener('click', () => {
		timerChoiceButtons.forEach((btn) => btn.classList.remove('active'));
		button.classList.add('active');
		selectedTime = Number(button.dataset.time);
	});
});

difficultyChoiceButtons.forEach((button) => {
	button.addEventListener('click', () => {
		difficultyChoiceButtons.forEach((btn) => btn.classList.remove('active'));
		button.classList.add('active');
		selectedDifficulty = button.dataset.difficulty;
	});
});

beginGameButton.addEventListener('click', () => {
	setupScreen.classList.add('hidden');
	gameScreen.classList.remove('hidden');
	startGame();
});

resetGameButton.addEventListener('click', () => {
	resetGameToSetup();
});

typingForm.addEventListener('submit', (event) => {
	event.preventDefault();

	const typedWord = wordInput.value.trim().toLowerCase();
	if (typedWord === '') {
		return;
	}

	// Destroy the first dirty drop that matches the typed word.
	const matchingDrop = activeDrops.find((drop) => {
		return drop.type === 'dirty' && drop.word.toLowerCase() === typedWord;
	});

	if (matchingDrop) {
		removeDrop(matchingDrop.id);
	}

	wordInput.value = '';
});

// Keep focus on the typing box while the game is active.
wordInput.addEventListener('blur', () => {
	if (!isGameRunning) {
		return;
	}

	setTimeout(() => {
		if (isGameRunning && document.activeElement !== resetGameButton) {
			wordInput.focus();
		}
	}, 0);
});

gameArea.addEventListener('click', () => {
	if (isGameRunning) {
		wordInput.focus();
	}
});

function startGame() {
	score = 0;
	timeLeft = selectedTime;
	activeDrops = [];
	isGameRunning = true;
	dropsLayer.innerHTML = '';
	updateScore();
	updateTime();

	const spawnRate = spawnRateByDifficulty[selectedDifficulty];
	spawnIntervalId = setInterval(createDrop, spawnRate);

	gameLoopIntervalId = setInterval(() => {
		moveDrops();
		checkForReachedJerryCan();
	}, 40);

	countdownIntervalId = setInterval(() => {
		timeLeft -= 1;
		updateTime();

		if (timeLeft <= 0) {
			endGame();
		}
	}, 1000);

	wordInput.focus();
}

function createDrop() {
	const isDirty = Math.random() < 0.6;
	const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
	const dropStartY = 250;

	const dropElement = document.createElement('div');
	dropElement.classList.add('drop');

	const xPosition = getRandomXPosition();
	dropElement.style.left = `${xPosition}px`;
	dropElement.style.top = `${dropStartY}px`;

	let word = '';
	if (isDirty) {
		dropElement.classList.add('dirty');
		word = wordBank[Math.floor(Math.random() * wordBank.length)];
		dropElement.textContent = word;
	} else {
		dropElement.classList.add('clean');
	}

	dropsLayer.appendChild(dropElement);

	activeDrops.push({
		id,
		type: isDirty ? 'dirty' : 'clean',
		word,
		x: xPosition,
		y: dropStartY,
		element: dropElement
	});
}

function getRandomXPosition() {
	const gameAreaWidth = gameArea.clientWidth;
	const dropWidth = 80;
	const maxX = gameAreaWidth - dropWidth;
	return Math.floor(Math.random() * Math.max(maxX, 1));
}

function moveDrops() {
	const speed = fallSpeedByDifficulty[selectedDifficulty];

	activeDrops.forEach((drop) => {
		drop.y += speed;
		drop.element.style.top = `${drop.y}px`;
	});
}

function checkForReachedJerryCan() {
	const targetTop = jerryCan.offsetTop - 16;

	// Work on a copy so we can safely remove drops inside the loop.
	[...activeDrops].forEach((drop) => {
		if (drop.y >= targetTop) {
			if (drop.type === 'clean') {
				score += 1;
			} else {
				score = Math.max(0, score - 1);
			}

			updateScore();
			removeDrop(drop.id);
		}
	});
}

function removeDrop(dropId) {
	const index = activeDrops.findIndex((drop) => drop.id === dropId);
	if (index === -1) {
		return;
	}

	activeDrops[index].element.remove();
	activeDrops.splice(index, 1);
}

function updateScore() {
	scoreDisplay.textContent = score;
}

function updateTime() {
	timeDisplay.textContent = timeLeft;
}

function endGame() {
	stopGameLoops();

	activeDrops.forEach((drop) => drop.element.remove());
	activeDrops = [];

	alert(`Great job, you scored ${score} points!`);

	gameScreen.classList.add('hidden');
	startScreen.classList.remove('hidden');
}

function resetGameToSetup() {
	stopGameLoops();
	activeDrops.forEach((drop) => drop.element.remove());
	activeDrops = [];
	dropsLayer.innerHTML = '';
	wordInput.value = '';

	gameScreen.classList.add('hidden');
	setupScreen.classList.remove('hidden');
	wordInput.blur();
}

function stopGameLoops() {
	clearInterval(spawnIntervalId);
	clearInterval(gameLoopIntervalId);
	clearInterval(countdownIntervalId);
	isGameRunning = false;
}
