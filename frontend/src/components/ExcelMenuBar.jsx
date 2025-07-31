import React, { useState, useRef, useEffect } from 'react';
import './MainContent.css';

export default function ExcelMenuBar({ menuOptions, menuHandlers }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const menuRefs = useRef({});
  const closeTimeout = useRef();

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (!Object.values(menuRefs.current).some(ref => ref && ref.contains(e.target))) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Delay para fechar menu ao sair
  function handleMouseLeaveMenu() {
    closeTimeout.current = setTimeout(() => setOpenMenu(null), 250);
  }
  function handleMouseEnterMenu(menu) {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setHoveredMenu(menu);
  }

  // Navega��o por teclado
  function handleMenuKeyDown(e, menu) {
    if (e.key === 'ArrowRight') {
      const menus = Object.keys(menuOptions);
      const idx = menus.indexOf(menu);
      setOpenMenu(menus[(idx + 1) % menus.length]);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      const menus = Object.keys(menuOptions);
      const idx = menus.indexOf(menu);
      setOpenMenu(menus[(idx - 1 + menus.length) % menus.length]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpenMenu(null);
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      setOpenMenu(menu);
      e.preventDefault();
    }
  }

  return (
    <nav className="excel-menu-bar">
      {Object.keys(menuOptions).map(menu => (
        <div
          key={menu}
          className={"excel-menu-dropdown" + (openMenu === menu ? ' open' : '')}
          tabIndex={0}
          ref={el => (menuRefs.current[menu] = el)}
          onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
          onKeyDown={e => handleMenuKeyDown(e, menu)}
          onMouseEnter={() => handleMouseEnterMenu(menu)}
          onMouseLeave={handleMouseLeaveMenu}
        >
          <span className="excel-menu-title">{menu}</span>
          {openMenu === menu && (
            <div className="excel-dropdown-content">
              {menuOptions[menu].map((opt, i) =>
                opt === '---' ? (
                  <div key={i} className="excel-menu-separator" />
                ) : (
                  <button
                    className="excel-menu-action"
                    key={i}
                    onClick={() => {
                      setOpenMenu(null);
                      if (menuHandlers[menu] && menuHandlers[menu][opt]) menuHandlers[menu][opt]();
                    }}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
} 