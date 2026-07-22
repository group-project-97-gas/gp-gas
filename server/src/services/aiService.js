const { GoogleGenAI } = require('@google/genai');

const MODEL_NAME = 'gemini-3.5-flash';
const QUESTIONS_TIMEOUT_MS = 20000; // scale dengan totalQuestion, soal makin banyak makin lama outputnya
const SUMMARY_TIMEOUT_MS = 10000;   // output selalu pendek (2-3 kalimat), tidak scale dengan jumlah pemain

const MAX_RETRIES = 1;       // total percobaan = 1 kali retry (2 attempt total)
const RETRY_DELAY_MS = 1000; // jeda sebelum retry, kasih waktu Gemini pulih kalau lagi overload

function getClient(timeoutMs) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY undefined, not set in development')
    }
    return new GoogleGenAI({
        apiKey,
        httpOptions: { timeout: timeoutMs }
    })
}

// Defense-in-depth: strip GEMINI_API_KEY out of any error text before it can
// reach a log line or a client response, in case an SDK/network error ever echoes it back.
function redactApiKey(message) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || typeof message !== 'string') {
        return message
    }
    return message.split(apiKey).join('[REDACTED]')
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Cuma retry untuk error yang sifatnya transient di sisi Gemini (server lagi
// overload/timeout internal) — bukan untuk error konfigurasi (API key salah,
// request invalid, dsb) yang pasti gagal lagi kalau diulang persis sama.
function isRetryableError(err) {
    const message = String(err?.message ?? '')
    return /DEADLINE_EXCEEDED|UNAVAILABLE|RESOURCE_EXHAUSTED|"code":\s*50[0-9]/.test(message)
}

async function generateContentWithRetry(ai, requestParams) {
    let lastError
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await ai.models.generateContent(requestParams)
        } catch (err) {
            lastError = err
            const isLastAttempt = attempt === MAX_RETRIES
            if (isLastAttempt || !isRetryableError(err)) {
                throw err
            }
            await sleep(RETRY_DELAY_MS)
        }
    }
    throw lastError
}

function extractJsonArrayText(rawText) {
    let cleaned = rawText.trim()

    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (fenceMatch) {
        cleaned = fenceMatch[1].trim()
    }

    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start === -1 || end === -1 || end < start) {
        throw new Error('Respons tidak mengandung array JSON')
    }

    return cleaned.slice(start, end + 1)
}

function validateQuestion(question, index) {
    if (!question || typeof question !== 'object') {
        throw new Error(`soal ke-${index + 1} bukan object`);
    }

    if (typeof question.question !== 'string' || !question.question.trim()) {
        throw new Error(`soal ke-${index + 1} tidak punya field "question" yang valid`);
    }

    if (
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        !question.options.every((option) => typeof option === 'string' && option.trim())
    ) {
        throw new Error(`soal ke-${index + 1} tidak punya field "options" yang valid`);
    }

    if (typeof question.answer !== 'string' || !question.options.includes(question.answer)) {
        throw new Error(`soal ke-${index + 1} punya "answer" yang tidak cocok dengan salah satu "options"`);
    }
}

async function generateQuestions(topic, difficulty, totalQuestion) {
    const ai = getClient(QUESTIONS_TIMEOUT_MS);

    const prompt = `Buatkan ${totalQuestion} soal kuis pilihan ganda berbahasa Indonesia dengan topik "${topic}" dan tingkat kesulitan "${difficulty}".

Balas HANYA dengan array JSON yang valid, tanpa markdown code fence, tanpa penjelasan atau teks lain di luar JSON. Setiap elemen array harus punya format persis seperti ini:
{"question": "...", "options": ["...", "...", "...", "..."], "answer": "..."}

Field "options" berisi tepat 4 pilihan jawaban berbentuk string. Field "answer" harus sama persis dengan salah satu isi "options".`;

    let rawText;
    try {
        const result = await generateContentWithRetry(ai, {
            model: MODEL_NAME,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingLevel: 'minimal' },
            },
        });
        rawText = result.text;
    } catch (err) {
        throw new Error(`gagal memanggil Gemini API untuk generate soal: ${redactApiKey(err.message)}`);
    }

    let parsed;
    try {
        const jsonText = extractJsonArrayText(rawText);
        parsed = JSON.parse(jsonText);
    } catch (err) {
        throw new Error(`gagal parse respons AI menjadi JSON: ${err.message}`);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('respons AI bukan array soal yang valid');
    }

    parsed.forEach(validateQuestion);

    return parsed.map((question) => ({
        question: question.question,
        options: question.options,
        answer: question.answer,
    }));
}

async function generateSummary(scores) {
    const ai = getClient(SUMMARY_TIMEOUT_MS);

    const prompt = `Berikut data skor akhir seluruh pemain dalam sebuah kuis, dalam format JSON:
${JSON.stringify(scores)}

Buat ringkasan performa seluruh pemain dalam 2-3 kalimat berbahasa Indonesia. Balas HANYA dengan teks ringkasan, tanpa markdown, tanpa tanda kutip di sekeliling teks, tanpa embel-embel lain.`;

    let rawText;
    try {
        const result = await generateContentWithRetry(ai, {
            model: MODEL_NAME,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingLevel: 'minimal' },
            },
        });
        rawText = result.text;
    } catch (err) {
        throw new Error(`gagal memanggil Gemini API untuk generate summary: ${redactApiKey(err.message)}`);
    }

    const summary = rawText.trim();
    if (!summary) {
        throw new Error('respons AI untuk summary kosong');
    }

    return summary;
}

module.exports = { generateQuestions, generateSummary }