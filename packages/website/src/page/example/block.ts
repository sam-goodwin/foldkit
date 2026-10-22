import { ExampleDetailComposition } from './composition'
import { init, update, view } from './example'

export { mounts } from './composition'
export {
  CurrentSourcesAsyncData,
  EffectsLayer,
  init,
  LoadExampleSources,
  Message,
  Model,
  tableOfContents,
  update,
  view,
} from './example'

export const ExampleDetailBlock = ExampleDetailComposition.assembleBlock({
  init,
  update,
  view,
})
