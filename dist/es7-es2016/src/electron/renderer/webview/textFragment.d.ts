import { TextFragment } from "../../common/selection";
export declare const convertTextFragmentToRanges: (textFragment: TextFragment, documant: Document) => Range[];
export declare const convertRangeToTextFragment: (range: Range) => TextFragment | undefined;
