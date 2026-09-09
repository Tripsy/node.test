/**
 * Prints the stored `path` of every image row in a section, one per line.
 *
 * The bytes of an image live in the frontend project (`IMAGE_SAVE_PATH` is a `nready-ui`
 * setting), so a tool over there has to be able to ask this database what files it is
 * expected to hold — `nready-ui/.claude/scripts/fetch-seed-images.sh` is the caller.
 *
 * Usage: npx tsx cli/list-image-paths.ts [section]   (default: article)
 */
import dataSource from '@/config/data-source.config';
import ImageEntity, {
	type ImageSection,
	ImageSectionEnum,
} from '@/features/image/image.entity';

const requested = process.argv[2] ?? ImageSectionEnum.ARTICLE;

const sections = Object.values(ImageSectionEnum) as string[];

if (!sections.includes(requested)) {
	console.error(
		`Unknown section "${requested}". Available: ${sections.join(', ')}`,
	);
	process.exit(1);
}

await dataSource.initialize();

try {
	const rows = await dataSource.getRepository(ImageEntity).find({
		select: { path: true },
		where: { section: requested as ImageSection },
		order: { entity_id: 'ASC', sort_order: 'ASC' },
	});

	// stdout only, one path per line: the caller reads this with `while read`.
	for (const row of rows) {
		console.log(row.path);
	}
} finally {
	await dataSource.destroy();
}

/*
 * Explicit, the way `seed.runner.ts` and the seed index end: closing the data source is not
 * enough to end the process, because importing the entity graph opens handles this tool never
 * asked for and only `server.ts` closes (the Redis client among them). Without this the paths
 * are printed and the process then hangs - and the caller,
 * `nready-ui/.claude/scripts/fetch-seed-images.sh`, reads them through a command substitution,
 * which waits for EOF and so waits forever.
 */
process.exit(0);
