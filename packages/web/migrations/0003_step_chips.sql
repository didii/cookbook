-- A step's oven temperature and timer, and its free-text ingredient chips.
-- ADD COLUMN keeps every existing row, foreign key and UNIQUE (id, recipe_id) of steps as they are; the checks on the new columns may refer to each other.
ALTER TABLE steps ADD COLUMN oven_temperature INTEGER CHECK (oven_temperature > 0);
ALTER TABLE steps ADD COLUMN timer_minutes INTEGER CHECK (timer_minutes > 0);
ALTER TABLE steps ADD COLUMN timer_label TEXT CHECK (timer_label IS NULL OR timer_minutes IS NOT NULL);

CREATE TABLE step_ingredient_chips (
  step_id INTEGER NOT NULL REFERENCES steps (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  quantity_text TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL CHECK (name <> ''),
  PRIMARY KEY (step_id, position)
);
