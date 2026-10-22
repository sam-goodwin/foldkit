import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import type { ViewInputs } from './view'

export const BlockPageComposition = Block.makeDefinition('BlockPage', {
  Model,
  Message,
}).makeComposition({ viewInputs: Block.declared<ViewInputs>() })
export type BlockPageViewBuilder = Block.ViewBuilderFor<
  typeof BlockPageComposition
>
