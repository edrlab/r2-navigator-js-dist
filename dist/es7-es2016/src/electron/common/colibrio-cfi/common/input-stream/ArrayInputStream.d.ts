import { IInputStream } from './IInputStream.js';
export declare class ArrayInputStream<T> implements IInputStream<T> {
    _arr: T[];
    private _nextPos;
    constructor(_arr: T[]);
    next(): T | undefined;
    peek(): T | undefined;
}
