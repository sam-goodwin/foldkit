---
'foldkit': minor
---

Add Composition contracts. A Composition can now declare its public contract in `makeComposition`: `operations`, `EffectsLayer`, `subscriptions`, `managedResources`, `hostHandlers`, and `Block.declared<T>()` types for `viewInputs`, `initArgs`, and `updateContext`, plus `document: true` for a page-owning view. A contract Composition's `assembleBlock({ init, update, view })` returns a Block whose type comes from that contract, so files that import the Block no longer re-check its implementation. `makeInit`, `makeUpdate`, and `makeView` check the implementation against the contract in the feature's own files. Compositions without a contract are unchanged.

Handler contract conflicts are now detected per Context key, and `assembleBlock` resolves exact implementations on its first overload, which reduces type-checking work for every Block.
