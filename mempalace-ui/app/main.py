import os
import subprocess
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Pathing fix for Docker container
templates = Jinja2Templates(directory="templates")

# Use the environment variable or fallback to the standard path
MEMPALACE_PATH = os.getenv("MEMPALACE_PATH", "/home/tinkeshwar/.mempalace")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/view", response_class=HTMLResponse)
async def view_data(request: Request, query: str = ""):
    search_query = query if query else "."
    
    cmd = [
        "uv", "run", "--with", "mempalace", 
        "mempalace", "search", search_query
    ]
    
    env = os.environ.copy()
    env["MEMPALACE_PATH"] = MEMPALACE_PATH
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env)
        data = result.stdout if result.stdout else "No records found."
    except Exception as e:
        data = f"Error fetching data: {str(e)}"

    return templates.TemplateResponse(
        request=request, 
        name="view.html", 
        context={"data": data, "query": query}
    )

@app.post("/add-rule")
async def add_rule(
    rule: str = Form(...),
    wing: str = Form("school-admin"),
    room: str = Form("architecture"),
    hall: str = Form("advice"),  # Added back
    dry_run: str = Form(None)
):
    safe_rule = rule.replace("'", "'\\''")
    temp_file = f"/tmp/rule_input.txt"
    
    # The shell script logic:
    # 1. Write rule to temp file
    # 2. Mine the file into the palace
    # 3. Cleanup
    shell_script = (
        f"echo '{safe_rule}' > {temp_file} && "
        f"uv run --with mempalace mempalace mine {temp_file} "
        f"--wing {wing} --room {room} --hall {hall} && " # Added --hall flag
        f"rm {temp_file}"
    )
    
    full_command = ["bash", "-c", shell_script]

    if dry_run == "true":
        return {"status": "Dry Run", "command_preview": shell_script}

    try:
        env = os.environ.copy()
        env["MEMPALACE_PATH"] = MEMPALACE_PATH
        
        # Execute the shell pipeline
        result = subprocess.run(full_command, capture_output=True, text=True, env=env)
        
        if result.returncode != 0:
            return {"status": "Error", "message": result.stderr or result.stdout}
            
        return RedirectResponse(url="/view", status_code=303)
        
    except Exception as e:
        return {"status": "Critical Error", "message": str(e)}