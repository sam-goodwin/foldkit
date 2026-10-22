import { Option, Record, Result } from 'effect'
import { AsyncData } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { LoadApiData } from './command'
import { ApiReferenceComposition } from './composition'
import { ApiReferenceDefinition } from './definition'
import { ApiDataAsyncData } from './domain'
import { Message } from './message'
import { disclosuresForApiData } from './model'

export { EffectsLayer, LoadApiData } from './command'

const refreshApiData = ApiReferenceDefinition.makeStep(model =>
  Option.match(
    AsyncData.isStale(model.apiData)
      ? AsyncData.revalidate(model.apiData)
      : AsyncData.loadIfMissing(model.apiData),
    {
      onNone: () => ({ model }),
      onSome: apiData => ({
        model: modifyFields(model, { apiData: () => apiData }),
        commands: [LoadApiData()],
      }),
    },
  ),
)

export const update = ApiReferenceComposition.makeUpdate((model, message) =>
  Message.match(message, {
    InformedOfRouteChange: () => refreshApiData(model),

    SucceededLoadApiData: ({ apiData }) => ({
      model: modifyFields(model, {
        apiData: () => ApiDataAsyncData.Success({ data: apiData }),
        disclosures: disclosures =>
          Record.union(
            disclosures,
            disclosuresForApiData(apiData),
            isOpen => isOpen,
          ),
      }),
    }),

    FailedLoadApiData: ({ error }) => ({
      model: modifyFields(model, {
        apiData: apiData => AsyncData.settle(apiData, Result.fail(error)),
      }),
    }),

    ToggledSignature: ({ id, isOpen }) => ({
      model: modifyFields(model, {
        disclosures: disclosures => Record.set(disclosures, id, isOpen),
      }),
    }),
  }),
)
