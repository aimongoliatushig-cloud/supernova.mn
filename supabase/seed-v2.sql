-- ═══════════════════════════════════════════════════════════════════════════
--  СУПЕРНОВА — Seed v2
--  Run AFTER schema-v2.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Landing Page CMS Content ─────────────────────────────────────────────
INSERT INTO landing_page_content (key, value, label, section) VALUES
  ('hero_title',      'Таны эрүүл мэнд — бидний нэн тэргүүний зорилго', 'Hero гарчиг',        'hero'),
  ('hero_subtitle',   'Японы стандартын дагуу иж бүрэн эрүүл мэндийн шинжилгээ хийлгэж, эрт оношлогоо, зөв эмчилгээний чиглэл авна уу.', 'Hero тайлбар', 'hero'),
  ('hero_cta_text',   'Шинжилгээ эхлэх',                                'Hero CTA товч',      'hero'),
  ('hero_badge',      'Монголын анхны Японы жишиг оношлогооны эмнэлэг', 'Hero badge текст',   'hero'),

  ('about_title',     'Япон улсын жишгийн дагуу тусалдаг эмнэлэг',     'Тухай гарчиг',       'about'),
  ('about_text',      'Супернова эмнэлэг нь Японы стандартын дагуу иж бүрэн оношлогооны үйлчилгээ үзүүлэх зорилгоор байгуулагдсан. Японы брэндийн тоног төхөөрөмж, протоколыг ашигладаг. Манай 10 гаруй мэргэшсэн эмч нар олон улсын сургалтад хамрагдан, тасралтгүй мэдлэгоо дээшлүүлж байдаг.', 'Тухай текст', 'about'),
  ('about_vision',    'Монгол хүн бүрт чанартай, найдвартай эрүүл мэндийн шинжилгээ хийлгэх боломж олгох.', 'Алсын харааc', 'about'),

  ('tech_title',      'Дэвшилтэт тоног төхөөрөмж',                     'Технологи гарчиг',   'technology'),
  ('tech_subtitle',   'Японы тэргүүлэх брэндийн тоног төхөөрөмжийг ашиглан нарийвчлалтай шинжилгээ хийдэг.', 'Технологи тайлбар', 'technology'),
  ('tech_brands',     'Olympus, Hitachi, Fukuda Denshi',                 'Брэндүүд',           'technology'),

  ('privacy_text',    'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.', 'Нууцлалын текст', 'trust'),
  ('cta_free_consult','Анхны үзлэг — 15 минутын утасны зөвлөгөө ҮНЭГҮЙ', 'CTA санал текст',  'cta')
ON CONFLICT (key) DO NOTHING;

-- ─── Contact Settings ─────────────────────────────────────────────────────
INSERT INTO contact_settings (phone, address, email) VALUES
  ('1330-033', 'Улаанбаатар хот, Сүхбаатар дүүрэг, 8-р хороо, Японы эмнэлгийн байр', 'info@supernova.mn')
ON CONFLICT DO NOTHING;

-- ─── Social Links ─────────────────────────────────────────────────────────
INSERT INTO social_links (platform, url, sort_order) VALUES
  ('facebook',  'https://facebook.com/supernovamn',  1),
  ('instagram', 'https://instagram.com/supernovamn', 2),
  ('youtube',   'https://youtube.com/@supernovamn',  3)
ON CONFLICT DO NOTHING;

-- ─── Working Hours ────────────────────────────────────────────────────────
INSERT INTO working_hours (day_label, open_time, close_time, sort_order) VALUES
  ('Даваа — Баасан', '08:00', '18:00', 1),
  ('Бямба',          '09:00', '14:00', 2),
  ('Ням',            '09:00', '13:00', 3)
ON CONFLICT DO NOTHING;

-- ─── Service Categories ───────────────────────────────────────────────────
INSERT INTO service_categories (name, icon, sort_order) VALUES
  ('Зүрх судасны',        '❤️',  1),
  ('Хоол боловсруулах',   '🔬',  2),
  ('Дотрын',              '🫀',  3),
  ('Бөөр, шээсний',       '🫘',  4),
  ('Дааврын',             '🦋',  5),
  ('Эмэгтэйчүүдийн',      '🌸',  6),
  ('Яс, үе мөч',          '🦴',  7),
  ('Дүрс оношилгоо',      '📡',  8),
  ('Иж бүрэн үзлэг',      '🏥',  9)
ON CONFLICT DO NOTHING;

-- ─── Service Packages ─────────────────────────────────────────────────────
INSERT INTO service_packages (title, description, price, old_price, promotion_text, badge_text, badge_color, show_on_landing, show_on_result, sort_order) VALUES
  (
    'Иж бүрэн эрүүл мэндийн багц',
    'Дотрын эмчийн үзлэг, цусны ерөнхий болон биохими, шээсний шинжилгээ, ЭКГ, рентген зэргийг багтаасан иж бүрэн шинжилгээний багц.',
    299000, 420000,
    '20% хөнгөлөлт + витамин бэлэг',
    'Хамгийн их эрэлттэй', '#1E63B5',
    TRUE, TRUE, 1
  ),
  (
    'Зүрх судасны иж бүрэн багц',
    'ЭКГ, ЭХО зүрх, 24 цагийн даралтын хяналт, холестерин болон зүрхний эрсдэлийн шинжилгээ.',
    250000, 320000,
    'ЭКГ шинжилгээ үнэгүй',
    'Зүрхний мэргэжил', '#E8323F',
    TRUE, TRUE, 2
  ),
  (
    'Хоол боловсруулахын багц',
    'Ходоодны дуран, гэдэсний шинжилгээ, элэгний хэт авиа, цусны биохими багтсан.',
    220000, 290000,
    NULL,
    NULL, '#059669',
    TRUE, FALSE, 3
  ),
  (
    'Эмэгтэйчүүдийн иж бүрэн багц',
    'Умайн хүзүүний шинжилгээ, хэт авиа, гормоны профайл, остеопороз шинжилгээ.',
    280000, 360000,
    '15% хөнгөлөлт',
    'Эмэгтэйчүүдэд', '#7C3AED',
    TRUE, TRUE, 4
  ),
  (
    'Урьдчилан сэргийлэх багц',
    'Жил бүр хийлгэх үзлэг: цусны ерөнхий, рентген, ЭКГ, шээсний, дотрын эмчийн үзлэг.',
    180000, 230000,
    NULL,
    'Онцлох санал', '#F59E0B',
    TRUE, FALSE, 5
  )
ON CONFLICT DO NOTHING;

-- ─── Link packages to services (after both are seeded) ────────────────────
-- This links the Иж бүрэн багц to relevant services
DO $$
DECLARE
  pkg_full UUID;
  pkg_heart UUID;
  svc_heart UUID;
  svc_gastro UUID;
  svc_liver UUID;
  svc_full UUID;
BEGIN
  SELECT id INTO pkg_full  FROM service_packages WHERE title LIKE 'Иж бүрэн эрүүл%' LIMIT 1;
  SELECT id INTO pkg_heart FROM service_packages WHERE title LIKE 'Зүрх судасны%'   LIMIT 1;
  SELECT id INTO svc_heart  FROM services WHERE name LIKE 'Зүрхний%'   LIMIT 1;
  SELECT id INTO svc_gastro FROM services WHERE name LIKE 'Ходоод%'    LIMIT 1;
  SELECT id INTO svc_liver  FROM services WHERE name LIKE 'Элэгний%'   LIMIT 1;
  SELECT id INTO svc_full   FROM services WHERE name LIKE 'Иж бүрэн%'  LIMIT 1;

  IF pkg_full IS NOT NULL AND svc_heart IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_full, svc_heart) ON CONFLICT DO NOTHING;
  END IF;
  IF pkg_full IS NOT NULL AND svc_gastro IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_full, svc_gastro) ON CONFLICT DO NOTHING;
  END IF;
  IF pkg_full IS NOT NULL AND svc_liver IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_full, svc_liver) ON CONFLICT DO NOTHING;
  END IF;
  IF pkg_heart IS NOT NULL AND svc_heart IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_heart, svc_heart) ON CONFLICT DO NOTHING;
  END IF;
END $$;
