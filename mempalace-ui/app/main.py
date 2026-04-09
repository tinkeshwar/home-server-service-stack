from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import subprocess
import os
import json

app = FastAPI()
templates = Jinja2Templates(directory="templates")

MEMPALACE_PATH = os.getenv("MEMPALACE_PATH", "/home/tinkeshwar/.mempalace")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(
    request=request, 
    name="index.html", 
    context={"request": request}
)

@app.get("/view", response_class=HTMLResponse)
async def view_data(request: Request, query: str = ""):
    # Use 'search' to get all data if no query, or specific data if provided
    search_query = query if query else "." # Search for everything
    
    cmd = [
        "uv", "run", "--with", "mempalace", 
        "mempalace", "search", search_query
    ]
    
    env = os.environ.copy()
    env["MEMPALACE_PATH"] = MEMPALACE_PATH
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env)
        # MemPalace search output can be text-heavy; we pass it to the template
        data = result.stdout if result.stdout else "No records found."
    except Exception as e:
        data = f"Error fetching data: {str(e)}"

    return templates.TemplateResponse(
        request=request, 
        name="view.html", 
        context={"request": request, "data": data, "query": query}
    )

@app.post("/add-rule")
async def add_rule(
    rule: str = Form(...),
    wing: str = Form("school-admin"),
    room: str = Form("architecture"),
    hall: str = Form("advice"),
    dry_run: str = Form(None)
):
    # Use the correct internal API call: file_entity
    # We also pass the content as a dictionary-like structure
    safe_rule = rule.replace("'", "\\'")
    
    # Updated Python command string
    remote_cmd = (
        f"import mempalace; "
        f"mempalace.file_entity("
        f"text='{safe_rule}', "
        f"wing='{wing}', "
        f"room='{room}', "
        f"hall='{hall}')"
    )
    
    full_command = ["uv", "run", "--with", "mempalace", "python", "-c", remote_cmd]

    if dry_run == "true":
        return {"status": "Dry Run", "command": " ".join(full_command)}

    try:
        env = os.environ.copy()
        env["MEMPALACE_PATH"] = MEMPALACE_PATH
        result = subprocess.run(full_command, capture_output=True, text=True, env=env)
        
        if result.returncode != 0:
            # This will show us the traceback if 'file_entity' is also wrong
            return {"status": "Error", "message": result.stderr}
            
        return RedirectResponse(url="/view", status_code=303)
    except Exception as e:
        return {"status": "Critical Error", "message": str(e)}