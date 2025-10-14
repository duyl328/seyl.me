---
date: 2025-01-19
tags:
  - JDBC
  - Notes
lastUpdated: 2025-01-20T10:10:00
---
## PreparedStatement的使用

- 可以通过调用 Connection 对象的 preparedStatement(String sql) 方法获取 PreparedStatement 对象

- PreparedStatement 接口是 Statement 的子接口，它表示一条预编译过的 SQL 语句

- PreparedStatement 对象所代表的 SQL 语句中的参数用问号(?)来表示，

调用 PreparedStatement 对象的 setXxx() 方法来设置这些参数. setXxx() 方法有两个参数，

第一个参数是要设置的 SQL 语句中的参数的索引(从 1 开始)，

第二个是设置的 SQL 语句中的参数的值

## PreparedStatement和Statement的区别

PreparedStatement 解决了SQL注入问题

Statement 是预编译一次执行一次，PreparedStatement 是编译一次，可执行N次。PreparedStatement 效率更高。

PreparedStatement会在编译阶段进行安全检查

如果业务中需要使用SQL注入的时候会使用 Statement，使用场景：在列表升序和降序的排序中，需要将内容拼入行尾
