import * as xmldom from "@xmldom/xmldom";
export declare function serializeDOM(documant: Document | xmldom.Document): string;
export declare function parseDOM(htmlStrToParse: string, mediaType: string | undefined): Document;
