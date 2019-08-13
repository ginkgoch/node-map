import { IconStyle } from "..";
import { Feature, Point } from "ginkgoch-geom";
import { Render, Image } from "..";
import TestUtils from "../shared/TestUtils";

const compareImage = TestUtils.compareImageFunc(TestUtils.resolveStyleDataPath);

describe('IconStyle', () => {
    it('draw - 1', () => {
        const style = new IconStyle(new Image('./tests/data/location.png'));
        const canvas = Render.create(128, 128);
        const feature = new Feature(new Point(0, 0));
        style.draw(feature, canvas);
        canvas.flush();

        compareImage(canvas.image, 'icon-default.png');
    });
});