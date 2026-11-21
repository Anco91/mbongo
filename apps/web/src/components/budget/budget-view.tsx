/**
 * Budget View
 *
 * Client component for the 4-step budget preparation wizard.
 *
 * @module Components/Budget/BudgetView
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IncomesStep } from './steps/incomes-step';
import { ChargesStep } from './steps/charges-step';
import { AccountsStep } from './steps/accounts-step';
import { RecapStep } from './steps/recap-step';
import { usePrepareMonthlyBudget } from '@/hooks/use-monthly-budget';
import { useRouter } from 'next/navigation';
import { JSX } from 'react';

interface BudgetViewProps {
  month: string;
  monthLabel: string;
}

const STEPS = ['Revenus', 'Charges', 'Comptes', 'Récapitulatif'] as const;

export function BudgetView({
  month,
  monthLabel,
}: BudgetViewProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const prepareMutation = usePrepareMonthlyBudget();

  const handleNext = (): void => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async (): Promise<void> => {
    await prepareMutation.mutateAsync(month);
    router.push('/');
  };

  const renderStep = (): JSX.Element | null => {
    switch (currentStep) {
      case 0:
        return <IncomesStep month={month} />;
      case 1:
        return <ChargesStep month={month} />;
      case 2:
        return <AccountsStep />;
      case 3:
        return <RecapStep month={month} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Budget de {monthLabel}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Étape {currentStep + 1} sur {STEPS.length} : {STEPS[currentStep]}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((step, index) => (
          <div
            key={step}
            className={`flex-1 h-2 rounded-full ${
              index <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Retour
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext}>Continuer</Button>
        ) : (
          <Button
            onClick={() => {
              void handleFinish();
            }}
            disabled={prepareMutation.isPending}
          >
            {prepareMutation.isPending ? 'Terminaison...' : 'Terminer'}
          </Button>
        )}
      </div>
    </div>
  );
}
