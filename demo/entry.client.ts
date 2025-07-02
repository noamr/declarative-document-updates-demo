import {initHView} from "../src/h-view";
initHView();

const url_params = new URLSearchParams(location.search);
const {search} = document.forms.head.elements;
search.value = url_params.get("q") || "";
search.addEventListener("input", () => {
    window.navigation.navigate(`?q=${search.value}`);
})