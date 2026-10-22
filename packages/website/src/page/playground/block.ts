import { PlaygroundComposition } from './composition'
import { init, update, view } from './playground'

export const PlaygroundBlock = PlaygroundComposition.assembleBlock({
  init,
  update,
  view,
})
