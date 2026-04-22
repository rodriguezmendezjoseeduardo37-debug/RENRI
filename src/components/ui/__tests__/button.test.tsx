import { render, screen } from '@testing-library/react';
import { Button } from '../button';
import { describe, it, expect } from 'vitest';

describe('Button', () => {
    it('renders correctly with default variant and size', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-primary text-primary-foreground h-9'); // just an example of expected classes
    });

    it('renders destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button', { name: /delete/i });
        expect(button).toHaveClass('bg-destructive text-destructive-foreground');
    });

    it('can be disabled', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByRole('button', { name: /disabled/i });
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled:opacity-50');
    });

    it('supports asChild rendering', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        );
        const link = screen.getByRole('link', { name: /link button/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/test');
    });
});
