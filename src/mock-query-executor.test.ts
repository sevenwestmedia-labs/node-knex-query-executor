import { MockQueryExecutor } from '.'

it('can mock query', async () => {
    const queryExecutor = new MockQueryExecutor()
    const exampleQuery = queryExecutor.createQuery<{}, number[]>(async () => {
        throw new Error('Should not be called')
    })

    // Setup the mock in the query executor, returning the same value no matter the args
    queryExecutor.mock(exampleQuery).match(() => {
        return [1]
    })

    // Execute the query as normal
    const result = await queryExecutor.execute(exampleQuery, {})

    expect(result).toEqual([1])
})

it('can match specific query args', async () => {
    const queryExecutor = new MockQueryExecutor()
    const exampleQuery = queryExecutor.createQuery<{ param: string }, number>(
        async () => {
            throw new Error('Should not be called')
        },
    )

    // Setup the mock in the query executor, returning the same value no matter the args
    queryExecutor.mock(exampleQuery).match(({ param }) => {
        if (param === 'first') {
            return 1
        }
        return 2
    })

    // Execute the query as normal
    const result = await queryExecutor.execute(exampleQuery, { param: 'first' })
    const result2 = await queryExecutor.execute(exampleQuery, {
        param: 'other',
    })

    expect(result).toEqual(1)
    expect(result2).toEqual(2)
})
