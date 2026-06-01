"use client"

import React from 'react'
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
  IconClock
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

const performanceData = [
  { name: 'Mock 1', reading: 6.0, listening: 6.5, writing: 5.5, speaking: 6.0 },
  { name: 'Mock 2', reading: 6.5, listening: 6.5, writing: 6.0, speaking: 6.0 },
  { name: 'Mock 3', reading: 7.0, listening: 7.0, writing: 6.5, speaking: 6.5 },
  { name: 'Mock 4', reading: 7.5, listening: 7.5, writing: 6.5, speaking: 7.0 },
]

export default function StudentDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex-1 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-black">
            Welcome back, {user?.name || 'Student'}.
          </h1>
          <p className="text-gray-500 font-medium">
            Stay focused. You are on track to achieve your target band score.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Target Band</p>
            <p className="text-3xl font-black text-black">7.5</p>
          </div>
          <div className="text-center px-6 py-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Next Test</p>
            <p className="text-3xl font-black text-red-600">14<span className="text-lg font-bold text-red-500 ml-1">Days</span></p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-red-200 transition-colors bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Reading</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-black border border-gray-100">
              <IconBook2 size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-black">7.5</div>
            <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
              <IconArrowUpRight size={14} className="text-red-500" />
              <span className="text-red-600 font-bold">+0.5</span> from last mock
            </p>
            <Progress value={80} className="h-1.5 mt-4 bg-gray-100 [&>div]:bg-red-600" />
          </CardContent>
        </Card>

        <Card className="hover:border-red-200 transition-colors bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Listening</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-black border border-gray-100">
              <IconHeadset size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-black">7.5</div>
            <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
              <IconArrowUpRight size={14} className="text-red-500" />
              <span className="text-red-600 font-bold">+0.5</span> from last mock
            </p>
            <Progress value={80} className="h-1.5 mt-4 bg-gray-100 [&>div]:bg-red-600" />
          </CardContent>
        </Card>

        <Card className="hover:border-red-200 transition-colors bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Writing</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-black border border-gray-100">
              <IconPencil size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-black">6.5</div>
            <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
              <span>Maintained from last mock</span>
            </p>
            <Progress value={65} className="h-1.5 mt-4 bg-gray-100 [&>div]:bg-gray-800" />
          </CardContent>
        </Card>

        <Card className="hover:border-red-200 transition-colors bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Speaking</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-black border border-gray-100">
              <IconMicrophone size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-black">7.0</div>
            <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
              <IconArrowUpRight size={14} className="text-red-500" />
              <span className="text-red-600 font-bold">+0.5</span> from last mock
            </p>
            <Progress value={75} className="h-1.5 mt-4 bg-gray-100 [&>div]:bg-red-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Chart Section */}
        <Card className="md:col-span-4 bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-bold text-black">Performance Progression</CardTitle>
            <CardDescription className="text-gray-500 font-medium">Your band scores over the last 4 mock tests</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:p-6 sm:pt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    fontSize={12} 
                    fontWeight={500}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    domain={[4, 9]} 
                    stroke="#6b7280" 
                    fontSize={12} 
                    fontWeight={500}
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => value.toFixed(1)} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 600 }} 
                  />
                  <Line type="monotone" dataKey="reading" stroke="#111827" strokeWidth={2} dot={{ r: 4, fill: '#111827' }} name="Reading" />
                  <Line type="monotone" dataKey="listening" stroke="#4b5563" strokeWidth={2} dot={{ r: 4, fill: '#4b5563' }} name="Listening" />
                  <Line type="monotone" dataKey="writing" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4, fill: '#9ca3af' }} name="Writing" />
                  <Line type="monotone" dataKey="speaking" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#dc2626' }} name="Speaking" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Actions */}
        <div className="md:col-span-3 space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-bold text-black">Upcoming Schedule</CardTitle>
              <CardDescription className="text-gray-500 font-medium">Your next classes and tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                <div className="flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-lg p-2 min-w-[60px]">
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Oct</span>
                  <span className="text-xl font-black text-red-600">12</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-black">Full Mock Test</h4>
                  <div className="flex items-center text-xs font-medium text-gray-500 mt-1 gap-1">
                    <IconClock size={14} className="text-gray-400" /> 10:00 AM - 1:00 PM
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-2 min-w-[60px]">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Oct</span>
                  <span className="text-xl font-black text-black">15</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-black">Speaking Practice (1-on-1)</h4>
                  <div className="flex items-center text-xs font-medium text-gray-500 mt-1 gap-1">
                    <IconClock size={14} className="text-gray-400" /> 4:00 PM - 4:30 PM
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2 font-bold border-gray-200 text-black hover:bg-gray-50 hover:text-black">View Full Calendar</Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-bold text-black">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors">
                <IconBook2 size={24} className="text-black group-hover:text-red-600" />
                <span className="font-semibold text-sm">Reading Test</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors">
                <IconPencil size={24} className="text-black group-hover:text-red-600" />
                <span className="font-semibold text-sm">Submit Essay</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors group">
                <IconTrophy size={24} className="text-red-600 group-hover:text-red-700" />
                <span className="font-semibold text-sm text-red-600 group-hover:text-red-700">Mock Test</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors">
                <IconCalendarEvent size={24} className="text-black group-hover:text-red-600" />
                <span className="font-semibold text-sm">Book Class</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
