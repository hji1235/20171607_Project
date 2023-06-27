// 판별결과 반환 함수
async function getResult(comment, myUUID, severity) {
    const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({action: 'comment_prediction', message: comment, uuid: myUUID, severity: severity}, resolve);
    });
    return response.result;
}

// 식별자 반환 함수
async function getIdentifier(domain) {
    return new Promise(resolve => chrome.runtime.sendMessage({action: 'get_identifier', domain: domain}, resolve))
        .then(response => response.identifier);
}

// uuid 반환 함수
async function getUUID() {
    return new Promise(resolve => chrome.storage.local.get('myUUID', result => resolve(result.myUUID)));
}

// 악플 정도 반환 함수
async function getSeverity() {
    return new Promise(resolve => chrome.storage.local.get('severity', result => resolve(result.severity)));
}

// 댓글 처리 함수
async function handleComment(commentElement, myUUID, severity, url) {
    // 이미 처리된 댓글은 건너뛰기
    if (commentElement.dataset.processed == url) return;

    if (commentElement.textContent.includes("[악성댓글]삭제된 댓글입니다.")){
        commentElement.textContent = commentElement.textContent.replace("[악성댓글]삭제된 댓글입니다.", "");
    } else if (commentElement.textContent.includes("[지정단어]삭제된 댓글입니다.")){
        commentElement.textContent = commentElement.textContent.replace("[지정단어]삭제된 댓글입니다.", "");
    }

    const result = await getResult(commentElement.textContent, myUUID, severity);
    console.log(result);
    if (result === 1) {
        console.log("[" + commentElement.textContent + "]");
        commentElement.textContent = "[악성댓글]" + "삭제된 댓글입니다.";
    } else if (result === 2){
        console.log("[" + commentElement.textContent + "]");
        commentElement.textContent = "[지정단어]" + "삭제된 댓글입니다.";
    } else {
        console.log("[" + commentElement.textContent + "]");
    }

    // 처리한 댓글에 표시 남기기
    commentElement.dataset.processed = url;
}


// 웹 페이지 로딩 완료시 실행
window.onload = async function() {
    // uuid 획득
    const myUUID = await getUUID();
    console.log("uuid : " + myUUID);

    // severity 획득
    const severity = await getSeverity();
    console.log("필터링 적용 수치 : " + severity + "% 이상");

    // 도메인 획득
    const domain = window.location.hostname;
    console.log("도메인 : " + domain);

    // 식별자 획득
    const identifier = await getIdentifier(domain);
    console.log("댓글 요소 선택자 : " + identifier);

    // 추가 로딩 함수 적용
    async function processNewComments(mutationList) {
        const url = window.location.href
        //console.log(url)
        for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const elements = node.querySelectorAll(identifier);
                        for (let i = 0; i < elements.length; i++) {
                            await handleComment(elements[i], myUUID, severity, url);
                        }
                    }
                }
            }
        }
    }

    // DOM 변경 감지를 위한 MutationObserver 생성 및 설정
    const observer = new MutationObserver(processNewComments);
    const observerConfig = { childList: true, subtree: true };
    observer.observe(document.body, observerConfig);

    // 초기 로딩 댓글 처리
    const elements = document.querySelectorAll(identifier);
    for (let i = 0; i < elements.length; i++) {
        const url = window.location.href
        //console.log(url)
        await handleComment(elements[i], myUUID, severity, url);
    }

}