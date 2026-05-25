import type { NoteColor } from '../models/note';

export const NOTE_COLOR_STYLES: Record<
  NoteColor,
  { background: string; border: string; shadow: string }
> = {
  yellow: {
    background: 'linear-gradient(145deg, #fff9c4 0%, #fff59d 100%)',
    border: '#f9a825',
    shadow: 'rgba(249, 168, 37, 0.35)',
  },
  pink: {
    background: 'linear-gradient(145deg, #fce4ec 0%, #f8bbd0 100%)',
    border: '#ec407a',
    shadow: 'rgba(236, 64, 122, 0.35)',
  },
  blue: {
    background: 'linear-gradient(145deg, #e3f2fd 0%, #bbdefb 100%)',
    border: '#42a5f5',
    shadow: 'rgba(66, 165, 245, 0.35)',
  },
  green: {
    background: 'linear-gradient(145deg, #e8f5e9 0%, #c8e6c9 100%)',
    border: '#66bb6a',
    shadow: 'rgba(102, 187, 106, 0.35)',
  },
  purple: {
    background: 'linear-gradient(145deg, #f3e5f5 0%, #e1bee7 100%)',
    border: '#ab47bc',
    shadow: 'rgba(171, 71, 188, 0.35)',
  },
};

export function nextColor(current: NoteColor, colors: readonly NoteColor[]): NoteColor {
  const index = colors.indexOf(current);
  return colors[(index + 1) % colors.length] ?? colors[0];
}
