export declare interface IInputStream<T> {
    next(): T | undefined;
    peek(): T | undefined;
}
