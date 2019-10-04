import uuid from '../../src/shared/UUID';

describe('UUID', () => {
    it('uuid - 1', () => {
        let id = uuid();
        expect(id.length).toEqual(8);
    });

    it('uuid - 2', () => {
        let id = uuid(16);
        expect(id.length).toEqual(16);
    });

    it('uuid - 3', () => {
        let id = uuid();

        for (let i = 0; i < 50; i++) {
            const current = uuid();
            expect(current).not.toEqual(id);
            id = current;
        }
    });
});