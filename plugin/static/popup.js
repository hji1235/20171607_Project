
// 설정창 악플 정도 조절하는 이벤트 리스너
document.addEventListener("DOMContentLoaded", function () {
    // 로컬 스토리지에서 악플 정도 가져오기
    chrome.storage.local.get("severity", function (result) {
        // 악플 정도 슬라이더 설정
        const severitySlider = document.getElementById("severity");
        const severityValue = document.getElementById("severityValue");
        // 값이 저장되어 있지 않을 때 기본값 50 설정
        severitySlider.value = result.severity || 50;
        severityValue.innerText = '악플일 확률 ' + severitySlider.value + '%이상 댓글이 필터링 됩니다.';

        // 슬라이더 값이 변경될 때마다 로컬 스토리지에 저장
        severitySlider.addEventListener("change", function () {
            const value = parseInt(this.value);
            chrome.storage.local.set({ severity: value }, function () {
                console.log("악플 정도가 저장되었습니다.");
            });
            severityValue.innerText = '악플일 확률 ' + value + '%이상 댓글이 필터링 됩니다.';
        });
    });
});
// 블랙리스트 및 지정 단어 옵션 링크를 클릭한 했을 때 이벤트 리스너
document.getElementById("optionsLink").addEventListener("click", function() {
    // uuid 획득 후 페이지 이동
    chrome.storage.local.get('myUUID', function(result) {
        const uuid = result.myUUID;
        const url = `http://localhost:3000/word?uuid=${uuid}`;
        chrome.tabs.create({ url: url });
    });
});


// 전송 버튼 클릭 시 이벤트 리스너
document.getElementById("addCustomWordButton").addEventListener("click", async function() {
    // 사용자 입력 단어 가져오기
    var customWord = document.getElementById("customWord").value;
    const myUUID = await new Promise(resolve => chrome.storage.local.get('myUUID', result => resolve(result.myUUID)));
    // background.js로 메시지 보내기
    chrome.runtime.sendMessage({ action: "add_word", word: customWord, "uuid": myUUID });
    document.getElementById("customWord").value = "";
    // 등록완료 안내문구 출력
    const messageDiv = document.getElementById("message");
    messageDiv.style.display = "block";
    setTimeout(() => {
        messageDiv.style.display = "none";
    }, 1500);
});