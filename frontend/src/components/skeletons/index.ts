/**
 * Skeleton Components Index
 * Export all skeleton and loading components
 */

// Base skeleton components
export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  TableRowSkeleton,
  ChartSkeleton,
  AvatarSkeleton,
  TextSkeleton,
  ButtonSkeleton,
  ImageSkeleton,
  FormFieldSkeleton,
  NavSkeleton,
  StatsSkeleton,
  CalendarSkeleton
} from '../ui/Skeleton';

// Loading state components
export {
  Spinner,
  LoadingDots,
  LoadingBar,
  LoadingOverlay,
  InlineLoader,
  LoadingButton,
  LoadingCard,
  LoadingList,
  EmptyState,
  Shimmer
} from '../ui/LoadingState';

// Loading wrapper components
export {
  LoadingWrapper,
  DataTableWrapper,
  PageWrapper,
  FormWrapper,
  ListWrapper
} from '../ui/LoadingWrapper';

// Page-specific skeletons
export { DashboardSkeleton } from './DashboardSkeleton';
export { TaskListSkeleton, TaskDetailSkeleton } from './TaskListSkeleton';
export { SettingsSkeleton } from './SettingsSkeleton';
export { HealthDashboardSkeleton, HealthMetricSkeleton } from './HealthSkeleton';
export { FocusSessionSkeleton, FocusStatsSkeleton } from './FocusSkeleton';

// Loading state hooks
export {
  useLoadingState,
  useAsyncOperation,
  useMultipleLoadingStates,
  usePaginationLoading,
  useFormLoading,
  type LoadingState,
  type UseLoadingStateOptions
} from '../../hooks/useLoadingState';