/**
 * Tests for EditableItem pattern
 *
 * Validates:
 * - Single root element (no fragment)
 * - Responsive layout (mobile/desktop)
 * - Local draft state management
 * - Amount validation
 *
 * @module Tests/Patterns/EditableItem
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EditableItem, parseAmount } from '@/components/patterns/editable-item';

describe('EditableItem', () => {
  const defaultProps = {
    label: 'Test Item',
    amount: 100,
    currency: 'CHF',
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without fragment (single root element)', () => {
      const { container } = render(<EditableItem {...defaultProps} />);

      // Should have a single root div with flex layout
      const rootDiv = container.firstElementChild;
      expect(rootDiv).not.toBeNull();
      expect(rootDiv?.tagName).toBe('DIV');
      expect(rootDiv?.className).toContain('flex');
    });

    it('renders label and amount', () => {
      render(<EditableItem {...defaultProps} />);

      expect(screen.getByText('Test Item')).toBeTruthy();
      expect(screen.getByText('100.00 CHF')).toBeTruthy();
    });

    it('renders meta instead of amount when provided', () => {
      render(<EditableItem {...defaultProps} meta="Custom meta" />);

      expect(screen.getByText('Custom meta')).toBeTruthy();
      expect(screen.queryByText('100.00 CHF')).toBeNull();
    });

    it('renders action button with custom label', () => {
      render(<EditableItem {...defaultProps} actionLabel="Ajuster" />);

      expect(screen.getByRole('button', { name: 'Ajuster' })).toBeTruthy();
    });

    it('renders additional actions when provided', () => {
      render(
        <EditableItem {...defaultProps} actions={<button>Delete</button>} />
      );

      expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    });
  });

  describe('responsive layout', () => {
    it('has responsive flex classes', () => {
      const { container } = render(<EditableItem {...defaultProps} />);

      const rootDiv = container.firstElementChild;
      expect(rootDiv?.className).toContain('flex-col');
      expect(rootDiv?.className).toContain('sm:flex-row');
    });

    it('has responsive width classes on actions container', () => {
      const { container } = render(<EditableItem {...defaultProps} />);

      // Find the actions container (second child of root)
      const rootDiv = container.firstElementChild;
      const actionsContainer = rootDiv?.children[1];
      expect(actionsContainer?.className).toContain('w-full');
      expect(actionsContainer?.className).toContain('sm:w-auto');
    });
  });

  describe('draft state management', () => {
    it('initializes with empty draft', () => {
      render(<EditableItem {...defaultProps} />);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('updates draft on input change', () => {
      render(<EditableItem {...defaultProps} />);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '150.50' } });

      expect(input.value).toBe('150.50');
    });

    it('resets draft after confirm', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(<EditableItem {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '150.50' } });

      const button = screen.getByRole('button', { name: 'Confirmer' });
      fireEvent.click(button);

      // Wait for async confirm
      await screen.findByRole('spinbutton');

      expect(input.value).toBe(''); // Draft reset
    });
  });

  describe('amount validation', () => {
    it('enables button when draft is valid', () => {
      render(<EditableItem {...defaultProps} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '150.50' } });

      const button = screen.getByRole('button', { name: 'Confirmer' });
      expect(button.getAttribute('disabled')).toBeNull();
    });

    it('disables button when pending', () => {
      render(<EditableItem {...defaultProps} isPending={true} />);

      const button = screen.getByRole('button', { name: 'Confirmer' });
      expect(button.getAttribute('disabled')).not.toBeNull();
    });

    it('calls onConfirm with effective amount', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(<EditableItem {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '150.50' } });

      const button = screen.getByRole('button', { name: 'Confirmer' });
      fireEvent.click(button);

      expect(onConfirm).toHaveBeenCalledWith(150.5);
    });

    it('calls onConfirm with original amount when draft is empty', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(<EditableItem {...defaultProps} onConfirm={onConfirm} />);

      const button = screen.getByRole('button', { name: 'Confirmer' });
      fireEvent.click(button);

      expect(onConfirm).toHaveBeenCalledWith(100);
    });
  });
});

describe('parseAmount', () => {
  it('parses valid numbers', () => {
    expect(parseAmount('123.45')).toBe(123.45);
    expect(parseAmount('0')).toBe(0);
    expect(parseAmount('-50.25')).toBe(-50.25);
  });

  it('returns null for empty strings', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(parseAmount('abc')).toBeNull();
    // parseFloat parses until first non-numeric character
    expect(parseAmount('12abc')).toBe(12);
  });

  it('trims whitespace', () => {
    expect(parseAmount('  123.45  ')).toBe(123.45);
  });
});
