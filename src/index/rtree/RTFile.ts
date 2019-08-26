import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { NotImplementedError } from "./RTUtils";

export class RTFile {
    isFloat: boolean = false;
    pageSize: number = 0;

    fileStream(): FileStream {
        throw new NotImplementedError();
    }
}