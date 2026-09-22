/* eslint-disable react/no-unescaped-entities */
"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/providers/AuthProvider'
import { 
  IconBook2, 
  IconHeadset, 
  IconMicrophone, 
  IconPencil, 
  IconTrophy, 
  IconCalendarEvent,
  IconArrowUpRight,
  IconClock,
  IconSparkles,
  IconBrain,
  IconPlus,
  IconMinus,
  IconMessageChatbot
} from '@tabler/icons-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import Link from 'next/link'

const performanceData = [
  { name: 'Mock 1', reading: 6.0, listening: 6.5, writing: 5.5, speaking: 6.0 },
  { name: 'Mock 2', reading: 6.5, listening: 6.5, writing: 6.0, speaking: 6.0 },
  { name: 'Mock 3', reading: 7.0, listening: 7.0, writing: 6.5, speaking: 6.5 },
  { name: 'Mock 4', reading: 7.5, listening: 7.5, writing: 6.5, speaking: 7.0 },
]

const vocabularyList = [
  { word: "Mitigate", type: "Verb", meaning: "To make something less severe, serious, or painful.", sentence: "Adequate preparation can mitigate the stress associated with the IELTS speaking exam." },
  { word: "Acquisition", type: "Noun", meaning: "The act of obtaining or beginning to have something.", sentence: "Lexical acquisition is a gradual process that requires regular reading and speaking." },
  { word: "Advocate", type: "Verb / Noun", meaning: "To publicly support or recommend a particular cause or policy.", sentence: "Many education specialists advocate for more interactive computer-based practice." },
]

export default function StudentDashboard() {
  const { user } = useAuth()

  // Interactive Band Calculator State
  const [calcScores, setCalcScores] = useState({
    reading: 7.0,
    listening: 7.0,
    writing: 6.0,
    speaking: 6.5
  })

  // Vocabulary Rotation index
  const [vocabIndex, setVocabIndex] = useState(0)

  // Calculate Overall IELTS Score
  const calculatedOverall = useMemo(() => {
    const avg = (calcScores.reading + calcScores.listening + calcScores.writing + calcScores.speaking) / 4
    return Math.round(avg * 2) / 2
  }, [calcScores])

  // Get description for band score level
  const bandLevelDescription = useMemo(() => {
    if (calculatedOverall >= 8.0) return { title: "Expert User", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    if (calculatedOverall >= 7.0) return { title: "Good User", color: "text-red-600 bg-red-50 border-red-100" }
    if (calculatedOverall >= 6.0) return { title: "Competent User", color: "text-indigo-600 bg-indigo-50 border-indigo-100" }
    return { title: "Modest User", color: "text-amber-600 bg-amber-50 border-amber-100" }
  }, [calculatedOverall])

  const adjustScore = (section: keyof typeof calcScores, operation: 'up' | 'down') => {
    setCalcScores(prev => {
      const current = prev[section]
      let next = current
      if (operation === 'up' && current < 9.0) {
        next = current + 0.5
      } else if (operation === 'down' && current > 1.0) {
        next = current - 0.5
      }
      return { ...prev, [section]: next }
    })
  }

  const nextVocab = () => {
    setVocabIndex((prev) => (prev + 1) % vocabularyList.length)
  }

  return (
    <div className="flex-1 space-y-6 py-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full filter blur-xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight mb-2 text-neutral-900">
            Welcome back, {user?.name || 'Student'}.
          </h1>
          <p className="text-neutral-500 font-medium">
            Stay focused. You are on track to achieve your target band score.
          </p>
        </div>
        <div className="flex gap-4 relative shrink-0">
          <div className="text-center px-6 py-3 bg-neutral-50 rounded-xl border border-neutral-100 min-w-[100px]">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Target Band</p>
            <p className="text-3xl font-black text-neutral-900">7.5</p>
          </div>
          <div className="text-center px-6 py-3 bg-red-50 rounded-xl border border-red-100 min-w-[100px]">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Next Mock</p>
            <p className="text-3xl font-black text-red-600">14<span className="text-sm font-bold text-red-500 ml-0.5">Days</span></p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-red-200 hover:shadow-md transition-all duration-300 bg-white border-gray-100 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-neutral-400">Reading</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-700 border border-neutral-100">
              <IconBook2 size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-neutral-900">7.5</div>
            <p className="text-xs font-medium text-neutral-400 mt-1 flex items-center gap-1">
              <IconArrowUpRight size={14} className="text-red-500" />
              <span className="text-red-600 font-bold">+0.5</span> from last mock
            </p>
            <Progress value={83} className="h-1.5 mt-4 bg-neutral-100 [&>div]:bg-red-600" />
          </CardContent>
        </Card>

        <Card className="hover:border-red-200 hover:shadow-md transition-all duration-300 bg-white border-gray-100 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-neutral-400">Listening</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-700 border border-neutral-100">
              <IconHeadset size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-neutral-900">7.5</div>
            <p className="text-xs font-medium text-neutral-400 mt-1 flex items-center gap-1">
              <IconArrowUpRight size={14} className="text-red-500" />
              <span className="text-red-600 font-bold">+0.5</span> from last mock
            </p>
            <Progress value={83} className="h-1.5 mt-4 bg-neutral-100 [&>div]:bg-red-600" />
          </CardContent>
        </Card>

        <Card className="hover:border-red-200 hover:shadow-md transition-all duration-300 bg-white border-gray-100 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-neutral-400">Writing</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-700 border border-neutral-100">
              <IconPencil size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-neutral-900">6.5</div>
            <p className="text-xs font-medium text-neutral-400 mt-1 flex items-center gap-1">
              <span>Stable score progression</span>
            </p>
            <Progress value={72} className="h-1.5 mt-4 bg-neutral-100 [&>div]:bg-neutral-800" />
          </CardContent>
        </Card>

        <Card className="hover:border-red-200 hover:shadow-md transition-all duration-300 bg-white border-gray-100 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-neutral-400">Speaking</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-700 border border-neutral-100">
              <IconMicrophone size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-neutral-900">7.0</div>
            <p className="text-xs font-medium text-neutral-400 mt-1 flex items-center gap-1">
              <IconArrowUpRight size={14} className="text-red-500" />
              <span className="text-red-600 font-bold">+0.5</span> from last mock
            </p>
            <Progress value={78} className="h-1.5 mt-4 bg-neutral-100 [&>div]:bg-red-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column (4 columns wide) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Performance Chart */}
          <Card className="bg-white border-gray-100 shadow-xs rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-bold text-neutral-900 text-lg">Performance Progression</CardTitle>
              <CardDescription className="text-neutral-500 font-medium">Your component scores across the last 4 mock tests</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:p-6 sm:pt-0">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      domain={[4, 9]} 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => value.toFixed(1)} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontWeight: 600 }} 
                    />
                    <Line type="monotone" dataKey="reading" stroke="#1f2937" strokeWidth={2} dot={{ r: 4 }} name="Reading" />
                    <Line type="monotone" dataKey="listening" stroke="#6b7280" strokeWidth={2} dot={{ r: 4 }} name="Listening" />
                    <Line type="monotone" dataKey="writing" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4 }} name="Writing" />
                    <Line type="monotone" dataKey="speaking" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} name="Speaking" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Calculator */}
          <Card className="bg-white border-gray-100 shadow-xs rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-100">
                  <IconBrain size={16} />
                </span>
                <CardTitle className="font-bold text-neutral-900 text-lg">IELTS Band Calculator</CardTitle>
              </div>
              <CardDescription className="text-neutral-500 font-medium">Estimate your overall band score by adjusting individual module scores.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 items-center">
              <div className="space-y-3.5">
                {(['listening', 'reading', 'writing', 'speaking'] as const).map((section) => (
                  <div key={section} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-100/50">
                    <span className="text-sm font-bold capitalize text-neutral-700 ml-2">{section}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => adjustScore(section, 'down')}
                        className="h-7 w-7 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                      >
                        <IconMinus size={14} />
                      </button>
                      <span className="text-sm font-black text-neutral-900 w-8 text-center">
                        {calcScores[section].toFixed(1)}
                      </span>
                      <button
                        onClick={() => adjustScore(section, 'up')}
                        className="h-7 w-7 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                      >
                        <IconPlus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-radial from-neutral-50 to-neutral-100/30 rounded-2xl border border-neutral-100 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Calculated Overall Band</p>
                <div className="relative flex items-center justify-center h-28 w-28 rounded-full bg-white border border-neutral-200 shadow-md">
                  <div className="absolute inset-1.5 rounded-full bg-linear-to-tr from-red-50 to-red-100/20 border border-red-100" />
                  <span className="relative text-4xl font-black text-neutral-900 tracking-tight">{calculatedOverall.toFixed(1)}</span>
                </div>
                <div className={`mt-4 px-3 py-1 rounded-full text-xs font-black uppercase border tracking-wider ${bandLevelDescription.color}`}>
                  {bandLevelDescription.title}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Feedback Widget */}
          <Card className="bg-white border-gray-100 shadow-xs rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                  <IconMessageChatbot size={16} />
                </span>
                <CardTitle className="font-bold text-neutral-900 text-lg">AI Feedback Insights</CardTitle>
              </div>
              <CardDescription className="text-neutral-500 font-medium">Core feedback from your recent automated writing & speaking mocks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-700 bg-white border px-2 py-0.5 rounded-md">Writing Task 2</span>
                  <span className="text-xs font-bold text-neutral-400">Score: 6.5</span>
                </div>
                <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                  <strong>Coherence & Cohesion (7.0):</strong> Paragraph structure is solid and links are logical. 
                  <br />
                  <strong>Lexical Resource (6.0):</strong> Try to replace repetitive basic terms like <em>"good"</em> and <em>"bad"</em> with formal synonyms (e.g., <em>"beneficial"</em>, <em>"detrimental"</em>).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-700 bg-white border px-2 py-0.5 rounded-md">Speaking Part 2</span>
                  <span className="text-xs font-bold text-neutral-400">Score: 7.0</span>
                </div>
                <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                  <strong>Fluency & Coherence (7.5):</strong> Spoke continuously with natural pacing and storytelling cues.
                  <br />
                  <strong>Pronunciation (6.5):</strong> Minor issues with plural endings and word endings (e.g., watch consonant clusters in <em>"architectures"</em>).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (3 columns wide) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Upcoming Schedule */}
          <Card className="bg-white border-gray-100 shadow-xs rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="font-bold text-neutral-900 text-lg">Upcoming Schedule</CardTitle>
              <CardDescription className="text-neutral-500 font-medium">Your next live sessions & evaluations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 cursor-pointer group">
                <div className="flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-lg p-2 min-w-[60px] shrink-0">
                  <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Oct</span>
                  <span className="text-xl font-black text-red-600 leading-none mt-1">12</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-950 group-hover:text-red-600 transition-colors">Full Mock Test Practice</h4>
                  <div className="flex items-center text-xs font-medium text-neutral-400 mt-1 gap-1">
                    <IconClock size={12} className="text-neutral-400" /> 10:00 AM - 1:00 PM
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 cursor-pointer group">
                <div className="flex flex-col items-center justify-center bg-neutral-50 border border-neutral-200 rounded-lg p-2 min-w-[60px] shrink-0">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Oct</span>
                  <span className="text-xl font-black text-neutral-950 leading-none mt-1">15</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-950 group-hover:text-red-600 transition-colors">Speaking Review (1-on-1)</h4>
                  <div className="flex items-center text-xs font-medium text-neutral-400 mt-1 gap-1">
                    <IconClock size={12} className="text-neutral-400" /> 4:00 PM - 4:30 PM
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2 font-bold border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 rounded-xl cursor-pointer">View Calendar</Button>
            </CardContent>
          </Card>

          {/* Daily Challenge / Vocabulary */}
          <Card className="bg-white border-gray-100 shadow-xs rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full filter blur-lg pointer-events-none" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5 text-red-600">
                <IconSparkles size={16} />
                <CardTitle className="font-bold text-neutral-900 text-base">Daily IELTS Challenge</CardTitle>
              </div>
              <CardDescription className="text-neutral-500 font-medium">Expand your vocabulary base daily.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-50/50 border border-neutral-100 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-neutral-900">{vocabularyList[vocabIndex].word}</span>
                  <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-md border border-red-200/50">
                    {vocabularyList[vocabIndex].type}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  <strong>Meaning:</strong> {vocabularyList[vocabIndex].meaning}
                </p>
                <div className="mt-3 text-xs text-neutral-600 bg-white border border-neutral-100 p-2.5 rounded-lg italic">
                  "{vocabularyList[vocabIndex].sentence}"
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={nextVocab} 
                  variant="outline" 
                  className="flex-1 font-bold text-xs border-neutral-200 h-9 rounded-xl cursor-pointer"
                >
                  Next Word
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1 font-bold text-xs bg-red-600 hover:bg-red-700 h-9 rounded-xl shadow-xs cursor-pointer"
                  asChild
                >
                  <Link href="/practice/vocabulary">All Vocabulary</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white border-gray-100 shadow-xs rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="font-bold text-neutral-900 text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-3.5 flex flex-col gap-1.5 border-neutral-200 hover:border-red-200 hover:bg-red-50/50 text-neutral-700 hover:text-red-700 transition-all rounded-xl group cursor-pointer" asChild>
                <Link href="/practice">
                  <IconBook2 size={22} className="text-neutral-500 group-hover:text-red-600 transition-colors" />
                  <span className="font-bold text-xs">Practice Zone</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3.5 flex flex-col gap-1.5 border-neutral-200 hover:border-red-200 hover:bg-red-50/50 text-neutral-700 hover:text-red-700 transition-all rounded-xl group cursor-pointer" asChild>
                <Link href="/practice/writing">
                  <IconPencil size={22} className="text-neutral-500 group-hover:text-red-600 transition-colors" />
                  <span className="font-bold text-xs">Submit Essay</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3.5 flex flex-col gap-1.5 border-neutral-200 hover:border-red-200 hover:bg-red-50/50 text-neutral-700 hover:text-red-700 transition-all rounded-xl group cursor-pointer" asChild>
                <Link href="/student/mock-tests">
                  <IconTrophy size={22} className="text-red-600" />
                  <span className="font-bold text-xs text-red-600">Mock Tests</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3.5 flex flex-col gap-1.5 border-neutral-200 hover:border-red-200 hover:bg-red-50/50 text-neutral-700 hover:text-red-700 transition-all rounded-xl group cursor-pointer">
                <IconCalendarEvent size={22} className="text-neutral-500 group-hover:text-red-600 transition-colors" />
                <span className="font-bold text-xs">Book Class</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
