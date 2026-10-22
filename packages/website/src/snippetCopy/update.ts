import { HashSet } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { CopySnippet, WaitBeforeHidingCopiedIndicator } from './command'
import { SnippetCopyComposition } from './composition'
import { Message } from './message'

export const update = SnippetCopyComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedCopySnippet: ({ snippetId, text }) => ({
      model,
      commands: [CopySnippet({ snippetId, text })],
    }),

    SucceededCopySnippet: ({ snippetId }) =>
      HashSet.has(model.copiedSnippetIds, snippetId)
        ? { model }
        : {
            model: modifyFields(model, {
              copiedSnippetIds: HashSet.add(snippetId),
            }),
            commands: [WaitBeforeHidingCopiedIndicator({ snippetId })],
          },

    FailedCopySnippet: () => ({ model }),

    CompletedWaitBeforeHidingCopiedIndicator: ({ snippetId }) => ({
      model: modifyFields(model, {
        copiedSnippetIds: HashSet.remove(snippetId),
      }),
    }),
  }),
)
