import requests
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from transformers import ElectraTokenizer, ElectraForSequenceClassification
import urllib
import re
import mysql.connector

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 모델 경로, tokenizer 경로
model_name = "model" # "JminJ/kcElectra_base_Bad_Sentence_Classifier"(테스트모델)
tokenizer_name = "model" # "JminJ/kcElectra_base_Bad_Sentence_Classifier"(테스트모델)

# 모델, tokenizer 불러오기
tokenizer = ElectraTokenizer.from_pretrained(tokenizer_name)
model = ElectraForSequenceClassification.from_pretrained(model_name)
print(model_name + "모델 로딩 완료")

# 예측 함수
def predict(text, severity):
    encoded_text = tokenizer.encode_plus(
        text,
        max_length=128,
        add_special_tokens=True,
        return_token_type_ids=False,
        padding="max_length",
        truncation=True,
        return_attention_mask=True,
        return_tensors="pt"
    )

    output = model(**encoded_text)
    scores = output.logits.softmax(dim=1).tolist()[0]

    # 0 : 악성 댓글이 아닌 경우, 1 : 악성 댓글인 경우
    #label = 1 if scores[0]*100 > severity else 0 # 테스트모델용
    label = 1 if scores[1]*100 > severity else 0 # 내 모델용
    print("[%s] %0.1f" % (text, scores[1]*100))
    return label

# 판별 처리 API
@app.route("/prediction", methods=["POST"])
def prediction():
    message = request.json["message"]
    # 특수문자 및 이모티콘 제거
    message = (lambda x: re.sub('[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]', '', x))(message)
    uuid = request.json["uuid"]
    severity = int(request.json["severity"])
    word_rows = [row[1] for row in get_all_data_word(uuid) if row[0] == uuid]
    # 지정 단어 포함 여부 조회
    for word_row in word_rows:
        if word_row in message :
            response = {
            "result": 2
            }
            return jsonify(response)
    # 인공지능 판별
    label = predict(message, severity)
    response = {
        "result": label
    }
    return jsonify(response)
#------------------------------------------------------------------
# 데이터베이스 연결 함수
def get_db():
    global conn
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="456456",
        database="mydb",
        autocommit=True  # 자동 커밋 설정
    )
    return conn.cursor()

# 전체 데이터(도메인) 조회 함수
def get_all_data_domain():
    cursor = get_db()
    cursor.execute('SELECT * FROM domain_table ORDER BY registered_time ASC')
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

# 도메인 추가 함수
def add_domain(domain, identifier):
    cursor = get_db()
    query = "INSERT INTO DOMAIN_TABLE (domain, identifier) VALUES (%s, %s)"
    data = (domain, identifier)
    cursor.execute(query, data)
    cursor.close()
    conn.close()

# 도메인 수정 함수
def update_domain(domain, old_domain, identifier):
    cursor = get_db()
    query = "UPDATE DOMAIN_TABLE SET domain = %s, identifier = %s WHERE domain = %s"
    data = (domain, identifier, old_domain)
    cursor.execute(query, data)
    cursor.close()
    conn.close()

# 도메인 삭제 함수
def delete_domain(domain):
    cursor = get_db()
    query = "DELETE FROM DOMAIN_TABLE WHERE domain = %s"
    data = (domain,)
    cursor.execute(query, data)
    cursor.close()
    conn.close()

# 전체 데이터(사용자별 지정단어) 조회 함수
def get_all_data_word(uuid):
    cursor = get_db()
    query = "SELECT * FROM WORD_TABLE WHERE uuid = %s"
    data = (uuid,)
    cursor.execute(query, data)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

# 단어 추가 함수
def add_word(uuid, word):
    cursor = get_db()
    insert_query = "INSERT INTO WORD_TABLE (uuid, word) VALUES (%s, %s)"
    data = (uuid, word)
    cursor.execute(insert_query, data)
    cursor.close()
    conn.close()

# 단어 삭제 함수
def delete_word(uuid, word):
    cursor = get_db()
    delete_query = "DELETE FROM WORD_TABLE WHERE uuid = %s AND word = %s"
    data = (uuid, word)
    cursor.execute(delete_query, data)
    cursor.close()
    conn.close()

# 메인 페이지(도메인 관리 페이지)
@app.route('/', methods=["GET"])
def manage_domain():
    rows = get_all_data_domain()
    return render_template('domain.html', rows=rows)

# 도메인별 식별자 조회 API
@app.route('/domain', methods=["GET"])
def check_domain_api():
    rows = get_all_data_domain()
    searchDomain = request.args.get('domain', '')
    searchDomain = urllib.parse.unquote(searchDomain)
    for row in rows:
        if row[0] == searchDomain:
            return jsonify({'identifier': row[1]})
    return jsonify({'identifier': None})

# 도메인 추가 API
@app.route('/domain/add', methods=["POST"])
def add_domain_api():
    domain = request.json['domain']
    identifier = request.json['identifier']
    add_domain(domain, identifier)
    return jsonify({'result': 'success'})

# 도메인 데이터 수정 API
@app.route('/domain/update', methods=['PUT'])
def update_domain_api():
    domain = request.json.get('domain')
    old_domain = request.json.get('oldDomain')
    identifier = request.json.get('identifier')

    if domain and old_domain and identifier:
        update_domain(domain, old_domain, identifier)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': '도메인, 예전 도메인, 식별자를 모두 입력해주세요.'})

# 도메인 삭제 API
@app.route('/domain/delete', methods=["DELETE"])
def delete_domain_api():
    domain = request.json['domain']
    delete_domain(domain)
    return jsonify({'result': 'success'})

# 지정 단어 페이지 (사용자별 지정 단어 관리 페이지)
@app.route('/word', methods=["GET"])
def manage_word():
    uuid = request.args.get("uuid", default="", type=str)
    rows = get_all_data_word(uuid)
    return render_template('word.html', rows=rows, uuid=uuid)

# 단어 추가 API
@app.route('/word/add', methods=["POST"])
def add_word_api():
    uuid = request.json['uuid']
    word = request.json['word']
    add_word(uuid, word)
    return jsonify({'result': 'success'})

# 단어 삭제 API
@app.route('/word/delete', methods=["DELETE"])
def delete_word_api():
    uuid = request.json['uuid']
    word = request.json['word']
    delete_word(uuid, word)
    return jsonify({'result': 'success'})

if __name__ == "__main__":
    app.run(debug=True, port=3000)
