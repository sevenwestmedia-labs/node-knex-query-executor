# Node query executor

A simple library which enables encapsulation of knex queries inside functions. It enables inversion of control for database queries, making it easy to mock the database layer entirely while making database queries themselves easy to test.

## Why

Using knex directly in code means often it is hard to create re-usable database queries, to avoid this the queries are put into functions and the `knex` instance passed into those function. This approach is hard to test and often results in many queries being written inline in places query code should not be written directly.

By forcing all queries to be encapsulated it encourages reuse of queries and building a collection of well tested queries.

## Usage

This library extends this concept to introduce a `QueryExecutor` which can be instructed to execute queries. There are 3 variations, the `ReadQueryExecutor` which is the entry point, when the `unitOfWork` function is called a `UnitOfWorkQueryExecutor` is passed in the callback, everything inside this callback will be executed inside a transaction. If the promise rejects the transaction will be rolled back.

### Constructor

The query executor is a class, to start using it you need to create an instance of the `ReadQueryExecutor`.

```ts
new ReadQueryExecutor(
    // The knex instance
    knex,
    // The services object is available to all queries, ie a logger
    {
        logger
    },
    // Table names is an object with the tables you would like to access,
    // mapping from the JS name to the database table name
    {
        tableOne: 'table-one'
    }
)
```

### Testing

## Further reading

This library is inspired by a few more OO patterns, and a want to move away from repositories.

https://en.wikipedia.org/wiki/Specification_pattern
https://martinfowler.com/eaaCatalog/queryObject.html
https://lostechies.com/chadmyers/2008/08/02/query-objects-with-the-repository-pattern/
https://codeopinion.com/query-objects-instead-of-repositories/
