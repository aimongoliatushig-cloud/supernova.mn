// ─── Health check static data ─────────────────────────────────────────────
// Used for client-side rendering before Supabase dynamic data is loaded.

export interface Category {
  id: string
  name: string
  icon: string
  description: string
}

export interface QuestionOption {
  id: string
  text: string
  riskScore: number
}

export interface Question {
  id: string
  categoryId: string
  text: string
  type: 'single' | 'multiple' | 'slider'
  options?: QuestionOption[]
  sliderMin?: number
  sliderMax?: number
  sliderUnit?: string
  riskWeight: number
}

export const CATEGORIES: Category[] = [
  { id: 'heart',    name: 'Зүрх',                    icon: '❤️',  description: 'Зүрх, цусны эргэлттэй холбоотой зовиурууд' },
  { id: 'bp',       name: 'Даралт',                  icon: '🩺',  description: 'Цусны даралт, тархины судасны зовиурууд' },
  { id: 'stomach',  name: 'Ходоод',                  icon: '🫃',  description: 'Хоол боловсруулах замын зовиурууд' },
  { id: 'liver',    name: 'Элэг',                    icon: '🫀',  description: 'Элэг, цөсний зовиурууд' },
  { id: 'kidney',   name: 'Бөөр',                    icon: '🫘',  description: 'Бөөр, шээсний замын зовиурууд' },
  { id: 'thyroid',  name: 'Бамбай булчирхай',        icon: '🦋',  description: 'Бамбай булчирхайн зовиурууд' },
  { id: 'women',    name: 'Эмэгтэйчүүд',             icon: '🌸',  description: 'Эмэгтэйчүүдийн эрүүл мэнд' },
  { id: 'bone',     name: 'Яс үе',                   icon: '🦴',  description: 'Яс, үе мөч, нуруу, булчин' },
  { id: 'digestive',name: 'Хоол боловсруулах эрхтэн',icon: '🌡️',  description: 'Гэдэс, хоол боловсруулах эрхтэн' },
  { id: 'hormone',  name: 'Даавар',                  icon: '⚗️',  description: 'Дааврын зохицуулалт' },
]

export const QUESTIONS: Record<string, Question[]> = {
  heart: [
    {
      id: 'h1', categoryId: 'heart', riskWeight: 2.0,
      text: 'Цээжний өвдөлт мэдрэгдэж байна уу?',
      type: 'single',
      options: [
        { id: 'h1a', text: 'Байнга',                           riskScore: 3 },
        { id: 'h1b', text: 'Заримдаа',                         riskScore: 1.5 },
        { id: 'h1c', text: 'Биеийн хүчний дасгалаар',         riskScore: 2 },
        { id: 'h1d', text: 'Үгүй',                             riskScore: 0 },
      ],
    },
    {
      id: 'h2', categoryId: 'heart', riskWeight: 1.5,
      text: 'Зүрх тогтмол бус дэлсэх, тасарч мэдрэгдэх тохиолдол байна уу?',
      type: 'single',
      options: [
        { id: 'h2a', text: 'Тийм, байнга',    riskScore: 3 },
        { id: 'h2b', text: 'Заримдаа',        riskScore: 1.5 },
        { id: 'h2c', text: 'Үгүй',            riskScore: 0 },
      ],
    },
    {
      id: 'h3', categoryId: 'heart', riskWeight: 1.5,
      text: 'Амьсгаадах, хурдан ядрах тохиолдол байна уу?',
      type: 'single',
      options: [
        { id: 'h3a', text: 'Тийм, байнга',      riskScore: 2.5 },
        { id: 'h3b', text: 'Идэвхтэй хөдөлгөөнд', riskScore: 1 },
        { id: 'h3c', text: 'Үгүй',               riskScore: 0 },
      ],
    },
    {
      id: 'h4', categoryId: 'heart', riskWeight: 1.0,
      text: 'Хөл, гар хавдаж байна уу?',
      type: 'single',
      options: [
        { id: 'h4a', text: 'Тийм', riskScore: 2 },
        { id: 'h4b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'h5', categoryId: 'heart', riskWeight: 1.0,
      text: 'Зовиур хэдэн хоногийн өмнөөс эхэлсэн бэ?',
      type: 'single',
      options: [
        { id: 'h5a', text: 'Өнөөдөр',            riskScore: 3 },
        { id: 'h5b', text: 'Хэдэн өдрийн өмнө',  riskScore: 2 },
        { id: 'h5c', text: 'Долоо хоногийн өмнө', riskScore: 1.5 },
        { id: 'h5d', text: 'Сараас дээш',         riskScore: 1 },
      ],
    },
  ],
  bp: [
    {
      id: 'bp1', categoryId: 'bp', riskWeight: 1.5,
      text: 'Толгой өвдөх, эргэх мэдрэгдэж байна уу?',
      type: 'single',
      options: [
        { id: 'bp1a', text: 'Байнга',     riskScore: 2.5 },
        { id: 'bp1b', text: 'Заримдаа',   riskScore: 1 },
        { id: 'bp1c', text: 'Үгүй',       riskScore: 0 },
      ],
    },
    {
      id: 'bp2', categoryId: 'bp', riskWeight: 2.0,
      text: 'Нүд бүдгэрэх, харанхуйлах тохиолдол байна уу?',
      type: 'single',
      options: [
        { id: 'bp2a', text: 'Тийм, байнга',      riskScore: 3 },
        { id: 'bp2b', text: 'Заримдаа',           riskScore: 1.5 },
        { id: 'bp2c', text: 'Үгүй',               riskScore: 0 },
      ],
    },
    {
      id: 'bp3', categoryId: 'bp', riskWeight: 2.0,
      text: 'Тэнцвэр алдах, унах дөхсөн мэдрэмж байна уу?',
      type: 'single',
      options: [
        { id: 'bp3a', text: 'Тийм', riskScore: 3 },
        { id: 'bp3b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'bp4', categoryId: 'bp', riskWeight: 1.0,
      text: 'Даралт хэмжиж байсан уу? Хэр их байна вэ?',
      type: 'single',
      options: [
        { id: 'bp4a', text: '140/90 буюу түүнээс дээш',  riskScore: 3 },
        { id: 'bp4b', text: '120/80 – 139/89',            riskScore: 1.5 },
        { id: 'bp4c', text: '120/80 хүртэл (хэвийн)',     riskScore: 0 },
        { id: 'bp4d', text: 'Хэмжиж байгаагүй',           riskScore: 1 },
      ],
    },
    {
      id: 'bp5', categoryId: 'bp', riskWeight: 0.5,
      text: 'Зовиур өдрийн аль цагт хурцддаг вэ?',
      type: 'single',
      options: [
        { id: 'bp5a', text: 'Өглөө эрт',         riskScore: 1.5 },
        { id: 'bp5b', text: 'Стресстэй үед',      riskScore: 2 },
        { id: 'bp5c', text: 'Тогтмол биш',        riskScore: 1 },
        { id: 'bp5d', text: 'Тодорхойгүй',        riskScore: 0.5 },
      ],
    },
  ],
  stomach: [
    {
      id: 's1', categoryId: 'stomach', riskWeight: 1.5,
      text: 'Хэвлийн өвдөлт байна уу?',
      type: 'single',
      options: [
        { id: 's1a', text: 'Тийм, байнга',            riskScore: 3 },
        { id: 's1b', text: 'Хоол идсэний дараа',       riskScore: 2 },
        { id: 's1c', text: 'Заримдаа',                 riskScore: 1 },
        { id: 's1d', text: 'Үгүй',                     riskScore: 0 },
      ],
    },
    {
      id: 's2', categoryId: 'stomach', riskWeight: 1.0,
      text: 'Дотор муухайрах, бөөлжих тохиолдол байна уу?',
      type: 'single',
      options: [
        { id: 's2a', text: 'Байнга',    riskScore: 2.5 },
        { id: 's2b', text: 'Заримдаа', riskScore: 1 },
        { id: 's2c', text: 'Үгүй',     riskScore: 0 },
      ],
    },
    {
      id: 's3', categoryId: 'stomach', riskWeight: 1.0,
      text: 'Суулгах, өтгөн хаталт байна уу?',
      type: 'single',
      options: [
        { id: 's3a', text: 'Суулга байна',    riskScore: 1.5 },
        { id: 's3b', text: 'Хаталт байна',   riskScore: 1 },
        { id: 's3c', text: 'Аль аль нь',      riskScore: 2 },
        { id: 's3d', text: 'Үгүй',            riskScore: 0 },
      ],
    },
    {
      id: 's4', categoryId: 'stomach', riskWeight: 3.0,
      text: 'Цус бүхий ялгадас гарч байна уу?',
      type: 'single',
      options: [
        { id: 's4a', text: 'Тийм', riskScore: 4 },
        { id: 's4b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 's5', categoryId: 'stomach', riskWeight: 1.0,
      text: 'Хоол идэхгүй болох, жин хасах зовиур байна уу?',
      type: 'single',
      options: [
        { id: 's5a', text: 'Тийм', riskScore: 2 },
        { id: 's5b', text: 'Үгүй', riskScore: 0 },
      ],
    },
  ],
  liver: [
    {
      id: 'l1', categoryId: 'liver', riskWeight: 2.0,
      text: 'Арьс, нүд шарлаж байна уу?',
      type: 'single',
      options: [
        { id: 'l1a', text: 'Тийм', riskScore: 4 },
        { id: 'l1b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'l2', categoryId: 'liver', riskWeight: 1.5,
      text: 'Баруун талын хэвлийн дахь дискомфорт байна уу?',
      type: 'single',
      options: [
        { id: 'l2a', text: 'Тийм, байнга',  riskScore: 2.5 },
        { id: 'l2b', text: 'Заримдаа',      riskScore: 1 },
        { id: 'l2c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'l3', categoryId: 'liver', riskWeight: 1.0,
      text: 'Ерөнхий ядрах, идэх дургүй байна уу?',
      type: 'single',
      options: [
        { id: 'l3a', text: 'Тийм', riskScore: 1.5 },
        { id: 'l3b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'l4', categoryId: 'liver', riskWeight: 1.5,
      text: 'Архи, өөх тос ихтэй хоол их хэрэглэдэг үү?',
      type: 'single',
      options: [
        { id: 'l4a', text: 'Архи байнга хэрэглэнэ',       riskScore: 3 },
        { id: 'l4b', text: 'Өөх тос ихтэй хоол их иднэ',  riskScore: 2 },
        { id: 'l4c', text: 'Аль аль нь',                   riskScore: 3.5 },
        { id: 'l4d', text: 'Үгүй',                         riskScore: 0 },
      ],
    },
    {
      id: 'l5', categoryId: 'liver', riskWeight: 1.0,
      text: 'Элэгний өвчин байсан уу? (вирусын гепатит г.м.)',
      type: 'single',
      options: [
        { id: 'l5a', text: 'Тийм',         riskScore: 2.5 },
        { id: 'l5b', text: 'Тодорхойгүй', riskScore: 1 },
        { id: 'l5c', text: 'Үгүй',         riskScore: 0 },
      ],
    },
  ],
  kidney: [
    {
      id: 'k1', categoryId: 'kidney', riskWeight: 2.0,
      text: 'Шээх үед өвдөлт, шатаах мэдрэмж байна уу?',
      type: 'single',
      options: [
        { id: 'k1a', text: 'Тийм', riskScore: 3 },
        { id: 'k1b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'k2', categoryId: 'kidney', riskWeight: 2.5,
      text: 'Цус шээж байна уу?',
      type: 'single',
      options: [
        { id: 'k2a', text: 'Тийм', riskScore: 4 },
        { id: 'k2b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'k3', categoryId: 'kidney', riskWeight: 1.5,
      text: 'Нуруу (бэлхүүс) өвдөх, хавдах байна уу?',
      type: 'single',
      options: [
        { id: 'k3a', text: 'Тийм, байнга',  riskScore: 2.5 },
        { id: 'k3b', text: 'Заримдаа',      riskScore: 1 },
        { id: 'k3c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'k4', categoryId: 'kidney', riskWeight: 1.0,
      text: 'Шээх давтамж нэмэгдэж байна уу?',
      type: 'single',
      options: [
        { id: 'k4a', text: 'Тийм, маш их',  riskScore: 2 },
        { id: 'k4b', text: 'Заримдаа',      riskScore: 1 },
        { id: 'k4c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'k5', categoryId: 'kidney', riskWeight: 1.0,
      text: 'Нүүр, гар, хөл хавдаж байна уу?',
      type: 'single',
      options: [
        { id: 'k5a', text: 'Тийм', riskScore: 2 },
        { id: 'k5b', text: 'Үгүй', riskScore: 0 },
      ],
    },
  ],
  thyroid: [
    {
      id: 't1', categoryId: 'thyroid', riskWeight: 1.5,
      text: 'Хүзүүний урд хэсэгт хавдар, бөмбөгцөр мэдрэгдэж байна уу?',
      type: 'single',
      options: [
        { id: 't1a', text: 'Тийм', riskScore: 3 },
        { id: 't1b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 't2', categoryId: 'thyroid', riskWeight: 1.5,
      text: 'Жин хурдан нэмэгдэх эсвэл хасагдаж байна уу?',
      type: 'single',
      options: [
        { id: 't2a', text: 'Жин нэмэгдэж байна',  riskScore: 2 },
        { id: 't2b', text: 'Жин хасагдаж байна',  riskScore: 2.5 },
        { id: 't2c', text: 'Өөрчлөлт байхгүй',    riskScore: 0 },
      ],
    },
    {
      id: 't3', categoryId: 'thyroid', riskWeight: 1.0,
      text: 'Ядрах, унтах дургүй байх, эсвэл сэрхий байх тохиолдол байна уу?',
      type: 'single',
      options: [
        { id: 't3a', text: 'Маш ядаргаатай',    riskScore: 2 },
        { id: 't3b', text: 'Сэрхий, тайван бус', riskScore: 2 },
        { id: 't3c', text: 'Хэвийн',             riskScore: 0 },
      ],
    },
    {
      id: 't4', categoryId: 'thyroid', riskWeight: 1.0,
      text: 'Халуун, хүйтэнд ихэр мэдрэмтгий болж байна уу?',
      type: 'single',
      options: [
        { id: 't4a', text: 'Тийм, халуунд мэдрэмтгий',  riskScore: 2 },
        { id: 't4b', text: 'Тийм, хүйтэнд мэдрэмтгий',  riskScore: 2 },
        { id: 't4c', text: 'Үгүй',                       riskScore: 0 },
      ],
    },
    {
      id: 't5', categoryId: 'thyroid', riskWeight: 0.5,
      text: 'Гэр бүлд бамбай булчирхайн өвчин байсан уу?',
      type: 'single',
      options: [
        { id: 't5a', text: 'Тийм',         riskScore: 1.5 },
        { id: 't5b', text: 'Тодорхойгүй', riskScore: 0.5 },
        { id: 't5c', text: 'Үгүй',         riskScore: 0 },
      ],
    },
  ],
  women: [
    {
      id: 'w1', categoryId: 'women', riskWeight: 1.5,
      text: 'Сарын тэмдэгт хэвийн бус өөрчлөлт байна уу?',
      type: 'single',
      options: [
        { id: 'w1a', text: 'Тийм, тогтмол бус',    riskScore: 2 },
        { id: 'w1b', text: 'Маш их эсвэл маш бага', riskScore: 2.5 },
        { id: 'w1c', text: 'Зогссон',                riskScore: 2 },
        { id: 'w1d', text: 'Хэвийн',                 riskScore: 0 },
      ],
    },
    {
      id: 'w2', categoryId: 'women', riskWeight: 2.0,
      text: 'Хэвлийн доод хэсгийн өвдөлт байна уу?',
      type: 'single',
      options: [
        { id: 'w2a', text: 'Байнга',    riskScore: 3 },
        { id: 'w2b', text: 'Заримдаа', riskScore: 1.5 },
        { id: 'w2c', text: 'Үгүй',     riskScore: 0 },
      ],
    },
    {
      id: 'w3', categoryId: 'women', riskWeight: 1.0,
      text: 'Маммографи, умайн хүзүүний шинжилгээ хийлгэж байсан уу?',
      type: 'single',
      options: [
        { id: 'w3a', text: '1 жилийн дотор хийлгэсэн', riskScore: 0 },
        { id: 'w3b', text: '1-3 жилийн өмнө',           riskScore: 1 },
        { id: 'w3c', text: 'Хийлгэж байгаагүй',         riskScore: 2.5 },
      ],
    },
    {
      id: 'w4', categoryId: 'women', riskWeight: 1.5,
      text: 'Хэвлийн доод хэсэгт хавдар мэдрэгдэж байна уу?',
      type: 'single',
      options: [
        { id: 'w4a', text: 'Тийм', riskScore: 3 },
        { id: 'w4b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'w5', categoryId: 'women', riskWeight: 1.0,
      text: 'Нас хэд вэ?',
      type: 'single',
      options: [
        { id: 'w5a', text: '18-35',  riskScore: 0.5 },
        { id: 'w5b', text: '36-50',  riskScore: 1 },
        { id: 'w5c', text: '51+',    riskScore: 1.5 },
      ],
    },
  ],
  bone: [
    {
      id: 'b1', categoryId: 'bone', riskWeight: 1.5,
      text: 'Нуруу өвдөж байна уу?',
      type: 'single',
      options: [
        { id: 'b1a', text: 'Байнга',                riskScore: 2.5 },
        { id: 'b1b', text: 'Ажил хийх үед',         riskScore: 1.5 },
        { id: 'b1c', text: 'Тухайн тохиолдолд',     riskScore: 1 },
        { id: 'b1d', text: 'Үгүй',                  riskScore: 0 },
      ],
    },
    {
      id: 'b2', categoryId: 'bone', riskWeight: 1.0,
      text: 'Үе мөч хавдаж, улайж байна уу?',
      type: 'single',
      options: [
        { id: 'b2a', text: 'Тийм, байнга',  riskScore: 3 },
        { id: 'b2b', text: 'Заримдаа',      riskScore: 1.5 },
        { id: 'b2c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'b3', categoryId: 'bone', riskWeight: 1.0,
      text: 'Хөдөлгөөн хязгаарлагдаж байна уу?',
      type: 'single',
      options: [
        { id: 'b3a', text: 'Тийм, маш их',  riskScore: 3 },
        { id: 'b3b', text: 'Бага зэрэг',    riskScore: 1.5 },
        { id: 'b3c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'b4', categoryId: 'bone', riskWeight: 1.0,
      text: 'Гар, хөлд мэдрэмж буурах, хурч мэдрэгдэх байна уу?',
      type: 'single',
      options: [
        { id: 'b4a', text: 'Тийм', riskScore: 2 },
        { id: 'b4b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'b5', categoryId: 'bone', riskWeight: 0.5,
      text: 'Ямар нас хэд вэ?',
      type: 'single',
      options: [
        { id: 'b5a', text: '20-39', riskScore: 0.5 },
        { id: 'b5b', text: '40-59', riskScore: 1 },
        { id: 'b5c', text: '60+',   riskScore: 2 },
      ],
    },
  ],
  digestive: [
    {
      id: 'd1', categoryId: 'digestive', riskWeight: 1.5,
      text: 'Гэдэс хий, хавдах мэдрэмж байна уу?',
      type: 'single',
      options: [
        { id: 'd1a', text: 'Байнга',    riskScore: 2 },
        { id: 'd1b', text: 'Заримдаа', riskScore: 1 },
        { id: 'd1c', text: 'Үгүй',     riskScore: 0 },
      ],
    },
    {
      id: 'd2', categoryId: 'digestive', riskWeight: 1.0,
      text: 'Цатгаах (хоол залгихад хэцүү) байна уу?',
      type: 'single',
      options: [
        { id: 'd2a', text: 'Тийм', riskScore: 2.5 },
        { id: 'd2b', text: 'Үгүй', riskScore: 0 },
      ],
    },
    {
      id: 'd3', categoryId: 'digestive', riskWeight: 1.0,
      text: 'Хоолны дараа хоол дараад өгдөг үү?',
      type: 'single',
      options: [
        { id: 'd3a', text: 'Байнга',    riskScore: 2 },
        { id: 'd3b', text: 'Заримдаа', riskScore: 1 },
        { id: 'd3c', text: 'Үгүй',     riskScore: 0 },
      ],
    },
    {
      id: 'd4', categoryId: 'digestive', riskWeight: 1.5,
      text: 'Гэдэс болгоохоо дагалдсан гэдсэний өвдөлт байна уу?',
      type: 'single',
      options: [
        { id: 'd4a', text: 'Тийм, байнга',  riskScore: 2.5 },
        { id: 'd4b', text: 'Заримдаа',      riskScore: 1 },
        { id: 'd4c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'd5', categoryId: 'digestive', riskWeight: 1.0,
      text: 'Хоол боловсруулах замын өвчин байсан уу?',
      type: 'single',
      options: [
        { id: 'd5a', text: 'Тийм, урьд нь оношлогдсон',  riskScore: 2 },
        { id: 'd5b', text: 'Тодорхойгүй',                riskScore: 1 },
        { id: 'd5c', text: 'Үгүй',                        riskScore: 0 },
      ],
    },
  ],
  hormone: [
    {
      id: 'ho1', categoryId: 'hormone', riskWeight: 1.5,
      text: 'Жин хяналтгүй нэмэгдэх эсвэл хасагдаж байна уу?',
      type: 'single',
      options: [
        { id: 'ho1a', text: 'Жин нэмэгдэж байна',  riskScore: 2 },
        { id: 'ho1b', text: 'Жин хасагдаж байна',  riskScore: 2 },
        { id: 'ho1c', text: 'Тогтвортой',            riskScore: 0 },
      ],
    },
    {
      id: 'ho2', categoryId: 'hormone', riskWeight: 1.5,
      text: 'Дотроо халуурах, хөлрөх тохиолдол байна уу?',
      type: 'single',
      options: [
        { id: 'ho2a', text: 'Тийм, байнга',  riskScore: 2.5 },
        { id: 'ho2b', text: 'Заримдаа',      riskScore: 1 },
        { id: 'ho2c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'ho3', categoryId: 'hormone', riskWeight: 1.0,
      text: 'Ядрах, сэтгэл санааны хувьд буурсан мэдрэгдэж байна уу?',
      type: 'single',
      options: [
        { id: 'ho3a', text: 'Тийм, байнга',  riskScore: 2 },
        { id: 'ho3b', text: 'Заримдаа',      riskScore: 1 },
        { id: 'ho3c', text: 'Үгүй',          riskScore: 0 },
      ],
    },
    {
      id: 'ho4', categoryId: 'hormone', riskWeight: 1.0,
      text: 'Цусны сахарын шинжилгээ хийлгэж байсан уу?',
      type: 'single',
      options: [
        { id: 'ho4a', text: '1 жилийн дотор — хэвийн',       riskScore: 0 },
        { id: 'ho4b', text: '1 жилийн дотор — өндөр',        riskScore: 3 },
        { id: 'ho4c', text: 'Хийлгэж байгаагүй',              riskScore: 1.5 },
      ],
    },
    {
      id: 'ho5', categoryId: 'hormone', riskWeight: 1.0,
      text: 'Гэр бүлд чихрийн шижин байна уу?',
      type: 'single',
      options: [
        { id: 'ho5a', text: 'Тийм', riskScore: 2 },
        { id: 'ho5b', text: 'Үгүй', riskScore: 0 },
      ],
    },
  ],
}

// ─── Risk calculation ─────────────────────────────────────────────────────────

export interface AnswerMap {
  [questionId: string]: string   // option id
}

export function calculateRisk(
  selectedCategories: string[],
  answers: AnswerMap
): { score: number; level: 'low' | 'medium' | 'high' } {
  let totalWeightedRisk = 0
  let totalWeight = 0

  for (const catId of selectedCategories) {
    const questions = QUESTIONS[catId] ?? []
    for (const q of questions) {
      const answeredOptionId = answers[q.id]
      if (!answeredOptionId) continue
      const option = q.options?.find((o) => o.id === answeredOptionId)
      if (option) {
        totalWeightedRisk += option.riskScore * q.riskWeight
        totalWeight += 4 * q.riskWeight   // max score is 4
      }
    }
  }

  if (totalWeight === 0) return { score: 0, level: 'low' }

  const score = Math.min(100, Math.round((totalWeightedRisk / totalWeight) * 100))
  const level = score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low'

  return { score, level }
}
