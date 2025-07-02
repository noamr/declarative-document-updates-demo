import { beforeAll, expect, test } from 'vitest'
import { initHTemplate } from '../src/h-template.ts'

beforeAll(() => {
initHTemplate();

})

test("<template for> after target", async () => {
  const div = document.createElement("div");
  div.id = "target";
  document.body.append(div);
  const template = document.createElement("h-template");
  template.setAttribute("for", "target");
  template.innerHTML = "Hello";
  document.body.appendChild(template);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(div.innerHTML).toEqual("Hello");
});

test("<template for> before target", async () => {
  document.body.innerHTML = "";
  const template = document.createElement("h-template");
  template.setAttribute("for", "target");
  template.innerHTML = "Hello";
  document.body.appendChild(template);
  const div = document.createElement("div");
  div.id = "target";
  document.body.append(div);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(div.innerHTML).toEqual("Hello");
});

test("<template for> with non-empty target", async () => {
  document.body.innerHTML = "";
  const div = document.createElement("div");
  div.id = "target";
  div.innerHTML = "junk";
  document.body.append(div);
  const template = document.createElement("h-template");
  template.setAttribute("for", "target");
  template.innerHTML = "Hello";
  document.body.appendChild(template);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(div.innerHTML).toEqual("Hello");
});

