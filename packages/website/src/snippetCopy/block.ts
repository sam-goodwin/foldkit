import { SnippetCopyComposition } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const SnippetCopyBlock = SnippetCopyComposition.assembleBlock({
  init,
  update,
  view,
})
