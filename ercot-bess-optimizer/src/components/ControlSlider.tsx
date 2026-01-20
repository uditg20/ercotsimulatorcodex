import React from 'react'

interface ControlSliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  displayValue?: string
  hint?: string
  onChange: (value: number) => void
}

const ControlSlider: React.FC<ControlSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  displayValue,
  hint,
  onChange,
}) => {
  return (
    <div className="control">
      <div className="control-header">
        <span>{label}</span>
        <span className="control-value">
          {displayValue ?? `${value}${unit ?? ''}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <div className="control-hint">{hint}</div> : null}
    </div>
  )
}

export default ControlSlider
