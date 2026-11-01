import { Effect, Layer, Schema } from 'effect'

import { describe, expect, it } from '@effect/vitest'

import { defineMessageUnion } from '../message/index.js'
import { message, model } from '../test/story.js'
import { Block, InstancePath } from './block.js'
import { story } from './testing.js'

class Ticker extends Block<Ticker>()('Ticker', {
  Model: Schema.Struct({ commandIdPrefix: Schema.String }),
}) {}

const TickerLive = Ticker.make(
  Effect.fn(function* () {
    const path = yield* InstancePath
    return { model: { commandIdPrefix: path.join('/') } }
  }),
)

class Tickers extends Block<Tickers>()('Tickers', {
  Model: Schema.Struct({ ticker: Ticker, tickers: Schema.Array(Ticker) }),
  Message: defineMessageUnion({ ClickedAdd: {} }),
}) {}

const TickersLive = Tickers.make(
  Effect.fn(function* () {
    const ticker = yield* new Ticker('ticker')
    const row = yield* Ticker.each('tickers')

    return {
      model: { ticker, tickers: [] },
      update: {
        ClickedAdd: model => ({
          model: { ...model, tickers: [...model.tickers, row('wo-42')] },
        }),
      },
    }
  }),
)

describe('Block InstancePath', () => {
  it.effect('gives a constructor its path from the root', () =>
    story(
      TickersLive.pipe(Layer.provide(TickerLive)),
      message(Tickers.Message.ClickedAdd()),
      model(tickers => {
        expect(tickers.ticker.commandIdPrefix).toBe('ticker')
        expect(tickers.tickers.map(row => row.commandIdPrefix)).toEqual([
          'tickers/wo-42',
        ])
      }),
    ),
  )
})

describe('Block stories', () => {
  it('names a child Block whose Layer is missing', () => {
    // @ts-expect-error MissingBlockLayer<Ticker>
    const missing: Effect.Effect<void> = story(TickersLive)
    expect(Effect.isEffect(missing)).toBe(true)
  })
})
