import React from "react";
import "./Button.css";

export default function Button({
  children,
  as = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  icon = null,
  className = "",
  ...rest
}) {
  const Comp = as;
  const classes = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    disabled ? "is-disabled" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Comp className={classes} disabled={as === "button" ? disabled : undefined} {...rest}>
      {icon ? <span className="ui-btn__icon">{icon}</span> : null}
      <span className="ui-btn__label">{children}</span>
    </Comp>
  );
}
