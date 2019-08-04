import { PointStyle } from "../../src/styles/PointStyle";
import _ from "lodash";

describe('Style', () => {
    it('json', () => {
        const pointStyle = new PointStyle();
        const raw = pointStyle.json();
        expect(Object.keys(raw).length).toBe(5);
    });
});