import { Effect } from 'effect'
import { Block } from 'foldkit'

export class App extends Block<App>()('Application', {}) {}

export const AppLive = App.layer(
  Effect.gen(function* () {
    return {}
  }),
)
