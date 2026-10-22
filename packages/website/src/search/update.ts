import { Match, Number, String } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { clearSearchQuery } from './clear'
import {
  FetchSearchResults,
  FocusSearchInput,
  NavigateToResult,
  ScrollToResult,
} from './command'
import { DialogBinding, SearchComposition } from './composition'
import { SearchDefinition } from './definition'
import { SearchState, resultsFromState } from './domain'
import { Message } from './message'

export {
  FetchSearchResults,
  FocusSearchInput,
  NavigateToResult,
  ScrollToResult,
} from './command'

const focusSearchInput = SearchDefinition.makeCommandsStep([FocusSearchInput()])

const open = SearchDefinition.makeStep(() =>
  Update.combineSteps([DialogBinding.requestOpen(), focusSearchInput]),
)

export const update = SearchComposition.makeUpdate((model, message) =>
  Message.match(message, {
    UpdatedSearchQuery: ({ query }) => {
      if (query === model.query) {
        return { model }
      }

      if (String.isEmpty(query)) {
        return {
          model: modifyFields(model, {
            query: () => '',
            searchState: () => SearchState.Idle(),
            activeResultIndex: () => -1,
          }),
        }
      }

      const previousResults = resultsFromState(model.searchState)

      return {
        model: modifyFields(model, {
          query: () => query,
          searchState: () => SearchState.Loading({ results: previousResults }),
          activeResultIndex: () => -1,
        }),
        commands: [FetchSearchResults({ query })],
      }
    },

    CompletedFetchSearchResults: ({ results, query }) => {
      if (query !== model.query) {
        return { model }
      }

      return {
        model: modifyFields(model, {
          searchState: () => SearchState.Ok({ results }),
          activeResultIndex: () => 0,
        }),
      }
    },

    SelectedSearchResult: ({ url }) => ({
      model: modifyFields(model, {
        query: () => '',
        searchState: () => SearchState.Idle(),
        activeResultIndex: () => -1,
      }),
      commands: [NavigateToResult({ url })],
    }),

    ClearedSearchQuery: () => clearSearchQuery(model),

    RequestedOpen: () => open(model),

    InformedOfRouteChange: () =>
      Update.combineSteps(model, [
        clearSearchQuery,
        DialogBinding.requestClose(),
      ]),

    PressedArrowKey: ({ direction }) => {
      const results = resultsFromState(model.searchState)
      const lastIndex = results.length - 1

      const nextIndex = Match.value(direction).pipe(
        Match.when('Up', () =>
          model.activeResultIndex <= 0
            ? lastIndex
            : Number.decrement(model.activeResultIndex),
        ),
        Match.when('Down', () =>
          model.activeResultIndex >= lastIndex
            ? 0
            : Number.increment(model.activeResultIndex),
        ),
        Match.exhaustive,
      )

      return {
        model: modifyFields(model, { activeResultIndex: () => nextIndex }),
        commands: [ScrollToResult({ index: nextIndex })],
      }
    },

    CompletedNavigateToResult: () => ({ model }),
    CompletedScrollToResult: () => ({ model }),
    CompletedFocusSearchInput: () => ({ model }),
  }),
)
