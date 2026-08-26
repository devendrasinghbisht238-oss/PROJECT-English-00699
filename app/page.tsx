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
  VolumeX,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [entryText, setEntryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const currentTask = TASKS.find((t) => t.day === selectedDay) || TASKS[0];

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(`autobio_day_${selectedDay}`);
    if (saved) setEntryText(saved);

    const savedCompleted = localStorage.getItem('autobio_completed_days');
    if (savedCompleted) {
      try {
        setCompletedDays(JSON.parse(savedCompleted));
      } catch {
        setCompletedDays([]);
      }
    }
  }, [selectedDay]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEntryText(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`autobio_day_${selectedDay}`, val);
    }
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
    } catch (e) {
      alert('Network error while requesting analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        setEntryText(content);
        localStorage.setItem(`autobio_day_${selectedDay}`, content);
      };
      reader.readAsText(file);
    }
  };

  const toggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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
    const content = `AutoBio English Portfolio - Day ${currentTask.day}\nTheme: ${currentTask.theme}\nTopic: ${currentTask.title}\n\nUSER WRITING:\n${entryText}\n\nEVALUATION:\nScore: ${analysis?.score || 'N/A'}/10\nFeedback: ${analysis?.feedback || 'N/A'}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AutoBio_Day_${currentTask.day}_Portfolio.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCompletePortfolio = () => {
    let fullContent = `AUTOBIO ENGLISH 20-DAY PORTFOLIO\n================================\n\n`;
    TASKS.forEach((t) => {
      const saved = localStorage.getItem(`autobio_day_${t.day}`) || '(No entry submitted yet)';
      fullContent += `DAY ${t.day}: ${t.title} [${t.theme}]\nPrompt: ${t.prompt}\n\nEssay:\n${saved}\n\n-------------------------\n\n`;
    });

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Complete_20Day_AutoBio_Portfolio.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return (
      <div style={{ backgroundColor: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontFamily: 'sans-serif' }}>
        Loading AutoBio AI...
      </div>
    );
  }

  const wordCount = entryText.trim() ? entryText.trim().split(/\s+/).filter(Boolean).length : 0;
  const progressPercent = Math.round((completedDays.length / 20) * 100);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: '#4f46e5', borderRadius: '8px' }}>
            <BookOpen style={{ width: '24px', height: '24px', color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>
              AutoBio <span style={{ color: '#818cf8' }}>English AI</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>20-Day Fluency & Linguistic Portfolio</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>
            <Flame style={{ width: '16px', height: '16px' }} />
            <span>{completedDays.length} / 20 Done ({progressPercent}%)</span>
          </div>

          <button
            onClick={exportCompletePortfolio}
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Award style={{ width: '16px', height: '16px' }} /> Export Full Portfolio
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <aside style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px', maxHeight: '680px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 12px 0' }}>Tasks Timeline</h2>
          {TASKS.map((task) => (
            <button
              key={task.day}
              onClick={() => setSelectedDay(task.day)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid',
                backgroundColor: selectedDay === task.day ? '#4f46e5' : '#020617',
                color: selectedDay === task.day ? '#ffffff' : '#cbd5e1',
                borderColor: selectedDay === task.day ? '#6366f1' : '#1e293b'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Day {task.day}: {task.title}
              </span>
              {completedDays.includes(task.day) && <CheckCircle2 style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />}
            </button>
          ))}
        </aside>

        <section style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Day {currentTask.day}: {currentTask.title}</h3>
              <span style={{ fontSize: '11px', backgroundColor: '#1e1b4b', color: '#a5b4fc', padding: '4px 8px', borderRadius: '12px', border: '1px solid #3730a3' }}>
                {currentTask.theme}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', backgroundColor: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', lineHeight: '1.5' }}>
              {currentTask.prompt}
            </p>

            <div style={{ position: 'relative', marginTop: '12px' }}>
              <textarea
                rows={8}
                value={entryText}
                onChange={handleTextChange}
                placeholder="Write your story in English here (Aim for 150+ words)..."
                style={{
                  width: '100%',
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {wordCount} / {currentTask.targetWords} words
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !entryText.trim()}
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles style={{ width: '16px', height: '16px' }} />
                  {loading ? 'Evaluating Grammar with AI...' : 'Run Deep AI Analysis'}
                </button>

                <button
                  onClick={toggleSpeak}
                  disabled={!entryText.trim()}
                  style={{ backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {speaking ? <VolumeX style={{ width: '16px', height: '16px', color: '#f43f5e' }} /> : <Volume2 style={{ width: '16px', height: '16px' }} />}
                  {speaking ? 'Stop' : 'Listen'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <label style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload style={{ width: '14px', height: '14px' }} /> Upload .txt
                  <input type="file" accept=".txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>

                <button
                  onClick={exportSingleEntry}
                  disabled={!entryText.trim()}
                  style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download style={{ width: '14px', height: '14px' }} /> Export
                </button>
              </div>
            </div>
          </div>

          {analysis && (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #312e81', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <CheckCircle2 style={{ width: '18px', height: '18px' }} /> Linguistic Feedback
                </h4>
                <span style={{ fontSize: '11px', color: '#94a3b8', border: '1px solid #1e293b', padding: '3px 8px', borderRadius: '6px' }}>
                  Live Evaluated
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Fluency Score</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#818cf8', marginTop: '4px' }}>{analysis.score} / 10</div>
                </div>
                <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Actual Words</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>{analysis.wordCount}</div>
                </div>
              </div>

              {/* Grammar Section */}
              <div style={{ backgroundColor: '#020617', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle style={{ width: '15px', height: '15px', color: '#fbbf24' }} /> Grammatical & Sentence Flaws Detected:
                </h5>

                {analysis.grammarCorrections && analysis.grammarCorrections.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.grammarCorrections.map((item, idx) => (
                      <div key={idx} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px' }}>
                          <span style={{ color: '#f87171', backgroundColor: '#450a0a', padding: '2px 8px', borderRadius: '4px', textDecoration: 'line-through' }}>
                            {item.original}
                          </span>
                          <span style={{ color: '#94a3b8' }}>➔</span>
                          <span style={{ color: '#4ade80', backgroundColor: '#052e16', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {item.correction}
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                          <strong>Reason: </strong>{item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#4ade80', fontSize: '12px' }}>
                    ✓ Excellent! No grammatical errors or sentence fragments were found.
                  </p>
                )}
              </div>

              {/* Vocabulary Section */}
              {analysis.vocabularyUsed && analysis.vocabularyUsed.length > 0 && (
                <div style={{ backgroundColor: '#020617', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', margin: '0 0 10px 0' }}>Key Vocabulary:</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {analysis.vocabularyUsed.map((v, idx) => (
                      <div key={idx} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                        <strong style={{ color: '#818cf8' }}>{v.word}</strong>: <span style={{ color: '#94a3b8' }}>{v.meaning}</span> ({v.cefrLevel})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice */}
              <div style={{ backgroundColor: '#020617', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b', fontSize: '12px', lineHeight: '1.5' }}>
                <strong style={{ color: '#818cf8' }}>Feedback: </strong>{analysis.feedback}
                <div style={{ marginTop: '6px', color: '#38bdf8' }}>
                  <strong>Fluency Advice: </strong>{analysis.fluencyAdvice}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
