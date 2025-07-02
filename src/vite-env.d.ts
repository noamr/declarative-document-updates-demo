/// <reference types="vite/client" />
/// <reference types="dom-navigation" />

declare class URLPattern {
    constructor(string, URL?);
    test(string): boolean;
}