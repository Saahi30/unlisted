import { useAppStore } from '@/lib/store';
import en from './translations/en.json';
import hi from './translations/hi.json';

const translations: Record<string, Record<string, any>> = { en, hi };

function getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((acc, key) => acc?.[key], obj) || path;
}

export function useTranslation() {
    const language = useAppStore(state => state.language);
    const lang = language || 'en';

    const t = (key: string): string => {
        return getNestedValue(translations[lang], key) || getNestedValue(translations.en, key) || key;
    };

    return { t, language: lang };
}
