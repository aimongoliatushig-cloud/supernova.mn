export type BodyPart =
  | 'head'
  | 'respiratory'
  | 'heart'
  | 'digestive'
  | 'muscle'
  | 'skin'
  | 'urinary'
  | 'general'

export interface BodyPartInfo {
  id: BodyPart
  emoji: string
  name: string
  symptoms: string[]
}

export const bodyParts: BodyPartInfo[] = [
  {
    id: 'head',
    emoji: '🧠',
    name: 'Толгой / Тархи',
    symptoms: [
      'Толгой өвдөх',
      'Толгой эргэх',
      'Нүд бүдгэрэх',
      'Чих дуугарах',
      'Санах ой муудах',
      'Нойр хүрэх',
      'Нүүр мэдрэхгүй болох',
      'Толгой хүнд байх',
      'Нүдний өвдөлт',
      'Чихний өвдөлт',
      'Хамрын цус гарах',
      'Нүдний улайлт',
    ],
  },
  {
    id: 'respiratory',
    emoji: '🫁',
    name: 'Амьсгал / Цээж',
    symptoms: [
      'Ханиалгах',
      'Хамар гоожих',
      'Хоолой өвдөх',
      'Амьсгаадах',
      'Цэр гарах',
      'Цээж өвдөх',
      'Амьсгал хурдасх',
      'Хоолойд зуулт мэдрэх',
      'Хамар бөглөрөх',
      'Шүүдэр дуу гарах',
      'Цус цэр гарах',
      'Хоолой хурц өвдөх',
    ],
  },
  {
    id: 'heart',
    emoji: '❤️',
    name: 'Зүрх / Судас',
    symptoms: [
      'Зүрх дэлсэх',
      'Цээжний өвдөлт',
      'Гар хөл хавдах',
      'Толгой эргэх',
      'Цусны даралт нэмэгдэх',
      'Зүрх зогсох мэт мэдрэмж',
      'Амьсгаадах',
      'Ядрах',
      'Хөл хөлдөх',
      'Судас дэлсэх',
      'Зүүн гар өвдөх',
      'Хүзүү өвдөх',
    ],
  },
  {
    id: 'digestive',
    emoji: '🫃',
    name: 'Хоол боловсруулах',
    symptoms: [
      'Гэдэс өвдөх',
      'Дотор муухайрах',
      'Бөөлжих',
      'Суулгах',
      'Өтгөн хаталт',
      'Цатгалах',
      'Хоол идэхгүй болох',
      'Гэдэс дүүрэх мэдрэмж',
      'Шарлах',
      'Цусан суулга',
      'Гэдсэний хий',
      'Хоол залгихад хэцүү',
    ],
  },
  {
    id: 'muscle',
    emoji: '💪',
    name: 'Булчин / Яс',
    symptoms: [
      'Нуруу өвдөх',
      'Үе мөч өвдөх',
      'Булчин татах',
      'Хаван',
      'Хөдөлгөөн хязгаарлагдах',
      'Яс өвдөх',
      'Булчин сулрах',
      'Мөр өвдөх',
      'Өвдөг өвдөх',
      'Хүзүү хөшүүрэх',
      'Нуруу хөшүүрэх',
      'Хурууны өвдөлт',
    ],
  },
  {
    id: 'skin',
    emoji: '🧴',
    name: 'Арьс',
    symptoms: [
      'Загатнах',
      'Тууралт гарах',
      'Улайх',
      'Хавдах',
      'Хагарах',
      'Цэврүү гарах',
      'Арьс хуурайших',
      'Үрэвсэх',
      'Шарлах',
      'Хэмхэрэх',
      'Арьс хальслах',
      'Арьсанд шарх гарах',
    ],
  },
  {
    id: 'urinary',
    emoji: '🫀',
    name: 'Шээс / Бэлгийн систем',
    symptoms: [
      'Шээх үед өвдөх',
      'Шээх давтамж нэмэгдэх',
      'Шээсний өнгө өөрчлөгдөх',
      'Нуруу доод хэсэг өвдөх',
      'Шээс хүрэлтгүй болох',
      'Цус шээх',
      'Гипс шээх',
      'Бэлгийн замын үрэвсэл',
      'Хэвлийн доод хэсэг өвдөх',
      'Шээс гацах',
      'Шөнийн шээлт нэмэгдэх',
      'Ялгадасны өнгө өөрчлөгдөх',
    ],
  },
  {
    id: 'general',
    emoji: '🌡️',
    name: 'Ерөнхий',
    symptoms: [
      'Халуурах',
      'Ядрах',
      'Жин хасах',
      'Жин нэмэгдэх',
      'Хоол идэхгүй болох',
      'Шөнө хөлрөх',
      'Суурин бус байх',
      'Эрч хүч буурах',
      'Нойргүйдэх',
      'Стресс',
      'Дархлаа буурах',
      'Биеийн ерөнхий сул байдал',
    ],
  },
]

export type UrgencyLevel = 'emergency' | 'urgent' | 'normal'

export interface TriageResult {
  urgency: UrgencyLevel
  urgencyLabel: string
  urgencyColor: string
  doctorType: string
  advice: string
}

const emergencySymptoms = [
  'Цээжний өвдөлт',
  'Амьсгаадах',
  'Зүрх зогсох мэт мэдрэмж',
  'Цусан суулга',
  'Цус шээх',
  'Нүүр мэдрэхгүй болох',
  'Зүүн гар өвдөх',
  'Цус цэр гарах',
  'Амьсгал хурдасх',
]

export function calculateTriage(
  bodyPart: BodyPart,
  symptoms: string[],
  severity: number
): TriageResult {
  const hasEmergency = symptoms.some((s) => emergencySymptoms.includes(s))

  if (hasEmergency || severity >= 8) {
    return {
      urgency: 'emergency',
      urgencyLabel: 'Яаралтай тусламж шаардлагатай!',
      urgencyColor: 'red',
      doctorType: getDoctorType(bodyPart),
      advice:
        'Яаралтай эмнэлэгт хандана уу! Онцгой байдлын дугаар: 103 эсвэл 105',
    }
  } else if (severity >= 5) {
    return {
      urgency: 'urgent',
      urgencyLabel: 'Эмчид хандаарай',
      urgencyColor: 'yellow',
      doctorType: getDoctorType(bodyPart),
      advice: '24-48 цагийн дотор эмчид үзүүлэхийг зөвлөж байна.',
    }
  } else {
    return {
      urgency: 'normal',
      urgencyLabel: 'Яаралтай биш',
      urgencyColor: 'green',
      doctorType: getDoctorType(bodyPart),
      advice:
        'Ойрын өдрүүдэд эмчид үзүүлэхийг зөвлөж байна. Зовиур улам хүндэрвэл яаралтай эмнэлэгт хандаарай.',
    }
  }
}

function getDoctorType(bodyPart: BodyPart): string {
  const doctorMap: Record<BodyPart, string> = {
    head: 'Мэдрэлийн эмч (Невролог)',
    respiratory: 'Уушигны эмч (Пульмонолог)',
    heart: 'Зүрхний эмч (Кардиолог)',
    digestive: 'Хоол боловсруулахын эмч (Гастроэнтеролог)',
    muscle: 'Яс, үе мөчний эмч (Ортопед / Ревматолог)',
    skin: 'Арьсны эмч (Дерматолог)',
    urinary: 'Шээсний замын эмч (Уролог)',
    general: 'Ерөнхий практикч эмч (Терапевт)',
  }
  return doctorMap[bodyPart]
}

export function getBodyPartById(id: string): BodyPartInfo | undefined {
  return bodyParts.find((bp) => bp.id === id)
}
