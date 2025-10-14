---
layout: doc
title: 在JavaScript获取Promise的状态
date: 2022-08-09
tags:
  - 编程
  - 学习
  - JavaScript
  - Blog
  - 原创
head:
  - - meta
    - name: keywords
      content: js javascript
editLink: false
lastUpdated: 2025-01-20T10:08:00
---
# {{ $frontmatter.title }}

>  :black_nib: 文章摘要

<!-- DESC SEP -->

这篇文章讨论了如何同步地获取 JavaScript Promise 对象的状态。通过一个 Stack Overflow 上的解决方案，文章介绍了如何使用
Promise.race() 方法判断 Promise 的状态。

关键内容总结：
问题：如何在执行过程中同步地检查一个 Promise 的状态？
解决方案：文章通过 Promise.race() 方法对 Promise 和一个额外的 target 对象进行竞赛（race）。根据返回的对象，判断 Promise 是否处于
pending（待定）、fulfilled（已完成）或 rejected（已拒绝）状态。
代码分析：
通过创建一个 target 对象，Promise.race() 在 Promise 和 target 中最先完成的会决定返回值。
如果 Promise 未完成，则返回 pending；如果已完成且无错误，则返回 fulfilled；如果发生错误，则返回 rejected。
注意事项：Promise.race() 中的顺序很重要，确保 promise 在前，否则可能会影响结果。
这个方法利用了 Promise.race() 的特性，巧妙地判断了 Promise 的状态。

<!-- DESC SEP -->

# 写在前面

本文属于对`stackoverflow`中写法的解析，原文链接：[**Stack Overflow
** ](https://stackoverflow.com/questions/30564053/how-can-i-synchronously-determine-a-javascript-promises-state)

如果你在其他环境下遇到同样问题，这个[文章](https://blog.csdn.net/Lee_01/article/details/124892590)可能也会有帮助

# 问题复现

如何在代码执行过程中获取到`promise`的状态？

如果你想寻找或尝试通过原生的属性，或者指定API进行访问，基本可以放弃了，我也是看了很多博客的确没找到，如果您找了其他方式，还望指教

# 解决方式

本文中提到的解决方式主要是继续`stackoverflow`中提供的解决方式【完整代码】

  ```js
  /**
 * 传入需要测试的 Promise 对象，将对应结果返回
 * @param promise 需要测试的 Promise 对象
 * @return {Promise<string>}
 */
const promiseState = promise => {
        const target = {}
        return Promise.race([promise, target]).then(
            value => (value === target) ? 'pending' : 'fulfilled',
            () => 'rejected',
        )
    }

// 测试代码
let a = Promise.resolve();
let b = Promise.reject();
let c = new Promise(() => {});

promiseState(a).then(state => console.log(state)); // fulfilled
promiseState(b).then(state => console.log(state)); // rejected
promiseState(c).then(state => console.log(state)); // pending
  ```

这种方式通过`promise`中的`race()`方法来进行了状态的判断，非常奇妙的一种方式

# 代码分析

1. 在方法中会接收一个`promise`对象，开始了整个方法

2. 进入方法后会先创建一个`target`对象，这个对象只用于后续的匹配，没有其他含义

   ```js
   const target = {}
   ```

3. 然后开始最核心的部分，因为`stackoverflow`中对代码进行简写，可以先进行代码的还原

   ```js
   return Promise.race([promise, target]).then(
                   // 成功回调
                   value => {
                       return (value === target) ? 'pending' : 'fulfilled'
                   },
                   // 失败回调
                   () => {
                       return 'rejected'
                   },
           )
   ```

   可以复现出这种结构，`promise`的`race`开始后，接收两个对象，一个为刚刚创建的`target`对象，还有一个是接收到的`promise`
   对象，当两个其中一个状态结束时，整个`Promise.race()`结束，这时分为三种情况

    1. 当传入的`promise`为`pending`状态时，`Promise.race`会找到最先有确定状态的元素，并将其返回，因为`promise`
       没有结束，那么返回值对象会接收到定义的`target`，因为`target`的状态是确定的，这时`value`接收到的值就是已经确定状态的
       `target`，如果进行对比，那么他们两个一定是相等的，这时也就是返回`pending`
    2. 当传入的`promise`为`fulfilled`状态时，相当于`promise`已经有确定的值了，`Promise.race`
       匹配到第一个直接结束，并将匹配到的内容返回，返回的内容因为是一个全新的对象，对象的内存地址不可能相等，所以判断结果是
       `false`，也就返回`fulfilled`
    3. 当传入的`promise`为`rejected`状态时，`promise`状态确定，那么因为状态报错，直接进入`catch`中，走失败回调，这个回调一旦执行，就可以判定
       `promsie`结束，并且内容出现报错，直接返回`rejected`即可
    4. 在调用的时候，因为返回的时会将对应的状态通过`promise`返回，所以直接通过调用方法之后的`then`中指定回调来完成状态的获取

    - **值得注意的是**：`Promise.race()`在匹配的过程中，一定保证要判断的`promise`在前，因为只有当`promise`
      状态不确定时才会判断第二个内容的状态，如果将状态已经确定的`target`放在第一个，那么将不会再进行`promise`的判断，返回结果永远为
      `fulfilled`

    - 并且因为`catch`有两种形式，可以进行变形，这种形式可能更常见（根据个人习惯了）

      ```js
      const promiseState = promise => {
          const target = {}
          return Promise.race([promise, target]).then(
                  value => {
                      return (value === target) ? 'pending' : 'fulfilled'
                  },
          ).catch(() => {
              return 'rejected'
          })
      }
      ```
