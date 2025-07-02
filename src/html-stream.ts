type HTMLStreamOptions = {
    response: Response;
    selector?: string;
};

export class HTMLStream {
    #response: Response;
    #selector: string | null;
    constructor(init: Response| HTMLStreamOptions) {
        this.#response = (init instanceof Response) ? init : init.response;
        this.#selector = (init instanceof Response) ? null : (init.selector || null);
    }

    async streamTo(element: Element) {
        const reader = this.#response.body?.getReader();
        if (!reader)
            throw new DOMException("No reader for response body");
        const fake_doc = document.implementation.createHTMLDocument();

        // This is uggs but it's a temporary polyfill so...
        fake_doc.write("<body>");
        new MutationObserver(records => {
            for (const record of records) {
                for (const addedNode of record.addedNodes) {
                    if (!this.#selector || (addedNode.nodeType == Node.ELEMENT_NODE && (addedNode as HTMLElement).matches(this.#selector)))
                        element.appendChild(addedNode);
                }
            }
        }).observe(fake_doc.body, { childList: true, subtree: true });
        const decoder = new TextDecoder();
        while (true) {
            const {value, done} = await reader!.read();

            if (value) {
                fake_doc.write(decoder.decode(value!.buffer));
            }
            if (done)
                break;
        }
        fake_doc.close();
    }
};