import { render } from '@testing-library/react';
import { CardSkeleton, ListSkeleton, TableSkeleton, DashboardSkeleton } from '../../components/LoadingSkeletons';

describe('Loading Skeletons', () => {
  describe('CardSkeleton', () => {
    it('renders default number of skeleton cards', () => {
      const { container } = render(<CardSkeleton />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('renders specified number of skeleton cards', () => {
      const { container } = render(<CardSkeleton count={5} />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(5);
    });

    it('applies custom className', () => {
      const { container } = render(<CardSkeleton className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('ListSkeleton', () => {
    it('renders default number of skeleton list items', () => {
      const { container } = render(<ListSkeleton />);
      const items = container.querySelectorAll('.animate-pulse');
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders specified number of skeleton list items', () => {
      const { container } = render(<ListSkeleton count={3} />);
      const items = container.querySelectorAll('.animate-pulse');
      expect(items.length).toBe(3);
    });
  });

  describe('TableSkeleton', () => {
    it('renders skeleton table structure', () => {
      const { container } = render(<TableSkeleton />);
      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('renders specified number of rows', () => {
      const { container } = render(<TableSkeleton rows={5} />);
      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows?.length).toBe(5);
    });
  });

  describe('DashboardSkeleton', () => {
    it('renders dashboard skeleton structure', () => {
      const { container } = render(<DashboardSkeleton />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });
});
