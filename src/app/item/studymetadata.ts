import { Responseoption } from './responseoption';
import { ListViewResponses } from './listviewresponses';
//import { SegmentedBarItem } from "ui/segmented-bar";
export class Studymetadata {
  field_name: string;
  form_name: string;
  section_header: string;
  field_type: string;
  field_label: string;
  field_annotation: string;
  select_choices_or_calculations: string;
  select_choices: Responseoption[];
  select_labels: string[];
  //yesno: SegmentedBarItem[];
  select_responses: ListViewResponses[];
  answer:string;
  visibility:string;
}