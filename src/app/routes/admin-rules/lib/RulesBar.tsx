import { Button } from '~app/shared/components';

/** The bar fixed to the bottom of the rules page: "Standaardwaarden herstellen" as a link-style button on the left, "Opslaan" on the right. Both submit the form with their intent. */
export function RulesBar() {
  return (
    <div data-testid="RulesBar-bar" className="fixed inset-x-0 bottom-0 z-10 border-t-3 border-ink bg-por pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-[max(1rem,4vw)] py-2.5">
        <button
          type="submit"
          name="intent"
          value="reset"
          data-testid="RulesBar-reset"
          // The browser asks; declining stops the submit.
          onClick={(e) => {
            if (!confirm('Alle eigen woorden verwijderen en de standaardwaarden herstellen?')) e.preventDefault();
          }}
          className="min-h-11 cursor-pointer py-2 font-extrabold text-blu underline decoration-2 underline-offset-[3px] hover:text-red"
        >
          Standaardwaarden herstellen
        </button>
        <Button main type="submit" name="intent" value="save" data-testid="RulesBar-save" className="max-w-none min-w-32 flex-none px-5">
          Opslaan
        </Button>
      </div>
    </div>
  );
}
