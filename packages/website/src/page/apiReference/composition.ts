import type { Option } from 'effect'
import { Block } from 'foldkit'

import { EffectsLayer } from './command'
import { ApiReferenceDefinition } from './definition'
import type { ApiData } from './domain'
import { Message } from './message'
import type { ViewInputs } from './view'

export const ApiReferenceComposition = ApiReferenceDefinition.makeComposition({
  operations: { informRouteChanged: Message.InformedOfRouteChange },
  EffectsLayer,
  viewInputs: Block.declared<ViewInputs>(),
  initArgs:
    Block.declared<
      readonly [maybeApiData?: Option.Option<typeof ApiData.Type>]
    >(),
})
export type ApiReferenceViewBuilder = Block.ViewBuilderFor<
  typeof ApiReferenceComposition
>
