import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Subject { id: number; name: string; colorCode: string; }
interface Week { id: number; weekNumber: number; label: string; status: string; }
interface AiContent {
  id: number; weekId: number; lessonCardEn: string; lessonCardAr: string;
  keyFacts: string; summary: string; enrichment: string;
}
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

const QUICK_PROMPTS = [
  { label: '🧒 Simpler please', value: 'Explain this in even simpler words for a young student' },
  { label: '🌍 More examples', value: 'Give me 3 more real-life examples to help me understand' },
  { label: '⭐ Most important', value: 'What is the single most important thing to remember?' },
  { label: '❓ Why does this matter', value: 'Why is this topic important in real life?' },
  { label: '🔁 Summarize again', value: 'Give me a very short 3-bullet summary of the lesson' },
];

export default function StudyPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [content, setContent] = useState<AiContent | null>(null);
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/years').then(r => {
      if (r.data.length > 0) {
        api.get(`/api/years/${r.data[0].id}/terms`).then(tr => {
          if (tr.data.length > 0) {
            api.get(`/api/terms/${tr.data[0].id}/subjects`).then(sr => setSubjects(sr.data)).catch(() => { });
          }
        }).catch(() => { });
      }
    }).catch(() => { });
  }, []);
  useEffect(() => {
    if (selectedSubject)
      api.get(`/api/subjects/${selectedSubject.id}/weeks`).then(r => setWeeks(r.data)).catch(() => { });
  }, [selectedSubject]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const loadLesson = async (week: Week) => {
    setSelectedWeek(week); setLoading(true); setContent(null);
    try { const r = await api.get(`/api/lessons/${week.id}`); setContent(r.data); }
    catch { } finally { setLoading(false); }
  };

  const sendChat = async (message: string) => {
    if (!message.trim() || !content) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);
    try {
      const context = lang === 'EN' ? content.lessonCardEn : content.lessonCardAr;
      const r = await api.post(`/api/lessons/${content.weekId}/chat`, { message, context });
      setChatMessages(prev => [...prev, { role: 'assistant', content: r.data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, try again!' }]);
    } finally { setChatLoading(false); }
  };

  const parsedFacts = (): string[] => {
    try { return JSON.parse(content?.keyFacts || '[]'); } catch { return []; }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">🎓 Study</h1>

          <div className="flex gap-3 flex-wrap mb-4">
            {subjects.map(s => (
              <button key={s.id}
                onClick={() => { setSelectedSubject(s); setSelectedWeek(null); setContent(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${selectedSubject?.id === s.id
                    ? 'text-white shadow-md scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:shadow-sm'}`}
                style={selectedSubject?.id === s.id ? { backgroundColor: s.colorCode } : {}}>
                {s.name}
              </button>
            ))}
          </div>

          {weeks.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {weeks.filter(w => w.status === 'Ready').map(w => (
                <button key={w.id} onClick={() => loadLesson(w)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border
                    ${selectedWeek?.id === w.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'}`}>
                  Wk {w.weekNumber}: {w.label}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="card text-center py-16">
              <div className="text-4xl mb-4 animate-bounce">📖</div>
              <p className="text-gray-500">Loading your lesson...</p>
            </div>
          )}

          {content && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                  {(['EN', 'AR'] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${lang === l ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      {l === 'EN' ? '🇬🇧 English' : '🇦🇪 العربية'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setChatOpen(p => !p)}
                    className={`btn-secondary text-sm ${chatOpen ? 'bg-primary-50 border-primary-300' : ''}`}>
                    💬 {chatOpen ? 'Hide Chat' : 'Ask AI'}
                  </button>
                  <button onClick={() => navigate(`/practice?weekId=${selectedWeek?.id}`)}
                    className="btn-primary text-sm">
                    ✏️ Practice Quiz
                  </button>
                </div>
              </div>

              <div className="card">
                <h2 className="font-bold text-gray-800 text-lg mb-3">📖 {selectedWeek?.label}</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm"
                  dir={lang === 'AR' ? 'rtl' : 'ltr'}>
                  {lang === 'EN' ? content.lessonCardEn : content.lessonCardAr}
                </div>
              </div>

              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">⭐ Key Facts</h3>
                <ul className="space-y-2">
                  {parsedFacts().map((fact, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="bg-primary-50 text-primary-600 font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">
                        {i + 1}
                      </span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card bg-blue-50 border-blue-100">
                <h3 className="font-bold text-blue-700 mb-2">📝 Summary</h3>
                <p className="text-sm text-blue-800">{content.summary}</p>
              </div>

              <div className="card bg-amber-50 border-amber-100">
                <h3 className="font-bold text-amber-700 mb-2">🌍 Did You Know?</h3>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{content.enrichment}</p>
              </div>
            </div>
          )}

          {!selectedSubject && (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🎓</div>
              <p className="text-gray-500">Select a subject above to start studying</p>
            </div>
          )}
        </div>
      </div>

      {chatOpen && content && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">💬 Ask AI</h3>
            <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="p-3 border-b border-gray-100 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map(p => (
              <button key={p.value} onClick={() => sendChat(p.value)}
                className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">Ask me anything about this lesson!</p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm
                  ${m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-500">
                  Thinking... 🤔
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input className="input text-sm flex-1" placeholder="Ask a question..."
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)} />
            <button className="btn-primary text-sm px-3" onClick={() => sendChat(chatInput)}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}