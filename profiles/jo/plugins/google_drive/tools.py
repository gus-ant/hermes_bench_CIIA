import os
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ['https://www.googleapis.com/auth/drive']

def get_drive_service():
    try:
        import google.auth
        # Usaremos Application Default Credentials para simplificar
        # O usuário pode logar com 'gcloud auth application-default login'
        # ou setar GOOGLE_APPLICATION_CREDENTIALS
        credentials, project = google.auth.default(scopes=SCOPES)
        service = build('drive', 'v3', credentials=credentials)
        return service
    except Exception as e:
        raise RuntimeError(f"Erro ao autenticar com o Google Drive: {e}")

def handle_search(params, **kwargs):
    query = params.get("query", "")
    limit = params.get("limit", 10)
    
    try:
        service = get_drive_service()
        results = service.files().list(
            q=query if query else None,
            pageSize=limit,
            fields="nextPageToken, files(id, name, mimeType)"
        ).execute()
        items = results.get('files', [])
        
        if not items:
            return "Nenhum arquivo encontrado no Google Drive."
        
        output = ["Arquivos encontrados:"]
        for item in items:
            output.append(f"- {item['name']} (ID: {item['id']}) [{item['mimeType']}]")
        
        return "\\n".join(output)
    except Exception as e:
        return f"Erro ao buscar arquivos no Drive: {e}"

def handle_upload(params, **kwargs):
    local_path = params.get("local_path")
    mime_type = params.get("mimetype", "application/octet-stream")
    
    if not os.path.exists(local_path):
        return f"Erro: O arquivo local {local_path} não existe."
    
    try:
        service = get_drive_service()
        file_metadata = {'name': os.path.basename(local_path)}
        media = MediaFileUpload(local_path, mimetype=mime_type)
        
        file = service.files().create(body=file_metadata,
                                      media_body=media,
                                      fields='id, name').execute()
        
        return f"Upload bem sucedido! Arquivo '{file.get('name')}' salvo com ID: {file.get('id')}"
    except Exception as e:
        return f"Erro ao fazer upload para o Drive: {e}"
