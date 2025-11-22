
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bars3Icon, PlusIcon, XMarkIcon, TrashIcon, PencilIcon, 
  ArrowPathIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, 
  FolderOpenIcon, LanguageIcon, ChevronUpIcon, ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon,
  CheckCircleIcon, PaperAirplaneIcon, DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { translateText } from './services/gemini';

// --- Types ---

interface Board {
  id: string;
  name: string;
  order: number;
}

interface Note {
  id: string;
  boardId: string;
  content: string;
  timestamp: number;
  isExpanded: boolean;
}

interface TrashItem extends Note {
  deletedAt: number;
  originalBoardName: string;
}

// --- Helper Components ---

const Toast = ({ message, show }: { message: string, show: boolean }) => (
  <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg border border-gray-700 transition-opacity duration-300 z-50 flex items-center gap-2 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
    <CheckCircleIcon className="w-5 h-5 text-green-400" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

// --- Extracted Components ---
// نافذة الترجمة
const TranslationModal = ({ 
  isOpen, 
  onClose, 
  initialContent, 
  onCopy 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  initialContent: string, 
  onCopy: (text: string) => void 
}) => {
    const [sourceLang, setSourceLang] = useState('Arabic');
    const [targetLang, setTargetLang] = useState('English');
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [localOriginal, setLocalOriginal] = useState(initialContent || '');

    // Initial translation on mount
    useEffect(() => {
        if (initialContent) {
            setLocalOriginal(initialContent);
        }
    }, [initialContent]);

    // Real-time translation with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!localOriginal.trim()) return;
            
            setIsTranslating(true);
            try {
                const result = await translateText(localOriginal, sourceLang, targetLang);
                setTranslatedText(result);
            } catch (e) {
                console.error("Translation silent error", e);
            } finally {
                setIsTranslating(false);
            }
        }, 1000); // 1 second debounce to prevent API spam

        return () => clearTimeout(timer);
    }, [localOriginal, sourceLang, targetLang]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-2xl border border-gray-200 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
               <LanguageIcon className="w-5 h-5 text-blue-600" />
               الترجمة الفورية
            </h3>
            <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500 hover:text-red-500 transition" /></button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 md:gap-4 p-3 md:p-4 bg-white border-b border-gray-100 shrink-0 text-sm md:text-base">
             <div className="flex-1 flex flex-col gap-1">
               <label className="text-[10px] md:text-xs text-gray-500">من</label>
               <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-900 w-full">
                 <option value="Arabic">العربية</option>
                 <option value="English">الإنجليزية</option>
                 <option value="French">الفرنسية</option>
                 <option value="Spanish">الإسبانية</option>
                 <option value="German">الألمانية</option>
               </select>
             </div>

             <button
               onClick={() => {
                 const tempLang = sourceLang;
                 setSourceLang(targetLang);
                 setTargetLang(tempLang);
                 const tempText = localOriginal;
                 setLocalOriginal(translatedText);
                 setTranslatedText(tempText);
               }}
               className="mt-5 p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
               title="تبديل اللغات والنصوص"
             >
               <ArrowPathIcon className="w-5 h-5" />
             </button>

             <div className="flex-1 flex flex-col gap-1">
               <label className="text-[10px] md:text-xs text-gray-500">إلى</label>
               <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-900 w-full">
                 <option value="English">الإنجليزية</option>
                 <option value="Arabic">العربية</option>
                 <option value="French">الفرنسية</option>
                 <option value="Spanish">الإسبانية</option>
                 <option value="German">الألمانية</option>
               </select>
             </div>
          </div>

          {/* Split View - Side-by-side for easy comparison */}
          <div className="flex-1 flex flex-row overflow-hidden">
             {/* Original */}
             <div className="flex-1 flex flex-col border-r border-gray-200 min-h-0">
                <textarea
                  dir={sourceLang === 'Arabic' ? 'rtl' : 'ltr'}
                  className={`flex-1 bg-gray-50/50 p-4 resize-none outline-none focus:bg-white transition text-gray-800 leading-relaxed text-base md:text-lg break-words ${sourceLang === 'Arabic' ? 'text-right' : 'text-left'}`}
                  value={localOriginal}
                  onChange={(e) => setLocalOriginal(e.target.value)}
                  placeholder="اكتب النص هنا..."
                />
                <div className="p-2 md:p-3 border-t border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                   <span className="text-[14px] md:text-xs text-gray-500">النص الأصلي</span>
                   <button onClick={() => onCopy(localOriginal)} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-100 text-blue-600 font-medium">نسخ الأصلي</button>
                </div>
             </div>
             
             {/* Translated */}
             <div className="flex-1 flex flex-col bg-blue-50/10 min-h-0">
                <textarea
                  dir={targetLang === 'Arabic' ? 'rtl' : 'ltr'}
                  className={`flex-1 bg-transparent p-4 resize-none outline-none text-gray-800 leading-relaxed text-base md:text-lg break-words ${targetLang === 'Arabic' ? 'text-right' : 'text-left'}`}
                  value={translatedText}
                  readOnly
                  placeholder="الترجمة ستظهر هنا..."
                />
                <div className="p-2 md:p-3 border-t border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                   <span className="text-[14px] md:text-xs text-gray-500">الترجمة</span>
                   <button onClick={() => onCopy(translatedText)} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-100 text-green-600 font-medium">نسخ الترجمة</button>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
};


// --- Main Application ---

const App: React.FC = () => {
  // --- State with Lazy Initialization for Persistence ---
  
  const [boards, setBoards] = useState<Board[]>(() => {
    try {
      const saved = localStorage.getItem('app_boards');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load boards', e);
    }
    // Default state if nothing in local storage
    return [
      { id: '1', name: 'عام', order: 0 },
      { id: '2', name: 'شخصي', order: 1 },
      { id: '3', name: 'عمل', order: 2 }
    ];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('app_notes');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  const [trash, setTrash] = useState<TrashItem[]>(() => {
    try {
      const saved = localStorage.getItem('app_trash');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  const [activeBoardId, setActiveBoardId] = useState<string>('1');
  
  // Inputs
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBoardsExpanded, setIsBoardsExpanded] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null); // Highlighted note
  const [toastMsg, setToastMsg] = useState('');
  
  // Modals
  const [modal, setModal] = useState<{
    type: 'NONE' | 'ADD_BOARD' | 'EDIT_BOARD_NAME' | 'REORDER' | 'TRASH' | 'TRANSLATE' | 'MOVE_TO' | 'DELETE_BOARD' | 'EDIT_NOTE';
    data?: any;
  }>({ type: 'NONE' });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Effects ---

  // Save to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem('app_boards', JSON.stringify(boards));
    localStorage.setItem('app_notes', JSON.stringify(notes));
    localStorage.setItem('app_trash', JSON.stringify(trash));
  }, [boards, notes, trash]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  // --- Actions ---

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSaveNote = () => {
    if (!inputText.trim()) return;

    // Save as a SINGLE note block
    const newNote: Note = {
      id: crypto.randomUUID(),
      boardId: activeBoardId,
      content: inputText, 
      timestamp: Date.now(),
      isExpanded: false
    };

    setNotes(prev => [newNote, ...prev]); // Add to top
    setInputText('');
    showToast('تم الحفظ بنجاح');
  };

  const toggleNoteExpansion = (noteId: string) => {
    setActiveNoteId(noteId);
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, isExpanded: !n.isExpanded } : n
    ));
  };

  const handleBoardDelete = () => {
    const board = boards.find(b => b.id === modal.data?.id);
    if (!board) return;
    
    const boardNotes = notes.filter(n => n.boardId === board.id);
    const trashNotes = boardNotes.map(n => ({
      ...n,
      deletedAt: Date.now(),
      originalBoardName: board.name
    }));
    
    setTrash(prev => [...prev, ...trashNotes]);
    setNotes(prev => prev.filter(n => n.boardId !== board.id));
    setBoards(prev => prev.filter(b => b.id !== board.id));
    
    if (activeBoardId === board.id) {
      setActiveBoardId(boards.find(b => b.id !== board.id)?.id || '');
    }
    setModal({ type: 'NONE' });
    showToast('تم حذف اللوحة');
  };

  // Import / Export
  const handleExport = async () => {
    const data = JSON.stringify({ boards, notes, trash }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const filename = `notes_backup_${new Date().toISOString().slice(0,10)}.json`;

    const downloadFallback = () => {
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
         showToast('تم التصدير (المجلد الافتراضي)');
    };

    if ('showSaveFilePicker' in window) {
      try {
        // Use the File System Access API
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup File',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast('تم حفظ النسخة بنجاح');
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User cancelled the picker
          return;
        }
        // Fallback if showSaveFilePicker fails (e.g. cross-origin iframe error)
        console.warn("showSaveFilePicker failed, using fallback", err);
        downloadFallback();
      }
    } else {
      // Explicitly inform user about fallback
      alert('متصفحك لا يدعم نافذة اختيار مكان الحفظ، سيتم التنزيل في المجلد الافتراضي للمتصفح.');
      downloadFallback();
    }
  };

  const importFileRef = useRef<HTMLInputElement>(null);
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.boards && data.notes) {
           if (confirm('هل أنت متأكد؟ سيتم استبدال البيانات الحالية بالبيانات المستوردة.')) {
             setBoards(data.boards);
             setNotes(data.notes);
             if (data.trash) setTrash(data.trash);
             setIsSidebarOpen(false);
             showToast('تم الاستيراد بنجاح');
           }
        }
      } catch (err) {
        alert('فشل الاستيراد، ملف غير صالح.');
      }
    };
    reader.readAsText(file);
  };

  // Note Actions
  const deleteNote = (note: Note) => {
    const trashItem: TrashItem = {
      ...note,
      deletedAt: Date.now(),
      originalBoardName: boards.find(b => b.id === note.boardId)?.name || 'Unknown'
    };
    setTrash(prev => [trashItem, ...prev]);
    setNotes(prev => prev.filter(n => n.id !== note.id));
    showToast('نقلت للمحذوفات');
  };

  const copyNote = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم نسخ النص');
  };

  // --- Filtered Data ---
  const sortedBoards = useMemo(() => [...boards].sort((a, b) => a.order - b.order), [boards]);
  
  const visibleNotes = useMemo(() => {
    let filtered = notes.filter(n => n.boardId === activeBoardId);
    if (searchQuery) {
      filtered = filtered.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [notes, activeBoardId, searchQuery]);


  // --- Sub-Components (Renderers) ---
// القائمة الرئيسية
  const Sidebar = () => (
    <>
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className={`fixed top-0 right-0 w-3/5 max-w-xs h-full bg-white border-l border-gray-200 z-50 transform transition-all duration-500 overflow-y-auto ${isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">القائمة الرئيسية</h2>
            <button onClick={() => setIsSidebarOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
          </div>

          <div className="space-y-2">
            <button onClick={() => { setModal({ type: 'ADD_BOARD' }); setIsSidebarOpen(false); }} className="w-full flex items-center gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700">
              <PlusIcon className="w-5 h-5 text-blue-600" />
              <span>إضافة لوحة</span>
            </button>

            <button onClick={() => setModal({ type: 'REORDER' })} className="w-full flex items-center gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700">
              <ArrowPathIcon className="w-5 h-5 text-amber-500" />
              <span>ترتيب اللوحات</span>
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <h3 className="text-midium text-blue-500 font-bold px-1 cursor-pointer flex items-center justify-between" onClick={() => setIsBoardsExpanded(!isBoardsExpanded)}>
              إدارة اللوحات
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isBoardsExpanded ? 'rotate-180' : ''}`} />
            </h3>
            {isBoardsExpanded && sortedBoards.map(b => (
              <div key={b.id} className="flex items-center justify-between group p-1 rounded hover:bg-gray-100">
                <span className="truncate text-medium text-gray-700">{b.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal({ type: 'EDIT_BOARD_NAME', data: b })}>
                    <PencilIcon className="w-4 h-4 text-blue-500" />
                  </button>
                  <button onClick={() => setModal({ type: 'DELETE_BOARD', data: b })}>
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            <div className="h-px bg-gray-200 my-1" />

            <button onClick={handleExport} className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span>تصدير نسخة احتياطية</span>
            </button>

            <button onClick={() => importFileRef.current?.click()} className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>استيراد نسخة</span>
            </button>
            <input type="file" hidden ref={importFileRef} onChange={handleImport} accept=".json" />

            <button onClick={() => setModal({ type: 'TRASH' })} className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition text-red-500">
              <TrashIcon className="w-5 h-5" />
              <span>المحذوفات</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // --- Main Render ---
// اسماء اللوحات
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32 relative">
      <Toast message={toastMsg} show={!!toastMsg} />
      <Sidebar />
      {/* Header: Boards */}
      <header className="fixed top-1 right-0 left-0 h-12 bg-white/90 backdrop-blur border-b border-gray-200 z-30 flex items-center px-2 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-full ml-3 shrink-0">
          <Bars3Icon className="w-6 h-6 text-gray-600" />
        </button>
        
        {/* Horizontal Scrollable Boards */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1 mask-gradient-right">
          {sortedBoards.map(board => (
            <button
              key={board.id}
              onClick={() => setActiveBoardId(board.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-300 ${activeBoardId === board.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {board.name}
            </button>
          ))}
        </div>
      </header>
      {/* مربع الادخال  */}
      {/* Main Content */}
      <main className="pt-14 px-2 max-w-3xl mx-auto w-full">
        
        {/* Compact Input Area */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm mb-1 flex items-end gap-2 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 bg-transparent border-none resize-none outline-none text-base placeholder-gray-400 py-2 px-2 min-h-[60px]"
            placeholder="اكتب ملاحظة..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleSaveNote}
            disabled={!inputText.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors mb-0.5"
          >
            <PaperAirplaneIcon className="w-5 h-5 transform -rotate-90 rtl:rotate-90" />
          </button>
        </div>

        {/* Tools: Search & Sort */}
        <div className="flex items-center gap-3 mb-1 sticky top-10 bg-gray-50 py-1 z-20">
           <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="بحث في الملاحظات..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 pr-9 pl-4 text-sm focus:outline-none focus:border-blue-400 text-gray-800"
              />
           </div>
           <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800">
              <FunnelIcon className="w-4 h-4" />
           </button>
        </div>

        {/* Notes List */}
        <div className="space-y-3 pb-20">
          {visibleNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
               <p>لا توجد ملاحظات في هذه اللوحة</p>
            </div>
          ) : (
            visibleNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => toggleNoteExpansion(note.id)}
                className={`group relative bg-white rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${activeNoteId === note.id ? 'border-blue-400 shadow-md ring-1 ring-blue-100 scale-[1.01]' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}
              >
                {/* Content */}
                <div className="p-4">
                   <p className={`text-gray-800 leading-6 whitespace-pre-wrap transition-all duration-300 ${note.isExpanded ? '' : 'line-clamp-3 text-gray-600'}`}>
                      {note.content}
                   </p>
                   <div className="flex justify-between items-center mt-1 border-t border-gray-50 pt-2">
                      <span className="text-[14px] text-gray-400 font-mono">
                        {new Date(note.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                </div>

                {/* Floating Action Button - Appears on expand or hover */}
                <div className={`absolute bottom-3 left-3 flex items-center gap-1 transition-all duration-300 ${note.isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                    {/* Menu Trigger */}
                    <div className="flex bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                       <button 
                         title="نسخ"
                         onClick={(e) => { e.stopPropagation(); copyNote(note.content); }}
                         className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-l border-gray-100"
                       >
                         <DocumentDuplicateIcon className="w-4 h-4" />
                       </button>
                       <button 
                         title="تحرير"
                         onClick={(e) => { e.stopPropagation(); setModal({ type: 'EDIT_NOTE', data: note }); }}
                         className="p-2 hover:bg-gray-100 text-gray-500 hover:text-blue-600 border-l border-gray-100"
                       >
                         <PencilIcon className="w-4 h-4" />
                       </button>
                       <button 
                         title="نقل"
                         onClick={(e) => { e.stopPropagation(); setModal({ type: 'MOVE_TO', data: note }); }}
                         className="p-2 hover:bg-gray-100 text-gray-500 hover:text-amber-500 border-l border-gray-100"
                       >
                         <FolderOpenIcon className="w-4 h-4" />
                       </button>
                       <button 
                         title="ترجمة"
                         onClick={(e) => { e.stopPropagation(); setModal({ type: 'TRANSLATE', data: note }); }}
                         className="p-2 hover:bg-gray-100 text-gray-500 hover:text-purple-600 border-l border-gray-100"
                       >
                         <LanguageIcon className="w-4 h-4" />
                       </button>
                       <button 
                         title="حذف"
                         onClick={(e) => { e.stopPropagation(); deleteNote(note); }}
                         className="p-2 hover:bg-gray-100 text-gray-500 hover:text-red-500"
                       >
                         <TrashIcon className="w-4 h-4" />
                       </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Input Modal (Add/Edit Board) */}
      {(modal.type === 'ADD_BOARD' || modal.type === 'EDIT_BOARD_NAME') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 p-6 shadow-xl">
             <h3 className="font-bold mb-2 text-gray-900">
                {modal.type === 'ADD_BOARD' ? 'إضافة لوحة جديدة' : 'تعديل اسم اللوحة'}
             </h3>
             <input 
                autoFocus
                type="text"
                defaultValue={modal.type === 'EDIT_BOARD_NAME' ? modal.data.name : ''}
                id="board-input"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-800"
                placeholder="اسم اللوحة..."
             />
             <div className="flex gap-3 mt-6">
                <button 
                   onClick={() => {
                      const val = (document.getElementById('board-input') as HTMLInputElement).value;
                      if (!val.trim()) return;
                      
                      if (modal.type === 'ADD_BOARD') {
                         const newBoard = { id: crypto.randomUUID(), name: val, order: boards.length };
                         setBoards([...boards, newBoard]);
                         setActiveBoardId(newBoard.id);
                         showToast('تمت الإضافة');
                      } else {
                         setBoards(prev => prev.map(b => b.id === modal.data.id ? { ...b, name: val } : b));
                         showToast('تم التعديل');
                      }
                      setModal({ type: 'NONE' });
                   }}
                   className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium"
                >
                   حفظ
                </button>
                <button onClick={() => setModal({ type: 'NONE' })} className="px-4 text-gray-500 hover:text-gray-900">إلغاء</button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Board Modal Confirmation */}
      {modal.type === 'DELETE_BOARD' && modal.data && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 p-6 shadow-xl">
                  <h3 className="font-bold mb-2 text-gray-900">حذف اللوحة؟</h3>
                  <p className="text-sm text-gray-500 mb-6">
                      سيتم نقل جميع الملاحظات في "{modal.data.name}" إلى سلة المحذوفات. هل أنت متأكد؟
                  </p>
                  <div className="flex gap-3">
                      <button 
                          onClick={handleBoardDelete}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-medium"
                      >
                          حذف
                      </button>
                      <button onClick={() => setModal({ type: 'NONE' })} className="px-4 text-gray-500 hover:text-gray-900">إلغاء</button>
                  </div>
              </div>
          </div>
      )}

      {/* Reorder Boards Modal */}
      {modal.type === 'REORDER' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-900">ترتيب اللوحات</h3>
            <div className="space-y-2 mb-6 max-h-[60vh] overflow-y-auto">
               {sortedBoards.map((board, index) => (
                 <div key={board.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-700">{board.name}</span>
                    <div className="flex gap-1">
                       <button 
                         disabled={index === 0}
                         onClick={() => {
                            const newBoards = [...sortedBoards];
                            const temp = newBoards[index].order;
                            newBoards[index].order = newBoards[index - 1].order;
                            newBoards[index - 1].order = temp;
                            setBoards(newBoards);
                         }}
                         className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-gray-600"
                       >
                         <ChevronUpIcon className="w-4 h-4" />
                       </button>
                       <button 
                         disabled={index === sortedBoards.length - 1}
                         onClick={() => {
                            const newBoards = [...sortedBoards];
                            const temp = newBoards[index].order;
                            newBoards[index].order = newBoards[index + 1].order;
                            newBoards[index + 1].order = temp;
                            setBoards(newBoards);
                         }}
                         className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-gray-600"
                       >
                         <ChevronDownIcon className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
            <button onClick={() => setModal({ type: 'NONE' })} className="w-full py-3 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-500">حفظ وإغلاق</button>
          </div>
        </div>
      )}

      {/* Trash Modal */}
      {modal.type === 'TRASH' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md h-[70vh] rounded-2xl border border-gray-200 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                 <h3 className="font-bold text-red-500 flex items-center gap-2">
                    <TrashIcon className="w-5 h-5" /> المحذوفات
                 </h3>
                 <button onClick={() => setModal({ type: 'NONE' })}><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                 {trash.length === 0 ? <p className="text-center text-gray-500 py-10">سلة المحذوفات فارغة</p> : trash.map(item => (
                   <div key={item.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.content}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                         <span>من: {item.originalBoardName}</span>
                         <button 
                           onClick={() => {
                              const restoredNote: Note = {
                                 id: item.id,
                                 boardId: activeBoardId, 
                                 content: item.content,
                                 timestamp: item.timestamp,
                                 isExpanded: false
                              };
                              setNotes(prev => [restoredNote, ...prev]);
                              setTrash(prev => prev.filter(t => t.id !== item.id));
                              showToast('تمت الاستعادة');
                           }}
                           className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                         >
                            <ArrowPathIcon className="w-3 h-3" /> استعادة هنا
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Move To Modal */}
      {modal.type === 'MOVE_TO' && modal.data && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-2xl border border-gray-200 p-4 shadow-xl">
               <h3 className="font-bold text-center mb-4 text-gray-900">نقل إلى...</h3>
               <div className="space-y-2">
                  {boards.filter(b => b.id !== modal.data.boardId).map(b => (
                     <button 
                        key={b.id}
                        className="w-full p-3 text-right bg-gray-100 hover:bg-gray-200 rounded transition text-gray-800"
                        onClick={() => {
                           setNotes(prev => prev.map(n => n.id === modal.data.id ? { ...n, boardId: b.id } : n));
                           setModal({ type: 'NONE' });
                           showToast(`نقلت إلى ${b.name}`);
                        }}
                     >
                        {b.name}
                     </button>
                  ))}
               </div>
               <button onClick={() => setModal({ type: 'NONE' })} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-900">إلغاء</button>
            </div>
         </div>
      )}

      {/* Edit Note Modal - Raised and Taller */}
      {modal.type === 'EDIT_NOTE' && modal.data && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-full max-h-[80vh] rounded-2xl border border-gray-200 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
             {/* Header */}
             <div className="p-2 border-b border-gray-200 bg-gray-50 rounded-t-2xl flex justify-between items-center shrink-0">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <PencilIcon className="w-5 h-5 text-blue-600" /> تحرير الملاحظة
                </h3>
                <button onClick={() => setModal({ type: 'NONE' })}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
             </div>

             {/* Content */}
             <div className="flex-1 p-0 bg-gray-50/30 flex flex-col overflow-hidden">
                <textarea 
                  defaultValue={modal.data.content}
                  id="edit-note-textarea"
                  className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-800 text-medium leading-relaxed"
                  placeholder="اكتب هنا..."
                />
             </div>

             {/* Footer */}
             <div className="p-2 border-b rounded-b-2xl border-gray-200 bg-white shrink-0 flex gap-20">
                <button 
                  onClick={() => {
                     const val = (document.getElementById('edit-note-textarea') as HTMLTextAreaElement).value;
                     setNotes(prev => prev.map(n => n.id === modal.data.id ? { ...n, content: val } : n));
                     setModal({ type: 'NONE' });
                     showToast('تم التحديث');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100"
                >
                  حفظ التعديلات
                </button>
                <button onClick={() => setModal({ type: 'NONE' })} className="px-6 py-3 text-gray-500 hover:text-gray-900 font-medium">إلغاء</button>
             </div>
          </div>
        </div>
      )}

      {/* Translate Modal - Extracted Component */}
      <TranslationModal 
         isOpen={modal.type === 'TRANSLATE'}
         onClose={() => setModal({ type: 'NONE' })}
         initialContent={modal.data?.content}
         onCopy={(text) => {
             navigator.clipboard.writeText(text);
             showToast('تم النسخ');
         }}
      />

    </div>
  );
};

export default App;
