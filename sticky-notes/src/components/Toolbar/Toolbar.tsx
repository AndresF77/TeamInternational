import './Toolbar.css';

interface ToolbarProps {
  noteCount: number;
  onAddNote: () => void;
}

export function Toolbar({ noteCount, onAddNote }: ToolbarProps) {
  return (
    <header className="toolbar" role="banner">
      <div className="toolbar__brand">
        <h1 className="toolbar__title">Sticky Notes</h1>
        <span className="toolbar__count" aria-live="polite">
          {noteCount} {noteCount === 1 ? 'note' : 'notes'}
        </span>
      </div>
      <button
        type="button"
        className="toolbar__add-btn"
        onClick={onAddNote}
        aria-label="Add a new sticky note"
      >
        Add note
      </button>
    </header>
  );
}
