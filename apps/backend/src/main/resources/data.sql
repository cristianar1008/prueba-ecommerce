-- =========================================================
-- Datos precargados para la demo: categorias, descuento de
-- categoria, cupones y catalogo de productos.
-- Idempotente: se puede reiniciar la app las veces que sea
-- sin duplicar filas.
-- =========================================================

-- Categorias
INSERT INTO category (name) VALUES ('Tecnologia')
    ON CONFLICT (name) DO NOTHING;
INSERT INTO category (name) VALUES ('Hogar')
    ON CONFLICT (name) DO NOTHING;

-- Estados de cupon
INSERT INTO state_coupon (name) VALUES ('ACTIVO')
    ON CONFLICT (name) DO NOTHING;
INSERT INTO state_coupon (name) VALUES ('EXPIRADO')
    ON CONFLICT (name) DO NOTHING;
INSERT INTO state_coupon (name) VALUES ('USADO')
    ON CONFLICT (name) DO NOTHING;

-- Descuento de categoria: 10% para Tecnologia, sin fecha de vencimiento
INSERT INTO discount (category_id, percentage, valid_from, valid_to, active)
SELECT c.id, 0.10, NULL, NULL, true
FROM category c
WHERE c.name = 'Tecnologia'
  AND NOT EXISTS (SELECT 1 FROM discount d WHERE d.category_id = c.id);

-- Cupon valido (el que pide el enunciado)
INSERT INTO coupon (code, discount_percentage, expires_at, id_state)
SELECT 'WELCOME2026', 0.15, TIMESTAMP '2027-12-31 23:59:59', sc.id
FROM state_coupon sc
WHERE sc.name = 'ACTIVO'
    ON CONFLICT (code) DO NOTHING;

-- Cupon vencido, para probar manualmente el caso de cupon expirado
INSERT INTO coupon (code, discount_percentage, expires_at, id_state)
SELECT 'PROMO2020', 0.20, TIMESTAMP '2027-12-31 23:59:59', sc.id
FROM state_coupon sc
WHERE sc.name = 'ACTIVO'
    ON CONFLICT (code) DO NOTHING;

-- Productos - Tecnologia
INSERT INTO product (name, unit_price, stock, id_category, image_url)
SELECT 'Laptop X1', 150.00, 10, c.id, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiGT9JASNN9WnW5cuyBqiXga2qzNWGRC2ea9NIMfLkdg&s=10'
FROM category c WHERE c.name = 'Tecnologia'
                  AND NOT EXISTS (SELECT 1 FROM product p WHERE p.name = 'Laptop X1');

INSERT INTO product (name, unit_price, stock, id_category, image_url)
SELECT 'Mouse Inalambrico', 50.00, 20, c.id, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS3H-vRE93jG76rY-aJ8FzblhSWyY_cIdvvHd99JeFHg&s=10'
FROM category c WHERE c.name = 'Tecnologia'
                  AND NOT EXISTS (SELECT 1 FROM product p WHERE p.name = 'Mouse Inalambrico');

INSERT INTO product (name, unit_price, stock, id_category, image_url)
SELECT 'Teclado Mecanico', 80.00, 15, c.id, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ19CB6jnG9mQz72ZvGnNqzJZ0KsFaBiPab4n7F7hOurw&s=10'
FROM category c WHERE c.name = 'Tecnologia'
                  AND NOT EXISTS (SELECT 1 FROM product p WHERE p.name = 'Teclado Mecanico');

INSERT INTO product (name, unit_price, stock, id_category, image_url)
SELECT 'Monitor 24 pulgadas', 120.00, 8, c.id, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcZ35xVV2qOrKaduQAr8XY0-crv1XNEOpenD-VomHGOg&s=10'
FROM category c WHERE c.name = 'Tecnologia'
                  AND NOT EXISTS (SELECT 1 FROM product p WHERE p.name = 'Monitor 24 pulgadas');

-- Productos - Hogar (no reciben descuento de categoria)
INSERT INTO product (name, unit_price, stock, id_category, image_url)
SELECT 'Silla de Oficina', 90.00, 5, c.id, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmz-jzeBjksGuhskxSXn8KhQU18nb6RwGPivFHLxvOGw&s=10'
FROM category c WHERE c.name = 'Hogar'
                  AND NOT EXISTS (SELECT 1 FROM product p WHERE p.name = 'Silla de Oficina');

INSERT INTO product (name, unit_price, stock, id_category, image_url)
SELECT 'Lampara de Escritorio', 25.00, 1, c.id, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCqe-KTB1SB2vhbVy70pWg7xk0ELBfa8dgsaCTZI3WYg&s=10'
FROM category c WHERE c.name = 'Hogar'
                  AND NOT EXISTS (SELECT 1 FROM product p WHERE p.name = 'Lampara de Escritorio');