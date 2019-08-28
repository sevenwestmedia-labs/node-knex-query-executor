import * as Knex from 'knex'
import { ReadQueryExecutor } from '../'

declare const knex: Knex

const queryExecutor = new ReadQueryExecutor(
    knex,
    {},
    {
        testTable: 'testTable',
    },
)

const exampleQuery = queryExecutor.createQuery<{ testArg: string }, string>(
    // tslint:disable-next-line:no-shadowed-variable
    async function exampleQuery({ tableNames, tables }, args) {
        tableNames.wrongTable
        tables.wrongTable()

        return args.foo
    },
)
