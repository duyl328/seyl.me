---
date: 2025-01-19
tags:
  - JDBC
  - Notes
lastUpdated: 2025-01-20T10:10:00
---

JDBC(Java Database Connectivity)
是一个独立于特定数据库管理系统、通用的SQL数据库存取和操作的公共接口（一组API），定义了用来访问数据库的标准Java类库，（java.sql,javax.sql）使用这些类库可以以一种标准的方法、方便地访问数据库资源。

JDBC为访问不同的数据库提供了一种统一的途径，为开发者屏蔽了一些细节问题。

JDBC的目标是使Java程序员使用JDBC可以连接任何提供了JDBC驱动程序的数据库系统，这样就使得程序员无需对特定的数据库系统的特点有过多的了解，从而大大简化和加快了开发过程。

如果没有JDBC，那么Java程序访问数据库时是这样的：

![我们认为的连接](../../public/note/JDBC/JDBC%E4%BB%8B%E7%BB%8D/img-1.webp)

有了JDBC，Java程序访问数据库时是这样的：

![真实的连接](../../public/note/JDBC/JDBC%E4%BB%8B%E7%BB%8D/img-2.webp)

总结如下：

![综述](../../public/note/JDBC/JDBC%E4%BB%8B%E7%BB%8D/img-3.webp)