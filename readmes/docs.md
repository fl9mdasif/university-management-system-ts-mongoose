# Transaction a Rollback

## 4 principle of Transaction and Rollback (ACID)

1. Atomic (all or nothing rule)
2. Consistence
3. Isolation
4. Durability

## When should we use Transaction?

ans: When we use two or more write operation in database

## Transaction steps

await startSession() //1
try{

    await startTransaction() //2
    await session.commitTransaction(); // step 4 (save data into database)
    await session.endSession() // step 5

}catch (err) {
await session.abortTransaction();
await session.endSession();
}

### types of error's

1. Operational error
2. Programmatic error
3. unhandled rejection
4. Uncaught exception

# problem I have been facing in my application

1.
2. update student required name
3.
4.

### field filtering with `method chaining`

```query
query.select('name email') // include name and email exclude other fields
// rest api link =>  link?field=name,email
```
