import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, UserPlus, ScanEye, Users as UsersIcon, Settings, LayoutGrid, Info, Zap, LogOut, Activity, Database, AlertTriangle, Key, RefreshCw } from 'lucide-react';
import WebcamScanner from './components/WebcamScanner';
import { loadModels, createMatcher } from './lib/faceService';
import { useUsers, registerUser } from './hooks/useUsers';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

type Screen = 'dashboard' | 'register' | 'identify' | 'users';

interface LogEntry {
  id: string;
  type: 'match' | 'anomaly';
  subject: string;
  time: string;
  confidence: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const { users, loading: usersLoading, authenticated } = useUsers();
  const [matcher, setMatcher] = useState<any>(null);
  const [registrationName, setRegistrationName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const lastLoggedRef = useRef<{name: string, time: number}>({ name: '', time: 0 });

  useEffect(() => {
    loadModels().then(success => {
      if (success) setModelsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      const newMatcher = createMatcher(users);
      setMatcher(newMatcher);
    }
  }, [users]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('Login request overridden by a newer one.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      } else {
        console.error('Login error:', error);
        alert('Authentication failed: ' + error.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleRecognize = (name: string, distance: number) => {
    const confidence = 1 - distance;
    const now = Date.now();
    
    // Throttle logging the same person
    if (lastLoggedRef.current.name === name && now - lastLoggedRef.current.time < 5000) return;
    
    lastLoggedRef.current = { name, time: now };
    
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: name !== 'unknown' ? 'match' : 'anomaly',
      subject: name !== 'unknown' ? name : 'Unknown Entity',
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      confidence
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 20));
  };

  const handleRegistrationScan = async (descriptor: Float32Array) => {
    if (!registrationName.trim()) {
      alert("Please enter a name first.");
      return;
    }
    setIsRegistering(true);
    const result = await registerUser(registrationName, descriptor);
    setIsRegistering(false);
    if (result.success) {
      alert(`User ${registrationName} registered successfully!`);
      setRegistrationName('');
      setScreen('dashboard');
    } else {
      alert("Registration failed. See console for details.");
    }
  };

  if (!authenticated) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#06b6d410_0%,_transparent_70%)] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-surface border border-border rounded-2xl p-10 text-center shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <Shield size={40} />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3 uppercase tracking-tight italic">FaceID<span className="text-primary not-italic">Pro</span></h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Neural Biometric Security Interface.<br />
            Authentication required to access sector 7 database.
          </p>
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 bg-primary text-black font-mono font-bold text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Key size={16} />
            )}
            {isLoggingIn ? 'Authorizing...' : 'Authorize Access'}
          </button>
          <div className="mt-8 pt-8 border-t border-border/50 text-[10px] font-mono uppercase tracking-widest text-slate-500 opacity-50">
            Secure Encryption Channel • v4.0.0
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-text font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-mono font-bold tracking-widest text-sm uppercase">NeuralSight <span className="text-primary tracking-normal">v4.0</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[10px] font-mono tracking-tighter uppercase opacity-60">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${modelsLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            {modelsLoaded ? 'System Active' : 'Model Offline'}
          </div>
          <div>Lat: 12ms</div>
          <div>User: {auth.currentUser?.email?.split('@')[0]}</div>
          <div>{new Date().toLocaleTimeString('en-GB', { hour12: false })} UTC</div>
        </div>

        <div className="flex gap-3">
          <button className="px-3 py-1 border border-border hover:border-primary/50 text-[10px] uppercase font-bold transition-all text-slate-400 hover:text-primary">
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="px-3 py-1 bg-primary text-black text-[10px] uppercase font-bold hover:bg-primary/90 transition-all"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Left Panel: Registration & Database */}
        <aside className="w-72 flex flex-col gap-4">
          <div className="flex-1 bg-surface border border-border rounded-lg p-5 flex flex-col overflow-hidden">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
              <UserPlus size={14} />
              Enrollment Hub
            </h2>
            
            <div className="space-y-5">
              <div 
                onClick={() => setScreen('register')}
                className={`p-3 border border-dashed rounded bg-background transition-all cursor-pointer ${screen === 'register' ? 'border-primary shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'border-border hover:border-primary/30'}`}
              >
                <div className="w-full aspect-square bg-slate-900/50 rounded flex items-center justify-center border border-border">
                  <div className="text-center group">
                    <div className="text-2xl opacity-40 mb-1 group-hover:scale-110 transition-transform">+</div>
                    <div className="text-[9px] uppercase tracking-wide opacity-50">Capture Profile</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[9px] uppercase tracking-wider opacity-50 block">Identity Token</label>
                <input 
                  type="text" 
                  value={registrationName}
                  onChange={(e) => setRegistrationName(e.target.value)}
                  placeholder="Enter Full Name" 
                  className="w-full bg-slate-900 border border-border p-2.5 text-xs focus:outline-none focus:border-primary/50 text-slate-200 transition-all font-mono"
                />
                <p className="text-[9px] text-slate-500 leading-tight italic">
                  Note: Enter name and use the primary capture button in the central viewport to enroll subject.
                </p>
              </div>
            </div>

            <div className="mt-8 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-[10px] font-mono uppercase opacity-40 mb-3 flex items-center justify-between">
                <span>Stored Indices ({users.length})</span>
                <UsersIcon size={10} />
              </h3>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {usersLoading ? (
                  [1,2,3].map(i => <div key={i} className="h-10 bg-slate-900/30 rounded" />)
                ) : (
                  users.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 bg-slate-900/30 border border-border/50 rounded hover:border-primary/20 transition-all group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-border flex items-center justify-center text-[10px] font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[10px] font-bold truncate group-hover:text-primary transition-colors">{user.name}</div>
                        <div className="text-[8px] opacity-40 uppercase font-mono">UID: 0x{user.id.slice(-5)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Main Recognition Feed */}
        <section className="flex-1 bg-surface border border-border rounded-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className={`px-2 py-0.5 border text-[9px] font-mono rounded uppercase flex items-center gap-1.5 ${screen === 'identify' ? 'bg-red-600/10 text-red-500 border-red-500/30' : 'bg-slate-800 text-slate-400 border-border'}`}>
              <div className={`w-1 h-1 rounded-full ${screen === 'identify' ? 'bg-red-500 animate-bounce' : 'bg-slate-500'}`} />
              {screen === 'identify' ? 'REC Live' : 'Standby'}
            </span>
            <span className="px-2 py-0.5 bg-slate-900 border border-border text-[9px] font-mono rounded uppercase text-slate-400">
              Cam_01_Frontal
            </span>
          </div>

          <div className="flex-1 p-2 flex items-center justify-center bg-[radial-gradient(circle_at_center,_#111419_0%,_#050608_100%)] relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            
            <AnimatePresence mode="wait">
              {screen === 'identify' ? (
                <motion.div 
                  key="ident"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <WebcamScanner mode="recognize" matcher={matcher} onRecognize={handleRecognize} />
                </motion.div>
              ) : screen === 'register' ? (
                <motion.div 
                   key="reg"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="w-full h-full"
                >
                  <WebcamScanner mode="register" onScan={handleRegistrationScan} />
                </motion.div>
              ) : (
                <div className="text-center space-y-6 max-w-sm">
                  <div className="w-48 h-48 border-2 border-dashed border-border rounded-full flex items-center justify-center mx-auto relative group">
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
                    <ScanEye size={64} className="text-border group-hover:text-primary/40 transition-all duration-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-slate-500">Awaiting Signal...</h3>
                    <p className="text-[10px] text-slate-600 uppercase">Biometric protocols initialized and ready</p>
                  </div>
                  <button 
                    onClick={() => setScreen('identify')}
                    className="px-8 py-3 bg-primary text-black font-mono font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  >
                    Initiate Stream
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Footer */}
          <div className="h-16 border-t border-border bg-[#0d0f14] flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-10">
              <div className="space-y-1.5">
                 <div className="text-[8px] uppercase tracking-widest opacity-40 font-mono">Inference Thresh</div>
                 <div className="flex items-center gap-3">
                   <input type="range" className="w-24 accent-primary h-1 rounded-lg cursor-pointer bg-slate-800" min="0" max="100" defaultValue="60" />
                   <span className="text-[10px] font-mono text-primary">0.60</span>
                 </div>
              </div>
              <div className="space-y-1.5">
                 <div className="text-[8px] uppercase tracking-widest opacity-40 font-mono">Model Selection</div>
                 <div className="flex items-center gap-2 text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                   <Activity size={10} />
                   FACENET_V2 (M-1)
                 </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setScreen('dashboard')}
                className="px-4 py-2 border border-border rounded text-[10px] uppercase font-bold hover:bg-white/5 transition-all text-slate-400"
              >
                Dashboard
              </button>
              <button className="px-4 py-2 bg-red-900/20 border border-red-900 text-red-500 rounded text-[10px] uppercase font-bold hover:bg-red-900/40 transition-all flex items-center gap-2">
                <AlertTriangle size={12} />
                Secure Lock
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel: Recognition Log */}
        <aside className="w-72 flex flex-col gap-4">
          <div className="flex-1 bg-surface border border-border rounded-lg p-5 flex flex-col overflow-hidden">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
              <Activity size={14} />
              Stream Analytics
            </h2>
            
            <div className="flex-1 space-y-1 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-4">
                  <Activity size={32} className="mb-4" />
                  <p className="text-[10px] uppercase tracking-widest">No matching results in current buffer</p>
                </div>
              ) : (
                logs.map(log => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={log.id} 
                    className="p-3 border-b border-border/50 flex flex-col gap-1.5 hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-tight ${log.type === 'match' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {log.type === 'match' ? 'MATCH FOUND' : 'ANOMALY'}
                      </span>
                      <span className="text-[8px] font-mono opacity-30">{log.time}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-200">
                      Subject: <span className={log.type === 'anomaly' ? 'italic underline decoration-red-500/50' : ''}>{log.subject}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${log.type === 'match' ? 'bg-primary' : 'bg-red-500'}`} 
                        style={{ width: `${log.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[8px] uppercase opacity-40 mt-1 font-mono">
                      <span>Conf: {(log.confidence * 100).toFixed(1)}%</span>
                      <span>Cam: FRONT_1</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="mt-5 pt-5 border-t border-border">
              <div className="flex justify-between text-[10px] font-mono mb-3">
                <span className="opacity-40 uppercase tracking-widest flex items-center gap-1.5">
                  <Database size={10} />
                  DB Status
                </span>
                <span className="text-primary font-bold">SYNCED</span>
              </div>
              <div className="h-10 w-full bg-slate-900 rounded border border-border flex items-center justify-center p-2">
                <div className="flex gap-1.5 items-end h-full">
                  {[3, 5, 2, 4, 6, 3, 5, 7].map((h, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [`${h*10}%`, `${(h+1)*10}%`, `${h*10}%`] }}
                      transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                      className="w-1 bg-primary/40 rounded-t-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Status Footer */}
      <footer className="h-8 bg-surface border-t border-border px-6 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 select-none">
        <div className="flex gap-6">
          <span>Neural Engine: face-api/FaceNet_v2</span>
          <span className="hidden sm:inline">OpenCV Integration Active</span>
        </div>
        <div className="flex gap-6">
          <span className="text-primary opacity-100">Secure Channel [TLS 1.3]</span>
          <span className="hidden sm:inline">Node_ID: ais-node-v4</span>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  const colorMap: any = {
    primary: 'text-primary bg-primary/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
        <Icon size={24} />
      </div>
      <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-display font-bold mt-1">{value}</h3>
      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
        {sub}
      </p>
    </div>
  );
}

function HealthBar({ label, status, value }: any) {
  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-slate-400">{label}</span>
        <span className={value > 90 ? 'text-emerald-400' : 'text-amber-400'}>{status}</span>
      </div>
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
