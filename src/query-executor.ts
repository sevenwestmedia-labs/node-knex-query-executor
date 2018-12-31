import * as Knex from 'knex'

import { Tables, QueryWrapper, TableNames, Query, ExecuteResult } from '.'

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

    execute<Args, Result>(
        query: Query<Args, Result, TTableNames, Services>
    ): ExecuteResult<Args, Result> {
        return {
            withArgs: async args =>
                query({
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
