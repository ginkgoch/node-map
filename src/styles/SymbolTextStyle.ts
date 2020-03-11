import { TextStyle, Style } from ".";
import { Render, ICoordinate, LineString, Point } from "..";
import { Feature } from "ginkgoch-geom";

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
        let location = render.getTextPositionOnLine(text, line, style);
        if (location === undefined) {
            return;
        }

        let { position } = location;
        if (this.symbol) {
            this.symbol.draw(new Feature(new Point(position.x, position.y)), render);
        }

        render.drawText(text, position, style);
    }
}