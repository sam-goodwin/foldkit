// ✅ Good: the parent sends a request Settings declares for it.

import { Effect, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { Settings } from './blockSettingsContract'

export class Account extends Block<Account>()('Account', {
  Model: Schema.Struct({ settings: Settings }),
  Message: defineMessageUnion({ ClickedResetSettings: {} }),
}) {}

export const AccountLive = Account.layer(
  Effect.gen(function* () {
    return {
      init: () => ({
        settings: new Settings('settings', { initialTheme: 'System' }),
      }),

      update: {
        ClickedResetSettings: model => ({
          model,
          messages: [model.settings.send(Settings.Message.RequestedReset())],
        }),
      },
    }
  }),
)
