import { describe, expect, it } from 'vitest';
import { deserializeNotes, serializeNotes } from '../storage';

describe('storage serialization', () => {
  it('round-trips valid notes', () => {
    const notes = [
      {
        id: 'test-1',
        x: 10,
        y: 20,
        width: 200,
        height: 180,
        text: 'hello',
        color: 'yellow' as const,
        zIndex: 2,
      },
    ];

    const raw = serializeNotes(notes);
    expect(deserializeNotes(raw)).toEqual(notes);
  });

  it('returns null for invalid json', () => {
    expect(deserializeNotes('{bad')).toBeNull();
    expect(deserializeNotes('[]')).toEqual([]);
  });

  it('returns null for invalid shape', () => {
    expect(deserializeNotes('[{"id":1}]')).toBeNull();
  });
});
