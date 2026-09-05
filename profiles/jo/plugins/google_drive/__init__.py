from .schemas import search_schema, upload_schema
from .tools import handle_search, handle_upload

def register(ctx):
    ctx.tools.register("google_drive_search", search_schema, handle_search)
    ctx.tools.register("google_drive_upload", upload_schema, handle_upload)
