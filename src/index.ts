import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { askCompanyBrain } from './sqlAgent.js';
import { closeDatabase, getDatabaseSchema } from './database.js';

async function printAnswer(question: string, schema?: string) {
    const { answer } = await askCompanyBrain(question, schema);
    console.log(answer);
}

async function runSession() {
    const schema = await getDatabaseSchema();
    const input = createInterface({
        input: stdin,
        output: stdout,
        prompt: 'Escribe tu pregunta (o «salir»): '
    });

    let closed = false;
    input.once('close', () => { closed = true; });

    try {
        if (stdin.isTTY) input.prompt();
        for await (const line of input) {
            const question = line.trim();
            if (question.toLowerCase() === 'salir') break;

            if (question) {
                try {
                    await printAnswer(question, schema);
                } catch (error) {
                    console.error('Error al procesar la consulta:', error instanceof Error ? error.message : String(error));
                }
            }

            if (stdin.isTTY && !closed) input.prompt();
        }
    } finally {
        input.close();
    }
}

try {
    const question = process.argv.slice(2).join(' ').trim();
    if (question) {
        await printAnswer(question);
    } else {
        await runSession();
    }
} catch (error) {
    console.error('Error al procesar la consulta:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
} finally {
    await closeDatabase();
}
