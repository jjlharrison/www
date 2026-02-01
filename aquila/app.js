// A simple representation of pieces:
//  - 'Wc' = White cohort
//  - 'Bc' = Black cohort
//  - 'WA' = White Aquila
//  - 'BA' = Black Aquila
//  - null = empty cell

class AquilaGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Board dimensions (rows x columns)
    this.rows = 8;
    this.cols = 12;

    // 2D array for the board
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

    // Track whose turn it is: 'W' or 'B'
    this.currentPlayer = 'W';

    // Setup phases:
    //   "whiteAquila" => waiting for white to place Aquila
    //   "blackAquila" => waiting for black to place Aquila
    //   "none" => normal play
    this.setupPhase = 'whiteAquila';

    // Track if the game is over
    this.gameOver = false;

    // Track a selected piece for movement: { row, col } or null
    this.selectedPiece = null;

    // Drag-related properties
    this.dragging = false;
    this.dragOrigin = null;   // { row, col } where drag started
    this.dragPiece = null;    // The piece code being dragged
    this.dragElement = null;  // The floating clone element
    this.boardRect = null;    // Cached board container bounding rect
  }

  connectedCallback() {
    this.initBoard();
    this.render();
  }

  // Place the 12 cohorts in top row for White (row 0) and bottom row for Black (row 7).
  initBoard() {
    // Place White cohorts in row 0
    for (let c = 0; c < this.cols; c++) {
      this.board[0][c] = 'Wc';
    }
    // Place Black cohorts in row 7
    for (let c = 0; c < this.cols; c++) {
      this.board[7][c] = 'Bc';
    }
  }

  // Re-render the board each time state changes
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          color: black;
          user-select: none;
          touch-action: none;
        }
        .status {
          background: white;
          font-size: 1.2em;
          padding: 0.5em;
          text-align: center;
        }
        .board {
          flex: 1;
          display: grid;
          grid-template-rows: repeat(${this.rows}, 1fr);
          grid-template-columns: repeat(${this.cols}, 1fr);
          width: 100%;
          height: 100%;
          position: relative;
        }
        .cell {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid black;
          font-weight: bold;
          font-size: 1.5em;
          position: relative;
        }
        /* Checkerboard style: alternate shades */
        .cell:nth-child(even) {
          background: #eee; 
        }
        .cell:nth-child(odd) {
          background: #ccc;
        }
        /* Piece styling */
        .piece {
          width: 70%;
          height: 70%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .Wc {
          background: white;
          color: black;
        }
        .WA {
          background: white;
          border: 2px solid black;
          color: black;
        }
        .Bc {
          background: black;
          color: white;
        }
        .BA {
          background: black;
          border: 2px solid white;
          color: white;
        }
        /* Highlight for selected piece */
        .selected {
          outline: 3px solid yellow;
        }
        /* Drag floating piece */
        .dragging {
          position: fixed;
          pointer-events: none;
          z-index: 1000;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5em;
        }
      </style>

      <div class="status">
        ${this.gameOver
          ? `Game Over`
          : this.getStatusText()
        }
      </div>
      <div class="board">
        ${this.board.map((rowArr, r) =>
          rowArr.map((cell, c) => this.renderCell(r, c, cell)).join('')
        ).join('')}
      </div>
    `;

    // After rendering, cache board container rect (for drag coordinate mapping)
    this.boardContainer = this.shadowRoot.querySelector('.board');
    this.boardRect = this.boardContainer.getBoundingClientRect();

    // Attach event listeners for each cell for both click and drag.
    const cellDivs = this.shadowRoot.querySelectorAll('.cell');
    cellDivs.forEach(cellDiv => {
      // Use pointer events to cover both mouse and touch
      cellDiv.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      cellDiv.addEventListener('click', (e) => {
        // Only handle click if not dragging (clicks may fire after a drag)
        if (this.dragging) return;
        this.onCellClick(e);
      });
    });
  }

  renderCell(r, c, piece) {
    // Mark the piece class for styling
    let pieceClass = piece ? piece : '';
    // If the piece is selected
    let isSelected = (this.selectedPiece && this.selectedPiece.row === r && this.selectedPiece.col === c);
    return `
      <div class="cell ${isSelected ? 'selected' : ''}" data-row="${r}" data-col="${c}">
        ${piece ? `<div class="piece ${pieceClass}"></div>` : ''}
      </div>
    `;
  }

  getStatusText() {
    // If we're still in setup
    if (this.setupPhase === 'whiteAquila') {
      return `White: Place your Aquila in row 1`;
    }
    if (this.setupPhase === 'blackAquila') {
      return `Black: Place your Aquila in row 6`;
    }
    // Otherwise normal play
    return `Current Player: ${this.currentPlayer === 'W' ? 'White' : 'Black'}`;
  }

  // Called on pointerdown (covers both mouse and touch)
  onPointerDown(e) {
    if (this.gameOver) return;
    // Determine which cell was pressed.
    // Use e.currentTarget to get the cell (even if a child element was touched)
    const cell = e.currentTarget;
    const r = parseInt(cell.getAttribute('data-row'));
    const c = parseInt(cell.getAttribute('data-col'));

    // In setup phase, let click handling manage placement.
    if (this.setupPhase !== 'none') return;

    const piece = this.board[r][c];
    // Only allow starting a drag if the cell contains one of current player's pieces.
    if (piece && this.isCurrentPlayersPiece(piece)) {
      // Prevent default to avoid any unwanted behavior.
      e.preventDefault();
      this.startDrag(e, r, c);
    }
  }

  // Fallback click handler (for non-drag clicks)
  onCellClick(e) {
    // Use currentTarget so that if a child is clicked we still get the cell.
    const cell = e.currentTarget;
    const r = parseInt(cell.getAttribute('data-row'));
    const c = parseInt(cell.getAttribute('data-col'));

    // If in setup phase, process placement clicks
    if (this.setupPhase === 'whiteAquila') {
      if (r === 1 && this.board[r][c] === null) {
        this.board[r][c] = 'WA';
        this.setupPhase = 'blackAquila';
        this.render();
      }
      return;
    }
    if (this.setupPhase === 'blackAquila') {
      if (r === 6 && this.board[r][c] === null) {
        this.board[r][c] = 'BA';
        this.setupPhase = 'none';
        this.render();
      }
      return;
    }

    // Normal play: if no piece selected, select one; if already selected, attempt move.
    if (!this.selectedPiece) {
      const piece = this.board[r][c];
      if (!piece) return; // empty cell, ignore
      if (!this.isCurrentPlayersPiece(piece)) return; // not your piece
      // Select this piece
      this.selectedPiece = { row: r, col: c };
      this.render();
    } else {
      const from = this.selectedPiece;
      const to = { row: r, col: c };
      // If user clicked the same cell, deselect
      if (from.row === to.row && from.col === to.col) {
        this.selectedPiece = null;
        this.render();
        return;
      }
      // Check if valid move
      if (this.canMove(from, to)) {
        this.movePiece(from, to);
        this.selectedPiece = null;
        this.checkCaptures();
        this.checkGameEnd();
        if (!this.gameOver) {
          this.currentPlayer = (this.currentPlayer === 'W') ? 'B' : 'W';
        }
      }
      this.render();
    }
  }

  // Returns true if the piece belongs to the current player.
  isCurrentPlayersPiece(piece) {
    return (this.currentPlayer === 'W' && (piece === 'Wc' || piece === 'WA'))
        || (this.currentPlayer === 'B' && (piece === 'Bc' || piece === 'BA'));
  }

  canMove(from, to) {
    // Must be in same row or column
    if (from.row !== to.row && from.col !== to.col) return false;
    // Destination must be empty
    if (this.board[to.row][to.col] !== null) return false;
    // Must not jump over pieces
    return this.isPathClear(from, to);
  }

  isPathClear(from, to) {
    if (from.row === to.row) {
      let startCol = Math.min(from.col, to.col);
      let endCol = Math.max(from.col, to.col);
      for (let c = startCol + 1; c < endCol; c++) {
        if (this.board[from.row][c] !== null) return false;
      }
      return true;
    } else {
      let startRow = Math.min(from.row, to.row);
      let endRow = Math.max(from.row, to.row);
      for (let r = startRow + 1; r < endRow; r++) {
        if (this.board[r][from.col] !== null) return false;
      }
      return true;
    }
  }

  movePiece(from, to) {
    const piece = this.board[from.row][from.col];
    this.board[from.row][from.col] = null;
    this.board[to.row][to.col] = piece;
  }

  checkCaptures() {
    // Check horizontally and vertically for enemy cohort sandwiches.
    let capturedSomething;
    do {
      capturedSomething = false;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          let piece = this.board[r][c];
          if (!piece) continue;

          // Horizontal capture (check right direction only to avoid double counting)
          if (c < this.cols - 2) {
            const midPiece = this.board[r][c+1];
            const rightPiece = this.board[r][c+2];
            if (midPiece && rightPiece) {
              if (this.isSameColor(piece, rightPiece) && this.isCohort(midPiece) && !this.isSameColor(piece, midPiece)) {
                this.board[r][c+1] = null;
                capturedSomething = true;
              }
            }
          }
          // Vertical capture (check downward)
          if (r < this.rows - 2) {
            const midPiece = this.board[r+1][c];
            const downPiece = this.board[r+2][c];
            if (midPiece && downPiece) {
              if (this.isSameColor(piece, downPiece) && this.isCohort(midPiece) && !this.isSameColor(piece, midPiece)) {
                this.board[r+1][c] = null;
                capturedSomething = true;
              }
            }
          }
        }
      }
    } while (capturedSomething);
  }

  isCohort(piece) {
    return (piece === 'Wc' || piece === 'Bc');
  }

  isSameColor(a, b) {
    return a && b && a[0] === b[0];
  }

  checkGameEnd() {
    // Check if either Aquila is surrounded.
    const whiteAquilaPos = this.findPiece('WA');
    const blackAquilaPos = this.findPiece('BA');

    if (whiteAquilaPos && this.isAquilaSurrounded(whiteAquilaPos.row, whiteAquilaPos.col)) {
      alert('Black wins (White Aquila is surrounded)!');
      this.gameOver = true;
      return;
    }
    if (blackAquilaPos && this.isAquilaSurrounded(blackAquilaPos.row, blackAquilaPos.col)) {
      alert('White wins (Black Aquila is surrounded)!');
      this.gameOver = true;
      return;
    }

    // Check if opponent has only 2 cohorts left.
    const whiteCohorts = this.countCohorts('W');
    const blackCohorts = this.countCohorts('B');

    if (this.currentPlayer === 'W' && blackCohorts <= 2) {
      alert('White wins (Black only has 2 cohorts left)!');
      this.gameOver = true;
      return;
    }
    if (this.currentPlayer === 'B' && whiteCohorts <= 2) {
      alert('Black wins (White only has 2 cohorts left)!');
      this.gameOver = true;
      return;
    }
  }

  findPiece(pieceCode) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] === pieceCode) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  countCohorts(color) {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const piece = this.board[r][c];
        if (!piece) continue;
        if (color === 'W' && piece === 'Wc') count++;
        if (color === 'B' && piece === 'Bc') count++;
      }
    }
    return count;
  }

  isAquilaSurrounded(row, col) {
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];
    let blockedSides = 0, totalSides = 0;
    for (let d of directions) {
      const rr = row + d.dr, cc = col + d.dc;
      totalSides++;
      if (rr < 0 || rr >= this.rows || cc < 0 || cc >= this.cols || this.board[rr][cc] !== null) {
        blockedSides++;
      }
    }
    return (blockedSides === totalSides);
  }

  // ==== DRAG SUPPORT METHODS ====

  startDrag(e, r, c) {
    // Record the origin and piece
    this.dragging = true;
    this.dragOrigin = { row: r, col: c };
    this.dragPiece = this.board[r][c];
    // Also select this piece visually
    this.selectedPiece = { row: r, col: c };

    // Create a floating drag element that mimics the piece
    this.dragElement = document.createElement('div');
    this.dragElement.classList.add('dragging');
    this.dragElement.classList.add(this.dragPiece);
    this.dragElement.textContent = ''; // Could add text if desired
    document.body.appendChild(this.dragElement);

    // Position the drag element at the pointer location.
    this.updateDragElementPosition(e);

    // Remove the piece from the board during drag (for visual feedback)
    this.board[r][c] = null;
    this.render();

    // Attach pointermove and pointerup listeners to document
    document.addEventListener('pointermove', this.boundDragMove = (ev) => this.onDragMove(ev));
    document.addEventListener('pointerup', this.boundDragEnd = (ev) => this.onDragEnd(ev));
  }

  updateDragElementPosition(e) {
    // Use clientX/clientY from the event.
    const x = e.clientX;
    const y = e.clientY;
    this.dragElement.style.left = (x - 25) + 'px';
    this.dragElement.style.top = (y - 25) + 'px';
  }

  onDragMove(e) {
    if (!this.dragging) return;
    e.preventDefault();
    this.updateDragElementPosition(e);
  }

  onDragEnd(e) {
    if (!this.dragging) return;
    // Remove the global listeners
    document.removeEventListener('pointermove', this.boundDragMove);
    document.removeEventListener('pointerup', this.boundDragEnd);

    // Determine drop destination using the board container's bounding rectangle.
    const x = e.clientX;
    const y = e.clientY;
    const boardRect = this.boardContainer.getBoundingClientRect();
    const cellWidth = boardRect.width / this.cols;
    const cellHeight = boardRect.height / this.rows;
    const dropCol = Math.floor((x - boardRect.left) / cellWidth);
    const dropRow = Math.floor((y - boardRect.top) / cellHeight);

    // Remove the drag element from the document.
    this.dragElement.remove();
    this.dragElement = null;
    this.dragging = false;

    // If drop coordinates are valid and within the board...
    if (dropRow >= 0 && dropRow < this.rows && dropCol >= 0 && dropCol < this.cols) {
      // If dropped on the same cell as origin, treat as a cancel.
      if (dropRow === this.dragOrigin.row && dropCol === this.dragOrigin.col) {
        // Put the piece back.
        this.board[this.dragOrigin.row][this.dragOrigin.col] = this.dragPiece;
      } else {
        const from = this.dragOrigin;
        const to = { row: dropRow, col: dropCol };
        if (this.canMove(from, to)) {
          this.movePiece(from, to);
          this.checkCaptures();
          this.checkGameEnd();
          if (!this.gameOver) {
            this.currentPlayer = (this.currentPlayer === 'W') ? 'B' : 'W';
          }
        } else {
          // Invalid move: return the piece to its origin.
          this.board[this.dragOrigin.row][this.dragOrigin.col] = this.dragPiece;
        }
      }
    } else {
      // Dropped outside board: return piece.
      this.board[this.dragOrigin.row][this.dragOrigin.col] = this.dragPiece;
    }

    // Clear selection and re-render.
    this.selectedPiece = null;
    this.render();
  }
}

customElements.define('aquila-game', AquilaGame);