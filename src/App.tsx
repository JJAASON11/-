import React, { useState, useEffect, useRef } from 'react';
import { Book, Feather, ScrollText, Compass, Plus, Trash2, Menu, X, Save, Edit3, AlignLeft, BookOpen, Search, Maximize, Minimize, Download, Wind, Users, Sparkles, MapPin, CheckSquare, PlusCircle, XCircle, List, FileText, Calendar, Clock, Target, Flame, Sun, SunMedium, Moon, Leaf, Camera, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

type Category = 'novel' | 'essay' | 'record' | 'plan' | 'diet';

interface Document {
  id: string;
  title: string;
  content: string;
  category: Category;
  updatedAt: number;
  createdAt: number;
  metadata?: any;
}

const CATEGORIES: { id: Category; name: string; icon: React.ElementType; desc: string }[] = [
  { id: 'novel', name: '大千世界', icon: Book, desc: '修真传记，推演造化' },
  { id: 'essay', name: '心境感悟', icon: Feather, desc: '灵光乍现，道心空明' },
  { id: 'record', name: '红尘历练', icon: ScrollText, desc: '岁月留痕，因果纠缠' },
  { id: 'plan', name: '大道之基', icon: Compass, desc: '修行规划，直指本心' },
  { id: 'diet', name: '灵膳录', icon: Flame, desc: '且食烟火，亦修长生' },
];

const analyzeSpiritWithGemini = async (imageBase64: string | null, mimeType: string | null, text: string) => {
  if (!imageBase64 && !text) throw new Error("请先铭刻影玉或输入灵膳描述！");
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `你是一位修仙界的鉴丹宗师。请鉴别用户提供的灵膳（图片或文字）。要求：1. 用修仙玄幻小说的风格描述它（控制在50字以内）。2. 估算它的热量（kcal），作为'calories'返回。返回严格JSON。`;
  
  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: imageBase64.split(',')[1]
      }
    });
  } else {
    parts.push({ text: `用户记录是：${text}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          calories: { type: Type.INTEGER }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

const MealCard = ({ id, title, icon: IconCmp, data, updateMeal }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    updateMeal(id, { isAnalyzing: true, error: null });
    try {
      const result = await analyzeSpiritWithGemini(data.image, data.mimeType, data.text);
      updateMeal(id, { 
        text: result.description || data.text, 
        calories: result.calories?.toString() || data.calories,
        isAnalyzing: false 
      });
    } catch (err: any) {
      updateMeal(id, { error: err.message || "神识受阻，探查失败。", isAnalyzing: false });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 压缩图片尺寸，防止 base64 过大导致 localStorage 爆满或页面崩溃
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 转换为 JPEG 格式并压缩质量
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          updateMeal(id, { image: dataUrl, mimeType: 'image/jpeg' });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[var(--color-ink)]/5 rounded-2xl border border-[var(--color-ink)]/5 p-5 mb-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--color-jade)]/10 text-[var(--color-jade)] rounded-xl border border-[var(--color-jade)]/20">
            <IconCmp size={20} />
          </div>
          <h3 className="font-bold tracking-widest text-[var(--color-ink)]">{title}</h3>
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={data.isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-jade)]/10 text-[var(--color-jade)] rounded-full text-xs font-bold border border-[var(--color-jade)]/20 active:scale-95 disabled:opacity-50"
        >
          {data.isAnalyzing ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
          <span>{data.isAnalyzing ? '推演中' : '探查灵蕴'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-[var(--color-paper)]/50 p-2 rounded-xl border border-[var(--color-ink)]/5">
        <Clock size={14} className="text-[var(--color-ink-light)]" />
        <span className="text-[10px] font-bold text-[var(--color-ink-light)] uppercase tracking-tighter">进膳时辰</span>
        <input 
          type="time" 
          value={data.time || ""} 
          onChange={(e) => updateMeal(id, { time: e.target.value })}
          className="bg-transparent border-none outline-none text-xs text-[var(--color-ink)] font-bold ml-auto cursor-pointer"
        />
      </div>

      {data.image ? (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 border border-[var(--color-ink)]/10 shadow-inner">
          <img src={data.image} className="w-full h-full object-cover" alt="灵膳" />
          <button onClick={() => updateMeal(id, { image: null, mimeType: null })} className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full hover:bg-red-500/80 transition-colors"><X size={14}/></button>
        </div>
      ) : (
        <div onClick={() => fileInputRef.current?.click()} className="w-full h-24 rounded-2xl border-2 border-dashed border-[var(--color-ink)]/20 bg-[var(--color-ink)]/5 flex flex-col items-center justify-center text-[var(--color-ink-light)] mb-4 cursor-pointer hover:bg-[var(--color-jade)]/5 transition-colors">
          <Camera size={24} className="mb-1 opacity-50"/>
          <span className="text-xs">铭刻影玉</span>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

      <textarea 
        value={data.text || ""} 
        onChange={(e) => updateMeal(id, { text: e.target.value })}
        placeholder="在此载入玉简 (描述灵膳)..."
        className="w-full p-3 bg-[var(--color-paper)]/50 rounded-xl border border-[var(--color-ink)]/10 focus:border-[var(--color-jade)] outline-none text-sm text-[var(--color-ink)] min-h-[60px] mb-3 transition-colors resize-y"
      />

      <div className="flex items-center gap-3 bg-[var(--color-jade)]/10 border border-[var(--color-jade)]/20 p-2.5 rounded-xl">
        <Wind size={18} className="text-[var(--color-jade)]" />
        <span className="text-xs font-bold text-[var(--color-ink)]">灵气值</span>
        <input 
          type="number" 
          value={data.calories || ""} 
          onChange={(e) => updateMeal(id, { calories: e.target.value })}
          className="flex-1 bg-transparent border-none outline-none text-right font-bold text-[var(--color-jade)] text-lg placeholder:text-[var(--color-jade)]/50" 
          placeholder="0"
        />
        <span className="text-xs text-[var(--color-ink-light)] font-bold">点</span>
      </div>
      {data.error && <div className="mt-2 text-[10px] text-[var(--color-cinnabar)] text-center">{data.error}</div>}
    </div>
  );
};

const REALMS = [
  { name: '凡人', min: 0, max: 1000 },
  { name: '炼气', min: 1000, max: 5000 },
  { name: '筑基', min: 5000, max: 20000 },
  { name: '金丹', min: 20000, max: 50000 },
  { name: '元婴', min: 50000, max: 100000 },
  { name: '化神', min: 100000, max: 500000 },
  { name: '合体', min: 500000, max: 1000000 },
  { name: '大乘', min: 1000000, max: 5000000 },
  { name: '渡劫', min: 5000000, max: Infinity },
];

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('novel');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle window resize for mobile sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('xianxia_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDocuments(parsed);
      } catch (e) {
        console.error('Failed to parse saved documents', e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (documents.length > 0) {
      try {
        localStorage.setItem('xianxia_docs', JSON.stringify(documents));
      } catch (e) {
        console.error('Failed to save documents to localStorage (possibly quota exceeded)', e);
        // 如果是因为图片太大导致存入失败，这里可以捕获异常，防止整个 React 树崩溃
      }
    }
  }, [documents]);

  const activeDoc = documents.find(d => d.id === activeDocId) || null;
  const currentCategoryDocs = documents
    .filter(d => d.category === activeCategory)
    .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // Calculate Realm based on total words
  const totalWords = documents.reduce((acc, doc) => acc + doc.content.length, 0);
  const currentRealmIndex = REALMS.findIndex(r => totalWords >= r.min && totalWords < r.max);
  const currentRealm = currentRealmIndex !== -1 ? REALMS[currentRealmIndex] : REALMS[0];
  const nextRealm = REALMS[currentRealmIndex + 1];
  const realmProgress = nextRealm ? ((totalWords - currentRealm.min) / (nextRealm.min - currentRealm.min)) * 100 : 100;

  const createDocument = () => {
    let initialMetadata = {};
    if (activeCategory === 'novel') initialMetadata = { characters: [], chapters: [], outline: '' };
    if (activeCategory === 'essay') initialMetadata = { mood: '心如止水' };
    if (activeCategory === 'record') initialMetadata = { location: '', karma: false };
    if (activeCategory === 'plan') initialMetadata = { tasks: [], targetDate: '', targetTime: '', dailyTask: '' };
    if (activeCategory === 'diet') {
      initialMetadata = {
        meals: {
          breakfast: { text: '', calories: '', time: '08:00', image: null, mimeType: null, isAnalyzing: false },
          lunch: { text: '', calories: '', time: '12:00', image: null, mimeType: null, isAnalyzing: false },
          dinner: { text: '', calories: '', time: '18:30', image: null, mimeType: null, isAnalyzing: false },
          snacks: { text: '', calories: '', time: '15:00', image: null, mimeType: null, isAnalyzing: false },
        }
      };
    }

    const newDoc: Document = {
      id: Date.now().toString(),
      title: activeCategory === 'diet' ? new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '无名卷宗',
      content: '',
      category: activeCategory,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      metadata: initialMetadata,
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id 
        ? { ...doc, ...updates, updatedAt: Date.now() } 
        : doc
    ));
    
    // Show brief saving indicator
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocToDelete(id);
  };

  const executeDelete = () => {
    if (docToDelete) {
      setDocuments(prev => prev.filter(d => d.id !== docToDelete));
      if (activeDocId === docToDelete) {
        setActiveDocId(null);
      }
      setDocToDelete(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    updateDocument(activeDocId!, { content: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = activeDoc!.content.substring(0, start) + '    ' + activeDoc!.content.substring(end);
      updateDocument(activeDocId!, { content: newContent });
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const exportDocument = () => {
    if (!activeDoc) return;
    const blob = new Blob([`${activeDoc.title}\n\n${activeDoc.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title || '无名卷宗'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-paper)] text-[var(--color-ink)] selection:bg-[var(--color-jade)] selection:text-[var(--color-paper)]">
      
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/20 z-20 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="absolute md:relative h-full flex-shrink-0 border-r border-[var(--color-ink)]/10 bg-[var(--color-paper-dark)]/95 md:bg-[var(--color-paper-dark)]/50 backdrop-blur-md flex flex-col overflow-hidden z-30 shadow-2xl md:shadow-none"
            >
            {/* Sidebar Header & Realm Info */}
            <div className="p-6 pb-4 border-b border-[var(--color-ink)]/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[var(--color-cinnabar)]/30 flex items-center justify-center bg-[var(--color-paper)] shadow-[0_0_10px_rgba(139,38,38,0.2)] animate-breathe-cinnabar">
                    <span className="font-serif text-[var(--color-cinnabar)] font-bold">仙</span>
                  </div>
                  <h1 className="font-serif text-xl tracking-widest font-medium">仙道纪事</h1>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-full hover:bg-[var(--color-ink)]/5 transition-colors text-[var(--color-ink-light)]"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Realm Progress */}
              <div className="bg-[var(--color-ink)]/5 rounded-lg p-3 border border-[var(--color-ink)]/5">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-xs text-[var(--color-ink-light)] tracking-widest block mb-1">当前境界</span>
                    <span className="font-serif font-bold text-[var(--color-jade)] tracking-widest">{currentRealm.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--color-ink-light)]/60 tracking-widest block mb-1">总道纹</span>
                    <span className="font-mono text-xs text-[var(--color-ink)]">{totalWords.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-1 w-full bg-[var(--color-ink)]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--color-jade)] transition-all duration-1000 ease-out relative"
                    style={{ width: `${realmProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
                {nextRealm && (
                  <div className="text-[9px] text-[var(--color-ink-light)]/50 text-right mt-1 tracking-widest">
                    距突破至 {nextRealm.name} 尚需 {nextRealm.min - totalWords} 道纹
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-4 flex flex-wrap gap-2 border-b border-[var(--color-ink)]/5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setActiveDocId(null);
                    setSearchQuery('');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg min-w-[64px] flex-1 transition-all duration-300 ${
                    activeCategory === cat.id 
                      ? 'bg-[var(--color-jade)]/10 text-[var(--color-jade)] shadow-sm border border-[var(--color-jade)]/20' 
                      : 'text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 border border-transparent'
                  }`}
                >
                  <cat.icon size={20} className="mb-1" strokeWidth={activeCategory === cat.id ? 2 : 1.5} />
                  <span className="text-[10px] font-medium tracking-widest">{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 border-b border-[var(--color-ink)]/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-light)]/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="神识探查 (搜索)..."
                  className="w-full bg-[var(--color-ink)]/5 border-none rounded-full py-1.5 pl-9 pr-4 text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-light)]/40 focus:ring-1 focus:ring-[var(--color-jade)]/30 outline-none transition-all"
                />
              </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs text-[var(--color-ink-light)] tracking-widest font-medium">
                  {CATEGORIES.find(c => c.id === activeCategory)?.desc}
                </span>
                <button 
                  onClick={createDocument}
                  className="p-1.5 rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-jade)] transition-colors shadow-md"
                  title="凝聚玉简"
                >
                  <Plus size={16} />
                </button>
              </div>

              <AnimatePresence>
                {currentCategoryDocs.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-32 text-[var(--color-ink-light)]/50 italic"
                  >
                    <Wind size={24} className="mb-2 opacity-50" />
                    <span className="text-sm tracking-widest">虚空荡荡，尚无玉简留存</span>
                  </motion.div>
                ) : (
                  currentCategoryDocs.map(doc => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                        activeDocId === doc.id
                          ? 'bg-[var(--color-paper)] border-[var(--color-gold)]/30 shadow-md'
                          : 'bg-transparent border-transparent hover:bg-[var(--color-ink)]/5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif font-medium truncate pr-4 text-[var(--color-ink)]">
                          {doc.title || '无名卷宗'}
                        </h3>
                        <button
                          onClick={(e) => confirmDelete(doc.id, e)}
                          className="md:opacity-0 group-hover:opacity-100 p-2 md:p-1 text-[var(--color-cinnabar)]/70 hover:text-[var(--color-cinnabar)] hover:bg-[var(--color-cinnabar)]/10 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-[var(--color-ink-light)] line-clamp-2 mb-3 leading-relaxed opacity-80">
                        {doc.content || '...'}
                      </p>
                      <div className="text-[10px] text-[var(--color-ink-light)]/60 flex items-center">
                        <Edit3 size={10} className="mr-1" />
                        {formatDate(doc.updatedAt)}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--color-paper)]">
        
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-ink)]/5 relative z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-2 md:mr-4 rounded-full hover:bg-[var(--color-ink)]/5 transition-colors text-[var(--color-ink-light)]"
            >
              <Menu size={20} />
            </button>
            
            {activeDoc && (
              <div className="flex items-center text-xs md:text-sm text-[var(--color-ink-light)]">
                <span className="tracking-widest hidden sm:inline">{CATEGORIES.find(c => c.id === activeDoc.category)?.name}</span>
                <span className="mx-2 opacity-50 hidden sm:inline">/</span>
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{activeDoc.title}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSaving && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center text-xs text-[var(--color-jade)] mr-2"
                >
                  <Save size={14} className="mr-1" />
                  <span>已存入玉简</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {activeDoc && (
              <button 
                onClick={exportDocument}
                className="p-2 rounded-full hover:bg-[var(--color-ink)]/5 transition-colors text-[var(--color-ink-light)]"
                title="拓印玉简 (导出TXT)"
              >
                <Download size={18} />
              </button>
            )}
            
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-[var(--color-ink)]/5 transition-colors text-[var(--color-ink-light)]"
              title={isFullscreen ? "破关而出 (退出全屏)" : "闭关修炼 (全屏模式)"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar relative">
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
             <BookOpen size={400} strokeWidth={0.5} />
          </div>
          <div className="absolute top-20 left-10 opacity-10 pointer-events-none vertical-text text-4xl font-serif text-[var(--color-cinnabar)] tracking-[1em] select-none">
            {activeDoc ? CATEGORIES.find(c => c.id === activeDoc.category)?.name : ''}
          </div>

          {activeDoc ? (
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-16 relative z-10 min-h-full flex flex-col">
              <input
                type="text"
                value={activeDoc.title}
                onChange={(e) => updateDocument(activeDoc.id, { title: e.target.value })}
                placeholder="卷宗名..."
                className="w-full bg-transparent text-3xl sm:text-4xl font-serif font-bold mb-6 sm:mb-8 text-[var(--color-ink)] placeholder-[var(--color-ink)]/20 border-none focus:ring-0"
              />
              
              <div className="w-12 h-1 bg-[var(--color-cinnabar)]/30 mb-6 sm:mb-8 rounded-full"></div>

              {/* Category Specific Features */}
              {activeDoc.category === 'novel' && (
                <div className="mb-6 space-y-4">
                  {/* Outline */}
                  <div className="bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/5">
                    <h4 className="font-serif text-sm text-[var(--color-ink)] flex items-center tracking-widest mb-3">
                      <FileText size={14} className="mr-2 text-[var(--color-jade)]"/> 天机大纲 (剧情推演)
                    </h4>
                    <textarea
                      value={activeDoc.metadata?.outline || ''}
                      onChange={(e) => updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, outline: e.target.value } })}
                      placeholder="天地初开，万物生发... (输入大纲剧情)"
                      className="w-full bg-transparent border border-[var(--color-ink)]/10 rounded-lg p-2 text-sm outline-none focus:border-[var(--color-jade)] min-h-[80px] resize-y"
                    />
                  </div>

                  {/* Chapters */}
                  <div className="bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-serif text-sm text-[var(--color-ink)] flex items-center tracking-widest">
                        <List size={14} className="mr-2 text-[var(--color-jade)]"/> 诸天卷轴 (章节目录)
                      </h4>
                      <button onClick={() => {
                        const chapters = activeDoc.metadata?.chapters || [];
                        updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, chapters: [...chapters, { title: '', summary: '' }] } });
                      }} className="text-[var(--color-jade)] hover:text-[var(--color-jade)]/70"><PlusCircle size={14}/></button>
                    </div>
                    <div className="space-y-2">
                      {(activeDoc.metadata?.chapters || []).map((chap: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <input value={chap.title} onChange={(e) => {
                              const chapters = [...(activeDoc.metadata?.chapters || [])];
                              chapters[idx].title = e.target.value;
                              updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, chapters } });
                            }} placeholder={`第${idx + 1}章 标题`} className="bg-transparent border-b border-[var(--color-ink)]/20 text-sm px-1 py-0.5 w-full focus:border-[var(--color-jade)] outline-none font-medium" />
                            <input value={chap.summary} onChange={(e) => {
                              const chapters = [...(activeDoc.metadata?.chapters || [])];
                              chapters[idx].summary = e.target.value;
                              updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, chapters } });
                            }} placeholder="本章天机 (剧情简述)" className="bg-transparent border-b border-[var(--color-ink)]/10 text-xs px-1 py-0.5 w-full focus:border-[var(--color-jade)] outline-none text-[var(--color-ink-light)]" />
                          </div>
                          <button onClick={() => {
                            const chapters = (activeDoc.metadata?.chapters || []).filter((_: any, i: number) => i !== idx);
                            updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, chapters } });
                          }} className="text-[var(--color-cinnabar)]/50 hover:text-[var(--color-cinnabar)] mt-1"><XCircle size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Characters */}
                  <div className="bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-serif text-sm text-[var(--color-ink)] flex items-center tracking-widest">
                        <Users size={14} className="mr-2 text-[var(--color-jade)]"/> 登场生灵 (人物志)
                      </h4>
                      <button onClick={() => {
                        const chars = activeDoc.metadata?.characters || [];
                        updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, characters: [...chars, { name: '', role: '' }] } });
                      }} className="text-[var(--color-jade)] hover:text-[var(--color-jade)]/70"><PlusCircle size={14}/></button>
                    </div>
                    <div className="space-y-2">
                      {(activeDoc.metadata?.characters || []).map((char: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input value={char.name} onChange={(e) => {
                            const chars = [...(activeDoc.metadata?.characters || [])];
                            chars[idx].name = e.target.value;
                            updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, characters: chars } });
                          }} placeholder="尊姓大名" className="bg-transparent border-b border-[var(--color-ink)]/20 text-sm px-1 py-0.5 w-1/3 focus:border-[var(--color-jade)] outline-none" />
                          <input value={char.role} onChange={(e) => {
                            const chars = [...(activeDoc.metadata?.characters || [])];
                            chars[idx].role = e.target.value;
                            updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, characters: chars } });
                          }} placeholder="身份/境界" className="bg-transparent border-b border-[var(--color-ink)]/20 text-sm px-1 py-0.5 flex-1 focus:border-[var(--color-jade)] outline-none" />
                          <button onClick={() => {
                            const chars = (activeDoc.metadata?.characters || []).filter((_: any, i: number) => i !== idx);
                            updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, characters: chars } });
                          }} className="text-[var(--color-cinnabar)]/50 hover:text-[var(--color-cinnabar)]"><XCircle size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeDoc.category === 'essay' && (
                <div className="mb-6 flex items-center gap-3 flex-wrap">
                  <span className="font-serif text-sm text-[var(--color-ink-light)] flex items-center tracking-widest">
                    <Sparkles size={14} className="mr-2 text-[var(--color-gold)]"/> 当前心境：
                  </span>
                  {['心如止水', '灵光乍现', '走火入魔', '大道至简'].map(mood => (
                    <button key={mood} onClick={() => updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, mood } })}
                      className={`px-3 py-1 rounded-full text-xs tracking-widest transition-colors border ${activeDoc.metadata?.mood === mood ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)]/50 text-[var(--color-ink)]' : 'border-[var(--color-ink)]/10 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5'}`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              )}

              {activeDoc.category === 'record' && (
                <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/5">
                  <div className="flex items-center flex-1 border-b border-[var(--color-ink)]/20 pb-1">
                    <MapPin size={14} className="mr-2 text-[var(--color-cinnabar)]"/>
                    <input value={activeDoc.metadata?.location || ''} onChange={(e) => updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, location: e.target.value } })} placeholder="历练之地 (如：血色禁地)" className="bg-transparent text-sm w-full outline-none placeholder-[var(--color-ink)]/30" />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-serif cursor-pointer">
                    <input type="checkbox" checked={activeDoc.metadata?.karma || false} onChange={(e) => updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, karma: e.target.checked } })} className="accent-[var(--color-cinnabar)] w-4 h-4" />
                    <span className={activeDoc.metadata?.karma ? 'text-[var(--color-cinnabar)]' : 'text-[var(--color-ink-light)]'}>结下因果</span>
                  </label>
                </div>
              )}

              {activeDoc.category === 'plan' && (
                <div className="mb-6 space-y-4">
                  {/* Time Settings */}
                  <div className="bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <h4 className="font-serif text-sm text-[var(--color-ink)] flex items-center tracking-widest mb-2">
                        <Calendar size={14} className="mr-2 text-[var(--color-jade)]"/> 结丹之期 (截止日期)
                      </h4>
                      <input 
                        type="date" 
                        value={activeDoc.metadata?.targetDate || ''} 
                        onChange={(e) => updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, targetDate: e.target.value } })}
                        className="bg-transparent border-b border-[var(--color-ink)]/20 text-sm px-1 py-1 w-full focus:border-[var(--color-jade)] outline-none font-sans"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-sm text-[var(--color-ink)] flex items-center tracking-widest mb-2">
                        <Clock size={14} className="mr-2 text-[var(--color-jade)]"/> 吉时 (具体时辰)
                      </h4>
                      <input 
                        type="time" 
                        value={activeDoc.metadata?.targetTime || ''} 
                        onChange={(e) => updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, targetTime: e.target.value } })}
                        className="bg-transparent border-b border-[var(--color-ink)]/20 text-sm px-1 py-1 w-full focus:border-[var(--color-jade)] outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Daily Task */}
                  <div className="bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/5">
                    <h4 className="font-serif text-sm text-[var(--color-ink)] flex items-center tracking-widest mb-2">
                      <Target size={14} className="mr-2 text-[var(--color-cinnabar)]"/> 今日主修 (核心任务)
                    </h4>
                    <input 
                      type="text" 
                      value={activeDoc.metadata?.dailyTask || ''} 
                      onChange={(e) => updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, dailyTask: e.target.value } })}
                      placeholder="今日需参悟何种功法？(如：炼制三炉凝气散)"
                      className="bg-transparent border-b border-[var(--color-ink)]/20 text-sm px-1 py-1 w-full focus:border-[var(--color-cinnabar)] outline-none"
                    />
                  </div>

                  {/* Tasks */}
                  <div className="bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-serif text-sm text-[var(--color-ink)] flex items-center tracking-widest">
                        <CheckSquare size={14} className="mr-2 text-[var(--color-jade)]"/> 修行目标 (突破契机)
                      </h4>
                      <button onClick={() => {
                        const tasks = activeDoc.metadata?.tasks || [];
                        updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, tasks: [...tasks, { id: Date.now().toString(), text: '', completed: false }] } });
                      }} className="text-[var(--color-jade)] hover:text-[var(--color-jade)]/70"><PlusCircle size={14}/></button>
                    </div>
                    <div className="space-y-2">
                      {(activeDoc.metadata?.tasks || []).map((task: any, idx: number) => (
                        <div key={task.id} className="flex gap-3 items-center">
                          <input type="checkbox" checked={task.completed} onChange={(e) => {
                            const tasks = [...(activeDoc.metadata?.tasks || [])];
                            tasks[idx].completed = e.target.checked;
                            updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, tasks } });
                          }} className="accent-[var(--color-jade)] w-4 h-4 cursor-pointer" />
                          <input value={task.text} onChange={(e) => {
                            const tasks = [...(activeDoc.metadata?.tasks || [])];
                            tasks[idx].text = e.target.value;
                            updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, tasks } });
                          }} placeholder="需达成的目标..." className={`bg-transparent border-b border-[var(--color-ink)]/10 text-sm px-1 py-0.5 flex-1 outline-none focus:border-[var(--color-jade)] ${task.completed ? 'line-through text-[var(--color-ink-light)]/50' : ''}`} />
                          <button onClick={() => {
                            const tasks = (activeDoc.metadata?.tasks || []).filter((_: any, i: number) => i !== idx);
                            updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, tasks } });
                          }} className="text-[var(--color-cinnabar)]/50 hover:text-[var(--color-cinnabar)]"><XCircle size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeDoc.category === 'diet' ? (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-[var(--color-jade)] to-emerald-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden mb-8">
                    <div className="relative z-10 opacity-80 text-[10px] tracking-widest flex items-center gap-1 mb-1"><Wind size={12}/> 今日纳灵总计</div>
                    <div className="relative z-10 flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {Object.values(activeDoc.metadata?.meals || {}).reduce((s: number, m: any) => s + (parseInt(m.calories) || 0), 0)}
                        </span>
                        <span className="text-xs opacity-70 ml-1">点灵力</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  </div>

                  <MealCard 
                    id="breakfast" 
                    title="晨食 · 朝露" 
                    icon={Sun} 
                    data={activeDoc.metadata?.meals?.breakfast || {}} 
                    updateMeal={(mealId: string, updates: any) => {
                      const newMeals = { ...activeDoc.metadata?.meals, [mealId]: { ...activeDoc.metadata?.meals?.[mealId], ...updates } };
                      updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, meals: newMeals } });
                    }} 
                  />
                  <MealCard 
                    id="lunch" 
                    title="午膳 · 骄阳" 
                    icon={SunMedium} 
                    data={activeDoc.metadata?.meals?.lunch || {}} 
                    updateMeal={(mealId: string, updates: any) => {
                      const newMeals = { ...activeDoc.metadata?.meals, [mealId]: { ...activeDoc.metadata?.meals?.[mealId], ...updates } };
                      updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, meals: newMeals } });
                    }} 
                  />
                  <MealCard 
                    id="dinner" 
                    title="晚膳 · 皓月" 
                    icon={Moon} 
                    data={activeDoc.metadata?.meals?.dinner || {}} 
                    updateMeal={(mealId: string, updates: any) => {
                      const newMeals = { ...activeDoc.metadata?.meals, [mealId]: { ...activeDoc.metadata?.meals?.[mealId], ...updates } };
                      updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, meals: newMeals } });
                    }} 
                  />
                  <MealCard 
                    id="snacks" 
                    title="灵果 · 补给" 
                    icon={Leaf} 
                    data={activeDoc.metadata?.meals?.snacks || {}} 
                    updateMeal={(mealId: string, updates: any) => {
                      const newMeals = { ...activeDoc.metadata?.meals, [mealId]: { ...activeDoc.metadata?.meals?.[mealId], ...updates } };
                      updateDocument(activeDoc.id, { metadata: { ...activeDoc.metadata, meals: newMeals } });
                    }} 
                  />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={activeDoc.content}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="落笔生花..."
                  className="w-full flex-1 bg-transparent text-base sm:text-lg leading-loose font-serif text-[var(--color-ink-light)] placeholder-[var(--color-ink)]/20 border-none focus:ring-0 resize-none min-h-[50vh]"
                  style={{ height: 'auto' }}
                />
              )}
              
              <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-[var(--color-ink)]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 text-xs text-[var(--color-ink-light)]/50 font-serif">
                <div className="flex gap-4 sm:gap-6">
                  <span>道纹：{activeDoc.content.length}</span>
                  <span>参悟需时：{Math.max(1, Math.ceil(activeDoc.content.length / 300))} 盏茶</span>
                </div>
                <span>最近祭炼：{formatDate(activeDoc.updatedAt)}</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-ink-light)]/40 relative z-10">
              <div className="w-24 h-24 mb-6 rounded-full border border-[var(--color-jade)]/20 flex items-center justify-center bg-[var(--color-paper-dark)]/30 animate-breathe">
                <Wind size={40} strokeWidth={1} className="text-[var(--color-jade)]/60" />
              </div>
              <p className="font-serif text-xl tracking-widest">静心凝神，方可入道</p>
              <p className="mt-4 text-sm tracking-wider">请于左侧探查或凝聚玉简</p>
              
              <button 
                onClick={createDocument}
                className="mt-8 px-6 py-2 rounded-full border border-[var(--color-jade)]/30 text-[var(--color-jade)] hover:bg-[var(--color-jade)]/10 transition-colors tracking-widest text-sm shadow-[0_0_15px_rgba(92,122,107,0.1)]"
              >
                凝聚玉简
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {docToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-paper)] border border-[var(--color-gold)]/30 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4"
            >
              <h3 className="font-serif text-xl tracking-widest text-[var(--color-ink)] mb-4 flex items-center">
                <Feather className="mr-2 text-[var(--color-cinnabar)]" size={20} />
                化为飞灰
              </h3>
              <p className="text-[var(--color-ink-light)] text-sm mb-6 tracking-wider">
                此卷宗一旦销毁，将彻底消散于天地间，无法找回。是否继续？
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDocToDelete(null)}
                  className="px-4 py-2 rounded-lg text-sm tracking-widest text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 transition-colors"
                >
                  暂留一念
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 rounded-lg text-sm tracking-widest bg-[var(--color-cinnabar)] text-[var(--color-paper)] hover:bg-[var(--color-cinnabar)]/90 transition-colors shadow-md"
                >
                  形神俱灭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
