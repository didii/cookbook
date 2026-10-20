import {
  AlarmClock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Camera as LucideCamera,
  Check as LucideCheck,
  Link as LucideLink,
  Pin as LucidePin,
  Play as LucidePlay,
  Plus as LucidePlus,
  Thermometer as LucideThermometer,
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
  (Icon: LucideIcon, size: string) =>
  ({ className }: Props) => <Icon className={cn(size, 'shrink-0', className)} />;

export const Play = icon(LucidePlay, 'size-4 fill-current');
export const Stop = icon(Square, 'size-4 fill-current');
export const Alarm = icon(AlarmClock, 'size-4');
export const Thermometer = icon(LucideThermometer, 'size-4');
export const Camera = icon(LucideCamera, 'size-5');
export const Trash = icon(Trash2, 'size-5');
export const Up = icon(ChevronUp, 'size-5');
export const Down = icon(ChevronDown, 'size-5');
export const Cross = icon(X, 'size-5');
export const Check = icon(LucideCheck, 'size-5');
export const Plus = icon(LucidePlus, 'size-5');
export const Arrow = icon(ArrowRight, 'size-5');
export const Link = icon(LucideLink, 'size-5');
export const Pin = icon(LucidePin, 'size-5');
export const Clock = icon(Timer, 'size-5');
export const Ingredient = icon(Utensils, 'size-5');
