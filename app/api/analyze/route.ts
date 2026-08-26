import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function cleanToAscii(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x00-\x7F]/g, ' ')
    .trim();
}

function extractJson(text: string) {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let wordCountCalculated = 0;

  try {
    const body = await req.json();
    const rawText = body.text || '';
    const rawPrompt = body.prompt || '';
    const rawFocus = body.grammarFocus || '';

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    wordCountCalculated = rawText.trim().split(/\s+/).filter(Boolean).length;
    const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();
    const apiKey = rawApiKey.replace(/[^a-zA-Z0-9_\-\.]/g, '');

    if (!apiKey || apiKey.includes('github') || apiKey.includes('http')) {
      return NextResponse.json({
        score: 0,
        wordCount: wordCountCalculated,
        tensesUsed: { past: 0, present: 0, future: 0 },
        vocabularyUsed: [],
        grammarCorrections: [
          {
            original: 'Invalid GEMINI_API_KEY',
            correction: 'Paste actual Google AI Key in Vercel',
            reason: 'Environment variable in Vercel contains GitHub text or invalid characters.'
          }
        ],
        feedback: 'Please check your GEMINI_API_KEY in Vercel Environment Variables.',
        fluencyAdvice: 'Paste your real API key in Vercel and redeploy.'
      });
    }

    const cleanInput = cleanToAscii(rawText);
    const cleanPrompt = cleanToAscii(rawPrompt);
    const cleanFocus = cleanToAscii(rawFocus);

    const systemPrompt = `You are a strict English Linguistics Professor and CEFR Assessor.
Analyze this student writing:
Prompt: "${cleanPrompt}"
Grammar Focus: "${cleanFocus}"

Student Text:
"""
${cleanInput}
"""

Instructions:
1. Extract 3 to 6 notable or misspelled words typed by the student. Provide their accurate Hindi translation and CEFR level (A1 to C2).
2. Catch every grammatical flaw, double verb (e.g. "is are"), incorrect tense/pronoun chains ("his my there here"), spelling errors, or punctuation mistakes.
3. Score strictly from 1 to 10 based on grammar accuracy.
4. Output STRICT JSON only:
{
  "score": 7,
  "wordCount": ${wordCountCalculated},
  "tensesUsed": { "past": 0, "present": 0, "future": 0 },
  "vocabularyUsed": [
    { "word": "example", "meaning": "Hindi translation", "cefrLevel": "B2" }
  ],
  "grammarCorrections": [
    {
      "original": "flawed text",
      "correction": "corrected English",
      "reason": "grammar rule explanation"
    }
  ],
  "feedback": "Two constructive sentences on writing style.",
  "fluencyAdvice": "One actionable tip to improve English."
}`;

    const targetUrl = `[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$){apiKey}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || `API Status: ${response.status}`);
    }

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsedData = extractJson(aiText);

    if (!parsedData) {
      throw new Error('Invalid JSON format from AI');
    }

    return NextResponse.json({
      ...parsedData,
      wordCount: wordCountCalculated
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      score: 1,
      wordCount: wordCountCalculated,
      tensesUsed: { past: 0, present: 0, future: 0 },
      vocabularyUsed: [],
      grammarCorrections: [
        {
          original: 'Analysis Error',
          correction: 'Retry Submission',
          reason: error?.message || 'Processing error'
        }
      ],
      feedback: 'Failed to process AI evaluation.',
      fluencyAdvice: 'Check API Key configuration.'
    });
  }
}
