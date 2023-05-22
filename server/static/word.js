window.addEventListener('DOMContentLoaded', (event) => {
    // Delete 버튼 클릭 시 이벤트리스너
    document.querySelectorAll('.delete-btn').forEach((button) => {
        button.addEventListener('click', function() {
            const pElement = document.querySelector('p');
            const uuid = pElement.dataset.uuid;
            const word = this.dataset.word;
            if (confirm('단어를 삭제하시겠습니까?')) {
                fetch('/word/delete', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 'uuid': uuid, 'word': word })
                })
                    .then(response => response.json())
                    .then(data => {
                        alert('단어가 삭제되었습니다.');
                        location.reload();
                    })
                    .catch(error => {
                        alert('오류가 발생했습니다.');
                        console.error(error);
                    });
            }
        });
    });

    // Add 버튼 클릭 시 이벤트리스너
    document.querySelector('#add-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const pElement = document.querySelector('p');
        const uuid = pElement.dataset.uuid;
        const word = document.querySelector('#word').value;
        fetch('/word/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'uuid': uuid, 'word': word})
        })
            .then(response => response.json())
            .then(data => {
                alert('단어가 추가되었습니다.');
                location.reload();
            })
            .catch(error => {
                alert('오류가 발생했습니다.');
                console.error(error);
            });
    });
});