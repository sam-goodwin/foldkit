import { Effect } from 'effect'

import { Application } from './application'
import { init, updateHandlers } from './todo'
import { view } from './view.optimised'

export const ApplicationLive = Application.layer(
  Effect.gen(function* () {
    return {
      init: () => init().model,
      update: updateHandlers,
      view,
    }
  }),
)
