import { useId, useRef } from 'react';

// Patrón de pestañas de WAI-ARIA: solo la activa entra en el orden de tabulación
// y las flechas, Inicio y Fin cambian de pestaña.
export default function Tabs({ activeId, children, label, onChange, tabs = [] }) {
  const baseId = useId();
  const tabRefs = useRef({});
  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);

  const select = (index) => {
    const tab = tabs[index];
    onChange(tab.id);
    const element = tabRefs.current[tab.id];
    element?.focus();
    element?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  const handleKeyDown = (event) => {
    const lastIndex = tabs.length - 1;
    const target = {
      ArrowRight: activeIndex === lastIndex ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? lastIndex : activeIndex - 1,
      Home: 0,
      End: lastIndex,
    }[event.key];

    if (target === undefined) return;
    event.preventDefault();
    select(target);
  };

  return (
    <div className="tabs">
      {/* El foco lo llevan los propios botones de pestaña. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div className="tabs__list" role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              id={`${baseId}-tab-${tab.id}`}
              className={`tabs__tab ${isActive ? 'tabs__tab--active' : ''}`.trim()}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => select(index)}
            >
              {tab.label}
              {tab.count !== undefined && <span className="tabs__count">{tab.count}</span>}
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        className="tabs__panel"
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeId}`}
      >
        {children}
      </div>
    </div>
  );
}
