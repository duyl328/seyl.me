---
date: 2025-01-19
tags:
  - Notes
  - MySql
lastUpdated: 2025-01-20T10:10:00
---

## 卸载MySQL

1. 双击安装包，点击下一步，然后点击remove。卸载。
2. 手动删除Program Files中的MySQL目录。
3. 手动删除ProgramData目录（这个目录是隐藏的。）中的MySQL。

## 修改mysql的root密码

### 方法1： 用SET PASSWORD命令

首先登录MySQL。

格式：
```sql
mysql> set password for 用户名@localhost = password('新密码');
```

例子：
```sql
mysql> set password for root@localhost = password('123');
```

### 方法2：用mysqladmin

格式：mysqladmin -u用户名 -p旧密码 password 新密码

例子：
```sql
mysqladmin -uroot -p123456 password 123
```

### 方法3：用UPDATE直接编辑user表

首先登录MySQL。

```sql
mysql> use mysql;

mysql> update user set password=password('123') where user='root' and host='localhost';

mysql> flush privileges;

```

### 方法4：在忘记root密码的时候，可以这样

以windows为例：

1. 关闭正在运行的MySQL服务。

2. 打开DOS窗口，转到mysql\bin目录。

3. 输入mysqld --skip-grant-tables 回车。--skip-grant-tables 的意思是启动MySQL服务的时候跳过权限表认证。

4. 再开一个DOS窗口（因为刚才那个DOS窗口已经不能动了），转到mysql\bin目录。

5. 输入mysql回车，如果成功，将出现MySQL提示符 >。

6. 连接权限数据库： use mysql; 。

7. 改密码：update user set password=password("123") where user="root";（别忘了最后加分号） 。

8. 刷新权限（必须步骤）：flush privileges; 。

9. 退出 quit。

10. 注销系统，再进入，使用用户名root和刚才设置的新密码123登录。

## MySQL的启停

```shell
Net stop 服务名称
```

```shell
Net start 服务名称
```

## 登录MySQL

使用bin目录下的mysql.exe命令来连接服务器
![显式密码输入](../../public/note/MySql/MySql%E7%9A%84%E5%8D%B8%E8%BD%BD%E4%B8%8E%E5%AF%86%E7%A0%81%E4%BF%AE%E6%94%B9/img-1.webp)

本地登录（隐藏密码形式）：
![隐式密码输入](../../public/note/MySql/MySql%E7%9A%84%E5%8D%B8%E8%BD%BD%E4%B8%8E%E5%AF%86%E7%A0%81%E4%BF%AE%E6%94%B9/img-2.webp)























