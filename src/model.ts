import 'dotenv/config';
import OpenAI from 'openai';

export const modelName = process.env.OLLAMA_MODEL || 'qwen2.5-coder:1.5b';

export const openai = new OpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    apiKey: 'ollama'
});
