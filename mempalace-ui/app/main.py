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
    dry_run: str = Form(None) # Checkboxes send "true" or nothing
):
    # 1. Prepare the command
    safe_rule = rule.replace("'", "\\'")
    remote_cmd = f"import mempalace; mempalace.add_memory(text='{safe_rule}', wing='{wing}', room='{room}', hall='{hall}')"
    
    # Use full path to uv if possible, or just 'uv'
    full_command = ["uv", "run", "--with", "mempalace", "python", "-c", remote_cmd]

    # 2. If it's a dry run, DON'T execute. Just return the info.
    if dry_run == "true":
        return {
            "status": "Dry Run", 
            "command_preview": " ".join(full_command),
            "data": {"rule": rule, "wing": wing, "room": room, "hall": hall}
        }

    # 3. Actual Execution
    try:
        env = os.environ.copy()
        # Ensure the path is absolute for the container
        env["MEMPALACE_PATH"] = MEMPALACE_PATH
        
        # Run with capture_output to prevent logs from crashing the stream
        result = subprocess.run(full_command, capture_output=True, text=True, env=env)
        
        if result.returncode != 0:
            return {"status": "Error", "message": result.stderr}
            
        return RedirectResponse(url="/view", status_code=303)
        
    except Exception as e:
        return {"status": "Critical Error", "message": str(e)}