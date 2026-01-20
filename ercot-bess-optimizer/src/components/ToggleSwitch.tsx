import React from 'react'

interface ToggleSwitchProps {
  label: string
  checked: boolean
  hint?: string
  onChange: (checked: boolean) => void
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  hint,
  onChange,
}) => {
  return (
    <div className="toggle-row">
      <div className="toggle-text">
        <span>{label}</span>
        {hint ? <span className="toggle-hint">{hint}</span> : null}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}

export default ToggleSwitch
