/* eslint-disable @next/next/no-img-element */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BotMessageSquare, Calendar, ChevronRight, ShieldCheck } from 'lucide-react'
import { getPublicChatbotConfig } from '@/app/actions/chatbot'
import AIChatbotPanel from '@/components/public/AIChatbotPanel'
import Navbar from '@/components/layout/Navbar'
import { chatbotStarterPrompts } from '@/lib/chatbot/starters'

export const metadata: Metadata = {
  title: 'Чатбот AI | СУПЕРНОВА',
  description: 'СУПЕРНОВА-ийн одоогийн AI туслах чат руу шууд URL-аар нэвтэрч, асуултаа чатлан асууна.',
}

export default async function ChatbotAiPage() {
  const config = await getPublicChatbotConfig()

  return (
    <>
      <Navbar />

      <main className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_38%,#F8FBFF_100%)]">
        <div className="absolute inset-x-0 top-[76px] h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(30,99,181,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(232,50,63,0.08),_transparent_24%)]" />

        <section className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-[#D8E6F6] bg-white/90 p-6 shadow-[0_24px_60px_rgba(16,35,59,0.08)] backdrop-blur md:p-8">
              <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
                {config?.avatarUrl ? (
                  <img
                    src={config.avatarUrl}
                    alt="СУПЕРНОВА AI туслах"
                    className="h-24 w-24 rounded-[1.75rem] border border-[#D8E6F6] bg-[#F8FBFF] object-cover shadow-sm md:h-28 md:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-[#D8E6F6] bg-[#EAF3FF] text-[#1E63B5] md:h-28 md:w-28">
                    <BotMessageSquare size={42} />
                  </div>
                )}

                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#C8DCF5] bg-[#F8FBFF] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                    <ShieldCheck size={14} />
                    Шууд чат туслах
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-[#10233B] md:text-5xl">
                    AI туслахтай шууд холбогдоорой
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[#5B6877] md:text-base">
                    Одоогийн чатботын системээрээ ажиллана. Үйлчилгээ, урьдчилан сэргийлэх багц, эмчийн мэдээлэл
                    болон цаг авахтай холбоотой түгээмэл асуултаа эндээс шууд асуугаарай.
                  </p>
                </div>
              </div>
            </div>

            <aside className="flex h-full flex-col justify-between rounded-[2rem] border border-[#D8E6F6] bg-[#10233B] p-6 text-white shadow-[0_24px_60px_rgba(16,35,59,0.14)] md:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9CC3F8]">Түгээмэл эхлэлүүд</p>
                <div className="mt-4 space-y-3">
                  {chatbotStarterPrompts.map((prompt) => (
                    <div key={prompt} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100">
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-white">Шууд цаг авах бол баруун талын товчоор орно уу.</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Чатаар асуугаад дараа нь баталгаатай захиалгаа үргэлжлүүлэх боломжтой.
                </p>
                <Link
                  href="/appointment"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E8323F] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#c0272d]"
                >
                  Цаг авах
                  <ChevronRight size={16} />
                </Link>
                <Link
                  href="/consultation"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Үнэгүй зөвлөгөө
                  <Calendar size={16} />
                </Link>
              </div>
            </aside>
          </div>

          <div className="mt-8">
            {config?.isActive ? (
              <AIChatbotPanel
                config={config}
                starterPrompts={chatbotStarterPrompts}
                className="h-[680px] w-full rounded-[2rem] border border-[#D8E6F6] shadow-[0_32px_80px_rgba(16,35,59,0.08)]"
              />
            ) : (
              <div className="rounded-[2rem] border border-[#D8E6F6] bg-white p-8 text-center shadow-sm">
                <h2 className="text-2xl font-bold text-[#10233B]">Чатбот одоогоор идэвхгүй байна</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#5B6877]">
                  Одоогоор онлайн чат түр хаалттай байна. Та цаг авах эсвэл зөвлөгөө хүсэх холбоосоор үргэлжлүүлнэ үү.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/appointment"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
                  >
                    Цаг авах
                  </Link>
                  <Link
                    href="/consultation"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#C8DCF5] px-5 py-3 text-sm font-semibold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
                  >
                    Үнэгүй зөвлөгөө авах
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
