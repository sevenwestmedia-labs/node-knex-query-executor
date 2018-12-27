import * as Knex from 'knex'
import { QueryExecutor, ReadQueryExecutor, Query } from '../'

declare const knex: Knex

const tableNames = {
    testTable: 'testTable'
}

const queryExecutor = new ReadQueryExecutor(knex, {}, tableNames)

const exampleQuery = queryExecutor.createQuery<{ testArg: string }, string>(
    async function exampleQuery({ args, tableNames, tables }) {
        tableNames.wrongTable
        tables.wrongTable()

        return args.foo
    }
)
