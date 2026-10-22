import { Duration, Effect, Layer, Option, Schema } from 'effect'

import {
  Message,
  Note,
  NoteDuration,
  NotePlayerDemoDefinition,
} from './definition'

const NOTE_FREQUENCIES: Record<typeof Note.Type, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
}

const DURATION_MILLISECONDS: Record<typeof NoteDuration.Type, number> = {
  Short: 200,
  Medium: 400,
  Long: 800,
}

const GAIN_ATTACK_TIME = 0.01
const GAIN_RELEASE_TIME = 0.02
const GAIN_NEAR_SILENT = 0.001
const PHASE_DURATION: Duration.Input = '150 millis'

export const DelayAdvanceNotePlayerPhase = NotePlayerDemoDefinition.makeCommand(
  'DelayAdvanceNotePlayerPhase',
  {
    args: { generation: Schema.Number },
    messages: [Message.CompletedDelayAdvanceNotePlayerPhase],
    handler: function* () {
      return ({ generation }) =>
        Effect.sleep(PHASE_DURATION).pipe(
          Effect.as(
            Message.CompletedDelayAdvanceNotePlayerPhase({ generation }),
          ),
        )
    },
  },
)

// MANAGED RESOURCE

const AudioContextResource =
  NotePlayerDemoDefinition.makeResource<AudioContext>()('AudioContext')

export const managedResources = NotePlayerDemoDefinition.makeManagedResources(
  entry => ({
    audioContext: entry('ManageAudioContext', Schema.Option(Schema.Null), {
      resource: AudioContextResource,
      modelToMaybeRequirements: () => Option.some(null),
      onAcquired: () => Message.SucceededAcquireAudioContext(),
      onReleased: () => Message.ReleasedAudioContext(),
      onAcquireError: () => Message.FailedAcquireAudioContext(),
      handler: function* () {
        return {
          acquire: () =>
            Effect.try({
              try: () => new AudioContext(),
              catch: () =>
                new Error('The Web Audio API is unavailable in this browser.'),
            }),
          release: audioContext =>
            Effect.promise(() => audioContext.close().catch(() => undefined)),
        }
      },
    }),
  }),
)

export const PlayNote = NotePlayerDemoDefinition.makeCommand('PlayNote', {
  args: { note: Note, duration: NoteDuration, noteIndex: Schema.Number },
  messages: [Message.CompletedPlayNote],
  handler: function* () {
    return ({ note, duration, noteIndex }) =>
      Effect.gen(function* () {
        const audioContext = yield* AudioContextResource.get
        yield* Effect.promise(() =>
          audioContext.resume().catch(() => undefined),
        )

        return yield* Effect.callback<typeof Message.CompletedPlayNote.Type>(
          resume => {
            if (audioContext.state === 'closed') {
              resume(Effect.succeed(Message.CompletedPlayNote({ noteIndex })))
              return
            }

            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            const durationSeconds = DURATION_MILLISECONDS[duration] / 1000

            oscillator.type = 'triangle'
            oscillator.frequency.setValueAtTime(
              NOTE_FREQUENCIES[note],
              audioContext.currentTime,
            )

            const releaseEnd =
              audioContext.currentTime + durationSeconds - GAIN_RELEASE_TIME

            gainNode.gain.setValueAtTime(0, audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(
              0.1,
              audioContext.currentTime + GAIN_ATTACK_TIME,
            )
            gainNode.gain.exponentialRampToValueAtTime(
              GAIN_NEAR_SILENT,
              releaseEnd,
            )

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.start()
            oscillator.stop(audioContext.currentTime + durationSeconds)

            oscillator.onended = () => {
              gainNode.disconnect()
              resume(Effect.succeed(Message.CompletedPlayNote({ noteIndex })))
            }
          },
        )
      }).pipe(
        Effect.catchTag('ResourceNotAvailable', () =>
          Effect.sleep(Duration.millis(DURATION_MILLISECONDS[duration])).pipe(
            Effect.map(() => Message.CompletedPlayNote({ noteIndex })),
          ),
        ),
      )
  },
})

export const EffectsLayer = Layer.mergeAll(
  DelayAdvanceNotePlayerPhase.layer,
  PlayNote.layer,
  managedResources.audioContext.layer,
)
