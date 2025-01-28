class BlackjackGame {
    constructor() {
        this.deck = [];
        this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.playerCards = [];
        this.dealerCards = [];
        this.balance = 1000;
        this.currentBet = 0;
        this.gameInProgress = false;

        this.startBtn = document.getElementById('start-btn');
        this.hitBtn = document.getElementById('hit-btn');
        this.standBtn = document.getElementById('stand-btn');
        this.placeBetBtn = document.getElementById('place-bet');
        this.betInput = document.getElementById('bet-amount');
        this.balanceDisplay = document.getElementById('balance');
        this.messageDisplay = document.getElementById('message');
        this.playerSum = document.getElementById('player-sum');
        this.dealerSum = document.getElementById('dealer-sum');
        this.playerCardsContainer = document.getElementById('player-cards');
        this.dealerCardsContainer = document.getElementById('dealer-cards');
        this.rulesBtn = document.getElementById('rules-btn');
        this.rulesModal = document.getElementById('rules-modal');
        this.closeBtn = document.querySelector('.close-btn');

        this.statsElements = {
            gamesPlayed: document.getElementById('games-played'),
            wins: document.getElementById('wins'),
            blackjacks: document.getElementById('blackjacks'),
            winRate: document.getElementById('win-rate'),
            totalWinnings: document.getElementById('total-winnings'),
            biggestWin: document.getElementById('biggest-win')
        };
        
        this.stats = {
            gamesPlayed: 0,
            wins: 0,
            blackjacks: 0,
            totalWinnings: 0,
            biggestWin: 0
        };
        
        this.loadStats();

        this.statsBtn = document.getElementById('stats-btn');
        this.statsModal = document.getElementById('stats-modal');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startNewGame());
        this.hitBtn.addEventListener('click', () => this.hit());
        this.standBtn.addEventListener('click', () => this.stand());
        this.placeBetBtn.addEventListener('click', () => this.placeBet());
        this.rulesBtn.addEventListener('click', () => {
            this.rulesModal.style.display = 'block';
        });
        this.closeBtn.addEventListener('click', () => {
            this.rulesModal.style.display = 'none';
        });
        window.addEventListener('click', (event) => {
            if (event.target === this.rulesModal) {
                this.rulesModal.style.display = 'none';
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.rulesModal.style.display === 'block') {
                this.rulesModal.style.display = 'none';
            }
        });

        this.statsBtn.addEventListener('click', () => {
            this.statsModal.style.display = 'block';
            this.updateStatsDisplay();
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.statsModal.style.display = 'none';
                this.rulesModal.style.display = 'none';
            });
        });

        window.addEventListener('click', (event) => {
            if (event.target === this.statsModal) {
                this.statsModal.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.statsModal.style.display = 'none';
                this.rulesModal.style.display = 'none';
            }
        });
    }

    loadStats() {
        const savedStats = localStorage.getItem('blackjackStats');
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
            this.updateStatsDisplay();
        }
    }

    saveStats() {
        localStorage.setItem('blackjackStats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        const winRate = this.stats.gamesPlayed > 0 
            ? Math.round((this.stats.wins / this.stats.gamesPlayed) * 100) 
            : 0;

        this.statsElements.gamesPlayed.textContent = this.stats.gamesPlayed;
        this.statsElements.wins.textContent = this.stats.wins;
        this.statsElements.blackjacks.textContent = this.stats.blackjacks;
        this.statsElements.winRate.textContent = `${winRate}%`;
        this.statsElements.totalWinnings.textContent = `$${Math.round(this.stats.totalWinnings)}`;
        this.statsElements.biggestWin.textContent = `$${Math.round(this.stats.biggestWin)}`;

        Object.values(this.statsElements).forEach(element => {
            element.classList.remove('updated');
            void element.offsetWidth;
            element.classList.add('updated');
        });
    }

    updateStats(result, winAmount = 0) {
        this.stats.gamesPlayed++;

        if (result === 'blackjack') {
            this.stats.blackjacks++;
            this.stats.wins++;
            this.stats.totalWinnings += winAmount;
            if (winAmount > this.stats.biggestWin) {
                this.stats.biggestWin = winAmount;
            }
        } else if (result === 'win') {
            this.stats.wins++;
            this.stats.totalWinnings += winAmount;
            if (winAmount > this.stats.biggestWin) {
                this.stats.biggestWin = winAmount;
            }
        } else if (result === 'loss') {
            this.stats.totalWinnings -= this.currentBet;
        }

        this.stats.totalWinnings = Number(this.stats.totalWinnings) || 0;

        this.saveStats();
        this.updateStatsDisplay();
    }

    createDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let value of this.values) {
                this.deck.push({ suit, value });
            }
        }
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    getCardValue(card) {
        if (['J', 'Q', 'K'].includes(card.value)) return 10;
        if (card.value === 'A') return 11;
        return parseInt(card.value);
    }

    calculateHand(cards) {
        let sum = 0;
        let aces = 0;

        for (let card of cards) {
            if (card.value === 'A') {
                aces++;
                sum += 11;
            } else {
                sum += this.getCardValue(card);
            }
        }

        while (sum > 21 && aces > 0) {
            sum -= 10;
            aces--;
        }

        return sum;
    }

    async dealCard(isDealer = false, hidden = false) {
        const card = this.deck.pop();
        const container = isDealer ? this.dealerCardsContainer : this.playerCardsContainer;
        const cardElement = document.createElement('div');
        cardElement.className = 'card card-dealt';
        
        if (hidden) {
            cardElement.classList.add('hidden');
        } else {
            const img = document.createElement('img');
            let cardValue = card.value;
            if (cardValue === '10') cardValue = '0';
            const cardCode = `${cardValue}${card.suit[0].toUpperCase()}`;
            img.src = `https://deckofcardsapi.com/static/img/${cardCode}.png`;
            cardElement.appendChild(img);
        }

        container.appendChild(cardElement);

        return new Promise(resolve => {
            setTimeout(() => resolve(card), 500);
        });
    }

    async placeBet() {
        const betAmount = parseInt(this.betInput.value);
        if (betAmount > this.balance) {
            this.showMessage('Недостаточно средств!');
            return;
        }
        
        this.currentBet = betAmount;
        this.balance -= betAmount;
        this.balanceDisplay.textContent = this.balance;
        this.placeBetBtn.disabled = true;
        this.betInput.disabled = true;
        this.startBtn.disabled = false;
        this.showMessage('Ставка принята! Нажмите "Начать игру"');
    }

    async startNewGame() {
        if (this.currentBet === 0) {
            this.showMessage('Сначала сделайте ставку!');
            return;
        }

        this.gameInProgress = true;
        this.playerCards = [];
        this.dealerCards = [];
        this.playerCardsContainer.innerHTML = '';
        this.dealerCardsContainer.innerHTML = '';
        this.createDeck();

        this.startBtn.disabled = true;
        this.hitBtn.disabled = false;
        this.standBtn.disabled = false;

        this.playerCards.push(await this.dealCard(false));
        this.dealerCards.push(await this.dealCard(true));
        this.playerCards.push(await this.dealCard(false));
        this.dealerCards.push(await this.dealCard(true, true));

        this.updateSums();
        this.checkBlackjack();
    }

    async hit() {
        const card = await this.dealCard(false);
        this.playerCards.push(card);
        this.updateSums();

        if (this.calculateHand(this.playerCards) > 21) {
            await this.endGame('bust');
        }
    }

    async stand() {
        this.hitBtn.disabled = true;
        this.standBtn.disabled = true;

        this.dealerCardsContainer.innerHTML = '';
        for (let card of this.dealerCards) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card card-dealt';
            const img = document.createElement('img');
            let cardValue = card.value;
            if (cardValue === '10') cardValue = '0';
            const cardCode = `${cardValue}${card.suit[0].toUpperCase()}`;
            img.src = `https://deckofcardsapi.com/static/img/${cardCode}.png`;
            cardElement.appendChild(img);
            this.dealerCardsContainer.appendChild(cardElement);
        }

        this.dealerSum.textContent = this.calculateHand(this.dealerCards);

        while (this.calculateHand(this.dealerCards) < 17) {
            const card = await this.dealCard(true);
            this.dealerCards.push(card);
            this.dealerSum.textContent = this.calculateHand(this.dealerCards);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await this.endGame('stand');
    }

    async endGame(reason) {
        this.gameInProgress = false;
        this.hitBtn.disabled = true;
        this.standBtn.disabled = true;
        
        const playerSum = this.calculateHand(this.playerCards);
        const dealerSum = this.calculateHand(this.dealerCards);
        let winAmount = 0;

        let message = '';
        if (reason === 'bust') {
            message = 'Перебор! Вы проиграли!';
            this.updateStats('loss');
        } else if (dealerSum > 21) {
            message = 'Дилер перебрал! Вы выиграли!';
            winAmount = this.currentBet * 2;
            this.balance += winAmount;
            this.updateStats('win', winAmount);
        } else if (playerSum > dealerSum) {
            message = 'Вы выиграли!';
            winAmount = this.currentBet * 2;
            this.balance += winAmount;
            this.updateStats('win', winAmount);
        } else if (playerSum < dealerSum) {
            message = 'Дилер выиграл!';
            this.updateStats('loss');
        } else {
            message = 'Ничья!';
            this.balance += this.currentBet;
            this.updateStats('draw');
        }

        this.showMessage(message);
        this.balanceDisplay.textContent = this.balance;
        this.currentBet = 0;
        this.placeBetBtn.disabled = false;
        this.betInput.disabled = false;
    }

    checkBlackjack() {
        const playerSum = this.calculateHand(this.playerCards);
        const dealerSum = this.calculateHand(this.dealerCards);

        if (playerSum === 21 && this.playerCards.length === 2) {
            if (dealerSum === 21 && this.dealerCards.length === 2) {
                this.balance += this.currentBet;
                this.updateStats('draw');
                this.endGame('push');
            } else {
                const winAmount = Math.floor(this.currentBet * 2.5);
                this.balance += winAmount;
                this.updateStats('blackjack', winAmount);
                this.showMessage('Блэкджек! Вы выиграли!');
                this.endGame('blackjack');
            }
            return true;
        }
        return false;
    }

    updateSums() {
        this.playerSum.textContent = this.calculateHand(this.playerCards);
        if (this.gameInProgress) {
            this.dealerSum.textContent = this.getCardValue(this.dealerCards[0]) + '+ ?';
        }
    }

    showMessage(msg) {
        this.messageDisplay.textContent = msg;
    }
}

const game = new BlackjackGame(); 