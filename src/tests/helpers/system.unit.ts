import { createRequest } from 'node-mocks-http';
import { getClientIp } from '@/helpers/system.helper';

describe('helpers/system.helper.ts - Unit Tests', () => {
	describe('getClientIp', () => {
		it('should return the first IP from x-forwarded-for header', () => {
			const mockRequest = createRequest({
				headers: {
					'x-forwarded-for': '192.168.1.1, 10.0.0.1',
				},
			});

			expect(getClientIp(mockRequest)).toBe('192.168.1.1');
		});

		it('should return the IP from x-forwarded-for header after trimming and removing IPv6 prefix', () => {
			const mockRequest = createRequest({
				headers: {
					'x-forwarded-for': ' ::ffff:192.168.1.1 , 10.0.0.1',
				},
			});

			expect(getClientIp(mockRequest)).toBe('192.168.1.1');
		});

		it('should return req.ip if x-forwarded-for header is missing', () => {
			const mockRequest = createRequest({
				ip: '192.168.1.1',
			});

			expect(getClientIp(mockRequest)).toBe('192.168.1.1');
		});

		it('should return req.ip if x-forwarded-for header is empty', () => {
			const mockRequest = createRequest({
				headers: {
					'x-forwarded-for': '',
				},
				ip: '192.168.1.1',
			});

			expect(getClientIp(mockRequest)).toBe('192.168.1.1');
		});

		it('should return req.ip if x-forwarded-for header is invalid', () => {
			const mockRequest = createRequest({
				headers: {
					'x-forwarded-for': 'invalid-ip',
				},
				ip: '192.168.1.1',
			});

			expect(getClientIp(mockRequest)).toBe('192.168.1.1');
		});

		it('should return "n/a" if both x-forwarded-for and req.ip are invalid', () => {
			const mockRequest = createRequest({
				headers: {
					'x-forwarded-for': 'invalid-ip',
				},
				ip: 'invalid-ip',
			});

			expect(getClientIp(mockRequest)).toBe('n/a');
		});
	});
});
