import { Board } from './components/Board/Board'
import { GameStatus } from './components/GameStatus/GameStatus'
import { LevelSelector } from './components/LevelSelector/LevelSelector'
import { useGame } from './hooks/useGame'
import styles from './App.module.scss'

function App() {
  const { levels, currentLevel, board, minesRemaining, reveal, flag, restart, selectLevel } =
    useGame()

  return (
    <main className={styles.app}>
      <h1 className={styles.app__title}>Saper</h1>
      <LevelSelector levels={levels} currentLevelId={currentLevel.id} onSelect={selectLevel} />
      <GameStatus board={board} minesRemaining={minesRemaining} onRestart={restart} />
      <Board board={board} onReveal={reveal} onFlag={flag} />
    </main>
  )
}

export default App
