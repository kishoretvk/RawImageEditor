import React from "react";
import "./Card.css";

/**
 * Card UI primitive
 * Props:
 *  - title?: string | ReactNode
 *  - subtitle?: string | ReactNode
 *  - image?: string | ReactNode (url or custom JSX)
 *  - actions?: ReactNode
 *  - footer?: ReactNode
 *  - children?: ReactNode (content body)
 *  - variant?: 'default' | 'compact' | 'elevated'
 *  - onClick?: () => void (makes card clickable)
 *  - className?: string
 */
export default function Card({
  title,
  subtitle,
  image,
  actions = null,
  footer = null,
  children,
  variant = "default",
  onClick,
  className = "",
}) {
  const classes = [
    "ui-card",
    variant ? `is-${variant}` : "",
    onClick ? "is-clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const renderImage = () => {
    if (!image) return null;
    if (typeof image === "string") {
      return (
        <div className="ui-card__media">
          <img alt="" src={image} />
        </div>
      );
    }
    return <div className="ui-card__media">{image}</div>;
  };

  return (
    <article className={classes} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      {renderImage()}
      {(title || actions) && (
        <header className="ui-card__header">
          <div className="ui-card__titles">
            {title ? <h3 className="ui-card__title">{title}</h3> : null}
            {subtitle ? <div className="ui-card__subtitle">{subtitle}</div> : null}
          </div>
          {actions ? <div className="ui-card__actions">{actions}</div> : null}
        </header>
      )}
      {children ? <div className="ui-card__body">{children}</div> : null}
      {footer ? <footer className="ui-card__footer">{footer}</footer> : null}
    </article>
  );
}
