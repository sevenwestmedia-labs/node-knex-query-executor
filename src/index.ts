import { Knex } from 'knex'
import { MockQueryExecutor, NoMatch } from './mock-query-executor'
import { QueryExecutor } from './query-executor'
import { ReadQueryExecutor } from './read-query-executor'
import { UnitOfWorkQueryExecutor } from './unit-of-work-query-executor'

export {
    MockQueryExecutor,
    NoMatch,
    QueryExecutor,
    ReadQueryExecutor,
    UnitOfWorkQueryExecutor,
}

export type Tables<TTableNames extends string> = {
    [table in TTableNames]: () => Knex.QueryBuilder
}

export type TableNames<TTableNames extends string> = {
    [table in TTableNames]: string
}

type QueryOptions<
    TTableNames extends string,
    Services extends {}
> = Services & {
    /**
     * Gives raw access to knex, while still allowing the query to be
     * tracked/benchmarked
     */
    query: (
        createQuery: (knex: Knex) => Knex.QueryBuilder | Knex.Raw,
    ) => Knex.QueryBuilder | Knex.Raw
    tables: Tables<TTableNames>
    tableNames: TableNames<TTableNames>
    queryExecutor: QueryExecutor<TTableNames, Services>
}

export type Query<
    QueryArguments,
    QueryResult,
    TTableNames extends string,
    Services extends object
> = (
    options: QueryOptions<TTableNames, Services>,
    args: QueryArguments,
) => PromiseLike<QueryResult>

export type ExecuteResult<Result> = PromiseLike<Result>

export interface QueryWrapperFn {
    (builder: Knex.QueryBuilder): Knex.QueryBuilder
    (builder: Knex.Raw): Knex.Raw
}

export type QueryWrapper =
    | QueryWrapperFn
    | {
          rawQueryWrapper?: (builder: Knex.Raw) => Knex.Raw
          queryBuilderWrapper?: (
              builder: Knex.QueryBuilder,
          ) => Knex.QueryBuilder
      }

export type GetQueryArgs<T> = T extends Query<infer P, any, any, any>
    ? P
    : never

export type GetQueryResult<T> = T extends Query<any, infer P, any, any>
    ? P
    : never
