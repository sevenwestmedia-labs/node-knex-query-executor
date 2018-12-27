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
    Scope extends {},
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
    queryExecutor: QueryExecutor<TTableNames, Scope, Services>
}
export interface Query<
    QueryArguments,
    QueryResult,
    TableNames extends string,
    Scope extends object,
    Services extends object
> {
    (
        options: QueryOptions<QueryArguments, TableNames, Scope, Services>
    ): PromiseLike<QueryResult>
}

export interface QueryWrapper<Scope> {
    (builder: Knex.QueryBuilder, scope: Scope): Knex.QueryBuilder
    (builder: Knex.Raw, scope: Scope): Knex.Raw
}

export class QueryExecutor<
    TTableNames extends string,
    Scope extends object,
    Services extends object
> {
    kind: 'query-executor' | 'unit-of-work-query-executor' = 'query-executor'
    protected tables: Tables<TTableNames>
    private wrap: QueryWrapper<Scope>

    constructor(
        protected knex: Knex | Knex.Transaction,
        protected scope: Scope,
        protected services: Services,
        protected tableNames: TableNames<TTableNames>,
        wrapQuery?: QueryWrapper<Scope>
    ) {
        this.wrap = wrapQuery || ((b: any) => b)

        this.tables = Object.keys(tableNames).reduce<any>((acc, tableName) => {
            acc[tableName] = () => this.wrap(knex(tableName), scope)

            return acc
        }, {})
    }

    execute<Result, Args>(
        query: Query<Args, Result, TTableNames, Scope, Services>
    ): { withArgs: (args: Args) => Promise<Result> } {
        return {
            withArgs: async args =>
                await query({
                    query: createQuery =>
                        this.wrap(createQuery(this.knex) as any, this.scope),
                    queryExecutor: this,
                    wrapQuery: (builder: Knex.QueryBuilder) =>
                        this.wrap(builder, this.scope),
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
    Scope extends object,
    Services extends object
> extends QueryExecutor<TTableNames, Scope, Services> {
    // Unit of work executor can be used as a normal query executor
    kind: 'unit-of-work-query-executor' = 'unit-of-work-query-executor'

    constructor(
        protected knex: Knex.Transaction,
        scope: Scope,
        services: Services,
        tableNames: TableNames<TTableNames>
    ) {
        super(knex, scope, services, tableNames)
    }
}

export class ReadQueryExecutor<
    TTableNames extends string,
    Scope extends object,
    Services extends object
> extends QueryExecutor<TTableNames, Scope, Services> {
    kind: 'query-executor' = 'query-executor'

    constructor(
        knex: Knex | Knex.Transaction,
        scope: Scope,
        services: Services,
        tableNames: TableNames<TTableNames>
    ) {
        super(knex, scope, services, tableNames)
    }

    /**
     * Executes some work inside a transaction
     * @param unit a callback which contains the unit to be executed
     * The transaction will be commited if promise resolves, rolled back if rejected
     * @example executor.unitOfWork(unit => unit.executeQuery(insertBlah, blah))
     */
    unitOfWork<T>(
        unit: (
            executor: UnitOfWorkQueryExecutor<TTableNames, Scope, Services>
        ) => Promise<T>
    ): PromiseLike<any> {
        return this.knex.transaction(async trx => {
            // knex is aware of promises, and will automatically commit
            // or reject based on this callback promise
            return unit(
                new UnitOfWorkQueryExecutor(
                    trx,
                    this.scope,
                    this.services,
                    this.tableNames
                )
            )
        })
    }
}
