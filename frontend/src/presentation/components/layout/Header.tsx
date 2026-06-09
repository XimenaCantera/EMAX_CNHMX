import React from 'react';
import { Search, Bell } from 'lucide-react';
import './Header.css';

interface PropiedadesCabecera {
  titulo?: string;
  subtitulo?: string;
}

export const Cabecera: React.FC<PropiedadesCabecera> = ({ titulo = 'Tablero Industrial', subtitulo }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h2>{titulo}</h2>
        {subtitulo && <p className="text-muted text-sm">{subtitulo}</p>}
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Buscar unidades..." />
        </div>

        <div className="header-actions">
          <button className="icon-btn" title="Notificaciones">
            <Bell size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export const Header = Cabecera;
export type HeaderProps = PropiedadesCabecera;
