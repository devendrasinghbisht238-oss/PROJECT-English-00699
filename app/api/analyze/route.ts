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
    const apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/[\r\n"']/g, '');

    if (!apiKey) {
      return NextResponse.json({
        score: 0,
        wordCount: wordCountCalculated,
        tensesUsed: { past: 0, present: 0, future: 0 },
        vocabularyUsed: [],
        grammarCorrections: [
          {
            original: 'GEMINI_API_KEY Missing',
            correction: 'Add GEMINI_API_KEY in Vercel Environment Variables',
            reason: 'Server requires an active Google AI API Key to run real-time analysis.'
          }
        ],
        feedback: 'API Key is missing in Vercel settings.',
        fluencyAdvice: 'Configure GEMINI_API_KEY and redeploy.'
      });
    }

    const systemPrompt = `You are a strict, world-class English Linguistics Professor, Grammarian, and CEFR Assessor.
Analyze the following student writing submission with complete linguistic rigor.

Task Theme/Prompt: "${rawPrompt}"
Grammar Focus: "${rawFocus}"

Student Submission:
"""
${rawText}
"""

YOUR CORE ANALYSIS MANDATE:
1. DETECT EVERY LINGUISTIC FLAW:
   - Subject-Verb Agreement (e.g. "i name is", "we is")
   - Auxiliary/Verb Stacking & Doubling (e.g. "is are", "am live", "did not went")
   - Conflicting Pronouns & Determiners (e.g. "his my there here home", "their his")
   - Tenses & Aspect misalignments (past, present, continuous, perfect)
   - Preposition & Article mistakes (a/an/the, in/on/at)
   - Spelling mistakes (e.g. "sprituality" -> "spirituality", "experiance" -> "experience")
   - Capitalization, comma splices, run-on sentences, and missing terminal punctuation.

2. UNLIMITED VOCABULARY EXTRACTION:
   - Extract 3 to 6 notable, descriptive, or key vocabulary words used in the user's submission.
   - Provide the accurate, natural Hindi meaning and the exact CEFR level (A1, A2, B1, B2, C1, C2) for each extracted word.

3. UNCOMPROMISING CEFR SCORING (Scale 1-10):
   - If the sentence is broken, nonsensical, or full of multiple syntax/pronoun clashes, score it strictly between 1 and 3.
   - Deduct heavily for each major grammar flaw. A score of 8-10 is reserved ONLY for fluent, grammatically flawless writing.

4. ACCURATE VERB COUNT:
   - Accurately count the number of past, present, and future tense verbs found in the submission.

Respond STRICTLY with a valid JSON object matching this schema (NO markdown formatting or backticks around JSON):
{
  "score": <integer 1 to 10>,
  "wordCount": ${wordCountCalculated},
  "tensesUsed": {
    "past": <count of past verbs>,
    "present": <count of present verbs>,
    "future": <count of future verbs>
  },
  "vocabularyUsed": [
    {
      "word": "<word from user text>",
      "meaning": "<concise natural Hindi meaning>",
      "cefrLevel": "<A1|A2|B1|B2|C1|C2>"
    }
  ],
  "grammarCorrections": [
    {
      "original": "<exact wrong word/phrase from user text>",
      "correction": "<correct standard English alternative>",
      "reason": "<detailed rule explanation covering pronoun, verb, tense, determiner, or spelling>"
    }
  ],
  "feedback": "<2 clear sentences detailing syntactic and structural quality>",
  "fluencyAdvice": "<1 actionable fluency tip targeting the exact mistakes made>"
}`;

    // Target Gemini 1.5 Flash via REST API
    const response = await fetch(
      `[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$){encodeURIComponent(apiKey)}`,
      {
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || `Google API returned status ${response.status}`);
    }

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsedData = extractJson(aiText);

    if (!parsedData) {
      throw new Error('Could not parse Gemini JSON response');
    }

    return NextResponse.json({
      ...parsedData,
      wordCount: wordCountCalculated
    });

  } catch (error: any) {
    console.error('Gemini 1.5 Flash Error:', error);
    return NextResponse.json({
      score: 1,
      wordCount: wordCountCalculated,
      tensesUsed: { past: 0, present: 0, future: 0 },
      vocabularyUsed: [],
      grammarCorrections: [
        {
          original: 'AI Analysis Error',
          correction: 'Verify API Connection',
          reason: error?.message || 'Failed to communicate with Gemini 1.5 Flash.'
        }
      ],
      feedback: 'Failed to process AI evaluation.',
      fluencyAdvice: 'Check API Key status and redeploy.'
    });
  }
}
