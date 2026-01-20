import React from 'react'
import { ScenarioPreset } from '../data/presets'

interface ScenarioPresetsProps {
  presets: ScenarioPreset[]
  activeId?: string
  onSelect: (preset: ScenarioPreset) => void
}

const ScenarioPresets: React.FC<ScenarioPresetsProps> = ({
  presets,
  activeId,
  onSelect,
}) => {
  return (
    <div className="card presets-card">
      <div className="card-title">Scenario Presets (Executive Playbooks)</div>
      <div className="preset-grid">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`preset-card ${
              activeId === preset.id ? 'preset-card-active' : ''
            }`}
            onClick={() => onSelect(preset)}
          >
            <div className="preset-title">{preset.name}</div>
            <div className="preset-action">Expected: {preset.expectedAction}</div>
            <div className="preset-why">{preset.why}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ScenarioPresets
