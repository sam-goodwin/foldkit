import { SearchComposition } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const SearchBlock = SearchComposition.assembleBlock({
  init,
  update,
  view,
})
