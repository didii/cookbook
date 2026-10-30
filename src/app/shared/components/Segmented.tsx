import { useId, type ComponentProps } from 'react';
import { cn } from '../cn';
import { control } from '../control';

type TestId = { 'data-testid'?: string };

interface SegmentedProps<V extends string> extends Omit<ComponentProps<'fieldset'>, 'onChange' | 'value'> {
  legend: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  /** Test ids (or other props) for the radio inputs and their labels. */
  inputProps?: ComponentProps<'input'> & TestId;
  labelProps?: ComponentProps<'label'> & TestId;
}

/** Joined radio buttons with a black border; the checked one is red. The inputs are visually hidden, the labels are the buttons. */
export function Segmented<V extends string>({ legend, options, value, onChange, inputProps, labelProps, className, ...props }: SegmentedProps<V>) {
  const id = useId();
  return (
    <fieldset {...props} className={cn('m-0 min-w-0 border-0 p-0', className)}>
      <legend className="mb-2 p-0 font-black md:float-left md:mb-0">{legend}</legend>
      <div className="inline-flex">
        {options.map((option, i) => (
          <span key={option.value} className="flex">
            <input
              {...inputProps}
              type="radio"
              name={id}
              id={`${id}-${option.value}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <label
              {...labelProps}
              htmlFor={`${id}-${option.value}`}
              className={cn(
                control,
                'relative bg-white not-peer-checked:hover:bg-hover peer-checked:bg-red peer-checked:text-white peer-checked:hover:brightness-95 peer-focus-visible:outline-4 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-blu',
                i > 0 && 'ml-[-3px] rounded-l-none',
                i < options.length - 1 && 'rounded-r-none',
              )}
            >
              {option.label}
            </label>
          </span>
        ))}
      </div>
    </fieldset>
  );
}
