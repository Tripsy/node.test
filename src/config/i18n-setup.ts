import 'dotenv/config';
import i18n from 'i18n';
import {buildSrcPath} from '../helpers/system';

i18n.configure({
    locales: ['en'], // List of supported locales
    directory: buildSrcPath('locales'), // Path to the locales directory
    defaultLocale: 'en', // Default locale
    objectNotation: true, // Enable object notation for nested translations
    cookie: 'lang', // Name of the cookie to store the language preference
    queryParameter: 'lang', // Query parameter to switch locale (ie. /home?lang=ch)
    autoReload: process.env.APP_ENV === 'local',  // Watch for changes in JSON files to reload locale on updates - defaults to false
});

export default i18n;
