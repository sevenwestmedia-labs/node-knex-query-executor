import {
    ReadQueryExecutor,
    Query,
    ExecuteResult,
    UnitOfWorkQueryExecutor,
    TableNames
} from './index'

const NoMatch = Symbol('no match')

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
export class MockQueryExecutor<
    TTableNames extends string,
    Services extends {}
> extends ReadQueryExecutor<TTableNames, Services> {
    constructor(tableNames: TableNames<TTableNames>) {
        // The real query executor should not be called so this is fine
        super(undefined as any, undefined as any, tableNames)
    }
    private mocks: Array<{
        query: Query<any, any, TTableNames, Services>
        matcher: Matcher<any, any>
    }> = []

    clear() {
        this.mocks = []
    }

    mock<Args, Result>(query: Query<Args, Result, TTableNames, Services>) {
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

    execute<Args, Result>(
        query: Query<Args, Result, TTableNames, Services>
    ): ExecuteResult<Args, Result> {
        return {
            withArgs: (args: Args) => {
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
        }
    }

    /**
     * Executes some work inside a transaction
     * @param work a callback which contains the unit to be executed
     * The transaction will be commited if promise resolves, rolled back if rejected
     * @example executor.unitOfWork(unit => unit.executeQuery(insertBlah, blah))
     */
    unitOfWork<T>(
        work: (
            executor: UnitOfWorkQueryExecutor<TTableNames, Services>
        ) => Promise<T>
    ): PromiseLike<any> {
        return work(this as any)
    }
}
