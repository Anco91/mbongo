/**
 * Cross-cutting patterns barrel — components shared by several feature
 * views, still free of domain-specific business rules where possible.
 *
 * @module Components/Patterns
 */

export { AppShell } from '@/components/patterns/app-shell';
export { AppHeader } from '@/components/patterns/app-header';
export { TabNav } from '@/components/patterns/tab-nav';
export { MonthCursor } from '@/components/patterns/month-cursor';
export { SwipeZone } from '@/components/patterns/swipe-zone';
export { DetailSheet } from '@/components/patterns/detail-sheet';
export { DetailRow } from '@/components/patterns/detail-row';
export { ShowMoreList } from '@/components/patterns/show-more-list';
export {
  LoadingState,
  ErrorPanel,
  EmptyState,
} from '@/components/patterns/async-state';
export { RouteError } from '@/components/patterns/route-error';
export { InlineError } from '@/components/patterns/inline-error';
export {
  FilterChips,
  type FilterChipItem,
} from '@/components/patterns/filter-chips';
export { MemberFilterChips } from '@/components/patterns/member-filter-chips';
export { SectionTitle } from '@/components/patterns/section-title';
export { ExpandButton } from '@/components/patterns/expand-button';
export { DeleteButton } from '@/components/patterns/delete-button';
export { OwnerBadge, ownerLabel } from '@/components/patterns/owner-badge';
export { ItemList } from '@/components/patterns/item-list';
export { EditableItem, parseAmount } from '@/components/patterns/editable-item';
export { CreatePanel } from '@/components/patterns/create-panel';
