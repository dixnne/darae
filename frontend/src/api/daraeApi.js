import { API_URL } from '../constants';

const fetchConfig = (token, method = 'GET', body = null) => {
    const config = {
        method,
        headers: {
        'Content-Type': 'application/json',
        }
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    return config;
};

export const daraeApi = {
    getVocabulary: async (token, lang) => {
        const res = await fetch(`${API_URL}/vocabulary/me/?language_code=${lang}`, fetchConfig(token));
        return res.json();
    },

    createVocabulary: async (token, data) => {
        const res = await fetch(`${API_URL}/vocabulary/`, fetchConfig(token, 'POST', data));
        return res.json();
    },

    getNotes: async (token) => {
        const res = await fetch(`${API_URL}/notes/`, fetchConfig(token));
        return res.json();
    },

    saveNote: async (token, noteData) => {
        const res = await fetch(`${API_URL}/notes/`, fetchConfig(token, 'POST', noteData));
        return res.json();
    }
};
