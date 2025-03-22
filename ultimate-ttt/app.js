// Define the small tic tac toe board as a web component.
class TicTacToeBoard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Each board starts with 9 empty cells.
    this.cells = Array(9).fill('');
    // Read the board index from an attribute.
    this.boardIndex = parseInt(this.getAttribute('board-index')) || 0;
    this.active = true;
    this.winner = '';
  }
  
  connectedCallback() {
    this.render();
  }
  
  // Update board state (cells, winner, active flag) and re-render.
  setBoardState(cells, winner, active) {
    this.cells = cells;
    this.winner = winner;
    this.active = active;
    this.render();
  }
  
  render() {
    // Render a 3x3 grid.
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          border: 2px solid ${this.active ? 'black' : 'gray'};
          position: relative;
          background-color: ${this.active ? 'white' : '#bbb'}; /* Darker background when inactive */
          font-family: sans-serif;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          width: 100%;
          height: 100%;
        }
        .cell {
          border: 1px solid black;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2em;
          user-select: none;
          cursor: pointer;
        }
        .cell.disabled {
          cursor: default;
        }
        /* If board is won, overlay the winner symbol */
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3em;
          color: black;
        }
      </style>
      <div class="grid">
        ${this.cells.map((cell, i) => `
          <div class="cell ${cell ? 'disabled' : ''}" data-index="${i}">
            ${cell === 'X' ? '⨯' : cell === 'O' ? '⚪︎' : ''}
          </div>`).join('')}
      </div>
      ${this.winner && this.winner !== 'D' ? `<div class="overlay">${this.winner === 'X' ? '⨯' : this.winner === 'O' ? '⚪︎' : ''}</div>` : ''}
    `;
    
    // Add event listeners only if the board is active and not already won.
    if (this.active && !this.winner) {
      this.shadowRoot.querySelectorAll('.cell').forEach(cellEl => {
        cellEl.addEventListener('click', (e) => this.cellClick(e));
      });
    }
  }
  
  cellClick(e) {
    const cellIndex = parseInt(e.target.getAttribute('data-index'));
    // Ignore clicks on non-empty cells.
    if (this.cells[cellIndex]) return;
    // Dispatch a custom event to notify the parent game component.
    this.dispatchEvent(new CustomEvent('cellClicked', {
      detail: { boardIndex: this.boardIndex, cellIndex: cellIndex },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('tic-tac-toe-board', TicTacToeBoard);

// Define the overall Ultimate Tic Tac Toe component.
class UltimateTicTacToe extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentPlayer = 'X';
    // Create 9 small board objects.
    this.boards = [];
    for (let i = 0; i < 9; i++) {
      this.boards.push({
        cells: Array(9).fill(''),
        winner: '',
        active: true
      });
    }
    // activeBoard: the board index where the next move must be played.
    // -1 means any board is allowed.
    this.activeBoard = -1;
    this.gameOver = false;
  }
  
  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener('cellClicked', (e) => this.handleMove(e.detail));
  }
  
  render() {
    // Render a square board with two rows: a status row above the grid.
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-rows: auto 1fr;
          width: 90vmin;
          height: 90vmin;
          margin: 5vmin auto;
          background: white;
          border: 5px solid white;
          font-family: sans-serif;
        }
        .status {
          text-align: center;
          font-size: 1.5em;
          background: white;
          padding: 5px 10px;
          border: 1px solid black;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="status">Current Player: ${this.currentPlayer === 'X' ? '⨯' : '⚪︎'}</div>
      <div class="grid">
        ${this.boards.map((board, i) => `
          <tic-tac-toe-board board-index="${i}"></tic-tac-toe-board>
        `).join('')}
      </div>
    `;
    this.updateBoards();
  }
  
  updateBoards() {
    const boardElements = this.shadowRoot.querySelectorAll('tic-tac-toe-board');
    boardElements.forEach((el, i) => {
      // Only the active board is enabled—unless it’s already won or full.
      let active = true;
      if (this.activeBoard !== -1) {
        active = (i === this.activeBoard);
      }
      // If the board is already decided, disable it.
      if (this.boards[i].winner || this.boards[i].cells.every(cell => cell !== '')) {
        active = false;
      }
      el.setBoardState(this.boards[i].cells, this.boards[i].winner, active);
    });
    // Update the status display.
    const statusEl = this.shadowRoot.querySelector('.status');
    if (this.gameOver) {
      statusEl.textContent = `Game Over`;
    } else {
      statusEl.textContent = `Current Player: ${this.currentPlayer === 'X' ? '⨯' : '⚪︎'}`;
    }
  }
  
  handleMove({ boardIndex, cellIndex }) {
    if (this.gameOver) return;
    
    // Enforce that moves must be in the active board (if one is specified)
    if (this.activeBoard !== -1 && boardIndex !== this.activeBoard) {
      // However, if the active board is already won or full, any move is allowed.
      if (!this.boards[this.activeBoard].winner &&
          !this.boards[this.activeBoard].cells.every(cell => cell !== '')) {
        return;
      }
    }
    
    // Ignore move if the cell is not empty.
    if (this.boards[boardIndex].cells[cellIndex]) return;
    
    // Make the move.
    this.boards[boardIndex].cells[cellIndex] = this.currentPlayer;
    
    // Check for a win in the small board.
    if (!this.boards[boardIndex].winner && this.checkWin(this.boards[boardIndex].cells, this.currentPlayer)) {
      this.boards[boardIndex].winner = this.currentPlayer;
    }
    
    // If no win but the board is now full, mark it as a draw.
    if (!this.boards[boardIndex].winner && this.boards[boardIndex].cells.every(cell => cell !== '')) {
      this.boards[boardIndex].winner = 'D'; // D for draw
    }
    
    // Check if the overall game is won.
    if (this.checkUltimateWin(this.currentPlayer)) {
      alert(`${this.currentPlayer === 'X' ? '⨯' : '⚪︎'} wins the game!`);
      this.gameOver = true;
    } else if (this.boards.every(b => b.winner)) {
      alert(`Game is a draw!`);
      this.gameOver = true;
    }
    
    // Determine the next active board using the cell index of the move.
    if (this.boards[cellIndex].winner ||
        this.boards[cellIndex].cells.every(cell => cell !== '')) {
      this.activeBoard = -1; // any board allowed if the target board is not playable
    } else {
      this.activeBoard = cellIndex;
    }
    
    // Switch players if the game isn’t over.
    if (!this.gameOver) {
      this.currentPlayer = (this.currentPlayer === 'X') ? 'O' : 'X';
    }
    
    this.updateBoards();
  }
  
  // Standard tic tac toe win check.
  checkWin(cells, player) {
    const lines = [
      [0,1,2],
      [3,4,5],
      [6,7,8],
      [0,3,6],
      [1,4,7],
      [2,5,8],
      [0,4,8],
      [2,4,6]
    ];
    return lines.some(line => line.every(index => cells[index] === player));
  }
  
  // Check if the large board (composed of small boards) is won.
  checkUltimateWin(player) {
    // Create an array representing which boards are won by the player.
    const mega = this.boards.map(board => board.winner === player ? player : '');
    const lines = [
      [0,1,2],
      [3,4,5],
      [6,7,8],
      [0,3,6],
      [1,4,7],
      [2,5,8],
      [0,4,8],
      [2,4,6]
    ];
    return lines.some(line => line.every(index => mega[index] === player));
  }
}

customElements.define('ultimate-tic-tac-toe', UltimateTicTacToe);