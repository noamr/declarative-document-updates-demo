import { HTMLStream } from "./html-stream";
import { initHTemplate } from "./h-template";

class HView extends HTMLElement {
    #internals;
    constructor() {
        super();
        this.#internals = this.attachInternals();
    }

    set loading(l: boolean) {
        if (l)
            this.#internals.states.add("loading");
        else
            this.#internals.states.delete("loading");
    }

    set matching(m: boolean) {
        if (m)
            this.#internals.states.add("matching");
        else
            this.#internals.states.delete("matching");
    }
};

function getURLPattern(view: HView) {
    const match = view.getAttribute("match")!;
    if (match.startsWith("/") && !match.includes("?"))
        return new URLPattern({ pathname: match, baseURL: location.href});
    else
        return new URLPattern(match, location.href);
}

function getMatches(url: string) {
    return new Set(Array.from(document.querySelectorAll("h-view[match]")).filter(
        view => getURLPattern(view as HView).test(url))) as Set<HView>;
}

function applyState(matching_views: Set<HView>) {
    for (const view of document.querySelectorAll("h-view[match]")) {
        (view as HView).matching = matching_views.has(view as HView);
    }
}

export function initHView() {
    initHTemplate();
    customElements.define('h-view', HView);
    applyState(getMatches(location.href));
    window.navigation.addEventListener("navigate", event => {
        const matches = getMatches(event.destination.url);
        if (!matches.size) {
            applyState(matches);
            return;
        }
        const has_vt = "CSSViewTransitionRule" in window && Array.from(document.styleSheets).some(s => Array.from(s.rules).some(r => (
            (r instanceof CSSViewTransitionRule) && (r as CSSViewTransitionRule).navigation === "auto"
        )));
        async function navigation_handler() {
            for (const popover of document.querySelectorAll("*[popover]")) {
                /** @ts-ignore */
                popover.hidePopover();
            }
            for (const view of matches) {
                view.loading = true;
            }
            applyState(matches);
            await new HTMLStream({
                response: await fetch(event.destination.url), selector: "h-template[for]"
            }).streamTo(document.body);
            for (const view of matches) {
                view.loading = false;
            }
            for (const template of document.querySelectorAll("h-template"))
                template.remove();
        }
        event.intercept({
            focusReset: "manual",
            handler: has_vt ? () => document.startViewTransition(navigation_handler).updateCallbackDone : navigation_handler
        })
    });

}
