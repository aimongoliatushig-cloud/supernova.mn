-- SUPERNOVA admin engine seed additions
-- Run after seed.sql, seed-v2.sql, and schema-v3.sql

UPDATE services
SET promotion_flag = TRUE
WHERE name ILIKE '%иж бүрэн%'
   OR name ILIKE '%зүрх%'
   OR name ILIKE '%эмэгтэй%';

UPDATE symptom_categories
SET slug = CASE name
  WHEN 'Зүрх' THEN 'zurh'
  WHEN 'Даралт' THEN 'daralt'
  WHEN 'Ходоод' THEN 'hodood'
  WHEN 'Элэг' THEN 'eleg'
  WHEN 'Бөөр' THEN 'boor'
  WHEN 'Бамбай булчирхай' THEN 'bambai'
  WHEN 'Эмэгтэйчүүд' THEN 'emegteichuud'
  WHEN 'Яс үе' THEN 'yas-ue'
  WHEN 'Хоол боловсруулах эрхтэн' THEN 'hool-bolovsruulah'
  WHEN 'Даавар' THEN 'daavar'
  ELSE slug
END
WHERE slug IS NULL;

UPDATE questions
SET is_active = TRUE
WHERE is_active IS DISTINCT FROM TRUE;

UPDATE answer_options
SET is_active = TRUE
WHERE is_active IS DISTINCT FROM TRUE;

INSERT INTO landing_page_content (key, value, label, section)
VALUES
  ('vision_title', 'Бидний алсын хараа', 'Алсын харааны гарчиг', 'values'),
  ('vision_body', 'Япон улсын жишигт нийцсэн, итгэл төрүүлэхүйц эрт оношилгоог Монгол хүн бүрт ойртуулах.', 'Алсын харааны тайлбар', 'values'),
  ('value_1_title', 'Японы стандарт', 'Үнэт зүйл 1 гарчиг', 'values'),
  ('value_1_body', 'Оношилгоо, үйлчилгээ, тайлангийн урсгал бүр чанарын хяналттай ажиллана.', 'Үнэт зүйл 1 тайлбар', 'values'),
  ('value_2_title', 'Нууцлал ба аюулгүй байдал', 'Үнэт зүйл 2 гарчиг', 'values'),
  ('value_2_body', 'Өвчтөний мэдээлэл зөвхөн эмнэлгийн үйлчилгээ, follow-up, CRM хяналтын зорилгоор ашиглагдана.', 'Үнэт зүйл 2 тайлбар', 'values'),
  ('value_3_title', 'Эрт илрүүлэлтэд төвлөрсөн үйлчилгээ', 'Үнэт зүйл 3 гарчиг', 'values'),
  ('value_3_body', 'Дижитал асуулга, эмчийн цаг, үнэгүй зөвлөгөө, CRM хяналт нэг урсгалаар ажиллана.', 'Үнэт зүйл 3 тайлбар', 'values'),
  ('privacy_notice', 'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.', 'Нууцлалын мэдэгдэл', 'trust'),
  ('contact_title', 'Холбоо барих', 'Холбоо барих гарчиг', 'contact'),
  ('result_low_label', 'Бага эрсдэл', 'Low label', 'result'),
  ('result_low_message', 'Одоогийн байдлаар яаралтай эрсдэл харагдсангүй. Урьдчилан сэргийлэх үзлэгээ тогтмол хийлгээрэй.', 'Low message', 'result'),
  ('result_low_urgency', 'Ойрын 1-2 долоо хоногт', 'Low urgency', 'result'),
  ('result_medium_label', 'Дунд эрсдэл', 'Medium label', 'result'),
  ('result_medium_message', 'Эрт үзлэг, нарийвчилсан оношилгоо хийлгэвэл эрсдэлийг эрт хянах боломжтой.', 'Medium message', 'result'),
  ('result_medium_urgency', 'Ойрын 3-7 хоногт', 'Medium urgency', 'result'),
  ('result_high_label', 'Өндөр эрсдэл', 'High label', 'result'),
  ('result_high_message', 'Таны хариулт эмчийн үнэлгээ, нэмэлт шинжилгээ шаардлагатайг илтгэж байна.', 'High message', 'result'),
  ('result_high_urgency', 'Өнөөдөр эсвэл маргааш', 'High urgency', 'result')
ON CONFLICT (key) DO NOTHING;
