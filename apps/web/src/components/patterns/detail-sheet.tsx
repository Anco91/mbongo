/**
 * Detail Sheet — bottom-sheet detail view pattern for small screens.
 * Any tappable list element opens its details in a bottom sheet.
 *
 * @module Components/Patterns/DetailSheet
 */

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { JSX } from 'react';

interface DetailSheetProps {
  title: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export function DetailSheet({
  title,
  trigger,
  children,
}: DetailSheetProps): JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className="block w-full text-left">
          {trigger}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[72vh] overflow-y-auto rounded-t-3xl bg-white text-slate-900 shadow-2xl"
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-200" />
        <SheetHeader>
          <SheetTitle className="text-base">{title}</SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-8 pt-3">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
