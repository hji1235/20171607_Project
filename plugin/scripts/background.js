// 설치시 초기화 하는 이벤트 리스너
chrome.runtime.onInstalled.addListener(function() {

    // UUID 획득
    const uuid = generateUUID();

    // uuid 생성, 로컬 스토리지에 저장
    chrome.storage.local.set({ 'myUUID': uuid }, function() {
        console.log('UUID가 저장되었습니다:', uuid);
    });

    // 악플 정도 기본값 60, 로컬 스토리지에 저장
    chrome.storage.local.set({ 'severity': 60 }, function() {
        console.log('악플 정도가 저장되었습니다:', 60);
    });
});

// uuid 생성 함수
function generateUUID() {
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'comment_prediction') {
        fetch("http://localhost:3000/prediction", {
            method: "POST",
            body: JSON.stringify({message: request.message, uuid:request.uuid, severity: request.severity}),
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(response => response.json())
            .then(result => {
                sendResponse(result);
            })
            .catch(error => {
                console.error(error);
            });
        return true;
    } else if (request.action === 'get_identifier') {
        const domain = request.domain;

        fetch(`http://localhost:3000/domain?domain=${encodeURIComponent(domain)}`, {
            method: 'GET',
        })
            .then(response => response.json())
            .then(data => {
                sendResponse({identifier: data.identifier});
            })
            .catch(error => {
                console.error('Error:', error);
            });
        return true;

    } else if (request.action === "add_word") {
        const uuid = request.uuid;
        const word = request.word;

        fetch('http://localhost:3000/word/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uuid: uuid, word: word })
        })
            .then(response => response.json())
            .then(data => {
                sendResponse({result: data.result});
            })
            .catch(error => {
                console.error('Error:', error);
            });
        return true;
    }
});