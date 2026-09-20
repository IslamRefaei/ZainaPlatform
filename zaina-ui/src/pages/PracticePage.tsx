import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';

interface Question {
  id: number; questionText: string; questionType: string;
  options: string; difficulty: string;
}
interface QuizResult {
  score: number; correct: number; total: number; passed: boolean;
  message: string; needsReExplanation: boolean; wrongTopics: string[];
  results: any[];
}
interface ReExplanation { reExplanation: string; focusAreas: string[]; newQuestions: any[]; }

export default function PracticePage() {
  const [searchParams] = useSearchParams();
  const weekId = searchParams.get('weekId');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [reExplanation, setReExplanation] = useState<ReExplanation | null>(null);
  const [splitView, setSplitView] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(new Date());
  const [fillInput, setFillInput] = useState('');
  const [reExplaining, setReExplaining] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);

  useEffect(() => {
    if (!weekId) { setLoading(false); return; }
    Promise.all([
      api.get(`/api/quiz/${weekId}`),
      api.get(`/api/lessons/${weekId}`).catch(() => ({ data: null }))
    ]).then(([quizRes, lessonRes]) => {
      setQuestions(quizRes.data.questions || []);
      setLesson(lessonRes.data);
    }).finally(() => setLoading(false));
  }, [weekId]);

  const current = questions[currentIndex];
  const parsedOptions = (): string[] => {
    try { return JSON.parse(current?.options || '[]'); } catch { return []; }
  };

  const submitAnswer = (answer?: string) => {
    const finalAnswer = answer || fillInput;
    if (!finalAnswer) return;
    setAnswers(p => ({ ...p, [current.id]: finalAnswer }));
    setSubmitted(p => ({ ...p, [current.id]: true }));
    setFillInput('');
    setFeedback(null);
  };

  const submitQuiz = async () => {
    const answersList = questions.map(q => ({ questionId: q.id, selectedAnswer: answers[q.id] || '' }));
    try {
      const r = await api.post(`/api/quiz/${weekId}/submit`, { answers: answersList, startedAt: startTime });
      setResult(r.data);
    } catch {}
  };

  const getReExplanation = async () => {
    if (!result) return;
    setReExplaining(true);
    try {
      const r = await api.post(`/api/weeks/${weekId}/reexplain`, { wrongTopics: result.wrongTopics });
      setReExplanation(r.data);
    } finally { setReExplaining(false); }
  };

  const getDiffBadge = (d: string) => {
    if (d === 'easy') return 'badge-easy';
    if (d === 'medium') return 'badge-medium';
    return 'badge-challenge';
  };

  const allAnswered = questions.length > 0 && questions.every(q => submitted[q.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center"><div className="text-5xl mb-4 animate-bounce">✏️</div>
        <p className="text-gray-500">Loading your quiz...</p></div>
    </div>
  );

  if (!weekId) return (
    <div className="flex items-center justify-center h-screen">
      <div className="card text-center p-12">
        <div className="text-5xl mb-4">✏️</div>
        <p className="text-gray-600 mb-2">No lesson selected.</p>
        <p className="text-sm text-gray-400">Go to Study → select a lesson → click Practice Quiz.</p>
      </div>
    </div>
  );

  if (result) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="card text-center mb-6">
        <div className="text-6xl mb-4">{result.passed ? '🎉' : '💪'}</div>
        <div className={`text-5xl font-bold mb-2 ${result.passed ? 'text-green-500' : 'text-yellow-500'}`}>{result.score}%</div>
        <div className="text-gray-600 mb-2">{result.correct} out of {result.total} correct</div>
        <div className={`inline-block px-4 py-1 rounded-full text-sm font-medium
          ${result.passed ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
          {result.message}
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="font-bold text-gray-800 mb-3">Question Breakdown</h3>
        <div className="space-y-3">
          {result.results.map((r: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl text-sm ${r.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-start gap-2">
                <span>{r.isCorrect ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{r.questionText}</div>
                  {!r.isCorrect && (
                    <>
                      <div className="text-red-500 mt-1 text-xs">Your answer: {r.selectedAnswer}</div>
                      <div className="text-green-600 text-xs">Correct: {r.correctAnswer}</div>
                      <div className="text-gray-600 mt-1 italic text-xs">{r.explanation}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.needsReExplanation && !reExplanation && (
        <div className="card bg-amber-50 border-amber-100 text-center mb-4">
          <div className="text-3xl mb-2">🤔</div>
          <p className="text-amber-800 font-medium mb-3">Want me to explain the tricky parts differently?</p>
          <button className="btn-primary" onClick={getReExplanation} disabled={reExplaining}>
            {reExplaining ? '⏳ Generating...' : '✨ Yes, explain it differently!'}
          </button>
        </div>
      )}

      {reExplanation && (
        <div className="card bg-blue-50 border-blue-100 mb-4">
          <h3 className="font-bold text-blue-800 mb-3">🎓 Here's a different explanation</h3>
          <p className="text-blue-700 text-sm whitespace-pre-wrap mb-4">{reExplanation.reExplanation}</p>
          <button className="btn-primary text-sm" onClick={() => {
            setResult(null); setReExplanation(null); setCurrentIndex(0);
            setAnswers({}); setSubmitted({}); setFeedback(null);
            setQuestions(reExplanation.newQuestions.map((q: any, i: number) => ({
              id: i + 1000, questionText: q.questionText, questionType: q.questionType,
              options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
              difficulty: q.difficulty
            })));
          }}>✏️ Try new questions</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {splitView && lesson && (
        <div className="w-1/2 border-r border-gray-200 overflow-auto p-6 bg-gray-50">
          <h3 className="font-bold text-gray-800 mb-3">📖 Lesson Reference</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{lesson.lessonCardEn}</p>
          <h4 className="font-semibold text-gray-700 mb-2">⭐ Key Facts</h4>
          <ul className="space-y-1">
            {(JSON.parse(lesson.keyFacts || '[]') as string[]).map((f: string, i: number) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-primary-500 font-bold">{i + 1}.</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${splitView ? 'w-1/2' : 'w-full'} overflow-auto p-6`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">✏️ Practice Quiz</h1>
            {lesson && (
              <button onClick={() => setSplitView(p => !p)}
                className={`btn-secondary text-sm ${splitView ? 'bg-primary-50 border-primary-300' : ''}`}>
                {splitView ? '📖 Hide Lesson' : '📖 Review Lesson'}
              </button>
            )}
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Object.keys(submitted).length} answered</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          {current && (
            <div className="card mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={getDiffBadge(current.difficulty)}>{current.difficulty}</span>
                <span className="text-xs text-gray-400 capitalize">{current.questionType}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-5">{current.questionText}</h2>

              {(current.questionType === 'mcq' || current.questionType === 'truefalse' ||
                current.questionType === 'multiple-choice' || current.questionType === 'true-false') && (
                <div className="space-y-2">
                  {parsedOptions().map((opt, i) => (
                    <button key={i} onClick={() => !submitted[current.id] && submitAnswer(opt)}
                      disabled={!!submitted[current.id]}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                        ${answers[current.id] === opt && !submitted[current.id] ? 'border-primary-500 bg-primary-50 text-primary-700' : ''}
                        ${!submitted[current.id] && answers[current.id] !== opt ? 'border-gray-200 hover:border-primary-300 hover:bg-gray-50' : ''}
                        ${submitted[current.id] && answers[current.id] === opt ? 'border-primary-400 bg-primary-50' : ''}
                        ${submitted[current.id] && answers[current.id] !== opt ? 'border-gray-100 text-gray-400' : ''}`}>
                      <span className="mr-3 font-bold text-gray-400">{String.fromCharCode(65 + i)}</span>{opt}
                    </button>
                  ))}
                </div>
              )}

              {(current.questionType === 'fillinblank' || current.questionType === 'shortanswer') && !submitted[current.id] && (
                <div className="space-y-2">
                  {current.questionType === 'shortanswer'
                    ? <textarea className="input resize-none h-24" placeholder="Write your answer..."
                        value={fillInput} onChange={e => setFillInput(e.target.value)} />
                    : <input className="input text-base" placeholder="Type your answer..."
                        value={fillInput} onChange={e => setFillInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitAnswer()} />
                  }
                  <button className="btn-primary w-full" disabled={!fillInput} onClick={() => submitAnswer()}>
                    Submit Answer
                  </button>
                </div>
              )}

              {submitted[current.id] && (
                <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-100">
                  <div className="font-bold text-green-700 mb-1">✅ Answer recorded</div>
                  <p className="text-xs text-gray-500">See your full results after completing all questions.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-between mb-6">
            <button className="btn-secondary" disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(p => p - 1)}>← Previous</button>
            {currentIndex < questions.length - 1
              ? <button className="btn-primary" onClick={() => setCurrentIndex(p => p + 1)}
                  disabled={!submitted[current?.id]}>Next →</button>
              : <button className="btn-success" onClick={submitQuiz} disabled={!allAnswered}>
                  Submit Quiz 🎯</button>
            }
          </div>

          <div className="flex gap-1.5 flex-wrap justify-center">
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrentIndex(i)}
                className={`w-7 h-7 rounded-full text-xs font-medium transition-all
                  ${i === currentIndex ? 'bg-primary-600 text-white' : ''}
                  ${submitted[q.id] && i !== currentIndex ? 'bg-green-500 text-white' : ''}
                  ${!submitted[q.id] && i !== currentIndex ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : ''}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
