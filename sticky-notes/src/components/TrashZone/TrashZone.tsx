import './TrashZone.css';

interface TrashZoneProps {
  isDragging: boolean;
  isDragOver: boolean;
}

export function TrashZone({ isDragging, isDragOver }: TrashZoneProps) {
  const className = [
    'trash-zone',
    isDragging ? 'trash-zone--dragging' : '',
    isDragOver ? 'trash-zone--drag-over' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      role="region"
      aria-label="Trash — drop a note here to delete"
    >
      <svg
        className="trash-zone__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm3 0h2v9h-2V9zm-6 0h2v9H7V9z"
        />
      </svg>
      <span className="trash-zone__label">Drop to delete</span>
    </div>
  );
}
