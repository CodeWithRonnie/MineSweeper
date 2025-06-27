import React from 'react';

const ROWS = 5;  // Reduced for testing
const COLS = 5;   // Reduced for testing
const TILE_COUNT = ROWS * COLS;
const MINE_COUNT = 2;  // Only 2 mines for testing

class Minesweeper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.initGame(),
      time: 1800, // 30 minutes in seconds
      timer: null,
      flagsPlaced: 0,
      gameStarted: false,
      showGameOver: false,
      gameResult: '' // 'win' or 'lose'
    };
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

  checkWinCondition = (board) => {
    // Check if all non-mine tiles are revealed AND all mines are flagged
    const allNonMinesRevealed = board.every(tile => 
      !tile.isMine ? tile.isRevealed : true
    );
    
    const allMinesFlagged = board.every(tile => 
      tile.isMine ? tile.isFlagged : true
    );
    
    const won = allNonMinesRevealed && allMinesFlagged;
    
    if (won) {
      clearInterval(this.state.timer);
      this.setState({ 
        showGameOver: true, 
        gameResult: 'win',
        gameOver: true,
        gameWon: true
      });
    }
    
    return won;
  };

  revealTile = (index) => {
    const { board, gameOver, gameStarted } = this.state;
    
    // Start the timer on first move if not already started
    if (!gameStarted) {
      this.startTimer();
    }
    
    // Don't reveal if game is over, tile is flagged, or already revealed
    if (gameOver || board[index].isFlagged || board[index].isRevealed) return;

    const newBoard = [...board];
    
    // If clicked on a mine, game over
    if (newBoard[index].isMine) {
      // Reveal all mines
      newBoard.forEach((tile, i) => {
        if (tile.isMine) {
          newBoard[i] = { ...tile, isRevealed: true };
        }
      });
      
      clearInterval(this.state.timer);
      this.setState({ 
        board: newBoard, 
        gameOver: true,
        gameWon: false,
        showGameOver: true,
        gameResult: 'lose'
      });
      return;
    }

    // Flood fill to reveal adjacent empty tiles
    const revealAdjacent = (i) => {
      // Check bounds and if already revealed or flagged
      if (i < 0 || i >= TILE_COUNT || newBoard[i].isRevealed || newBoard[i].isFlagged) return;
      
      // Reveal the current tile
      newBoard[i] = { ...newBoard[i], isRevealed: true };
      
      // If it's an empty tile (no adjacent mines), reveal its neighbors
      if (newBoard[i].adjacentMines === 0) {
        this.getNeighbors(i).forEach(neighborIndex => {
          revealAdjacent(neighborIndex);
        });
      }
    };

    // Start revealing from the clicked tile
    revealAdjacent(index);
    
    // Count revealed tiles for win condition
    const revealedCount = newBoard.filter(tile => tile.isRevealed).length;
    
    const won = this.checkWinCondition(newBoard);
    
    this.setState({
      board: newBoard,
      tilesRevealed: revealedCount,
      gameWon: won,
      gameOver: won,
      gameStarted: true
    }, this.startTimer);
  };

  componentDidMount() {
  }

  componentWillUnmount() {
    clearInterval(this.state.timer);
  }

  startTimer = () => {
    clearInterval(this.state.timer);
    const timer = setInterval(() => {
      this.setState(prevState => ({
        time: prevState.time - 1
      }));
      if (this.state.time === 0) {
        clearInterval(this.state.timer);
        this.setState({ gameOver: true, gameWon: false });
      }
    }, 1000);
    this.setState({ timer });
  };

  flagTile = (e, index) => {
    e.preventDefault();
    const { board, gameOver, flagsPlaced } = this.state;
    
    // Don't flag if game is over, tile is already revealed, or we've used all flags
    if (gameOver || board[index].isRevealed) return;
    
    const newBoard = [...board];
    const wasFlagged = newBoard[index].isFlagged;
    
    // Toggle flag
    newBoard[index] = { ...newBoard[index], isFlagged: !wasFlagged };
    
    const newFlagsPlaced = wasFlagged ? flagsPlaced - 1 : flagsPlaced + 1;
    
    // Check win condition after flag placement
    const won = this.checkWinCondition(newBoard);
    
    this.setState({
      board: newBoard,
      flagsPlaced: newFlagsPlaced,
      gameWon: won,
      gameOver: won
    });
  };

  resetGame = () => {
    clearInterval(this.state.timer);
    this.setState({
      ...this.initGame(),
      time: 1800, // 30 minutes in seconds
      flagsPlaced: 0,
      gameOver: false,
      gameWon: false,
      gameStarted: false,
      showGameOver: false,
      gameResult: ''
    });
  };

  renderTile = (tile, i) => {
    let content = '';
    let textColor = '';
    
    if (tile.isRevealed) {
      if (tile.isMine) {
        content = '💣';
      } else if (tile.adjacentMines > 0) {
        content = tile.adjacentMines;
        // Soft pastel colors for numbers
        const colors = ['', '#ff9a9e', '#a8edea', '#84fab0', '#8fd3f4', '#d4b3ff', '#ffb3e6', '#ffb3b3', '#d1b3ff'];
        textColor = colors[tile.adjacentMines] || '#ff69b4';
      }
    } else if (tile.isFlagged) {
      content = '🎀'; // Changed to ribbon emoji for a girly touch
    }

    return (
      <button
        key={i}
        onClick={() => this.revealTile(i)}
        onContextMenu={e => this.flagTile(e, i)}
        style={{
          width: 24,
          height: 24,
          background: tile.isRevealed 
            ? '#fff9fb' 
            : tile.isFlagged 
              ? 'linear-gradient(135deg, #ffb3e6 0%, #ff8bd3 100%)' 
              : 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%)',
          border: `1px solid ${tile.isRevealed ? '#ffd6e7' : '#ffb6c1'}`,
          borderRadius: '4px',
          boxShadow: tile.isRevealed 
            ? 'inset 1px 1px 3px rgba(255, 105, 180, 0.1)'
            : '0 1px 3px rgba(255, 105, 180, 0.2)',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          transform: tile.isRevealed ? 'scale(0.92)' : 'none',
          ':hover': {
            transform: 'scale(0.95)',
            boxShadow: '0 0 8px rgba(255, 105, 180, 0.4)'
          }
        }}
        onMouseDown={(e) => {
          if (e.button === 0) { // Left click
            e.currentTarget.style.transform = 'scale(0.92)';
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 0) {
            e.currentTarget.style.transform = tile.isRevealed ? 'scale(0.95)' : 'none';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = tile.isRevealed ? 'scale(0.95)' : 'none';
        }}
      >
        {content}
      </button>
    );
  };

  render() {
    const { board, gameOver, gameWon, time, flagsPlaced } = this.state;
    const flagsLeft = MINE_COUNT - flagsPlaced;
    
    // Format time as MM:SS
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '10px',
        backgroundColor: '#fff0f5',
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        boxSizing: 'border-box',
        overflow: 'auto'
      }}>
        <div style={{
          backgroundColor: '#fff9fb',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(255, 105, 180, 0.2)',
          padding: '15px',
          margin: '10px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h1 style={{
            textAlign: 'center',
            color: '#ff69b4',
            margin: '0 0 15px 0',
            fontSize: '2em',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(255, 182, 193, 0.5)',
            letterSpacing: '1px'
          }}>
Minesweeper
          </h1>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#ffe6f2',
            borderRadius: '12px',
            boxShadow: '0 2px 5px rgba(255, 105, 180, 0.1)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '15px',
              fontWeight: 'bold',
              minWidth: '70px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              ⏱️ {formattedTime}
            </div>
            <div style={{
              fontSize: '1.1em',
              color: gameWon ? '#ff69b4' : gameOver ? '#ff1493' : '#ff69b4',
              fontWeight: 'bold',
              textAlign: 'center',
              flexGrow: 1,
              padding: '2px 0',
              textShadow: (gameWon || gameOver) ? '0 0 5px rgba(255, 105, 180, 0.3)' : 'none'
            }}>
              {gameWon ? 'You Win!' : gameOver ? 'Game Over' : 'Find all the mines'}
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '15px',
              fontWeight: 'bold',
              minWidth: '70px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              🚩 {flagsLeft < 0 ? 0 : flagsLeft}
            </div>
          </div>
          
          <div style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 26px)`,
            gap: '3px',
            padding: '12px',
            backgroundColor: '#fff0f7',
            borderRadius: '10px',
            boxShadow: 'inset 0 0 10px rgba(255, 105, 180, 0.1)',
            border: '1px solid #ffd1dc',
            margin: '0 auto'
          }}>
            {board.map(this.renderTile)}
            {this.state.showGameOver && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                zIndex: 10
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: this.state.gameResult === 'win' ? '#4CAF50' : '#F44336',
                  marginBottom: '20px',
                  textAlign: 'center',
                  padding: '0 20px'
                }}>
                  {this.state.gameResult === 'win' ? 'You Won!' : 'Game Over!'}
                </div>
                <div style={{
                  fontSize: '16px',
                  marginBottom: '10px',
                  textAlign: 'center',
                  color: '#555'
                }}>
                  {this.state.gameResult === 'win' 
                    ? `You won in ${Math.floor((1800 - this.state.time) / 60)}:${String((1800 - this.state.time) % 60).padStart(2, '0')}`
                    : 'Click New Game to try again'
                  }
                </div>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={this.resetGame}
              style={{
                padding: '10px 25px',
                fontSize: '16px',
                backgroundColor: '#ff69b4',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                ':hover': {
                  backgroundColor: 'white',
                  color: '#ff69b4',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(255,105,180,0.3)'
                },
                ':active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              New Game
            </button>
          </div>
          
          <div style={{
            marginTop: '15px',
            fontSize: '0.9em',
            color: '#7f8c8d',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            Left-click to reveal • Right-click to flag
          </div>
        </div>
      </div>
    );
  }
}

export default Minesweeper;
