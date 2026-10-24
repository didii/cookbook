-- The three quantity columns of an ingredient read as one group: quantity_text, quantity_value, quantity_unit.
ALTER TABLE ingredients RENAME COLUMN amount TO quantity_value;
ALTER TABLE ingredients RENAME COLUMN unit TO quantity_unit;
