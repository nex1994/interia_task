import type { MouseEvent } from 'react'
import type { Cell as CellModel } from '../../logic/board'
import styles from './Cell.module.scss'

type CellProps = {
  cell: CellModel
  lost: boolean
  onReveal: () => void
  onFlag: () => void
}

export function Cell({ cell, lost, onReveal, onFlag }: CellProps) {
  const showMine = cell.mine && (cell.revealed || lost)
  const modifiers = [
    styles.cell,
    cell.revealed ? styles['cell--revealed'] : styles['cell--hidden'],
    cell.flagged && !cell.revealed ? styles['cell--flagged'] : '',
    showMine ? styles['cell--mine'] : '',
    cell.revealed && !cell.mine && cell.adjacent > 0
      ? styles[`cell--number-${cell.adjacent}`]
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault()
    onFlag()
  }

  return (
    <button
      type="button"
      className={modifiers}
      onClick={onReveal}
      onContextMenu={handleContextMenu}
      aria-label={cellLabel(cell, showMine)}
    >
      {showMine ? '💣' : cell.flagged ? '🚩' : cell.revealed && cell.adjacent > 0 ? cell.adjacent : ''}
    </button>
  )
}

function cellLabel(cell: CellModel, showMine: boolean): string {
  if (showMine) return 'mina'
  if (cell.flagged) return 'oflagowane'
  if (!cell.revealed) return 'zakryte pole'
  if (cell.adjacent > 0) return `${cell.adjacent} sąsiednich min`
  return 'puste pole'
}
