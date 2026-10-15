-- ============================================================================
-- Seed NOMAHOME / Casa Lumen — 12 piezas del catálogo.
-- Los dibujos son SVG propios del repo (public/brand/seed), generados con
-- scripts/generate-seed-svg.mjs. Sin fotos de stock. Sin reseñas inventadas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categorías — árbol de un nivel en v1
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, description, sort_order) values
  ('muebles', 'Muebles', 'Madera, acero y tela con oficio de taller.', 0),
  ('iluminacion', 'Iluminación', 'Luz cálida para leer, cenar y quedarse un rato más.', 1),
  ('tecnologia-del-hogar', 'Tecnología del hogar', 'Tecnología que se porta bien y no clama atención.', 2),
  ('textiles', 'Textiles', 'Tapicería y tejidos de asiento hechos pieza por pieza.', 3);

-- ---------------------------------------------------------------------------
-- Colores de catálogo (paleta del sistema)
-- ---------------------------------------------------------------------------
insert into public.colors (name, hex) values
  ('Arena', '#D8CFC2'),
  ('Tinta', '#1C1712'),
  ('Pino', '#243F34'),
  ('Roble', '#A98D6B'),
  ('Nogal', '#5B4432'),
  ('Grafito', '#3A3733'),
  ('Haya', '#C9A887'),
  ('Arcilla', '#9C4630'),
  ('Hueso', '#EDE6D8'),
  ('Latón', '#C4A27A');

-- ---------------------------------------------------------------------------
-- Piezas, variantes, media y pestañas
-- ---------------------------------------------------------------------------
do $$
declare
  v_cat_muebles uuid;
  v_cat_ilum uuid;
  v_cat_tec uuid;
  v_cat_textiles uuid;
  v_arena uuid; v_tinta uuid; v_pino uuid; v_roble uuid; v_nogal uuid;
  v_grafito uuid; v_haya uuid; v_arcilla uuid; v_hueso uuid; v_laton uuid;
  v_product uuid;
  v_variant uuid;
begin
  select id into v_cat_muebles from public.categories where slug = 'muebles';
  select id into v_cat_ilum from public.categories where slug = 'iluminacion';
  select id into v_cat_tec from public.categories where slug = 'tecnologia-del-hogar';
  select id into v_cat_textiles from public.categories where slug = 'textiles';

  select id into v_arena from public.colors where name = 'Arena';
  select id into v_tinta from public.colors where name = 'Tinta';
  select id into v_pino from public.colors where name = 'Pino';
  select id into v_roble from public.colors where name = 'Roble';
  select id into v_nogal from public.colors where name = 'Nogal';
  select id into v_grafito from public.colors where name = 'Grafito';
  select id into v_haya from public.colors where name = 'Haya';
  select id into v_arcilla from public.colors where name = 'Arcilla';
  select id into v_hueso from public.colors where name = 'Hueso';
  select id into v_laton from public.colors where name = 'Latón';

  -- =======================================================================
  -- 1. Sofá Norte 220 — tres plazas, tres colores
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'sofa-norte-220', 'CL-SOF-220', 'Sofá Norte 220',
    'Tres plazas de asiento profundo para la siesta de las cinco.',
    'Un sofá que aguanta la lámpara y la conversación. Estructura de parota seca, resortes atados a mano y tela bouclé que se ve mejor cada año. 220 cm de largo, pensado para salas de casa de verdad, no de revista.',
    true,
    'Sofá Norte 220 — NOMAHOME',
    'Sofá de tres plazas hecho en Morelia: parota seca, resortes atados a mano y tela bouclé. 220 × 92 × 78 cm. Tres colores de taller.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id)
  values (v_product, v_cat_muebles), (v_product, v_cat_textiles);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, compare_at_cents, stock, published)
  values (v_product, 'CL-SOF-220-ARN', v_arena, 'Tela bouclé de lino y pata de parota', 220, 92, 78, 38.0, 2290000, 2590000, 4, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/sofa-norte-220-arena.svg', 'Sofá Norte 220 en tela arena sobre fondo papel', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-SOF-220-TIN', v_tinta, 'Tela bouclé de lino y pata de parota', 220, 92, 78, 38.0, 2290000, 3, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/sofa-norte-220-tinta.svg', 'Sofá Norte 220 en tela tinta sobre fondo papel', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-SOF-220-PIN', v_pino, 'Tela bouclé de lino y pata de parota', 220, 92, 78, 38.0, 2290000, 2, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/sofa-norte-220-pino.svg', 'Sofá Norte 220 en tela pino sobre fondo papel', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Materiales y medidas', 'Estructura de parota seca, resortes atados a mano, tela bouclé de lino con tratamiento antimancha. 220 × 92 × 78 cm, 38 kg. Fundas de asiento removibles para lavar en seco.', 0),
    (v_product, 'Taller y envío', 'Se fabrica por pedido en el taller de Morelia. Tres semanas de mano de obra. Entrega e instalación sin costo dentro de Michoacán; al resto de la república va asegurada y con fieltros puestos.', 1);

  -- =======================================================================
  -- 2. Mesa de roble Lerma
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'mesa-de-roble-lerma', 'CL-MES-140', 'Mesa de roble Lerma',
    'Para cenas largas que terminan con el postre afuera.',
    'Roble macizo de 4 cm con acabado de cera natural que se retoca en casa. La veta va de punta a punta, sin empalmes. Patas en escuadra, sin herrajes visibles.',
    true,
    'Mesa de roble Lerma — NOMAHOME',
    'Mesa de comedor en roble macizo de 4 cm, acabado de cera natural. 140 × 90 × 75 cm. Tres acabados de taller.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_muebles);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-MES-140-ROB', v_roble, 'Roble macizo con cera natural', 140, 90, 75, 32.0, 1450000, 6, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/mesa-de-roble-lerma-roble.svg', 'Mesa de roble Lerma en acabado roble natural', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-MES-140-NOG', v_nogal, 'Roble macizo teñido nogal', 140, 90, 75, 32.0, 1490000, 3, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/mesa-de-roble-lerma-nogal.svg', 'Mesa de roble Lerma en acabado nogal', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-MES-140-GRA', v_grafito, 'Roble macizo teñido grafito', 140, 90, 75, 32.0, 1490000, 2, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/mesa-de-roble-lerma-grafito.svg', 'Mesa de roble Lerma en acabado grafito', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Materiales y medidas', 'Roble macizo de 4 cm, cera natural. 140 × 90 × 75 cm, 32 kg. Acepta cera nueva cada año sin lijar.', 0),
    (v_product, 'Taller y envío', 'Pieza de taller, dos semanas. Se entrega con fieltros puestos y una lata de cera de retoque. Envío nacional asegurado contra daños de transporte.', 1);

  -- =======================================================================
  -- 3. Silla de comedor Quiroga
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'silla-de-comedor-quiroga', 'CL-SIL-090', 'Silla de comedor Quiroga',
    'La silla que no suena: madera vaporizada y asiento tejido.',
    'Respaldo de haya vaporizada que cede un poco, justo para la sobremesa. Asiento de tule tejido a mano que se cambia cuando se gasta, sin desarmar la silla.',
    true,
    'Silla de comedor Quiroga — NOMAHOME',
    'Silla de comedor de haya vaporizada con asiento de tule tejido a mano. 46 × 52 × 84 cm. Tres acabados.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_muebles);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-SIL-090-HAY', v_haya, 'Haya vaporizada y tule tejido', 46, 52, 84, 6.5, 389000, 14, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/silla-de-comedor-quiroga-haya.svg', 'Silla de comedor Quiroga en haya natural', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-SIL-090-TIN', v_tinta, 'Haya teñida tinta y tule tejido', 46, 52, 84, 6.5, 389000, 9, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/silla-de-comedor-quiroga-tinta.svg', 'Silla de comedor Quiroga en tinta', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-SIL-090-ARC', v_arcilla, 'Haya teñida arcilla y tule tejido', 46, 52, 84, 6.5, 409000, 5, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/silla-de-comedor-quiroga-arcilla.svg', 'Silla de comedor Quiroga en arcilla', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Materiales y medidas', 'Haya vaporizada, asiento de tule tejido a mano. 46 × 52 × 84 cm, 6.5 kg. Apila en pares para guardar.', 0),
    (v_product, 'Taller y envío', 'Se teje por pieza en Quiroga. Diez días. En juegos de cuatro o más aplicamos precio de taller: escríbenos por WhatsApp.', 1);

  -- =======================================================================
  -- 4. Buró de noche Tzintzuntzan
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'buro-de-noche-tzintzuntzan', 'CL-BUR-070', 'Buró de noche Tzintzuntzan',
    'Dos cajones suaves y una superficie para el libro y el agua.',
    'Roble macizo con cajones a espiga y herraje de latón. Las patas se abren un poco: es la silueta purépecha que da nombre al buró.',
    true,
    'Buró de noche Tzintzuntzan — NOMAHOME',
    'Buró de roble macizo con cajones a espiga y herraje de latón. 45 × 38 × 62 cm. Hecho en Morelia.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_muebles);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-BUR-070-ROB', v_roble, 'Roble macizo y herraje de latón', 45, 38, 62, 9.0, 469000, 8, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/buro-de-noche-tzintzuntzan-roble.svg', 'Buró de noche Tzintzuntzan en roble natural', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Materiales y medidas', 'Roble macizo, cajones a espiga, guías de latón. 45 × 38 × 62 cm, 9 kg. Los cajones cierran con la mano, no con pistón.', 0),
    (v_product, 'Taller y envío', 'Pieza de taller, una semana. Se entrega ensamblada y con cera aplicada.', 1);

  -- =======================================================================
  -- 5. Estante de acero Morelia
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'estante-de-acero-morelia', 'CL-EST-180', 'Estante de acero Morelia',
    'Cinco niveles de acero pintado al horno. Libros, plantas, bocina.',
    'Estructura de acero de 2 mm pintada electrostáticamente. Repisas que aguantan 40 kg cada una sin flexionarse. Se atornilla a la pared con kit incluido.',
    true,
    'Estante de acero Morelia — NOMAHOME',
    'Estante de acero de 2 mm pintado al horno. 180 × 34 × 210 cm, 40 kg por nivel. Tres colores.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_muebles);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-EST-180-GRA', v_grafito, 'Acero pintado electrostático', 180, 34, 210, 41.0, 798000, 5, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/estante-de-acero-morelia-grafito.svg', 'Estante de acero Morelia en grafito', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-EST-180-HUE', v_hueso, 'Acero pintado electrostático', 180, 34, 210, 41.0, 798000, 3, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/estante-de-acero-morelia-hueso.svg', 'Estante de acero Morelia en hueso', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-EST-180-PIN', v_pino, 'Acero pintado electrostático', 180, 34, 210, 41.0, 818000, 2, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/estante-de-acero-morelia-pino.svg', 'Estante de acero Morelia en pino', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Materiales y medidas', 'Acero de 2 mm pintado electrostático al horno. 180 × 34 × 210 cm, 41 kg. 40 kg de carga por nivel.', 0),
    (v_product, 'Taller y envío', 'Se corta y pinta en taller. Una semana. Incluye kit de fijación a muro: el estante se ancla, no se recarga.', 1);

  -- =======================================================================
  -- 6. Lámpara de mesa Pátzcuaro
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'lampara-de-mesa-patzcuaro', 'CL-LMT-045', 'Lámpara de mesa Pátzcuaro',
    'Luz cálida de 2700 K con pantalla de lino crudo.',
    'Base de latón cepillado y pantalla de lino que deja pasar la luz pareja. El interruptor va en el cable, no en la base: se apaga sin agacharse.',
    true,
    'Lámpara de mesa Pátzcuaro — NOMAHOME',
    'Lámpara de mesa de latón cepillado y pantalla de lino. 45 × 45 × 58 cm. Luz cálida 2700 K. Tres acabados.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_ilum);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-LMT-045-LAT', v_laton, 'Latón cepillado y pantalla de lino crudo', 45, 45, 58, 3.2, 329000, 11, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/lampara-de-mesa-patzcuaro-laton.svg', 'Lámpara de mesa Pátzcuaro en latón', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-LMT-045-TIN', v_tinta, 'Acero tinta y pantalla de lino crudo', 45, 45, 58, 3.2, 329000, 7, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/lampara-de-mesa-patzcuaro-tinta.svg', 'Lámpara de mesa Pátzcuaro en tinta', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-LMT-045-HUE', v_hueso, 'Cerámica hueso y pantalla de lino crudo', 45, 45, 58, 3.2, 349000, 4, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/lampara-de-mesa-patzcuaro-hueso.svg', 'Lámpara de mesa Pátzcuaro en hueso', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Materiales y medidas', 'Latón cepillado, pantalla de lino crudo. 45 × 45 × 58 cm, 3.2 kg. Foco E12 LED de 2700 K incluido.', 0),
    (v_product, 'Taller y envío', 'Se ensambla en taller y hay existencia de latón. Las pantallas de repuesto se piden por encargo, tardan una semana.', 1);

  -- =======================================================================
  -- 7. Lámpara de pie Mil Cumbres
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'lampara-de-pie-mil-cumbres', 'CL-LMP-052', 'Lámpara de pie Mil Cumbres',
    'Arco de latón que deja la luz sobre la butaca, no encima.',
    'Arco de latón de 168 cm con pantalla de lino crudo. La base pesada no baila: 7 kg que se quedan donde los pones.',
    true,
    'Lámpara de pie Mil Cumbres — NOMAHOME',
    'Lámpara de pie en arco de latón cepillado, 168 cm, pantalla de lino crudo. Luz cálida para el rincón de lectura.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_ilum);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-LMP-052-LAT', v_laton, 'Latón cepillado y pantalla de lino', 38, 38, 168, 7.4, 548000, 6, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/lampara-de-pie-mil-cumbres-laton.svg', 'Lámpara de pie Mil Cumbres en latón', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Materiales y medidas', 'Latón cepillado, pantalla de lino crudo. 38 × 38 × 168 cm, 7.4 kg. Focos E26 incluidos.', 0),
    (v_product, 'Taller y envío', 'Se dobla y suelda a mano. Dos semanas. La base va con fieltro para pisos de madera.', 1);

  -- =======================================================================
  -- 8. Barra de sonido para mueble bajo
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'barra-de-sonido-para-mueble-bajo', 'CL-BDS-310', 'Barra de sonido para mueble bajo',
    'Cine en casa que no quieres ver: se esconde bajo el televisor.',
    'Canal virtual 3.1 con subwoofer integrado y gabinete de madera. Enchufe y HDMI eARC. Sin app, sin cuenta, sin ambientador digital.',
    true,
    'Barra de sonido para mueble bajo — NOMAHOME',
    'Barra de sonido 3.1 de 100 cm con subwoofer integrado, HDMI eARC y Bluetooth. Gabinete de madera del taller.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_tec);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-BDS-310-GRA', v_grafito, 'Gabinete de madera y tela acústica', 100, 8, 6, 3.1, 690000, 9, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/barra-de-sonido-para-mueble-bajo-grafito.svg', 'Barra de sonido sobre mueble bajo, acabado grafito', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Especificaciones', 'Canal virtual 3.1, subwoofer integrado, 140 W. HDMI eARC, entrada óptica y Bluetooth 5.3. 100 × 8 × 6 cm, 3.1 kg.', 0),
    (v_product, 'Taller y garantía', 'El gabinete es madera del taller con tela acústica atornillada. Garantía de dos años: si se moja el gabinete, lo secamos y laqueamos aquí.', 1);

  -- =======================================================================
  -- 9. Bocina de estantería Cuitzeo
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'bocina-de-estanteria-cuitzeo', 'CL-BOC-205', 'Bocina de estantería Cuitzeo',
    'Par activo con driver de seda. Suena a sala, no a bodega.',
    'Gabinete laqueado de seis capas, driver de seda de una pulgada y woofer de 5.25. Par estéreo activo: solo necesita corriente y algo que tocar.',
    true,
    'Bocina de estantería Cuitzeo — NOMAHOME',
    'Par de bocinas activas con driver de seda y woofer de 5.25. Gabinete laqueado en el taller. 80 W por canal.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_tec);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-BOC-205-HUE', v_hueso, 'MDF laqueado de seis capas', 22, 24, 34, 5.8, 429000, 6, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/bocina-de-estanteria-cuitzeo-hueso.svg', 'Bocina de estantería Cuitzeo en hueso', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-BOC-205-TIN', v_tinta, 'MDF laqueado de seis capas', 22, 24, 34, 5.8, 429000, 4, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/bocina-de-estanteria-cuitzeo-tinta.svg', 'Bocina de estantería Cuitzeo en tinta', 800, 1000, 0);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-BOC-205-ARC', v_arcilla, 'MDF laqueado de seis capas', 22, 24, 34, 5.8, 449000, 3, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/bocina-de-estanteria-cuitzeo-arcilla.svg', 'Bocina de estantería Cuitzeo en arcilla', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Especificaciones', 'Driver de seda de 1", woofer de 5.25", 80 W por canal. 22 × 24 × 34 cm, 5.8 kg cada una. Entrada RCA y Bluetooth 5.0.', 0),
    (v_product, 'Taller y garantía', 'Se laquean por lote en el taller. Prueba de audio en la tienda con cita. Garantía de dos años, conos de repuesto en existencia.', 1);

  -- =======================================================================
  -- 10. Router de hogar en caja de roble
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'router-de-hogar-en-caja-de-roble', 'CL-ROU-110', 'Router de hogar en caja de roble',
    'Doble banda dentro de una caja de roble. El wifi que no se ve.',
    'WiFi 6 de doble banda dentro de una caja de roble macizo ventilada. Se limpia con franela y envejece como los muebles, no como el plástico.',
    true,
    'Router de hogar en caja de roble — NOMAHOME',
    'Router WiFi 6 de doble banda dentro de caja de roble macizo. 24 × 18 × 9 cm. Se fabrica en Morelia.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_tec);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-ROU-110-ROB', v_roble, 'Caja de roble macizo ventilada', 24, 18, 9, 1.1, 219000, 12, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/router-de-hogar-en-caja-de-roble-roble.svg', 'Router de hogar en caja de roble', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Especificaciones', 'WiFi 6 de doble banda, dos antenas internas. 24 × 18 × 9 cm, 1.1 kg. Puertos: 1 WAN, 3 LAN gigabit.', 0),
    (v_product, 'Taller y garantía', 'La caja se ensambla en taller y la electrónica se prueba 48 horas encendida. Garantía de electrónica dos años; la madera dura la vida útil del router y un poco más.', 1);

  -- =======================================================================
  -- 11. Purificador de aire para sala
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'purificador-de-aire-para-sala', 'CL-PUR-330', 'Purificador de aire para sala',
    'Filtro HEPA H13 para salas de hasta 60 m². Silencioso de verdad.',
    'Cubre 60 m² con filtro HEPA H13 y carbón activado. En modo noche mide 22 dB: se oye menos que el refrigerador.',
    true,
    'Purificador de aire para sala — NOMAHOME',
    'Purificador de aire con HEPA H13 y carbón activado para 60 m². 22 dB en modo noche. Filtros de taller.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_tec);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-PUR-330-HUE', v_hueso, 'Cuerpo de policarbonato mate', 26, 26, 74, 6.2, 890000, 7, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/purificador-de-aire-para-sala-hueso.svg', 'Purificador de aire para sala en hueso', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Especificaciones', 'Filtro HEPA H13 y carbón activado. 26 × 26 × 74 cm, 6.2 kg. Cubre 60 m², 22 dB en modo noche.', 0),
    (v_product, 'Filtros y taller', 'El filtro se cambia una vez al año y vendemos el repuesto en existencia permanente. El primer año de filtros va por nuestra cuenta.', 1);

  -- =======================================================================
  -- 12. Hub de cortinas motorizadas
  -- =======================================================================
  insert into public.products (slug, sku, name, summary, description, published, seo_title, seo_description)
  values (
    'hub-de-cortinas-motorizadas', 'CL-HUB-120', 'Hub de cortinas motorizadas',
    'Abre y cierra la casa sin pararte. Cortinas, persianas, toldos.',
    'Controla hasta cuatro motores de cortina con horarios por luz, no por reloj. Aluminio anodizado que se pega detrás de la cortina y ahí vive.',
    true,
    'Hub de cortinas motorizadas — NOMAHOME',
    'Hub de aluminio para cuatro motores de cortina con horarios por luz. Compatible con Somfy y genéricos.'
  ) returning id into v_product;

  insert into public.product_categories (product_id, category_id) values (v_product, v_cat_tec);

  insert into public.product_variants (product_id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg, price_cents, stock, published)
  values (v_product, 'CL-HUB-120-GRA', v_grafito, 'Aluminio anodizado', 12, 12, 4, 0.4, 359000, 10, true)
  returning id into v_variant;

  insert into public.product_media (variant_id, path, alt, width, height, sort_order)
  values (v_variant, '/brand/seed/hub-de-cortinas-motorizadas-grafito.svg', 'Hub de cortinas motorizadas en grafito', 800, 1000, 0);

  insert into public.product_tabs (product_id, title, body, sort_order) values
    (v_product, 'Especificaciones', 'Radio 868 MHz, WiFi solo para configurar. 12 × 12 × 4 cm, 0.4 kg. Cuatro canales de motor.', 0),
    (v_product, 'Taller y garantía', 'Se configura en una visita del taller: emparejamos motores, horarios y luz. Compatible con Somfy y genéricos de motor tubular.', 1);
end $$;

-- ---------------------------------------------------------------------------
-- Bloques del home
-- ---------------------------------------------------------------------------
insert into public.homepage_blocks (kind, title, body, product_id, sort_order, published)
select 'opening',
       'Una casa se arma con piezas que aguanten la vida.',
       'Somos un taller de Morelia. Cortamos, tejemos, cableamos y probamos cada pieza antes de que cruce tu puerta. Esto no es un catálogo de importaciones: es lo que sabemos hacer con la madera, la tela y la luz.',
       p.id, 0, true
from public.products p
where p.slug = 'sofa-norte-220';

insert into public.homepage_blocks (kind, title, body, product_id, sort_order, published)
values ('categories', 'Materia', 'Cuatro oficios bajo el mismo techo: mueble, luz, tecnología que se porta bien y textil.', null, 1, true);

insert into public.homepage_blocks (kind, title, body, product_id, sort_order, published)
select 'pieces', 'Cuatro piezas del mes', 'Lo que salió del taller recién, con su medida y su material a la vista.', p.id, 2, true
from public.products p
where p.slug = 'mesa-de-roble-lerma';

insert into public.homepage_blocks (kind, title, body, product_id, sort_order, published)
values ('craft_note', 'Nota de oficio', 'El detalle que no se ve: resortes atados a mano, cera natural, cable escondido en la madera. Ese es el lujo que nos sale.', null, 3, true);

insert into public.homepage_blocks (kind, title, body, product_id, sort_order, published)
values ('contact', 'Escríbenos del pedido', 'Por WhatsApp atendemos medidas, colores y tiempos. Una persona del taller contesta, no un bot.', null, 4, true);
