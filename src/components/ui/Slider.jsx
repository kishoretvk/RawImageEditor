import React, { useCallback, useId, useMemo } from "react";
import "./Slider.css";

/**
 * Accessible, themeable slider primitive built on input[type="range"].
 *
 * Props:
 *  - value: number
 *  - onChange: (next: number) => void
 *  - onChangeEnd?: (final: number) => void (fires on blur/mouseup/touchend)
 *  - min?: number (default 0)
 *  - max?: number (default 100)
 *  - step?: number (default 1)
 *  - label?: string | ReactNode
 *  - showValue?: boolean (default true)
 *  - formatValue?: (v:number)=>string
 *  - size?: 'sm' | 'md' | 'lg' (default 'md')
 *  - variant?: 'primary' | 'secondary' | 'ghost' (default 'secondary')
 *  - disabled?: boolean
 *  - orientation?: 'horizontal' | 'vertical' (default 'horizontal')
 *  - marks?: number[] (render tick marks)
 *  - className?: string
 */
export default function Slider({
  value,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue,
  size = "md",
  variant = "secondary",
  disabled = false,
  orientation = "horizontal",
  marks = [],
  className = "",
  ...rest
}) {
  const id = useId();

  const pct = useMemo(() => {
    const v = Number(value ?? min);
    const clamped = Math.max(min, Math.min(max, v));
    return ((clamped - min) / (max - min)) * 100;
  }, [value, min, max]);

  const handleChange = useCallback(
    (e) => {
      const next = Number(e.target.value);
      onChange && onChange(next);
    },
    [onChange]
  );

  const handleChangeEnd = useCallback(() => {
    if (!onChangeEnd) return;
    onChangeEnd(Number(value ?? min));
  }, [onChangeEnd, value, min]);

  const classes = [
    "ui-slider",
    `is-${size}`,
    `is-${variant}`,
    orientation === "vertical" ? "is-vertical" : "is-horizontal",
    disabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const displayValue = formatValue ? formatValue(Number(value ?? min)) : `${Number(value ?? min)}`;

  return (
    <div className={classes}>
      {label ? (
        <label className="ui-slider__label" htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div className="ui-slider__trackWrap" data-orientation={orientation}>
        <input
          id={id}
          type="range"
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Number(value ?? min)}
          aria-disabled={disabled || undefined}
          min={min}
          max={max}
          step={step}
          value={Number(value ?? min)}
          onChange={handleChange}
          onMouseUp={handleChangeEnd}
          onTouchEnd={handleChangeEnd}
          onBlur={handleChangeEnd}
          disabled={disabled}
          className="ui-slider__input"
          {...rest}
        />

        <div className="ui-slider__track">
          <div className="ui-slider__fill" style={{ width: orientation === "horizontal" ? `${pct}%` : undefined, height: orientation === "vertical" ? `${pct}%` : undefined }} />
          <div
            className="ui-slider__thumb"
            style={{
              left: orientation === "horizontal" ? `${pct}%` : undefined,
              bottom: orientation === "vertical" ? `${pct}%` : undefined,
            }}
          />
        </div>

        {marks && marks.length > 0 ? (
          <div className="ui-slider__marks" aria-hidden="true">
            {marks.map((m, i) => {
              const mp = ((m - min) / (max - min)) * 100;
              return (
                <div
                  key={`${m}-${i}`}
                  className="ui-slider__mark"
                  style={{
                    left: orientation === "horizontal" ? `${mp}%` : undefined,
                    bottom: orientation === "vertical" ? `${mp}%` : undefined,
                  }}
                  title={`${m}`}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {showValue ? <div className="ui-slider__value">{displayValue}</div> : null}
    </div>
  );
}
