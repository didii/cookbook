import {
  AlarmClock,
  ArrowBigDown,
  ArrowBigUp,
  ArrowRight,
  Camera as LucideCamera,
  Check as LucideCheck,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronUp as LucideChevronUp,
  Heart as LucideHeart,
  Link as LucideLink,
  Lock as LucideLock,
  Menu as LucideMenu,
  Pin as LucidePin,
  Play as LucidePlay,
  Plus as LucidePlus,
  Search as LucideSearch,
  StickyNote as LucideStickyNote,
  Thermometer as LucideThermometer,
  SlidersHorizontal,
  Square,
  Timer,
  Trash2,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '~/shared/cn';

type Props = { className?: string };

/** One look for every icon: Lucide, at a default size that `className` can override. */
const icon =
  (Icon: LucideIcon, defaultClassName?: string) =>
  ({ className }: Props) => <Icon className={cn(defaultClassName, 'size-5 shrink-0', className)} />;

export const Play = icon(LucidePlay, 'fill-current');
export const Stop = icon(Square, 'fill-current');
export const Alarm = icon(AlarmClock);
export const Thermometer = icon(LucideThermometer);
export const Camera = icon(LucideCamera);
export const Trash = icon(Trash2);
export const ChevronBack = icon(LucideChevronLeft);
export const ChevronUp = icon(LucideChevronUp);
export const ChevronDown = icon(LucideChevronDown);
export const ArrowUp = icon(ArrowBigUp);
export const ArrowDown = icon(ArrowBigDown);
export const Cross = icon(X);
export const Check = icon(LucideCheck);
export const Plus = icon(LucidePlus);
export const Arrow = icon(ArrowRight);
export const Link = icon(LucideLink);
export const Menu = icon(LucideMenu);
export const Pin = icon(LucidePin);
export const Search = icon(LucideSearch);
export const Sliders = icon(SlidersHorizontal);
export const Clock = icon(Timer);
export const Ingredient = icon(Utensils);
export const Heart = icon(LucideHeart);
export const Lock = icon(LucideLock);
export const StickyNote = icon(LucideStickyNote);
