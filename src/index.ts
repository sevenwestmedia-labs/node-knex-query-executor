import * as Knex from 'knex'

export const REDIRECT = 'Redirect'

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
export interface Query<
    QueryArguments,
    QueryResult,
    TableNames extends string,
    Services extends object
> {
    (options: QueryOptions<QueryArguments, TableNames, Services>): PromiseLike<
        QueryResult
    >
}

export interface QueryWrapper {
    (builder: Knex.QueryBuilder): Knex.QueryBuilder
    (builder: Knex.Raw): Knex.Raw
}

export class QueryExecutor<
    TTableNames extends string,
    Services extends object
> {
    protected tables: Tables<TTableNames>
    private wrap: QueryWrapper

    constructor(
        public kind: 'read-query-executor' | 'unit-of-work-query-executor',
        protected knex: Knex | Knex.Transaction,
        protected services: Services,
        protected tableNames: TableNames<TTableNames>,
        wrapQuery?: QueryWrapper
    ) {
        this.wrap = wrapQuery || ((b: any) => b)

        this.tables = Object.keys(tableNames).reduce<any>((acc, tableName) => {
            acc[tableName] = () => this.wrap(knex(tableName))

            return acc
        }, {})
    }

    /** Helper to create type safe queries */
    createQuery<QueryArguments, QueryResult>(
        query: Query<QueryArguments, QueryResult, TTableNames, Services>
    ): Query<QueryArguments, QueryResult, TTableNames, Services> {
        return query
    }

    execute<Result, Args>(
        query: Query<Args, Result, TTableNames, Services>
    ): { withArgs: (args: Args) => Promise<Result> } {
        return {
            withArgs: async args =>
                await query({
                    query: createQuery =>
                        this.wrap(createQuery(this.knex) as any),
                    queryExecutor: this,
                    wrapQuery: (builder: Knex.QueryBuilder) =>
                        this.wrap(builder),
                    tables: this.tables,
                    args,
                    tableNames: this.tableNames,
                    ...this.services
                })
        }
    }
}

export class UnitOfWorkQueryExecutor<
    TTableNames extends string,
    Services extends object
> extends QueryExecutor<TTableNames, Services> {
    // Unit of work executor can be used as a normal query executor
    kind!: 'unit-of-work-query-executor'

    constructor(
        protected knex: Knex.Transaction,
        services: Services,
        tableNames: TableNames<TTableNames>
    ) {
        super('unit-of-work-query-executor', knex, services, tableNames)
    }
}

export class ReadQueryExecutor<
    TTableNames extends string,
    Services extends object
> extends QueryExecutor<TTableNames, Services> {
    kind!: 'read-query-executor'

    constructor(
        knex: Knex,
        services: Services,
        tableNames: TableNames<TTableNames>
    ) {
        super('read-query-executor', knex, services, tableNames)
    }

    /**
     * Executes some work inside a transaction
     * @param work a callback which contains the unit to be executed
     * The transaction will be commited if promise resolves, rolled back if rejected
     * @example executor.unitOfWork(unit => unit.executeQuery(insertBlah, blah))
     */
    unitOfWork<T>(
        work: (
            executor: UnitOfWorkQueryExecutor<TTableNames, Services>
        ) => Promise<T>
    ): PromiseLike<any> {
        return this.knex.transaction(trx => {
            // knex is aware of promises, and will automatically commit
            // or reject based on this callback promise
            return work(
                new UnitOfWorkQueryExecutor(trx, this.services, this.tableNames)
            )
        })
    }
}
