import { 
  Crosshair, 
  Minus, 
  MoveHorizontal, 
  Ruler, 
  Magnet, 
  Trash2
} from 'lucide-react';
import type { DrawingTool } from '../types';

interface LeftToolbarProps {
  activeTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  magnetMode: boolean;
  onToggleMagnet: () => void;
  onClearDrawings: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onSelectTool,
  magnetMode,
  onToggleMagnet,
  onClearDrawings,
}) => {
  return (
    <aside className="tv-left-toolbar">
      <div className="toolbar-top">
        <button
          title="Cursor / Cruz"
          className={`tv-tool-btn ${activeTool === 'crosshair' ? 'active' : ''}`}
          onClick={() => onSelectTool('crosshair')}
        >
          <Crosshair size={18} />
        </button>

        <button
          title="Línea de Tendencia"
          className={`tv-tool-btn ${activeTool === 'trendline' ? 'active' : ''}`}
          onClick={() => onSelectTool(activeTool === 'trendline' ? 'none' : 'trendline')}
        >
          <Minus size={18} style={{ transform: 'rotate(-45deg)' }} />
        </button>

        <button
          title="Línea Horizontal (Soporte/Resistencia)"
          className={`tv-tool-btn ${activeTool === 'horizontal' ? 'active' : ''}`}
          onClick={() => onSelectTool(activeTool === 'horizontal' ? 'none' : 'horizontal')}
        >
          <MoveHorizontal size={18} />
        </button>

        <button
          title="Regla de Medición (Rango de Precio)"
          className={`tv-tool-btn ${activeTool === 'measure' ? 'active' : ''}`}
          onClick={() => onSelectTool(activeTool === 'measure' ? 'none' : 'measure')}
        >
          <Ruler size={18} />
        </button>
      </div>

      <div className="toolbar-bottom">
        <button
          title={magnetMode ? 'Modo Imán Activado' : 'Modo Imán Desactivado'}
          className={`tv-tool-btn ${magnetMode ? 'active' : ''}`}
          onClick={onToggleMagnet}
        >
          <Magnet size={18} />
        </button>

        <button
          title="Eliminar todos los dibujos"
          className="tv-tool-btn danger"
          onClick={onClearDrawings}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </aside>
  );
};
