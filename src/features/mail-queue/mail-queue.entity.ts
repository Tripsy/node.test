import type Mail from 'nodemailer/lib/mailer';
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import TemplateEntity from '@/features/template/template.entity';
import type { EmailContent } from '@/types/template.type';

export enum MailQueueStatusEnum {
	PENDING = 'pending',
	SENT = 'sent',
	ERROR = 'error',
}

@Entity({
	name: 'mail_queue',
	schema: 'system',
})
export default class MailQueueEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column({ type: 'bigint', unsigned: false, nullable: true })
	@Index('IDX_mail_queue_template_id', { unique: false })
	template_id?: number | null;

	@Column('char', { length: 2, nullable: false })
	language!: string;

	@Column({
		type: 'jsonb',
		nullable: false,
		comment: 'Email content: subject, text, html, vars, layout',
	})
	content!: EmailContent;

	@Column({ type: 'jsonb', nullable: false, comment: 'To: name & address' })
	to!: Mail.Address;

	@Column({ type: 'jsonb', nullable: true, comment: 'From: name & address' })
	from?: Mail.Address;

	@Column({
		type: 'enum',
		enum: MailQueueStatusEnum,
		default: MailQueueStatusEnum.PENDING,
		nullable: false,
	})
	@Index('IDX_mail_queue_status', { unique: false })
	status!: MailQueueStatusEnum;

	@Column('text', { nullable: true })
	error?: string | null;

	@Column({ type: 'timestamp', nullable: true })
	@Index('IDX_mail_queue_sent_at', { unique: false })
	sent_at!: Date | null;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@ManyToOne(() => TemplateEntity, {
		nullable: true,
		createForeignKeyConstraints: false,
		eager: false,
	})
	@JoinColumn({ name: 'template_id', referencedColumnName: 'id' })
	template?: TemplateEntity | null;
}
