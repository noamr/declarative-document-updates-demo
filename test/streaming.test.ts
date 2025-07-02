import { expect, test } from 'vitest'
import { HTMLStream } from '../src/html-stream.js'

test('streams static HTML into an existing element', async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const response = new Response("Hello", {headers: {"Content-Type": "text/html"}});
  new HTMLStream(response).streamTo(div);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(div.innerText).toEqual("Hello");
})


test('streams parts of static HTML into an existing element', async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const response = new Response("No <section>Hello</section>", {headers: {"Content-Type": "text/html"}});
  new HTMLStream({response, selector: "section"}).streamTo(div);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(div.innerText).toEqual("Hello");
})

test('streams multiple parts of static HTML into an existing element', async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const response = new Response("<span>Hel</span>junk junk <span>lo</span>", {headers: {"Content-Type": "text/html"}});
  new HTMLStream({response, selector: "span"}).streamTo(div);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(div.innerText).toEqual("Hello");
})