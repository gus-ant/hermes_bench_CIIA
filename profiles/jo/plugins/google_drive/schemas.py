search_schema = {
    "name": "google_drive_search",
    "description": "Busca ou lista arquivos no Google Drive usando uma query string (q). Se a query for omitida, lista arquivos recentes.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Query de busca (e.g., \"name contains 'relatorio'\"). Deixe vazio para arquivos recentes."
            },
            "limit": {
                "type": "integer",
                "description": "Número máximo de arquivos a retornar. Default 10."
            }
        }
    }
}

upload_schema = {
    "name": "google_drive_upload",
    "description": "Faz upload de um arquivo local para o Google Drive.",
    "parameters": {
        "type": "object",
        "properties": {
            "local_path": {
                "type": "string",
                "description": "Caminho absoluto do arquivo local para fazer upload."
            },
            "mimetype": {
                "type": "string",
                "description": "MIME type do arquivo (e.g., text/plain, application/pdf). Opcional."
            }
        },
        "required": ["local_path"]
    }
}
