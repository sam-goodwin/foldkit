import { Block } from 'foldkit'

import { SnippetDisclosureDefinition } from './definition'
import { MeasureSnippetHeight } from './mount'
import type { ViewInputs } from './view'

export const SnippetDisclosureComposition =
  SnippetDisclosureDefinition.makeComposition({
    mounts: [MeasureSnippetHeight],
    EffectsLayer: MeasureSnippetHeight.layer,
    viewInputs: Block.declared<ViewInputs>(),
  })
