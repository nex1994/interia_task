export type Level = {
  id: string
  name: string
  width: number
  height: number
  mineCount: number
  mines: [number, number][] // [x, y]
}

export type Cell = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number // number of mines in the 8 surrounding cells
}

export type Board = {
  width: number
  height: number
  cells: Cell[] // row by row; cell index = y * width + x
  state: 'idle' | 'playing' | 'won' | 'lost'
}

export function createBoard(level: Level): Board {
  const { width, height } = level
  const mineIndices = normalizeMines(level)

  const cells: Cell[] = Array.from({ length: width * height }, (_, index) => ({
    mine: mineIndices.has(index),
    revealed: false,
    flagged: false,
    adjacent: 0,
  }))

  computeAdjacency(cells, width, height)

  return { width, height, cells, state: 'idle' }
}

export function revealCell(board: Board, index: number): Board {
  if (isGameOver(board) || !isValidIndex(board, index)) return board

  const cell = board.cells[index]
  if (cell.flagged) return board

  if (cell.revealed) return chord(board, index)

  const next = cloneBoard(board)

  if (next.state === 'idle') {
    relocateMineIfNeeded(next, index)
    next.state = 'playing'
  }

  revealFrom(next, index)
  updateWinState(next)

  return next
}

export function toggleFlag(board: Board, index: number): Board {
  if (isGameOver(board) || !isValidIndex(board, index)) return board

  const cell = board.cells[index]
  if (cell.revealed) return board

  const next = cloneBoard(board)
  next.cells[index].flagged = !next.cells[index].flagged

  return next
}

// The source data isn't guaranteed clean: coordinates can repeat or fall
// outside the board (see saper-plansze.json). Both are silently dropped so
// createBoard never throws on a malformed level.
function normalizeMines(level: Level): Set<number> {
  const { width, height, mines } = level
  const indices = new Set<number>()

  for (const [x, y] of mines) {
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    indices.add(y * width + x)
  }

  return indices
}

function neighborsOf(index: number, width: number, height: number): number[] {
  const x = index % width
  const y = Math.floor(index / width)
  const result: number[] = []

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      result.push(ny * width + nx)
    }
  }

  return result
}

function computeAdjacency(cells: Cell[], width: number, height: number): void {
  for (let index = 0; index < cells.length; index++) {
    let count = 0
    for (const neighbor of neighborsOf(index, width, height)) {
      if (cells[neighbor].mine) count++
    }
    cells[index].adjacent = count
  }
}

function cloneBoard(board: Board): Board {
  return {
    width: board.width,
    height: board.height,
    state: board.state,
    cells: board.cells.map((cell) => ({ ...cell })),
  }
}

function isValidIndex(board: Board, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < board.cells.length
}

function isGameOver(board: Board): boolean {
  return board.state === 'won' || board.state === 'lost'
}

// First reveal is always safe: if it would hit a mine, that mine moves to
// the lowest-index free, non-clicked cell. On a fully mined board (e.g. the
// "ciasno" level) there is no such cell, so the mine stays and the player
// loses on the first click, per spec.
function relocateMineIfNeeded(board: Board, index: number): void {
  const clicked = board.cells[index]
  if (!clicked.mine) return

  const targetIndex = board.cells.findIndex((cell, i) => !cell.mine && i !== index)
  if (targetIndex === -1) return

  clicked.mine = false
  board.cells[targetIndex].mine = true
  computeAdjacency(board.cells, board.width, board.height)
}

function revealFrom(board: Board, startIndex: number): void {
  const stack = [startIndex]

  while (stack.length > 0) {
    const index = stack.pop() as number
    const cell = board.cells[index]
    if (cell.revealed || cell.flagged) continue

    cell.revealed = true

    if (cell.mine) {
      board.state = 'lost'
      return
    }

    if (cell.adjacent === 0) {
      for (const neighbor of neighborsOf(index, board.width, board.height)) {
        const neighborCell = board.cells[neighbor]
        if (!neighborCell.revealed && !neighborCell.flagged) stack.push(neighbor)
      }
    }
  }
}

// Clicking an already-revealed numbered cell "chords": if exactly as many
// neighbors are flagged as the cell's number, every other neighbor is
// revealed at once. A wrongly placed flag means a real mine is among those
// neighbors, so the loss happens naturally through revealFrom.
function chord(board: Board, index: number): Board {
  const { width, height, cells } = board
  const cell = cells[index]
  const neighbors = neighborsOf(index, width, height)
  const flaggedCount = neighbors.filter((n) => cells[n].flagged).length

  if (flaggedCount !== cell.adjacent) return board

  const targets = neighbors.filter((n) => !cells[n].flagged && !cells[n].revealed)
  if (targets.length === 0) return board

  const next = cloneBoard(board)
  for (const target of targets) {
    if (next.state === 'lost') break
    revealFrom(next, target)
  }
  updateWinState(next)

  return next
}

function updateWinState(board: Board): void {
  if (board.state === 'lost') return
  const allSafeCellsRevealed = board.cells.every((cell) => cell.mine || cell.revealed)
  if (allSafeCellsRevealed) board.state = 'won'
}
