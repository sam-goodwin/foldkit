import { Effect, Layer, Schema } from 'effect'

import { ExampleDetailDefinition } from './definition'
import { Message } from './message'
import { ObserveExampleUrlMessages } from './mount'
import { loadSourcesForSlug } from './sources'

/** Loads the source files for the example identified by `slug`, producing the
 *  loaded sources on success or a failure Message when the fetch does not
 *  complete. */
export const LoadExampleSources = ExampleDetailDefinition.makeCommand(
  'LoadExampleSources',
  {
    args: { slug: Schema.String },
    messages: [
      Message.SucceededLoadExampleSources,
      Message.FailedLoadExampleSources,
    ],
    handler: function* () {
      return ({ slug }) =>
        Effect.tryPromise({
          try: () => loadSourcesForSlug(slug),
          catch: error =>
            error instanceof Error ? error.message : `Unknown example: ${slug}`,
        }).pipe(
          Effect.map(sources =>
            Message.SucceededLoadExampleSources({ sources }),
          ),
          Effect.catch(error =>
            Effect.succeed(Message.FailedLoadExampleSources({ error })),
          ),
        )
    },
  },
)

export const EffectsLayer = Layer.mergeAll(
  LoadExampleSources.layer,
  ObserveExampleUrlMessages.layer,
)
