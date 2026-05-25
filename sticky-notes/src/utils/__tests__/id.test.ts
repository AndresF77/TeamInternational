import { describe, expect, it } from 'vitest';
import { generateId } from '../id';

describe('generateId', () => {
  it('returns unique string ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });

  it('returns non-empty strings', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
