import json
from http.server import BaseHTTPRequestHandler

# Lista de lições no formato de dicionário, substituindo o banco de dados
licoes = [
    {"id": 1, "titulo": "Variáveis e Tipos de Dados", "descricao": "Aprenda a armazenar e manipular informações em Python.", "xp": 10},
    {"id": 2, "titulo": "Estruturas Condicionais", "descricao": "Use if, elif e else para tomar decisões no código.", "xp": 15},
    {"id": 3, "titulo": "Laços de Repetição", "descricao": "Automatize tarefas repetitivas com for e while.", "xp": 20},
    {"id": 4, "titulo": "Listas e Tuplas", "descricao": "Armazene múltiplos valores em estruturas de dados.", "xp": 25},
    {"id": 5, "titulo": "Dicionários", "descricao": "Trabalhe com pares de chave e valor.", "xp": 25},
    {"id": 6, "titulo": "Funções", "descricao": "Crie blocos de código reutilizáveis e organizados.", "xp": 30},
    {"id": 7, "titulo": "Manipulação de Strings", "descricao": "Aprenda a formatar e processar textos.", "xp": 30},
    {"id": 8, "titulo": "Tratamento de Exceções", "descricao": "Previna erros e falhas inesperadas com try e except.", "xp": 35},
    {"id": 9, "titulo": "Orientação a Objetos", "descricao": "Entenda classes, objetos e herança.", "xp": 40},
    {"id": 10, "titulo": "Módulos e Imports", "descricao": "Organize seu projeto e reaproveite código externo.", "xp": 40}
]

# Classe exigida pela Vercel para funções serverless em Python
class handler(BaseHTTPRequestHandler):
    
    # Método que responde a requisições GET
    def do_GET(self):
        # Converte a lista de lições para o formato JSON em bytes
        corpo_resposta = json.dumps(licoes).encode('utf-8')
        
        # Envia o status HTTP 200 (OK)
        self.send_response(200)
        
        # Envia os cabeçalhos da resposta
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(corpo_resposta)))
        self.end_headers()
        
        # Escreve o corpo da resposta (o JSON) na saída
        self.wfile.write(corpo_resposta)