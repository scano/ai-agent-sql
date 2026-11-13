# Agent SQL

Asistente de línea de comandos que traduce preguntas en español a consultas MySQL con Ollama. El agente lee el esquema visible para su cuenta de MySQL, genera un `SELECT` y usa los resultados para redactar una respuesta.

## Requisitos

- Node.js y npm.
- Una base de datos MySQL y una cuenta dedicada con permisos de lectura sobre las tablas o vistas autorizadas.
- Ollama en ejecución con el modelo configurado.

## Instalación

```bash
npm ci
cp .env.example .env
ollama pull qwen2.5-coder:1.5b
```

Completa los valores `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` en `.env`. Si usas otro modelo o servidor, ajusta `OLLAMA_MODEL` y `OLLAMA_BASE_URL`. La URL debe incluir el prefijo `/v1` de la API compatible con OpenAI.

## Uso

Ejecuta `npm start` para abrir una sesión. Escribe una pregunta y pulsa Enter. El aviso vuelve a aparecer después de cada respuesta. Cada pregunta se procesa de forma independiente. Escribe `salir` o pulsa Ctrl+D para cerrar la sesión.

```text
Escribe tu pregunta (o «salir»): ¿Cuántos contratos hay?
```

También puedes pasar la pregunta como argumento.

```bash
npm start -- "¿Cuántos contratos hay?"
```

Adapta la pregunta al esquema de tu base de datos. La respuesta depende de la consulta generada y de los datos que MySQL devuelva.

El esquema se lee una vez al abrir la sesión. Si cambias tablas o columnas, reinicia la sesión para cargar el esquema actualizado.

## Desarrollo y verificación

El código fuente está en `src/`. `npm run build` compila TypeScript en `dist/`. Los comandos `npm start` y `npm run test:model` compilan antes de ejecutar.

```bash
npm run check
npm run test:model
```

El primer comando comprueba los tipos de TypeScript. El segundo comprueba que Ollama responde con la configuración del proyecto. Para verificar también MySQL y la generación de SQL, ejecuta el ejemplo de uso sobre una base de pruebas.

## Acceso a los datos

La ejecución exige que la consulta empiece por `SELECT` y usa una transacción de solo lectura. Limita los permisos de la cuenta MySQL a las vistas o tablas que el asistente pueda consultar. El endpoint configurado para Ollama recibe tanto el esquema como las filas devueltas, por lo que debe estar autorizado para procesar esos datos.

El archivo `.env` está excluido de Git. Usa `.env.example` como plantilla para compartir la configuración.
