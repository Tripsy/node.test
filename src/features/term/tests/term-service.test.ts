import { expect, jest } from '@jest/globals';
import type TermEntity from '@/features/term/term.entity';
import { TermTypeEnum } from '@/features/term/term.entity';
import {
	getTermEntityMock,
	termOutputPayloads,
} from '@/features/term/term.mock';
import type { TermQuery } from '@/features/term/term.repository';
import { TermService } from '@/features/term/term.service';
import type { TermValidator } from '@/features/term/term.validator';
import { TermContentRepository } from '@/features/term/term-content.repository';
import {
	createMockRepository,
	setupTransactionMock,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

describe('TermService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockTerm = createMockRepository<TermEntity, TermQuery>();

	const serviceTerm = new TermService(mockTerm.repository);

	it('should create entry inside transaction and save content', async () => {
		const entity = getTermEntityMock();
		const createData = termOutputPayloads.create;

		const { transaction } = setupTransactionMock(mockTerm.repository);

		// No existing term carries this wording
		mockTerm.query.first.mockResolvedValue(null);
		mockTerm.repository.save.mockResolvedValue(entity);

		const saveContent = jest
			.spyOn(TermContentRepository, 'saveContent')
			.mockResolvedValue(undefined);

		const result = await serviceTerm.create(createData);

		expect(transaction).toHaveBeenCalled();

		expect(mockTerm.repository.save).toHaveBeenCalledWith({
			type: createData.type,
		});

		/*
		 * Folded by the service, not by the validator: the schema cannot see the term's `type`,
		 * and only some types are folded. A tag is one of the folded ones - "Summer" and "summer"
		 * rendering as two tags is the defect the rule exists for.
		 */
		expect(saveContent).toHaveBeenCalledWith(
			expect.anything(),
			createData.contents.map((content) => ({
				...content,
				value: content.value.toLowerCase(),
			})),
			entity.id,
		);

		expect(result).toBe(entity);
	});

	/*
	 * The exempt types are the ones the customer reads: the question a bundle asks, an
	 * order-time question and its answers (`text`), and the heading a specification renders
	 * under (`attribute_label`). Folding those would put "choose your fries" on the storefront.
	 * Uniqueness is unaffected - `assertNotDuplicate` compares `LOWER()` either way.
	 */
	it.each([
		[TermTypeEnum.BUNDLE_CHOICE, 'Choose your fries'],
		[TermTypeEnum.TEXT, 'Extra cheese'],
		[TermTypeEnum.ATTRIBUTE_LABEL, 'Spice level'],
	])('keeps the case a %s term was written with', async (type, wording) => {
		const entity = getTermEntityMock();

		setupTransactionMock(mockTerm.repository);

		mockTerm.query.first.mockResolvedValue(null);
		mockTerm.repository.save.mockResolvedValue(entity);

		const saveContent = jest
			.spyOn(TermContentRepository, 'saveContent')
			.mockResolvedValue(undefined);

		await serviceTerm.create({
			...termOutputPayloads.create,
			type,
			contents: [{ language: 'en', value: wording }],
		} as never);

		expect(saveContent).toHaveBeenCalledWith(
			expect.anything(),
			[{ language: 'en', value: wording }],
			entity.id,
		);
	});

	it('should reject a term whose wording is already used by another term of the same type', async () => {
		setupTransactionMock(mockTerm.repository);

		mockTerm.query.first.mockResolvedValue(getTermEntityMock());

		await expect(
			serviceTerm.create(termOutputPayloads.create),
		).rejects.toMatchObject({ statusCode: 409 });

		expect(mockTerm.repository.save).not.toHaveBeenCalled();
	});

	it('should exclude the entry being updated from the duplicate check', async () => {
		const entity = getTermEntityMock();

		setupTransactionMock(mockTerm.repository);

		mockTerm.query.first.mockResolvedValue(null);
		mockTerm.repository.save.mockResolvedValue(entity);

		jest.spyOn(TermContentRepository, 'saveContent').mockResolvedValue(
			undefined,
		);

		await serviceTerm.updateDataWithContent(
			entity,
			termOutputPayloads.update,
		);

		expect(mockTerm.query.filterBy).toHaveBeenCalledWith(
			'term.id',
			entity.id,
			'!=',
		);
	});

	testServiceUpdate<TermEntity>(
		serviceTerm,
		mockTerm.repository,
		getTermEntityMock(),
	);

	testServiceDelete<TermEntity, TermQuery>(mockTerm.query, serviceTerm);
	testServiceRestore<TermEntity, TermQuery>(mockTerm.query, serviceTerm);
	testServiceFindById<TermEntity, TermQuery>(mockTerm.query, serviceTerm);

	testServiceFindByFilter<TermEntity, TermQuery, TermValidator>(
		mockTerm.query,
		serviceTerm,
		termOutputPayloads.find,
	);
});
