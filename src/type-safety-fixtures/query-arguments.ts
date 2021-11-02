import { Knex } from 'knex'
import { ReadQueryExecutor, Query } from '../'

declare const knex: Knex

const tableNames = {
    testTable: 'testTable',
}

const queryExecutor = new ReadQueryExecutor(knex, {}, tableNames)

const exampleQuery: Query<
    { testArg: string },
    string,
    keyof typeof tableNames,
    {}
> = async function exampleQuery(_, args) {
    return args.testArg
}

// Should fail to compile with missing testArg
queryExecutor.execute(exampleQuery, {})
