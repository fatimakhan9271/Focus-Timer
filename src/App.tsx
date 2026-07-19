import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Settings, 
  Check, 
  Flame, 
  Coffee, 
  Timer, 
  Plus, 
  Trash2, 
  Volume2, 
  VolumeX,
  X,
  Sparkles,
  Award,
  BookOpen,
  Layout,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';

// Define the structured TypeScript interfaces
interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface Durations {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

export default function App() {
  // Load initial settings from localStorage or fall back to standard Pomodoro defaults
  const [durations, setDurations] = useState<Durations>(() => {
    const saved = localStorage.getItem('focus_timer_durations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { focus: 25, shortBreak: 5, longBreak: 15 };
  });

  const [mode, setMode] = useState<'focus' | 'short-break' | 'long-break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(durations.focus * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [triggerComplete, setTriggerComplete] = useState<boolean>(false);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('focus_timer_sound');
    return saved !== 'false'; // defaults to true
  });

  // Analytics states
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(() => {
    const saved = localStorage.getItem('focus_sessions_completed');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('focus_total_minutes');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Task list states
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('focus_timer_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: '1', text: 'Refactor authentication logic & API routes', completed: false },
      { id: '2', text: 'Design component library layouts for v2', completed: true },
      { id: '3', text: 'Client feedback review & visual audit', completed: false }
    ];
  });
  const [newTaskText, setNewTaskText] = useState<string>('');
  
  // Quick Buffer text-area state
  const [quickBuffer, setQuickBuffer] = useState<string>(() => {
    return localStorage.getItem('focus_timer_buffer') || '"The best way to get a project done is to forget about the finish line and focus on the next segment of the track."';
  });

  // Settings overlay control
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // References for keeping track of initial values
  const totalDurationSeconds = (
    mode === 'focus' ? durations.focus :
    mode === 'short-break' ? durations.shortBreak :
    durations.longBreak
  ) * 60;

  // Synthesize a gentle, beautiful, offline zen bell chord using the Web Audio API
  const playZenBell = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play a beautiful, harmonic chime sequence
      playTone(523.25, now, 1.5, 0.12); // C5 (Grounding)
      playTone(783.99, now + 0.1, 1.5, 0.08); // G5 (Harmonious fifth)
      playTone(1046.50, now + 0.3, 1.8, 0.06); // C6 (Bright octave finish)
    } catch (err) {
      console.warn("Audio playback not supported or blocked by user interaction gesture", err);
    }
  };

  // Sync settings/durations/tasks/buffer to LocalStorage
  useEffect(() => {
    localStorage.setItem('focus_timer_durations', JSON.stringify(durations));
  }, [durations]);

  useEffect(() => {
    localStorage.setItem('focus_timer_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('focus_timer_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('focus_timer_buffer', quickBuffer);
  }, [quickBuffer]);

  // Handle mode transitions and timer resets
  useEffect(() => {
    let minutes = durations.focus;
    if (mode === 'short-break') minutes = durations.shortBreak;
    if (mode === 'long-break') minutes = durations.longBreak;
    
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  }, [mode, durations.focus, durations.shortBreak, durations.longBreak]);

  // Primary count-down loop
  useEffect(() => {
    let intervalId: any = null;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setTriggerComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  // Resolve session completion separately to keep state updates pure and predictable
  useEffect(() => {
    if (triggerComplete) {
      setTriggerComplete(false);
      playZenBell();

      if (mode === 'focus') {
        // Log completed focus session
        const nextSessions = sessionsCompleted + 1;
        setSessionsCompleted(nextSessions);
        localStorage.setItem('focus_sessions_completed', String(nextSessions));

        const nextMinutes = totalFocusMinutes + durations.focus;
        setTotalFocusMinutes(nextMinutes);
        localStorage.setItem('focus_total_minutes', String(nextMinutes));

        // Auto transition to appropriate break cycle (4th focus cycle goes to a long break)
        const shouldLongBreak = nextSessions % 4 === 0;
        setMode(shouldLongBreak ? 'long-break' : 'short-break');
      } else {
        // Break ends, back to focus mode
        setMode('focus');
      }
    }
  }, [triggerComplete, mode, sessionsCompleted, durations]);

  // UI calculations
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG circular timer properties
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = timeLeft / totalDurationSeconds;
  const strokeDashoffset = circumference - (progressPercent * circumference);

  // Mode helpers
  const getThemeColors = () => {
    switch (mode) {
      case 'focus':
        return {
          primary: 'text-indigo-500',
          bg: 'bg-indigo-950/40',
          border: 'border-indigo-500/20',
          accent: 'indigo',
          accentClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30',
          text: 'text-indigo-400',
        };
      case 'short-break':
        return {
          primary: 'text-teal-400',
          bg: 'bg-teal-950/40',
          border: 'border-teal-500/20',
          accent: 'teal',
          accentClass: 'bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-600/30',
          text: 'text-teal-400',
        };
      case 'long-break':
        return {
          primary: 'text-amber-400',
          bg: 'bg-amber-950/40',
          border: 'border-amber-500/20',
          accent: 'amber',
          accentClass: 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/30',
          text: 'text-amber-400',
        };
    }
  };

  const theme = getThemeColors();

  // Task checklist interactions
  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Skip the active session
  const handleSkip = () => {
    if (confirm('Are you sure you want to skip this session?')) {
      if (mode === 'focus') {
        const shouldLongBreak = (sessionsCompleted + 1) % 4 === 0;
        setMode(shouldLongBreak ? 'long-break' : 'short-break');
      } else {
        setMode('focus');
      }
    }
  };

  // Reset stats entirely
  const handleResetStats = () => {
    if (confirm('This will permanently delete your session history and statistics. Proceed?')) {
      setSessionsCompleted(0);
      setTotalFocusMinutes(0);
      localStorage.setItem('focus_sessions_completed', '0');
      localStorage.setItem('focus_total_minutes', '0');
    }
  };

  // Dynamic system date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Find the first active (incomplete) task to display in the timer
  const activeFocusTask = tasks.find(t => !t.completed);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased" id="app-viewport">
      
      {/* Sidebar Navigation - Matches Geometric Balance Theme */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-10 gap-10 shrink-0 hidden md:flex" id="theme-sidebar">
        {/* Logo */}
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 transition-all duration-300">
          <div className="w-4 h-4 bg-white rounded-sm"></div>
        </div>
        
        {/* Nav Items */}
        <nav className="flex flex-col gap-8 flex-1 justify-start mt-4">
          <button 
            className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-indigo-600 shadow-xs"
            title="Focus Timer Dashboard Button"
          >
            <Layout className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            title="Customize Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => {
              const text = prompt("Add a quick reflection goal:", "Stay present.");
              if (text) setTasks([...tasks, { id: Date.now().toString(), text, completed: false }]);
            }}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            title="Quick Task Insert"
          >
            <Plus className="w-5 h-5" />
          </button>
        </nav>

        {/* Bottom Profile Avatar Mock */}
        <div className="mt-auto w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors" title="Focus Profile">
          <User className="w-4 h-4 text-slate-500" />
        </div>
      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col p-6 md:p-12 max-w-7xl mx-auto w-full overflow-y-auto" id="theme-main">
        
        {/* Premium Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-slate-150" id="theme-header">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Focus Dashboard
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                Beta v2.0
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-0.5">{formattedDate}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Feedback state trigger */}
            <button
              id="sound-switch-widget"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                soundEnabled 
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
              }`}
              title={soundEnabled ? "Mute Zen Bells" : "Unmute Zen Bells"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden xs:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
            </button>

            {/* System Status Pill */}
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Active</span>
            </div>

            {/* Settings trigger for smaller viewports */}
            <button
              id="settings-trigger-md"
              onClick={() => setShowSettings(true)}
              className="md:hidden p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
              title="Configure Intervals"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Balanced Grid Layout - 12 Columns */}
        <div className="grid grid-cols-12 gap-6 flex-1 items-stretch" id="theme-grid">
          
          {/* Main Focus Checklist Card (Spans 8 cols on large viewports) */}
          <section className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col justify-between" id="theme-tasks-card">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Focus Task Goals</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Define your high-level priorities for this focus cycle</p>
                </div>
                <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500">
                  {tasks.filter(t => t.completed).length}/{tasks.length} Done
                </span>
              </div>

              {/* Task Insertion Form */}
              <form onSubmit={handleAddTask} className="flex gap-2.5 mb-6" id="theme-task-form">
                <input
                  type="text"
                  id="new-task-input-box"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Insert a high-priority work goal..."
                  className="flex-1 bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-850"
                />
                <button
                  type="submit"
                  id="task-add-submit-btn"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-2xl transition-all flex items-center justify-center gap-1.5 font-semibold text-xs focus:ring-2 focus:ring-offset-1 focus:ring-slate-950 active:scale-95 cursor-pointer"
                  title="Add goal"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Task</span>
                </button>
              </form>

              {/* Task Items list using Design HTML spacing */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1" id="theme-tasks-scroller">
                <AnimatePresence initial={false}>
                  {tasks.length > 0 ? (
                    tasks.map((task) => {
                      const isTaskCompleted = task.completed;
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className={`flex items-center p-4 rounded-2xl border transition-all duration-150 ${
                            isTaskCompleted 
                              ? 'bg-slate-50/70 border-slate-150 opacity-70' 
                              : 'bg-white border-slate-100 shadow-xs hover:border-slate-200 hover:bg-slate-50/30'
                          }`}
                        >
                          <button
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="flex items-center text-left flex-1 cursor-pointer focus:outline-none"
                            type="button"
                          >
                            <div className={`w-6 h-6 rounded-lg border-2 mr-4 flex items-center justify-center transition-all shrink-0 ${
                              isTaskCompleted 
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-600' 
                                : 'border-slate-300 hover:border-slate-400 bg-white'
                            }`}>
                              {isTaskCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold text-sm text-slate-800 transition-all ${
                                isTaskCompleted ? 'line-through text-slate-400 font-medium' : ''
                              }`}>
                                {task.text}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-semibold">
                                {isTaskCompleted ? 'Completed' : 'Pending Action'} &bull; Focus Target
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-slate-400 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-colors ml-2"
                            title="Remove Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                      No priorities set. Add a focal point above to maintain alignment.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Little indicator at the bottom of checklist */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Task Planner Engine</span>
              <span className="flex items-center gap-1.5 text-indigo-500">
                <Sparkles className="w-3 h-3" />
                Keep momentum high
              </span>
            </div>
          </section>

          {/* Interactive Dark Focus Timer Card (Spans 4 cols on large viewports) */}
          <section className="col-span-12 lg:col-span-4 bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-between text-white text-center shadow-xl relative min-h-[440px]" id="theme-timer-card">
            
            {/* Quick Timer Mode Switch Tabs inside the Dark card */}
            <div className="bg-slate-800/80 p-1 rounded-2xl w-full flex justify-between gap-1 mb-4 border border-slate-700/30" id="theme-tabs-container">
              <button
                onClick={() => setMode('focus')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'focus' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Flame className="w-3 h-3" />
                Focus
              </button>
              <button
                onClick={() => setMode('short-break')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'short-break' 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Coffee className="w-3 h-3" />
                Short
              </button>
              <button
                onClick={() => setMode('long-break')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'long-break' 
                    ? 'bg-amber-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Coffee className="w-3 h-3" />
                Long
              </button>
            </div>

            {/* Circular SVG Timer adapted to the theme */}
            <div className="relative w-48 h-48 flex items-center justify-center my-4" id="theme-clock-container">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 250 250">
                <circle
                  cx="125"
                  cy="125"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="125"
                  cy="125"
                  r={radius}
                  className={`${theme.primary} transition-all duration-300`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Inner details */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black font-mono tracking-tighter select-none">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                  Time Remaining
                </span>
              </div>
            </div>

            {/* Deep Work details / active task targeting */}
            <div className="w-full mb-6">
              <h3 className="text-base font-bold text-white tracking-tight mb-1">
                {mode === 'focus' ? 'Deep Work Session' : mode === 'short-break' ? 'Short Recovery' : 'Extended Recharge'}
              </h3>
              
              <div className="h-10 flex items-center justify-center px-4">
                {mode === 'focus' ? (
                  activeFocusTask ? (
                    <p className="text-xs text-slate-400 font-medium line-clamp-2 italic leading-relaxed">
                      Focusing on: <span className="text-slate-200 font-bold not-italic">"{activeFocusTask.text}"</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium italic">
                      Add and select an active goal target
                    </p>
                  )
                ) : (
                  <p className="text-xs text-teal-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
                    Breathing, resetting and unlinking stress
                  </p>
                )}
              </div>
            </div>

            {/* Core control keys */}
            <div className="w-full flex flex-col gap-2.5" id="theme-controls-stack">
              {/* Main Wide Play/Pause Button */}
              <button
                onClick={() => {
                  setIsRunning(!isRunning);
                  if (!isRunning) {
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      ctx.resume();
                    } catch(e) {}
                  }
                }}
                className={`w-full py-3.5 text-white font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm ${
                  isRunning 
                    ? 'bg-slate-800 hover:bg-slate-750 border border-slate-700' 
                    : theme.accentClass
                }`}
                title={isRunning ? "Pause" : "Start"}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4.5 h-4.5 fill-current" />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4.5 h-4.5 fill-current" />
                    <span>Resume Session</span>
                  </>
                )}
              </button>

              {/* Utility reset and skips flanking */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsRunning(false);
                    let initialMinutes = mode === 'focus' ? durations.focus : mode === 'short-break' ? durations.shortBreak : durations.longBreak;
                    setTimeLeft(initialMinutes * 60);
                  }}
                  className="flex-1 py-2.5 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700/30 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

                <button
                  onClick={handleSkip}
                  className="flex-1 py-2.5 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700/30 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Skip phase"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip Phase
                </button>
              </div>
            </div>
          </section>

          {/* Stats Card - Matches Geometric Balance Efficiency aesthetic (Spans 4 cols on large viewports) */}
          <section className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[220px]" id="theme-stats-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Session Analytics</span>
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            </div>
            
            <div className="my-4">
              <p className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                {sessionsCompleted} <span className="text-lg font-bold text-slate-400 font-sans uppercase">intervals</span>
              </p>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                Completed focus blocks today
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Goal Progress</span>
              <span className="text-indigo-600">
                {sessionsCompleted >= 4 ? 'Daily Goal Met! ✨' : `${4 - (sessionsCompleted % 4)} more to goal`}
              </span>
            </div>
          </section>

          {/* Interactive Notes/Quick Buffer Card - Matches Bottom Layout block (Spans 8 cols on large viewports) */}
          <section className="col-span-12 lg:col-span-8 bg-indigo-50 rounded-3xl border border-indigo-100 p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[220px]" id="theme-notes-card">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-xs font-black uppercase text-indigo-500 tracking-wider">
                  Distraction Buffer Notepad
                </h2>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-100/50 px-2 py-0.5 rounded-md">
                  Auto-Saved
                </span>
              </div>

              {/* Text Area Notepad for parsing unplanned thoughts */}
              <textarea
                value={quickBuffer}
                onChange={(e) => setQuickBuffer(e.target.value)}
                placeholder="Type anything here (ideas, distraction thoughts, reminders) to park them and stay focused..."
                className="w-full bg-transparent border-0 focus:ring-0 text-indigo-950 placeholder:text-indigo-300 italic text-sm font-medium leading-relaxed resize-none focus:outline-none min-h-[80px]"
              />
            </div>

            {/* Little indicator bar from design */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                <div className="w-8 h-1.5 bg-indigo-400 rounded-full"></div>
              </div>
              <span className="text-[10px] font-semibold text-indigo-400">
                Total Focus Today: <strong className="font-mono text-xs">{totalFocusMinutes}</strong> mins
              </span>
            </div>
          </section>

        </div>

        {/* Footer Area with clear branding */}
        <footer className="text-center text-[11px] font-semibold tracking-wider text-slate-400 mt-12 pt-6 border-t border-slate-100 uppercase" id="theme-footer">
          Geometric Balance System &bull; Active Node
        </footer>
      </main>

      {/* Customized Durations Settings Panel - Smooth Overlay Overlay */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="theme-settings-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
              id="theme-settings-panel"
            >
              {/* Dismiss Switch */}
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                title="Close settings"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-2 mb-5">
                <Settings className="w-4 h-4 text-indigo-600" />
                Customize Intervals (Minutes)
              </h3>

              {/* Sliders customized with theme styling */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Focus Session</span>
                    <span className="text-indigo-600 font-bold font-mono">{durations.focus}m</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={durations.focus}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDurations({ ...durations, focus: val });
                    }}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Short Recovery Break</span>
                    <span className="text-teal-600 font-bold font-mono">{durations.shortBreak}m</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={durations.shortBreak}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDurations({ ...durations, shortBreak: val });
                    }}
                    className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Long Recovery Break</span>
                    <span className="text-amber-600 font-bold font-mono">{durations.longBreak}m</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="45"
                    value={durations.longBreak}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDurations({ ...durations, longBreak: val });
                    }}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>
              </div>

              {/* Utility helpers */}
              <div className="pt-4 border-t border-slate-150 space-y-2.5">
                {/* Audio tester */}
                <button
                  type="button"
                  onClick={playZenBell}
                  className="w-full py-2 px-3 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  Test Notification Bell
                </button>

                {/* Reset storage statistics */}
                <button
                  type="button"
                  onClick={handleResetStats}
                  className="w-full py-2 px-3 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Session Analytics
                </button>
              </div>

              {/* Close applying changes button */}
              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl tracking-wide transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-950 cursor-pointer"
              >
                Apply Changes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
