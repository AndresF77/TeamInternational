import './EmptyState.css';

export function EmptyState() {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <p className="empty-state__title">No sticky notes yet</p>
      <p className="empty-state__hint">
        Click <strong>Add note</strong> or double-click the board to create a note. Drag,
        resize, or drop on the trash zone below to delete.
      </p>
    </div>
  );
}
