import { useRef, type MouseEvent } from 'react'
import type { Cell as CellModel } from '../../logic/board'
import styles from './Cell.module.scss'

const LONG_PRESS_MS = 450

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

  // Real mobile browsers don't turn a long-press into a `contextmenu` event
  // the way desktop right-click (or Chrome's devtools touch emulation) does,
  // so long-press-to-flag is detected by hand with a touch timer. The click
  // that a touchend still triggers afterwards is swallowed via this flag,
  // since preventDefault() on touchend isn't reliable enough to stop it.
  const longPressTimer = useRef<number | null>(null)
  const suppressNextClick = useRef(false)

  function clearLongPressTimer() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleTouchStart() {
    clearLongPressTimer()
    longPressTimer.current = window.setTimeout(() => {
      suppressNextClick.current = true
      onFlag()
    }, LONG_PRESS_MS)
  }

  function handleClick() {
    if (suppressNextClick.current) {
      suppressNextClick.current = false
      return
    }
    onReveal()
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault()
    onFlag()
  }

  return (
    <button
      type="button"
      className={modifiers}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPressTimer}
      onTouchMove={clearLongPressTimer}
      onTouchCancel={clearLongPressTimer}
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
