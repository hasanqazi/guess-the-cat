const EventType = { DEFAULT: "DEFAULT", HALLOWEEN: "HALLOWEEN", CHRISTMAS: "CHRISTMAS" };
let eventType = EventType.DEFAULT;
if (new Date().getMonth() === 9) eventType = EventType.HALLOWEEN;
if (new Date().getMonth() === 11) eventType = EventType.CHRISTMAS;
const SNOWFLAKE_COUNT = 500;
const SNOWFLAKE_FADE_OUT = 0.5;
const SNOWFLAKE_SIZE = '1.5em';
const catElement = document.querySelector('.cat');
const pawsElement = document.querySelector('.paws');
if (eventType === EventType.HALLOWEEN) {
    document.body.style.background = "url('assets/images/background_hal.svg') repeat";
    if (catElement) catElement.src = 'assets/images/bitmap_hal.svg';
    document.documentElement.style.setProperty('--mouse-cursor', "url('assets/images/mouse_hal.svg'), pointer");
} else if (eventType === EventType.CHRISTMAS) {
    document.body.style.background = "url('assets/images/background_chr.svg') repeat";
    if (catElement) catElement.src = 'assets/images/bitmap_chr.svg';
    if (pawsElement) pawsElement.src = 'assets/images/paws_chr.svg';
    document.documentElement.style.setProperty('--mouse-cursor', "url('assets/images/mouse_chr.png'), pointer");
} else {
    document.body.style.background = "url('assets/images/background.svg') repeat";
    if (catElement) catElement.src = 'assets/images/bitmap.svg';
    document.documentElement.style.setProperty('--mouse-cursor', "url('assets/images/mouse.svg'), pointer");
}

if (eventType === EventType.CHRISTMAS) {
    document.getElementById('countdown').style.color = "white";
    createSnowflakes();
}

let allCatNames = [];
let correctCatName = "";
let pixelatedImages = [];
let currentImageLevel = 0;
let isPixelatedMode = false;
let guessedCats = new Set();
let attempts = 0;
let solved = false;
const circles = document.querySelectorAll('.circle');

const todayFormatted = (function (date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    return `${year}-${month}-${day}`;
})(new Date());

const gameStateKey = `gameState_${todayFormatted}`;
const guessInput = document.getElementById('guessInput');
const autocompleteList = document.getElementById('autocomplete-list');
guessInput.disabled = true;

function createSnowflakes() {
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.textContent = '❄';
        
        const left = Math.random() * window.innerWidth;
        const duration = 12 + Math.random() * 4;
        const delay = Math.random() * 2;
        const swayAmount = (Math.random() - 0.5) * 100;
        
        snowflake.style.left = left + 'px';
        snowflake.style.fontSize = SNOWFLAKE_SIZE;
        snowflake.style.setProperty('--tx', swayAmount + 'px');
        snowflake.style.setProperty('--fade-out', SNOWFLAKE_FADE_OUT);
        snowflake.style.animationDuration = duration + 's';
        snowflake.style.animationDelay = delay + 's';
        
        document.body.appendChild(snowflake);
        
        setTimeout(() => snowflake.remove(), (duration + delay) * 1000);
    }
    
    for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
        setTimeout(createSnowflake, i * 50);
    }
    
    setInterval(createSnowflake, 200);
}

function setPixelatedImage() {
    const catContainer = document.getElementById('catImageContainer');
    catContainer.innerHTML = `<img src="${pixelatedImages[currentImageLevel]}" referrerpolicy="no-referrer">`;
}

function saveGameState() {
    const gameState = {
        attempts,
        solved,
        guessedCats: Array.from(guessedCats),
        currentImageLevel,
        isPixelatedMode,
        correctCatName
    };
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem(gameStateKey);
    if (savedState) {
        const gameState = JSON.parse(savedState);
        attempts = gameState.attempts || 0;
        solved = gameState.solved || false;
        guessedCats = new Set(gameState.guessedCats || []);
        currentImageLevel = gameState.currentImageLevel || 0;
        isPixelatedMode = gameState.isPixelatedMode || false;
        correctCatName = gameState.correctCatName;

        circles.forEach((circle, i) => {
            if (i < attempts) {
                circle.style.backgroundColor = "#F44336";
            } else if (solved && i === attempts) {
                circle.style.backgroundColor = "#4CAF50";
            } else {
                circle.style.backgroundColor = "white";
            }
        });

        if (solved) {
            guessInput.disabled = true;
            document.getElementById('statusMessage').textContent =
                `You have already guessed the cat for today, it was ${correctCatName}.`;
        } else if (attempts >= circles.length) {
            guessInput.disabled = true;
            document.getElementById('statusMessage').textContent =
                `You didn't guess the cat for today, it was ${correctCatName}.`;
        } else {
            guessInput.disabled = false;
        }

        if (isPixelatedMode) {
            currentImageLevel = Math.min(attempts, 4);
            setPixelatedImage();
        }
    }
}

fetch('cats.json')
    .then(response => {
        if (!response.ok) throw new Error('Network error');
        return response.json();
    })
    .then(data => {
        const catContainer = document.getElementById('catImageContainer');
        const catData = data[todayFormatted];
        allCatNames = [...new Set(Object.values(data).map(cat => cat.name))];
        allCatNames.sort();

        let selectedCat;
        if (catData) {
            selectedCat = catData;
        } else {
            const allDates = Object.keys(data);
            const hash = Array.from(todayFormatted).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const index = hash % allDates.length;
            selectedCat = data[allDates[index]];
        }

        correctCatName = selectedCat.name;

        if (selectedCat.gametype === "pixelated") {
            isPixelatedMode = true;
            pixelatedImages = selectedCat.pixelated || [];
            currentImageLevel = 0;
            setPixelatedImage();
        } else {
            isPixelatedMode = false;
            catContainer.innerHTML = `<img src="${selectedCat.image}" referrerpolicy="no-referrer">`;
        }

        loadGameState();

        const lastPlayDate = localStorage.getItem('lastPlayDate');
        if (lastPlayDate !== todayFormatted) {
            attempts = 0;
            solved = false;
            guessedCats = new Set();
            currentImageLevel = 0;
            guessInput.disabled = false;
            circles.forEach(circle => circle.style.backgroundColor = "white");
            document.getElementById('statusMessage').textContent = "";
            saveGameState();
        }
    })
    .catch(error => {
        console.error("Error loading cat data:", error);
        document.getElementById('catImageContainer').innerHTML = `<p>Error loading cat data.</p>`;
    });

guessInput.addEventListener('input', function () {
    showSuggestions();
});

guessInput.addEventListener('click', function () {
    showSuggestions();
});

let currentFocus = -1;

guessInput.addEventListener('keydown', function (e) {
    const items = autocompleteList.getElementsByClassName('autocomplete-item');

    if (e.key === "ArrowDown") {
        e.preventDefault();
        currentFocus++;
        addActive(items);
    }
    else if (e.key === "ArrowUp") {
        e.preventDefault();
        currentFocus--;
        addActive(items);
    }
    else if (e.key === "Enter") {
        e.preventDefault();
        if (items.length > 0 && currentFocus === -1) {
            items[0].click();
        } else if (currentFocus > -1 && items.length) {
            items[currentFocus].click();
        } else {
            submitGuess();
        }
    }
});

function showSuggestions() {
    const value = guessInput.value;
    autocompleteList.innerHTML = '';
    currentFocus = -1;

    if (!value && value !== "") return;

    const suggestions = allCatNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
    );

    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.classList.add('autocomplete-item');
        if (guessedCats.has(suggestion.toLowerCase())) {
            item.classList.add('guessed');
        }
        item.textContent = suggestion;

        item.addEventListener('click', function () {
            if (!guessedCats.has(suggestion.toLowerCase())) {
                guessInput.value = suggestion;
                autocompleteList.innerHTML = '';
                submitGuess();
            }
        });

        item.addEventListener('mouseover', function () {
            if (!guessedCats.has(suggestion.toLowerCase())) {
                removeActive(autocompleteList.getElementsByClassName('autocomplete-item'));
                this.classList.add('autocomplete-active');
                currentFocus = index;
            }
        });

        item.addEventListener('mouseout', function () {
            this.classList.remove('autocomplete-active');
        });

        autocompleteList.appendChild(item);
    });
}

function addActive(items) {
    if (!items || !items.length) return;

    removeActive(items);

    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;

    items[currentFocus].classList.add('autocomplete-active');
    items[currentFocus].scrollIntoView({ block: 'nearest' });
    guessInput.value = items[currentFocus].textContent;
}

function removeActive(items) {
    Array.from(items).forEach(item => {
        item.classList.remove('autocomplete-active');
    });
}

const leftPupil = document.getElementById('left-pupil');
const rightPupil = document.getElementById('right-pupil');
const container = document.querySelector('.container');
const eyeCenters = {
    left: { x: 245, y: -79 },
    right: { x: 349, y: -79 }
};
const maxMoveX = 8;
const maxMoveY = 6;

document.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    movePupil(leftPupil, eyeCenters.left, mouseX, mouseY);
    movePupil(rightPupil, eyeCenters.right, mouseX, mouseY);
});

function movePupil(pupil, center, mouseX, mouseY) {
    const dx = mouseX - center.x;
    const dy = mouseY - center.y;
    const angle = Math.atan2(dy, dx);
    const x = center.x + Math.cos(angle) * maxMoveX;
    const y = center.y + Math.sin(angle) * maxMoveY;
    pupil.style.left = `${x - 10}px`;
    pupil.style.top = `${y - 14}px`;
}

function updateCountdown() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    document.getElementById('countdown').textContent =
        `Countdown to next game: ${hours}h ${minutes}m ${seconds}s`;
}

updateCountdown();
setInterval(updateCountdown, 1000);

function submitGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    if (guess === "") return;

    guessedCats.add(guess);
    saveGameState();

    if (guess === correctCatName.toLowerCase()) {
        circles[attempts].style.backgroundColor = "#4CAF50";
        solved = true;
        finishGame(true);
    } else {
        circles[attempts].style.backgroundColor = "#F44336";
        attempts++;
        if (isPixelatedMode && attempts < 5) {
            currentImageLevel = Math.min(attempts, 4);
            setPixelatedImage();
        }
        saveGameState();
        if (attempts >= circles.length) {
            finishGame(false);
        }
    }
    guessInput.value = "";
}

guessInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter" && !solved) {
        submitGuess();
    }
});

function finishGame(correct) {
    let streak = Number(localStorage.getItem('streak')) || 0;
    let totalGuesses = attempts + (correct ? 1 : 0);
    let message = "";
    if (correct) {
        streak++;
        message = `You have guessed the cat for today, it was ${correctCatName}. Your current streak is ${streak}. It took you ${totalGuesses} guess${totalGuesses === 1 ? '' : 'es'}.`;
        let meowAudio = new Audio('assets/audio/meow.mp3');
        meowAudio.play();
        if (isPixelatedMode) {
            currentImageLevel = 4;
            setPixelatedImage();
        }
    } else {
        streak = 0;
        message = `You didn't guess the cat for today, it was ${correctCatName}. Your current streak is ${streak}.`;
        if (isPixelatedMode) {
            currentImageLevel = 4;
            setPixelatedImage();
        }
    }
    localStorage.setItem('streak', streak);
    localStorage.setItem('lastPlayDate', todayFormatted);
    localStorage.setItem('lastCat', correctCatName);
    document.getElementById('popupText').textContent = message;
    document.getElementById('popupOverlay').style.display = "flex";
    document.body.style.overflow = 'hidden';
    document.getElementById('statusMessage').textContent =
        correct ? `You have already guessed the cat for today, it was ${correctCatName}.` : `You didn't guess the cat for today, it was ${correctCatName}.`;
    guessInput.disabled = true;
    saveGameState();
}

document.getElementById('closePopupBtn').addEventListener('click', () => {
    document.getElementById('popupOverlay').style.display = "none";
    document.body.style.overflow = 'auto';
});

document.addEventListener('DOMContentLoaded', () => {
    leftPupil.style.left = `${eyeCenters.left.x - 14}px`;
    leftPupil.style.top = `${eyeCenters.left.y - 18}px`;
    rightPupil.style.left = `${eyeCenters.right.x - 14}px`;
    rightPupil.style.top = `${eyeCenters.right.y - 18}px`;
});

document.addEventListener('click', function (e) {
    const isClickInsideInput = guessInput.contains(e.target);
    const isClickInsideDropdown = autocompleteList.contains(e.target);

    if (!isClickInsideInput && !isClickInsideDropdown) {
        autocompleteList.innerHTML = '';
    }
});

autocompleteList.addEventListener('click', function (e) {
    e.stopPropagation();
});