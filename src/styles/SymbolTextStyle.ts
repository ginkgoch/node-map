import { TextStyle, Style } from ".";
import { Render, ICoordinate, LineString, Point } from "..";
import { Feature } from "ginkgoch-geom";
import { RenderUtils } from "../render";

export class SymbolTextStyle extends TextStyle {
    public symbol?: Style

    constructor(content?: string, fillStyle?: string, font?: string, name: string = 'Text Style') {
        super(content, fillStyle, font, name);
    }

    protected _drawTextOnCoordinate(render: Render, text: string, position: ICoordinate, style: any) {
        if (this.symbol) {
            let location = new Point(position.x, position.y);
            this.symbol.draw(new Feature(location), render);
        }

        render.drawText(text, position, style);
    }

    protected _drawTextOnLine(render: Render, text: string, line: LineString, style: any) {
        let position = this._getIconPositionOnLine(line);
        if (position === undefined) {
            return;
        }

        let screenPosition = render._toViewport(position);
        let textBound = render._textBound(text, screenPosition);
        if (textBound === undefined) {
            return;
        }

        if (this.symbol) {
            this.symbol.draw(new Feature(new Point(position.x, position.y)), render);
        }

        render.drawText(text, position, style);
    }

    private _getIconPositionOnLine(line: LineString): ICoordinate|undefined {
        let coordinates = line.coordinatesFlat();
        let maxSegmentLength = 0;
        let iconPosition = undefined;
        
        for (let i = 1; i < coordinates.length; i++) {
            let p1 = coordinates[i - 1];
            let p2 = coordinates[i];
            let distance = RenderUtils.distance(p1, p2);
            if (distance > maxSegmentLength) {
                maxSegmentLength = distance;
                iconPosition = { x: (p1.x + p2.x) * .5, y: (p1.y + p2.y) * .5 };
            }
        }

        return iconPosition;
    }
}