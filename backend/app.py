import os
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

if not hasattr(Flask, 'before_first_request'):
    def before_first_request(self, f):
        ya_corrio = False
        def wrapper(*args, **kwargs):
            nonlocal ya_corrio
            if not ya_corrio:
                ya_corrio = True
                f(*args, **kwargs)
        self.before_request(wrapper)
        return f
    Flask.before_first_request = before_first_request

# =============================================================
# Integrar Importar Datos
# =============================================================
from importador import init_importador
init_importador(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
