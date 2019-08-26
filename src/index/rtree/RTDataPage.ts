import { RTPage } from "./RTPage";
import { RTPageHeader } from "./RTPageHeader";
import { RTRecordSetHeader } from "./RTRecordSetHeader";
import { RTRecord } from "./RTRecord";

export class RTDataPage extends RTPage {
    header = new RTPageHeader();
    recordSetHeader = new RTRecordSetHeader();
    cursor = 1;

    public insertRecord(record: RTRecord) {

    }
}