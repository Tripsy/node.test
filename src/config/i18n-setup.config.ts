import {settings} from './settings.config';
import i18n from 'i18n';
import {buildSrcPath} from '../helpers/system';

i18n.configure({
    locales: settings.app.supportedLanguages, // List of supported locales
    directory: buildSrcPath('locales'), // Path to the locales directory
    defaultLocale: 'en', // Default locale
    objectNotation: true, // Enable object notation for nested translations
    cookie: 'lang', // Name of the cookie to store the language preference
    queryParameter: 'lang', // Query parameter to switch locale (eg: /home?lang=ch)
    autoReload: settings.app.env === 'local',  // Watch for changes in JSON files to reload locale on updates - defaults to false
});

export const lang = (key: string, replacements: Record<string, string> = {}): string => {
    return i18n.__(key, replacements);
};

export default i18n;
