import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import type { ViewInputs } from './view'

export const ComingFromReactComposition = Block.makeDefinition(
  'ComingFromReact',
  {
    Model,
    Message,
  },
).makeComposition({ viewInputs: Block.declared<ViewInputs>() })
export type ComingFromReactViewBuilder = Block.ViewBuilderFor<
  typeof ComingFromReactComposition
>
