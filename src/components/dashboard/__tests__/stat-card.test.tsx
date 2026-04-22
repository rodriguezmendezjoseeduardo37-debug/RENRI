import { render, screen } from '@testing-library/react';
import { StatCard } from '../stat-card';
import { describe, it, expect } from 'vitest';

describe('StatCard', () => {
    it('renders label and value correctly', () => {
        render(<StatCard label="Total Sales" value="$1000" />);
        expect(screen.getByText('Total Sales')).toBeInTheDocument();
        expect(screen.getByText('$1000')).toBeInTheDocument();
    });

    it('renders sublabel when provided', () => {
        render(<StatCard label="Appointments" value="15" sublabel="+2 from last week" />);
        expect(screen.getByText('+2 from last week')).toBeInTheDocument();
    });

    it('does not render sublabel when not provided', () => {
        const { container } = render(<StatCard label="Orders" value="5" />);
        // Ensure there's only 2 text elements (label + value)
        expect(container.querySelectorAll('span')).toHaveLength(2);
    });
});
