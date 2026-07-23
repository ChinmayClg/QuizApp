// ===========================
// AI Service - Google Gemini Pro Integration
// ===========================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private fallbackModel: any = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.5-flash';
      this.logger.log(`🤖 Using Gemini model: ${modelName}`);
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      // Fallback model in case primary is overloaded
      const fallbackName = modelName === 'gemini-2.0-flash' ? 'gemini-2.0-flash-lite' : 'gemini-2.0-flash';
      this.fallbackModel = this.genAI.getGenerativeModel({ model: fallbackName });
      this.logger.log(`🔄 Fallback model: ${fallbackName}`);
      this.logger.log('✅ Gemini AI initialized');
    } else {
      this.logger.warn('⚠️ Gemini API key not configured - AI features will use mock responses');
    }
  }

  // Retry helper: tries primary model, then fallback on 503
  private async generateWithRetry(prompt: string, maxRetries = 1): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const modelToUse = attempt === 0 ? this.model : this.fallbackModel;
        if (attempt > 0) this.logger.log('🔄 Switching to fallback Gemini model...');
        const result = await modelToUse.generateContent(prompt);
        return result.response.text();
      } catch (error: any) {
        const is503 = error?.status === 503 || error?.message?.includes('503');
        if (is503 && attempt < maxRetries) {
          this.logger.warn(`⏳ Gemini model overloaded (503), trying fallback model...`);
          continue;
        }

        // If all Gemini attempts fail, try Groq
        if (attempt === maxRetries) {
          const groqKey = this.configService.get<string>('GROQ_API_KEY');
          if (groqKey) {
             this.logger.warn(`⚠️ Gemini failed, falling back to Groq API...`);
             return await this.generateWithGroq(prompt, groqKey);
          }
        }
        
        throw error;
      }
    }
    throw new Error('All retry attempts failed');
  }

  private async generateWithGroq(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Groq API returned ${response.status}: ${errText}`);
        throw new Error(`Groq API error: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      return data.choices[0].message.content;
    } catch (e) {
      this.logger.error('Groq API failed:', e);
      throw e;
    }
  }

  // ========== GRADE DESCRIPTIVE ANSWER ==========

  async gradeDescriptiveAnswer(params: {
    question: string;
    idealAnswer?: string;
    studentAnswer: string;
    maxMarks: number;
  }): Promise<{
    score: number;
    reasoning: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }> {
    if (!this.model) {
      return this.mockGradeDescriptive(params);
    }

    try {
      const prompt = params.idealAnswer
        ? `You are an academic grading assistant. Grade the following student answer.

Question: ${params.question}

Ideal/Reference Answer: ${params.idealAnswer}

Student's Answer: ${params.studentAnswer}

Maximum Marks: ${params.maxMarks}

Evaluate based on:
1. Meaning and conceptual accuracy
2. Key concepts/keywords covered
3. Completeness of the answer
4. Clarity of explanation

Respond in this exact JSON format:
{
  "score": <number between 0 and ${params.maxMarks}>,
  "reasoning": "<brief explanation of the grade>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<suggestion 1>"]
}`
        : `You are an academic grading assistant. Grade the following student answer. 
Generate a rubric first, then grade against it.

Question: ${params.question}

Student's Answer: ${params.studentAnswer}

Maximum Marks: ${params.maxMarks}

Respond in this exact JSON format:
{
  "score": <number between 0 and ${params.maxMarks}>,
  "reasoning": "<brief explanation including the rubric used>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<suggestion 1>"]
}`;

      const text = await this.generateWithRetry(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse AI response');
    } catch (error) {
      this.logger.error('Gemini grading error:', error);
      return this.mockGradeDescriptive(params);
    }
  }

  // ========== GENERATE QUESTIONS ==========

  async generateQuestions(params: {
    topic: string;
    subject: string;
    difficulty: string;
    count: number;
    types: string[];
  }): Promise<any[]> {
    if (!this.model) {
      return this.mockGenerateQuestions(params);
    }

    try {
      const prompt = `You are an expert quiz question generator for academic assessments.

Generate ${params.count} questions on the following:
- Subject: ${params.subject}
- Topic: ${params.topic}
- Difficulty: ${params.difficulty}
- Question Types needed: ${params.types.join(', ')}

For each question, provide this JSON structure in an array:
[
  {
    "type": "MCQ" | "TRUE_FALSE" | "FILL_BLANK" | "NUMERICAL" | "DESCRIPTIVE",
    "questionText": "The question text",
    "marks": <1-5>,
    "difficulty": "${params.difficulty}",
    "explanation": "Why the answer is correct",
    "options": [{"text": "option", "isCorrect": true/false}],  // for MCQ/TRUE_FALSE
    "acceptedAnswers": ["answer1", "answer2"],  // for FILL_BLANK
    "correctNumber": 0,  // for NUMERICAL
    "tolerance": 0,  // for NUMERICAL
    "idealAnswer": "Full answer text"  // for DESCRIPTIVE
  }
]

Return ONLY the JSON array, no other text.`;

      const text = await this.generateWithRetry(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse AI response');
    } catch (error) {
      this.logger.error('Gemini question generation error:', error);
      return this.mockGenerateQuestions(params);
    }
  }

  // ========== EXPLAIN WRONG ANSWER ==========

  async explainWrongAnswer(params: {
    question: string;
    correctAnswer: string;
    studentAnswer: string;
  }): Promise<string> {
    if (!this.model) {
      return `The correct answer is "${params.correctAnswer}". Your answer "${params.studentAnswer}" was incorrect. Review the topic for better understanding.`;
    }

    try {
      const prompt = `A student answered a question incorrectly. Explain why their answer is wrong and why the correct answer is right. Be helpful, encouraging, and educational.

Question: ${params.question}
Correct Answer: ${params.correctAnswer}
Student's Answer: ${params.studentAnswer}

Provide a clear, concise explanation (2-3 sentences).`;

      return await this.generateWithRetry(prompt);
    } catch (error) {
      this.logger.error('Gemini explanation error:', error);
      return `The correct answer is "${params.correctAnswer}". Review the concept for a better understanding.`;
    }
  }

  // ========== SUMMARIZE MISTAKES ==========

  async summarizeMistakes(params: {
    quizTitle: string;
    questionAnalytics: { questionText: string; correctPercentage: number; commonWrongAnswers: string[] }[];
  }): Promise<string> {
    if (!this.model) {
      const hardQuestions = params.questionAnalytics
        .filter((q) => q.correctPercentage < 50)
        .map((q) => q.questionText);
      return `In "${params.quizTitle}", ${hardQuestions.length} questions had less than 50% correct rate. Students struggled most with: ${hardQuestions.join('; ')}`;
    }

    try {
      const prompt = `Analyze the following quiz results and provide a brief summary for the teacher.

Quiz: ${params.quizTitle}

Question Performance:
${params.questionAnalytics.map((q) => `- "${q.questionText}" - ${q.correctPercentage}% correct. Common wrong answers: ${q.commonWrongAnswers.join(', ')}`).join('\n')}

Provide a 3-4 sentence summary highlighting:
1. Which topics students struggled with
2. Common misconceptions
3. Suggestions for revision`;

      return await this.generateWithRetry(prompt);
    } catch (error) {
      this.logger.error('Gemini summarize error:', error);
      return 'Unable to generate AI summary at this time.';
    }
  }

  // ========== EXTRACT TEXT FROM FILE ==========
  
  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    try {
      const mimeType = file.mimetype;
      const extension = file.originalname.split('.').pop()?.toLowerCase();

      if (mimeType === 'application/pdf' || extension === 'pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extension === 'docx'
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value;
      } else {
        throw new Error('Unsupported file format. Please upload PDF or DOCX.');
      }
    } catch (error: any) {
      this.logger.error('File extraction error:', error);
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
  }

  // ========== GENERATE QUESTIONS FROM TEXT ==========

  async generateQuestionsFromText(text: string, extractStrictly: boolean): Promise<any[]> {
    if (!this.model) {
      return this.mockGenerateQuestions({ topic: 'Document Parsing Mock', count: 3, types: ['MCQ', 'TRUE_FALSE'] });
    }

    try {
      // Clean up text slightly to save tokens
      const cleanedText = text.substring(0, 30000); // Limit to reasonable length

      const strictPrompt = `You are an intelligent document parser. I am providing you with a document that ALREADY contains quiz/test questions.
Your job is to read this document, identify all the questions, their options, and the correct answers (if present), and structure them into our specific JSON format. Do NOT invent new questions.

Text to parse:
"""
${cleanedText}
"""`;

      const inventPrompt = `You are an expert educational AI. I am providing you with reading material, notes, or a syllabus.
Your job is to thoroughly read this material and INVENT high-quality quiz questions that test the user's understanding of the key concepts found within the text.

Text to parse:
"""
${cleanedText}
"""`;

      const prompt = `
${extractStrictly ? strictPrompt : inventPrompt}

For each question, output this exact JSON structure in a JSON array. Return ONLY the JSON array, no markdown formatting or other text.
[
  {
    "type": "MCQ" | "TRUE_FALSE" | "FILL_BLANK" | "NUMERICAL" | "DESCRIPTIVE",
    "questionText": "The question text",
    "marks": 1,
    "options": [{"text": "option A", "isCorrect": true}, {"text": "option B", "isCorrect": false}],  // ONLY if MCQ or TRUE_FALSE
    "acceptedAnswers": ["answer 1", "answer 2"],  // ONLY if FILL_BLANK
    "idealAnswer": "Ideal descriptive answer" // ONLY if DESCRIPTIVE
  }
]
`;

      const maxRetries = 3;
      let lastError: any;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const resultText = await this.generateWithRetry(prompt);
          const jsonMatch = resultText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          throw new Error('Could not parse AI response');
        } catch (error: any) {
          lastError = error;
          // Retry on 429 rate limit errors
          if (error.status === 429 && attempt < maxRetries - 1) {
            const waitSeconds = Math.pow(2, attempt + 1) * 10; // 20s, 40s
            this.logger.warn(`Rate limited. Retrying in ${waitSeconds}s (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
            continue;
          }
          break;
        }
      }

      this.logger.error('Gemini document parse error:', lastError);
      if (lastError?.status === 429) {
        throw new Error('AI rate limit reached. Please wait a minute and try again.');
      }
      throw new Error('Failed to generate questions from document');
    } catch (error: any) {
      this.logger.error('Gemini document parse error:', error);
      if (error?.status === 429 || error?.message?.includes('rate limit')) {
        throw new Error('AI rate limit reached. Please wait a minute and try again.');
      }
      throw error;
    }
  }

  // ========== MOCK RESPONSES ==========

  private mockGradeDescriptive(params: { maxMarks: number; studentAnswer: string }) {
    const wordCount = params.studentAnswer.split(/\s+/).length;
    const ratio = Math.min(wordCount / 50, 1); // Rough scoring based on length
    const score = Math.round(params.maxMarks * ratio * 0.7 * 10) / 10;

    return {
      score: Math.min(score, params.maxMarks),
      reasoning: 'AI grading is not configured. This is a placeholder score based on answer length. Configure GEMINI_API_KEY for real AI grading.',
      strengths: ['Answer provided'],
      weaknesses: ['AI grading not available - manual review recommended'],
      suggestions: ['Configure Gemini API for intelligent grading'],
    };
  }

  private mockGenerateQuestions(params: { topic: string; count: number; types: string[] }) {
    const questions: any[] = [];
    for (let i = 0; i < Math.min(params.count, 5); i++) {
      questions.push({
        type: params.types[i % params.types.length] || 'MCQ',
        questionText: `Sample question ${i + 1} about ${params.topic}`,
        marks: 2,
        difficulty: 'MEDIUM',
        explanation: `This is a sample question. Configure GEMINI_API_KEY for AI-generated questions.`,
        options: [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B', isCorrect: false },
          { text: 'Option C', isCorrect: false },
          { text: 'Option D', isCorrect: false },
        ],
      });
    }
    return questions;
  }
}
