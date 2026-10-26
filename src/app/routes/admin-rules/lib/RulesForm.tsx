import { useState, type ReactNode } from 'react';
import { Form } from 'react-router';
import type { RulesErrors, RulesRows } from '~app/shared/rules.server';
import { DurationCells } from './DurationCells';
import { ensureFree, isEmptyItem, type RuleItem } from './rows';
import { RuleList } from './RuleList';
import { RulesBar } from './RulesBar';

interface RulesFormProps {
  /** The rows to start with: the stored rules, or the rows of a refused save. Only read when the form is mounted; mount it again (change its key) to show other rows. */
  initial: RulesRows;
  /** Messages of a refused save, by list and row index. */
  errors?: RulesErrors;
}

const noErrors: RulesErrors = {};

// Ids of the rows added while typing; only ever compared with each other.
let added = 0;
const blank = (): RuleItem => ({ id: `new-${added++}`, text: '' });
const blankDuration = (): RuleItem => ({ ...blank(), minutes: '', fixed: false });

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-2xl font-black tracking-[-0.01em]">{title}</h2>
    {children}
  </section>
);
const Help = ({ children }: { children: ReactNode }) => <p className="mb-2 text-sm font-bold text-muted">{children}</p>;

/** The rules page's form: the lists of rows as state, and the rows as the one hidden field `rules`. A save is refused with messages on the rows, which stay as they were typed. */
export function RulesForm({ initial, errors = noErrors }: RulesFormProps) {
  const words = (list: string[], name: string) =>
    ensureFree(
      list.map((text, i) => ({ id: `${name}-${i}`, text })),
      blank,
    );
  const [units, setUnits] = useState(() => words(initial.units, 'units'));
  const [looseUnits, setLooseUnits] = useState(() => words(initial.looseUnits, 'loose'));
  const [degrees, setDegrees] = useState(() => words(initial.degreeWords, 'degrees'));
  const [durations, setDurations] = useState(() =>
    ensureFree(
      initial.durations.map((d, i) => ({ id: `duration-${i}`, text: d.word, minutes: d.minutes === null ? '' : String(d.minutes), fixed: d.fixed })),
      blankDuration,
    ),
  );

  // The free row at the end is not posted, so a row's index is the same here and on the server.
  const posted = <T extends RuleItem>(rows: T[]) => rows.slice(0, -1);
  const rules: RulesRows = {
    units: posted(units).map((r) => r.text),
    looseUnits: posted(looseUnits).map((r) => r.text),
    degreeWords: posted(degrees).map((r) => r.text),
    durations: posted(durations).map((r) => ({ word: r.text, minutes: r.minutes?.trim() ? Number(r.minutes) : null, fixed: !!r.fixed })),
  };

  // The units on the page as they are edited, that are not yet a loose unit.
  const loose = new Set(looseUnits.map((r) => r.text.trim().toLowerCase()));
  const suggestions = [...new Set(units.filter((r) => !isEmptyItem(r)).map((r) => r.text.trim()))].filter((w) => !loose.has(w.toLowerCase()));

  // After a refused save the first list with a message takes focus.
  const firstWithErrors = (['units', 'looseUnits', 'durations', 'degreeWords'] as const).find((list) => errors[list]?.rows);
  const listError = (list: keyof RulesRows) =>
    errors[list]?.list && (
      <p role="alert" data-testid="RulesForm-error" className="mt-1 mb-2 font-extrabold text-red">
        {errors[list].list}
      </p>
    );

  return (
    <Form method="post" noValidate data-testid="RulesForm-form" className="pb-24">
      <input type="hidden" name="rules" data-testid="RulesForm-rules" value={JSON.stringify(rules)} />
      <Section title="Eenheden">
        <div className="mt-3.5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div>
            <h3 id="units-heading" className="font-black">
              Eenheden
            </h3>
            <Help>
              Na een getal, zoals “250 <b>g</b>” of “2 <b>el</b>”.
            </Help>
            {listError('units')}
            <RuleList
              aria-labelledby="units-heading"
              rows={units}
              noun="Eenheid"
              blank={blank}
              errors={errors.units?.rows}
              focusError={firstWithErrors === 'units'}
              onChange={setUnits}
            />
          </div>
          <div>
            <h3 id="loose-units-heading" className="font-black">
              Losse eenheden
            </h3>
            <Help>
              Zonder getal; tellen als 1, zoals “een <b>snuf</b> zout”.
            </Help>
            {listError('looseUnits')}
            <RuleList
              aria-labelledby="loose-units-heading"
              rows={looseUnits}
              noun="Losse eenheid"
              blank={blank}
              suggestions={suggestions}
              errors={errors.looseUnits?.rows}
              focusError={firstWithErrors === 'looseUnits'}
              onChange={setLooseUnits}
            />
          </div>
        </div>
      </Section>
      <Section title="Duur">
        <p className="mt-0.5 text-[0.9375rem] font-bold text-muted">Het woord en de tijd in minuten.</p>
        <Help>
          Zonder vinkje wordt het getal ervoor vermenigvuldigd: “1,5 <b>uur</b>” is 1,5 × 60. Met <b>Vast</b> staat het woord op zichzelf en duurt het
          altijd even lang: “een <b>kwartier</b>” is 15.
        </Help>
        {listError('durations')}
        <RuleList
          aria-label="Duur"
          rows={durations}
          noun="Duur"
          blank={blankDuration}
          errors={errors.durations?.rows}
          focusError={firstWithErrors === 'durations'}
          extra={(row, label, change) => <DurationCells label={label} minutes={row.minutes ?? ''} fixed={!!row.fixed} onChange={change} />}
          onChange={setDurations}
        />
      </Section>
      <Section title="Graden">
        <div className="mt-3.5 sm:w-1/2">
          <Help>
            Na een oventemperatuur, zoals “180 <b>graden</b>” of “180 <b>°C</b>”.
          </Help>
          {listError('degreeWords')}
          <RuleList
            aria-label="Graden"
            rows={degrees}
            noun="Graadwoord"
            blank={blank}
            errors={errors.degreeWords?.rows}
            focusError={firstWithErrors === 'degreeWords'}
            onChange={setDegrees}
          />
        </div>
      </Section>
      <p className="mt-6 text-sm font-bold text-muted">
        <kbd>Enter</kbd> of <kbd>↓</kbd> volgende regel · <kbd>↑</kbd> vorige · <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> regel verplaatsen ·{' '}
        <kbd>Backspace</kbd> in een leeg veld verwijdert de regel
      </p>
      <RulesBar />
    </Form>
  );
}
