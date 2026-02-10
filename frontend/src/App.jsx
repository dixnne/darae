import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Languages, 
  MessageCircle, 
  FileText, 
  Globe, 
  Plus, 
  Trash2, 
  ChevronRight,
  BookOpen,
  BrainCircuit,
  Settings
} from 'lucide-react';

// URL del Backend
const API_URL = "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState('vocabulary');
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLangForm, setShowLangForm] = useState(false);

  // Estados para formularios
  const [newLang, setNewLang] = useState({ name: '', code: '' });

  const [newVocab, setNewVocab] = useState({
    surface_form: '',
    reading: '',
    language_id: '',
    senses: [{ native_translation: '', english_translation: '', definition: '' }]
  });

  const [newGrammar, setNewGrammar] = useState({
    name: '',
    structure: '',
    explanation: '',
    examples: [''],
    language_id: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedLang || activeTab === 'global') {
      fetchTabData();
    }
  }, [activeTab, selectedLang]);

  const fetchInitialData = async () => {
    try {
      const res = await fetch(`${API_URL}/languages/`);
      const langs = await res.json();
      setLanguages(langs);
      if (langs.length > 0 && !selectedLang) setSelectedLang(langs[0].id);
    } catch (err) {
      console.error("Error inicial:", err);
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    let url = `${API_URL}/${activeTab}/`;
    if (activeTab === 'global') url = `${API_URL}/dictionary/global/`;
    else if (selectedLang) url += `?language_id=${selectedLang}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching tab data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/languages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLang)
      });
      if (response.ok) {
        setNewLang({ name: '', code: '' });
        setShowLangForm(false);
        fetchInitialData();
      }
    } catch (err) {
      console.error("Error creando idioma:", err);
    }
  };

  // Handlers para Vocabulario (Múltiples significados)
  const addSenseField = () => {
    setNewVocab({
      ...newVocab,
      senses: [...newVocab.senses, { native_translation: '', english_translation: '', definition: '' }]
    });
  };

  const handleVocabSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...newVocab, language_id: selectedLang };
    try {
      await fetch(`${API_URL}/vocabulary/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNewVocab({ surface_form: '', reading: '', senses: [{ native_translation: '', english_translation: '', definition: '' }] });
      fetchTabData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Sidebar de Navegación */}
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900">Darae</h1>
        </div>

        <div className="flex flex-col gap-2">
          <NavItem icon={<Book />} label="Vocabulario" active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
          <NavItem icon={<MessageCircle />} label="Expresiones" active={activeTab === 'expressions'} onClick={() => setActiveTab('expressions')} />
          <NavItem icon={<Languages />} label="Gramática" active={activeTab === 'grammar'} onClick={() => setActiveTab('grammar')} />
          <NavItem icon={<FileText />} label="Notas" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          <div className="my-2 border-t border-slate-100"></div>
          <NavItem icon={<Globe />} label="Diccionario Global" active={activeTab === 'global'} onClick={() => setActiveTab('global')} />
        </div>

        <div className="mt-auto space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Idioma Actual</label>
              <button 
                onClick={() => setShowLangForm(!showLangForm)}
                className="text-indigo-600 hover:text-indigo-800"
                title="Gestionar idiomas"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {showLangForm ? (
              <form onSubmit={handleLanguageSubmit} className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-200 mb-2">
                <input 
                  placeholder="Nombre (Coreano)" 
                  className="w-full p-2 text-xs rounded border-none focus:ring-1 focus:ring-indigo-500"
                  value={newLang.name}
                  onChange={(e) => setNewLang({...newLang, name: e.target.value})}
                  required
                />
                <input 
                  placeholder="Código (ko)" 
                  className="w-full p-2 text-xs rounded border-none focus:ring-1 focus:ring-indigo-500"
                  value={newLang.code}
                  onChange={(e) => setNewLang({...newLang, code: e.target.value})}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white text-[10px] py-1 rounded font-bold">Añadir</button>
                  <button type="button" onClick={() => setShowLangForm(false)} className="flex-1 bg-slate-200 text-slate-600 text-[10px] py-1 rounded font-bold">Cancelar</button>
                </div>
              </form>
            ) : (
              <select 
                value={selectedLang || ''} 
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full p-2 bg-slate-100 rounded-lg border-none text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {languages.length === 0 && <option value="">No hay idiomas</option>}
                {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 capitalize">{activeTab.replace('_', ' ')}</h2>
            <p className="text-slate-500">Gestiona y conecta tu conocimiento en {languages.find(l => l.id == selectedLang)?.name || 'idiomas'}.</p>
          </div>
          {activeTab !== 'global' && (
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Plus size={20} /> Añadir Nuevo
            </button>
          )}
        </header>

        {activeTab === 'vocabulary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario Vocabulario */}
            <div className="lg:col-span-1">
              <form onSubmit={handleVocabSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-10">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Nueva Palabra</h3>
                <div className="space-y-4">
                  <input 
                    placeholder="Palabra (ej: 학생)" 
                    className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
                    value={newVocab.surface_form}
                    onChange={(e) => setNewVocab({...newVocab, surface_form: e.target.value})}
                  />
                  <input 
                    placeholder="Lectura (ej: hak-saeng)" 
                    className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
                    value={newVocab.reading}
                    onChange={(e) => setNewVocab({...newVocab, reading: e.target.value})}
                  />
                  
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Significados</p>
                    {newVocab.senses.map((sense, idx) => (
                      <div key={idx} className="mb-4 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100">
                        <input 
                          placeholder="Traducción Nativa" 
                          className="w-full p-2 bg-transparent border-b border-indigo-100 focus:border-indigo-500 outline-none mb-2"
                          value={sense.native_translation}
                          onChange={(e) => {
                            const ns = [...newVocab.senses];
                            ns[idx].native_translation = e.target.value;
                            setNewVocab({...newVocab, senses: ns});
                          }}
                        />
                        <input 
                          placeholder="Traducción Inglés (Opcional)" 
                          className="w-full p-2 bg-transparent border-b border-indigo-100 focus:border-indigo-500 outline-none text-sm"
                          value={sense.english_translation}
                          onChange={(e) => {
                            const ns = [...newVocab.senses];
                            ns[idx].english_translation = e.target.value;
                            setNewVocab({...newVocab, senses: ns});
                          }}
                        />
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={addSenseField}
                      className="text-xs text-indigo-600 font-bold hover:underline"
                    >
                      + Añadir otro significado
                    </button>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={!selectedLang}
                    className={`w-full p-3 rounded-xl font-bold transition-colors ${!selectedLang ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    {!selectedLang ? 'Selecciona un idioma primero' : 'Guardar Palabra'}
                  </button>
                </div>
              </form>
            </div>

            {/* Lista Vocabulario */}
            <div className="lg:col-span-2 space-y-4">
              {data.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between group hover:border-indigo-300 transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-2xl font-bold text-slate-800">{item.surface_form}</h4>
                      <span className="text-slate-400 font-mono text-sm">{item.reading}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.senses.map(s => (
                        <div key={s.id} className="bg-indigo-50 px-3 py-1 rounded-full text-sm text-indigo-700 font-medium">
                          {s.native_translation} {s.english_translation && <span className="text-indigo-300 ml-1">| {s.english_translation}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
              {data.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                  <BookOpen className="text-slate-200 w-16 h-16 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No hay palabras registradas para este idioma.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((group, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all">
                <div className="bg-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-200">
                  <Globe size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">{group.native_translation}</h3>
                <div className="space-y-3">
                  {group.related_entries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{entry.surface_form}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-tighter">{entry.language.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {data.length === 0 && !loading && (
               <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <Globe className="text-slate-200 w-16 h-16 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">El diccionario global se construye al añadir palabras en diferentes idiomas.</p>
              </div>
            )}
          </div>
        )}

        {/* Placeholder para otras pestañas */}
        {['expressions', 'grammar', 'notes'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <BookOpen className="text-slate-200 w-16 h-16 mb-4" />
            <p className="text-slate-400 font-medium">Próximamente: Panel de {activeTab}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
        active 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50/50' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {React.cloneElement(icon, { size: 20 })}
      {label}
    </button>
  );
}