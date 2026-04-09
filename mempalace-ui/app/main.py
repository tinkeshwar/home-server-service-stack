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
    dry_run: str = Form(None)
):
    safe_rule = rule.replace("'", "'\\''")
    room_dir = f"/tmp/{room}"
    temp_file = f"{room_dir}/rule_standard.txt"
    
    # 1. Create the room directory
    # 2. Init the directory so it has a mempalace.yaml (satisfies the error)
    # 3. Write the rule file
    # 4. Mine the folder into the wing
    # 5. Cleanup
    shell_script = (
        f"mkdir -p {room_dir} && "
        f"uv run --with mempalace mempalace init {room_dir} --yes && "
        f"echo '{safe_rule}' > {temp_file} && "
        f"uv run --with mempalace mempalace mine {room_dir} --wing {wing} && "
        f"rm -rf {room_dir}"
    )
    
    full_command = ["bash", "-c", shell_script]

    if dry_run == "true":
        return {"status": "Dry Run", "command_preview": shell_script}

    try:
        env = os.environ.copy()
        env["MEMPALACE_PATH"] = MEMPALACE_PATH
        # We use a longer timeout because init + mine can take a few seconds
        result = subprocess.run(full_command, capture_output=True, text=True, env=env, timeout=30)
        
        if result.returncode != 0:
            return {"status": "Error", "message": result.stderr or result.stdout}
            
        return RedirectResponse(url="/view", status_code=303)
    except Exception as e:
        return {"status": "Critical Error", "message": str(e)}