import { Knex } from 'knex'
import { ReadQueryExecutor } from '../'

declare const knex: Knex

const queryExecutor = new ReadQueryExecutor(
    knex,
    {},
    {
        testTable: 'testTable',
    },
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const exampleQuery = queryExecutor.createQuery<{ testArg: string }, string>(
    async function exampleQuery({ tableNames, tables }, args) {
        tableNames.wrongTable
        tables.wrongTable()

        return args.foo
    },
)
