// ✅ Good: the parent reads the theme from the Settings instance.

import { Effect, Schema } from 'effect'
import { Block } from 'foldkit'

import { Settings } from './blockSettingsContract'

export class Account extends Block<Account>()('Account', {
  Model: Schema.Struct({ settings: Settings }),
}) {}

export const AccountLive = Account.layer(
  Effect.gen(function* () {
    return {
      init: () => ({
        settings: new Settings('settings', { initialTheme: 'System' }),
      }),

      view: (model, h) =>
        h.div(
          [],
          [
            h.p([], [`Theme: ${model.settings.model.theme}`]),
            model.settings.view(),
          ],
        ),
    }
  }),
)
