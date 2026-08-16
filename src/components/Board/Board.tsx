import type { CSSProperties } from 'react'
import type { Board as BoardModel } from '../../logic/board'
import { Cell } from '../Cell/Cell'
import styles from './Board.module.scss'

type BoardProps = {
  board: BoardModel
  onReveal: (index: number) => void
  onFlag: (index: number) => void
}

export function Board({ board, onReveal, onFlag }: BoardProps) {
  const gridStyle = {
    '--board-columns': board.width,
  } as CSSProperties

  return (
    <div className={styles.board} style={gridStyle}>
      {board.cells.map((cell, index) => (
        <Cell
          key={index}
          cell={cell}
          lost={board.state === 'lost'}
          onReveal={() => onReveal(index)}
          onFlag={() => onFlag(index)}
        />
      ))}
    </div>
  )
}
