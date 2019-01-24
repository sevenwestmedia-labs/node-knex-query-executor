import Knex from 'knex'
import {
    ExecuteResult,
    GetQueryArgs,
    GetQueryResult,
    TableNames,
    Tables,
    Query,
    QueryWrapper
} from '.'

export class QueryExecutor<
    TTableNames extends string,
    Services extends object
> {
    protected tables: Tables<TTableNames>

    constructor(
        public kind: 'read-query-executor' | 'unit-of-work-query-executor',
        protected knex: Knex | Knex.Transaction,
        protected services: Services,
        protected tableNames: TableNames<TTableNames>,
        protected wrapQuery?: QueryWrapper
    ) {
        this.tables = Object.keys(tableNames).reduce<any>((acc, tableName) => {
            acc[tableName] = () => {
                return performWrap(
                    knex(tableNames[tableName as TTableNames]),
                    this.wrapQuery
                )
            }

            return acc
        }, {})
    }

    /** Helper to create type safe queries */
    createQuery<QueryArguments = object, QueryResult = any>(
        query: Query<QueryArguments, QueryResult, TTableNames, Services>
    ) {
        return query
    }

    execute<Q extends Query<any, any, TTableNames, Services>>(
        query: Q,
        args: GetQueryArgs<Q>
    ): ExecuteResult<GetQueryResult<Q>> {
        return query(
            {
                query: getQuery => {
                    return performWrap(getQuery(this.knex), this.wrapQuery)
                },
                queryExecutor: this,
                tables: this.tables,
                args,
                tableNames: this.tableNames,
                ...this.services
            },
            args
        )
    }
}

function performWrap(
    queryToWrap: Knex.QueryBuilder | Knex.Raw,
    wrapper: QueryWrapper | undefined
) {
    if (!wrapper) {
        return queryToWrap
    }

    if (typeof wrapper === 'function') {
        return wrapper(queryToWrap as any)
    }

    if (isRawQuery(queryToWrap)) {
        if (!wrapper.rawQueryWrapper) {
            return queryToWrap
        }

        return wrapper.rawQueryWrapper(queryToWrap)
    }

    if (wrapper.queryBuilderWrapper) {
        return wrapper.queryBuilderWrapper(queryToWrap)
    }

    return queryToWrap
}

function isRawQuery(query: Knex.Raw | Knex.QueryBuilder): query is Knex.Raw {
    return 'sql' in query
}
