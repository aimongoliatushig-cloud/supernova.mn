import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const serviceCategoryMap = {
  'Зүрхний иж бүрэн шинжилгээ': 'Зүрх судасны',
  'Ходоод, гэдэсний дуран': 'Хоол боловсруулах',
  'Элэгний иж бүрэн шинжилгээ': 'Хоол боловсруулах',
  'Бөөрний шинжилгээ': 'Бөөр, шээсний',
  'Бамбай булчирхайн шинжилгээ': 'Дааврын',
  'Эмэгтэйчүүдийн иж бүрэн шинжилгээ': 'Эмэгтэйчүүдийн',
  'Яс нягтралын шинжилгээ (DEXA)': 'Яс, үе мөч',
  'Иж бүрэн эрүүл мэндийн үзлэг': 'Иж бүрэн үзлэг',
}

const doctorServiceMap = {
  'Б. Баясгалан': [
    'Ходоод, гэдэсний дуран',
    'Элэгний иж бүрэн шинжилгээ',
    'Иж бүрэн эрүүл мэндийн үзлэг',
  ],
  'Б. Будсүрэн': [
    'Иж бүрэн эрүүл мэндийн үзлэг',
    'Бөөрний шинжилгээ',
    'Бамбай булчирхайн шинжилгээ',
  ],
  'Г. Батцэцэг': ['Зүрхний иж бүрэн шинжилгээ', 'Иж бүрэн эрүүл мэндийн үзлэг'],
  'Д. Номин-эрдэнэ': [
    'Элэгний иж бүрэн шинжилгээ',
    'Бөөрний шинжилгээ',
    'Бамбай булчирхайн шинжилгээ',
    'Эмэгтэйчүүдийн иж бүрэн шинжилгээ',
    'Яс нягтралын шинжилгээ (DEXA)',
  ],
}

const yesNoOptions = ['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй']
const yesNoScores = [3.0, 1.5, 0.5, 0.0]

const diagnosisData = {
  'Зүрх': [
    {
      text: 'Цээжний өвдөлт мэдрэгдэж байна уу?',
      sort: 1,
      weight: 2.0,
      options: yesNoOptions,
      scores: yesNoScores,
    },
    {
      text: 'Зүрх тогтмол бус дэлсэж, эсвэл тасарч мэдрэгдэж байна уу?',
      sort: 2,
      weight: 1.5,
      options: ['Тийм, өдөр бүр', '7 хоногт хэд хэд', 'Хааяа', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Хөл, гар хавдаж байна уу?',
      sort: 3,
      weight: 1.0,
      options: ['Тийм, өдөр бүр', 'Оройдоо', 'Хааяа', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
    {
      text: 'Амьсгаадах, хурдан ядрах тохиолдол байна уу?',
      sort: 4,
      weight: 1.5,
      options: ['Байнга', 'Шат өгсөхөд', 'Хүчтэй ачаалалд л', 'Үгүй'],
      scores: [3.0, 2.0, 0.5, 0.0],
    },
    {
      text: 'Зовиур хэдэн хоногийн өмнөөс эхэлсэн бэ?',
      sort: 5,
      weight: 1.0,
      options: ['Өнөөдөр эсвэл өчигдрөөс', '3-7 хоног', '1-4 долоо хоног', '1 сараас дээш'],
      scores: [0.5, 1.0, 2.0, 3.0],
    },
  ],
  'Даралт': [
    {
      text: 'Толгой өвдөх, эргэх мэдрэгдэж байна уу?',
      sort: 1,
      weight: 1.5,
      options: yesNoOptions,
      scores: yesNoScores,
    },
    {
      text: 'Даралтаа хэмжиж байна уу? Хэдэн mm/Hg байна вэ?',
      sort: 2,
      weight: 1.0,
      options: [
        '140/90-с дээш тогтмол',
        '130-139 / 85-89 орчим',
        '120-129 / 80-84 орчим',
        'Хэвийн эсвэл тогтмол хэмждэггүй',
      ],
      scores: [3.0, 2.0, 1.0, 0.0],
    },
    {
      text: 'Нүд бүдгэрэх, харанхуйлах тохиолдол байна уу?',
      sort: 3,
      weight: 2.0,
      options: ['Тийм, олон удаа', 'Заримдаа', 'Ховор', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Тэнцвэр алдах, унах дөхсөн мэдрэмж байна уу?',
      sort: 4,
      weight: 2.0,
      options: ['Тийм, давтагддаг', 'Сүүлийн үед 1-2 удаа', 'Ховор', 'Үгүй'],
      scores: [3.0, 2.0, 0.5, 0.0],
    },
    {
      text: 'Зовиур өдрийн аль цагт хурцддаг вэ?',
      sort: 5,
      weight: 0.5,
      options: ['Өглөө', 'Өдөр', 'Орой', 'Бараг бүтэн өдөр'],
      scores: [1.5, 1.0, 1.5, 2.5],
    },
  ],
  'Ходоод': [
    {
      text: 'Хэвлийн өвдөлт байна уу? Хаана байрладаг вэ?',
      sort: 1,
      weight: 1.5,
      options: ['Ходоодны дээд хэсэг', 'Хүйсний орчим', 'Баруун хавирганы доор', 'Өвдөлтгүй / тодорхойгүй'],
      scores: [2.0, 1.5, 2.5, 0.0],
    },
    {
      text: 'Дотор муухайрах, бөөлжих тохиолдол байна уу?',
      sort: 2,
      weight: 1.0,
      options: yesNoOptions,
      scores: yesNoScores,
    },
    {
      text: 'Суулгах, өтгөн хаталт байна уу?',
      sort: 3,
      weight: 1.0,
      options: ['Тогтмол', 'Заримдаа', 'Ховор', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
    {
      text: 'Хоол идсэний дараа өвдөлт нэмэгдэж байна уу?',
      sort: 4,
      weight: 1.5,
      options: ['Тийм, бараг үргэлж', 'Заримдаа', 'Ховор', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Цус бүхий ялгадас гарч байна уу?',
      sort: 5,
      weight: 3.0,
      options: ['Тийм, олон удаа', 'Тийм, 1-2 удаа', 'Эргэлзээтэй', 'Үгүй'],
      scores: [4.0, 3.0, 1.0, 0.0],
    },
  ],
  'Элэг': [
    {
      text: 'Баруун хавирганы доор хөндүүр, дарж өвдөх мэдрэмж байна уу?',
      sort: 1,
      weight: 1.5,
      options: yesNoOptions,
      scores: yesNoScores,
    },
    {
      text: 'Арьс, нүд шарлах эсвэл шээс бараантах шинж илэрч байна уу?',
      sort: 2,
      weight: 2.5,
      options: ['Тийм, аль аль нь', 'Нэг нь ажиглагдсан', 'Эргэлзээтэй', 'Үгүй'],
      scores: [4.0, 2.5, 1.0, 0.0],
    },
    {
      text: 'Тослог хоолны дараа дотор эвгүйрхэж, гашуун оргих уу?',
      sort: 3,
      weight: 1.5,
      options: ['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Сүүлийн үед ядрах, хоолны дуршил буурах шинж байна уу?',
      sort: 4,
      weight: 1.0,
      options: ['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
    {
      text: 'Элэгний өвчний түүх эсвэл архины тогтмол хэрэглээ байдаг уу?',
      sort: 5,
      weight: 1.5,
      options: ['Тийм, аль аль нь', 'Нэг нь бий', 'Өмнө нь байсан', 'Үгүй'],
      scores: [3.0, 2.0, 1.0, 0.0],
    },
  ],
  'Бөөр': [
    {
      text: 'Бүсэлхий, нурууны доод хэсгээр өвдөж байна уу?',
      sort: 1,
      weight: 1.5,
      options: ['Тийм, байнга', 'Заримдаа', 'Хөдөлгөөнтэй холбоотой', 'Үгүй'],
      scores: [3.0, 1.5, 1.0, 0.0],
    },
    {
      text: 'Шээх үед хорсох, ойр ойрхон шээх шинж байна уу?',
      sort: 2,
      weight: 2.0,
      options: yesNoOptions,
      scores: yesNoScores,
    },
    {
      text: 'Шээсний өнгө өөрчлөгдөх эсвэл цустай харагдах тохиолдол бий юу?',
      sort: 3,
      weight: 2.5,
      options: ['Тийм, тод ажиглагдсан', 'Заримдаа бараан', 'Эргэлзээтэй', 'Үгүй'],
      scores: [4.0, 2.0, 1.0, 0.0],
    },
    {
      text: 'Өглөө нүүр, шагай хавагнах шинж байна уу?',
      sort: 4,
      weight: 1.5,
      options: ['Тийм, өдөр бүр', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Халуурах, даарахтай хавсарсан бөөрний зовиур байна уу?',
      sort: 5,
      weight: 2.0,
      options: ['Тийм, байнга', 'Сүүлийн үед байсан', 'Эргэлзээтэй', 'Үгүй'],
      scores: [3.5, 2.0, 1.0, 0.0],
    },
  ],
  'Бамбай булчирхай': [
    {
      text: 'Жин богино хугацаанд огцом өөрчлөгдөж байна уу?',
      sort: 1,
      weight: 1.5,
      options: ['Тийм, огцом', 'Тийм, бага зэрэг', 'Тогтворгүй', 'Үгүй'],
      scores: [3.0, 1.5, 1.0, 0.0],
    },
    {
      text: 'Зүрх дэлсэх, халууцах эсвэл хөлрөх шинж байна уу?',
      sort: 2,
      weight: 1.5,
      options: yesNoOptions,
      scores: yesNoScores,
    },
    {
      text: 'Хүзүүний урд хэсгээр төвийж томорсон мэдрэмж байна уу?',
      sort: 3,
      weight: 2.0,
      options: ['Тийм, тод мэдрэгдэнэ', 'Бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
      scores: [3.5, 2.0, 1.0, 0.0],
    },
    {
      text: 'Дааруу хүрэх, ядрах, нойрмоглох шинж давамгай байна уу?',
      sort: 4,
      weight: 1.5,
      options: ['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Үс унах, арьс хуурайших, хоолой сөөнгөтөх шинж байна уу?',
      sort: 5,
      weight: 1.0,
      options: ['Тийм, хэд хэдэн шинжтэй', 'Нэг шинж ажиглагдсан', 'Хааяа', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
  ],
  'Эмэгтэйчүүд': [
    {
      text: 'Сарын тэмдгийн мөчлөг тогтворгүй болсон уу?',
      sort: 1,
      weight: 1.5,
      options: ['Тийм, тогтмол алдагддаг', 'Сүүлийн үед өөрчлөгдсөн', 'Хааяа', 'Үгүй'],
      scores: [3.0, 2.0, 0.5, 0.0],
    },
    {
      text: 'Доод хэвлийгээр өвдөх, базлах шинж байнга давтагддаг уу?',
      sort: 2,
      weight: 1.5,
      options: ['Тийм, байнга', 'Заримдаа', 'Сарын тэмдэгтэй холбоотой', 'Үгүй'],
      scores: [3.0, 1.5, 1.0, 0.0],
    },
    {
      text: 'Үтрээнээс хэвийн бус ялгадас эсвэл үнэр гарах шинж байна уу?',
      sort: 3,
      weight: 2.0,
      options: ['Тийм, тод ажиглагдана', 'Заримдаа', 'Эргэлзээтэй', 'Үгүй'],
      scores: [3.0, 1.5, 1.0, 0.0],
    },
    {
      text: 'Сарын тэмдэг хэт их эсвэл удаан үргэлжилдэг үү?',
      sort: 4,
      weight: 2.0,
      options: ['Тийм, байнга', 'Сүүлийн үед', 'Хааяа', 'Үгүй'],
      scores: [3.0, 2.0, 0.5, 0.0],
    },
    {
      text: 'Жирэмслэхээр төлөвлөж байгаа эсвэл дааврын тэнцвэр алдагдсан гэж үзэж байна уу?',
      sort: 5,
      weight: 1.0,
      options: [
        'Тийм, эмчид үзүүлэх шаардлагатай',
        'Тийм, урьдчилан шалгуулмаар байна',
        'Эргэлзээтэй',
        'Үгүй',
      ],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
  ],
  'Яс үе': [
    {
      text: 'Үе мөч хөшиж, өглөө хөдөлгөөнд орохдоо хүндрэлтэй байна уу?',
      sort: 1,
      weight: 1.5,
      options: yesNoOptions,
      scores: yesNoScores,
    },
    {
      text: 'Өвдөг, нуруу, ташаа зэрэгт байнгын өвдөлт байна уу?',
      sort: 2,
      weight: 1.5,
      options: ['Тийм, байнга', 'Алхахад нэмэгддэг', 'Хааяа', 'Үгүй'],
      scores: [3.0, 2.0, 0.5, 0.0],
    },
    {
      text: 'Үеэр хавдах, халуу оргих шинж байна уу?',
      sort: 3,
      weight: 2.0,
      options: ['Тийм, тод ажиглагдана', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Гар, хөл бадайрах эсвэл мэдээ алдах шинж байна уу?',
      sort: 4,
      weight: 1.5,
      options: ['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
    {
      text: 'Өндөр багасах, амархан яс өвдөх эсвэл хугарах эрсдэлтэй юу?',
      sort: 5,
      weight: 2.0,
      options: ['Тийм, өндөр эрсдэлтэй', 'Өмнө нь байсан', 'Эргэлзээтэй', 'Үгүй'],
      scores: [3.5, 2.0, 1.0, 0.0],
    },
  ],
  'Хоол боловсруулах эрхтэн': [
    {
      text: 'Хэвлий дүүрэх, гэдэс хий ихсэх шинж байна уу?',
      sort: 1,
      weight: 1.0,
      options: ['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
    {
      text: 'Цээж хорсох, хүчил оргих шинж байна уу?',
      sort: 2,
      weight: 1.5,
      options: ['Тийм, долоо хоногт хэд хэд', 'Заримдаа', 'Ховор', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Хоолны дуршил буурах эсвэл хоол шингэхгүй байх шинж байна уу?',
      sort: 3,
      weight: 1.5,
      options: ['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
    {
      text: 'Өтгөний хэлбэр, өнгө тогтмол өөрчлөгдөж байна уу?',
      sort: 4,
      weight: 1.5,
      options: ['Тийм, байнга', 'Сүүлийн үед', 'Ховор', 'Үгүй'],
      scores: [3.0, 2.0, 0.5, 0.0],
    },
    {
      text: 'Тайлбарлахад бэрх жин буурах шинж байна уу?',
      sort: 5,
      weight: 2.0,
      options: ['Тийм, мэдэгдэхүйц', 'Бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
      scores: [3.5, 1.5, 1.0, 0.0],
    },
  ],
  'Даавар': [
    {
      text: 'Ядрах, сульдах шинж удаан үргэлжилж байна уу?',
      sort: 1,
      weight: 1.5,
      options: ['Тийм, байнга', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
    {
      text: 'Жин нэмэх эсвэл хасах өөрчлөлт тайлбарлахад хэцүү байна уу?',
      sort: 2,
      weight: 1.5,
      options: ['Тийм, огцом', 'Тийм, бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
      scores: [3.0, 1.5, 1.0, 0.0],
    },
    {
      text: 'Ам цангах, ойр ойрхон өлсөх эсвэл шөнө шээх шинж байна уу?',
      sort: 3,
      weight: 2.0,
      options: ['Тийм, олон шинжтэй', 'Нэг шинж давтагддаг', 'Хааяа', 'Үгүй'],
      scores: [3.5, 2.0, 0.5, 0.0],
    },
    {
      text: 'Сэтгэл санаа савлах, нойр алдагдах шинж байна уу?',
      sort: 4,
      weight: 1.0,
      options: ['Тийм, байнга', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [2.5, 1.5, 0.5, 0.0],
    },
    {
      text: 'Арьс батгаших, үсжилт өөрчлөгдөх эсвэл бэлгийн дуршил буурах шинж байна уу?',
      sort: 5,
      weight: 1.5,
      options: ['Тийм, тод ажиглагдана', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
      scores: [3.0, 1.5, 0.5, 0.0],
    },
  ],
}

function requireData(data, error, context) {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }

  return data ?? []
}

function getQuestionKey(categoryId, questionText) {
  return `${categoryId}::${questionText}`
}

function getOptionKey(questionId, optionText) {
  return `${questionId}::${optionText}`
}

async function ensureQuestionWithOptions(questionCache, optionCache, categoryIdByName, categoryName, question) {
  const categoryId = categoryIdByName.get(categoryName)
  if (!categoryId) {
    return
  }

  const questionKey = getQuestionKey(categoryId, question.text)
  let questionId = questionCache.get(questionKey)

  if (!questionId) {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        category_id: categoryId,
        question_text: question.text,
        question_type: 'single',
        sort_order: question.sort,
        is_required: true,
        is_active: true,
        risk_weight: question.weight,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(`insert question ${question.text}: ${error?.message ?? 'unknown error'}`)
    }

    questionId = data.id
    questionCache.set(questionKey, questionId)
  } else {
    const { error } = await supabase
      .from('questions')
      .update({
        question_type: 'single',
        sort_order: question.sort,
        is_required: true,
        is_active: true,
        risk_weight: question.weight,
      })
      .eq('id', questionId)

    if (error) {
      throw new Error(`update question ${question.text}: ${error.message}`)
    }
  }

  for (let index = 0; index < question.options.length; index += 1) {
    const optionText = question.options[index]
    const riskScore = question.scores[index]
    const optionKey = getOptionKey(questionId, optionText)
    const existingOptionId = optionCache.get(optionKey)

    if (!existingOptionId) {
      const { data, error } = await supabase
        .from('answer_options')
        .insert({
          question_id: questionId,
          option_text: optionText,
          recommendation: null,
          risk_score: riskScore,
          sort_order: index + 1,
          is_active: true,
        })
        .select('id')
        .single()

      if (error || !data) {
        throw new Error(`insert option ${optionText}: ${error?.message ?? 'unknown error'}`)
      }

      optionCache.set(optionKey, data.id)
    } else {
      const { error } = await supabase
        .from('answer_options')
        .update({
          risk_score: riskScore,
          sort_order: index + 1,
          is_active: true,
        })
        .eq('id', existingOptionId)

      if (error) {
        throw new Error(`update option ${optionText}: ${error.message}`)
      }
    }
  }
}

async function run() {
  const serviceCategoryResult = await supabase.from('service_categories').select('id,name')
  const serviceCategories = requireData(
    serviceCategoryResult.data,
    serviceCategoryResult.error,
    'load service categories'
  )
  const serviceCategoryIdByName = new Map(serviceCategories.map((item) => [item.name, item.id]))

  const servicesResult = await supabase
    .from('services')
    .select('id,name,category_id,show_on_result,is_active')
  const services = requireData(servicesResult.data, servicesResult.error, 'load services')
  const serviceIdByName = new Map(services.map((item) => [item.name, item.id]))

  for (const service of services) {
    const nextCategoryName = serviceCategoryMap[service.name]
    const nextCategoryId = nextCategoryName
      ? serviceCategoryIdByName.get(nextCategoryName) ?? null
      : service.category_id
    const nextShowOnResult = service.is_active ? true : service.show_on_result

    if (service.category_id !== nextCategoryId || service.show_on_result !== nextShowOnResult) {
      const { error } = await supabase
        .from('services')
        .update({
          category_id: nextCategoryId,
          show_on_result: nextShowOnResult,
        })
        .eq('id', service.id)

      if (error) {
        throw new Error(`update service ${service.name}: ${error.message}`)
      }
    }
  }

  const doctorsResult = await supabase.from('doctors').select('id,full_name')
  const doctors = requireData(doctorsResult.data, doctorsResult.error, 'load doctors')
  const doctorIdByName = new Map(doctors.map((item) => [item.full_name, item.id]))

  const relations = []
  for (const [doctorName, serviceNames] of Object.entries(doctorServiceMap)) {
    const doctorId = doctorIdByName.get(doctorName)
    if (!doctorId) {
      continue
    }

    for (const serviceName of serviceNames) {
      const serviceId = serviceIdByName.get(serviceName)
      if (!serviceId) {
        continue
      }

      relations.push({
        doctor_id: doctorId,
        service_id: serviceId,
      })
    }
  }

  if (relations.length > 0) {
    const { error } = await supabase
      .from('doctor_services')
      .upsert(relations, { onConflict: 'doctor_id,service_id' })

    if (error) {
      throw new Error(`upsert doctor_services: ${error.message}`)
    }
  }

  const symptomCategoriesResult = await supabase.from('symptom_categories').select('id,name')
  const symptomCategories = requireData(
    symptomCategoriesResult.data,
    symptomCategoriesResult.error,
    'load symptom categories'
  )
  const categoryIdByName = new Map(symptomCategories.map((item) => [item.name, item.id]))

  const existingQuestionsResult = await supabase
    .from('questions')
    .select('id,category_id,question_text')
  const existingQuestions = requireData(
    existingQuestionsResult.data,
    existingQuestionsResult.error,
    'load questions'
  )
  const questionCache = new Map(
    existingQuestions.map((item) => [getQuestionKey(item.category_id, item.question_text), item.id])
  )

  const existingOptionsResult = await supabase
    .from('answer_options')
    .select('id,question_id,option_text')
  const existingOptions = requireData(
    existingOptionsResult.data,
    existingOptionsResult.error,
    'load answer options'
  )
  const optionCache = new Map(
    existingOptions.map((item) => [getOptionKey(item.question_id, item.option_text), item.id])
  )

  for (const [categoryName, questions] of Object.entries(diagnosisData)) {
    for (const question of questions) {
      await ensureQuestionWithOptions(
        questionCache,
        optionCache,
        categoryIdByName,
        categoryName,
        question
      )
    }
  }

  const summaryCategories = [
    'Зүрх',
    'Даралт',
    'Ходоод',
    'Элэг',
    'Бөөр',
    'Бамбай булчирхай',
    'Эмэгтэйчүүд',
    'Яс үе',
    'Хоол боловсруулах эрхтэн',
    'Даавар',
  ]

  for (const categoryName of summaryCategories) {
    const categoryId = categoryIdByName.get(categoryName)
    if (!categoryId) {
      continue
    }

    const categoryQuestionsResult = await supabase
      .from('questions')
      .select('id')
      .eq('category_id', categoryId)
    const categoryQuestions = requireData(
      categoryQuestionsResult.data,
      categoryQuestionsResult.error,
      `load questions for ${categoryName}`
    )
    const questionIds = categoryQuestions.map((item) => item.id)
    const answerCount = questionIds.length
      ? ((await supabase
          .from('answer_options')
          .select('*', { count: 'exact', head: true })
          .in('question_id', questionIds)).count ?? 0)
      : 0

    console.log(`${categoryName}: questions=${questionIds.length} answers=${answerCount}`)
  }

  const doctorServiceCount =
    (await supabase.from('doctor_services').select('*', { count: 'exact', head: true })).count ?? 0
  console.log(`doctor_services=${doctorServiceCount}`)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
