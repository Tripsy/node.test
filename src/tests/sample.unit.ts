describe('String includes() test', () => {
    it('should handle includes correctly', () => {
        const key = 'namespace.key';
        expect(key.includes('key')).toBe(true); // Basic test case
    });
});
