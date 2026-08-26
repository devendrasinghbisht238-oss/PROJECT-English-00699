import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, prompt, grammarFocus } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        score: 6,
        wordCount: words,
        tensesUsed: { past: 2, present: 3, future: 0 },
        vocabularyUsed: [{ word: 'Student', meaning: 'छात्र', cefrLevel: 'A1' }],
        grammarCorrections: [
          { original: 'Missing GEMINI_API_KEY in Vercel', correction: 'Add GEMINI_API_KEY in Environment Variables', reason: 'Configuration required' }
        ],
        feedback: 'Please configure GEMINI_API_KEY in Vercel settings.',
        fluencyAdvice: 'Add your API key to get real AI analysis.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemPrompt = `You are a strict English grammar and fluency evaluation tool.
Analyze this user submission for the prompt: "${prompt}".
Target Grammar Focus: "${grammarFocus || 'General Writing'}".

User Text:
"""
${text}
"""

Find all spelling mistakes, punctuation errors, sentence fragments, phrasing flaws, or grammatical issues.
Respond strictly in this exact JSON structure:
{
  "score": <integer from 1 to 10 evaluating fluency, flow, and grammar>,
  "wordCount": ${words},
  "tensesUsed": {
    "past": <count of past tense verbs>,
    "present": <count of present tense verbs>,
    "future": <count of future tense verbs>
  },
  "vocabularyUsed": [
    {
      "word": "<notable or advanced word used by user>",
      "meaning": "<Hindi meaning>",
      "cefrLevel": "<A1|A2|B1|B2|C1|C2>"
    }
  ],
  "grammarCorrections": [
    {
      "original": "<exact flawed phrase/fragment from user text>",
      "correction": "<fixed standard grammatically correct version>",
      "reason": "<clear explanation of why this was corrected>"
    }
  ],
  "feedback": "<2 sentences evaluating the sentence structure and tone>",
  "fluencyAdvice": "<1 sentence actionable grammar and fluency tip>"
}`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text().trim();
    const parsed = JSON.parse(responseText);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('API Error:', error);
    const words = 0;
    return NextResponse.json({
      score: 5,
      wordCount: words,
      tensesUsed: { past: 0, present: 0, future: 0 },
      vocabularyUsed: [],
      grammarCorrections: [
        { original: 'Analysis Processing Error', correction: 'Retry with valid text', reason: error?.message || 'Error occurred during AI processing' }
      ],
      feedback: 'AI could not process this text format.',
      fluencyAdvice: 'Check API Key configuration.'
    });
  }
}
