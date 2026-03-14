// Timezone utility for Angola (Africa/Luanda, WAT UTC+1)
export const TIMEZONE = 'Africa/Luanda';
export const LOCALE = 'pt-AO';

// Get current date in Angola timezone as YYYY-MM-DD
export const getTodayAngola = (): string => {
    return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
};

// Get current time in Angola timezone as HH:MM
export const getCurrentTimeAngola = (): string => {
    return new Date().toLocaleTimeString('pt-AO', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

// Format a date string to Angola locale display
export const formatDateAngola = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    return date.toLocaleDateString('pt-AO', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Format date with weekday
export const formatDateFullAngola = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    return date.toLocaleDateString('pt-AO', {
        timeZone: TIMEZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// Format date short (DD/MM/YYYY)
export const formatDateShortAngola = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    return date.toLocaleDateString('pt-AO', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Format timestamp to Angola locale
export const formatTimestampAngola = (timestamp: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-AO', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Get Angola's current Date object (helpful for comparisons)
export const nowAngola = (): Date => {
    const now = new Date();
    return now;
};
