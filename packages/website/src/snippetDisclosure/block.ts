import { SnippetDisclosureComposition } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const SnippetDisclosureBlock =
  SnippetDisclosureComposition.assembleBlock({
    init,
    update,
    view,
  })
