import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawText = body.text || '';
    const rawPrompt = body.prompt || '';
    const rawFocus = body.grammarFocus || '';

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const words = rawText.trim().split(/\s+/).filter(Boolean).length;
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return NextResponse.json({
        score: 0,
        wordCount: words,
        tensesUsed: { past: 0, present: 0, future: 0 },
        vocabularyUsed: [],
        grammarCorrections: [
          {
            original: 'Missing GEMINI_API_KEY',
            correction: 'Add GEMINI_API_KEY in Vercel Environment Variables',
            reason: 'Environment variable not configured in Vercel.',
          },
        ],
        feedback: 'Please configure GEMINI_API_KEY in Vercel settings.',
        fluencyAdvice: 'Add your Gemini API Key and Redeploy.',
      });
    }

    const systemPrompt = `You are a strict English linguistic evaluator and grammar coach.
Target Prompt: "${rawPrompt}"
Grammar Focus: "${rawFocus}"

User Text to Analyze:
"""
${rawText}
"""

Instructions:
1. Identify all spelling, grammar, punctuation, and fragment errors.
2. Provide concise CEFR vocabulary feedback with Hindi translations.
3. Respond ONLY with this exact JSON schema (no extra text or markdown):
{
  "score": 7,
  "wordCount": ${words},
  "tensesUsed": { "past": 1, "present": 2, "future": 0 },
  "vocabularyUsed": [
    { "word": "example", "meaning": "उदाहरण", "cefrLevel": "B2" }
  ],
  "grammarCorrections": [
    {
      "original": "exact wrong phrase from text",
      "correction": "corrected phrasing",
      "reason": "grammar rule explanation"
    }
  ],
  "feedback": "Two constructive sentences on writing style.",
  "fluencyAdvice": "One actionable tip to improve grammar."
}`;

    // Direct Google Gemini REST API Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || 'Google API Error';
      throw new Error(errMsg);
    }

    const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJson = rawReply.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({
      ...parsed,
      wordCount: words,
    });
  } catch (error: any) {
    console.error('Direct API Error:', error);
    return NextResponse.json({
      score: 0,
      wordCount: 0,
      tensesUsed: { past: 0, present: 0, future: 0 },
      vocabularyUsed: [],
      grammarCorrections: [
        {
          original: 'API Execution Error',
          correction: 'Retry Analysis',
          reason: error?.message || 'Failed to process AI evaluation.',
        },
      ],
      feedback: 'Could not complete AI evaluation with the current key.',
      fluencyAdvice: 'Check API Key configuration in Vercel.',
    });
  }
}
