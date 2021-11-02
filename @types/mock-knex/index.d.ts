declare module 'mock-knex' {
    import { Knex } from 'knex'

    export interface QueryDetails {
        response(value: any): void
    }

    export function getTracker(): {
        on: (
            event: 'query',
            handler: (query: QueryDetails, step: number) => void,
        ) => void
    }

    export function mock(knex: Knex): void
}
