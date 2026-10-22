import {
  Deferred,
  Effect,
  FiberMap,
  Layer,
  Option,
  Record,
  Schema,
  pipe,
} from 'effect'
import type { ManagedResource } from 'foldkit'
import filesBySlug from 'virtual:playground-files'

import {
  type PlaygroundWebContainer,
  acquirePlaygroundWebContainer,
  reasonFromError,
} from '../playgroundWebContainer'
import { Message, PlaygroundDefinition } from './definition'
import { MountPlaygroundEditor } from './mount'

// MANAGED RESOURCE

const WebContainerPlayground =
  PlaygroundDefinition.makeResource<PlaygroundWebContainer>()(
    'WebContainerPlayground',
  )

export type WebContainerPlaygroundService = ManagedResource.ServiceOf<
  typeof WebContainerPlayground
>

const PlaygroundParams = Schema.Struct({ slug: Schema.String })

// NOTE: Vite's HMR for a content file (`src/application.ts`) doesn't reliably
// invalidate Tailwind's CSS module in the WebContainer. After writing the
// content file, we write `src/styles.css` back to itself so Vite emits a
// CSS HMR update; that re-runs the Tailwind plugin against the latest
// content tree and the new utility classes show up in the preview.
const STYLES_CSS_PATH = 'src/styles.css'

const WRITE_DEBOUNCE_MILLIS = 250

export const WaitForPlaygroundServerFailure = PlaygroundDefinition.makeCommand(
  'WaitForPlaygroundServerFailure',
  {
    messages: [Message.CompletedWaitForPlaygroundServerFailure],
    handler: function* () {
      return () =>
        Effect.gen(function* () {
          const { serverFailure } = yield* WebContainerPlayground.get
          return yield* Deferred.await(serverFailure).pipe(
            Effect.catch(error =>
              Effect.succeed(
                Message.CompletedWaitForPlaygroundServerFailure({
                  reason: reasonFromError(error),
                }),
              ),
            ),
          )
        }).pipe(Effect.catchTag('ResourceNotAvailable', () => Effect.interrupt))
    },
  },
)

export const SchedulePlaygroundFileWrite = PlaygroundDefinition.makeCommand(
  'SchedulePlaygroundFileWrite',
  {
    args: { path: Schema.String, content: Schema.String },
    messages: [
      Message.SucceededSchedulePlaygroundFileWrite,
      Message.FailedSchedulePlaygroundFileWrite,
    ],
    handler: function* () {
      return ({ path, content }) =>
        Effect.gen(function* () {
          const { container, pendingWrites } = yield* WebContainerPlayground.get
          yield* FiberMap.run(
            pendingWrites,
            path,
            Effect.gen(function* () {
              yield* Effect.sleep(WRITE_DEBOUNCE_MILLIS)
              yield* Effect.tryPromise(() =>
                container.fs.writeFile(path, content),
              )
              if (path !== STYLES_CSS_PATH) {
                const stylesContent = yield* Effect.tryPromise(() =>
                  container.fs.readFile(STYLES_CSS_PATH, 'utf-8'),
                )
                yield* Effect.tryPromise(() =>
                  container.fs.writeFile(STYLES_CSS_PATH, stylesContent),
                )
              }
            }).pipe(
              Effect.catch(error =>
                Effect.logError(
                  `[playground] Debounced write failed for ${path}:`,
                  error,
                ),
              ),
            ),
            { startImmediately: true },
          )
          return Message.SucceededSchedulePlaygroundFileWrite()
        }).pipe(
          Effect.catchTag('ResourceNotAvailable', () =>
            Effect.succeed(
              Message.FailedSchedulePlaygroundFileWrite({
                reason: 'WebContainer not yet ready',
              }),
            ),
          ),
        )
    },
  },
)

export const managedResources = PlaygroundDefinition.makeManagedResources(
  entry => ({
    webContainerPlayground: entry(
      'ManageWebContainerPlayground',
      Schema.Option(PlaygroundParams),
      {
        resource: WebContainerPlayground,
        modelToMaybeRequirements: ({ slug, state, maybeIsSupported }) =>
          state._tag === 'Failed' ||
          state._tag === 'Idle' ||
          !Option.contains(maybeIsSupported, true)
            ? Option.none()
            : pipe(
                slug,
                Option.liftPredicate(() => Record.has(filesBySlug, slug)),
                Option.map(() => ({ slug })),
              ),
        onAcquired: ({ previewUrl }) =>
          Message.BootedPlayground({ previewUrl }),
        onReleased: () => Message.ReleasedPlayground(),
        onAcquireError: error =>
          Message.FailedBootPlayground({ reason: reasonFromError(error) }),
        handler: function* () {
          return {
            acquire: ({ slug }) =>
              Effect.gen(function* () {
                const fileEntry = yield* Effect.fromOption(
                  Record.get(filesBySlug, slug),
                )
                return yield* acquirePlaygroundWebContainer(fileEntry.files)
              }),
            release: () => Effect.void,
          }
        },
      },
    ),
  }),
)

export const EffectsLayer = Layer.mergeAll(
  managedResources.webContainerPlayground.layer,
  MountPlaygroundEditor.layer,
  WaitForPlaygroundServerFailure.layer,
  SchedulePlaygroundFileWrite.layer,
)
