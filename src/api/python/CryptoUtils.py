import base64
import datetime
import hashlib
import pickle
import os
import random

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto import Random

decrypt_replacements = {
    "000": "0",
    "001": "1",
    "002": "2",
    "003": "3",
    "004": "4",
    "005": "5",
    "006": "6",
    "007": "7",
    "008": "8",
    "009": "9",
    "240": "A",
    "241": "B",
    "242": "C",
    "243": "D",
    "244": "E",
    "245": "F",
    "246": "G",
    "247": "H",
    "248": "I",
    "010": "J",
    "011": "K",
    "012": "L",
    "013": "M",
    "014": "N",
    "015": "O",
    "016": "P",
    "017": "Q",
    "018": "R",
    "019": "S",
    "020": "T",
    "021": "U",
    "022": "V",
    "023": "W",
    "024": "X",
    "025": "Y",
    "026": "Z",
    "027": "a",
    "028": "b",
    "029": "c",
    "030": "d",
    "031": "e",
    "032": "f",
    "033": "g",
    "034": "h",
    "035": "i",
    "036": "j",
    "037": "k",
    "038": "l",
    "039": "m",
    "040": "n",
    "041": "o",
    "042": "p",
    "043": "q",
    "044": "r",
    "045": "s",
    "046": "t",
    "047": "u",
    "048": "v",
    "049": "w",
    "050": "x",
    "051": "y",
    "052": "z",
    "053": "!",
    "054": "@",
    "055": "#",
    "056": "$",
    "057": "%",
    "058": "^",
    "059": "&",
    "060": "*",
    "061": "(",
    "062": ")",
    "063": ",",
    "064": "<",
    "065": ".",
    "066": ">",
    "067": "/",
    "068": "?",
    "069": ";",
    "070": ":",
    "071": "'",
    "072": '"',
    "073": "[",
    "074": "{",
    "075": "]",
    "076": "}",
    "078": "|",
    "079": "€",
    "080": "¥",
    "081": "÷",
    "082": "-",
    "083": "_",
    "084": "=",
    "085": "+",
    "086": "¡",
    "087": "~",
    "088": "Ç",
    "089": "ü",
    "090": "é",
    "091": "â",
    "092": "ä",
    "093": "à",
    "094": "å",
    "095": "ç",
    "096": "ê",
    "097": "ë",
    "098": "è",
    "099": "ï",
    "100": "î",
    "101": "ì",
    "102": "Ä",
    "103": "Å",
    "104": "É",
    "105": "æ",
    "106": "Æ",
    "107": "ô",
    "108": "ö",
    "109": "Ò",
    "110": "Û",
    "111": "Ù",
    "112": "ÿ",
    "113": "Ö",
    "114": "Ü",
    "115": "ø",
    "116": "£",
    "117": "Ø",
    "118": "ã",
    "119": "ƒ",
    "120": "á",
    "121": "í",
    "122": "Ó",
    "122": "ú",
    "123": "ñ",
    "124": "Ñ",
    "125": "ª",
    "126": "º",
    "127": "¿",
    "128": "®",
    "129": "¬",
    "130": "½",
    "131": "¼",
    "132": "«",
    "133": "»",
    "134": "Á",
    "135": "Â",
    "136": "À",
    "137": "©",
    "138": "¢",
    "139": "Ã",
    "140": "¤",
    "141": "ð",
    "142": "Ð",
    "143": "Ê",
    "144": "Ë",
    "145": "È",
    "146": "Í",
    "147": "Î",
    "148": "Ï",
    "149": "¦",
    "150": "µ",
    "151": "þ",
    "152": "Þ",
    "153": "¯",
    "154": "≡",
    "155": "±",
    "156": "‗",
    "157": "¾",
    "158": "¶",
    "159": "§",
    "160": "÷",
    "161": "¹",
    "162": "³",
    "163": "²",
    "164": "°",
    "165": "\\",
    "166": "'",
    "167": "Ž",
    "168": "`",
    "169": "‡",
    "170": "Ÿ",
    "171": "†",
    "172": "Ô",
    "173": "Ý",
    "173": "ý",
    "174": "×",
    "175": "œ",
    "176": "·",
    "177": "Ì",
    "178": "Œ",
    "179": "™",
    "180": "‰",
    "181": "š",
    "182": "ß",
    "183": "˜",
    "184": "Õ",
    "185": "–",
    "186": "¨",
    "187": "›",
    "188": "´",
    "189": "ˆ",
    "190": "“",
    "191": "”",
    "192": "•",
    "193": "‚",
    "194": "ž",
    "195": "‹",
    "196": "—",
    "197": "„",
    "198": "‘",
    "199": "’",
    "200": "",
    "201": "Ú",
    "202": "õ",
    "203": "ž",
    "204": "Š",
    "205": "¸",
    "206": "…",
    "207": "ù",
    "208": "û",
    "209": "ò",
    "210": "ó",
    "211": "�",
    "212": "",
    "213": "",
    "214": "",
    "215": "",
    "216": "",
    "217": "",
    "218": "",
    "219": "",
    "220": "",
    "221": "",
    "222": "",
    "223": "",
    "224": "",
    "225": "",
    "226": "",
    "227": "",
    "228": "",
    "229": "",
    "230": "",
    "231": "",
    "232": "",
    "233": "",
    "234": "",
    "235": "",
    "236": "",
    "237": "",
    "238": "",
    "239": "",
    "249": " ",
}


encrypt_replacements = {
    "0": "000",
    "1": "001",
    "2": "002",
    "3": "003",
    "4": "004",
    "5": "005",
    "6": "006",
    "7": "007",
    "8": "008",
    "9": "009",
    "A": "240",
    "B": "241",
    "C": "242",
    "D": "243",
    "E": "244",
    "F": "245",
    "G": "246",
    "H": "247",
    "I": "248",
    "J": "010",
    "K": "011",
    "L": "012",
    "M": "013",
    "N": "014",
    "O": "015",
    "P": "016",
    "Q": "017",
    "R": "018",
    "S": "019",
    "T": "020",
    "U": "021",
    "V": "022",
    "W": "023",
    "X": "024",
    "Y": "025",
    "Z": "026",
    "a": "027",
    "b": "028",
    "c": "029",
    "d": "030",
    "e": "031",
    "f": "032",
    "g": "033",
    "h": "034",
    "i": "035",
    "j": "036",
    "k": "037",
    "l": "038",
    "m": "039",
    "n": "040",
    "o": "041",
    "p": "042",
    "q": "043",
    "r": "044",
    "s": "045",
    "t": "046",
    "u": "047",
    "v": "048",
    "w": "049",
    "x": "050",
    "y": "051",
    "z": "052",
    "!": "053",
    "@": "054",
    "#": "055",
    "$": "056",
    "%": "057",
    "^": "058",
    "&": "059",
    "*": "060",
    "(": "061",
    ")": "062",
    ",": "063",
    "<": "064",
    ".": "065",
    ">": "066",
    "/": "067",
    "?": "068",
    ";": "069",
    ":": "070",
    "'": "071",
    '"': "072",
    "[": "073",
    "{": "074",
    "]": "075",
    "}": "076",
    "|": "078",
    "€": "079",
    "¥": "080",
    "÷": "081",
    "-": "082",
    "_": "083",
    "=": "084",
    "+": "085",
    "¡": "086",
    "~": "087",
    "Ç": "088",
    "ü": "089",
    "é": "090",
    "â": "091",
    "ä": "092",
    "à": "093",
    "å": "094",
    "ç": "095",
    "ê": "096",
    "ë": "097",
    "è": "098",
    "ï": "099",
    "î": "100",
    "ì": "101",
    "Ä": "102",
    "Å": "103",
    "É": "104",
    "æ": "105",
    "Æ": "106",
    "ô": "107",
    "ö": "108",
    "Ò": "109",
    "Û": "110",
    "Ù": "111",
    "ÿ": "112",
    "Ö": "113",
    "Ü": "114",
    "ø": "115",
    "£": "116",
    "Ø": "117",
    "ã": "118",
    "ƒ": "119",
    "á": "120",
    "í": "121",
    "Ó": "122",
    "ú": "122",
    "ñ": "123",
    "Ñ": "124",
    "ª": "125",
    "º": "126",
    "¿": "127",
    "®": "128",
    "¬": "129",
    "½": "130",
    "¼": "131",
    "«": "132",
    "»": "133",
    "Á": "134",
    "Â": "135",
    "À": "136",
    "©": "137",
    "¢": "138",
    "Ã": "139",
    "¤": "140",
    "ð": "141",
    "Ð": "142",
    "Ê": "143",
    "Ë": "144",
    "È": "145",
    "Í": "146",
    "Î": "147",
    "Ï": "148",
    "¦": "149",
    "µ": "150",
    "þ": "151",
    "Þ": "152",
    "¯": "153",
    "≡": "154",
    "±": "155",
    "‗": "156",
    "¾": "157",
    "¶": "158",
    "§": "159",
    "÷": "160",
    "¹": "161",
    "³": "162",
    "²": "163",
    "°": "164",
    "\\": "165",
    "'": "166",
    "Ž": "167",
    "`": "168",
    "‡": "169",
    "Ÿ": "170",
    "†": "171",
    "Ô": "172",
    "Ý": "173",
    "ý": "173",
    "×": "174",
    "œ": "175",
    "·": "176",
    "Ì": "177",
    "Œ": "178",
    "™": "179",
    "‰": "180",
    "š": "181",
    "ß": "182",
    "˜": "183",
    "Õ": "184",
    "–": "185",
    "¨": "186",
    "›": "187",
    "´": "188",
    "ˆ": "189",
    "“": "190",
    "”": "191",
    "•": "192",
    "‚": "193",
    "ž": "194",
    "‹": "195",
    "—": "196",
    "„": "197",
    "‘": "198",
    "’": "199",
    "": "200",
    "Ú": "201",
    "õ": "202",
    "ž": "203",
    "Š": "204",
    "¸": "205",
    "…": "206",
    "ù": "207",
    "û": "208",
    "ò": "209",
    "ó": "210",
    "�": "211",
    "": "212",
    "": "213",
    "": "214",
    "": "215",
    "": "216",
    "": "217",
    "": "218",
    "": "219",
    "": "220",
    "": "221",
    "": "222",
    "": "223",
    "": "224",
    "": "225",
    "": "226",
    "": "227",
    "": "228",
    "": "229",
    "": "230",
    "": "231",
    "": "232",
    "": "233",
    "": "234",
    "": "235",
    "": "236",
    "": "237",
    "": "239",
    " ": "249",
}


password = "pass".encode("utf-8")


def create_key(user_dir, quantum_key_name, key_size=5800):
    #Key Creation
    # allow user input their key size with default size being 5800
    symmetrickey = []
    for i in range(0, key_size):
      symmetrickey.append(random.randrange(1, 10**1000))
    
    sample_list = symmetrickey
    keyname = quantum_key_name + ".pkl"
    fileName =  os.path.join(user_dir, keyname)

    
    open_file = open(fileName, "wb")
    pickle.dump(sample_list, open_file)
    open_file.close()

    open_file = open(fileName, "rb")
    open_file.close()



#@profile
def chunk_data(data, chunk_size=1000):
    chunks_arr = [data[i : i + chunk_size] for i in range(0, len(data), chunk_size)]

    return chunks_arr


#@profile
def aes_encrypt_data(data, password):
    data1 = data.encode("utf-8")
    private_key = hashlib.sha256(password).digest()
    raw = pad(data1, AES.block_size)  # Apply PKCS#7 padding
    iv = Random.new().read(AES.block_size)

    cipher = AES.new(private_key, AES.MODE_CBC, iv)
    encrypted_data = base64.b64encode(iv + cipher.encrypt(raw))

    return encrypted_data


#@profile
def generate_diophantine_eqn(key_file_path, key_name, Username, key_size=5800):

    used_key_name = f"Used_{key_name}.pkl"

    # Script Directory
    # Script_Dir = os.path.dirname(os.path.abspath(__file__))

    # Construct Relative Path to Used Keys Directory
    # Used_Key_Dir = os.path.join(Script_Dir, '..', '..', 'Used_Keys', Username, used_key_name)
    Used_Key_Dir = os.path.join('Used_Keys', Username, used_key_name)
    if ( Used_Key_Dir == False) :
        os.mkdir(f"../Used_Keys/{Username}/{used_key_name}")
        
    else: 
       
        if not os.path.isfile(Used_Key_Dir):
            with open(Used_Key_Dir, "wb") as file:
                pickle.dump([], file)

    # To prevent keys from being reused , activate the below code
    with open(Used_Key_Dir, "rb") as used_key_file:
        
        chosenkeyno = pickle.load(used_key_file)

    with open(key_file_path, "rb") as key_file:
        key_list = pickle.load(key_file)
    chosenkey = []
    recentkeyno = []
    keys = len(chosenkeyno)

    i = keys + 59 - len(chosenkeyno)

    while i > 1:
        n = random.randrange(0, key_size)
        if n not in chosenkeyno:
            k = key_list[n]
            chosenkey.append(k)
            recentkeyno.append(n)
            i -= 1
    v_sum = 0
    chosenv_powers = []

    for i in range(0, 58):
        power = random.randrange(0, 5)
        v_sum += chosenkey[i] ** power
        chosenv_powers.append(power)
    eqn_text = ""
    for i in range(0, 58):
        text = "v" + str(recentkeyno[i]) + "^" + str(chosenv_powers[i])
        eqn_text += "+" + text
    with open(Used_Key_Dir, "wb") as used_key_file:
        chosenkeyno += recentkeyno
        pickle.dump(chosenkeyno, used_key_file)

    return v_sum, eqn_text


#@profile
def diophantine_encrypt_data(data, v_sum):
    data = "abc" + data

    output = ""
    for char in data:
        output += encrypt_replacements[char]
    data = output

    # for a, b in encrypt_replacements:
    #    data = data.replace(a, b)

    # separate variable to check during profiling
    int_data = int(data)
    code = str(int_data - v_sum)

    return code


#@profile
def solve_diophantine_eqn(eqn, key_file_path):
    with open(key_file_path, "rb") as key_file:
        key_list = pickle.load(key_file)

    total = 0
    for term in eqn:
        base, exponent = map(int, term.split("^"))
        # Compute t_datapower and add it to the total
        total += key_list[base] ** exponent

    return total


#@profile
def diophantine_decrypt_data(encrypted_data, v_sum):
    fileContent = encrypted_data + v_sum

    # print(fileContent)
    str_fileContent = "0" + str(fileContent)

    chunks = [str_fileContent[i : i + 3] for i in range(0, len(str_fileContent), 3)]

    # print(chunks)

    # Replace characters in the array using a list comprehension
    replaced_array = [decrypt_replacements[char] for char in chunks]

    # Join the modified array into a string
    output_string = "".join(replaced_array)

    # chunks = [str_fileContent[i : i + 3] for i in range(0, len(str_fileContent), 3)]
    # for i in range(0, len(chunks), 3):
    #    chunk = chunks[i : i + 3]
    #    for old, new in decrypt_replacements:
    #        if chunk == old:
    #            chunks = chunks[:i] + new + chunks[i + 3 :]
    # replaced_arr = [
    #    next(
    #        (replace[1] for replace in decrypt_replacements if replace[0] == item),
    #        item,
    #    )
    #    for item in chunks
    # ]
    # result = "".join(replaced_arr)
    decrypted_data = output_string[3:]

    return decrypted_data


#@profile
def aes_decrypt_data(encrypted_data, password):
    private_key = hashlib.sha256(password).digest()
    enc = base64.b64decode(encrypted_data)
    iv = enc[:16]
    cipher = AES.new(private_key, AES.MODE_CBC, iv)
    decrypted_data = unpad(
        cipher.decrypt(enc[16:]), AES.block_size
    )  # Ensure proper unpadding

    return decrypted_data


def create_client_folder(client_name):
    dir = os.path.isdir(f"../backend/client/{client_name}")

    if (dir == False) :
        os.mkdir(f"../backend/client/{client_name}")
    else: 
        return

def clear_client_folder(client_name):
    dir = f"../backend/client/{client_name}"
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))

def write_client_file_name(filename, client_name):
    with open(f"../backend/client/{client_name}/{filename}", 'w') as f:
        f.write(filename)

def return_client_file(client_name): ##have to change this to work on multiple files
    dir = f"../backend/client/{client_name}"
    fileNameList = []
    for filename in os.listdir(dir):
        file_path = os.path.join(dir, filename)
        # Open the file and read one line
        with open(file_path, 'r') as file:
            line = file.readline()
            fileNameList.append(line)
    return fileNameList

    

# # decrypt_file(encrypted_file_path, password)
# def convert_text_to_pdf(input_file_path, output_file_path):
#     # Read the text content from the file
#     with open(input_file_path, "r") as file:
#         text_content = file.read()
#     # print(text_content)
#     # Create a PDF object
#     pdf = FPDF()
#     pdf.add_page()

#     # Set the font and font size
#     pdf.set_font("Arial", size=12)

#     # Add the text content to the PDF
#     pdf.multi_cell(0, 10, text_content)

#     # Save the PDF to the specified output file path
#     pdf.output(output_file_path)


# def convert_text_to_doc(input_file_path, output_file_path):
#     # Read the text content from the file
#     with open(input_file_path, "r") as file:
#         text_content = file.read()

#     # Create a new Document object
#     doc = Document()

#     # Add the text content to the document
#     doc.add_paragraph(text_content)

#     # Save the document to the specified output file path
#     doc.save(output_file_path)


# def string_to_binary(string):
#     bytearray = string.encode("utf-8")
#     binary = "".join(format(byte, "08b") for byte in bytearray)
#     return int(binary, 2)


# #### ?????
# # def bad_request(message):
# #     payload = {"error": "400", "message": message}
# #     response = jsonify(payload)
# #     response.status_code = 400
# #     return response

# #### ?????
# # # Replace "your_file.pdf" with the path to your actual file
# # file_path = f'./files/test.txt'

# #### ?????
# text = "Hi"
# integervalue = string_to_binary(text)
# print("Integer value:", integervalue)
