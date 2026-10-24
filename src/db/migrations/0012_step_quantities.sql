-- The amounts in a step's text that scale with the servings: where the number sits in steps.body (UTF-16 offsets, end exclusive), its value and the unit that followed it.
CREATE TABLE step_quantities (
  step_id INTEGER NOT NULL REFERENCES steps (id) ON DELETE CASCADE,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  quantity_value REAL NOT NULL CHECK (quantity_value > 0),
  quantity_unit TEXT,
  PRIMARY KEY (step_id, start_index),
  CHECK (end_index > start_index)
);
