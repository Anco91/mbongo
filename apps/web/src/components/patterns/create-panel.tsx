/**
 * Create Panel — Disclosure + inline form panel.
 *
 * Owns the open/closed state. The form receives an onSaved callback
 * that automatically closes the panel.
 *
 * @module Components/Patterns/CreatePanel
 */

'use client';

import { JSX, ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreatePanelProps {
  title: string;
  addLabel: string;
  renderForm: (onSaved: () => void) => ReactNode;
}

/**
 * Disclosure panel for creating new items.
 *
 * - Shows "Add" button when closed
 * - Shows form in a Card when open
 * - onSaved callback closes the panel
 */
export function CreatePanel({
  title,
  addLabel,
  renderForm,
}: CreatePanelProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const handleSaved = (): void => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        {addLabel}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{renderForm(handleSaved)}</CardContent>
    </Card>
  );
}
