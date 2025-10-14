---
layout: doc
title: tauri 中创建和管理全局 emit 任务
date: 2025-01-21
tags:
  - 编程
  - Blog
  - 原创
  - tauri
  - rust
  - argus
  - 思考
  - tokio
head:
  - - meta
    - name: description
      content: 本文详细介绍了如何在 Tauri 中使用全局 Emit 机制来触发错误信息传递，解决后端错误处理问题。通过创建后台异步任务和管理全局事件，实现在没有前端 command 触发的情况下，后端能够主动触发前端事件的解决方案。
  - - meta
    - name: keywords
      content: Tauri emit  Tauri错误处理  Tauri全局事件 Tauri后端 emit触发  Tauri command 与 emit  Tauri异步任务管理  Tauri后端错误传递  Tauri frontend emit  Tauri异步错误处理
editLink: false
lastUpdated: 2025-01-21T10:34:34
---
# Tauri 全局 Emit 任务管理与错误处理机制


> :black_nib: 文章摘要

<!-- DESC SEP -->
在 Tauri 中，前端通过 `listen` API 来监听特定事件，而后端则通过 `AppHandle` 中的 `emit` 方法触发这些事件。然而，由于 `AppHandle` 的生命周期问题，它不能作为全局对象存储，这就引发了一个问题：如何在没有前端 `command` 触发的情况下，从后端触发全局的 `emit`。

为了解决这个问题，笔者提出了一种通过创建异步任务管理器的方法。通过使用 Tokio 创建一个后台线程来监听 `mpsc` 通道，后端可以通过该通道发送全局错误消息。当错误发生时，消息通过通道发送到前端，前端通过 `emit` API 处理并展示这些信息。此方案避免了 `AppHandle` 的生命周期问题，并保证了全局事件的触发机制。
<!-- DESC SEP -->
## 前言{#preface}
当在使用 `tauri` 时，可以使用其提供的 `command` 通过前端来调用后端，也可以使用 `emit` 通过后端来调用前端，当后端发生错误时，我们需要一种机制将错误信息传递到前端并进行处理。传统的 `command` 机制依赖于前端调用，而 `emit` 则更适合处理这种场景，因为它支持多个事件的触发。通过在多个地方绑定相同的事件，后端可以通过触发 `emit` 来统一通知前端进行错误处理。

基于此就可以做出很多事情，其中之一就是当后端运行出错时，可以通过全局的 `emit` 将错误信息传递到前端，并通过前端进行展示，或者提示用户错误错误处理，因为后端的报错是不可预知的，所以对于该 `emit` 来说，也应该是全局的，随时可以调用的。

## `emit` 介绍{#emit-introduce}
我们先介绍 `tauri` 中是如何做到 `emit` 的触发和绑定的

#### 前端监听
NPM 软件包提供了用于侦听全局事件和特定于 webview 的事件的 API。`@tauri-apps/api`

```js{9}
import { listen } from '@tauri-apps/api/event';

type DownloadStarted = {
  url: string;
  downloadId: number;
  contentLength: number;
};

listen<DownloadStarted>('download-started', (event) => {
  console.log(
    `downloading ${event.payload.contentLength} bytes from ${event.payload.url}`
  );
});
```

绑定方式通过对一个 '频道' 进行监听，然后来监控是否触发，可以定义接收的数据类型来传递数据

#### 后端触发
```rust{4}
use tauri::{AppHandle, Emitter};

#[tauri::command]
fn download(app: AppHandle, url: String) {
  app.emit("download-started", &url).unwrap();
  for progress in [1, 15, 50, 80, 100] {
    app.emit("download-progress", progress).unwrap();
  }
  app.emit("download-finished", &url).unwrap();
}
```

后端的触发使用 `AppHandle` 中提供的 `emit` 函数，调用时
1. 通过前端调用后端提供的指令`download` 然后将对应的链接(`url`)传递进来
2. 而 `app: AppHandle` 则由 `tauri` 自动填充，这里的 `app` 就是软件的实例
3. 当拿到 `app` 后，使用其 `emit` 函数进行触发，从而触发前端的监听

整个过程在类似点击下载，后端开始下载，并且前端需要展示下载进度的场景没有什么问题，不过还记得我们的目的吗？我们需要完成的是全局的 `emit` 的触发，并通过此完成错误的提示

这时就会造成一个很严重的问题 :

> 我们的错误是不可预知的，而前端 `emit` 的触发是需要 `AppHandle` 的，> `AppHandle` 作为 Tauri 应用的实例对象，其生命周期和应用的运行状态密切相关，因此不能存储为全局静态对象。在常规情况下，`emit` 触发需要通过 `AppHandle`，但如果依赖前端的 `command` 触发 `emit`，就会陷入循环问题。为了避免这一问题，我们采用了异步线程管理，通过 `tokio` 和 `mpsc` 通道将事件传递给前端。

## 想法{#think}
我们重新整理一下现在需要做什么，现在需要将后端错误通过全局的 `emit` 进行前端，并且想要触发就需要 `AppHandle` ；并且不能将其存储为静态内容。

不过仔细观察官方提供的示例，我们的确无法将 `AppHandle` 进行存储，但是就像官方实例中那样，通过 `Command` 不仅可以拿到 `AppHandle` 实例，还可以通过 `while` 等循环方式让 `emit` 多次触发。
不过我们可以在 `command` 调用时，可以通过 `takio` 创建一个消息等待的线程，并 `takio` 的消息通知渠道保存起来，通过消息通知来传递触发对应的事件

## 创建通用线程处理{#common-thread-processing}
主要的思路是，创建对应的全局的后台任务处理，并通过循环等待

创建一个通用的任务管理器：
``` rust:line-numbers
pub async fn task_h<T, F>(mut rx: mpsc::Receiver<T>, f: F)  
where  
    F: Fn(T),  
{  
    // 无限循环确保 Receiver 一直保持活跃  
    loop {  
        match rx.recv().await {  
            Some(task) => {  
                f(task);  
            }  
            None => {  
                // 如果通道关闭，可以选择如何处理（这里是等待并继续）  
                println!("通道关闭，继续等待...");  
            }  
        }  
    }  
}
```

`task_h` 函数是一个异步任务管理器，它通过 `mpsc` 通道不断接收任务并执行相应的处理。这个函数的作用是确保事件能够在后台持续触发，而不会受到生命周期的限制。`emit_global_msg` 则是一个全局任务初始化函数，它在首次调用时设置状态并启动一个新的线程来处理错误信息的传递。

使用时，通过将要调用的函数，传递的数据都传递过来，根据我们需求，将会是这样：

```rust{22}
#[tauri::command]  
pub fn emit_global_msg(app: AppHandle) {  
    let mut is_init = GLOBAL_EMIT_IS_INIT.lock().unwrap();  
    if is_init.clone() {  
        return;  
    }  
    println!("前端 emit 初始化!");  
    *is_init = true;  
  
    let mut emit = GLOBAL_EMIT_APP_HANDLE.lock().unwrap();  
    let (emit_tx, emit_rx) = mpsc::channel::<String>(100);  
    *emit = Some(emit_tx);  
    let f = move |info: String| {  
        app.clone().emit(global_front_emit::GLOBAL_ERROR_MSG_DISPLAY, info).unwrap();  
    };  
  
    // 在一个新的线程中启动 Tokio 运行时  
    thread::spawn(move || {  
        // 创建 Tokio 运行时并运行异步任务  
        let runtime = tokio::runtime::Runtime::new().unwrap();  
        runtime.block_on(async move {  
            task_h(emit_rx, f).await;  
        });  
    });  
}
```

`GLOBAL_EMIT_APP_HANDLE` 和 `GLOBAL_EMIT_IS_INIT` 分别用于管理全局事件的发送者和初始化状态。通过 `lock` 锁定这些全局状态，确保多次调用时不会重复初始化，从而避免不必要的资源浪费和逻辑错误。

获取到 `AppHandle` 后，我们创建一个闭包，并将具体逻辑传入其中。由于该函数会多次触发，我们需要将 `AppHandle` 移入闭包并进行克隆使用。所有的内容准备好后，创建一个新的 `channel` 将`发送者`保存为全局对象，以供后期使用，而`接收者`交给新线程的任务处理者使用。

最后，通过 `thread::spawn` 启动一个新的线程，并创建一个 `tokio` 运行时来单独运行。

这个函数在进入运行时后，将一直循环和等待任务，`AppHandle` 会被劫持在其中

调用时：
```rust{14}
let emit_option = {  
    let emit = GLOBAL_EMIT_APP_HANDLE.lock().unwrap();  
    emit.clone() // 移出作用域以释放锁  
};  
  
if let Some(x) = emit_option.as_ref() {  
    let ms = GlobalErrorMsg {  
        title: "标题".parse().unwrap(),  
        msg: "内容".parse().unwrap(),  
        duration: 5000,  
        kind: crate::structs::global_error_msg::GlobalErrorMsgTypeEnum::Success,  
    };  
    let result = JsonUtil::stringify(&ms).expect("数据序列化失败!");  
    let qqq = x.send(result).await;  
    if qqq.is_err() {  
        println!("发送失败！");  
    }  
}
```

通过拿到保存的`发送者`，并调用其中的 `send` 函数将数据传递到封装的函数中，以完成函数调用。
