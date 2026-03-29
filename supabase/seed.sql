-- ═══════════════════════════════════════════════════════════════════════════
--  СУПЕРНОВА — Seed Data
--  Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Symptom Categories ───────────────────────────────────────────────────────
INSERT INTO symptom_categories (name, name_en, icon, description, sort_order) VALUES
  ('Зүрх',                    'Heart',          '❤️',  'Зүрх, цусны эргэлттэй холбоотой зовиурууд',         1),
  ('Даралт',                  'Blood Pressure', '🩺',  'Цусны даралт, тархины судасны зовиурууд',            2),
  ('Ходоод',                  'Stomach',        '🫃',  'Хоол боловсруулах замын зовиурууд',                  3),
  ('Элэг',                    'Liver',          '🫀',  'Элэг, цөсний зовиурууд',                             4),
  ('Бөөр',                    'Kidney',         '🫘',  'Бөөр, шээсний замын зовиурууд',                      5),
  ('Бамбай булчирхай',        'Thyroid',        '🦋',  'Бамбай булчирхайн зовиурууд',                        6),
  ('Эмэгтэйчүүд',             'Women',          '🌸',  'Эмэгтэйчүүдийн эрүүл мэндийн зовиурууд',            7),
  ('Яс үе',                   'Bones & Joints', '🦴',  'Яс, үе мөч, нуруу, булчингийн зовиурууд',           8),
  ('Хоол боловсруулах эрхтэн','Digestive',      '🌡️',  'Гэдэс, хоол боловсруулах дэлгэрэнгүй зовиурууд',    9),
  ('Даавар',                  'Hormones',       '⚗️',  'Дааврын зохицуулалттай холбоотой зовиурууд',         10);

-- ─── Questions for Зүрх (Heart) ───────────────────────────────────────────────
WITH cat AS (SELECT id FROM symptom_categories WHERE name_en = 'Heart' LIMIT 1)
INSERT INTO questions (category_id, question_text, question_type, sort_order, risk_weight) VALUES
  ((SELECT id FROM cat), 'Цээжний өвдөлт мэдрэгдэж байна уу?',                    'single', 1, 2.0),
  ((SELECT id FROM cat), 'Зүрх тогтмол бус дэлсэж, эсвэл тасарч мэдрэгдэж байна уу?', 'single', 2, 1.5),
  ((SELECT id FROM cat), 'Хөл, гар хавдаж байна уу?',                              'single', 3, 1.0),
  ((SELECT id FROM cat), 'Амьсгаадах, хурдан ядрах тохиолдол байна уу?',           'single', 4, 1.5),
  ((SELECT id FROM cat), 'Зовиур хэдэн хоногийн өмнөөс эхэлсэн бэ?',              'single', 5, 1.0);

-- ─── Questions for Даралт (Blood Pressure) ───────────────────────────────────
WITH cat AS (SELECT id FROM symptom_categories WHERE name_en = 'Blood Pressure' LIMIT 1)
INSERT INTO questions (category_id, question_text, question_type, sort_order, risk_weight) VALUES
  ((SELECT id FROM cat), 'Толгой өвдөх, эргэх мэдрэгдэж байна уу?',              'single', 1, 1.5),
  ((SELECT id FROM cat), 'Даралтаа хэмжиж байна уу? Хэдэн mm/Hg байна вэ?',      'text',   2, 1.0),
  ((SELECT id FROM cat), 'Нүд бүдгэрэх, харанхуйлах тохиолдол байна уу?',        'single', 3, 2.0),
  ((SELECT id FROM cat), 'Тэнцвэр алдах, унах дөхсөн мэдрэмж байна уу?',         'single', 4, 2.0),
  ((SELECT id FROM cat), 'Зовиур өдрийн аль цагт хурцддаг вэ?',                  'single', 5, 0.5);

-- ─── Questions for Ходоод (Stomach) ──────────────────────────────────────────
WITH cat AS (SELECT id FROM symptom_categories WHERE name_en = 'Stomach' LIMIT 1)
INSERT INTO questions (category_id, question_text, question_type, sort_order, risk_weight) VALUES
  ((SELECT id FROM cat), 'Хэвлийн өвдөлт байна уу? Хаана байрладаг вэ?',         'single', 1, 1.5),
  ((SELECT id FROM cat), 'Дотор муухайрах, бөөлжих тохиолдол байна уу?',         'single', 2, 1.0),
  ((SELECT id FROM cat), 'Суулгах, өтгөн хаталт байна уу?',                      'single', 3, 1.0),
  ((SELECT id FROM cat), 'Хоол идсэний дараа өвдөлт нэмэгдэж байна уу?',         'single', 4, 1.5),
  ((SELECT id FROM cat), 'Цус бүхий ялгадас гарч байна уу?',                     'single', 5, 3.0);

-- ─── Answer options for first question of each category ──────────────────────
-- (Simplified; full admin CRUD will handle the rest)
WITH q AS (
  SELECT id FROM questions
  WHERE question_text = 'Цээжний өвдөлт мэдрэгдэж байна уу?' LIMIT 1
)
INSERT INTO answer_options (question_id, option_text, risk_score, sort_order) VALUES
  ((SELECT id FROM q), 'Тийм, байнга',                        3.0, 1),
  ((SELECT id FROM q), 'Заримдаа',                            1.5, 2),
  ((SELECT id FROM q), 'Биеийн хөдөлгөөнтэй холбоотойгоор',  2.0, 3),
  ((SELECT id FROM q), 'Үгүй',                                0.0, 4);

WITH q AS (
  SELECT id FROM questions
  WHERE question_text = 'Зүрх тогтмол бус дэлсэж, эсвэл тасарч мэдрэгдэж байна уу?' LIMIT 1
)
INSERT INTO answer_options (question_id, option_text, risk_score, sort_order) VALUES
  ((SELECT id FROM q), 'Тийм, байнга',    3.0, 1),
  ((SELECT id FROM q), 'Заримдаа',        1.5, 2),
  ((SELECT id FROM q), 'Үгүй',            0.0, 3);

-- ─── Doctors ──────────────────────────────────────────────────────────────────
INSERT INTO doctors (full_name, title, specialization, experience_years, bio, photo_url, sort_order) VALUES
  ('Б. Баясгалан',    'Эмч', 'Хоол боловсруулахын дурангийн эмч (Гастроэнтеролог)', 10,
   'Ходоод, гэдэс, арван хоёр нугасны дурангийн шинжилгээ болон хоол боловсруулах замын өвчний оношлогоо, эмчилгээнд мэргэжилтэй.',
   '/doctors/bayasgalan.jpg', 1),
  ('Б. Будсүрэн',     'Эмч', 'Дотрын өвчний эмч (Терапевт)',                       15,
   'Дотрын өвчний иж бүрэн оношлогоо, Японы стандартын дагуу эрүүл мэндийн бүрэн үзлэг хийдэг туршлагатай эмч.',
   '/doctors/budsuren.jpg', 2),
  ('Г. Батцэцэг',     'Эмч', 'Зүрх судасны эмч (Кардиолог)',                       12,
   'Зүрх судасны өвчний оношлогоо, ЭКГ, ЭХО зүрхний шинжилгээ болон зүрхний хэм алдагдлын эмчилгээнд мэргэжилтэй.',
   '/doctors/battsetseg.jpg', 3),
  ('Д. Номин-эрдэнэ', 'Эмч', 'Дүрс оношилгооны эмч (Рентген / Хэт авиа / MRI)',   8,
   'Хэт авианы шинжилгээ, рентген болон дэвшилтэт дүрс оношилгооны аргуудыг ашиглан нарийн оношлогоо хийдэг.',
   '/doctors/nomin.jpg', 4);

-- ─── Services ─────────────────────────────────────────────────────────────────
INSERT INTO services (name, description, price, duration_minutes, preparation_notice, sort_order) VALUES
  ('Зүрхний иж бүрэн шинжилгээ',
   'ЭКГ, ЭХО зүрх, цусны даралтын 24 цагийн хяналт зэргийг багтаасан иж бүрэн шинжилгээ.',
   150000, 90, 'Шинжилгээнд ирэхийн өмнө 4 цаг өлөн байна уу.', 1),
  ('Ходоод, гэдэсний дуран',
   'Японы дэвшилтэт тоног төхөөрөмжөөр ходоод, арван хоёр нугас, гэдэсний дурангийн шинжилгээ.',
   200000, 60, 'Шинжилгээнд ирэхийн өмнөх өдрийн орой 18:00 цагаас хойш хоол идэхгүй байна уу.', 2),
  ('Элэгний иж бүрэн шинжилгээ',
   'Хэт авианы шинжилгээ болон цусны шинжилгээгээр элэгний функцийг иж бүрэн шалгана.',
   120000, 60, 'Шинжилгээний өдөр өглөө өлөн ирнэ үү.', 3),
  ('Бөөрний шинжилгээ',
   'Бөөр, шээс ялгаруулах замын хэт авианы болон лабораторийн шинжилгээ.',
   100000, 45, 'Шинжилгээнд ирэхийн өмнө их ус уусан байна уу.', 4),
  ('Бамбай булчирхайн шинжилгээ',
   'Хэт авианы шинжилгээ болон гормоны цусны шинжилгээ.',
   110000, 45, NULL, 5),
  ('Эмэгтэйчүүдийн иж бүрэн шинжилгээ',
   'Умайн хүзүүний шинжилгээ, хэт авианы шинжилгээ болон гормоны профайл.',
   180000, 90, NULL, 6),
  ('Яс нягтралын шинжилгээ (DEXA)',
   'Яс нягтрал, остеопорозын эрт оношлогоо.',
   130000, 30, NULL, 7),
  ('Иж бүрэн эрүүл мэндийн үзлэг',
   'Дотрын эмчийн үзлэг, цусны ерөнхий, биохими, шээсний шинжилгээ, рентген, ЭКГ багтсан.',
   350000, 180, 'Шинжилгээний өдөр өглөө өлөн ирнэ үү.', 8);

-- ─── Promotions ───────────────────────────────────────────────────────────────
WITH svc AS (SELECT id FROM services WHERE name = 'Иж бүрэн эрүүл мэндийн үзлэг' LIMIT 1)
INSERT INTO promotions (service_id, title, description, discount_percent, free_gift, badge_text, badge_color, is_active) VALUES
  ((SELECT id FROM svc),
   '2026 оны Эрүүл мэндийн сар',
   'Иж бүрэн үзлэгт 20% хөнгөлөлт + витаминний иж бүрдэл бэлэг болгон.',
   20,
   'Витамины иж бүрдэл (D3+B12+Omega3)',
   '20% ХӨНГӨЛӨЛТ',
   '#E8323F',
   TRUE);

WITH svc AS (SELECT id FROM services WHERE name = 'Зүрхний иж бүрэн шинжилгээ' LIMIT 1)
INSERT INTO promotions (service_id, title, description, discount_amount, badge_text, badge_color, is_active) VALUES
  ((SELECT id FROM svc),
   'Зүрхний шинжилгээний урамшуулал',
   'Зүрхний иж бүрэн шинжилгээнд ЭКГ шинжилгээ үнэгүй хамт.',
   0,
   'ЭКГ ҮНЭГҮЙ',
   '#1E63B5',
   TRUE);
