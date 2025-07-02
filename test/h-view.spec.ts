import { expect, test, beforeAll, beforeEach } from 'vitest'
import { initHView } from '../src/h-view.ts'
import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw'

beforeAll(async () => {
  initHView();
  await setupWorker(http.get("/articles/1", async () => HttpResponse.html(`
    <header>junk</header>
    <h-template for="article-content">Content</h-template>
  `)),
http.get("/articles/slow", async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return HttpResponse.html(`
    <header>junk</header>
    <h-template for="article-content">Content</h-template>
  `);
})).start();
})

beforeEach(() => {
  document.body.innerHTML = "";
})

test("<h-view match> intercepts navigation", async () => {
  const view = document.createElement("h-view");
  view.setAttribute("match", "/*");
  document.body.append(view);
  document.body.dataset.state = "before";
  const navigated = new Promise(resolve =>
    window.navigation.addEventListener("navigatesuccess", resolve));
  const a = document.createElement("a");
  a.href = "/blabla";
  a.innerText = "click";
  document.body.append(a);
  a.click();
  await navigated;
  expect(document.body.dataset.state).toEqual("before");
});


test("<h-view> interception applies <h-template for>", async () => {
  const view = document.createElement("h-view");
  const template = document.createElement("h-template");
  const article = document.createElement("article");
  article.id = "article-content";
  view.setAttribute("match", "/articles/*");
  template.setAttribute("for", "target");
  document.body.append(view);
  document.body.append(article);
  const a = document.createElement("a");
  a.href = "/articles/1";
  a.innerText = "click";
  document.body.append(a);

  const navigated = new Promise(resolve =>
    window.navigation.addEventListener("navigatesuccess", resolve));
  a.click();
  await navigated;
  await new Promise(resolve => setTimeout(resolve, 1000))
  expect(article.innerText).toEqual("Content");
});


test("<h-view> receives loading state while loading", async () => {
  const view = document.createElement("h-view");
  const template = document.createElement("h-template");
  const article = document.createElement("article");
  article.id = "article-content";
  view.setAttribute("match", "/articles/*");
  template.setAttribute("for", "target");
  document.body.append(view);
  document.body.append(article);
  const a = document.createElement("a");
  a.href = "/articles/slow";
  a.innerText = "click";
  document.body.append(a);

  const navigated = new Promise(resolve =>
    window.navigation.addEventListener("navigatesuccess", resolve));
  a.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(view.matches(":state(loading)")).toBe(true)
  await navigated;
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(article.innerText).toEqual("Content");
});