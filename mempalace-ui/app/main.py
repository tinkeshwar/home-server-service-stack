from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import subprocess
import os
import json

app = FastAPI()
templates = Jinja2Templates(directory="app/templates")

MEMPALACE_PATH = os.getenv("MEMPALACE_PATH", "/home/tinkeshwar/.mempalace")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

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

    return templates.TemplateResponse("view.html", {"request": request, "data": data, "query": query})

@app.post("/add-rule")
async def add_rule(
    rule: str = Form(...),
    wing: str = Form("school-admin"),
    room: str = Form("architecture"),
    hall: str = Form("advice")
):
    remote_cmd = f"import mempalace; mempalace.add_memory(text='{rule}', wing='{wing}', room='{room}', hall='{hall}')"
    full_command = ["uv", "run", "--with", "mempalace", "python", "-c", remote_cmd]
    
    env = os.environ.copy()
    env["MEMPALACE_PATH"] = MEMPALACE_PATH
    subprocess.run(full_command, check=True, env=env)
    
    return RedirectResponse(url="/view", status_code=303)