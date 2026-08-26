'use client';

import React, { useState, useEffect } from 'react';
import { TASKS } from '@/data/tasks';
import { AnalysisResponse } from '@/types';
import { 
  Sparkles, 
  Volume2, 
  Download, 
  Upload, 
  CheckCircle2, 
  BookOpen, 
  Flame, 
  Award, 
  VolumeX
} from 'lucide-react';

export default function Dashboard() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [entryText, setEntryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const currentTask = TASKS.find((t) => t.day === selectedDay) || TASKS[0];

  useEffect(() => {
    const saved = localStorage.getItem(`autobio_day_${selectedDay}`);
    if (saved) {
      setEntryText(saved);
    } else {
      setEntryText('');
    }
    setAnalysis(null);

    const savedCompleted = localStorage.getItem('autobio_completed_days');
    if (savedCompleted) {
      try {
        setCompletedDays(JSON.parse(savedCompleted));
      } catch (e) {
        setCompletedDays([]);
      }
    }
  }, [selectedDay]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEntryText(val);
    localStorage.setItem(`autobio_day_${selectedDay}`, val);
  };

  const handleAnalyze = async () => {
    if (!entryText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: entryText, 
          prompt: currentTask.prompt,
          grammarFocus: currentTask.grammarFocus 
        }),
      });
      const data: AnalysisResponse = await res.json();
      setAnalysis(data);

      if (!completedDays.includes(selectedDay)) {
        const updated = [...completedDays, selectedDay];
        setCompletedDays(updated);
        localStorage.setItem('autobio_completed_days', JSON.stringify(updated));
      }
    } catch {
      alert('Analysis request failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setEntryText(content);
        localStorage.setItem(`autobio_day_${selectedDay}`, content);
      };
      reader.readAsText(file);
    }
  };

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text to speech is not supported in this browser.');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      if (!entryText.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(entryText);
      utterance.rate = 0.9;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  const exportSingleEntry = () => {
    const content = `AutoBio English Portfolio - Day ${currentTask.day}
Theme: ${currentTask.theme}
Topic: ${currentTask.title}
Grammar Focus: ${currentTask.grammarFocus}
--------------------------------------------------
USER WRITING:
${entryText}

--------------------------------------------------
AI ANALYSIS EVALUATION:
Fluency Score: ${analysis?.score || 'Pending'} / 10
Word Count: ${analysis?.wordCount || entryText.trim().split(/\s+/).filter(Boolean).length}
Feedback: ${analysis?.feedback || 'N/A'}
Fluency Advice: ${analysis?.fluencyAdvice || 'N/A'}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AutoBio_Day_${currentTask.day}_Portfolio.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCompletePortfolio = () => {
    let fullContent = `==================================================\n   AUTOBIO ENGLISH 20-DAY LEARNING PORTFOLIO\n==================================================\n\n`;
    TASKS.forEach((t) => {
      const saved = localStorage.getItem(`autobio_day_${t.day}`) || '(No entry submitted yet)';
      fullContent += `DAY ${t.day}: ${t.title} [${t.theme}]\nPrompt: ${t.prompt}\n\nEssay:\n${saved}\n\n--------------------------------------------------\n\n`;
    });

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Complete_20Day_AutoBio_Portfolio.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = entryText.trim() ? entryText.trim().split(/\s+/).filter(Boolean).length : 0;
  const progressPercent = Math.round((completedDays.length / 20) * 100);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              AutoBio <span className="text-indigo-400">English AI</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400">20-Day Autobiographical Fluency & Linguistic Portfolio</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400">
            <Flame className="w-4 h-4" />
            <span>{completedDays.length} / 20 Completed ({progressPercent}%)</span>
          </div>

          <button
            onClick={exportCompletePortfolio}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md"
          >
            <Award className="w-4 h-4" /> Export Full Portfolio
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-h-[750px] overflow-y-auto space-y-1.5 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1 mb-2">
            20-Day Curriculum
          </h2>
          {TASKS.map((task) => {
            const isDone = completedDays.includes(task.day);
            const isCurrent = selectedDay === task.day;
            return (
              <button
                key={task.day}
                onClick={() => setSelectedDay(task.day)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition flex items-center justify-between border ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : isDone
                    ? 'bg-slate-950/60 text-emerald-300 border-emerald-950 hover:bg-slate-800'
                    : 'bg-slate-950/30 text-slate-400 border-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent ? 'bg-white text-indigo-600' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {task.day}
                  </span>
                  <span className="truncate">{task.title}</span>
                </div>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-md font-bold">
                  Day {currentTask.day} of 20
                </span>
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium">
                  {currentTask.theme}
                </span>
              </div>
              <span className="text-xs text-indigo-300 font-mono">
                Grammar Focus: {currentTask.grammarFocus}
              </span>
            </div>

            <h3 className="text-xl font-black text-white mb-2">{currentTask.title}</h3>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              {currentTask.prompt}
            </p>

            <div className="relative">
              <textarea
                rows={9}
                value={entryText}
                onChange={handleTextChange}
                placeholder="Write your autobiographical story in English here (Aim for 150+ words)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm leading-relaxed transition"
              />
              <div className="absolute bottom-3 right-4 text-xs font-mono text-slate-500">
                {wordCount} / {currentTask.targetWords} words
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !entryText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Evaluating with AI...' : 'Run Deep AI Analysis'}
                </button>

                <button
                  onClick={toggleSpeak}
                  disabled={!entryText.trim()}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-slate-700 transition"
                >
                  {speaking ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  {speaking ? 'Stop' : 'Listen Audio'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition">
                  <Upload className="w-3.5 h-3.5" /> Upload .txt
                  <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  onClick={exportSingleEntry}
                  disabled={!entryText.trim()}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Export Day {currentTask.day}
                </button>
              </div>
            </div>
          </div>

          {analysis && (
            <div className="bg-slate-900 border border-indigo-900/40 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="text-lg font-black text-indigo-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" /> AI Linguistic Evaluation
                </h4>
                <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-full font-bold">
                  CEFR Metric
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fluency Score</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">{analysis.score} / 10</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Word Count</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{analysis.wordCount}</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 col-span-2 sm:col-span-2">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Tense Distribution</div>
                  <div className="flex gap-4 text-xs font-mono text-slate-300 mt-1">
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">Past: <strong className="text-indigo-300">{analysis.tensesUsed?.past || 0}</strong></span>
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">Present: <strong className="text-emerald-300">{analysis.tensesUsed?.present || 0}</strong></span>
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">Future: <strong className="text-amber-300">{analysis.tensesUsed?.future || 0}</strong></span>
                  </div>
                </div>
              </div>

              {analysis.vocabularyUsed?.length > 0 && (
                <div>
                  <h5 className="font-bold text-sm text-slate-200 mb-2.5">Vocabulary & Meanings</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {analysis.vocabularyUsed.map((v, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-indigo-400 font-black text-sm">{v.word}</span>
                          <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono">{v.cefrLevel || 'B2'}</span>
                        </div>
                        <p className="text-slate-400">{v.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-bold text-sm text-slate-200 mb-2.5">Grammar & Phrasing Corrections</h5>
                {analysis.grammarCorrections?.length > 0 ? (
                  <ul className="space-y-2.5">
                    {analysis.grammarCorrections.map((item, i) => (
                      <li key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-rose-400 line-through bg-rose-950/30 px-2 py-0.5 rounded">{item.original}</span>
                          <span className="text-slate-500">➔</span>
                          <span className="text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded">{item.correction}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl">
                    ✓ Outstanding grammar! No significant grammatical errors were detected.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h6 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1">Evaluator Feedback</h6>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.feedback}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h6 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 mb-1">Fluency Action Plan</h6>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.fluencyAdvice}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
