/**
 * Charges View Component
 *
 * Client-side view component that displays charges and handles user interactions.
 *
 * @module Components/Charges/ChargesView
 */

'use client';

import {
  useCharges,
  useCreateCharge,
  useDeleteCharge,
} from './hooks/use-charges';
import { Charge } from '@mbongo/shared';
import Link from 'next/link';

/**
 * ChargesView Component
 *
 * Displays a list of charges with options to create, edit, and delete.
 * Uses React Query hooks for data fetching and mutations.
 *
 * @example
 * ```tsx
 * // Used inside ChargesGuard:
 * <ChargesView />
 * ```
 */
export function ChargesView() {
  // Fetch charges data
  const { data: charges = [], isLoading, error, refetch } = useCharges();

  // Create charge mutation
  const { mutate: createCharge, isPending: isCreating } = useCreateCharge();

  // Delete charge mutation
  const { mutate: deleteCharge, isPending: isDeleting } = useDeleteCharge();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner />
        <span className="ml-2">Loading charges...</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h3 className="font-semibold text-red-700 mb-2">
          Error loading charges
        </h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle empty state
  if (charges.length === 0) {
    return (
      <div className="p-8 text-center border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          No charges found
        </h3>
        <p className="text-gray-600 mb-6">
          Create your first charge to get started.
        </p>
        <CreateChargeButton onCreate={createCharge} disabled={isCreating} />
      </div>
    );
  }

  // Render charges list
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Charges</h1>
        <CreateChargeButton onCreate={createCharge} disabled={isCreating} />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {charges.map((charge) => (
              <ChargeRow
                key={charge.id}
                charge={charge}
                onDelete={() => deleteCharge(charge.id)}
                isDeleting={isDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Charge Row Component
 */
interface ChargeRowProps {
  charge: Charge;
  onDelete: () => void;
  isDeleting: boolean;
}

function ChargeRow({ charge, onDelete, isDeleting }: ChargeRowProps) {
  const isDeletingThis = isDeleting;

  return (
    <tr className={isDeletingThis ? 'opacity-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {charge.label}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          {charge.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatAmount(charge.amount, charge.currency)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {charge.currency}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(charge.startDate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-3">
          <Link
            href={`/charges/${charge.id}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            View
          </Link>
          <Link
            href={`/charges/${charge.id}/edit`}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </Link>
          <button
            onClick={onDelete}
            disabled={isDeletingThis}
            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeletingThis ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Create Charge Button Component
 */
interface CreateChargeButtonProps {
  onCreate: (data: unknown) => void;
  disabled: boolean;
}

function CreateChargeButton({ onCreate, disabled }: CreateChargeButtonProps) {
  return (
    <button
      onClick={() => {
        // In a real app, this would open a modal with a form
        onCreate({
          label: 'New Charge',
          type: 'ONE_OFF',
          amount: 0,
          currency: 'CHF',
          accountId: 'default-account-id',
          startDate: new Date().toISOString(),
        });
      }}
      disabled={disabled}
      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {disabled ? 'Creating...' : 'Create Charge'}
    </button>
  );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-indigo-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format amount with currency
 */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
