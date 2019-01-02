import * as Knex from 'knex'
import { TableNames } from '.'
import { QueryExecutor } from './query-executor'

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
