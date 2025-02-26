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