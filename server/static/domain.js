window.addEventListener('DOMContentLoaded', (event) => {
    // Edit 버튼 클릭 시 이벤트리스너
    document.querySelectorAll('.edit-btn').forEach((button) => {
        button.addEventListener('click', function() {
            var oldDomain = this.getAttribute('data-domain');
            var oldIdentifier = this.getAttribute('data-identifier');

            var domain = prompt("수정할 도메인을 입력하세요.", oldDomain);
            var identifier = prompt("수정할 선택자를 입력하세요.", oldIdentifier);

            if (domain !== null && identifier !== null) {
                fetch('/domain/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({'oldDomain': oldDomain, 'domain': domain, 'identifier': identifier})
                })
                    .then(response => {
                        if (!response.ok) throw new Error(response.statusText);
                        alert('도메인이 수정되었습니다.');
                        location.reload();
                    })
                    .catch(error => {
                        alert('오류가 발생했습니다.');
                        console.log(error);
                    });
            }
        });
    });

    // Delete 버튼 클릭 시 이벤트리스너
    document.querySelectorAll('.delete-btn').forEach((button) => {
        button.addEventListener('click', function() {
            var domain = this.getAttribute('data-domain');
            if (confirm('도메인을 삭제하시겠습니까?')) {
                fetch('/domain/delete', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({'domain': domain})
                })
                    .then(response => {
                        if (!response.ok) throw new Error(response.statusText);
                        alert('도메인이 삭제되었습니다.');
                        location.reload();
                    })
                    .catch(error => {
                        alert('오류가 발생했습니다.');
                        console.log(error);
                    });
            }
        });
    });

    // Add 버튼 클릭 시 이벤트리스너
    document.getElementById('add-form').addEventListener('submit', function(event) {
        event.preventDefault();
        var domain = document.getElementById('domain').value;
        var identifier = document.getElementById('identifier').value;
        fetch('/domain/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'domain': domain, 'identifier': identifier})
        })
            .then(response => {
                if (!response.ok) throw new Error(response.statusText);
                alert('도메인이 추가되었습니다.');
                location.reload();
            })
            .catch(error => {
                alert('오류가 발생했습니다.');
                console.log(error);
            });
    });
});