/**
 * Responsive Grid - Layout adaptable a mobile/tablet/desktop
 * 
 * Uso:
 * <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
 *   {items.map(item => <Card key={item.id}>{item}</Card>)}
 * </ResponsiveGrid>
 */

import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;    // < 640px
    tablet?: number;    // 640px - 1023px
    desktop?: number;   // >= 1024px
  };
  gap?: 'sm' | 'md' | 'lg'; // 8px, 16px, 24px
  className?: string;
}

const gapValues = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}) => {
  const gridClasses = [
    'grid',
    gapValues[gap],
    // Mobile (default)
    cols.mobile ? colClasses[cols.mobile as keyof typeof colClasses] : 'grid-cols-1',
    // Tablet
    cols.tablet ? `sm:${colClasses[cols.tablet as keyof typeof colClasses]}` : '',
    // Desktop
    cols.desktop ? `lg:${colClasses[cols.desktop as keyof typeof colClasses]}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={gridClasses}>{children}</div>;
};

/**
 * Contenedor con padding responsive
 */
interface ResponsivePaddingProps {
  children: React.ReactNode;
  padding?: {
    mobile?: string;   // Tailwind padding class
    tablet?: string;
    desktop?: string;
  };
  className?: string;
}

export const ResponsivePadding: React.FC<ResponsivePaddingProps> = ({
  children,
  padding = {
    mobile: 'p-4',     // 16px
    tablet: 'sm:p-6',  // 24px
    desktop: 'lg:p-8', // 32px
  },
  className = '',
}) => {
  const paddingClasses = [padding.mobile, padding.tablet, padding.desktop, className]
    .filter(Boolean)
    .join(' ');

  return <div className={paddingClasses}>{children}</div>;
};

/**
 * Container con width máximo responsive
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',     // 384px
  md: 'max-w-md',     // 448px
  lg: 'max-w-lg',     // 512px
  xl: 'max-w-xl',     // 576px
  full: 'w-full',
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  className = '',
}) => (
  <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${className}`}>
    {children}
  </div>
);

/**
 * Stack vertical responsivo
 */
interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: {
    mobile?: 'vertical' | 'horizontal';
    tablet?: 'vertical' | 'horizontal';
    desktop?: 'vertical' | 'horizontal';
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const directionClasses = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
};

const gapClasses = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { mobile: 'vertical', tablet: 'horizontal', desktop: 'horizontal' },
  gap = 'md',
  className = '',
}) => {
  const stackClasses = [
    'flex',
    gapClasses[gap],
    direction.mobile ? directionClasses[direction.mobile] : 'flex-col',
    direction.tablet
      ? `sm:${directionClasses[direction.tablet]}`
      : '',
    direction.desktop ? `lg:${directionClasses[direction.desktop]}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={stackClasses}>{children}</div>;
};
