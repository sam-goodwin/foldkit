import { Context, Effect, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { defineMessageUnion } from '../message/public.js'
import { modifyFields } from '../struct/public.js'
import * as Block from './public.js'

class SettingsStore extends Context.Service<
  SettingsStore,
  Readonly<{ saveTheme: (theme: string) => Effect.Effect<void> }>
>()('ContractTest/SettingsStore') {}

const Theme = Schema.Literals(['Light', 'Dark', 'System'])

const SettingsModel = Schema.Struct({ theme: Theme })
const SettingsMessage = defineMessageUnion({
  ChangedTheme: { theme: Theme },
  RequestedReset: {},
  CompletedSaveTheme: {},
})
const SettingsOutMessage = defineMessageUnion({
  ChangedTheme: { theme: Theme },
})

const SettingsDefinition = Block.makeDefinition('ContractSettings', {
  Model: SettingsModel,
  Message: SettingsMessage,
  OutMessage: SettingsOutMessage,
})

const SaveTheme = SettingsDefinition.makeCommand('SaveTheme', {
  args: { theme: Theme },
  messages: [SettingsMessage.CompletedSaveTheme],
  handler: function* () {
    const store = yield* SettingsStore
    return ({ theme }) =>
      store
        .saveTheme(theme)
        .pipe(Effect.as(SettingsMessage.CompletedSaveTheme()))
  },
})

type SettingsViewInputs = Readonly<{ label: string }>

const SettingsComposition = SettingsDefinition.makeComposition({
  EffectsLayer: SaveTheme.layer,
  operations: { requestReset: SettingsMessage.RequestedReset },
  viewInputs: Block.declared<SettingsViewInputs>(),
  initArgs: Block.declared<readonly [theme: typeof Theme.Type]>(),
})

const settingsInit = SettingsComposition.makeInit(
  (theme: typeof Theme.Type) => ({
    model: SettingsModel.make({ theme }),
  }),
)

const settingsUpdate = SettingsComposition.makeUpdate((model, message) =>
  SettingsMessage.match(message, {
    ChangedTheme: ({ theme }) => ({
      model: modifyFields(model, { theme: () => theme }),
      commands: [SaveTheme({ theme })],
      outMessage: SettingsOutMessage.ChangedTheme({ theme }),
    }),
    RequestedReset: () => ({
      model: modifyFields(model, { theme: () => 'System' }),
    }),
    CompletedSaveTheme: () => ({ model }),
  }),
)

const settingsView = SettingsComposition.makeView((model, { label }, h) =>
  h.div([], [`${label}: ${model.theme}`]),
)

const SettingsBlock = SettingsComposition.assembleBlock({
  init: settingsInit,
  update: settingsUpdate,
  view: settingsView,
})

const ProfileModel = Schema.Struct({
  displayName: Schema.String,
  previewTheme: Theme,
  settings: SettingsModel,
})
const ProfileMessage = defineMessageUnion({ ClickedReset: {} })
const ProfileDefinition = Block.makeDefinition('ContractProfile', {
  Model: ProfileModel,
  Message: ProfileMessage,
})

const SettingsBinding = ProfileDefinition.makeBinding(SettingsBlock, {
  field: 'settings',
  init: { contextToArgs: () => ['Dark'] as const },
}).withOutMessagePolicy({
  fold: ProfileDefinition.makeOutMessageFold(SettingsBlock, {
    ChangedTheme: ({ theme }) =>
      ProfileDefinition.makeFieldsStep(() => ({ previewTheme: () => theme })),
  }),
})

const ProfileComposition = ProfileDefinition.makeComposition({
  bindings: [SettingsBinding],
  viewInputs: Block.declared<void>(),
})

const profileInit = ProfileComposition.makeInit(() => ({
  model: { displayName: 'Ada', previewTheme: 'System' },
}))

const profileUpdate = ProfileComposition.makeUpdate((model, message) =>
  ProfileMessage.match(message, {
    ClickedReset: () => SettingsBinding.requestReset()(model),
  }),
)

const profileView = ProfileComposition.makeView((model, h) =>
  h.block(
    SettingsBinding.embedView({
      slotId: 'settings',
      model: model.settings,
      viewInputs: { label: model.displayName },
    }),
  ),
)

const ProfileBlock = ProfileComposition.assembleBlock({
  init: profileInit,
  update: profileUpdate,
  view: profileView,
})

describe('Composition contract', () => {
  it('completes a Block from its contract and implementation', () => {
    const initialized = SettingsBlock.init('Light')
    expect(initialized.model).toEqual({ theme: 'Light' })

    const reset = SettingsBlock.operations.requestReset(
      SettingsModel.make({ theme: 'Dark' }),
    )
    expect(reset.model).toEqual({ theme: 'System' })
  })

  it('initializes and updates a parent through a contract child', () => {
    const initialized = ProfileBlock.init()
    expect(initialized.model).toEqual({
      displayName: 'Ada',
      previewTheme: 'System',
      settings: { theme: 'Dark' },
    })
  })

  it('rejects contract fields passed to assembleBlock at runtime', () => {
    expect(() =>
      Reflect.apply(SettingsComposition.assembleBlock, undefined, [
        {
          init: settingsInit,
          update: settingsUpdate,
          view: settingsView,
          EffectsLayer: SaveTheme.layer,
        },
      ]),
    ).toThrow(/pass only init, update, and view/)
  })
})

const checkContractTypes = (): void => {
  const SiblingModel = Schema.Struct({
    settings: SettingsModel,
    mirror: SettingsModel,
  })
  const SiblingDefinition = Block.makeDefinition('ContractSiblings', {
    Model: SiblingModel,
    Message: defineMessageUnion({}),
  })
  const MirrorBinding = SiblingDefinition.makeBinding(SettingsBlock, {
    field: 'mirror',
    init: { contextToArgs: () => ['Light'] as const },
  }).withOutMessagePolicy({
    fold: SiblingDefinition.makeOutMessageFold(SettingsBlock, {
      ChangedTheme: SiblingDefinition.makeNoopStep,
    }),
  })
  const SettingsWithSiblingPolicy = SiblingDefinition.makeBinding(
    SettingsBlock,
    {
      field: 'settings',
      init: { contextToArgs: () => ['Dark'] as const },
    },
  ).withOutMessagePolicy({
    fold: SiblingDefinition.makeOutMessageFold(SettingsBlock, {
      ChangedTheme: () => MirrorBinding.requestReset(),
    }),
  })
  const SiblingComposition = SiblingDefinition.makeComposition({
    bindings: [SettingsWithSiblingPolicy],
    viewInputs: Block.declared<void>(),
  })
  SiblingComposition.assembleBlock(
    // @ts-expect-error The policy uses MirrorBinding, which this contract Composition does not register.
    {
      init: SiblingComposition.makeInit(() => ({
        model: { mirror: SettingsModel.make({ theme: 'Light' }) },
      })),
      update: SiblingComposition.makeUpdate(),
      view: SiblingComposition.makeView((_model, h) => h.div([], [])),
    },
  )

  const WithoutEffects = SettingsDefinition.makeComposition({
    viewInputs: Block.declared<SettingsViewInputs>(),
    initArgs: Block.declared<readonly [theme: typeof Theme.Type]>(),
  })

  const withoutEffectsInit = WithoutEffects.makeInit(
    (theme: typeof Theme.Type) => ({
      model: SettingsModel.make({ theme }),
    }),
  )
  const updateWithoutHandler = WithoutEffects.makeUpdate((model, message) =>
    // @ts-expect-error SaveTheme has no handler in this contract's EffectsLayer.
    SettingsMessage.match(message, {
      ChangedTheme: ({ theme }) => ({
        model,
        commands: [SaveTheme({ theme })],
      }),
      RequestedReset: () => ({ model }),
      CompletedSaveTheme: () => ({ model }),
    }),
  )
  WithoutEffects.assembleBlock({
    init: withoutEffectsInit,
    update: updateWithoutHandler,
    view: WithoutEffects.makeView((model, { label }, h) =>
      h.div([], [label, model.theme]),
    ),
  })

  // @ts-expect-error The initializer's parameters must accept the declared init arguments.
  SettingsComposition.makeInit((count: number) => ({
    model: SettingsModel.make({ theme: count > 0 ? 'Dark' : 'Light' }),
  }))

  const otherUpdate = WithoutEffects.makeUpdate((model, message) =>
    SettingsMessage.match(message, {
      ChangedTheme: () => ({ model }),
      RequestedReset: () => ({ model }),
      CompletedSaveTheme: () => ({ model }),
    }),
  )
  SettingsComposition.assembleBlock({
    init: settingsInit,
    // @ts-expect-error An update checked against another contract cannot complete this one.
    update: otherUpdate,
    view: settingsView,
  })

  ProfileComposition.makeView((model, h) =>
    h.block(
      // @ts-expect-error The Settings view requires its declared view inputs.
      SettingsBinding.embedView({ slotId: 'settings', model: model.settings }),
    ),
  )
}

void checkContractTypes
