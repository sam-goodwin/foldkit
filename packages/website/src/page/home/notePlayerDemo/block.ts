import { NotePlayerDemoComposition } from './composition'
import { init, update, view } from './notePlayerDemo'

export const NotePlayerDemoBlock = NotePlayerDemoComposition.assembleBlock({
  init,
  update,
  view,
})
