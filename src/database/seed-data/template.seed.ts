import dataSource from '../../config/data-source.config';
import TemplateRepository from '../../features/template/template.repository';
import { TemplateTypeEnum } from '../../features/template/template-type.enum';

const templateData = [
	{
		label: 'email-confirm-create',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Confirm your email',
			html: `
                <p>
                    Please confirm your email by clicking on the following  <a href="{{ siteUrl }}/account/email-confirm/{{ token }}">link</a>.
                </p>
            `,
			layout: 'layout-default',
		},
	},
	{
		label: 'email-confirm-update',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Confirm your email',
			html: `
                <p>
                    Please confirm your email by clicking on the following  <a href="{{ siteUrl }}/account/email-confirm/{{ token }}">link</a>.
                </p>
            `,
			layout: 'layout-default',
		},
	},
	{
		label: 'email-welcome',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Welcome',
			html: `
                <p>Hello {{ name }}</p>
            `,
			layout: 'layout-default',
		},
	},
	{
		label: 'password-recover',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Recover password',
			html: `
                <p>Hello {{ name }}. Click <a href="{{ siteUrl }}//account/password-recover-change/{{ ident }}">here</a> to recover your password. The link will expire at {{ expire_at }}.</p>
            `,
			layout: 'layout-default',
		},
	},
	{
		label: 'password-change',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Password changed',
			html: `
                <p>Hello {{ name }}. Your password has been changed.</p>
            `,
			layout: 'layout-default',
		},
	},
	{
		label: 'cron-error-count',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Cron error count',
			html: `
                <p>In the last 24 hours there have been {{ errorCount }} cron errors</p>
                <p>Sql Query: {{ querySql }}</p>
                <p>Sql Params: {{ queryParameters }}</p>
            `,
			layout: 'layout-default',
		},
	},
	{
		label: 'cron-warning-count',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Cron warning count',
			html: `
                <p>In the last 7 days there have been {{ warningCount }} cron warnings</p>
                <p>Sql Query: {{ querySql }}</p>
                <p>Sql Params: {{ queryParameters }}</p>
                <p>
                    <table width="100%" border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <th style="background-color: #2E8B57; color: #ffffff;">Label</th>
                            <th style="background-color: #2E8B57; color: #ffffff;">Occurrences</th>
                            <th style="background-color: #2E8B57; color: #ffffff;">Average Run Time</th>
                        </tr>                        
                        {% for warning in warnings %}
                            <tr>
                                <td>{{ warning.label }}</td>
                                <td>{{ warning.countOccurrences }}</td>
                                <td>{{ warning.avgRunTime }}</td>
                            </tr>
                        {% endfor %}
                    </table>
                </p>
            `,
			layout: 'layout-default',
		},
	},
	{
		label: 'cron-time-check',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Cron time check',
			html: `
                <p>Some cron run time overlapped in the last 24 hours</p>
                <p>Sql Query: {{ querySql }}</p>
                <p>Sql Params: {{ queryParameters }}</p>
                {% for key, row in results %}
                    <p><strong>{{ row.date }}</strong></p>
                    <table width="100%" border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
                        {% for entry in row.entries %}
                            <tr>
                                <td>{{ entry.id }}</td>
                                <td>{{ entry.label }}</td>
                            </tr>
                        {% endfor %}
                    </table>
                {% endfor %}
            `,
			layout: 'layout-default',
		},
	},
];

async function seedTemplates() {
	try {
		console.log('Initializing database connection...');
		await dataSource.initialize();

		console.log('Seeding templates...');
		await TemplateRepository.save(templateData);

		console.log('Templates seeded successfully ✅');
	} catch (error) {
		console.error('Error seeding templates:', error);
	} finally {
		await dataSource.destroy();
		console.log('Database connection closed.');
	}
}

(async () => {
	await seedTemplates();
})();
