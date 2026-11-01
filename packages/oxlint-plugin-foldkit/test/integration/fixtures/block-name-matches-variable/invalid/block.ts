import { Effect, Layer } from 'effect'
import { Block as AliasedBlock } from 'foldkit'
import * as Foldkit from 'foldkit'

export class CounterBlock extends AliasedBlock<CounterBlock>()('Counter', {}) {}

export const Counter_ = CounterBlock.layer(
  Effect.gen(function* () {
    return {}
  }),
)

export class Badge extends Foldkit.Block<Panel>()('Badge', {}) {}

export class Panel extends Foldkit.Block<Panel>()('Panel', {}) {}

export const PanelLayer = Panel.layer(
  Effect.gen(function* () {
    return {}
  }),
).pipe(Layer.provide(Counter_))

export const makeMenu = () => {
  const MenuClass = Foldkit.Block<{ readonly kind: 'Menu' }>()('Menu', {})
  const MenuClassLive = MenuClass.layer(
    Effect.gen(function* () {
      return {}
    }),
  )
  return Object.assign(MenuClass, { Live: MenuClassLive })
}
