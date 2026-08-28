import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
    
    const envKey = process.env.GEMINI_API_KEY || '';
    const apiKey = envKey.trim().replace(/[\r\n\t "']/g, '');

    if (!apiKey) {
      return NextResponse.json({
        score: 0,
        wordCount: wordCountCalculated,
        tensesUsed: { past: 0, present: 0, future: 0 },
        vocabularyUsed: [],
        grammarCorrections: [
          {
            original: 'GEMINI_API_KEY Missing',
            correction: 'Add GEMINI_API_KEY in Vercel',
            reason: 'Environment variable not found in Vercel settings.'
          }
        ],
        feedback: 'Please configure GEMINI_API_KEY in Vercel settings.',
        fluencyAdvice: 'Add your Gemini API Key and Redeploy.'
      });
    }

    const systemPrompt = `You are a strict English Linguistics Professor and CEFR Assessor.
Analyze this student writing:
Prompt: "${rawPrompt}"
Grammar Focus: "${rawFocus}"

Student Text:
"""
${rawText}
"""

Instructions:
1. Extract 2 to 5 notable or misspelled words typed by the student. Provide their accurate Hindi translation and CEFR level (A1 to C2).
2. Catch every grammatical flaw, capitalization issue, missing punctuation, syntax errors, or spelling mistakes.
3. Score strictly from 1 to 10 based on grammar accuracy.
4. Output STRICT JSON only:
{
  "score": 4,
  "wordCount": ${wordCountCalculated},
  "tensesUsed": { "past": 0, "present": 2, "future": 0 },
  "vocabularyUsed": [
    { "word": "example", "meaning": "Hindi translation", "cefrLevel": "A2" }
  ],
  "grammarCorrections": [
    {
      "original": "sample text",
      "correction": "Sample text.",
      "reason": "Grammar rule explanation."
    }
  ],
  "feedback": "Constructive evaluation of writing.",
  "fluencyAdvice": "Actionable advice to improve."
}`;

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
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
      throw new Error(data?.error?.message || `Google API status: ${response.status}`);
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
      fluencyAdvice: 'Check API Key configuration in Vercel.'
    });
  }
}
