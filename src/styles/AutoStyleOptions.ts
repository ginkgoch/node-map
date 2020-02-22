import { PointSymbolType } from ".";

export interface AutoStyleOptions {
    fromColor?: string; 
    toColor?: string; 
    strokeColor?: string;
    strokeWidth?: number;
    radius?: number; 
    symbol?: PointSymbolType;
}