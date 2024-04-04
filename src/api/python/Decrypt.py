from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
import pickle
import os

from CryptoUtils import (solve_diophantine_eqn, diophantine_decrypt_data, aes_decrypt_data)

app = Flask(__name__)
CORS(app)

SECRET_KEY = "Password"

@app.route('/decrypt', methods=['POST'])
def decrypt():
    data = request.json
    Quantum_Key_Name = data.get('key_name')
    Username = data.get('username')
    ciphertext = data.get('ciphertext')

    user_dir = os.path.join('./Keys', Username)
    Key_File_Path = os.path.join(user_dir, Quantum_Key_Name + '.pkl')

    Quantum_Ciphertext = ciphertext.split('+v')
    eqn = Quantum_Ciphertext[1:]
    v_sum = solve_diophantine_eqn(eqn, Key_File_Path)
    diophantine_file_chunks = Quantum_Ciphertext[0].split(',')
    decrypted_quantum_chunks = [
        diophantine_decrypt_data(int(chunk), v_sum)
        for chunk in diophantine_file_chunks
    ]
    decrypted_quantum_string = "".join(decrypted_quantum_chunks)
    decrypted_data = aes_decrypt_data(decrypted_quantum_string, SECRET_KEY.encode('utf-8'))
    description = decrypted_data.decode("utf-8")

    return jsonify({'description': description})

if __name__ == '__main__':
    app.run(debug=True)
