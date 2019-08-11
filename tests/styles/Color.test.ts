import { Colors, ColorFormat } from "../../src/styles";

describe('Colors', () => {
    it('randomColor - 1', () => {
        for (let i = 0; i < 10; i++) {
            let color = Colors.random();
            expect(color).toMatch(/^#\w{6}$/);
            expect(color.length).toBe(7);
        }
    });

    it('randomColor - 2', () => {
        for (let i = 0; i < 10; i++) {
            let color = Colors.random({
                alpha: 0.5,
                format: ColorFormat.rgba
            });
            expect(color).toMatch(/^rgba\(/);
        }
    });

    it('randomColor - 3', () => {
        for (let i = 0; i < 10; i++) {
            let color = Colors.randomHex();
            expect(color).toMatch(/^#\w{6}$/);
            expect(color.length).toBe(7);
        }
    });
});