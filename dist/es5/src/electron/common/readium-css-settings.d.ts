export interface IReadiumCSS {
    paged: boolean | undefined;
    colCount: colCountEnum | undefined;
    textAlign: textAlignEnum | undefined;
    lineHeight: string | undefined;
    letterSpacing: string | undefined;
    wordSpacing: string | undefined;
    pageMargins: string | undefined;
    paraIndent: string | undefined;
    paraSpacing: string | undefined;
    bodyHyphens: bodyHyphensEnum | undefined;
    backgroundColor: string | undefined;
    textColor: string | undefined;
    ligatures: ligaturesEnum | undefined;
    font: fontEnum | string | undefined;
    fontSize: string | undefined;
    typeScale: string | undefined;
    darken: boolean | undefined;
    invert: boolean | undefined;
    night: boolean | undefined;
    sepia: boolean | undefined;
    a11yNormalize: boolean | undefined;
    noFootnotes: boolean | undefined;
    mathJax: boolean | undefined;
    reduceMotion: boolean | undefined;
}
export declare enum bodyHyphensEnum {
    auto = "auto",
    none = "none"
}
export declare enum colCountEnum {
    auto = "auto",
    one = "1",
    two = "2"
}
export declare enum ligaturesEnum {
    none = "none",
    common_ligatures = "common-ligatures"
}
export declare enum textAlignEnum {
    left = "left",
    right = "right",
    justify = "justify",
    start = "start"
}
export declare enum fontEnum {
    DEFAULT = "DEFAULT",
    DUO = "DUO",
    DYS = "DYS",
    OLD = "OLD",
    MODERN = "MODERN",
    SANS = "SANS",
    HUMAN = "HUMAN",
    MONO = "MONO",
    JA = "JA",
    JA_SANS = "JA-SANS",
    JA_V = "JA-V",
    JA_V_SANS = "JA-V-SANS"
}
export declare const readiumCSSDefaults: {
    a11yNormalize: boolean;
    backgroundColor: undefined;
    bodyHyphens: bodyHyphensEnum;
    colCount: colCountEnum;
    darken: boolean;
    font: fontEnum;
    fontSize: string;
    invert: boolean;
    letterSpacing: undefined;
    ligatures: ligaturesEnum;
    lineHeight: undefined;
    night: boolean;
    noFootnotes: boolean;
    mathJax: boolean;
    pageMargins: undefined;
    paged: boolean;
    paraIndent: undefined;
    paraSpacing: undefined;
    reduceMotion: boolean;
    sepia: boolean;
    textAlign: textAlignEnum;
    textColor: undefined;
    typeScale: undefined;
    wordSpacing: undefined;
};
export declare const READIUM_CSS_URL_PATH = "readium-css";
