import { normalizeCurrency } from '@/helpers/shop.helper';
import { getErrorMessage } from '@/helpers/system.helper';
import { getSystemLogger } from '@/providers/logger.provider';

/**
 * The daily reference bulletin. It always holds one `Cube` - the most recent working day - so a
 * run on a weekend or a holiday re-reads the last one published rather than finding nothing. The
 * ten-day and per-year files (`curs.bnr.ro/nbrfxrates10days.xml`,
 * `curs.bnr.ro/files/xml/years/nbrfxrates<year>.xml`) have the same shape and are what a backfill
 * would read; nothing here uses them yet.
 *
 * The host matters: the same paths under `www.bnr.ro` answer a redirect to the site's homepage,
 * which parses as a document with no `Cube` and fails the run.
 */
export const BNR_RATES_URL = 'https://curs.bnr.ro/nbrfxrates.xml';

/** Enough for a 3 KB document; a bulletin that has not answered by then is next run's problem. */
const REQUEST_TIMEOUT = 10000;

/** The name stored in `exchange_rate.provider` for everything this client brings in. */
export const BNR_PROVIDER = 'bnr.ro';

export type BnrBulletin = {
	/** The day the rates are *for*, not the day they were fetched. */
	rate_date: string;
	/** What every rate is expressed in - BNR's `OrigCurrency`, which is RON. */
	base_currency: string;
	/**
	 * Currency code → units of `base_currency` for **one** unit of it, with BNR's `multiplier`
	 * already divided out.
	 */
	rates: Record<string, number>;
};

/*
 * Read with regular expressions rather than an XML parser, and deliberately so: the project
 * ships no XML dependency, the document is machine-generated against a fixed schema, and only
 * three things are read out of it. Every value taken is validated
 * before it is used, so a shape change surfaces as a thrown error on the next run instead of a
 * wrong rate - which is the failure mode that actually matters here.
 */
const CUBE_DATE = /<Cube\s+date="(\d{4}-\d{2}-\d{2})"/;
const ORIG_CURRENCY = /<OrigCurrency>\s*([A-Za-z]{3})\s*<\/OrigCurrency>/;
const RATE_ENTRY = /<Rate\b([^>]*)>([^<]*)<\/Rate>/g;
const RATE_CURRENCY = /currency="([A-Za-z]{3})"/;
const RATE_MULTIPLIER = /multiplier="(\d+)"/;

/** `rate` is `decimal(14, 8)`; a divided multiplier can run longer than the column holds. */
const RATE_DECIMALS = 8;

export async function fetchBnrBulletin(): Promise<BnrBulletin> {
	return parseBnrBulletin(await requestBulletin());
}

/**
 * Separate from the fetch so the shape can be exercised without the network, and so a backfill
 * reading the ten-day or per-year file - same schema, several `Cube` elements - has something to
 * build on. This one reads the first `Cube` it finds, which for the daily bulletin is the only.
 */
export function parseBnrBulletin(document: string): BnrBulletin {
	const cubeDate = CUBE_DATE.exec(document)?.[1];

	if (!cubeDate) {
		throw new Error('BNR bulletin carries no Cube date');
	}

	const origCurrency = ORIG_CURRENCY.exec(document)?.[1];

	if (!origCurrency) {
		throw new Error('BNR bulletin carries no OrigCurrency');
	}

	const rates = parseRates(document);

	if (Object.keys(rates).length === 0) {
		throw new Error(`BNR bulletin for ${cubeDate} carries no usable rate`);
	}

	return {
		rate_date: cubeDate,
		base_currency: normalizeCurrency(origCurrency),
		rates,
	};
}

async function requestBulletin(): Promise<string> {
	let response: Response;

	try {
		response = await fetch(BNR_RATES_URL, {
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
			headers: { accept: 'application/xml,text/xml' },
			// The bulletin is served through a CDN that answers 304 to a conditional request;
			// the run needs the body every time, not a cache validation
			cache: 'no-store',
		});
	} catch (error) {
		getSystemLogger().error(
			{ err: error, url: BNR_RATES_URL },
			`BNR request failed: ${getErrorMessage(error)}`,
		);

		throw new Error(`BNR is unreachable: ${getErrorMessage(error)}`);
	}

	if (!response.ok) {
		throw new Error(`BNR answered ${response.status} for ${BNR_RATES_URL}`);
	}

	return response.text();
}

/**
 * A `Rate` with no value is a currency BNR did not quote that day. It is dropped rather than
 * stored as zero, and the caller reports it missing if it was one of the ones asked for.
 */
function parseRates(document: string): Record<string, number> {
	const rates: Record<string, number> = {};

	for (const [, attributes, value] of document.matchAll(RATE_ENTRY)) {
		const currency = RATE_CURRENCY.exec(attributes)?.[1];

		if (!currency) {
			continue;
		}

		const quoted = Number(value.trim());

		if (!Number.isFinite(quoted) || quoted <= 0) {
			continue;
		}

		// `multiplier="100"` means the figure is for a hundred units - weak currencies are
		// quoted that way, and storing it undivided would overstate the rate a hundredfold
		const multiplier = Number(RATE_MULTIPLIER.exec(attributes)?.[1] ?? 1);

		if (!Number.isFinite(multiplier) || multiplier <= 0) {
			continue;
		}

		rates[normalizeCurrency(currency)] = Number(
			(quoted / multiplier).toFixed(RATE_DECIMALS),
		);
	}

	return rates;
}
