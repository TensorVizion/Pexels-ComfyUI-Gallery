from .pexels_node import PexelsImageSearch
import server
from aiohttp import web
import aiohttp
import os
import folder_paths

# 1. Register the JavaScript folder
WEB_DIRECTORY = "./web"

NODE_CLASS_MAPPINGS = {
    "PexelsImageSearch": PexelsImageSearch
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "PexelsImageSearch": "Pexels Image Gallery 📷"
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']

# 2. Existing search endpoint
@server.PromptServer.instance.routes.get("/pexels/search")
async def pexels_search(request):
    query = request.rel_url.query.get("query", "")
    api_key = request.rel_url.query.get("api_key", os.environ.get("PEXELS_API_KEY", ""))
    
    if not api_key:
        return web.json_response({"error": "No API key provided"}, status=400)
        
    headers = {"Authorization": api_key}
    params = {"query": query, "per_page": 30}
    
    async with aiohttp.ClientSession() as session:
        async with session.get("https://api.pexels.com/v1/search", headers=headers, params=params) as resp:
            if resp.status != 200:
                return web.json_response({"error": "Pexels API error"}, status=resp.status)
            data = await resp.json()
            return web.json_response(data)

# 3. New endpoint to save a dropped image locally
@server.PromptServer.instance.routes.post("/pexels/save_image")
async def pexels_save_image(request):
    try:
        data = await request.json()
        url = data.get("url", "")
        if not url:
            return web.json_response({"error": "No URL provided"}, status=400)

        # Use aiohttp to download the image asynchronously
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return web.json_response({"error": f"Failed to download image from {url}"}, status=resp.status)
                image_content = await resp.read()

        # Determine the input folder and create a unique filename
        input_dir = folder_paths.get_input_directory()
        # Use a hash of the URL to generate a unique filename for saving
        filename = f"pexels_{hash(url)}_{os.path.basename(url)}"
        filepath = os.path.join(input_dir, filename)

        # Save the file.
        with open(filepath, "wb") as f:
            f.write(image_content)

        # Return the new filename, which JS will use to update the Load Image node
        return web.json_response({"filename": filename})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)