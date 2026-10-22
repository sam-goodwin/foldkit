import { Effect, Layer, Schema } from 'effect'

import { SnippetCopyDefinition } from './definition'
import { Message } from './message'

export const CopySnippet = SnippetCopyDefinition.makeCommand('CopySnippet', {
  args: { snippetId: Schema.String, text: Schema.String },
  messages: [Message.SucceededCopySnippet, Message.FailedCopySnippet],
  handler: function* () {
    return ({ snippetId, text }) =>
      Effect.tryPromise({
        try: () => navigator.clipboard.writeText(text),
        catch: () => new Error('Failed to copy to clipboard'),
      }).pipe(
        Effect.as(Message.SucceededCopySnippet({ snippetId })),
        Effect.catch(() => Effect.succeed(Message.FailedCopySnippet())),
      )
  },
})

const COPY_INDICATOR_DURATION = '2 seconds'

export const WaitBeforeHidingCopiedIndicator =
  SnippetCopyDefinition.makeCommand('WaitBeforeHidingCopiedIndicator', {
    args: { snippetId: Schema.String },
    messages: [Message.CompletedWaitBeforeHidingCopiedIndicator],
    handler: function* () {
      return ({ snippetId }) =>
        Effect.sleep(COPY_INDICATOR_DURATION).pipe(
          Effect.as(
            Message.CompletedWaitBeforeHidingCopiedIndicator({ snippetId }),
          ),
        )
    },
  })

export const EffectsLayer = Layer.mergeAll(
  CopySnippet.layer,
  WaitBeforeHidingCopiedIndicator.layer,
)
