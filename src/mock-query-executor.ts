import { ExecuteResult, GetQueryArgs, GetQueryResult, Query } from '.'
import { ReadQueryExecutor } from './read-query-executor'
import { UnitOfWorkQueryExecutor } from './unit-of-work-query-executor'
export const NoMatch = Symbol('no match')

export type Matcher<Args, Result> = (args: Args) => typeof NoMatch | Result

/**
 * Enables mocking of queries. Use .mock(myQuery) then chain
 * .match functions which can match on the query args and return mocked results
 *
 * @example
 * mockQueryExecutor
 *    .mock(queryName)
 *    .match((args) => {
 *        if (args.someProp === '1') {
 *           return myResult
 *        }
 *
 *        return NoMatch
 *    })
 *    .match((args) => {
 *        if (args.someProp === '2') {
 *           return myResult2
 *        }
 *
 *        return NoMatch
 *    })
 */
export class MockQueryExecutor extends ReadQueryExecutor<any, any> {
    // Making kind `any` on the executor means it's compatible with all QueryExecutors
    kind: any

    constructor() {
        // The real query executor should not be called so this is fine
        super(undefined as any, undefined as any, {} as any)
    }
    private mocks: Array<{
        query: Query<any, any, any, any>
        matcher: Matcher<any, any>
    }> = []

    clear() {
        this.mocks = []
    }

    mock<Args, Result>(query: Query<Args, Result, any, any>) {
        const mocker = {
            match: (getResult: Matcher<Args, Result>) => {
                this.mocks.push({
                    query,
                    matcher: getResult
                })
                return mocker
            }
        }
        return mocker
    }

    execute<Q extends Query<any, any, any, any>>(
        query: Q,
        args: GetQueryArgs<Q>
    ): ExecuteResult<GetQueryResult<Q>> {
        for (const mock of this.mocks) {
            if (mock.query === query) {
                const matcherResult = mock.matcher(args)
                if (matcherResult !== NoMatch) {
                    return new Promise(resolve => {
                        // Using setTimeout so this is not synchronous
                        setTimeout(() => {
                            resolve(matcherResult)
                        }, 0)
                    })
                }
            }
        }
        throw new Error(
            `No matcher for query ${query.name || 'unnamed function'}`
        )
    }

    /**
     * Executes some work inside a transaction
     * @param work a callback which contains the unit to be executed
     * The transaction will be commited if promise resolves, rolled back if rejected
     * @example executor.unitOfWork(unit => unit.executeQuery(insertBlah, blah))
     */
    unitOfWork<T>(
        work: (executor: UnitOfWorkQueryExecutor<any, any>) => Promise<T>
    ): PromiseLike<any> {
        return work(this as any)
    }
}
