import dataSource from '../config/data-source.config';
import TemplateRepository from '../repositories/template.repository';
import {TemplateTypeEnum} from '../enums/template-type.enum';

const templateData = [
    {
        label: 'email-confirm-create',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Confirm your email',
            text: 'Please confirm your email by clicking on the following link: {{link}}',
            html: '<p>Please confirm your email by clicking on the following link: {{link}}</p>'
        }
    },
    {
        label: 'email-confirm-update',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Confirm your email',
            text: 'Please confirm your email by clicking on the following link: {{link}}',
            html: '<p>Please confirm your email by clicking on the following link: {{link}}</p>'
        }
    },
    {
        label: 'email-welcome',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Welcome',
            text: 'Hello {{name}}',
            html: '<p>Hello {{name}}</p>'
        }
    },
    {
        label: 'password-recover',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Recover password',
            text: 'Hello {{name}}. Your recover ident is {{ident}} which will expire at {{expire_at}}. Mail sent in {{currentYear}}',
            html: '<p>Hello {{name}}. Your recover ident is {{ident}} which will expire at {{expire_at}}. Mail sent in {{currentYear}}</p>'
        }
    },
    {
        label: 'password-change',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Password changed',
            text: 'Hello {{name}}. Your password has been changed. Mail sent in {{currentYear}}',
            html: '<p>Hello {{name}}. Your password has been changed. Mail sent in {{currentYear}}</p>'
        }
    },
    {
        label: 'cron-error-count',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Cron error count',
            text: 'In the last 24 hours there have been {{errorCount}} cron errors',
            html: `
                <p>In the last 24 hours there have been {{errorCount}} cron errors</p>
                <p>Sql Query: {{querySql}}</p>
                <p>Sql Params: {{queryParameters}}</p>
            `
        }
    },
    {
        label: 'cron-warning-count',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Cron warning count',
            text: 'In the last 7 days there have been {{warningCount}} cron warnings',
            html: `
                <p>In the last 7 days there have been {{warningCount}} cron warnings</p>
                <p>Sql Query: {{querySql}}</p>
                <p>Sql Params: {{queryParameters}}</p>
                <p><table>
                    <tr>
                        <td>Label</td>
                        <td>Occurences</td>
                        <td>Average Run Time</td>
                    </tr>
                    {% for warning in warnings %}
                        <tr>
                            <td>{{warning.label}}</td>
                            <td>{{warning.countOccurrences}}</td>
                            <td>{{warning.avgRunTime}}</td>
                        </tr>
                    {% endfor %}
                </table></p>
            `
        }
    },
    {
        label: 'cron-time-check',
        language: 'en',
        type: TemplateTypeEnum.EMAIL,
        content: {
            subject: 'Cron time check',
            text: 'Some cron run time overlapped in the last 24 hours',
            html: `
                <p>Some cron run time overlapped in the last 24 hours</p>
                <p>Sql Query: {{ querySql }}</p>
                <p>Sql Params: {{ queryParameters }}</p>
                {% for key, row in results %}
                    <p><strong>{{ row.date }}</strong></p>
                    <table>
                        {% for entry in row.entries %}
                            <tr>
                                <td>{{ entry.id }}</td>
                                <td>{{ entry.label }}</td>
                            </tr>
                        {% endfor %}
                    </table>
                {% endfor %}
            `
        }
    }
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