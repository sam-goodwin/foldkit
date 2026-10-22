import { ApiReferenceComposition } from './composition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const ApiReferenceBlock = ApiReferenceComposition.assembleBlock({
  init,
  update,
  view,
})
