import React from "react";
import "./Panel.css";

export default function Panel({ title, actions = null, children, className = "" }) {
  return (
    <section className={["ui-panel", className].filter(Boolean).join(" ")}>
      {(title || actions) && (
        <header className="ui-panel__header">
          {title ? <h3 className="ui-panel__title">{title}</h3> : <span />}
          <div className="ui-panel__actions">{actions}</div>
        </header>
      )}
      <div className="ui-panel__body">{children}</div>
    </section>
  );
}
