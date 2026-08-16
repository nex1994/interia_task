import type { ChangeEvent } from 'react'
import type { Level } from '../../logic/board'
import styles from './LevelSelector.module.scss'

type LevelSelectorProps = {
  levels: Level[]
  currentLevelId: string
  onSelect: (levelId: string) => void
}

export function LevelSelector({ levels, currentLevelId, onSelect }: LevelSelectorProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onSelect(event.target.value)
  }

  return (
    <label className={styles.selector}>
      <span className={styles.selector__label}>Plansza</span>
      <select className={styles.selector__input} value={currentLevelId} onChange={handleChange}>
        {levels.map((level) => (
          <option key={level.id} value={level.id}>
            {level.name}
          </option>
        ))}
      </select>
    </label>
  )
}
