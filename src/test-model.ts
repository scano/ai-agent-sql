import { modelName, openai } from './model.js';

try {
    const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: 'Responde con un saludo breve.' }],
        temperature: 0
    });

    const answer = completion.choices[0]?.message.content;
    if (!answer?.trim()) throw new Error('El modelo devolvió una respuesta vacía.');
    console.log(answer);
} catch (error) {
    console.error('Error al conectar con Ollama:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
