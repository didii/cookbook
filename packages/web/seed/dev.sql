-- Dev-only sample data. Run: wrangler d1 execute DB --local --file seed/dev.sql (never against remote).
DELETE FROM recipes;

INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal) VALUES ('appeltaart', 'Appeltaart', 'Oma', '1u 20', 8, 'Met een dikke laag zure appels en een rooster van deeg bovenop.', '/img/appeltaart.jpg', 'jia-wei');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 1, 'zelfrijzend bloem', '250 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 2, 'koude boter', '150 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 3, 'basterdsuiker', '100 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 4, 'ei', '1');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 5, 'zout', '½ tl');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 6, 'zure appels', '1 kg');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 7, 'kaneel', '¾ tl');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 1, 'Kneed bloem, boter, suiker, ei en zout snel tot een deeg. Laat 30 minuten rusten in de koelkast.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 2, 'Verwarm de oven voor op 180 °C. Vet een springvorm in.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 3, 'Schil de appels, snijd ze in blokjes en meng ze met de kaneel.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 4, 'Bekleed de vorm met tweederde van het deeg. Verdeel de appels over de bodem.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 5, 'Snijd de rest van het deeg in repen en leg een rooster over de appels.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 6, 'Bak de taart 50 minuten tot ze goudbruin is. Laat afkoelen voor je aansnijdt.');

INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal) VALUES ('stoofvlees', 'Stoofvlees', 'Papa', '3u 00', 6, 'Langzaam gaar in donker bier, met een snee brood met mosterd erin.', '/img/stoofvlees.jpg', 'jia-chang-bian-fan');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 1, 'rundsstoofvlees', '1 kg');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 2, 'grote uien', '3');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 3, 'boter', '50 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 4, 'donker bier', '50 cl');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 5, 'peperkoek of brood', '2 sneden');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 6, 'mosterd', '2 el');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 7, 'laurierblaadjes', '2');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 1, 'Snijd de uien in halve ringen. Bak het vlees bruin in de boter en haal het uit de pan.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 2, 'Smoor de uien zacht in dezelfde pan.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 3, 'Doe het vlees terug en blus met het bier. Voeg de laurier toe.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 4, 'Smeer de mosterd op het brood en leg het bovenop het vlees.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'stoofvlees'), 5, 'Laat 2,5 uur zachtjes sudderen met het deksel half op de pan.');

INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal) VALUES ('pannenkoeken', 'Pannenkoeken', 'Tante An', '30 min', 4, 'Dun en groot, met stroop of spek.', '/img/pannenkoeken.jpg', 'kai-fan');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 1, 'bloem', '250 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 2, 'eieren', '2');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 3, 'melk', '5 dl');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 4, 'zout', '1 snuf');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 5, 'boter om te bakken', '');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 1, 'Klop bloem, eieren, melk en zout tot een gladde, dunne beslag.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 2, 'Laat de beslag 15 minuten rusten.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'pannenkoeken'), 3, 'Verhit een klein beetje boter in een koekenpan en bak de pannenkoeken goudbruin aan beide kanten.');

INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal) VALUES ('erwtensoep', 'Erwtensoep', 'Opa', '2u 30', 8, 'Zo dik dat de lepel rechtop blijft staan.', '/img/erwtensoep.jpg', 'hui-wei-wu-qiong');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 1, 'spliterwten', '500 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 2, 'water', '2 l');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 3, 'doorregen spek', '400 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 4, 'knolselderij', '1');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 5, 'preien', '2');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 6, 'rookworst', '1');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 1, 'Breng erwten, water en spek aan de kook en laat 1,5 uur zachtjes koken.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 2, 'Snijd de groenten klein en voeg ze toe. Kook nog 30 minuten.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'erwtensoep'), 3, 'Verwarm de rookworst de laatste 15 minuten mee. Snijd in plakken en roer door de soep.');

INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal) VALUES ('rijstpap', 'Rijstpap', 'Oma', '45 min', 4, 'Met bruine suiker en een klontje boter.', '/img/rijstpap.jpg', 'fu');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 1, 'volle melk', '1 l');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 2, 'puddingrijst', '100 g');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 3, 'zout', '1 snuf');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 4, 'bruine suiker', '');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 5, 'boter', '');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 1, 'Breng de melk met het zout aan de kook en strooi de rijst erin.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 2, 'Laat 35 minuten zachtjes pruttelen en roer regelmatig zodat niets aanbrandt.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'rijstpap'), 3, 'Schep in kommen en strooi bruine suiker en een klontje boter erop.');

INSERT INTO recipes (slug, title, author, time, servings, intro, image, seal) VALUES ('frikandellen', 'Frikandellen', 'Papa', '25 min', 4, 'Uit de frituur, met curry en uitjes.', '/img/frikandellen.jpg', 'suan-tian-ku-la');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'frikandellen'), 1, 'frikandellen', '4');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'frikandellen'), 2, 'ui', '1');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'frikandellen'), 3, 'curryketchup', '');
INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'frikandellen'), 4, 'mayonaise', '');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'frikandellen'), 1, 'Frituur de frikandellen 5 minuten tot ze bruin zijn.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'frikandellen'), 2, 'Snijd de ui fijn.');
INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'frikandellen'), 3, 'Snijd de frikandellen open en leg ze op een bord met saus en ui.');
