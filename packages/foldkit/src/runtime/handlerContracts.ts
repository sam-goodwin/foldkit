import type { Scoped } from '../block/scope.js'
import type { Handler as CommandHandler } from '../command/handler.js'
import type { Handler as ManagedResourceHandler } from '../managedResource/handler.js'
import type { Handler as MountHandler } from '../mount/handler.js'
import type { Handler as SubscriptionHandler } from '../subscription/handler.js'

type HandlerName<Name extends string, OwnerId extends string | never> = [
  OwnerId,
] extends [never]
  ? Name
  : Name extends `${string}/${infer LocalName}`
    ? LocalName
    : Name

interface HandlerEntryShape {
  readonly key: string
  readonly contract: unknown
}

interface HandlerEntryValue<Key extends string, Contract> {
  readonly key: Key
  readonly contract: Contract
}

type LocalHandlerEntry<Requirements, OwnerId extends string | never> =
  Requirements extends CommandHandler<infer Name, infer _Args, infer _Message>
    ? HandlerEntryValue<`Command/${HandlerName<Name, OwnerId>}`, Requirements>
    : Requirements extends SubscriptionHandler<
          infer Name,
          infer _Dependencies,
          infer _Message
        >
      ? HandlerEntryValue<
          `Subscription/${HandlerName<Name, OwnerId>}`,
          Requirements
        >
      : Requirements extends MountHandler<
            infer Name,
            infer _Input,
            infer _Message
          >
        ? HandlerEntryValue<`Mount/${HandlerName<Name, OwnerId>}`, Requirements>
        : Requirements extends ManagedResourceHandler<
              infer Name,
              infer _Params,
              infer _Value
            >
          ? HandlerEntryValue<
              `ManagedResource/${HandlerName<Name, OwnerId>}`,
              Requirements
            >
          : never

type HandlerEntry<Requirements, OwnerId extends string | never> =
  Requirements extends Scoped<infer Path, infer Contract>
    ? LocalHandlerEntry<Contract, OwnerId> extends infer Entry extends
        HandlerEntryShape
      ? HandlerEntryValue<`${Path}/${Entry['key']}`, Requirements>
      : never
    : LocalHandlerEntry<Requirements, OwnerId>

type UnionToIntersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never

type ContractsByKey<Entries extends HandlerEntryShape> = {
  [Entry in Entries as Entry['key']]: Entry['contract']
}

type ConflictingKeys<Index> = {
  [Key in keyof Index]: [Index[Key]] extends [UnionToIntersection<Index[Key]>]
    ? never
    : Key
}[keyof Index]

type ValidHandlerKindContracts<
  Requirements,
  OwnerId extends string | never = never,
> = [Requirements] extends [never]
  ? unknown
  : HandlerEntry<Requirements, OwnerId> extends infer Entries
    ? [Entries] extends [HandlerEntryShape]
      ? ConflictingKeys<ContractsByKey<Entries>> extends infer Conflicts
        ? [Conflicts] extends [never]
          ? unknown
          : Readonly<{
              'Conflicting Foldkit handler contracts': Conflicts
            }>
        : never
      : unknown
    : unknown

/** @internal Rejects incompatible handler contracts sharing one Context key. */
export type ValidHandlerContracts<
  Requirements,
  OwnerId extends string | never = never,
> = ValidHandlerKindContracts<Requirements, OwnerId>
