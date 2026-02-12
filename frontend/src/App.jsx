import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Book, Languages, MessageCircle, FileText, Globe, Plus, Trash2, 
  ChevronRight, BookOpen, BrainCircuit, X, Save, LogIn, UserPlus, 
  Palette, User as UserIcon, LogOut, Copy, CheckCircle, PlusCircle,
  Folder, FolderOpen, Link as LinkIcon, Share2, Search, Eye, Edit3,
  Heading1, Heading2, Bold, Italic, List as ListIcon, Quote, Hash,
  Maximize2, MousePointer2, Pencil
} from 'lucide-react';

import { API_URL, PALETTES, ISO_LANGS, AVATARS } from './constants';
import { useAuth } from './context/AuthContext';

const { user, token, logout, isAuthenticated } = useAuth();


export default function App() {
  
  
  // Lógica de sesión robusta
  
  const [view, setView] = useState(isAuthenticated ? 'vocabulary' : 'login');
  
  const [data, setData] = useState([]);
  const [publicData, setPublicData] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedLang, setSelectedLang] = useState('ko');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [activeNote, setActiveNote] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('Todos');
  const [isPreview, setIsPreview] = useState(false);
  const [showRelationSelector, setShowRelationSelector] = useState(false);
  const [relationTab, setRelationTab] = useState('vocabulary'); 
  const [tempFolders, setTempFolders] = useState([]); 
  const textareaRef = useRef(null);

  const [allResources, setAllResources] = useState({ vocabulary: [], grammar: [], expressions: [] });
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '', display_name: '', avatar: 'User', theme: PALETTES[0] });

  const [newVocab, setNewVocab] = useState({ surface_form: '', reading: '', is_public: true, senses: [{ native_translation: '', english_translation: '' }] });
  const [newGrammar, setNewGrammar] = useState({ name: '', structure: '', explanation: '', examples: [''], native_translation: '', english_translation: '', is_public: true });
  const [newExpression, setNewExpression] = useState({ text: '', native_translation: '', english_translation: '', usage_description: '', is_public: true });

  // Redirección si hay desincronización
  useEffect(() => {
    if (isAuthenticated && view === 'login') {
      setView('vocabulary');
    }
    if (!isAuthenticated && view !== 'login' && view !== 'register') {
      setView('login');
    }
  }, [isAuthenticated, view]);

  useEffect(() => {
    if (isAuthenticated) {
      applyTheme(user.theme_colors);
      fetchData();
      if (view === 'notes' || view === 'graph') fetchAllResources();
    }
  }, [user, view, selectedLang, isAuthenticated]);

  const applyTheme = (colors) => {
    if (!colors || colors.length < 4) return;
    const r = document.documentElement;
    r.style.setProperty('--accent', colors[0]); r.style.setProperty('--bg-soft', colors[1]);
    r.style.setProperty('--secondary', colors[2]); r.style.setProperty('--primary', colors[3]);
  };


  const fetchAllResources = async () => {
    if (!token) return;
    const h = { 'Authorization': `Bearer ${token}` };
    try {
      const [v, g, e] = await Promise.all([
        fetch(`${API_URL}/vocabulary/me/`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/grammar/`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/expressions/`, { headers: h }).then(r => r.ok ? r.json() : [])
      ]);
      setAllResources({ vocabulary: v, grammar: g, expressions: e });
    } catch (err) { console.error(err); }
  };

  const fetchData = async () => {
    if (!token || ['graph', 'login', 'register'].includes(view)) return;
    setLoading(true); const h = { 'Authorization': `Bearer ${token}` };
    try {
      let res;
      if (view === 'public') res = await fetch(`${API_URL}/vocabulary/public?language_code=${selectedLang}`);
      else if (view === 'notes') res = await fetch(`${API_URL}/notes/`, { headers: h });
      else if (view === 'global') res = await fetch(`${API_URL}/vocabulary/me/`, { headers: h });
      else {
        const endpoint = view === 'vocabulary' ? 'vocabulary/me' : view;
        res = await fetch(`${API_URL}/${endpoint}/?language_code=${selectedLang}`, { headers: h });
      }
      if (res.ok) {
        const json = await res.json();
        if (view === 'public') setPublicData(json); else if (view === 'notes') setNotes(json); else setData(json);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const folders = useMemo(() => {
    const s = new Set(['General']); notes.forEach(n => { if (n.topic) s.add(n.topic); });
    tempFolders.forEach(f => s.add(f)); return ['Todos', ...Array.from(s)];
  }, [notes, tempFolders]);

  const addFolder = () => {
    const n = window.prompt("Nombre de la carpeta:");
    if (n && !folders.includes(n)) {
      setTempFolders(prev => [...prev, n]); setActiveNote({title:'', content:'', topic: n, vocab_rel: [], grammar_rel: [], expression_rel: [], isNew: true});
      setSelectedFolder(n); setIsPreview(false); setView('notes');
    }
  };

  

  const openCreateModal = () => {
    setEditingItem(null);
    setNewVocab({ surface_form: '', reading: '', is_public: true, senses: [{ native_translation: '', english_translation: '' }] });
    setNewGrammar({ name: '', structure: '', explanation: '', examples: [''], native_translation: '', english_translation: '', is_public: true });
    setNewExpression({ text: '', native_translation: '', english_translation: '', usage_description: '', is_public: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    if (view === 'vocabulary') {
      setNewVocab({
        surface_form: item.surface_form,
        reading: item.reading,
        is_public: !!item.is_public,
        senses: item.senses.length > 0 ? item.senses : [{ native_translation: '', english_translation: '' }]
      });
    } else if (view === 'grammar') {
      setNewGrammar({
        name: item.name,
        structure: item.structure,
        explanation: item.explanation,
        examples: item.examples || [''],
        native_translation: item.native_translation || '',
        english_translation: item.english_translation || '',
        is_public: !!item.is_public
      });
    } else if (view === 'expressions') {
      setNewExpression({
        text: item.text,
        native_translation: item.native_translation,
        english_translation: item.english_translation,
        usage_description: item.usage_description,
        is_public: !!item.is_public
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás segura?")) return;
    const h = { 'Authorization': `Bearer ${token}` };
    const endpoint = view === 'vocabulary' ? 'vocabulary' : view;
    try {
      const res = await fetch(`${API_URL}/${endpoint}/${id}/`, { method: 'DELETE', headers: h });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    const h = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const endpoint = view === 'vocabulary' ? 'vocabulary' : view;
    let payload = {};
    if (view === 'vocabulary') payload = { ...newVocab, language_code: selectedLang };
    if (view === 'grammar') payload = { ...newGrammar, language_code: selectedLang };
    if (view === 'expressions') payload = { ...newExpression, language_code: selectedLang };

    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/${endpoint}/${editingItem.id}/` : `${API_URL}/${endpoint}/`;

    const res = await fetch(url, { method, headers: h, body: JSON.stringify(payload) });
    if (res.ok) {
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    }
  };

  const handleNodeClick = (n) => {
    const [t, id] = n.id.split('-');
    if (t === 'note') {
      const f = notes.find(x => x.id === parseInt(id));
      if (f) { setActiveNote(f); setView('notes'); setIsPreview(false); }
    } else { setView(t === 'vocab' ? 'vocabulary' : t === 'grammar' ? 'grammar' : 'expressions'); }
  };

  const saveNote = async () => {
    if (!activeNote || !activeNote.title) return;
    const h = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const payload = { 
        title: activeNote.title, 
        content: activeNote.content, 
        topic: activeNote.topic || 'General', 
        vocab_ids: activeNote.vocab_rel?.map(v => v.id) || [], 
        grammar_ids: activeNote.grammar_rel?.map(g => g.id) || [],
        expression_ids: activeNote.expression_rel?.map(e => e.id) || []
    };
    const res = await fetch(`${API_URL}/notes/`, { method: 'POST', headers: h, body: JSON.stringify(payload) });
    if (res.ok) {
      const s = await res.json();
      if (s.topic && s.topic !== 'General') setTempFolders(prev => prev.filter(f => f !== s.topic));
      setNotes([...notes.filter(n => n.id !== s.id), s]); setActiveNote(s);
    }
  };

  const insertMarkdown = (prefix, suffix = "") => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeNote.content || "";
    const newContent = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end);
    setActiveNote({ ...activeNote, content: newContent });
    setTimeout(() => { textarea.focus(); const pos = start + prefix.length + (end - start) + suffix.length; textarea.setSelectionRange(pos, pos); }, 10);
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-slate-800 mb-4 mt-6">{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-slate-800 mb-3 mt-5">{line.substring(3)}</h2>;
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-indigo-200 pl-4 italic text-slate-50 mb-4">{line.substring(2)}</blockquote>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-slate-600 mb-1">{line.substring(2)}</li>;
      let proc = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>');
      return <p key={i} className="text-slate-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: proc }}></p>;
    });
  };

  // --- LÓGICA DE RENDERIZADO PROTEGIDO ---

  if (view === 'register') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 overflow-y-auto py-10">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] w-full max-w-2xl shadow-2xl">
          <h2 className="text-4xl font-black mb-8 text-slate-800 tracking-tight">Crea tu Espacio</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch(`${API_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...authForm, theme_colors: authForm.theme }) });
            if (res.ok) setView('login');
          }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input placeholder="Usuario" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" onChange={e=>setAuthForm({...authForm, username: e.target.value})} required />
              <input type="email" placeholder="Email" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" onChange={e=>setAuthForm({...authForm, email: e.target.value})} required />
              <input placeholder="Nombre Público" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" onChange={e=>setAuthForm({...authForm, display_name: e.target.value})} required />
              <input type="password" placeholder="Contraseña" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" onChange={e=>setAuthForm({...authForm, password: e.target.value})} required />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase">Avatar</label>
              <div className="flex gap-4 flex-wrap">{AVATARS.map(a => (<button key={a} type="button" onClick={()=>setAuthForm({...authForm, avatar: a})} className={`p-5 rounded-2xl border-2 transition-all ${authForm.avatar === a ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}><AvatarIcon name={a} size={24} className="text-indigo-600" /></button>))}</div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase">Colores</label>
              <div className="grid grid-cols-5 gap-3">{PALETTES.map((p, i) => (<button key={i} type="button" onClick={()=>setAuthForm({...authForm, theme: p})} className={`h-12 rounded-xl flex overflow-hidden border-4 transition-all ${authForm.theme === p ? 'border-slate-900' : 'border-transparent'}`}>{p.map(c => <div key={c} className="flex-1" style={{backgroundColor: c}}/>)}</button>))}</div>
            </div>
            <button className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black">Comenzar</button>
            <button type="button" onClick={()=>setView('login')} className="w-full text-slate-400 text-sm">Ya tengo cuenta</button>
          </form>
        </div>
      </div>
    );
  }

  // Si no está logueado O si la vista es login, forzamos pantalla de login
  if (!isAuthenticated || view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl text-center">
          <BrainCircuit size={64} className="mx-auto mb-6 text-indigo-600" />
          <h2 className="text-3xl font-black mb-8 text-slate-800">LingoGraph</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input placeholder="Usuario" className="w-full p-4 bg-slate-50 border-none rounded-2xl" onChange={e=>setAuthForm({...authForm, username: e.target.value})} required />
            <input type="password" placeholder="Contraseña" className="w-full p-4 bg-slate-50 border-none rounded-2xl" onChange={e=>setAuthForm({...authForm, password: e.target.value})} required />
            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black shadow-xl">Entrar</button>
            <button type="button" onClick={()=>setView('register')} className="text-indigo-600 text-sm font-bold mt-4 block">Crear cuenta nueva</button>
          </form>
        </div>
      </div>
    );
  }

  // A partir de aquí solo se renderiza si isAuthenticated === true
  const renderNoteEditor = () => (
    <div className="flex h-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in">
      <div className="w-72 border-r border-slate-50 flex flex-col bg-slate-50/30">
        <div className="p-6 flex justify-between items-center"><h3 className="text-xs font-black text-slate-300 uppercase">Explorador</h3><button onClick={addFolder} className="text-theme-primary"><PlusCircle size={18}/></button></div>
        <div className="flex-1 overflow-y-auto px-4">{folders.map(f => (<button key={f} onClick={()=>setSelectedFolder(f)} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedFolder === f ? 'bg-white text-theme-primary shadow-sm' : 'text-slate-400'}`}>{selectedFolder === f ? <FolderOpen size={16}/> : <Folder size={16}/>}{f}</button>))}</div>
        <div className="p-4 border-t border-slate-50">{notes.filter(n => selectedFolder === 'Todos' || n.topic === selectedFolder).map(n => (<button key={n.id} onClick={()=>{setActiveNote(n); setIsPreview(false);}} className={`w-full text-left p-4 rounded-2xl mb-2 border ${activeNote?.id === n.id ? 'bg-theme-primary text-white border-transparent' : 'bg-white border-slate-100'}`}><p className="font-bold text-sm truncate">{n.title || "Sin título"}</p></button>))}</div>
        <button onClick={()=>{setActiveNote({title:'', content:'', topic: selectedFolder === 'Todos' ? 'General' : selectedFolder, vocab_rel: [], grammar_rel: [], expression_rel: [], isNew: true}); setIsPreview(false);}} className="m-6 p-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Plus size={14}/> Nueva Nota</button>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <div className="p-10 pb-4 flex justify-between items-center"><input className="text-4xl font-black text-slate-800 border-none focus:ring-0 w-full" value={activeNote.title} onChange={e=>setActiveNote({...activeNote, title: e.target.value})} /><button onClick={() => setIsPreview(!isPreview)} className={`p-3 rounded-xl border ${isPreview ? 'bg-indigo-50 text-theme-primary' : 'bg-white'}`}>{isPreview ? <Edit3 size={20}/> : <Eye size={20}/>}</button></div>
            <div className="px-10 mb-4 flex gap-4"><div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">📁 {activeNote.topic || 'General'}</div></div>
            {!isPreview && (<div className="px-10 py-2 border-y border-slate-50 flex gap-2 bg-slate-50/50"><ToolbarButton onClick={() => insertMarkdown("# ")} icon={<Heading1 size={16}/>}/><ToolbarButton onClick={() => insertMarkdown("## ")} icon={<Heading2 size={16}/>}/><ToolbarButton onClick={() => insertMarkdown("**", "**")} icon={<Bold size={16}/>}/><ToolbarButton onClick={() => insertMarkdown("__", "__")} icon={<Italic size={16}/>}/><ToolbarButton onClick={() => insertMarkdown("- ")} icon={<ListIcon size={16}/>}/><ToolbarButton onClick={() => insertMarkdown("> ")} icon={<Quote size={16}/>}/></div>)}
            <div className="flex-1 p-10">{isPreview ? <div className="bg-white p-6 rounded-3xl border border-slate-50 min-h-[400px]">{renderMarkdown(activeNote.content)}</div> : <textarea ref={textareaRef} className="w-full h-full text-slate-600 border-none focus:ring-0 p-4 bg-slate-50/20 rounded-3xl text-lg resize-none" value={activeNote.content} onChange={e=>setActiveNote({...activeNote, content: e.target.value})} />}</div>
            
            <div className="p-10 border-t border-slate-100 relative bg-slate-50/20">
                <h4 className="text-xs font-black text-slate-300 uppercase mb-4 flex items-center gap-2"><BrainCircuit size={14}/> Grafo Vinculado</h4>
                <div className="flex flex-wrap gap-2">
                    {activeNote.vocab_rel?.map(v => (<div key={v.id} className="bg-white border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-2 group"><Book size={12} className="text-indigo-400"/><span className="font-bold text-slate-700 text-sm">{v.surface_form}</span><button onClick={() => setActiveNote({...activeNote, vocab_rel: activeNote.vocab_rel.filter(x => x.id !== v.id)})} className="hidden group-hover:block text-red-300"><X size={12}/></button></div>))}
                    {activeNote.grammar_rel?.map(g => (<div key={g.id} className="bg-white border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-2 group"><Hash size={12} className="text-pink-400"/><span className="font-bold text-slate-700 text-sm">{g.name}</span><button onClick={() => setActiveNote({...activeNote, grammar_rel: activeNote.grammar_rel.filter(x => x.id !== g.id)})} className="hidden group-hover:block text-red-300"><X size={12}/></button></div>))}
                    {activeNote.expression_rel?.map(ex => (<div key={ex.id} className="bg-white border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-2 group"><MessageCircle size={12} className="text-amber-400"/><span className="font-bold text-slate-700 text-sm">{ex.text}</span><button onClick={() => setActiveNote({...activeNote, expression_rel: activeNote.expression_rel.filter(x => x.id !== ex.id)})} className="hidden group-hover:block text-red-300"><X size={12}/></button></div>))}
                    <button onClick={() => { fetchAllResources(); setShowRelationSelector(!showRelationSelector); }} className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 hover:text-theme-primary transition-all"><Plus size={18}/></button>
                </div>
                {showRelationSelector && (
                    <div className="absolute bottom-full left-10 mb-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50">
                        <div className="flex justify-between mb-4"><p className="text-[10px] font-black text-slate-400 uppercase">Vincular Elemento</p><button onClick={() => setShowRelationSelector(false)}><X size={12}/></button></div>
                        <div className="flex bg-slate-50 p-1 rounded-xl mb-4 text-[10px] font-bold">
                            <button onClick={()=>setRelationTab('vocabulary')} className={`flex-1 py-1.5 rounded-lg ${relationTab === 'vocabulary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>VOCAB</button>
                            <button onClick={()=>setRelationTab('grammar')} className={`flex-1 py-1.5 rounded-lg ${relationTab === 'grammar' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400'}`}>GRAMAR</button>
                            <button onClick={()=>setRelationTab('expressions')} className={`flex-1 py-1.5 rounded-lg ${relationTab === 'expressions' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>EXPR</button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {allResources[relationTab]?.map(res => (
                                <button key={res.id} onClick={() => {
                                    const key = relationTab === 'vocabulary' ? 'vocab_rel' : relationTab === 'grammar' ? 'grammar_rel' : 'expression_rel';
                                    if (!activeNote[key]?.find(i => i.id === res.id)) setActiveNote({...activeNote, [key]: [...(activeNote[key] || []), res]});
                                    setShowRelationSelector(false);
                                }} className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl text-sm flex justify-between items-center transition-colors">
                                    <span className="font-bold text-slate-700">{res.surface_form || res.name || res.text}</span>
                                    <span className="text-[10px] text-slate-300 uppercase">{res.language_code}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-10 pt-0 flex justify-end"><button onClick={saveNote} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><Save size={20}/> Guardar</button></div>
          </div>
        ) : <div className="flex-1 flex flex-col items-center justify-center opacity-50"><FileText size={80}/><p className="font-black uppercase mt-4">Selecciona una nota</p></div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] flex flex-col md:flex-row font-sans text-slate-900 transition-all duration-500">
      <style>{`
        :root { --primary: #4f46e5; --secondary: #a5b4fc; --accent: #f472b6; --bg-soft: #f8fafc; }
        .bg-theme-primary { background-color: var(--primary); }
        .text-theme-primary { color: var(--primary); }
      `}</style>
      <nav className="w-full md:w-64 bg-white border-r p-6 flex flex-col gap-6 shadow-xl z-20">
        <div className="flex items-center gap-3 p-2 text-theme-primary" onClick={() => setView('vocabulary')}><BrainCircuit size={24}/><h1 className="text-xl font-black tracking-tighter cursor-pointer">LingoGraph</h1></div>
        <div className="space-y-1">
          <NavItem icon={<Book size={20}/>} label="Vocabulario" active={view === 'vocabulary'} onClick={()=>setView('vocabulary')}/>
          <NavItem icon={<Languages size={20}/>} label="Gramática" active={view === 'grammar'} onClick={()=>setView('grammar')}/>
          <NavItem icon={<MessageCircle size={20}/>} label="Expresiones" active={view === 'expressions'} onClick={()=>setView('expressions')}/>
          <NavItem icon={<Globe size={20}/>} label="Global" active={view === 'global'} onClick={()=>setView('global')}/>
          <NavItem icon={<FileText size={20}/>} label="Notas" active={view === 'notes'} onClick={()=>setView('notes')}/>
          <NavItem icon={<Share2 size={20}/>} label="Relaciones" active={view === 'graph'} onClick={()=>setView('graph')}/>
          <div className="my-4 border-t border-slate-50"></div>
          <NavItem icon={<Globe size={20}/>} label="Comunidad" active={view === 'public'} onClick={()=>setView('public')}/>
        </div>
        <div className="mt-auto p-4 bg-slate-50 rounded-3xl border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-theme-primary flex items-center justify-center text-white shadow-md">
                <AvatarIcon name={user?.avatar} size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800">{user?.display_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">@{user?.username}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-400 hover:text-red-500 rounded-xl transition-all">
             <LogOut size={14}/> Salir
           </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 overflow-hidden flex flex-col">
          {view === 'notes' ? renderNoteEditor() : view === 'graph' ? (
              <div className="flex-1 flex flex-col h-full animate-in fade-in duration-700">
                  <header className="mb-10"><h2 className="text-5xl font-black text-slate-800 tracking-tighter capitalize">Relaciones</h2></header>
                  <KnowledgeGraph notes={notes} resources={allResources} onNodeClick={handleNodeClick} />
              </div>
          ) : (
            <>
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                <div><h2 className="text-5xl font-black text-slate-800 tracking-tighter capitalize">{view}</h2>{!['global', 'graph', 'public'].includes(view) && (<div className="flex items-center gap-2 mt-2"><span className="text-xs font-bold text-slate-300 uppercase">Idioma:</span><select className="bg-transparent border-none text-theme-primary font-black p-0 text-lg focus:ring-0" value={selectedLang} onChange={e=>setSelectedLang(e.target.value)}>{ISO_LANGS.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>)}</div>
                {['vocabulary', 'grammar', 'expressions'].includes(view) && (<button onClick={openCreateModal} className="bg-theme-primary text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><PlusCircle size={22}/> Añadir</button>)}
              </header>
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                  {view === 'global' ? Array.from(new Set(data.flatMap(e => e.senses.map(s => s.native_translation.toLowerCase().trim())))).map((native, idx) => {
                    const conn = data.filter(e => e.senses.some(s => s.native_translation.toLowerCase().trim() === native));
                    return (<div key={idx} className="bg-white p-8 rounded-[3rem] shadow-sm relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-theme-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-all"/><h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 capitalize"><div className="w-2 h-8 bg-theme-primary rounded-full"/>{native}</h3><div className="space-y-4">{conn.map((c, i) => (<div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl"><div><p className="font-black text-slate-700">{c.surface_form}</p><p className="text-[10px] text-slate-400 uppercase">{c.language_code} · {c.reading}</p></div><ChevronRight size={14} className="text-slate-200" /></div>))}</div></div>);
                  }) : (view === 'public' ? publicData : data).map(item => (
                    <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm group hover:shadow-2xl transition-all relative flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all"/>
                      <div className="flex justify-between items-start mb-6 z-10">
                        <span className="text-[10px] font-black uppercase text-slate-300">{item.language_code}</span>
                        <div className="flex items-center gap-2">
                           {view === 'public' ? (
                             data.some(d => (d.surface_form === item.surface_form || d.text === item.text)) ? <CheckCircle size={16} className="text-green-500"/> : <button onClick={()=>syncEntry(item.id)} className="text-theme-primary"><Copy size={18}/></button>
                           ) : (
                             <>
                               <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-300 hover:text-theme-primary hover:bg-theme-primary/5 rounded-lg transition-all"><Pencil size={14}/></button>
                               <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14}/></button>
                             </>
                           )}
                        </div>
                      </div>
                      <div className="z-10 flex-1">
                        <h3 className="text-3xl font-black mb-1 text-slate-800 tracking-tight">{item.surface_form || item.text || item.name}</h3>
                        {(item.reading || item.structure) && <p className="text-sm font-mono text-slate-400 mb-6">{item.reading || item.structure}</p>}
                        <div className="space-y-3 mt-4">
                          {item.senses?.map((s, idx) => (<div key={idx} className="flex flex-col p-3 bg-slate-50 rounded-2xl"><span className="text-sm font-black text-slate-700">{s.native_translation}</span>{s.english_translation && <span className="text-xs text-slate-400 italic font-medium">{s.english_translation}</span>}</div>))}
                          {(item.native_translation || (item.senses && item.senses[0]?.native_translation)) && (
                            <div className="p-3 bg-indigo-50 rounded-2xl">
                                <span className="text-sm font-black text-theme-primary">{item.native_translation || item.senses?.[0]?.native_translation}</span>
                                {item.english_translation && <p className="text-xs text-slate-400 italic mt-1">{item.english_translation}</p>}
                            </div>
                          )}
                          {item.usage_description && <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">{item.usage_description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
      </main>

      {/* MODAL DINÁMICO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10">
            <div className="p-8 border-b flex justify-between bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800 capitalize">{editingItem ? 'Editar' : 'Añadir'} {view}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleResourceSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
               {view === 'vocabulary' && (
                 <>
                   <div className="grid grid-cols-2 gap-4"><input placeholder="Palabra" className="p-4 bg-slate-50 rounded-2xl font-bold" value={newVocab.surface_form} onChange={e=>setNewVocab({...newVocab, surface_form:e.target.value})} required /><input placeholder="Lectura" className="p-4 bg-slate-50 rounded-2xl" value={newVocab.reading} onChange={e=>setNewVocab({...newVocab, reading:e.target.value})} /></div>
                   {newVocab.senses.map((s, i) => (
                     <div key={i} className="p-5 border-2 border-indigo-50 rounded-[2rem] space-y-3">
                       <input placeholder="Traducción Español" className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={s.native_translation} onChange={e=>{let ns=[...newVocab.senses]; ns[i].native_translation=e.target.value; setNewVocab({...newVocab, senses:ns})}} required />
                       <input placeholder="English (Opcional)" className="w-full p-3 bg-slate-50 rounded-xl text-sm italic" value={s.english_translation} onChange={e=>{let ns=[...newVocab.senses]; ns[i].english_translation=e.target.value; setNewVocab({...newVocab, senses:ns})}} />
                     </div>
                   ))}
                   {!editingItem && <button type="button" onClick={()=>setNewVocab({...newVocab, senses: [...newVocab.senses, {native_translation:'', english_translation:''}]})} className="text-xs font-black text-theme-primary">+ Añadir Significado</button>}
                 </>
               )}
               {view === 'grammar' && (
                 <>
                   <div className="grid grid-cols-2 gap-4"><input placeholder="Nombre regla" className="p-4 bg-slate-50 rounded-2xl font-bold" value={newGrammar.name} onChange={e=>setNewGrammar({...newGrammar, name:e.target.value})} required /><input placeholder="Estructura" className="p-4 bg-slate-50 rounded-2xl font-mono" value={newGrammar.structure} onChange={e=>setNewGrammar({...newGrammar, structure:e.target.value})} required /></div>
                   <input placeholder="Traducción Español" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={newGrammar.native_translation} onChange={e=>setNewGrammar({...newGrammar, native_translation:e.target.value})} required />
                   <input placeholder="English (Opcional)" className="w-full p-4 bg-slate-50 rounded-2xl italic" value={newGrammar.english_translation} onChange={e=>setNewGrammar({...newGrammar, english_translation:e.target.value})} />
                   <textarea placeholder="Explicación..." className="w-full p-4 bg-slate-50 rounded-2xl h-24" value={newGrammar.explanation} onChange={e=>setNewGrammar({...newGrammar, explanation:e.target.value})} />
                 </>
               )}
               {view === 'expressions' && (
                 <>
                   <input placeholder="Expresión" className="p-4 bg-slate-50 rounded-2xl font-bold w-full" value={newExpression.text} onChange={e=>setNewExpression({...newExpression, text:e.target.value})} required />
                   <div className="grid grid-cols-2 gap-4"><input placeholder="Traducción Español" className="p-4 bg-slate-50 rounded-2xl font-bold" value={newExpression.native_translation} onChange={e=>setNewExpression({...newExpression, native_translation:e.target.value})} required /><input placeholder="English (Opcional)" className="p-4 bg-slate-50 rounded-2xl italic" value={newExpression.english_translation} onChange={e=>setNewExpression({...newExpression, english_translation:e.target.value})} /></div>
                   <textarea placeholder="Contexto de uso..." className="w-full p-4 bg-slate-50 rounded-2xl h-24" value={newExpression.usage_description} onChange={e=>setNewExpression({...newExpression, usage_description:e.target.value})} />
                 </>
               )}
               <button className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black">{editingItem ? 'Guardar Cambios' : 'Añadir al Grafo'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ count, label, icon }) {
  return (
    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center hover:shadow-lg transition-all group">
      <div className="text-theme-primary mb-2 flex justify-center group-hover:scale-110 transition-all">{icon}</div>
      <p className="text-3xl font-black text-slate-800">{count}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{label}</p>
    </div>
  );
}

function ToolbarButton({ onClick, icon }) {
  return (
    <button onClick={(e) => { e.preventDefault(); onClick(); }} className="p-2 hover:bg-white hover:text-theme-primary rounded-lg text-slate-400 transition-all">{icon}</button>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-theme-primary text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>{icon}{label}</button>
  );
}