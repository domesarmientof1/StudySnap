import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const isProduction =
  process.env.NODE_ENV === 'production' ||
  fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));

const portEnv = Number(process.env.PORT);
const PORT = isProduction ? (portEnv || 8080) : (portEnv === 8080 ? 3000 : (portEnv || 3000));

// Body parser with 25MB limit to allow high-resolution smartphone camera photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI SDK with required user-agent header
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not set. Gemini API calls will fail.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: Boolean(apiKey) });
});

// Endpoint to analyze study notes from photo
app.post('/api/analyze-notes', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', language = 'en', projectContext } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured on the server. Please check Settings > Secrets.',
      });
    }

    // Clean base64 string if it contains data URI prefix
    let base64Data = image;
    let resolvedMimeType = mimeType;
    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        resolvedMimeType = matches[1];
        base64Data = matches[2];
      } else {
        base64Data = image.replace(/^data:[^;]+;base64,/, '');
      }
    }

    const isSpanish = language === 'es';
    const languageInstruction = isSpanish
      ? 'IMPORTANT: All output text (title, subject, readabilityAssessment, summary, keyTopics, questions, hints, and answers) MUST be written in SPANISH (Español).'
      : 'IMPORTANT: All output text (title, subject, readabilityAssessment, summary, keyTopics, questions, hints, and answers) MUST be written in ENGLISH.';

    const projectInstruction = projectContext
      ? `\nProject / Subject Context: This note is filed under the project "${projectContext}". Tailor the academic focus, terminology, and study questions to align with this class or assignment.`
      : '';

    const systemInstruction = `You are StudySnap, an expert academic tutor and study assistant.
Your job is to examine photographs of study notes, textbooks, flashcards, diagrams, or whiteboards submitted by students on their mobile phones.

Analyze the visual content thoroughly:
1. Assess whether the image contains legible study notes or educational text. If the image is completely pitch black, totally blurry, illegible, or completely unrelated to any notes/study material (e.g., a photo of a shoe or wall with zero text), set isStudyNotes to false and give friendly, constructive advice in readabilityAssessment explaining what went wrong and how to take a clearer shot.
2. If it is readable notes (handwritten, printed, diagrams, bullet points, formulas, or slides):
   - Set isStudyNotes to true.
   - Extract the core concepts, main ideas, definitions, and relationships.
   - Provide a concise title and subject category.
   - Provide 3 to 5 key topics.
   - Provide a clear, high-yield study summary that captures the essence of the notes (2-4 paragraphs).
   - Generate EXACTLY 5 study questions designed to test comprehension, recall, and application of the material.
   - For each of the 5 questions, provide:
     * id: 1 to 5
     * question: Clear, engaging question
     * hint: A helpful clue or prompt to jog memory without giving away the whole answer
     * answer: A complete, accurate explanation of the correct answer
${projectInstruction}
${languageInstruction}`;

    const promptText = isSpanish
      ? 'Por favor analiza esta fotografía de notas de estudio. Si el texto o contenido es legible, genera el título, tema, resumen claro y exactamente 5 preguntas de estudio con pistas y respuestas revelables. Si la imagen no es legible o no contiene notas, indica isStudyNotes = false y explica la razón.'
      : 'Please analyze this photo of study notes. If the text or content is legible, produce a concise title, subject category, key topics, a high-yield study summary, and exactly 5 study questions with hints and revealable answers. If the image is unreadable or not study notes, set isStudyNotes = false and explain why.';

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let response: any = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: resolvedMimeType,
                  data: base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isStudyNotes: {
                  type: Type.BOOLEAN,
                  description: 'Whether the image contains readable study notes or educational content.',
                },
                readabilityAssessment: {
                  type: Type.STRING,
                  description: 'Feedback on image quality, legibility, or advice if retake is needed.',
                },
                title: {
                  type: Type.STRING,
                  description: 'A suitable title for the notes.',
                },
                subject: {
                  type: Type.STRING,
                  description: 'Subject area, e.g., Biology, World History, Calculus, Literature, Chemistry, etc.',
                },
                keyTopics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 5 key topic tags covered in the notes.',
                },
                summary: {
                  type: Type.STRING,
                  description: 'A structured, high-yield summary of the notes.',
                },
                questions: {
                  type: Type.ARRAY,
                  description: 'Exactly 5 study questions with hints and revealable answers.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      question: { type: Type.STRING, description: 'The question testing understanding.' },
                      hint: { type: Type.STRING, description: 'A helpful hint before revealing the answer.' },
                      answer: { type: Type.STRING, description: 'The complete, accurate answer.' },
                    },
                    required: ['id', 'question', 'hint', 'answer'],
                  },
                },
              },
              required: ['isStudyNotes', 'title', 'summary', 'questions'],
            },
          },
        });

        if (response?.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
        lastError = err;
        // Brief delay before trying next model
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No response text received from Gemini models.');
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response text received from Gemini model.');
    }

    const parsedData = JSON.parse(responseText.trim());

    // Ensure questions array is bounded to 5 items if model returned more or less
    if (Array.isArray(parsedData.questions)) {
      parsedData.questions = parsedData.questions.slice(0, 5);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error analyzing study notes:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze study notes with Gemini.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudySnap server listening on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
