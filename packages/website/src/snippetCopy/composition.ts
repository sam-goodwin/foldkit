import { Block } from 'foldkit'

import { EffectsLayer } from './command'
import { SnippetCopyDefinition } from './definition'
import type { ViewInputs } from './view'

export const SnippetCopyComposition = SnippetCopyDefinition.makeComposition({
  EffectsLayer,
  viewInputs: Block.declared<ViewInputs>(),
})
