import { getDatabaseSchema, executeQuery } from './database.js';
import { modelName, openai } from './model.js';

export async function askCompanyBrain(userQuestion: string, schema?: string) {
    const dbSchema = schema ?? await getDatabaseSchema();

    const systemPrompt = `
Eres un asistente experto en bases de datos MySQL para una empresa.
Tu objetivo es traducir las preguntas en lenguaje natural de los empleados a consultas SQL válidas y seguras (SOLO SELECT).

Aquí tienes el esquema actual de la base de datos:
${dbSchema}

Reglas estrictas:
- Devuelve ÚNICAMENTE un objeto JSON válido con la estructura: {"sql": "SELECT ..."}
- No incluyas explicaciones de texto adicionales fuera del JSON.
- Utiliza JOINs cuando la información esté repartida entre clientes, facturas y contratos.
- Respeta los tipos de datos y los nombres exactos de las tablas y columnas.
`;

    const completion = await openai.chat.completions.create({
        model: modelName,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuestion }
        ],
        temperature: 0
    });

    const content = completion.choices[0]?.message.content;
    if (!content?.trim()) throw new Error('El modelo devolvió una respuesta vacía.');

    let response: unknown;
    try {
        response = JSON.parse(content);
    } catch {
        throw new Error('El modelo no devolvió un objeto JSON válido.');
    }
    if (
        typeof response !== 'object' || response === null ||
        !('sql' in response) || typeof response.sql !== 'string'
    ) {
        throw new Error('El modelo debe devolver un campo sql de tipo texto.');
    }
    const sqlQuery = response.sql;

    const rawData = await executeQuery(sqlQuery);

    const synthesisPrompt = `
El usuario preguntó: "${userQuestion}"
Los datos obtenidos de la base de datos MySQL son los siguientes:
${JSON.stringify(rawData, null, 2)}

Redacta una respuesta clara, profesional y conversacional en español basada exclusivamente en estos datos.
`;

    const finalAnswer = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: synthesisPrompt }],
        temperature: 0.3
    });

    const answer = finalAnswer.choices[0]?.message.content;
    if (!answer?.trim()) throw new Error('El modelo devolvió una respuesta vacía.');

    return {
        sql: sqlQuery,
        data: rawData,
        answer
    };
}
