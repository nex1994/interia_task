import { describe, expect, it } from 'vitest'
import { createBoard, revealCell, toggleFlag, type Level } from './board'
import levelsFile from '../data/saper-plansze.json'

const levels = levelsFile.levels as Level[]

function level(overrides: Partial<Level>): Level {
  return {
    id: 'test',
    name: 'Test',
    width: 3,
    height: 1,
    mineCount: 0,
    mines: [],
    ...overrides,
  }
}

describe('createBoard', () => {
  it('builds every level from saper-plansze.json without throwing', () => {
    for (const lvl of levels) {
      expect(() => createBoard(lvl)).not.toThrow()
    }
  })

  it('dedupes repeated mine coordinates (bliznieta has [2,2] twice)', () => {
    const bliznieta = levels.find((l) => l.id === 'bliznieta')
    if (!bliznieta) throw new Error('fixture level missing')
    const board = createBoard(bliznieta)
    const mineCells = board.cells.filter((c) => c.mine)
    expect(mineCells).toHaveLength(7)
  })

  it('drops out-of-bounds mine coordinates (za-plotem has x=8 on an 8-wide board)', () => {
    const zaPlotem = levels.find((l) => l.id === 'za-plotem')
    if (!zaPlotem) throw new Error('fixture level missing')
    const board = createBoard(zaPlotem)
    const mineCells = board.cells.filter((c) => c.mine)
    expect(mineCells).toHaveLength(5)
  })
})

describe('cascade', () => {
  it('reveals the connected zero-adjacent region and stops at flagged cells', () => {
    // 4x1 row, single mine at the far end: 0 and 1 are zero-adjacent, 2 borders the mine.
    const lvl = level({ width: 4, height: 1, mineCount: 1, mines: [[3, 0]] })
    let board = createBoard(lvl)
    board = toggleFlag(board, 1)
    board = revealCell(board, 0)

    expect(board.cells[0].revealed).toBe(true)
    expect(board.cells[1].revealed).toBe(false) // cascade never reveals a flagged cell
    expect(board.cells[2].revealed).toBe(false) // unreachable once the flag blocks the flood
    expect(board.cells[3].revealed).toBe(false) // mine, untouched
  })
})

describe('first-click safety', () => {
  it('relocates a mine hit on the first reveal to the lowest free index', () => {
    // 3 cells, mine on the one being clicked: only index 1 is a legal target.
    const lvl = level({ width: 3, height: 1, mineCount: 1, mines: [[0, 0]] })
    const board = createBoard(lvl)

    const result = revealCell(board, 0)

    expect(result.state).toBe('playing')
    expect(result.cells[0].mine).toBe(false)
    expect(result.cells[0].revealed).toBe(true)
    expect(result.cells[1].mine).toBe(true)
  })

  it('loses on the first click when no safe relocation target exists (fully mined board)', () => {
    const lvl = level({
      width: 3,
      height: 3,
      mineCount: 9,
      mines: [
        [0, 0], [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1],
        [0, 2], [1, 2], [2, 2],
      ],
    })
    const board = createBoard(lvl)

    const result = revealCell(board, 4)

    expect(result.state).toBe('lost')
    expect(result.cells[4].mine).toBe(true)
    expect(result.cells[4].revealed).toBe(true)
  })
})

describe('win condition', () => {
  it('wins once every non-mine cell is revealed', () => {
    const lvl = level({ width: 2, height: 1, mineCount: 1, mines: [[1, 0]] })
    let board = createBoard(lvl)

    board = revealCell(board, 0)

    expect(board.state).toBe('won')
  })
})

describe('flags', () => {
  it('cannot reveal a flagged cell, and cannot flag a revealed cell', () => {
    const lvl = level({ width: 2, height: 1, mineCount: 0, mines: [] })
    let board = createBoard(lvl)

    board = toggleFlag(board, 0)
    const stillFlagged = revealCell(board, 0)
    expect(stillFlagged).toBe(board) // no-op: same reference
    expect(stillFlagged.cells[0].revealed).toBe(false)

    let board2 = createBoard(lvl)
    board2 = revealCell(board2, 1)
    const stillUnflagged = toggleFlag(board2, 1)
    expect(stillUnflagged).toBe(board2) // no-op: same reference
    expect(stillUnflagged.cells[1].flagged).toBe(false)
  })
})

describe('chording', () => {
  // 3x3 board, mines at bottom-left (0,2)=6 and bottom-right (2,2)=8.
  // Revealing index 0 cascades through the zero region {0,1,2} and exposes
  // the numbered border {3,4,5}, leaving 6, 7 and 8 hidden.
  function chordBoard() {
    const lvl = level({
      width: 3,
      height: 3,
      mineCount: 2,
      mines: [
        [0, 2],
        [2, 2],
      ],
    })
    return revealCell(createBoard(lvl), 0)
  }

  it('does nothing while the flag count does not match the cell number', () => {
    const board = chordBoard()
    const result = revealCell(board, 4) // adjacent === 2, no flags placed yet
    expect(result).toBe(board)
  })

  it('reveals the remaining neighbors once flags match, completing the win', () => {
    let board = chordBoard()
    board = toggleFlag(board, 6)
    board = toggleFlag(board, 8)

    board = revealCell(board, 4) // chord: adjacent === 2 === flagged neighbors

    expect(board.cells[7].revealed).toBe(true)
    expect(board.state).toBe('won')
  })

  it('loses when a flag sits on the wrong cell', () => {
    let board = chordBoard()
    board = toggleFlag(board, 7) // 7 is not a mine

    board = revealCell(board, 3) // adjacent === 1, matches the single (wrong) flag

    expect(board.state).toBe('lost')
    expect(board.cells[6].revealed).toBe(true) // the real mine got revealed
  })
})
