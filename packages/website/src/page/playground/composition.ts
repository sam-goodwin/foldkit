import { type Option, Tuple } from 'effect'
import { Block } from 'foldkit'

import { Message, PlaygroundDefinition } from './definition'
import { EffectsLayer, managedResources } from './effects'
import { PlaygroundFileTabsBlock } from './fileTabs'
import { MountPlaygroundEditor } from './mount'
import type { ViewInputs } from './playground'

export const FileTabsBinding = PlaygroundDefinition.makeBinding(
  PlaygroundFileTabsBlock,
  {
    field: 'fileTabs',
    init: { contextToArgs: () => Tuple.make({ id: 'playground-files' }) },
  },
).withOutMessagePolicy({
  fold: PlaygroundDefinition.makeOutMessageFold(PlaygroundFileTabsBlock, {
    Selected: ({ value }) =>
      PlaygroundDefinition.makeFieldsStep(() => ({
        activeFilePath: () => value,
      })),
  }),
})

export const PlaygroundComposition = PlaygroundDefinition.makeComposition({
  mounts: [MountPlaygroundEditor],
  bindings: [FileTabsBinding],
  managedResources,
  EffectsLayer,
  operations: { informSupport: Message.InformedOfSupport },
  viewInputs: Block.declared<ViewInputs>(),
  initArgs:
    Block.declared<
      readonly [slug: string, maybeIsSupported?: Option.Option<boolean>]
    >(),
})
export type PlaygroundViewBuilder = Block.ViewBuilderFor<
  typeof PlaygroundComposition
>
