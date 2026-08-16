import type { Board } from '../../logic/board'
import styles from './GameStatus.module.scss'

type GameStatusProps = {
  board: Board
  minesRemaining: number
  onRestart: () => void
}

const STATUS_LABEL: Record<Board['state'], string> = {
  idle: 'Kliknij dowolne pole, aby zacząć',
  playing: 'W trakcie gry',
  won: 'Wygrana!',
  lost: 'Przegrana',
}

export function GameStatus({ board, minesRemaining, onRestart }: GameStatusProps) {
  const modifier = styles[`status__message--${board.state}`] ?? ''

  return (
    <div className={styles.status}>
      <span className={styles.status__counter}>Miny: {minesRemaining}</span>
      <span className={`${styles.status__message} ${modifier}`}>{STATUS_LABEL[board.state]}</span>
      <button type="button" className={styles.status__restart} onClick={onRestart}>
        Restart
      </button>
    </div>
  )
}
