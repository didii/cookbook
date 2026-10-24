-- A chip gets the same quantity columns as an ingredient: quantity_text, quantity_value, quantity_unit.
ALTER TABLE step_ingredient_chips ADD COLUMN quantity_value REAL CHECK (quantity_value > 0);
ALTER TABLE step_ingredient_chips ADD COLUMN quantity_unit TEXT;
