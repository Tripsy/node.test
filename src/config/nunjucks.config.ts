import nunjucks from 'nunjucks';
import {settings} from './settings.config';
import {buildSrcPath} from '../helpers/system.helper';
import {baseLink} from './init-routes.config';

// Create a new environment
const templates = new nunjucks.Environment(new nunjucks.FileSystemLoader(buildSrcPath('templates')), {
    autoescape: true,
    throwOnUndefined: true,
    trimBlocks: true,
    noCache: settings.app.debug,
    watch: true,
});

// Add global variables
templates.addGlobal('siteName', settings.app.name);
templates.addGlobal('siteLink', baseLink());
templates.addGlobal('supportEmail', settings.app.email);
templates.addGlobal('currentYear', new Date().getFullYear().toString());

// // Add custom filter
// templates.addFilter('shorten', function (str: string, count: number = 5) {
//     return str.slice(0, count);
// });

export default templates;