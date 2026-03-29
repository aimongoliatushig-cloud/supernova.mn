// ─── Бодит эмч нарын мэдээлэл ────────────────────────────────────────────────
// Зургийг: public/doctors/ фолдерт байршуулна уу
// Нэрлэх дүрэм: bayasgalan.jpg, budsuren.jpg, battsetseg.jpg, nomin.jpg

export interface DoctorData {
  id: string
  name: string          // Монгол нэр
  title: string         // Цол
  specialization: string
  specShort: string     // Богино нэр (карт дээр)
  experience: string
  bio: string
  photo: string         // /doctors/xxx.jpg
  initial: string       // Fallback avatar үсэг
  color: string         // Fallback avatar өнгө
}

export const REAL_DOCTORS: DoctorData[] = [
  {
    id: 'bayasgalan',
    name: 'Б. Баясгалан',
    title: 'Эмч',
    specialization: 'Хоол боловсруулахын дурангийн эмч',
    specShort: 'Гастроэнтеролог / Дурангийн эмч',
    experience: '10+ жил',
    bio: 'Ходоод, гэдэс, арван хоёр нугасны дурангийн шинжилгээ болон хоол боловсруулах замын өвчний оношлогоо, эмчилгээнд мэргэжилтэй.',
    photo: '/doctors/bayasgalan.jpg',
    initial: 'Б',
    color: '#1E63B5',
  },
  {
    id: 'budsuren',
    name: 'Б. Будсүрэн',
    title: 'Эмч',
    specialization: 'Дотрын өвчний эмч',
    specShort: 'Дотрын эмч (Терапевт)',
    experience: '15+ жил',
    bio: 'Дотрын өвчний иж бүрэн оношлогоо, Японы стандартын дагуу эрүүл мэндийн бүрэн үзлэг хийдэг туршлагатай эмч.',
    photo: '/doctors/budsuren.jpg',
    initial: 'Б',
    color: '#7C3AED',
  },
  {
    id: 'battsetseg',
    name: 'Г. Батцэцэг',
    title: 'Эмч',
    specialization: 'Зүрх судасны эмч',
    specShort: 'Кардиолог',
    experience: '12+ жил',
    bio: 'Зүрх судасны өвчний оношлогоо, ЭКГ, ЭХО зүрхний шинжилгээ болон зүрхний хэм алдагдлын эмчилгээнд мэргэжилтэй.',
    photo: '/doctors/battsetseg.jpg',
    initial: 'Г',
    color: '#E8323F',
  },
  {
    id: 'nomin',
    name: 'Д. Номин-эрдэнэ',
    title: 'Эмч',
    specialization: 'Дүрс оношилгооны эмч',
    specShort: 'Рентген / Хэт авиа / MRI',
    experience: '8+ жил',
    bio: 'Хэт авианы шинжилгээ, рентген болон дэвшилтэт дүрс оношилгооны аргуудыг ашиглан нарийн оношлогоо хийдэг.',
    photo: '/doctors/nomin.jpg',
    initial: 'Н',
    color: '#16A34A',
  },
]
