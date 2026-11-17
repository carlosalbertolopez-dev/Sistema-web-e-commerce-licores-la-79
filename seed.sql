-- Productos del index.html (el precio real SIEMPRE se lee de aquí, nunca del navegador)
INSERT INTO productos (sku,nombre,categoria,precio_cop,imagen,stock) VALUES
('whisky-buchanan-s-12-anos-750ml','Whisky Buchanan''s 12 Años 750ml','Whisky',159000,'images/buchanan''s-12-Años-750ml.jpg',50),
('aguardiente-blanco-del-valle-fiesta-1750ml','Aguardiente Blanco Del Valle Fiesta 1750ml','Aguardiente',105000,'images/aguardiente-Blanco-Del-Valle-1750ml.jpg',50),
('aguardiente-blanco-fiesta-750ml','Aguardiente Blanco Fiesta 750ml','Aguardiente',49000,'images/aguardiente-Blanco-Del-Valle-fiesta750ml.jpg',50),
('whisky-chivas-12-anos-1000ml','Whisky Chivas 12 Años 1000ml','Whisky',171500,'images/whisky-Chivas-12-Años-1000ml.jpg',50),
('whisky-buchanan-s-master-750ml','Whisky Buchanan''s Master 750ml','Whisky',185000,'images/whisky-Buchanan''s-Master-750ml.jpg',50),
('tequila-corralejo-anejo-750ml','Tequila Corralejo Añejo 750ml','Tequila',351000,'images/tequila-Corralejo-Añejo-750ml.jpg',50),
('tequila-corralejo-reposado-750ml','Tequila Corralejo Reposado 750ml','Tequila',280000,'images/tequila-Corralejo-Reposado-750ml.jpg',50),
('aguardiente-amarillo-sin-azucar-750ml','Aguardiente Amarillo Sin Azúcar 750ml','Aguardiente',52000,'images/aguardiente-Amarrillo-Sin-Azucar-750ml.jpg',50)
ON CONFLICT (sku) DO UPDATE SET nombre=EXCLUDED.nombre, precio_cop=EXCLUDED.precio_cop;
