import nunjucks from 'nunjucks';
import { cfg } from '@/config/settings.config';
import { buildSrcPath } from '@/lib/helpers';

// Create a new environment
const templates = new nunjucks.Environment(
	new nunjucks.FileSystemLoader(buildSrcPath('templates')),
	{
		autoescape: true,
		throwOnUndefined: true,
		trimBlocks: true,
		noCache: cfg('app.debug') === 'true',
		watch: true,
	},
);

// Add global variables
templates.addGlobal('siteName', cfg('frontend.name'));
templates.addGlobal('siteUrl', cfg('frontend.url'));
templates.addGlobal('supportEmail', cfg('app.email'));
templates.addGlobal('currentYear', new Date().getFullYear().toString());

// // Add custom filter
// templates.addFilter('shorten', function (str: string, count: number = 5) {
//     return str.slice(0, count);
// });

export default templates;
