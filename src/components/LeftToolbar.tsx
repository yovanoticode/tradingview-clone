import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  Ruler, 
  Magnet, 
  Trash2,
  ZoomIn,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Smile,
  Star,
  Check
} from 'lucide-react';
import type { DrawingTool } from '../types';

interface LeftToolbarProps {
  activeTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  magnetMode: boolean;
  onToggleMagnet: () => void;
  onClearDrawings: () => void;
  stayInDrawingMode?: boolean;
  onToggleStayInDrawingMode?: () => void;
  lockDrawings?: boolean;
  onToggleLockDrawings?: () => void;
  hideDrawings?: boolean;
  onToggleHideDrawings?: () => void;
  favoritesActive?: boolean;
  onToggleFavorites?: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onSelectTool,
  magnetMode,
  onToggleMagnet,
  onClearDrawings,
  stayInDrawingMode = false,
  onToggleStayInDrawingMode,
  lockDrawings = false,
  onToggleLockDrawings,
  hideDrawings = false,
  onToggleHideDrawings,
  favoritesActive = false,
  onToggleFavorites,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tv-left-toolbar')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const toggleMenu = (menuKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menuKey ? null : menuKey);
  };

  const handleToolClick = (tool: DrawingTool) => {
    onSelectTool(activeTool === tool ? 'none' : tool);
    setActiveMenu(null);
  };

  return (
    <aside className="tv-left-toolbar">
      <div className="toolbar-top">
        {/* 1. Cursor Tools */}
        <div className="tool-group-wrapper">
          <button
            title="Herramientas de cursor"
            className={`tv-tool-btn ${['crosshair', 'dot', 'arrow', 'eraser'].includes(activeTool) ? 'active' : ''}`}
            onClick={() => handleToolClick('crosshair')}
          >
            <Crosshair size={18} />
            <span className="tool-caret" onClick={(e) => toggleMenu('cursor', e)}>›</span>
          </button>
          {activeMenu === 'cursor' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">CURSOR</div>
              <div className={`flyout-item ${activeTool === 'crosshair' ? 'active' : ''}`} onClick={() => handleToolClick('crosshair')}>
                <span>Cruce</span>
                {activeTool === 'crosshair' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'dot' ? 'active' : ''}`} onClick={() => handleToolClick('dot')}>
                <span>Punto</span>
                {activeTool === 'dot' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'arrow' ? 'active' : ''}`} onClick={() => handleToolClick('arrow')}>
                <span>Flecha</span>
                {activeTool === 'arrow' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => handleToolClick('eraser')}>
                <span>Borrador</span>
                {activeTool === 'eraser' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        {/* 2. Trend Line Tools */}
        <div className="tool-group-wrapper">
          <button
            title="Líneas de tendencia"
            className={`tv-tool-btn ${['trendline', 'ray', 'horizontal', 'vertical', 'parallel_channel'].includes(activeTool) ? 'active' : ''}`}
            onClick={() => handleToolClick('trendline')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="19" r="2" />
              <circle cx="19" cy="5" r="2" />
              <line x1="6.5" y1="17.5" x2="17.5" y2="6.5" />
            </svg>
            <span className="tool-caret" onClick={(e) => toggleMenu('lines', e)}>›</span>
          </button>
          {activeMenu === 'lines' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">LÍNEAS DE TENDENCIA</div>
              <div className={`flyout-item ${activeTool === 'trendline' ? 'active' : ''}`} onClick={() => handleToolClick('trendline')}>
                <span>Línea de tendencia</span>
                {activeTool === 'trendline' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'ray' ? 'active' : ''}`} onClick={() => handleToolClick('ray')}>
                <span>Semirrecta (Rayo)</span>
                {activeTool === 'ray' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'horizontal' ? 'active' : ''}`} onClick={() => handleToolClick('horizontal')}>
                <span>Línea horizontal</span>
                {activeTool === 'horizontal' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'vertical' ? 'active' : ''}`} onClick={() => handleToolClick('vertical')}>
                <span>Línea vertical</span>
                {activeTool === 'vertical' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'parallel_channel' ? 'active' : ''}`} onClick={() => handleToolClick('parallel_channel')}>
                <span>Canal paralelo</span>
                {activeTool === 'parallel_channel' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        {/* 3. Gann & Fibonacci Tools */}
        <div className="tool-group-wrapper">
          <button
            title="Herramientas Gann y Fibonacci"
            className={`tv-tool-btn ${['fibonacci', 'fib_extension'].includes(activeTool) ? 'active' : ''}`}
            onClick={() => handleToolClick('fibonacci')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="5" x2="21" y2="5" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <circle cx="18" cy="9" r="1.5" />
              <line x1="3" y1="14" x2="21" y2="14" />
              <line x1="3" y1="19" x2="21" y2="19" />
              <circle cx="6" cy="19" r="1.5" />
            </svg>
            <span className="tool-caret" onClick={(e) => toggleMenu('fib', e)}>›</span>
          </button>
          {activeMenu === 'fib' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">GANN Y FIBONACCI</div>
              <div className={`flyout-item ${activeTool === 'fibonacci' ? 'active' : ''}`} onClick={() => handleToolClick('fibonacci')}>
                <span>Retroceso de Fibonacci</span>
                {activeTool === 'fibonacci' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'fib_extension' ? 'active' : ''}`} onClick={() => handleToolClick('fib_extension')}>
                <span>Extensión de Fibonacci</span>
                {activeTool === 'fib_extension' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        {/* 4. Geometric Patterns */}
        <div className="tool-group-wrapper">
          <button
            title="Patrones geométricos y armónicos"
            className={`tv-tool-btn ${['pattern_xabcd', 'head_and_shoulders', 'elliott_wave'].includes(activeTool) ? 'active' : ''}`}
            onClick={() => handleToolClick('pattern_xabcd')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="4" cy="19" r="1.5" />
              <circle cx="7" cy="8" r="1.5" />
              <circle cx="14" cy="10" r="1.5" />
              <circle cx="20" cy="19" r="1.5" />
              <polyline points="4,19 7,8 14,10 20,19" />
              <line x1="7" y1="8" x2="20" y2="19" />
            </svg>
            <span className="tool-caret" onClick={(e) => toggleMenu('patterns', e)}>›</span>
          </button>
          {activeMenu === 'patterns' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">PATRONES</div>
              <div className={`flyout-item ${activeTool === 'pattern_xabcd' ? 'active' : ''}`} onClick={() => handleToolClick('pattern_xabcd')}>
                <span>Patrón XABCD</span>
                {activeTool === 'pattern_xabcd' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'head_and_shoulders' ? 'active' : ''}`} onClick={() => handleToolClick('head_and_shoulders')}>
                <span>Cabeza y hombros</span>
                {activeTool === 'head_and_shoulders' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'elliott_wave' ? 'active' : ''}`} onClick={() => handleToolClick('elliott_wave')}>
                <span>Onda impulsiva de Elliott (12345)</span>
                {activeTool === 'elliott_wave' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        {/* 5. Prediction & Measurement (Long/Short) */}
        <div className="tool-group-wrapper">
          <button
            title="Herramientas de previsión y medida"
            className={`tv-tool-btn ${['long_position', 'short_position', 'price_range'].includes(activeTool) ? 'active' : ''}`}
            onClick={() => handleToolClick('long_position')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <circle cx="5" cy="6" r="1.5" />
              <path d="M12 9v5h3" />
              <line x1="3" y1="18" x2="21" y2="18" />
              <circle cx="5" cy="18" r="1.5" />
            </svg>
            <span className="tool-caret" onClick={(e) => toggleMenu('pred', e)}>›</span>
          </button>
          {activeMenu === 'pred' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">PREVISIÓN Y MEDIDA</div>
              <div className={`flyout-item ${activeTool === 'long_position' ? 'active' : ''}`} onClick={() => handleToolClick('long_position')}>
                <span>Posición larga (Long)</span>
                {activeTool === 'long_position' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'short_position' ? 'active' : ''}`} onClick={() => handleToolClick('short_position')}>
                <span>Posición corta (Short)</span>
                {activeTool === 'short_position' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'price_range' ? 'active' : ''}`} onClick={() => handleToolClick('price_range')}>
                <span>Rango de fecha y precio</span>
                {activeTool === 'price_range' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        {/* 6. Geometric Shapes & Brush */}
        <div className="tool-group-wrapper">
          <button
            title="Pincel y formas geométricas"
            className={`tv-tool-btn ${['brush', 'rectangle', 'circle', 'path'].includes(activeTool) ? 'active' : ''}`}
            onClick={() => handleToolClick('brush')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
              <path d="M9 8c-2 3-4 3.5-7 4 2 2 3.5 3 6 3 1.5 0 3-1 4-2" />
            </svg>
            <span className="tool-caret" onClick={(e) => toggleMenu('shapes', e)}>›</span>
          </button>
          {activeMenu === 'shapes' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">PINCEL Y FORMAS</div>
              <div className={`flyout-item ${activeTool === 'brush' ? 'active' : ''}`} onClick={() => handleToolClick('brush')}>
                <span>Pincel</span>
                {activeTool === 'brush' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'rectangle' ? 'active' : ''}`} onClick={() => handleToolClick('rectangle')}>
                <span>Rectángulo</span>
                {activeTool === 'rectangle' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'circle' ? 'active' : ''}`} onClick={() => handleToolClick('circle')}>
                <span>Círculo</span>
                {activeTool === 'circle' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'path' ? 'active' : ''}`} onClick={() => handleToolClick('path')}>
                <span>Ruta / Polilínea</span>
                {activeTool === 'path' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        {/* 7. Text Tools */}
        <div className="tool-group-wrapper">
          <button
            title="Herramientas de texto"
            className={`tv-tool-btn ${['text', 'note'].includes(activeTool) ? 'active' : ''}`}
            onClick={() => handleToolClick('text')}
          >
            <span style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'serif' }}>T</span>
            <span className="tool-caret" onClick={(e) => toggleMenu('text', e)}>›</span>
          </button>
          {activeMenu === 'text' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">TEXTO</div>
              <div className={`flyout-item ${activeTool === 'text' ? 'active' : ''}`} onClick={() => handleToolClick('text')}>
                <span>Texto</span>
                {activeTool === 'text' && <Check size={14} className="flyout-check" />}
              </div>
              <div className={`flyout-item ${activeTool === 'note' ? 'active' : ''}`} onClick={() => handleToolClick('note')}>
                <span>Nota anclada</span>
                {activeTool === 'note' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        {/* 8. Icons / Emojis */}
        <div className="tool-group-wrapper">
          <button
            title="Iconos y stickers"
            className={`tv-tool-btn ${activeTool === 'emoji' ? 'active' : ''}`}
            onClick={() => handleToolClick('emoji')}
          >
            <Smile size={18} />
            <span className="tool-caret" onClick={(e) => toggleMenu('emoji', e)}>›</span>
          </button>
          {activeMenu === 'emoji' && (
            <div className="tool-flyout-menu">
              <div className="flyout-header">ICONOS</div>
              <div className={`flyout-item ${activeTool === 'emoji' ? 'active' : ''}`} onClick={() => handleToolClick('emoji')}>
                <span>Emojis y Stickers</span>
                {activeTool === 'emoji' && <Check size={14} className="flyout-check" />}
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* 9. Measure Tool */}
        <button
          title="Medir (distancia de precio y tiempo)"
          className={`tv-tool-btn ${activeTool === 'measure' ? 'active' : ''}`}
          onClick={() => handleToolClick('measure')}
        >
          <Ruler size={18} />
        </button>

        {/* 10. Zoom Tool */}
        <button
          title="Acercar (Zoom)"
          className={`tv-tool-btn ${activeTool === 'zoom' ? 'active' : ''}`}
          onClick={() => handleToolClick('zoom')}
        >
          <ZoomIn size={18} />
        </button>

        <div className="toolbar-divider" />

        {/* 11. Magnet Mode */}
        <button
          title={magnetMode ? 'Modo Imán Activado' : 'Modo Imán Desactivado'}
          className={`tv-tool-btn tv-magnet-btn ${magnetMode ? 'active-white' : ''}`}
          onClick={onToggleMagnet}
        >
          <Magnet size={18} />
        </button>

        {/* 12. Stay in Drawing Mode */}
        <button
          title={stayInDrawingMode ? 'Permanecer en modo dibujo: ACTIVADO' : 'Permanecer en modo dibujo: DESACTIVADO'}
          className={`tv-tool-btn ${stayInDrawingMode ? 'active' : ''}`}
          onClick={onToggleStayInDrawingMode}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <rect x="14" y="14" width="7" height="6" rx="1" />
            <path d="M16 14v-2a1.5 1.5 0 0 1 3 0v2" />
          </svg>
        </button>

        {/* 13. Lock All Drawings */}
        <button
          title={lockDrawings ? 'Desbloquear todas las herramientas de dibujo' : 'Bloquear todas las herramientas de dibujo'}
          className={`tv-tool-btn ${lockDrawings ? 'active' : ''}`}
          onClick={onToggleLockDrawings}
        >
          {lockDrawings ? <Lock size={18} /> : <Unlock size={18} />}
        </button>

        {/* 14. Hide Drawings */}
        <button
          title={hideDrawings ? 'Mostrar dibujos' : 'Ocultar todos los dibujos'}
          className={`tv-tool-btn ${hideDrawings ? 'active' : ''}`}
          onClick={onToggleHideDrawings}
        >
          {hideDrawings ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        <div className="toolbar-divider" />

        {/* 15. Delete / Trash Drawings */}
        <button
          title="Eliminar todos los dibujos"
          className="tv-tool-btn danger"
          onClick={onClearDrawings}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 16. Favorites Toolbar Button at the Bottom */}
      <div className="toolbar-bottom">
        <button
          title="Barra de herramientas de dibujo favoritas"
          className={`tv-tool-btn favorites-btn ${favoritesActive ? 'active-white' : ''}`}
          onClick={onToggleFavorites}
        >
          <Star size={18} fill={favoritesActive ? '#fbc02d' : 'none'} color={favoritesActive ? '#fbc02d' : 'currentColor'} />
        </button>
      </div>
    </aside>
  );
};
