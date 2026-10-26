-- A range ("2-3 el") stores its second number next to the first: quantity_value_max, only with a quantity_value.
ALTER TABLE ingredients ADD COLUMN quantity_value_max REAL CHECK (quantity_value_max IS NULL OR (quantity_value_max > 0 AND quantity_value IS NOT NULL));
ALTER TABLE step_ingredient_chips ADD COLUMN quantity_value_max REAL CHECK (quantity_value_max IS NULL OR (quantity_value_max > 0 AND quantity_value IS NOT NULL));

-- A step amount that is a range also stores where the second number sits. Rebuilt because ADD COLUMN cannot add the table-level checks.
CREATE TABLE step_quantities_new (
  step_id INTEGER NOT NULL REFERENCES steps (id) ON DELETE CASCADE,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  quantity_value REAL NOT NULL CHECK (quantity_value > 0),
  quantity_value_max REAL CHECK (quantity_value_max > 0),
  max_start_index INTEGER,
  max_end_index INTEGER,
  quantity_unit TEXT,
  PRIMARY KEY (step_id, start_index),
  CHECK (end_index > start_index),
  CHECK ((quantity_value_max IS NULL) = (max_start_index IS NULL) AND (quantity_value_max IS NULL) = (max_end_index IS NULL)),
  CHECK (max_start_index IS NULL OR (max_start_index >= end_index AND max_end_index > max_start_index))
);
INSERT INTO step_quantities_new (step_id, start_index, end_index, quantity_value, quantity_unit)
  SELECT step_id, start_index, end_index, quantity_value, quantity_unit FROM step_quantities;
DROP TABLE step_quantities;
ALTER TABLE step_quantities_new RENAME TO step_quantities;
