-- Seed data for MangaReader

-- Clear existing data if necessary (optional)
-- TRUNCATE TABLE chapters CASCADE;
-- TRUNCATE TABLE mangas CASCADE;

-- Insert Mangas
INSERT INTO mangas (title, slug, description, cover_image, status, rating, genres, author, artist, views, is_premium, created_at, updated_at) VALUES
('One Piece', 'one-piece', 'Monkey D. Luffy recusa-se a deixar que alguém ou alguma coisa se interponha no seu caminho para se tornar o rei de todos os piratas. Com um rumo traçado para as águas traiçoeiras da Grand Line, este é um capitão que nunca desistirá até conseguir o maior tesouro da Terra!', '/assets/one_piece_cover.png', 'ongoing', 'L12', '["Ação", "Aventura", "Fantasia"]', 'Eiichiro Oda', 'Eiichiro Oda', 12500, false, NOW(), NOW()),
('Jujutsu Kaisen', 'jujutsu-kaisen', 'Yuji Itadori é um estudante do ensino médio com força física impressionante, mas sem interesse em esportes. Ele prefere passar o tempo no clube de ocultismo de sua escola. Um dia, o selo de um objeto amaldiçoado é rompido, liberando monstros terríveis.', '/assets/manga_panel_action.png', 'ongoing', 'L14', '["Ação", "Sobrenatural"]', 'Gege Akutami', 'Gege Akutami', 9800, false, NOW(), NOW()),
('Demon Slayer', 'demon-slayer', 'Tanjirou Kamado é um garoto inteligente e de bom coração que vive com sua família e ganha dinheiro vendendo carvão. Tudo muda quando sua família é atacada e assassinada por um demônio, restando apenas ele e sua irmã Nezuko, que virou demônio.', '/assets/manga_char_slice.png', 'completed', 'L14', '["Ação", "Histórico", "Sobrenatural"]', 'Koyoharu Gotouge', 'Koyoharu Gotouge', 15400, true, NOW(), NOW()),
('My Hero Academia', 'my-hero-academia', 'Em um mundo onde a maioria das pessoas possui superpoderes conhecidos como Peculiaridades, Izuku Midoriya é um dos poucos que nasceram sem nenhum poder. Mas tudo muda quando ele conhece o lendário herói All Might e herda seus incríveis poderes.', '/assets/manga_hero.png', 'ongoing', 'L12', '["Ação", "Aventura", "Super Herói"]', 'Kohei Horikoshi', 'Kohei Horikoshi', 8400, false, NOW(), NOW());

-- Insert Chapters
-- Assumindo IDs sequenciais 1, 2, 3, 4 dos mangás inseridos acima
INSERT INTO chapters (manga_id, chapter_number, title, pages, views, is_premium, published_at, created_at) VALUES
(1, '1098', 'A Batalha Final', '["/assets/manga_hero.png", "/assets/one_piece_cover.png", "/assets/manga_panel_action.png", "/assets/manga_char_slice.png", "/assets/manga_hero.png"]', 450, false, NOW(), NOW()),
(1, '1099', 'O Começo do Fim', '["/assets/one_piece_cover.png", "/assets/manga_panel_action.png", "/assets/manga_char_slice.png"]', 120, true, NOW(), NOW()),
(2, '245', 'O Despertar', '["/assets/manga_panel_action.png", "/assets/manga_char_slice.png", "/assets/manga_hero.png"]', 380, false, NOW(), NOW()),
(3, '205', 'O Legado de Tanjirou', '["/assets/manga_char_slice.png", "/assets/manga_hero.png", "/assets/one_piece_cover.png"]', 890, true, NOW(), NOW()),
(4, '410', 'O Legado', '["/assets/manga_hero.png", "/assets/one_piece_cover.png", "/assets/manga_char_slice.png"]', 230, false, NOW(), NOW());
