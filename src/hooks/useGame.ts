import { useMemo, useReducer } from 'react'
import { createBoard, revealCell, toggleFlag, type Board, type Level } from '../logic/board'
import levelsFile from '../data/saper-plansze.json'

const levels = levelsFile.levels as Level[]

type State = {
  levels: Level[]
  currentLevelIndex: number
  board: Board
}

type Action =
  | { type: 'reveal'; index: number }
  | { type: 'flag'; index: number }
  | { type: 'restart' }
  | { type: 'select-level'; levelId: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reveal':
      return { ...state, board: revealCell(state.board, action.index) }
    case 'flag':
      return { ...state, board: toggleFlag(state.board, action.index) }
    case 'restart':
      return { ...state, board: createBoard(state.levels[state.currentLevelIndex]) }
    case 'select-level': {
      const index = state.levels.findIndex((level) => level.id === action.levelId)
      if (index === -1) return state
      return { ...state, currentLevelIndex: index, board: createBoard(state.levels[index]) }
    }
  }
}

function initState(levels: Level[]): State {
  return { levels, currentLevelIndex: 0, board: createBoard(levels[0]) }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, levels, initState)

  const minesRemaining = useMemo(() => {
    const mineCount = state.board.cells.filter((cell) => cell.mine).length
    const flagCount = state.board.cells.filter((cell) => cell.flagged).length
    return mineCount - flagCount
  }, [state.board])

  return {
    levels: state.levels,
    currentLevel: state.levels[state.currentLevelIndex],
    board: state.board,
    minesRemaining,
    reveal: (index: number) => dispatch({ type: 'reveal', index }),
    flag: (index: number) => dispatch({ type: 'flag', index }),
    restart: () => dispatch({ type: 'restart' }),
    selectLevel: (levelId: string) => dispatch({ type: 'select-level', levelId }),
  }
}
