import _ from "lodash";
import { PointStyle } from "..";
import { Render } from '..';
import { Feature, Point } from "ginkgoch-geom";
import TestUtils from "../shared/TestUtils";

const compareImage = TestUtils.compareImageFunc(TestUtils.resolveStyleDataPath);

describe('Style', () => {
    it('props', () => {
        const pointStyle = new PointStyle();
        const raw = pointStyle.props();
        expect(Object.keys(raw).length).toBe(5);
    });

    it('PointStyle', () => {
        const style = new PointStyle('#ffffff', 'yellow', 6, 20, 'default');
        const canvas = Render.create(64, 64);
        style.draw(new Feature(new Point(0, 0)), canvas);
        canvas.flush();

        compareImage(canvas.image, 'point-default.png');
    });
});