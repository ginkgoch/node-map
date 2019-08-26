describe('Ids', () => {
    it('readInt', () => {
        const buff = Buffer.alloc(4);
        buff.writeInt32LE(3987, 0);

        const i1 = buff[0] + buff[1] * 256 + buff[2] * 256 * 256 + buff[3] * 256 * 256 * 256;
        const i2 = buff.readInt32LE(0);
        expect(i2).toBe(i1);
    });
});