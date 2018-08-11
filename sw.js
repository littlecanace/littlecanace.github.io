`use strict`;

const
  version = '1.0.2',
  name = version + '::PWAsite',
  offlineURL = '/offline/',
  installFilesEssential = [
    '/',
    '/manifest.json',
    '/main.css',
    '/main.js',
    '/images/logo/logo152.png'
  ].concat(offlineURL),
  installFilesDesirable = [
    '/favicon.ico',
    '/images/logo/logo016.png',
    '/images/hero/power-pv.jpg',
    '/images/hero/power-lo.jpg',
    '/images/hero/power-hi.jpg'
  ];
function installStaticFiles() {
    return caches.open(name).then(function (cache) {
        cache.addAll(installFilesDesirable);
        // 通过 cache 缓存对象的 addAll 方法添加 precache 缓存
        return cache.addAll(installFilesEssential);
    });

}
// clear old caches
function clearOldCaches() {

    return caches.keys().then(function (cacheList) {
        return Promise.all(
            cacheList.map(function (cacheName) {
                if (cacheName !== name) {
                    return caches.delete(cacheName);
                }
            })
        );
    });

}
// 监听 service worker 的 install 事件
this.addEventListener('install', function (event) {
    // 如果监听到了 service worker 已经安装成功的话，就会调用 event.waitUntil 回调函数
    event.waitUntil(
        installStaticFiles().then(() => {
            self.skipWaiting();
        })
    );
});
self.addEventListener('activate', function (event) {
    event.waitUntil(
        clearOldCaches().then(() => {
            self.clients.claim();
        })
        /*Promise.all([

            // 更新客户端
            self.clients.claim(),

            // 清理旧版本
            caches.keys().then(function (cacheList) {
                return Promise.all(
                    cacheList.map(function (cacheName) {
                        if (cacheName !== name) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])*/
    );
});
this.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            // 来来来，代理可以搞一些代理的事情

            // 如果 Service Worker 有自己的返回，就直接返回，减少一次 http 请求
            if (response) {
                return response;
            }

            // 如果 service worker 没有返回，那就得直接请求真实远程服务
            var request = event.request.clone(); // 把原始请求拷过来
            return fetch(request).then(function (httpRes) {

                // http请求的返回已被抓到，可以处置了。

                // 请求失败了，直接返回失败的结果就好了。。
                if (!httpRes || httpRes.status !== 200) {
                    return httpRes;
                }

                // 请求成功的话，将请求缓存起来。
                var responseClone = httpRes.clone();
                caches.open(name).then(function (cache) {
                    cache.put(event.request, responseClone);
                });

                return httpRes;
            });
        })
    );
});