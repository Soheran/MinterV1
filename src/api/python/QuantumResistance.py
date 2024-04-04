from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
import pickle
import os


from CryptoUtils import (create_key, chunk_data, aes_encrypt_data, generate_diophantine_eqn, diophantine_encrypt_data, create_client_folder, write_client_file_name, clear_client_folder, return_client_file, solve_diophantine_eqn, diophantine_decrypt_data, aes_decrypt_data)

app = Flask(__name__)
CORS(app)


def encrypt_description(description, user_dir="",Quantum_Key_Name="",user_used_dir="",SECRET_KEY="",Username=""):

    #Keys_Dir = os.path.join('Keys', Username)
    #Used_Key_Dir = os.path.join('Used_Keys', Username)
    

    Key_File_Path = os.path.join(user_dir, Quantum_Key_Name + '.pkl')
    Used_Key_File_Path = os.path.join(user_used_dir, f'Used_{Quantum_Key_Name}.pkl')

    #Encrypt description with AES-256
    AES_Ciphertext = aes_encrypt_data(description, SECRET_KEY.encode('utf-8'))

     # Split AES Ciphertext to Chunks [To Speed Up Quantum Encryption]
    AES_Chunks_Array = chunk_data(AES_Ciphertext)

    # Generate Diophantine Equation
    v_sum, eqn_text = generate_diophantine_eqn(Key_File_Path, Quantum_Key_Name, Username)

    # Encrypt AES Chunks With Quantum Encryption
    Diophantine_Chunks_Array = [
        diophantine_encrypt_data(chunk.decode(), v_sum) for chunk in AES_Chunks_Array
    ]

    # Merge Quantum Encrypted Chunks to a String
    Quantum_Ciphertext = ",".join(Diophantine_Chunks_Array)

    # Add Diophantine Equation to Quantum Ciphertext
    Quantum_Encrypted_File_Data = Quantum_Ciphertext + eqn_text

    if os.path.exists(Used_Key_File_Path):
                try:
                    with open(Used_Key_File_Path, "rb") as used_key_file:
                        Used_Key_Value_Array = pickle.load(used_key_file)

                    # Read Key File Value
                    with open(Key_File_Path, "rb") as key_file:
                        Key_Value_Array = pickle.load(key_file)

                    # Checks if 95% of the KeyValues within the Key Value Array is used [**To Allow Reusable Keys**]
                    if (len(Used_Key_Value_Array) / len(Key_Value_Array)) > 0.95:
                        
                        # If True, Delete the Used Key in the Used_Keys Folder [To 'Reset' the Key]
                        try:
                            os.remove(Used_Key_File_Path)
                            print(f"Used Key: {f'Used_{Quantum_Key_Name}.pkl'} Successfully Deleted")

                        except OSError as e:
                            print(f"Error Deleting Used Key: {f'Used_{Quantum_Key_Name}.pkl'}: {e}")
                
                except Exception as e:
                    print(e)
    
    return Quantum_Encrypted_File_Data

"""
def decrypt_description(encrypted_description):
    decrypted_description = cipher_suite.decrypt(encrypted_description).decode()
    return decrypted_description
"""

@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.json
    # Taking inputs for key name and Username
    Quantum_Key_Name = data.get("quantum_key_name")
    Username = data.get("username")
    Keysize = int(data.get("keysize"))

    SECRET_KEY = "Password"

    # Create the folder [./Keys/<Username>/<keyname>.pkl ] for Keys
    if not os.path.exists("./Keys"):
        os.mkdir("./Keys")
    user_dir = os.path.join('./Keys', Username)
    if not os.path.exists(user_dir):
        os.mkdir(user_dir)
        
    # while True:
    #     optionalkeysize = input("Do you want to enter custom keysize (Y/N): ").lower()
    #     if optionalkeysize in ["y", "n"]:
    #         if optionalkeysize == "y":
    #             key_size = input("Enter key size: ")
    #             while int(key_size) < 5800:
    #                 print("Must be more than 5800")
    #                 key_size = input("Enter key size: ")
    #         break
    #     else:
    #         print("Invalid input. Please enter 'Y' or 'N'.")


    create_key(user_dir, Quantum_Key_Name,Keysize)

    # Create the folder [./Used_Keys/<Username>/<keyname>.pkl ] for Used_Keys
    if not os.path.exists("./Used_Keys"):
        os.mkdir("./Used_Keys")
    user_used_dir = os.path.join('./Used_Keys', Username)
    if not os.path.exists(user_used_dir):
        os.mkdir(user_used_dir)

        data = request.json
    # Prompt user for input
    name = data.get("name")
    symbol = data.get("symbol")
    description = data.get("description")
    image_url = data.get("image")

    # Encrypt description
    encrypted_description = encrypt_description(description, user_dir,Quantum_Key_Name,user_used_dir,SECRET_KEY,Username)

    # Create token data dictionary
    token_data = {
        "name": name,
        "symbol": symbol,
        "description": encrypted_description,
        "image_url": image_url
    }

    # Write token data to JSON file
    with open("token.json", "w") as json_file:
        json.dump(token_data, json_file, indent=4)

    print("token.json file has been created successfully!")
    return jsonify({"message": "Encryption completed successfully"}), 200


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

# Running the entire file
if __name__ == "__main__":
    app.run(debug=True)