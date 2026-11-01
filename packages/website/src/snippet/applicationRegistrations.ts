import { Effect, Layer, Schema } from 'effect'
import { Block } from 'foldkit'

// page/home.ts
export class Home extends Block<Home>()('Home', {
  Model: Schema.Struct({ headline: Schema.String }),
}) {}

export const HomeLive = Home.layer(
  Effect.gen(function* () {
    return {
      init: () => ({ headline: 'Welcome' }),
      view: (model, h) => h.h1([], [model.headline]),
    }
  }),
)

// page/products.ts
export class Products extends Block<Products>()('Products', {
  Model: Schema.Struct({ names: Schema.Array(Schema.String) }),
}) {}

export const ProductsLive = Products.layer(
  Effect.gen(function* () {
    return {
      init: () => ({ names: ['Desk lamp', 'Notebook'] }),
      view: (model, h) =>
        h.ul(
          [],
          model.names.map(name => h.keyed('li')(name, [], [name])),
        ),
    }
  }),
)

// application.ts
const Model = Schema.Struct({ home: Home, products: Products })
type Model = typeof Model.Type

export class Application extends Block<Application>()('Application', {
  Model,
}) {}

const ChildrenLive = Layer.mergeAll(HomeLive, ProductsLive)

export const ApplicationLive = Application.layer(
  Effect.gen(function* () {
    return {
      init: () => ({
        home: new Home('home'),
        products: new Products('products'),
      }),
      view: (model, h) => ({
        title: 'Shop',
        body: h.main([], [model.home.view(), model.products.view()]),
      }),
    }
  }),
).pipe(Layer.provide(ChildrenLive))
