-- Where a recipe came from: a name or a link, at most 500 characters.
ALTER TABLE recipes ADD COLUMN source TEXT CHECK (source IS NULL OR length(source) <= 500);
