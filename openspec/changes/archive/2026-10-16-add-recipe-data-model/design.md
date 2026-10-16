# Design

## Context

D1 is already bound as `DB` (`wrangler.jsonc`, `migrations_dir: migrations`) but `migrations/` is empty and no code uses it. The sample `Recipe` type in `app/lib/recipes.ts` is only an example of what the UI shows, not the final model. Requirements beyond it: the portion size can be changed and amounts recalculate; each step shows the ingredients (with quantities) it uses; a step may have an image.

## Goals / Non-Goals

**Goals:** a first migration with a model that supports scaling, step-ingredient links and optional step images; integrity enforced by the database.

**Non-Goals:** loading data from D1 in loaders, seeding the sample recipes, UI changes, the scaling UI, parsing quantity text into amount/unit, unit auto-correction (1/3 el → 1 tl), suggesting step-ingredient links from step text, image upload/storage, user accounts, tags/categories.

## Decisions

- **Quantity = value + unit, both optional, plus the typed text.** A user never has to pick a unit. A later item parses `quantity_text` into `amount`/`unit` (and may normalise them); until then both are NULL and the text is shown as-is. Scaling = `amount * wanted_servings / recipes.servings`. Rows with NULL `amount` are shown unscaled. `amount` is `REAL` (1/3 stored as 0.3333…; display rounding is a UI matter). `unit` is free `TEXT` with no CHECK, so units can be added or renamed without a migration. Alternatives: numerator/denominator columns — rejected, scaling needs a plain number anyway; a `units` table — rejected, premature.
- **Step ↔ ingredient links are stored, not derived.** Text matching is fragile (plurals, synonyms, "de uien"). Table `step_ingredients` links a step to the ingredients it uses. Optional `amount`/`unit` on the link state the part used in that step (200 g of the 250 g flour); both NULL means "the whole ingredient quantity". A composite foreign key (`step_id, recipe_id` and `ingredient_id, recipe_id`) guarantees a step only links ingredients of its own recipe.
- **Step image is optional**: `steps.image` (path, NULL = none) and `steps.image_alt`.
- **Three entity tables + one link table**, integer `id` keys, `ON DELETE CASCADE` from recipe to children and from step/ingredient to links. `recipes.slug` is unique and used for URLs. Alternative: JSON columns for ingredients/steps — rejected, links and scaling need rows.
- **Ordering** via `position` integer, unique per recipe.
- **Naming**: `by` → `author` (reserved-ish word), sample `q` → `quantity_text`, sample `item` → `name`.
- Foreign keys are enforced by D1 by default; no pragma needed. Migration file: `migrations/0001_recipes.sql`.

## Properties

All columns, `?` = nullable.

**recipes**

| column     | type       | notes                                    |
| ---------- | ---------- | ---------------------------------------- |
| id         | INTEGER PK |                                          |
| slug       | TEXT       | unique, not null, used in URL            |
| title      | TEXT       | not null                                 |
| author     | TEXT       | not null, free text ("Oma")              |
| time       | TEXT?      | free text ("1u 20")                      |
| servings   | INTEGER    | not null, > 0; base for scaling          |
| intro      | TEXT       | not null, default ''                     |
| image      | TEXT?      | path of main image                       |
| seal       | TEXT?      | seal id                                  |
| created_by | TEXT?      | email of the family member who added it  |
| created_at | TEXT       | not null, default current timestamp (UTC) |
| updated_at | TEXT       | not null, default current timestamp (UTC) |

**ingredients**

| column        | type       | notes                                       |
| ------------- | ---------- | ------------------------------------------- |
| id            | INTEGER PK |                                             |
| recipe_id     | INTEGER    | FK recipes, cascade; unique with id         |
| position      | INTEGER    | not null; unique per recipe                 |
| name          | TEXT       | not null ("zelfrijzend bloem")              |
| quantity_text | TEXT       | not null, default ''; as typed ("½ tl", "") |
| amount        | REAL?      | > 0; scalable value                         |
| unit          | TEXT?      | e.g. g, ml, el, tl; NULL = unitless/unknown |

**steps**

| column    | type       | notes                               |
| --------- | ---------- | ----------------------------------- |
| id        | INTEGER PK |                                     |
| recipe_id | INTEGER    | FK recipes, cascade; unique with id |
| position  | INTEGER    | not null; unique per recipe         |
| body      | TEXT       | not null                            |
| image     | TEXT?      | optional step image path            |
| image_alt | TEXT?      | alt text for it                     |

**step_ingredients**

| column        | type    | notes                                                |
| ------------- | ------- | ---------------------------------------------------- |
| step_id       | INTEGER | part of PK                                           |
| ingredient_id | INTEGER | part of PK                                           |
| recipe_id     | INTEGER | composite FKs to steps and ingredients, cascade      |
| amount        | REAL?   | > 0; part used in this step; NULL = whole ingredient |
| unit          | TEXT?   | with `amount`                                        |

## Risks / Trade-offs

- Free-text `time`/`author` cannot be sorted or filtered → fine for display; revisit if search is added.
- Until the parsing item lands, `amount` is NULL for all rows, so scaling cannot work yet → intended; the columns exist so no later schema change is needed.
- Editing the ingredient list can leave a step link pointing at a removed ingredient → cascade removes the link; the UI later warns.
- Empty DB after migrating → intended; the loaders switch over in a later change.
