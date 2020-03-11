import { TextStyle, LineStyle, Render, Constants, SymbolTextStyle, PointStyle } from "..";
import { Feature, Point, LineString } from "ginkgoch-geom";
import TestUtils from "../shared/TestUtils";
import _ from "lodash";
import { IconStyle, Image } from "../../src";

const compareImage = TestUtils.compareImageFunc(TestUtils.resolveStyleDataPath);

describe('SymbolTextStyle tests', () => {
    it('draw - 1', () => {
        const style = new SymbolTextStyle('Hello World', '#ff0000');
        style.symbol = new PointStyle('yellow', 'black', 1, 20, 'circle');

        const canvas = Render.create(128, 128);
        const feature = new Feature(new Point(0, 0));
        style.draw(feature, canvas);
        canvas.flush();

        compareImage(canvas.image, 'symbol-text-1.png');
    });
    
    it('draw - 2', () => {
        const style = new SymbolTextStyle('85', '#ffffff');
        style.symbol = new IconStyle(new Image(TestUtils.resolveStyleDataPath('symbol.png')));

        const canvas = Render.create(128, 128);
        const feature = new Feature(new Point(0, 0));
        style.draw(feature, canvas);
        canvas.flush();

        compareImage(canvas.image, 'symbol-text-2.png', true);
    });
})
