import * as Knex from 'knex'
import { MockQueryExecutor, NoMatch } from './mock-query-executor'
import { QueryExecutor } from './query-executor'
import { ReadQueryExecutor } from './read-query-executor'
import { UnitOfWorkQueryExecutor } from './unit-of-work-query-executor'

export {
    MockQueryExecutor,
    NoMatch,
    QueryExecutor,
    ReadQueryExecutor,
    UnitOfWorkQueryExecutor
}

export type Tables<TTableNames extends string> = {
    [table in TTableNames]: () => Knex.QueryBuilder
}

export type TableNames<TTableNames extends string> = {
    [table in TTableNames]: string
}

type QueryOptions<
    QueryArguments,
    TTableNames extends string,
    Services extends {}
> = Services & {
    args: QueryArguments

    /**
     * Gives raw access to knex, while still allowing the query to be
     * tracked/benchmarked
     */
    query: (
        createQuery: (knex: Knex) => Knex.QueryBuilder | Knex.Raw
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
    options: QueryOptions<QueryArguments, TTableNames, Services>
) => PromiseLike<QueryResult>

export interface ExecuteResult<Args, Result> {
    withArgs: (args: Args) => Promise<Result>
}

export interface QueryWrapper {
    (builder: Knex.QueryBuilder): Knex.QueryBuilder
    (builder: Knex.Raw): Knex.Raw
}
