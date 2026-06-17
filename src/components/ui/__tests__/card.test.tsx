import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';
import { describe, it, expect } from 'vitest';

describe('Card', () => {
    it('renders full card structure correctly', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Card Content</p>
                </CardContent>
                <CardFooter>
                    <button>Footer Button</button>
                </CardFooter>
            </Card>
        );

        expect(screen.getByText('Card Title')).toBeInTheDocument();
        expect(screen.getByText('Card Description')).toBeInTheDocument();
        expect(screen.getByText('Card Content')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /footer button/i })).toBeInTheDocument();
    });

    it('applies custom classes', () => {
        render(<Card className="my-custom-class">Test Card</Card>);
        // Note: the component is rendered as a div without aria-label, so we query by text
        const card = screen.getByText('Test Card');
        expect(card).toHaveClass('my-custom-class');
        expect(card).toHaveClass('rounded-2xl border bg-card text-card-foreground shadow-md');
    });
});
