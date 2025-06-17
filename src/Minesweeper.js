import React from 'react';

const ROWS = 4;
const COLS = 5;
const TILE_COUNT = ROWS * COLS;
const MINE_COUNT = 5;

class Minesweeper extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.initGame();
  }

  initGame = () => {
    const board = this.generateBoard();
    return {
      board,
      gameOver: false,
      gameWon: false,
      tilesRevealed: 0
    };
  };

  generateBoard = () => {
    const board = Array(TILE_COUNT).fill(null).map(() => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0
    }));

    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const index = Math.floor(Math.random() * TILE_COUNT);
      if (!board[index].isMine) {
        board[index].isMine = true;
        minesPlaced++;
      }
    }

    for (let i = 0; i < TILE_COUNT; i++) {
      if (!board[i].isMine) {
        const neighbors = this.getNeighbors(i);
        const mineCount = neighbors.filter(idx => board[idx].isMine).length;
        board[i].adjacentMines = mineCount;
      }
    }

    return board;
  };

  getNeighbors = (index) => {
    const neighbors = [];
    const row = Math.floor(index / COLS);
    const col = index % COLS;

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
          neighbors.push(newRow * COLS + newCol);
        }
      }
    }

    return neighbors;
  };

  revealTile = (index) => {
    const { board, gameOver, tilesRevealed } = this.state;
    if (gameOver || board[index].isFlagged || board[index].isRevealed) return;

    const newBoard = [...board];
    let newTiles = tilesRevealed;

    const flood = (i) => {
      if (newBoard[i].isRevealed || newBoard[i].isFlagged) return;
      newBoard[i].isRevealed = true;
      newTiles++;
      if (newBoard[i].adjacentMines === 0) {
        this.getNeighbors(i).forEach(flood);
      }
    };

    if (newBoard[index].isMine) {
      newBoard[index].isRevealed = true;
      this.setState({ board: newBoard, gameOver: true },
        () => alert('💣 You hit a mine!'));
      return;
    }

    flood(index);

    const nonMineTiles = TILE_COUNT - MINE_COUNT;
    const won = newTiles === nonMineTiles;
    this.setState({
      board: newBoard,
      tilesRevealed: newTiles,
      gameWon: won,
      gameOver: won
    }, () => {
      if (won) alert('🎉 You won!');
    });
  };

  flagTile = (e, index) => {
    e.preventDefault();
    const { board, gameOver } = this.state;
    if (gameOver || board[index].isRevealed) return;
    const newBoard = [...board];
    newBoard[index].isFlagged = !newBoard[index].isFlagged;
    this.setState({ board: newBoard });
  };

  resetGame = () => {
    this.setState(this.initGame());
  };

  renderTile = (tile, i) => {
    let content = '';
    if (tile.isRevealed) {
      content = tile.isMine ? '💣' : (tile.adjacentMines > 0 ? tile.adjacentMines : '');
    } else if (tile.isFlagged) {
      content = '🚩';
    }
    return (
      <button
        key={i}
        onClick={() => this.revealTile(i)}
        onContextMenu={e => this.flagTile(e, i)}
        style={{
          width: 50, height: 50,
          backgroundColor: tile.isRevealed ? '#ddd' : '#999',
          fontSize: 18, fontWeight: 'bold', border: '1px solid #333',
          cursor: 'pointer', color: tile.isMine ? 'red' : 'black'
        }}
      >
        {content}
      </button>
    );
  };

  render() {
    const { board, gameOver, gameWon } = this.state;
    return (
      <div style={{ padding: 20 }}>
        <h1>Minesweeper</h1>
        <p>{gameWon ? '✅ You Win!' : gameOver ? '❌ Game Over' : '⛏️ Left-click to reveal; right-click to flag.'}</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 50px)`,
          gap: 5,
          marginTop: 10
        }}>
          {board.map(this.renderTile)}
        </div>
        <button onClick={this.resetGame} style={{
          marginTop: 15, padding: '8px 16px', fontSize: 16,
          backgroundColor: '#007bff', color: 'white', border: 'none',
          borderRadius: 5, cursor: 'pointer', marginLeft: 100
        }}>
          Restart
        </button>
      </div>
    );
  }
}

export default Minesweeper;
