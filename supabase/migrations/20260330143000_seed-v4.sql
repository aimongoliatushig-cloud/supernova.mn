-- SUPERNOVA data backfill
-- Run after seed-v3.sql

-- Fix service category relationships so public/admin modules can use real joins.
UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Зүрхний иж бүрэн шинжилгээ'
  AND categories.name = 'Зүрх судасны'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Ходоод, гэдэсний дуран'
  AND categories.name = 'Хоол боловсруулах'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Элэгний иж бүрэн шинжилгээ'
  AND categories.name = 'Хоол боловсруулах'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Бөөрний шинжилгээ'
  AND categories.name = 'Бөөр, шээсний'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Бамбай булчирхайн шинжилгээ'
  AND categories.name = 'Дааврын'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Эмэгтэйчүүдийн иж бүрэн шинжилгээ'
  AND categories.name = 'Эмэгтэйчүүдийн'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Яс нягтралын шинжилгээ (DEXA)'
  AND categories.name = 'Яс, үе мөч'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
  AND categories.name = 'Иж бүрэн үзлэг'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services
SET show_on_result = TRUE
WHERE is_active = TRUE
  AND show_on_result IS DISTINCT FROM TRUE;

-- Link doctors to the services they can actually handle.
INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Ходоод, гэдэсний дуран'
WHERE doctors.full_name = 'Б. Баясгалан'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Элэгний иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Б. Баясгалан'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
WHERE doctors.full_name = 'Б. Баясгалан'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
WHERE doctors.full_name = 'Б. Будсүрэн'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бөөрний шинжилгээ'
WHERE doctors.full_name = 'Б. Будсүрэн'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бамбай булчирхайн шинжилгээ'
WHERE doctors.full_name = 'Б. Будсүрэн'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Зүрхний иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Г. Батцэцэг'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
WHERE doctors.full_name = 'Г. Батцэцэг'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Элэгний иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бөөрний шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бамбай булчирхайн шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Эмэгтэйчүүдийн иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Яс нягтралын шинжилгээ (DEXA)'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

-- Backfill diagnosis so all seeded categories work in the public flow.
CREATE OR REPLACE FUNCTION public.seed_question_with_options(
  p_category_name TEXT,
  p_question_text TEXT,
  p_sort_order INTEGER,
  p_risk_weight NUMERIC,
  p_option_texts TEXT[],
  p_option_scores NUMERIC[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_id UUID;
  v_question_id UUID;
  v_option_id UUID;
  v_index INTEGER;
BEGIN
  IF COALESCE(array_length(p_option_texts, 1), 0) = 0 THEN
    RETURN;
  END IF;

  SELECT id
  INTO v_category_id
  FROM symptom_categories
  WHERE name = p_category_name
  LIMIT 1;

  IF v_category_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id
  INTO v_question_id
  FROM questions
  WHERE category_id = v_category_id
    AND question_text = p_question_text
  LIMIT 1;

  IF v_question_id IS NULL THEN
    INSERT INTO questions (
      category_id,
      question_text,
      question_type,
      sort_order,
      is_required,
      is_active,
      risk_weight
    )
    VALUES (
      v_category_id,
      p_question_text,
      'single',
      p_sort_order,
      TRUE,
      TRUE,
      p_risk_weight
    )
    RETURNING id INTO v_question_id;
  ELSE
    UPDATE questions
    SET question_type = 'single',
        sort_order = p_sort_order,
        is_required = TRUE,
        is_active = TRUE,
        risk_weight = p_risk_weight
    WHERE id = v_question_id;
  END IF;

  FOR v_index IN 1..array_length(p_option_texts, 1) LOOP
    SELECT id
    INTO v_option_id
    FROM answer_options
    WHERE question_id = v_question_id
      AND option_text = p_option_texts[v_index]
    LIMIT 1;

    IF v_option_id IS NULL THEN
      INSERT INTO answer_options (
        question_id,
        option_text,
        recommendation,
        risk_score,
        sort_order,
        is_active
      )
      VALUES (
        v_question_id,
        p_option_texts[v_index],
        NULL,
        p_option_scores[v_index],
        v_index,
        TRUE
      );
    ELSE
      UPDATE answer_options
      SET risk_score = p_option_scores[v_index],
          sort_order = v_index,
          is_active = TRUE
      WHERE id = v_option_id;
    END IF;
  END LOOP;
END;
$$;

DO $$
BEGIN
  PERFORM seed_question_with_options(
    'Зүрх',
    'Цээжний өвдөлт мэдрэгдэж байна уу?',
    1,
    2.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Зүрх тогтмол бус дэлсэж, эсвэл тасарч мэдрэгдэж байна уу?',
    2,
    1.5,
    ARRAY['Тийм, өдөр бүр', '7 хоногт хэд хэд', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Хөл, гар хавдаж байна уу?',
    3,
    1.0,
    ARRAY['Тийм, өдөр бүр', 'Оройдоо', 'Хааяа', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Амьсгаадах, хурдан ядрах тохиолдол байна уу?',
    4,
    1.5,
    ARRAY['Байнга', 'Шат өгсөхөд', 'Хүчтэй ачаалалд л', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Зовиур хэдэн хоногийн өмнөөс эхэлсэн бэ?',
    5,
    1.0,
    ARRAY['Өнөөдөр эсвэл өчигдрөөс', '3-7 хоног', '1-4 долоо хоног', '1 сараас дээш'],
    ARRAY[0.5, 1.0, 2.0, 3.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Толгой өвдөх, эргэх мэдрэгдэж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Даралтаа хэмжиж байна уу? Хэдэн mm/Hg байна вэ?',
    2,
    1.0,
    ARRAY['140/90-с дээш тогтмол', '130-139 / 85-89 орчим', '120-129 / 80-84 орчим', 'Хэвийн эсвэл тогтмол хэмждэггүй'],
    ARRAY[3.0, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Нүд бүдгэрэх, харанхуйлах тохиолдол байна уу?',
    3,
    2.0,
    ARRAY['Тийм, олон удаа', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Тэнцвэр алдах, унах дөхсөн мэдрэмж байна уу?',
    4,
    2.0,
    ARRAY['Тийм, давтагддаг', 'Сүүлийн үед 1-2 удаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Зовиур өдрийн аль цагт хурцддаг вэ?',
    5,
    0.5,
    ARRAY['Өглөө', 'Өдөр', 'Орой', 'Бараг бүтэн өдөр'],
    ARRAY[1.5, 1.0, 1.5, 2.5]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Хэвлийн өвдөлт байна уу? Хаана байрладаг вэ?',
    1,
    1.5,
    ARRAY['Ходоодны дээд хэсэг', 'Хүйсний орчим', 'Баруун хавирганы доор', 'Өвдөлтгүй / тодорхойгүй'],
    ARRAY[2.0, 1.5, 2.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Дотор муухайрах, бөөлжих тохиолдол байна уу?',
    2,
    1.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Суулгах, өтгөн хаталт байна уу?',
    3,
    1.0,
    ARRAY['Тогтмол', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Хоол идсэний дараа өвдөлт нэмэгдэж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, бараг үргэлж', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Цус бүхий ялгадас гарч байна уу?',
    5,
    3.0,
    ARRAY['Тийм, олон удаа', 'Тийм, 1-2 удаа', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[4.0, 3.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Баруун хавирганы доор хөндүүр, дарж өвдөх мэдрэмж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Арьс, нүд шарлах эсвэл шээс бараантах шинж илэрч байна уу?',
    2,
    2.5,
    ARRAY['Тийм, аль аль нь', 'Нэг нь ажиглагдсан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[4.0, 2.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Тослог хоолны дараа дотор эвгүйрхэж, гашуун оргих уу?',
    3,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Сүүлийн үед ядрах, хоолны дуршил буурах шинж байна уу?',
    4,
    1.0,
    ARRAY['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Элэгний өвчний түүх эсвэл архины тогтмол хэрэглээ байдаг уу?',
    5,
    1.5,
    ARRAY['Тийм, аль аль нь', 'Нэг нь бий', 'Өмнө нь байсан', 'Үгүй'],
    ARRAY[3.0, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Бүсэлхий, нурууны доод хэсгээр өвдөж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хөдөлгөөнтэй холбоотой', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Шээх үед хорсох, ойр ойрхон шээх шинж байна уу?',
    2,
    2.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Шээсний өнгө өөрчлөгдөх эсвэл цустай харагдах тохиолдол бий юу?',
    3,
    2.5,
    ARRAY['Тийм, тод ажиглагдсан', 'Заримдаа бараан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[4.0, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Өглөө нүүр, шагай хавагнах шинж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, өдөр бүр', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Халуурах, даарахтай хавсарсан бөөрний зовиур байна уу?',
    5,
    2.0,
    ARRAY['Тийм, байнга', 'Сүүлийн үед байсан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Жин богино хугацаанд огцом өөрчлөгдөж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, огцом', 'Тийм, бага зэрэг', 'Тогтворгүй', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Зүрх дэлсэх, халууцах эсвэл хөлрөх шинж байна уу?',
    2,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Хүзүүний урд хэсгээр төвийж томорсон мэдрэмж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, тод мэдрэгдэнэ', 'Бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Дааруу хүрэх, ядрах, нойрмоглох шинж давамгай байна уу?',
    4,
    1.5,
    ARRAY['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Үс унах, арьс хуурайших, хоолой сөөнгөтөх шинж байна уу?',
    5,
    1.0,
    ARRAY['Тийм, хэд хэдэн шинжтэй', 'Нэг шинж ажиглагдсан', 'Хааяа', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Сарын тэмдгийн мөчлөг тогтворгүй болсон уу?',
    1,
    1.5,
    ARRAY['Тийм, тогтмол алдагддаг', 'Сүүлийн үед өөрчлөгдсөн', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Доод хэвлийгээр өвдөх, базлах шинж байнга давтагддаг уу?',
    2,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Сарын тэмдэгтэй холбоотой', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Үтрээнээс хэвийн бус ялгадас эсвэл үнэр гарах шинж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, тод ажиглагдана', 'Заримдаа', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Сарын тэмдэг хэт их эсвэл удаан үргэлжилдэг үү?',
    4,
    2.0,
    ARRAY['Тийм, байнга', 'Сүүлийн үед', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Жирэмслэхээр төлөвлөж байгаа эсвэл дааврын тэнцвэр алдагдсан гэж үзэж байна уу?',
    5,
    1.0,
    ARRAY['Тийм, эмчид үзүүлэх шаардлагатай', 'Тийм, урьдчилан шалгуулмаар байна', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Үе мөч хөшиж, өглөө хөдөлгөөнд орохдоо хүндрэлтэй байна уу?',
    1,
    1.5,
    ARRAY['Тийм, өдөр бүр', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Өвдөг, нуруу, ташаа зэрэгт байнгын өвдөлт байна уу?',
    2,
    1.5,
    ARRAY['Тийм, байнга', 'Алхахад нэмэгддэг', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Үеэр хавдах, халуу оргих шинж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, тод ажиглагдана', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Гар, хөл бадайрах эсвэл мэдээ алдах шинж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Өндөр багасах, амархан яс өвдөх эсвэл хугарах эрсдэлтэй юу?',
    5,
    2.0,
    ARRAY['Тийм, өндөр эрсдэлтэй', 'Өмнө нь байсан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Хэвлий дүүрэх, гэдэс хий ихсэх шинж байна уу?',
    1,
    1.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Цээж хорсох, хүчил оргих шинж байна уу?',
    2,
    1.5,
    ARRAY['Тийм, долоо хоногт хэд хэд', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Хоолны дуршил буурах эсвэл хоол шингэхгүй байх шинж байна уу?',
    3,
    1.5,
    ARRAY['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Өтгөний хэлбэр, өнгө тогтмол өөрчлөгдөж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, байнга', 'Сүүлийн үед', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Тайлбарлахад бэрх жин буурах шинж байна уу?',
    5,
    2.0,
    ARRAY['Тийм, мэдэгдэхүйц', 'Бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Ядрах, сульдах шинж удаан үргэлжилж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Жин нэмэх эсвэл хасах өөрчлөлт тайлбарлахад хэцүү байна уу?',
    2,
    1.5,
    ARRAY['Тийм, огцом', 'Тийм, бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Ам цангах, ойр ойрхон өлсөх эсвэл шөнө шээх шинж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, олон шинжтэй', 'Нэг шинж давтагддаг', 'Хааяа', 'Үгүй'],
    ARRAY[3.5, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Сэтгэл санаа савлах, нойр алдагдах шинж байна уу?',
    4,
    1.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Арьс батгаших, үсжилт өөрчлөгдөх эсвэл бэлгийн дуршил буурах шинж байна уу?',
    5,
    1.5,
    ARRAY['Тийм, тод ажиглагдана', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );
END $$;

DROP FUNCTION IF EXISTS public.seed_question_with_options(TEXT, TEXT, INTEGER, NUMERIC, TEXT[], NUMERIC[]);
