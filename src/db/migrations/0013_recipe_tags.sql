-- Categories become tags; tags have no stored order. "category" is kept free for a later group a tag can belong to.
ALTER TABLE categories RENAME TO tags;
ALTER TABLE recipe_categories RENAME TO recipe_tags;
ALTER TABLE recipe_tags RENAME COLUMN category_id TO tag_id;
ALTER TABLE recipe_tags DROP COLUMN position;
