// Minimal jQuery typings for the "new_project" namespace-based sources.
// This is a lightweight shim so `/// <reference path="../../lib/jquery.d.ts" />` resolves.

type JQuery = any;
type JQueryStatic = any;

declare const $: JQueryStatic;

declare namespace $ {
  function Callbacks(): any;
}

