class HTemplate extends HTMLElement {
    #init(target: HTMLElement) {
        target.innerHTML = "";
        target.append(...this.childNodes);
        new MutationObserver(records => {
            if (!this.isConnected)
                return;
            for (const record of records) {
                target.append(...record.addedNodes);
            }
        }).observe(this, {childList: true});
    }
    connectedCallback() {
        if (!this.hasAttribute("for"))
            return;
        const for_value = this.getAttribute("for")!;
        const target = document.getElementById(for_value);
        if (target) {
            this.#init(target);
        } else {
            const observer = new MutationObserver(() => {
                const new_target = document.getElementById(for_value);
                if (new_target) {
                    this.#init(new_target);
                    observer.disconnect();
                }
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    }
};

export function initHTemplate() {
    if (!customElements.get("h-template"))
        customElements.define("h-template", HTemplate);
}