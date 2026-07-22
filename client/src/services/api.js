import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
});

export async function generateQuiz({ topic, difficulty, totalQuestion }) {
    const { data } = await apiClient.post('/generate-quiz', {
        topic,
        difficulty,
        totalQuestion,
    });
    return data;
}

export function getApiErrorMessage(error) {
    return error.response?.data?.error || error.message || 'Terjadi kesalahan tak terduga.';
}

export default apiClient;
