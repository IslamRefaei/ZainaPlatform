import { useState, useEffect } from 'react';
import api from '../api/client';

interface AcademicYear { id: number; label: string; startYear: number; endYear: number; }
interface Term { id: number; academicYearId: number; label: string; termNumber: number; }
interface Subject { id: number; termId: number; name: string; language: string; colorCode: string; }
interface Week { id: number; subjectId: number; weekNumber: number; label: string; status: string; }

const STATUS_COLORS: Record<string, string> = {
  NotStarted: 'bg-gray-100 text-gray-600',
  Processing: 'bg-yellow-50 text-yellow-600',
  Generating: 'bg-blue-50 text-blue-500',
  Ready: 'bg-green-50 text-green-600',
  Failed: 'bg-red-50 text-red-500',
};

export default function ManagePage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);

  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [newYear, setNewYear] = useState({ label: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1 });
  const [newTerm, setNewTerm] = useState({ label: '', termNumber: 1 });
  const [newSubject, setNewSubject] = useState({ name: '', language: 'EN', colorCode: '#1B4F8A' });
  const [newWeek, setNewWeek] = useState({ weekNumber: 1, label: '' });

  const [uploading, setUploading] = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);
  const [tab, setTab] = useState<'years' | 'terms' | 'subjects' | 'weeks' | 'upload'>('years');

  useEffect(() => { fetchYears(); }, []);
  useEffect(() => { if (selectedYear) fetchTerms(selectedYear.id); }, [selectedYear]);
  useEffect(() => { if (selectedTerm) fetchSubjects(selectedTerm.id); }, [selectedTerm]);
  useEffect(() => { if (selectedSubject) fetchWeeks(selectedSubject.id); }, [selectedSubject]);

  const fetchYears = async () => {
    try { const r = await api.get('/api/years'); setYears(r.data); } catch { }
  };
  const fetchTerms = async (yearId: number) => {
    try { const r = await api.get(`/api/years/${yearId}/terms`); setTerms(r.data); } catch { }
  };
  const fetchSubjects = async (termId: number) => {
    try { const r = await api.get(`/api/terms/${termId}/subjects`); setSubjects(r.data); } catch { }
  };
  const fetchWeeks = async (subjectId: number) => {
    try { const r = await api.get(`/api/subjects/${subjectId}/weeks`); setWeeks(r.data); } catch { }
  };

  const createYear = async () => {
    if (!newYear.label) return;
    await api.post('/api/years', newYear);
    setNewYear({ label: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1 });
    fetchYears();
  };
  const createTerm = async () => {
    if (!selectedYear || !newTerm.label) return;
    await api.post(`/api/years/${selectedYear.id}/terms`, newTerm);
    setNewTerm({ label: '', termNumber: terms.length + 2 });
    fetchTerms(selectedYear.id);
  };
  const createSubject = async () => {
    if (!selectedTerm || !newSubject.name) return;
    await api.post(`/api/terms/${selectedTerm.id}/subjects`, newSubject);
    setNewSubject({ name: '', language: 'EN', colorCode: '#1B4F8A' });
    fetchSubjects(selectedTerm.id);
  };
  const createWeek = async () => {
    if (!selectedSubject || !newWeek.label) return;
    await api.post(`/api/subjects/${selectedSubject.id}/weeks`, newWeek);
    setNewWeek({ weekNumber: weeks.length + 2, label: '' });
    fetchWeeks(selectedSubject.id);
  };
  const handleUpload = async (weekId: number, file: File) => {
    setUploading(weekId);
    const form = new FormData();
    form.append('file', file);
    try {
      await api.post(`/api/weeks/${weekId}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchWeeks(selectedSubject!.id);
    } finally { setUploading(null); }
  };
  const handleGenerate = async (weekId: number) => {
    setGenerating(weekId);
    try {
      await api.post(`/api/weeks/${weekId}/generate`);
      fetchWeeks(selectedSubject!.id);
    } finally { setGenerating(null); }
  };

  const tabs = ['years', 'terms', 'subjects', 'weeks', 'upload'] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📚 Manage Content</h1>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>{selectedYear?.label || '—'}</span>
        {selectedTerm && <><span>›</span><span>{selectedTerm.label}</span></>}
        {selectedSubject && <><span>›</span><span>{selectedSubject.name}</span></>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition-colors
              ${tab === t ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'years' ? '📅 Years' : t === 'terms' ? '📆 Terms' : t === 'subjects' ? '📖 Subjects' : t === 'weeks' ? '🗓 Weeks' : '📎 Upload'}
          </button>
        ))}
      </div>

      {/* Years */}
      {tab === 'years' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">Add Academic Year</h2>
            <div className="flex gap-3 flex-wrap">
              <input className="input flex-1 min-w-48" placeholder="Label (e.g. Year 5 — 2025/2026)"
                value={newYear.label} onChange={e => setNewYear(p => ({ ...p, label: e.target.value }))} />
              <input type="number" className="input w-28" placeholder="Start year"
                value={newYear.startYear} onChange={e => setNewYear(p => ({ ...p, startYear: +e.target.value }))} />
              <input type="number" className="input w-28" placeholder="End year"
                value={newYear.endYear} onChange={e => setNewYear(p => ({ ...p, endYear: +e.target.value }))} />
              <button className="btn-primary" onClick={createYear}>Add Year</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {years.map(y => (
              <div key={y.id} onClick={() => { setSelectedYear(y); setSelectedTerm(null); setSelectedSubject(null); setTab('terms'); }}
                className={`card cursor-pointer hover:shadow-md transition-all border-l-4
                  ${selectedYear?.id === y.id ? 'border-l-primary-600 bg-primary-50' : 'border-l-gray-200'}`}>
                <div className="font-semibold text-gray-800">{y.label}</div>
                <div className="text-xs text-gray-500 mt-1">{y.startYear} / {y.endYear}</div>
              </div>
            ))}
            {years.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">No academic years yet. Add one above.</div>
            )}
          </div>
        </div>
      )}

      {/* Terms */}
      {tab === 'terms' && (
        <div className="space-y-4">
          {/* Year selector */}
          <div className="flex gap-2 flex-wrap items-center mb-2">
            <span className="text-sm text-gray-500">Year:</span>
            {years.map(y => (
              <button key={y.id} onClick={() => { setSelectedYear(y); setSelectedTerm(null); }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${selectedYear?.id === y.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {y.label}
              </button>
            ))}
          </div>
          {selectedYear && (
            <>
              <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4">Add Term to {selectedYear.label}</h2>
                <div className="flex gap-3 flex-wrap">
                  <input type="number" className="input w-24" placeholder="Term #"
                    value={newTerm.termNumber} onChange={e => setNewTerm(p => ({ ...p, termNumber: +e.target.value }))} />
                  <input className="input flex-1 min-w-48" placeholder="Label (e.g. Term 1)"
                    value={newTerm.label} onChange={e => setNewTerm(p => ({ ...p, label: e.target.value }))} />
                  <button className="btn-primary" onClick={createTerm}>Add Term</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {terms.map(t => (
                  <div key={t.id} onClick={() => { setSelectedTerm(t); setSelectedSubject(null); setTab('subjects'); }}
                    className={`card cursor-pointer hover:shadow-md transition-all border-l-4
                      ${selectedTerm?.id === t.id ? 'border-l-primary-600 bg-primary-50' : 'border-l-gray-200'}`}>
                    <div className="font-semibold text-gray-800">{t.label}</div>
                    <div className="text-xs text-gray-500 mt-1">Term {t.termNumber}</div>
                  </div>
                ))}
                {terms.length === 0 && <div className="col-span-3 text-center py-8 text-gray-400">No terms yet.</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Subjects */}
      {tab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center mb-2">
            <span className="text-sm text-gray-500">Term:</span>
            {terms.map(t => (
              <button key={t.id} onClick={() => setSelectedTerm(t)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${selectedTerm?.id === t.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {selectedTerm && (
            <>
              <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4">Add Subject to {selectedTerm.label}</h2>
                <div className="flex gap-3 flex-wrap">
                  <input className="input flex-1 min-w-48" placeholder="Subject name (e.g. Science)"
                    value={newSubject.name} onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))} />
                  <select className="input w-28" value={newSubject.language}
                    onChange={e => setNewSubject(p => ({ ...p, language: e.target.value }))}>
                    <option value="EN">English</option>
                    <option value="AR">Arabic</option>
                  </select>
                  <input type="color" className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer"
                    value={newSubject.colorCode} onChange={e => setNewSubject(p => ({ ...p, colorCode: e.target.value }))} />
                  <button className="btn-primary" onClick={createSubject}>Add Subject</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(s => (
                  <div key={s.id} onClick={() => { setSelectedSubject(s); setTab('weeks'); }}
                    className="card cursor-pointer hover:shadow-md transition-shadow border-l-4"
                    style={{ borderLeftColor: s.colorCode }}>
                    <div className="font-semibold text-gray-800">{s.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.language === 'EN' ? '🇬🇧 English' : '🇦🇪 Arabic'}</div>
                  </div>
                ))}
                {subjects.length === 0 && <div className="col-span-3 text-center py-8 text-gray-400">No subjects yet.</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Weeks */}
      {tab === 'weeks' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center mb-2">
            <span className="text-sm text-gray-500">Subject:</span>
            {subjects.map(s => (
              <button key={s.id} onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${selectedSubject?.id === s.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={selectedSubject?.id === s.id ? { backgroundColor: s.colorCode } : {}}>
                {s.name}
              </button>
            ))}
          </div>
          {selectedSubject && (
            <>
              <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4">Add Week to {selectedSubject.name}</h2>
                <div className="flex gap-3 flex-wrap">
                  <input type="number" className="input w-24" placeholder="Week #"
                    value={newWeek.weekNumber} onChange={e => setNewWeek(p => ({ ...p, weekNumber: +e.target.value }))} />
                  <input className="input flex-1 min-w-48" placeholder="Label (e.g. Photosynthesis)"
                    value={newWeek.label} onChange={e => setNewWeek(p => ({ ...p, label: e.target.value }))} />
                  <button className="btn-primary" onClick={createWeek}>Add Week</button>
                </div>
              </div>
              <div className="space-y-3">
                {weeks.map(w => (
                  <div key={w.id} className="card flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-800">Week {w.weekNumber} — {w.label}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_COLORS[w.status] || 'bg-gray-100'}`}>
                        {w.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-sm" onClick={() => setTab('upload')}>📎 Upload</button>
                      {w.status === 'Processing' && (
                        <button className="btn-primary text-sm" disabled={generating === w.id}
                          onClick={() => handleGenerate(w.id)}>
                          {generating === w.id ? '⏳ Generating...' : '✨ Generate AI'}
                        </button>
                      )}
                      {w.status === 'Ready' && <span className="text-green-500 text-sm font-medium">✅ Ready</span>}
                    </div>
                  </div>
                ))}
                {weeks.length === 0 && <div className="text-center py-8 text-gray-400">No weeks yet.</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload */}
      {tab === 'upload' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center mb-2">
            <span className="text-sm text-gray-500">Subject:</span>
            {subjects.map(s => (
              <button key={s.id} onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${selectedSubject?.id === s.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={selectedSubject?.id === s.id ? { backgroundColor: s.colorCode } : {}}>
                {s.name}
              </button>
            ))}
          </div>
          {selectedSubject && weeks.map(w => (
            <div key={w.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-gray-800">Week {w.weekNumber} — {w.label}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[w.status] || 'bg-gray-100'}`}>
                  {w.status}
                </span>
              </div>
              <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors
                ${uploading === w.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'}`}>
                <span className="text-3xl mb-2">{uploading === w.id ? '⏳' : '📎'}</span>
                <span className="text-sm font-medium text-gray-600">
                  {uploading === w.id ? 'Uploading...' : 'Click to upload PDF, DOCX or PPTX'}
                </span>
                <span className="text-xs text-gray-400 mt-1">Max 50MB</span>
                <input type="file" className="hidden" accept=".pdf,.docx,.pptx"
                  disabled={uploading === w.id}
                  onChange={e => { if (e.target.files?.[0]) handleUpload(w.id, e.target.files[0]); }} />
              </label>
            </div>
          ))}
          {!selectedSubject && <div className="text-center py-12 text-gray-400">Select a subject first from the Subjects tab.</div>}
        </div>
      )}
    </div>
  );
}