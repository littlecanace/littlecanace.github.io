// 将base64的applicationServerKey转换成UInt8Array
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0, max = rawData.length; i < max; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
function subscribe(serviceWorkerReg) {
    serviceWorkerReg.pushManager.subscribe({ // 2. 订阅
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('<applicationServerKey>')
    })
    .then(function (subscription) {
        // 3. 发送推送订阅对象到服务器，具体实现中发送请求到后端api
        sendEndpointInSubscription(subscription);
    })
    .catch(function () {
        if (Notification.permission === 'denied') {
            // 用户拒绝了订阅请求
        }
    });
}
/**
 * 获取用户授权，将
 */
function askPermission() {
    return new Promise(function (resolve, reject) {
        var permissionResult = Notification.requestPermission(function (result) {
            resolve(result);
        });
        if (permissionResult) {
            permissionResult.then(resolve, reject);
        }
    }).then(function (permissionResult) {
        if (permissionResult !== 'granted') {
            throw new Error('We weren\'t granted permission.');
        }
    });
}
function subscribeUserToPush(registration, publicKey) {
    var subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
    };
    return registration.pushManager.subscribe(subscribeOptions).then(function (pushSubscription) {
        console.log("同意订阅");
        console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
        return pushSubscription;
    }).catch(function () {
        if (Notification.permission === 'denied') {
            // 用户拒绝了订阅请求
            console.log("拒绝订阅");
        }
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        var publicKey = 'BOEQSjdhorIf8M0XFNlwohK3sTzO9iJwvbYU-fuXRF0tvRpPPMGO6d_gJC_pUQwBT7wD8rKutpNTFHOHN3VqJ0A';
        navigator.serviceWorker.register('/sw.js', {scope: '/'})
            .then(function (registration) {
                if ('PushManager' in window) {
                    return Promise.all([
                        registration,
                        askPermission()
                    ]);
                }
            }).then(function (result) {
                var registration = result[0];
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                return subscribeUserToPush(registration, publicKey);
            }).then(function (subscription) {
                var body = {subscription: subscription};
                // 为了方便之后的推送，为每个客户端简单生成一个标识
                body.uniqueid = new Date().getTime();
                console.log('uniqueid', body.uniqueid);
                // 将生成的客户端订阅信息存储在自己的服务器上
                // return sendSubscriptionToServer(JSON.stringify(body));
            })
            .catch(function (err) {

                // 注册失败:(
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}