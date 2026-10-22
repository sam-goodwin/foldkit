import { Option, Tuple } from 'effect'
import { Block } from 'foldkit'

import { EffectsLayer } from './command'
import { ExampleDetailDefinition } from './definition'
import type { ViewInputs } from './example'
import { SourceFileTabsBlock } from './fileTabs'
import { Message } from './message'
import { ObserveExampleUrlMessages } from './mount'
import type { ExampleSources } from './sources'

export const SOURCE_FILE_TABS_ID = 'source-file-tabs'

export const SourceFileTabsBinding = ExampleDetailDefinition.makeBinding(
  SourceFileTabsBlock,
  {
    field: 'sourceFileTabs',
    init: { contextToArgs: () => Tuple.make({ id: SOURCE_FILE_TABS_ID }) },
  },
).withOutMessagePolicy({
  fold: ExampleDetailDefinition.makeOutMessageFold(SourceFileTabsBlock, {
    Selected: ({ value }) =>
      ExampleDetailDefinition.makeFieldsStep(() => ({
        maybeActiveSourceFilePath: () => Option.some(value),
      })),
  }),
})

export const mounts = [ObserveExampleUrlMessages]

export const ExampleDetailComposition = ExampleDetailDefinition.makeComposition(
  {
    bindings: [SourceFileTabsBinding],
    mounts,
    operations: { informRouteChanged: Message.InformedOfRouteChange },
    EffectsLayer,
    viewInputs: Block.declared<ViewInputs>(),
    initArgs:
      Block.declared<
        readonly [
          maybeInitialSlug?: Option.Option<string>,
          maybeExampleSources?: Option.Option<typeof ExampleSources.Type>,
        ]
      >(),
  },
)
export type ExampleDetailViewBuilder = Block.ViewBuilderFor<
  typeof ExampleDetailComposition
>
