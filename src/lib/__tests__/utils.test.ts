import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (classNames)', () => {
    it('merges multiple class names', () => {
        const result = cn('base-class', 'added-class');
        expect(result).toBe('base-class added-class');
    });

    it('handles conditional classes properly', () => {
        const result = cn('base-class', condition ? 'true-class' : 'false-class');
        expect(result).toBe('base-class true-class');
    });

    it('resolves Tailwind conflicts using tailwind-merge', () => {
        const result = cn('p-2 p-4', 'bg-red-500 bg-blue-500');
        expect(result).toBe('p-4 bg-blue-500');
    });
});

const condition = true;
