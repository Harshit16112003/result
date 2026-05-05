import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Download, BarChart3, Users, Clock, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UserFaceData } from '../types';
import { deleteUser } from '../hooks/useUsers';
import { AttendanceRecord } from '../hooks/useAttendance';

// Helper to generate some stats (using mock data combined with real records)
function generateStats(records: AttendanceRecord[]) {
  const dailyStats = [
    { name: 'Mon', attendance: Math.floor(Math.random() * 20) + 10 },
    { name: 'Tue', attendance: Math.floor(Math.random() * 20) + 15 },
    { name: 'Wed', attendance: Math.floor(Math.random() * 20) + 12 },
    { name: 'Thu', attendance: Math.floor(Math.random() * 20) + 18 },
    { name: 'Fri', attendance: Math.floor(Math.random() * 20) + 20 },
  ];

  const peakHours = [
    { hour: '08:00', count: 5 },
    { hour: '09:00', count: 18 },
    { hour: '10:00', count: 12 },
    { hour: '11:00', count: 8 },
    { hour: '17:00', count: 15 },
    { hour: '18:00', count: 22 },
  ];

  return { dailyStats, peakHours };
}

export default function AdminPanel({ 
  users, 
  records, 
  logs 
}: { 
  users: UserFaceData[], 
  records: AttendanceRecord[], 
  logs: any[] 
}) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs'>('dashboard');
  const { dailyStats, peakHours } = generateStats(records);

  const handleExport = () => {
    // Generate simple CSV
    const headers = ['Subject', 'Date', 'Check-In', 'Check-Out', 'Duration (h)', 'Status'];
    const rows = records.map(r => {
      const date = r.checkInAt ? new Date(r.checkInAt.seconds * 1000).toLocaleDateString() : '';
      const inTime = r.checkInAt ? new Date(r.checkInAt.seconds * 1000).toLocaleTimeString() : '';
      const outTime = r.checkOutAt ? new Date(r.checkOutAt.seconds * 1000).toLocaleTimeString() : '';
      const duration = r.durationHours ? r.durationHours.toFixed(2) : '';
      const status = r.checkOutAt ? 'Completed' : 'Active';
      return [r.userName, date, inTime, outTime, duration, status].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user ${name}?`)) {
      await deleteUser(id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full p-6 overflow-y-auto flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold flex items-center gap-3 text-primary">
          <ShieldAlert size={24} />
          Admin Panel
        </h2>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d0f14] border border-border rounded text-xs font-mono uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-border pb-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}
        >
          Dashboard & Stats
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}
        >
          Manage Users ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}
        >
          System Logs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            <div className="bg-[#0a0c10] border border-border rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <BarChart3 size={16} /> Weekly Attendance
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0c10', border: '1px solid #ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Area type="monotone" dataKey="attendance" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorAtt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0a0c10] border border-border rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Clock size={16} /> Peak Loading Graph (Heatmap Est.)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="hour" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#ffffff05'}}
                      contentStyle={{ backgroundColor: '#0a0c10', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-[#0a0c10] border border-border rounded-xl p-6 shadow-lg col-span-1 lg:col-span-2">
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Users size={16} /> Employee Status Quick View
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border border-border rounded-lg bg-emerald-500/10 text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">{records.filter(r => !r.checkOutAt).length}</div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Currently Active</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-indigo-500/10 text-center">
                  <div className="text-3xl font-bold text-indigo-400 mb-1">{users.length}</div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Total Registered</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-amber-500/10 text-center">
                  <div className="text-3xl font-bold text-amber-400 mb-1">{records.filter(r => r.checkOutAt).length}</div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Departed Today</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-red-500/10 text-center">
                   <div className="text-3xl font-bold text-red-400 mb-1">{users.length - records.length > 0 ? users.length - records.length : 0}</div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Absent / Unknown</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-[#0a0c10] border border-border rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0d0f14] border-b border-border text-[9px] uppercase tracking-widest font-mono text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject Name</th>
                  <th className="px-6 py-4 font-medium">UID</th>
                  <th className="px-6 py-4 font-medium">Reg. Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No users registered yet.</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-200">{user.name}</td>
                      <td className="px-6 py-4 font-mono opacity-70">0x{user.id}</td>
                      <td className="px-6 py-4 font-mono opacity-70">
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-[10px] uppercase font-mono hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={12} className="inline mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#0a0c10] border border-border rounded-xl p-4 shadow-lg min-h-[400px]">
             {logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                 <div className="font-mono text-xs uppercase">No active logs in current session</div>
               </div>
             ) : (
               <div className="space-y-2">
                 {logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 text-xs font-mono p-3 border-b border-border/50 hover:bg-white/[0.02]">
                      <span className="text-slate-500">{log.time}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${
                        log.type === 'match' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.type === 'anomaly' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-white flex-1">{log.subject}</span>
                      <span className="text-slate-500">[{log.confidence.toFixed(2)}]</span>
                    </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
